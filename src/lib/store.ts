import fagJson from "../data/fag.json";
import kompetansemaalJson from "../data/kompetansemaal.json";
import temaerJson from "../data/temaer.json";
import horingerJson from "../data/horinger.json";
import fagordJson from "../data/fagord.json";
import aiOverlayJson from "../data/ai-overlay.json";
import { mergeTreLag } from "./ai-overlay";
import { observerFagordIState } from "./hendelser";
import { seedPrompts, seedSkills } from "./skill-katalog";
import type {
  AiOverlay,
  AppState,
  Fag,
  Fagord,
  Horing,
  Innstillinger,
  Kompetansemaal,
  PersistedState,
  Tema,
} from "./types";

/** Gammel nøkkel med hele tilstanden. Leses fortsatt, men skrives aldri mer. */
export const STORAGE_KEY = "mfl:state:v1";

/** Preferanser. Databasen eier dataene; nettleseren eier bare visningsvalgene. */
export const INNSTILLINGER_KEY = "mfl:innstillinger:v1";

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
    hendelser: [],
    koblinger: [],
    kilder: [],
    prompts: seedPrompts(),
    skills: seedSkills(),
    innstillinger: { ...defaultInnstillinger },
  };
}

function lesNokkel(nokkel: string): PersistedState | null {
  try {
    const raw = localStorage.getItem(nokkel);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    return parsed as PersistedState;
  } catch {
    return null;
  }
}

export function lesInnstillinger(): PersistedState | null {
  const nye = lesNokkel(INNSTILLINGER_KEY);
  if (nye?.innstillinger) return { innstillinger: nye.innstillinger };
  const gamle = lesNokkel(STORAGE_KEY);
  return gamle?.innstillinger ? { innstillinger: gamle.innstillinger } : null;
}

/**
 * Læringsdata som ligger igjen i nettleseren fra før databasen fantes.
 * Den slettes ikke — eksporter og kjør `npm run migrer` for å få den inn.
 */
export function lesUmigrertTilstand(): PersistedState | null {
  const gamle = lesNokkel(STORAGE_KEY);
  if (!gamle) return null;
  const antall =
    (gamle.horinger?.length ?? 0) +
    (gamle.hendelser?.length ?? 0) +
    (gamle.fagord?.length ?? 0);
  return antall > 0 ? gamle : null;
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
  return mergeTreLag(baseState(), lesInnstillinger(), ai);
}

export function lagreInnstillinger(innstillinger: Innstillinger): void {
  try {
    localStorage.setItem(INNSTILLINGER_KEY, JSON.stringify({ innstillinger }));
  } catch {
    /* privat modus */
  }
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
    Array.isArray(o.hendelser) ||
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

export { observerFagordIState };

export {
  aktivtFag,
  fagordIFag,
  filtrerFag,
  horingerIFag,
  maalIFag,
  temaerIFag,
} from "./fag-utvalg";
