import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { mergeTreLag } from "../../src/lib/ai-overlay.ts";
import { nyId } from "../../src/lib/format.ts";
import { byggSkillKatalog, hentSkillsFraUrl, parseSkillMarkdown } from "../../src/lib/skill-import.ts";
import type {
  AiInnsats,
  AiOverlay,
  AiProveniens,
  AppState,
  Fag,
  Fagord,
  FagordStatus,
  Horing,
  Karakter,
  Kompetansemaal,
  Prompt,
  PromptKatalogRad,
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
  if (!fs.existsSync(fil)) return { horinger: [], fagord: [] };
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

export function lesPrompterFraDisk(): Prompt[] {
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
    };
  });
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
    description: "Øvingsapp for markedsføring og ledelse. Skills ligger under /skills.",
    version: "0.1.0",
    skills: "./skills",
    skillsIndex: `${base}/skills`,
  };
}

export function lesSkillMarkdown(id: string): string | null {
  if (!/^[a-z0-9][a-z0-9-]*$/.test(id)) return null;
  const fil = dataFil("prompts", id, "SKILL.md");
  if (!fs.existsSync(fil)) return null;
  return fs.readFileSync(fil, "utf8");
}

export function lesBaseState(): AppState {
  return {
    fag: lesJson<Fag[]>(dataFil("fag.json")),
    kompetansemaal: lesJson<Kompetansemaal[]>(dataFil("kompetansemaal.json")),
    temaer: lesJson<Tema[]>(dataFil("temaer.json")),
    horinger: lesJson<Horing[]>(dataFil("horinger.json")),
    fagord: lesJson<Fagord[]>(dataFil("fagord.json")),
    prompts: lesPrompterFraDisk(),
    innstillinger: { aktivtFag: "male1", visEmoji: true },
  };
}

export function lastMcpState(): AppState {
  const overlay = lesAiOverlay();
  overlay.prompts = lesPrompterFraDisk();
  return mergeTreLag(lesBaseState(), null, overlay);
}

function proveniens(
  modell: string,
  innsats: AiInnsats,
  promptId: string,
  prompts: Prompt[],
): AiProveniens {
  const prompt = prompts.find((p) => p.id === promptId);
  if (!prompt) {
    throw new Error(`Ukjent promptId: ${promptId}`);
  }
  if (!modell.trim()) throw new Error("modell er påkrevd.");
  return {
    modell: modell.trim(),
    innsats,
    promptId,
    promptNavn: prompt.navn,
  };
}

export function loggHoring(input: {
  temaId: string;
  karakter: Karakter;
  riktig: string;
  mangler: string;
  dato?: string;
  modell: string;
  innsats: AiInnsats;
  promptId: string;
}): Horing {
  const state = lastMcpState();
  if (!state.temaer.some((t) => t.id === input.temaId)) {
    throw new Error(`Ukjent temaId: ${input.temaId}`);
  }
  const ai = proveniens(input.modell, input.innsats, input.promptId, state.prompts);
  const horing: Horing = {
    id: nyId("h-ai"),
    temaId: input.temaId,
    dato: input.dato ?? new Date().toISOString().slice(0, 10),
    karakter: input.karakter,
    riktig: input.riktig,
    mangler: input.mangler,
    kilde: "ai",
    ai,
  };
  const overlay = lesAiOverlay();
  overlay.horinger = [...(overlay.horinger ?? []), horing];
  skrivAiOverlay(overlay);
  return horing;
}

export function oppdaterFagord(input: {
  id: string;
  status: FagordStatus;
  sisteFeil?: string;
  modell: string;
  innsats: AiInnsats;
  promptId: string;
}): Fagord {
  const state = lastMcpState();
  const eksisterende = state.fagord.find((f) => f.id === input.id);
  if (!eksisterende) throw new Error(`Ukjent fagord: ${input.id}`);
  const ai = proveniens(input.modell, input.innsats, input.promptId, state.prompts);
  const oppdatert: Fagord = {
    ...eksisterende,
    status: input.status,
    sisteFeil: input.sisteFeil ?? eksisterende.sisteFeil,
    ai,
  };
  const overlay = lesAiOverlay();
  const andre = (overlay.fagord ?? []).filter((f) => f.id !== input.id);
  overlay.fagord = [...andre, oppdatert];
  skrivAiOverlay(overlay);
  return oppdatert;
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
