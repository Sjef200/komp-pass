import fagJson from "../data/fag.json";
import kompetansemaalJson from "../data/kompetansemaal.json";
import temaerJson from "../data/temaer.json";
import horingerJson from "../data/horinger.json";
import fagordJson from "../data/fagord.json";
import type {
  AppState,
  Fag,
  Fagord,
  FagordStatus,
  Horing,
  Innstillinger,
  Kompetansemaal,
  PersistedState,
  Tema,
} from "./types";

export const STORAGE_KEY = "mfl:state:v1";

const defaultInnstillinger: Innstillinger = {
  aktivtFag: "male1",
  visEmoji: true,
};

function mergeById<T extends { id: string }>(base: T[], overlay?: T[]): T[] {
  const map = new Map<string, T>();
  for (const item of base) map.set(item.id, item);
  for (const item of overlay ?? []) {
    if (!item || typeof item.id !== "string") continue;
    map.set(item.id, item);
  }
  const overlayOnly: T[] = [];
  const seen = new Set(base.map((b) => b.id));
  for (const item of overlay ?? []) {
    if (item?.id && !seen.has(item.id)) {
      overlayOnly.push(map.get(item.id)!);
      seen.add(item.id);
    }
  }
  return [...base.map((b) => map.get(b.id)!), ...overlayOnly];
}

export function baseState(): AppState {
  return {
    fag: fagJson as Fag[],
    kompetansemaal: kompetansemaalJson as Kompetansemaal[],
    temaer: temaerJson as Tema[],
    horinger: horingerJson as Horing[],
    fagord: fagordJson as Fagord[],
    innstillinger: { ...defaultInnstillinger },
  };
}

export function lesOverlay(): PersistedState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    return parsed as PersistedState;
  } catch {
    return null;
  }
}

export function mergeState(base: AppState, overlay: PersistedState | null): AppState {
  if (!overlay) return base;
  return {
    fag: mergeById(base.fag, overlay.fag),
    kompetansemaal: mergeById(base.kompetansemaal, overlay.kompetansemaal),
    temaer: mergeById(base.temaer, overlay.temaer),
    horinger: mergeById(base.horinger, overlay.horinger),
    fagord: mergeById(base.fagord, overlay.fagord),
    innstillinger: {
      ...base.innstillinger,
      ...overlay.innstillinger,
    },
  };
}

export function lastState(): AppState {
  return mergeState(baseState(), lesOverlay());
}

export function lagreOverlay(state: AppState): void {
  const overlay: PersistedState = {
    fag: state.fag,
    kompetansemaal: state.kompetansemaal,
    temaer: state.temaer,
    horinger: state.horinger,
    fagord: state.fagord,
    innstillinger: state.innstillinger,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(overlay));
}

export function erGyldigTilstand(value: unknown): value is PersistedState {
  if (!value || typeof value !== "object") return false;
  const o = value as Record<string, unknown>;
  const hasArray =
    Array.isArray(o.fag) ||
    Array.isArray(o.kompetansemaal) ||
    Array.isArray(o.temaer) ||
    Array.isArray(o.horinger) ||
    Array.isArray(o.fagord);
  const hasSettings = o.innstillinger != null && typeof o.innstillinger === "object";
  return hasArray || hasSettings;
}

export function eksporterFilnavn(): string {
  const d = new Date();
  const iso = d.toISOString().slice(0, 10);
  return `mfl-tilstand-${iso}.json`;
}

export function appendHoringIState(state: AppState, horing: Horing): AppState {
  if (state.horinger.some((h) => h.id === horing.id)) return state;
  return { ...state, horinger: [...state.horinger, horing] };
}

export function settFagordIState(
  state: AppState,
  id: string,
  patch: { status?: FagordStatus; sisteFeil?: string },
): AppState {
  return {
    ...state,
    fagord: state.fagord.map((f) => (f.id === id ? { ...f, ...patch } : f)),
  };
}

export function filtrerFag<T extends { fagId: string }>(
  items: T[],
  fagId: string,
): T[] {
  return items.filter((item) => item.fagId === fagId);
}

export function temaerIFag(state: AppState): Tema[] {
  return filtrerFag(state.temaer, state.innstillinger.aktivtFag);
}

export function maalIFag(state: AppState): Kompetansemaal[] {
  return filtrerFag(state.kompetansemaal, state.innstillinger.aktivtFag);
}

export function fagordIFag(state: AppState): Fagord[] {
  const temaIds = new Set(temaerIFag(state).map((t) => t.id));
  return state.fagord.filter((f) => f.temaIds.some((id) => temaIds.has(id)));
}

export function horingerIFag(state: AppState): Horing[] {
  const temaIds = new Set(temaerIFag(state).map((t) => t.id));
  return state.horinger.filter((h) => temaIds.has(h.temaId));
}

export function aktivtFag(state: AppState): Fag | undefined {
  return state.fag.find((f) => f.id === state.innstillinger.aktivtFag);
}
