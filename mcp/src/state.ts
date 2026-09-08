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
import { parseSkillMarkdown } from "../../src/lib/skill-import.ts";
import type {
  AiInnsats,
  AiProveniens,
  AppState,
  FagId,
  Fagord,
  FagordStatus,
  Horing,
  Karakter,
  Prompt,
  Skill,
  SkillReference,
} from "../../src/lib/types.ts";
import {
  FAG,
  FAGORD,
  HORINGER,
  KAPITLER,
  KOMPETANSEMAAL,
  PROMPT_FILER,
  PROMPT_INDEX,
  SKILL_FILER,
  SKILL_INDEX,
  TEMAER,
  UDIR_META,
} from "./base-data.ts";

/**
 * Tilstanden, uten en eneste node-import. Læreplanen og skillene kommer fra
 * base-data.ts, som er generert fra src/data. Det er dette som gjør at
 * serveren kan kjøre på en Cloudflare Worker, der det ikke finnes disk.
 *
 * Lokalt registrerer fs-state.ts et diskoverlay, slik at skills du importerer
 * i farten fortsatt dukker opp uten at bundelen må bygges på nytt.
 */

type Kilder = { skills: () => Skill[]; prompts: () => Prompt[] };

function bundledeSkills(): Skill[] {
  return (SKILL_INDEX.skills ?? []).map((rad) => {
    const raw = SKILL_FILER[rad.fil] ?? "";
    const parset = raw ? parseSkillMarkdown(raw, rad.navn) : null;
    const referanser: SkillReference[] = (rad.referanser ?? []).map((ref) => ({
      id: ref.id,
      navn: ref.navn,
      sti: ref.sti,
      markdown: SKILL_FILER[ref.sti] ?? "",
    }));
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

function bundledePrompter(): Prompt[] {
  const fraSkills = bundledeSkills().map((s) => ({
    id: s.id,
    navn: s.navn,
    beskrivelse: s.beskrivelse,
    innhold: s.markdown,
    kilde: s.kilde,
    kildeUrl: s.kildeUrl,
    importert: s.importert,
    fagIds: s.fagIds,
  }));
  const fraPrompts = (PROMPT_INDEX.prompts ?? []).map((rad) => {
    const raw = PROMPT_FILER[rad.fil] ?? "";
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
  const sett = new Map<string, Prompt>();
  for (const p of [...fraSkills, ...fraPrompts]) sett.set(p.id, p);
  return [...sett.values()];
}

const kilder: Kilder = { skills: bundledeSkills, prompts: bundledePrompter };

/** fs-state.ts kaller denne lokalt, så disken vinner over bundelen. */
export function settKilder(nye: Partial<Kilder>): void {
  if (nye.skills) kilder.skills = nye.skills;
  if (nye.prompts) kilder.prompts = nye.prompts;
}

export function lesSkillsFraDisk(): Skill[] {
  return kilder.skills();
}

export function lesPrompterFraDisk(): Prompt[] {
  return kilder.prompts();
}

/** Rå markdown for en skill, uten frontmatter-parsing. Brukt av resources. */
export function lesSkillMarkdown(id: string): string | null {
  if (!/^[a-z0-9][a-z0-9-]*$/.test(id)) return null;
  const fraSkill = SKILL_FILER[`${id}/SKILL.md`];
  if (fraSkill) return fraSkill;
  return PROMPT_FILER[`${id}/SKILL.md`] ?? null;
}

export function lesUdirMeta(): {
  hentet?: string;
  status?: string;
  feilmelding?: string | null;
  kilde?: string;
} {
  return UDIR_META as { hentet?: string; status?: string; feilmelding?: string | null; kilde?: string };
}

export function lesBaseState(): AppState {
  return {
    fag: FAG,
    kompetansemaal: KOMPETANSEMAAL,
    temaer: TEMAER,
    kapitler: KAPITLER,
    horinger: HORINGER,
    fagord: FAGORD,
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
  ovingId?: string;
  kapittelId?: string;
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
    ...(input.ovingId?.trim() ? { ovingId: input.ovingId.trim() } : {}),
    ...(input.kapittelId?.trim() ? { kapittelId: input.kapittelId.trim() } : {}),
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

