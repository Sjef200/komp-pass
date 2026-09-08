import { fold, sorterHendelser, type Hendelse } from "./hendelser";
import type { AiOverlay, AppState, Horing, PersistedState } from "./types";

export const TOM_AI_OVERLAY: AiOverlay = {
  horinger: [],
  fagord: [],
  hendelser: [],
};

/** Union på id, kronologisk sortert. Hendelser er append-only som høringer. */
export function mergeHendelser(lag: Array<Hendelse[] | undefined>): Hendelse[] {
  const map = new Map<string, Hendelse>();
  for (const liste of lag) {
    for (const h of liste ?? []) {
      if (!h || typeof h.id !== "string") continue;
      if (map.has(h.id)) continue;
      map.set(h.id, h);
    }
  }
  return sorterHendelser([...map.values()]);
}

/** Union på id. Første skriving vinner — høringer er append-only. */
export function mergeHoringerAppendOnly(lag: Array<Horing[] | undefined>): Horing[] {
  const map = new Map<string, Horing>();
  const rekkefølge: string[] = [];
  for (const liste of lag) {
    for (const horing of liste ?? []) {
      if (!horing || typeof horing.id !== "string") continue;
      if (map.has(horing.id)) continue;
      map.set(horing.id, horing);
      rekkefølge.push(horing.id);
    }
  }
  return rekkefølge.map((id) => map.get(id)!);
}

/** Siste lag vinner på samme id. Rekkefølge fra første lag, deretter nye id-er. */
export function mergeByIdSisteVinner<T extends { id: string }>(
  lag: Array<T[] | undefined>,
): T[] {
  const map = new Map<string, T>();
  const rekkefølge: string[] = [];
  for (const liste of lag) {
    for (const item of liste ?? []) {
      if (!item || typeof item.id !== "string") continue;
      if (!map.has(item.id)) rekkefølge.push(item.id);
      map.set(item.id, item);
    }
  }
  return rekkefølge.map((id) => map.get(id)!);
}

export function mergeTreLag(
  base: AppState,
  local: PersistedState | null,
  ai: AiOverlay | null,
): AppState {
  const hendelser = mergeHendelser([base.hendelser, local?.hendelser, ai?.hendelser]);
  const folded = fold(
    {
      horinger: mergeHoringerAppendOnly([base.horinger, local?.horinger, ai?.horinger]),
      fagord: mergeByIdSisteVinner([base.fagord, local?.fagord, ai?.fagord]),
    },
    hendelser,
  );
  return {
    fag: mergeByIdSisteVinner([base.fag, local?.fag]),
    kompetansemaal: mergeByIdSisteVinner([base.kompetansemaal, local?.kompetansemaal]),
    temaer: mergeByIdSisteVinner([base.temaer, local?.temaer]),
    kapitler: mergeByIdSisteVinner([base.kapitler, local?.kapitler]),
    horinger: folded.horinger,
    fagord: folded.fagord,
    hendelser,
    koblinger: folded.koblinger,
    kilder: ai?.kilder ?? base.kilder,
    prompts: mergeByIdSisteVinner([base.prompts, local?.prompts, ai?.prompts]),
    skills: mergeByIdSisteVinner([base.skills, local?.skills]),
    innstillinger: {
      ...base.innstillinger,
      ...local?.innstillinger,
    },
  };
}

export function erGyldigAiOverlay(value: unknown): value is AiOverlay {
  if (!value || typeof value !== "object") return false;
  const o = value as Record<string, unknown>;
  const okListe = (v: unknown) => v == null || Array.isArray(v);
  return okListe(o.horinger) && okListe(o.fagord) && okListe(o.prompts) && okListe(o.hendelser);
}
