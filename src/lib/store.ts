import fagJson from "../data/fag.json";
import kompetansemaalJson from "../data/kompetansemaal.json";
import temaerJson from "../data/temaer.json";
import horingerJson from "../data/horinger.json";
import fagordJson from "../data/fagord.json";
import aiOverlayJson from "../data/ai-overlay.json";
import { mergeTreLag } from "./ai-overlay";
import { seedPrompts, seedSkills } from "./skill-katalog";
import type {
  AiOverlay,
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

export function baseState(): AppState {
  return {
    fag: fagJson as Fag[],
    kompetansemaal: kompetansemaalJson as Kompetansemaal[],
    temaer: temaerJson as Tema[],
    horinger: horingerJson as Horing[],
    fagord: fagordJson as Fagord[],
    prompts: seedPrompts(),
    skills: seedSkills(),
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

export function seedAiOverlay(): AiOverlay {
  return aiOverlayJson as AiOverlay;
}

export function mergeState(
  base: AppState,
  overlay: PersistedState | null,
  ai: AiOverlay | null = null,
): AppState {
  return mergeTreLag(base, overlay, ai);
}

export function lastState(ai: AiOverlay | null = seedAiOverlay()): AppState {
  return mergeTreLag(baseState(), lesOverlay(), ai);
}

export function lagreOverlay(state: AppState): void {
  const overlay: PersistedState = {
    fag: state.fag,
    kompetansemaal: state.kompetansemaal,
    temaer: state.temaer,
    horinger: state.horinger,
    fagord: state.fagord,
    prompts: state.prompts,
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
    Array.isArray(o.fagord) ||
    Array.isArray(o.prompts) ||
    Array.isArray(o.skills);
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

export {
  aktivtFag,
  fagordIFag,
  filtrerFag,
  horingerIFag,
  maalIFag,
  temaerIFag,
} from "./fag-utvalg";
