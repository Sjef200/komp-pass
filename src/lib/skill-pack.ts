import type { FagId, PromptKilde, Skill, SkillKategori, SkillReference } from "./types";
import { parseSkillMarkdown, slugify } from "./skill-import";

const SKIP_MAPPER = /(^|\/)(scripts?|bin|node_modules|\.git)(\/|$)/i;
const SKIP_EXT = /\.(py|js|mjs|cjs|ts|tsx|sh|bash|exe|bin|wasm|php|rb)$/i;

export function erTillattSkillFil(sti: string): boolean {
  const n = sti.replaceAll("\\", "/").replace(/^\.\//, "");
  if (!n || n.includes("..")) return false;
  if (SKIP_MAPPER.test(n)) return false;
  if (SKIP_EXT.test(n)) return false;
  return n.toLowerCase().endsWith(".md");
}

export function normaliserSkillSti(sti: string): string {
  return sti.replaceAll("\\", "/").replace(/^\.\//, "").replace(/^\/+/, "");
}

function referanseNavn(filnavn: string): string {
  const uten = filnavn.replace(/\.md$/i, "");
  const map: Record<string, string> = {
    karakterkjennetegn: "Karakterkjennetegn",
    markedsforingsfaget: "Markedsføringsfaget",
    markedsundersokelser: "Markedsundersøkelser",
  };
  return map[uten] ?? uten.replace(/[-_]/g, " ");
}

export function skillGjelderFag(skill: Pick<Skill, "fagIds">, fagId?: string): boolean {
  if (!fagId) return true;
  if (!skill.fagIds.length) return true;
  return skill.fagIds.includes(fagId as FagId);
}

export type SkillPackFil = { path: string; text: string };

export function parseSkillPack(
  filer: SkillPackFil[],
  opts: {
    kilde: PromptKilde;
    kildeUrl?: string;
    defaultFagIds?: FagId[];
    kategori?: SkillKategori;
  },
): Skill[] {
  const md = filer.filter((f) => erTillattSkillFil(f.path));
  const byPath = new Map(md.map((f) => [normaliserSkillSti(f.path), f.text]));
  const skillMd = [...byPath.keys()].filter((p) => /(^|\/)skill\.md$/i.test(p));
  if (skillMd.length === 0) {
    throw new Error("Fant ingen SKILL.md i pakken.");
  }

  const iso = new Date().toISOString().slice(0, 10);
  const brukt = new Set<string>();
  const ut: Skill[] = [];

  for (const skillSti of skillMd.sort()) {
    const raw = byPath.get(skillSti) ?? "";
    const mappe = skillSti.split("/").slice(0, -1).join("/");
    const mappeNavn = mappe.split("/").filter(Boolean).pop() ?? "skill";
    const parset = parseSkillMarkdown(raw, mappeNavn);
    let id = parset.id || slugify(mappeNavn);
    if (brukt.has(id)) {
      let n = 2;
      while (brukt.has(`${id}-${n}`)) n += 1;
      id = `${id}-${n}`;
    }
    brukt.add(id);

    const referanser: SkillReference[] = [];
    const prefix = mappe ? `${mappe}/references/` : "references/";
    for (const [sti, text] of byPath) {
      if (sti === skillSti) continue;
      if (!sti.startsWith(prefix) || !sti.toLowerCase().endsWith(".md")) continue;
      const filnavn = sti.slice(prefix.length);
      if (filnavn.includes("/")) continue;
      const refId = slugify(filnavn.replace(/\.md$/i, ""));
      referanser.push({
        id: refId,
        navn: referanseNavn(filnavn),
        sti,
        markdown: text,
      });
    }
    referanser.sort((a, b) => a.id.localeCompare(b.id));

    ut.push({
      id,
      navn: parset.navn,
      beskrivelse: parset.beskrivelse,
      markdown: parset.innhold,
      kilde: opts.kilde,
      kildeUrl: opts.kildeUrl,
      importert: iso,
      fagIds: opts.defaultFagIds ?? [],
      referanser,
      kategori: opts.kategori ?? "fag",
    });
  }

  return ut;
}
