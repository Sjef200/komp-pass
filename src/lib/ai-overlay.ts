import type { AiOverlay, AppState, Horing, PersistedState } from "./types";

export const TOM_AI_OVERLAY: AiOverlay = {
  horinger: [],
  fagord: [],
};

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
  return {
    fag: mergeByIdSisteVinner([base.fag, local?.fag]),
    kompetansemaal: mergeByIdSisteVinner([base.kompetansemaal, local?.kompetansemaal]),
    temaer: mergeByIdSisteVinner([base.temaer, local?.temaer]),
    horinger: mergeHoringerAppendOnly([
      base.horinger,
      local?.horinger,
      ai?.horinger,
    ]),
    fagord: mergeByIdSisteVinner([base.fagord, local?.fagord, ai?.fagord]),
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
  return okListe(o.horinger) && okListe(o.fagord) && okListe(o.prompts);
}
