import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { mergeTreLag } from "../../src/lib/ai-overlay.ts";
import {
  fagordHistorikk,
  horingTilHendelse,
  type FagordObservert,
  type Hendelse,
} from "../../src/lib/hendelser.ts";
import { lesHendelser, lesKilder, skrivHendelse } from "./db.ts";
import {
  krevFag,
  krevFagordIFag,
  krevMaalITema,
  krevProveniens,
  krevSporsmalOgSvar,
  krevTemaIFag,
} from "../../src/lib/fag-validering.ts";
import { nyId } from "../../src/lib/format.ts";
import { byggSkillKatalog, hentSkillsFraUrl, parseSkillMarkdown } from "../../src/lib/skill-import.ts";
import { erTillattSkillFil, normaliserSkillSti, parseSkillPack, skillGjelderFag } from "../../src/lib/skill-pack.ts";
import type {
  AiInnsats,
  AiOverlay,
  AiProveniens,
  AppState,
  Fag,
  FagId,
  Fagord,
  FagordStatus,
  Horing,
  Karakter,
  Kompetansemaal,
  Prompt,
  PromptKatalogRad,
  Skill,
  SkillKatalogRad,
  SkillReference,
  Tema,
} from "../../src/lib/types.ts";

const her = path.dirname(fileURLToPath(import.meta.url));

export function repoRot(): string {
  return path.resolve(her, "../..");
}

function dataFil(...deler: string[]): string {
  return path.join(repoRot(), "src", "data", ...deler);
}

function lesJson<T>(fil: string): T {
  return JSON.parse(fs.readFileSync(fil, "utf8")) as T;
}

export function atomicWrite(fil: string, innhold: string): void {
  const tmp = `${fil}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, innhold, "utf8");
  fs.renameSync(tmp, fil);
}

export function lesAiOverlay(): AiOverlay {
  const fil = dataFil("ai-overlay.json");
  if (!fs.existsSync(fil)) return { horinger: [], fagord: [], hendelser: [] };
  return lesJson<AiOverlay>(fil);
}

export function skrivAiOverlay(overlay: AiOverlay): void {
  atomicWrite(dataFil("ai-overlay.json"), `${JSON.stringify(overlay, null, 2)}\n`);
}

export function lesUdirMeta(): {
  hentet?: string;
  status?: string;
  feilmelding?: string | null;
  kilde?: string;
} {
  const fil = dataFil("udir-meta.json");
  if (!fs.existsSync(fil)) return { status: "cache" };
  return lesJson(fil);
}

function skillTilMarkdown(p: Prompt): string {
  const desc = JSON.stringify(p.beskrivelse);
  const navn = JSON.stringify(p.navn);
  return `---\nname: ${navn}\ndescription: ${desc}\n---\n\n${p.innhold.trim()}\n`;
}

function lesPromptKatalog(): Prompt[] {
  const indexFil = dataFil("prompts", "index.json");
  if (!fs.existsSync(indexFil)) return [];
  const index = lesJson<{ prompts: PromptKatalogRad[] }>(indexFil);
  return (index.prompts ?? []).map((rad) => {
    const fil = dataFil("prompts", rad.fil);
    const raw = fs.existsSync(fil) ? fs.readFileSync(fil, "utf8") : "";
    const parset = raw ? parseSkillMarkdown(raw, rad.navn) : null;
    return {
      id: rad.id,
      navn: rad.navn,
      beskrivelse: rad.beskrivelse,
      innhold: parset?.innhold ?? "",
      kilde: rad.kilde,
      kildeUrl: rad.kildeUrl,
      importert: rad.importert,
      fagIds: rad.fagIds,
    };
  });
}

export function lesSkillsFraDisk(): Skill[] {
  const indexFil = dataFil("skills", "index.json");
  if (!fs.existsSync(indexFil)) return [];
  const index = lesJson<{ skills: SkillKatalogRad[] }>(indexFil);
  return (index.skills ?? []).map((rad) => {
    const fil = dataFil("skills", rad.fil);
    const raw = fs.existsSync(fil) ? fs.readFileSync(fil, "utf8") : "";
    const parset = raw ? parseSkillMarkdown(raw, rad.navn) : null;
    const referanser: SkillReference[] = (rad.referanser ?? []).map((ref) => {
      const refFil = dataFil("skills", ref.sti);
      return {
        id: ref.id,
        navn: ref.navn,
        sti: ref.sti,
        markdown: fs.existsSync(refFil) ? fs.readFileSync(refFil, "utf8") : "",
      };
    });
    return {
      id: rad.id,
      navn: rad.navn,
      beskrivelse: rad.beskrivelse,
      markdown: parset?.innhold ?? "",
      kilde: rad.kilde,
      kildeUrl: rad.kildeUrl,
      importert: rad.importert,
      fagIds: (rad.fagIds ?? []) as FagId[],
      referanser,
      kategori: rad.kategori ?? "plattform",
    };
  });
}

export function lesPrompterFraDisk(): Prompt[] {
  const fraSkills = lesSkillsFraDisk().map((s) => ({
    id: s.id,
    navn: s.navn,
    beskrivelse: s.beskrivelse,
    innhold: s.markdown,
    kilde: s.kilde,
    kildeUrl: s.kildeUrl,
    importert: s.importert,
    fagIds: s.fagIds,
  }));
  const fraPrompts = lesPromptKatalog();
  const sett = new Map<string, Prompt>();
  for (const p of [...fraSkills, ...fraPrompts]) sett.set(p.id, p);
  return [...sett.values()];
}

export function skillKatalogForOrigin(origin: string) {
  const prompts = lesPrompterFraDisk();
  return byggSkillKatalog(
    origin,
    prompts.map((p) => ({ id: p.id, navn: p.navn, beskrivelse: p.beskrivelse })),
  );
}

export function pluginManifestForOrigin(origin: string) {
  const base = origin.replace(/\/+$/, "");
  return {
    name: "mfl-ovingsapp",
    description: "Øvingsapp for markedsføring, entreprenørskap og norsk. Skills ligger under /skills.",
    version: "0.2.0",
    skills: "./skills",
    skillsIndex: `${base}/skills`,
  };
}

export function lesSkillMarkdown(id: string): string | null {
  if (!/^[a-z0-9][a-z0-9-]*$/.test(id)) return null;
  const skillFil = dataFil("skills", id, "SKILL.md");
  if (fs.existsSync(skillFil)) return fs.readFileSync(skillFil, "utf8");
  const promptFil = dataFil("prompts", id, "SKILL.md");
  if (fs.existsSync(promptFil)) return fs.readFileSync(promptFil, "utf8");
  return null;
}

export function lesSkillReferenceMarkdown(skillId: string, referenceId: string): string | null {
  if (!/^[a-z0-9][a-z0-9-]*$/.test(skillId) || !/^[a-z0-9][a-z0-9-]*$/.test(referenceId)) {
    return null;
  }
  const skill = lesSkillsFraDisk().find((s) => s.id === skillId);
  const ref = skill?.referanser.find((r) => r.id === referenceId);
  return ref?.markdown ?? null;
}

export function lesBaseState(): AppState {
  return {
    fag: lesJson<Fag[]>(dataFil("fag.json")),
    kompetansemaal: lesJson<Kompetansemaal[]>(dataFil("kompetansemaal.json")),
    temaer: lesJson<Tema[]>(dataFil("temaer.json")),
    horinger: lesJson<Horing[]>(dataFil("horinger.json")),
    fagord: lesJson<Fagord[]>(dataFil("fagord.json")),
    hendelser: [],
    koblinger: [],
    kilder: [],
    prompts: lesPrompterFraDisk(),
    skills: lesSkillsFraDisk(),
    innstillinger: { aktivtFag: "male1", visEmoji: true },
  };
}

/**
 * Databasen er sannheten for alt som skjer. JSON-filene i src/data er
 * utgangspunktet: læreplan, temaer og begrepsdefinisjoner.
 */
export async function lastMcpState(): Promise<AppState> {
  const [hendelser, kilder] = await Promise.all([lesHendelser(), lesKilder()]);
  return mergeTreLag(lesBaseState(), null, {
    prompts: lesPrompterFraDisk(),
    hendelser,
    kilder,
  });
}

export function byggProveniens(
  modell: string,
  innsats: AiInnsats,
  promptId: string,
  prompts: Prompt[],
): AiProveniens {
  krevProveniens({ modell, innsats, promptId });
  const prompt = prompts.find((p) => p.id === promptId);
  if (!prompt) {
    throw new Error(`Ukjent promptId: ${promptId}`);
  }
  return {
    modell: modell.trim(),
    innsats,
    promptId,
    promptNavn: prompt.navn,
  };
}

export async function loggHoring(input: {
  fagId: string;
  temaId: string;
  karakter: Karakter;
  riktig: string;
  mangler: string;
  sporsmal: string;
  svar: string;
  modellsvar?: string;
  maalIds?: string[];
  dato?: string;
  modell: string;
  innsats: AiInnsats;
  promptId: string;
}): Promise<Horing> {
  const state = await lastMcpState();
  const fag = krevFag(state, input.fagId);
  krevTemaIFag(state, fag.id, input.temaId);
  krevSporsmalOgSvar(input);
  const maalIds = krevMaalITema(state, fag.id, input.temaId, input.maalIds);
  const ai = byggProveniens(input.modell, input.innsats, input.promptId, state.prompts);
  const horing: Horing = {
    id: nyId("h-ai"),
    temaId: input.temaId,
    dato: input.dato ?? new Date().toISOString().slice(0, 10),
    karakter: input.karakter,
    riktig: input.riktig,
    mangler: input.mangler,
    sporsmal: input.sporsmal.trim(),
    svar: input.svar.trim(),
    ...(input.modellsvar?.trim() ? { modellsvar: input.modellsvar.trim() } : {}),
    ...(maalIds.length > 0 ? { maalIds } : {}),
    kilde: "ai",
    ai,
  };
  await skrivHendelse(horingTilHendelse(horing, fag.id));
  return horing;
}

export async function oppdaterFagord(input: {
  fagId: string;
  id: string;
  status: FagordStatus;
  sisteFeil?: string;
  modell: string;
  innsats: AiInnsats;
  promptId: string;
}): Promise<Fagord> {
  const state = await lastMcpState();
  const fag = krevFag(state, input.fagId);
  const eksisterende = krevFagordIFag(state, fag.id, input.id);
  const ai = byggProveniens(input.modell, input.innsats, input.promptId, state.prompts);
  const observasjon: FagordObservert = {
    id: nyId("fo-obs"),
    type: "fagord-observert",
    tid: new Date().toISOString(),
    fagId: fag.id,
    kilde: "ai",
    ai,
    fagordId: input.id,
    status: input.status,
    ...(input.sisteFeil?.trim() ? { sisteFeil: input.sisteFeil.trim() } : {}),
  };
  await skrivHendelse(observasjon);
  return {
    ...eksisterende,
    status: observasjon.status,
    sisteFeil: observasjon.sisteFeil ?? eksisterende.sisteFeil,
    ai,
  };
}

/** Alle observasjoner på ett fagord, nyeste først. */
export async function lesFagordHistorikk(fagordId: string): Promise<FagordObservert[]> {
  return fagordHistorikk(await lesHendelser(), fagordId);
}

/** Hendelser inn utenfra, for eksempel fra UI eller en importert eksportfil. */
export async function skrivHendelserFraKlient(hendelser: Hendelse[]): Promise<Hendelse[]> {
  const ut: Hendelse[] = [];
  for (const h of hendelser) ut.push(await skrivHendelse(h));
  return ut;
}

export async function importerPromptFraUrl(url: string): Promise<Prompt[]> {
  const hentet = await hentSkillsFraUrl(url);
  const indexFil = dataFil("prompts", "index.json");
  const index = fs.existsSync(indexFil)
    ? lesJson<{ prompts: PromptKatalogRad[] }>(indexFil)
    : { prompts: [] };
  const brukt = new Set(index.prompts.map((p) => p.id));

  for (const p of hentet) {
    if (brukt.has(p.id)) continue;
    brukt.add(p.id);
    const mappe = dataFil("prompts", p.id);
    fs.mkdirSync(mappe, { recursive: true });
    fs.writeFileSync(path.join(mappe, "SKILL.md"), skillTilMarkdown(p), "utf8");
    index.prompts.push({
      id: p.id,
      fil: `${p.id}/SKILL.md`,
      navn: p.navn,
      beskrivelse: p.beskrivelse,
      kilde: p.kilde,
      kildeUrl: p.kildeUrl,
      importert: p.importert,
    });
  }
  atomicWrite(indexFil, `${JSON.stringify(index, null, 2)}\n`);
  return lesPrompterFraDisk();
}

export function pakkUtSkillZip(buffer: Buffer): { path: string; text: string }[] {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "mfl-skill-"));
  const zipFil = path.join(tmp, "pack.skill");
  fs.writeFileSync(zipFil, buffer);
  try {
    execFileSync("unzip", ["-qq", "-o", zipFil, "-d", tmp], { stdio: "pipe" });
  } catch {
    throw new Error("Kunne ikke åpne .skill-pakken. Den må være en zip med SKILL.md.");
  }
  const ut: { path: string; text: string }[] = [];
  function walk(dir: string, rel: string): void {
    for (const navn of fs.readdirSync(dir)) {
      const abs = path.join(dir, navn);
      const nesteRel = rel ? `${rel}/${navn}` : navn;
      if (nesteRel.includes("..")) continue;
      const st = fs.statSync(abs);
      if (st.isDirectory()) {
        if (navn === "scripts" || navn === "script" || navn === "bin") continue;
        walk(abs, nesteRel);
        continue;
      }
      if (abs === zipFil) continue;
      const norm = normaliserSkillSti(nesteRel);
      if (!erTillattSkillFil(norm)) continue;
      ut.push({ path: norm, text: fs.readFileSync(abs, "utf8") });
    }
  }
  walk(tmp, "");
  fs.rmSync(tmp, { recursive: true, force: true });
  return ut;
}

export function importerSkillPackFiler(
  filer: { path: string; text: string }[],
  kildeUrl = "fil",
): Skill[] {
  const parsed = parseSkillPack(filer, {
    kilde: "plattform",
    kildeUrl,
    kategori: "fag",
  });
  const indexFil = dataFil("skills", "index.json");
  const index = fs.existsSync(indexFil)
    ? lesJson<{ skills: SkillKatalogRad[] }>(indexFil)
    : { skills: [] };
  const brukt = new Set(index.skills.map((s) => s.id));

  for (const skill of parsed) {
    if (brukt.has(skill.id)) continue;
    brukt.add(skill.id);
    const mappe = dataFil("skills", skill.id);
    fs.mkdirSync(path.join(mappe, "references"), { recursive: true });
    const md = `---\nname: ${JSON.stringify(skill.navn)}\ndescription: ${JSON.stringify(skill.beskrivelse)}\n---\n\n${skill.markdown.trim()}\n`;
    fs.writeFileSync(path.join(mappe, "SKILL.md"), md, "utf8");
    const referanser = skill.referanser.map((ref) => {
      const filnavn = `${ref.id}.md`;
      fs.writeFileSync(path.join(mappe, "references", filnavn), ref.markdown, "utf8");
      return { id: ref.id, navn: ref.navn, sti: `${skill.id}/references/${filnavn}` };
    });
    index.skills.push({
      id: skill.id,
      fil: `${skill.id}/SKILL.md`,
      navn: skill.navn,
      beskrivelse: skill.beskrivelse,
      kilde: "plattform",
      kildeUrl,
      importert: skill.importert,
      fagIds: skill.fagIds,
      kategori: skill.kategori,
      referanser,
    });
  }
  atomicWrite(indexFil, `${JSON.stringify(index, null, 2)}\n`);
  return lesSkillsFraDisk();
}

export { skillGjelderFag };
