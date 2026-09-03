import type { AppState, Fag, Fagord, Horing, Kompetansemaal, Tema } from "./types";

export function filtrerFag<T extends { fagId: string }>(
  items: T[],
  fagId: string,
): T[] {
  return items.filter((item) => item.fagId === fagId);
}

export function temaerIFag(state: AppState, fagId = state.innstillinger.aktivtFag): Tema[] {
  return filtrerFag(state.temaer, fagId);
}

export function maalIFag(state: AppState, fagId = state.innstillinger.aktivtFag): Kompetansemaal[] {
  return filtrerFag(state.kompetansemaal, fagId);
}

export function fagordIFag(state: AppState, fagId = state.innstillinger.aktivtFag): Fagord[] {
  const temaIds = new Set(temaerIFag(state, fagId).map((t) => t.id));
  return state.fagord.filter((f) => f.temaIds.some((id) => temaIds.has(id)));
}

export function horingerIFag(state: AppState, fagId = state.innstillinger.aktivtFag): Horing[] {
  const temaIds = new Set(temaerIFag(state, fagId).map((t) => t.id));
  return state.horinger.filter((h) => temaIds.has(h.temaId));
}

export function aktivtFag(state: AppState): Fag | undefined {
  return state.fag.find((f) => f.id === state.innstillinger.aktivtFag);
}
