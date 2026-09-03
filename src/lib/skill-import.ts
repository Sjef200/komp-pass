import type { Prompt, PromptKilde } from "./types";

const GITHUB_VERTER = new Set([
  "github.com",
  "www.github.com",
  "raw.githubusercontent.com",
  "gist.github.com",
  "gist.githubusercontent.com",
  "api.github.com",
]);

export type ParsertSkill = {
  navn: string;
  beskrivelse: string;
  innhold: string;
  id: string;
};

export type ImportertPrompt = Prompt & { fil: string };

export type SkillKatalogSkill = {
  id: string;
  name: string;
  description: string;
  path: string;
  url: string;
};

export type SkillKatalog = {
  name: string;
  description: string;
  plugin: string;
  skills: SkillKatalogSkill[];
};

export function slugify(tekst: string): string {
  const s = tekst
    .toLowerCase()
    .replace(/[æ]/g, "ae")
    .replace(/[ø]/g, "o")
    .replace(/[å]/g, "a")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return s || "prompt";
}

export function parseSkillMarkdown(
  markdown: string,
  fallbackNavn: string,
): ParsertSkill {
  const trimmed = markdown.replace(/^\uFEFF/, "");
  let navn = fallbackNavn;
  let beskrivelse = "";
  let body = trimmed;

  const fm = trimmed.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (fm) {
    const yaml = fm[1] ?? "";
    body = (fm[2] ?? "").trim();
    const nameMatch = yaml.match(/^name:\s*["']?(.+?)["']?\s*$/m);
    const descMatch = yaml.match(/^description:\s*["']?(.+?)["']?\s*$/m);
    if (nameMatch?.[1]) navn = nameMatch[1].trim();
    if (descMatch?.[1]) beskrivelse = descMatch[1].trim();
  }

  if (navn === fallbackNavn) {
    const heading = body.match(/^#\s+(.+)$/m);
    if (heading?.[1]) navn = heading[1].trim();
  }

  if (!beskrivelse) {
    const avsnitt = body
      .split(/\n\s*\n/)
      .map((p) => p.replace(/^#+\s+/, "").replace(/\n/g, " ").trim())
      .find((p) => p.length > 0);
    beskrivelse = (avsnitt ?? "").slice(0, 220);
  }

  return {
    navn,
    beskrivelse,
    innhold: body.trim() || trimmed.trim(),
    id: slugify(navn),
  };
}

export function erTillattGithubUrl(url: string): boolean {
  try {
    const u = new URL(url);
    if (u.protocol !== "https:") return false;
    return GITHUB_VERTER.has(u.hostname);
  } catch {
    return false;
  }
}

function erLoopback(hostname: string): boolean {
  const h = hostname.replace(/^\[|\]$/g, "").toLowerCase();
  return h === "localhost" || h === "127.0.0.1" || h === "::1" || h === "0.0.0.0";
}

export function erTillattPlattformUrl(url: string): boolean {
  try {
    const u = new URL(url);
    if (u.protocol === "https:") return u.hostname !== "169.254.169.254";
    if (u.protocol === "http:") return erLoopback(u.hostname);
    return false;
  } catch {
    return false;
  }
}

/** Gjør om en plattform-URL til .../skills, med mindre det allerede er en SKILL.md. */
export function skillsIndeksUrl(raw: string): string {
  const u = new URL(raw);
  const pathname = u.pathname.replace(/\/+$/, "") || "";
  if (pathname.toLowerCase().endsWith("skill.md")) return u.toString();
  if (pathname.toLowerCase().endsWith("/skills") || pathname.toLowerCase() === "/skills") {
    return `${u.origin}${pathname || "/skills"}`;
  }
  if (!pathname || pathname === "/") return `${u.origin}/skills`;
  return `${u.origin}${pathname}/skills`;
}

export function byggSkillKatalog(
  origin: string,
  skills: Array<{ id: string; navn: string; beskrivelse: string }>,
): SkillKatalog {
  const base = origin.replace(/\/+$/, "");
  return {
    name: "mfl-ovingsapp",
    description: "Prompter og ferdigheter for markedsføring og ledelse",
    plugin: `${base}/plugin.json`,
    skills: skills.map((s) => ({
      id: s.id,
      name: s.navn,
      description: s.beskrivelse,
      path: `/skills/${s.id}/SKILL.md`,
      url: `${base}/skills/${s.id}/SKILL.md`,
    })),
  };
}

type GithubFil = { path: string; text: string };

export type FetchFn = (url: string, init?: RequestInit) => Promise<Response>;

function rawUrl(eier: string, repo: string, ref: string, sti: string): string {
  const ren = sti.replace(/^\/+/, "");
  return `https://raw.githubusercontent.com/${eier}/${repo}/${ref}/${ren}`;
}

function parseGithubSti(url: URL): {
  eier: string;
  repo: string;
  kind: "blob" | "tree" | "repo" | "raw" | "gist";
  ref?: string;
  sti?: string;
} | null {
  const host = url.hostname;
  const deler = url.pathname.split("/").filter(Boolean);

  if (host === "raw.githubusercontent.com") {
    const [eier, repo, ref, ...rest] = deler;
    if (!eier || !repo || !ref) return null;
    return { eier, repo, kind: "raw", ref, sti: rest.join("/") };
  }

  if (host === "gist.github.com" || host === "gist.githubusercontent.com") {
    return { eier: deler[0] ?? "", repo: deler[1] ?? "", kind: "gist" };
  }

  if (host === "github.com" || host === "www.github.com") {
    const eier = deler[0];
    const repo = deler[1];
    if (!eier || !repo) return null;
    if (deler[2] === "blob" && deler[3]) {
      return {
        eier,
        repo,
        kind: "blob",
        ref: deler[3],
        sti: deler.slice(4).join("/"),
      };
    }
    if (deler[2] === "tree" && deler[3]) {
      return {
        eier,
        repo,
        kind: "tree",
        ref: deler[3],
        sti: deler.slice(4).join("/"),
      };
    }
    if (!deler[2] || deler[2] === "") {
      return { eier, repo, kind: "repo" };
    }
  }

  return null;
}

async function lesTekst(fetchFn: FetchFn, url: string): Promise<string> {
  const res = await fetchFn(url, {
    headers: { Accept: "application/vnd.github.raw, text/plain; q=0.9, */*; q=0.1" },
  });
  if (res.status === 403 || res.status === 404) {
    throw new Error("Kunne ikke hente (privat repo eller rate limit).");
  }
  if (!res.ok) {
    throw new Error(`Kunne ikke hente filen (${res.status}).`);
  }
  return res.text();
}

type GhContent = {
  name: string;
  path: string;
  type: "file" | "dir";
  download_url?: string | null;
};

async function apiContents(
  fetchFn: FetchFn,
  eier: string,
  repo: string,
  sti: string,
  ref?: string,
): Promise<GhContent[] | GhContent> {
  const q = ref ? `?ref=${encodeURIComponent(ref)}` : "";
  const url = `https://api.github.com/repos/${eier}/${repo}/contents/${sti}${q}`;
  const res = await fetchFn(url, {
    headers: { Accept: "application/vnd.github+json" },
  });
  if (res.status === 403 || res.status === 404) {
    throw new Error("Kunne ikke hente (privat repo eller rate limit).");
  }
  if (!res.ok) throw new Error(`GitHub API ${res.status}`);
  return res.json() as Promise<GhContent[] | GhContent>;
}

async function hentFilerFraTre(
  fetchFn: FetchFn,
  eier: string,
  repo: string,
  ref: string | undefined,
  sti: string,
): Promise<GithubFil[]> {
  const listing = await apiContents(fetchFn, eier, repo, sti, ref);
  const entries = Array.isArray(listing) ? listing : [listing];
  const plugin = entries.find((e) => e.name === ".claude-plugin" && e.type === "dir");
  const skillsDir = entries.find((e) => e.name === "skills" && e.type === "dir");
  const skillMd = entries.find(
    (e) => e.name.toLowerCase() === "skill.md" && e.type === "file",
  );

  const filer: GithubFil[] = [];

  async function lastMd(path: string): Promise<void> {
    const data = await apiContents(fetchFn, eier, repo, path, ref);
    const file = Array.isArray(data) ? data[0] : data;
    const url =
      file && "download_url" in file && file.download_url
        ? file.download_url
        : rawUrl(eier, repo, ref ?? "HEAD", path);
    const text = await lesTekst(fetchFn, url);
    filer.push({ path, text });
  }

  if (plugin) {
    const pluginListing = await apiContents(
      fetchFn,
      eier,
      repo,
      `${sti ? `${sti}/` : ""}.claude-plugin`,
      ref,
    );
    const pluginFiles = Array.isArray(pluginListing) ? pluginListing : [pluginListing];
    const manifest = pluginFiles.find((f) => f.name === "plugin.json");
    let skillStier: string[] = [];
    if (manifest?.download_url) {
      try {
        const json = JSON.parse(await lesTekst(fetchFn, manifest.download_url)) as {
          skills?: string[];
        };
        skillStier = json.skills ?? [];
      } catch {
        skillStier = [];
      }
    }
    if (skillStier.length === 0 && skillsDir) {
      skillStier = [`${sti ? `${sti}/` : ""}skills`];
    }
    for (const s of skillStier) {
      const full = s.startsWith("/") ? s.slice(1) : sti ? `${sti}/${s}` : s;
      await samleSkillsIMappe(fetchFn, eier, repo, ref, full, filer);
    }
    if (skillMd) await lastMd(skillMd.path);
    return filer;
  }

  if (skillMd) {
    await lastMd(skillMd.path);
    return filer;
  }

  if (skillsDir) {
    await samleSkillsIMappe(
      fetchFn,
      eier,
      repo,
      ref,
      `${sti ? `${sti}/` : ""}skills`,
      filer,
    );
    return filer;
  }

  const md = entries.filter((e) => e.type === "file" && e.name.toLowerCase().endsWith(".md"));
  for (const f of md.slice(0, 20)) {
    await lastMd(f.path);
  }
  return filer;
}

async function samleSkillsIMappe(
  fetchFn: FetchFn,
  eier: string,
  repo: string,
  ref: string | undefined,
  sti: string,
  ut: GithubFil[],
): Promise<void> {
  const listing = await apiContents(fetchFn, eier, repo, sti, ref);
  const entries = Array.isArray(listing) ? listing : [listing];
  const direkte = entries.find(
    (e) => e.name.toLowerCase() === "skill.md" && e.type === "file",
  );
  if (direkte) {
    const url = direkte.download_url ?? rawUrl(eier, repo, ref ?? "HEAD", direkte.path);
    ut.push({ path: direkte.path, text: await lesTekst(fetchFn, url) });
    return;
  }
  for (const e of entries.filter((x) => x.type === "dir")) {
    const inner = await apiContents(fetchFn, eier, repo, e.path, ref);
    const innerFiles = Array.isArray(inner) ? inner : [inner];
    const skill = innerFiles.find(
      (f) => f.name.toLowerCase() === "skill.md" && f.type === "file",
    );
    if (skill) {
      const url = skill.download_url ?? rawUrl(eier, repo, ref ?? "HEAD", skill.path);
      ut.push({ path: skill.path, text: await lesTekst(fetchFn, url) });
    }
  }
}

async function hentGist(fetchFn: FetchFn, url: URL): Promise<GithubFil[]> {
  const deler = url.pathname.split("/").filter(Boolean);
  let api: string;
  if (url.hostname === "gist.githubusercontent.com") {
    const [bruker, id] = deler;
    api = `https://api.github.com/gists/${id ?? bruker}`;
  } else {
    const id = deler.length >= 2 ? deler[1] : deler[0];
    api = `https://api.github.com/gists/${id}`;
  }
  const res = await fetchFn(api, { headers: { Accept: "application/vnd.github+json" } });
  if (!res.ok) throw new Error("Kunne ikke hente (privat repo eller rate limit).");
  const gist = (await res.json()) as {
    files?: Record<string, { filename?: string; content?: string; raw_url?: string }>;
  };
  const filer: GithubFil[] = [];
  for (const f of Object.values(gist.files ?? {})) {
    const navn = f.filename ?? "skill.md";
    if (!navn.toLowerCase().endsWith(".md")) continue;
    const text = f.content ?? (f.raw_url ? await lesTekst(fetchFn, f.raw_url) : "");
    if (text) filer.push({ path: navn, text });
  }
  return filer;
}

export async function hentSkillsFraGithub(
  url: string,
  fetchFn: FetchFn = fetch,
): Promise<ImportertPrompt[]> {
  if (!erTillattGithubUrl(url)) {
    throw new Error("Lenken må peke på GitHub (fil, mappe eller gist).");
  }
  const parsed = new URL(url);
  if (parsed.hostname === "gist.github.com" || parsed.hostname === "gist.githubusercontent.com") {
    const filer = await hentGist(fetchFn, parsed);
    if (filer.length === 0) throw new Error("Fant ingen SKILL.md der.");
    return filerTilPrompts(filer, url, "github");
  }

  const gh = parseGithubSti(parsed);
  if (!gh) throw new Error("Lenken må peke på GitHub (fil, mappe eller gist).");

  if (gh.kind === "raw" || gh.kind === "blob") {
    const sti = gh.sti ?? "";
    const hentUrl =
      gh.kind === "raw"
        ? url
        : rawUrl(gh.eier, gh.repo, gh.ref ?? "HEAD", sti);
    const text = await lesTekst(fetchFn, hentUrl);
    return filerTilPrompts([{ path: sti || "SKILL.md", text }], url, "github");
  }

  const filer = await hentFilerFraTre(fetchFn, gh.eier, gh.repo, gh.ref, gh.sti ?? "");
  if (filer.length === 0) throw new Error("Fant ingen SKILL.md der.");
  return filerTilPrompts(filer, url, "github");
}

export function filerTilPrompts(
  filer: GithubFil[],
  kildeUrl: string,
  kilde: PromptKilde,
): ImportertPrompt[] {
  const brukt = new Set<string>();
  const ut: ImportertPrompt[] = [];
  const iso = new Date().toISOString().slice(0, 10);
  for (const fil of filer) {
    const mappe = fil.path.split("/").slice(-2, -1)[0];
    const fallback = mappe && mappe.toLowerCase() !== "skills" ? mappe : fil.path.split("/").pop()?.replace(/\.md$/i, "") ?? "prompt";
    const parset = parseSkillMarkdown(fil.text, fallback);
    let id = parset.id;
    if (brukt.has(id)) {
      let n = 2;
      while (brukt.has(`${id}-${n}`)) n += 1;
      id = `${id}-${n}`;
    }
    brukt.add(id);
    ut.push({
      id,
      navn: parset.navn,
      beskrivelse: parset.beskrivelse,
      innhold: parset.innhold,
      kilde,
      kildeUrl,
      importert: iso,
      fil: `${id}/SKILL.md`,
    });
  }
  return ut;
}

function skillsFraKatalogJson(data: unknown): SkillKatalogSkill[] {
  if (!data || typeof data !== "object") return [];
  const o = data as Record<string, unknown>;
  const direkte = Array.isArray(o.skills) ? o.skills : [];
  const fraPlugins: unknown[] = [];
  if (Array.isArray(o.plugins)) {
    for (const plugin of o.plugins) {
      if (plugin && typeof plugin === "object" && Array.isArray((plugin as { skills?: unknown }).skills)) {
        fraPlugins.push(...((plugin as { skills: unknown[] }).skills));
      }
    }
  }
  const ut: SkillKatalogSkill[] = [];
  for (const raw of [...direkte, ...fraPlugins]) {
    if (!raw || typeof raw !== "object") continue;
    const s = raw as Record<string, unknown>;
    const id = String(s.id ?? s.name ?? "").trim();
    const url = String(s.url ?? s.path ?? "").trim();
    if (!id || !url) continue;
    ut.push({
      id,
      name: String(s.name ?? s.navn ?? id),
      description: String(s.description ?? s.beskrivelse ?? ""),
      path: String(s.path ?? url),
      url,
    });
  }
  return ut;
}

function absUrl(base: string, maybe: string): string {
  try {
    return new URL(maybe, base).toString();
  } catch {
    return maybe;
  }
}

export async function hentSkillsFraPlattform(
  url: string,
  fetchFn: FetchFn = fetch,
): Promise<ImportertPrompt[]> {
  if (!erTillattPlattformUrl(url)) {
    throw new Error("Lim inn URL-en til plattformen (http på localhost, ellers https).");
  }
  const indeks = skillsIndeksUrl(url);
  const res = await fetchFn(indeks, {
    headers: { Accept: "application/json, text/markdown;q=0.8, text/plain;q=0.5" },
  });
  if (!res.ok) {
    throw new Error("Fant ingen /skills på den URL-en.");
  }
  const ctype = res.headers.get("content-type") ?? "";
  const body = await res.text();

  if (indeks.toLowerCase().endsWith("skill.md") || /markdown|text\/plain/.test(ctype) && !ctype.includes("json")) {
    const looksMd = body.startsWith("---") || body.startsWith("#") || indeks.toLowerCase().endsWith(".md");
    if (looksMd && !body.trim().startsWith("{")) {
      return filerTilPrompts([{ path: "SKILL.md", text: body }], url, "plattform");
    }
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(body);
  } catch {
    throw new Error("Fant ingen /skills på den URL-en.");
  }

  const listed = skillsFraKatalogJson(parsed);
  if (listed.length === 0) {
    throw new Error("Fant ingen SKILL.md der.");
  }

  const filer: GithubFil[] = [];
  for (const skill of listed) {
    const skillUrl = absUrl(indeks, skill.url);
    if (!erTillattPlattformUrl(skillUrl) && !erTillattGithubUrl(skillUrl)) continue;
    const filRes = await fetchFn(skillUrl, {
      headers: { Accept: "text/markdown, text/plain;q=0.9" },
    });
    if (!filRes.ok) continue;
    filer.push({
      path: `${skill.id}/SKILL.md`,
      text: await filRes.text(),
    });
  }
  if (filer.length === 0) throw new Error("Fant ingen SKILL.md der.");
  return filerTilPrompts(filer, url, "plattform");
}

/** Plattform-URL med /skills er hovedveien. GitHub beholdes som reserve. */
export async function hentSkillsFraUrl(
  url: string,
  fetchFn: FetchFn = fetch,
): Promise<ImportertPrompt[]> {
  if (erTillattGithubUrl(url)) return hentSkillsFraGithub(url, fetchFn);
  return hentSkillsFraPlattform(url, fetchFn);
}
