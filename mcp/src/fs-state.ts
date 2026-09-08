import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { byggSkillKatalog, hentSkillsFraUrl, parseSkillMarkdown } from "../../src/lib/skill-import.ts";
import type {
  AiOverlay,
  FagId,
  Prompt,
  PromptKatalogRad,
  Skill,
  SkillKatalogRad,
  SkillReference,
} from "../../src/lib/types.ts";
import { settKilder } from "./state.ts";

/**
 * Alt som trenger disk: overlay-fila, skill-import fra URL og zip, og
 * lesing av skills slik de faktisk ligger i src/data. Importeres bare av
 * lokale inngangspunkter — aldri av tools.ts, som må kunne kjøre på en
 * Worker uten filsystem.
 */

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



/** Skills slik de ligger på disk. Vinner over bundelen når vi kjører lokalt. */
function lesSkillsFraDiskDirekte(): Skill[] {
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

function lesPrompterFraDiskDirekte(): Prompt[] {
  const fraSkills = lesSkillsFraDiskDirekte().map((s) => ({
    id: s.id,
    navn: s.navn,
    beskrivelse: s.beskrivelse,
    innhold: s.markdown,
    kilde: s.kilde,
    kildeUrl: s.kildeUrl,
    importert: s.importert,
    fagIds: s.fagIds,
  }));
  const sett = new Map<string, Prompt>();
  for (const p of [...fraSkills, ...lesPromptKatalog()]) sett.set(p.id, p);
  return [...sett.values()];
}

export function skillKatalogForOrigin(origin: string) {
  const prompts = lesPrompterFraDiskDirekte();
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
  const skill = lesSkillsFraDiskDirekte().find((s) => s.id === skillId);
  const ref = skill?.referanser.find((r) => r.id === referenceId);
  return ref?.markdown ?? null;
}


/**
 * Databasen er sannheten for alt som skjer. JSON-filene i src/data er
 * utgangspunktet: læreplan, temaer og begrepsdefinisjoner.
 */




/** Alle observasjoner på ett fagord, nyeste først. */

/** Hendelser inn utenfra, for eksempel fra UI eller en importert eksportfil. */

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
  return lesPrompterFraDiskDirekte();
}



/**
 * Skills og prompter fra disk vinner over bundelen når vi kjører lokalt.
 * Da dukker en skill du importerer i farten opp uten at base-data må
 * bygges på nytt. På en Worker skjer dette aldri — der finnes ingen disk.
 */
settKilder({ skills: lesSkillsFraDiskDirekte, prompts: lesPrompterFraDiskDirekte });

export { skillGjelderFag } from "../../src/lib/fag-utvalg.ts";
export {
  byggProveniens,
  lastMcpState,
  lesBaseState,
  lesFagordHistorikk,
  lesPrompterFraDisk,
  lesSkillsFraDisk,
  lesUdirMeta,
  loggHoring,
  oppdaterFagord,
  skrivHendelserFraKlient,
} from "./state.ts";
