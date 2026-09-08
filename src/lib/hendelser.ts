import { nyId } from "./format";
import type {
  AiProveniens,
  AppState,
  Fagord,
  FagordStatus,
  Horing,
  Karakter,
  Kilde,
} from "./types";

/**
 * Alt som skjer i læringen er en hendelse. Hendelser legges til, aldri over.
 * Nåtilstanden er et fold over loggen, så ingenting går tapt når noe endres.
 *
 * Unionen er laget for å utvides: del 5 legger til kilder og koblinger.
 */
export type HendelseBase = {
  id: string;
  /** ISO-tidspunkt. Dato alene er nok for eldre rader. */
  tid: string;
  fagId: string;
  kilde: Kilde;
  ai?: AiProveniens;
  /** Plass i loggen. Settes av databasen, og bryter lik tid entydig. */
  seq?: number;
};

export type HoringLogget = HendelseBase & {
  type: "horing-logget";
  temaId: string;
  karakter: Karakter;
  riktig: string;
  mangler: string;
  sporsmal?: string;
  svar?: string;
  modellsvar?: string;
  maalIds?: string[];
};

export type FagordObservert = HendelseBase & {
  type: "fagord-observert";
  fagordId: string;
  status: FagordStatus;
  /** Det eleven sa i stedet. Bevares per observasjon, ikke bare den siste. */
  sisteFeil?: string;
};

export type KoblingForeslatt = HendelseBase & {
  type: "kobling-foreslatt";
  koblingId: string;
  chunkId: string;
  temaId?: string;
  maalId?: string;
  begrunnelse?: string;
};

export type KoblingAvgjort = HendelseBase & {
  type: "kobling-avgjort";
  koblingId: string;
  bekreftet: boolean;
};

export type Hendelse = HoringLogget | FagordObservert | KoblingForeslatt | KoblingAvgjort;

export type KoblingTilstand = "foreslatt" | "bekreftet" | "avvist";

export type Kobling = {
  id: string;
  chunkId: string;
  fagId: string;
  temaId?: string;
  maalId?: string;
  begrunnelse?: string;
  tilstand: KoblingTilstand;
  foreslattAv?: AiProveniens;
  tid: string;
};

const TYPER = new Set([
  "horing-logget",
  "fagord-observert",
  "kobling-foreslatt",
  "kobling-avgjort",
]);

export function erHendelse(value: unknown): value is Hendelse {
  if (!value || typeof value !== "object") return false;
  const h = value as Record<string, unknown>;
  if (typeof h.id !== "string" || typeof h.tid !== "string") return false;
  return typeof h.type === "string" && TYPER.has(h.type);
}

/**
 * Kronologisk rekkefølge. Lik tid brytes på `seq` når hendelsen kommer fra
 * databasen, ellers på id — foldet gir samme resultat uansett hvilken
 * rekkefølge hendelsene kom inn i.
 */
export function sorterHendelser<T extends { tid: string; id: string; seq?: number }>(
  hendelser: T[],
): T[] {
  return [...hendelser].sort((a, b) => {
    const tid = a.tid.localeCompare(b.tid);
    if (tid !== 0) return tid;
    if (a.seq != null && b.seq != null && a.seq !== b.seq) return a.seq - b.seq;
    return a.id.localeCompare(b.id);
  });
}

export function erFagordObservasjon(h: Hendelse): h is FagordObservert {
  return h.type === "fagord-observert";
}

export function erHoringHendelse(h: Hendelse): h is HoringLogget {
  return h.type === "horing-logget";
}

/** En eksisterende høring uttrykt som hendelse. Brukes når loggen skal bygges fra gamle data. */
export function horingTilHendelse(horing: Horing, fagId: string): HoringLogget {
  return {
    id: horing.id,
    type: "horing-logget",
    tid: horing.dato,
    fagId,
    kilde: horing.kilde,
    ai: horing.ai,
    temaId: horing.temaId,
    karakter: horing.karakter,
    riktig: horing.riktig,
    mangler: horing.mangler,
    sporsmal: horing.sporsmal,
    svar: horing.svar,
    modellsvar: horing.modellsvar,
    maalIds: horing.maalIds,
  };
}

export function hendelseTilHoring(h: HoringLogget): Horing {
  return {
    id: h.id,
    temaId: h.temaId,
    dato: h.tid.slice(0, 10),
    karakter: h.karakter,
    riktig: h.riktig,
    mangler: h.mangler,
    ...(h.sporsmal ? { sporsmal: h.sporsmal } : {}),
    ...(h.svar ? { svar: h.svar } : {}),
    ...(h.modellsvar ? { modellsvar: h.modellsvar } : {}),
    ...(h.maalIds?.length ? { maalIds: h.maalIds } : {}),
    kilde: h.kilde,
    ...(h.ai ? { ai: h.ai } : {}),
  };
}

/** Alle observasjoner på ett fagord, nyeste først. */
export function fagordHistorikk(hendelser: Hendelse[], fagordId: string): FagordObservert[] {
  return sorterHendelser(hendelser.filter(erFagordObservasjon).filter((h) => h.fagordId === fagordId))
    .reverse();
}

/**
 * Legger observasjonene oppå fagordene. Siste observasjon bestemmer status,
 * men alle ligger igjen i loggen og kan leses med `fagordHistorikk`.
 */
export function foldFagord(base: Fagord[], hendelser: Hendelse[]): Fagord[] {
  const observasjoner = sorterHendelser(hendelser.filter(erFagordObservasjon));
  if (observasjoner.length === 0) return base;
  const map = new Map(base.map((f) => [f.id, f]));
  for (const o of observasjoner) {
    const fagord = map.get(o.fagordId);
    if (!fagord) continue;
    map.set(o.fagordId, {
      ...fagord,
      status: o.status,
      ...(o.sisteFeil ? { sisteFeil: o.sisteFeil } : {}),
      ...(o.ai ? { ai: o.ai } : {}),
    });
  }
  return base.map((f) => map.get(f.id) ?? f);
}

/** Høringene fra loggen, union med dem som allerede finnes. Første skriving på en id vinner. */
export function foldHoringer(base: Horing[], hendelser: Hendelse[]): Horing[] {
  const sett = new Set(base.map((h) => h.id));
  const fra = sorterHendelser(hendelser.filter(erHoringHendelse))
    .filter((h) => !sett.has(h.id))
    .map(hendelseTilHoring);
  return fra.length === 0 ? base : [...base, ...fra];
}

/**
 * Koblingene slik de står nå. Et forslag er ikke en kobling før noen har
 * bekreftet det — de to tilstandene slås aldri sammen.
 */
export function foldKoblinger(hendelser: Hendelse[]): Kobling[] {
  const map = new Map<string, Kobling>();
  for (const h of sorterHendelser(hendelser)) {
    if (h.type === "kobling-foreslatt") {
      map.set(h.koblingId, {
        id: h.koblingId,
        chunkId: h.chunkId,
        fagId: h.fagId,
        ...(h.temaId ? { temaId: h.temaId } : {}),
        ...(h.maalId ? { maalId: h.maalId } : {}),
        ...(h.begrunnelse ? { begrunnelse: h.begrunnelse } : {}),
        tilstand: "foreslatt",
        ...(h.ai ? { foreslattAv: h.ai } : {}),
        tid: h.tid,
      });
      continue;
    }
    if (h.type === "kobling-avgjort") {
      const kobling = map.get(h.koblingId);
      if (!kobling) continue;
      map.set(h.koblingId, {
        ...kobling,
        tilstand: h.bekreftet ? "bekreftet" : "avvist",
      });
    }
  }
  return [...map.values()];
}

export function bekreftedeKoblinger(hendelser: Hendelse[]): Kobling[] {
  return foldKoblinger(hendelser).filter((k) => k.tilstand === "bekreftet");
}

export function fold(
  base: { horinger: Horing[]; fagord: Fagord[] },
  hendelser: Hendelse[],
): { horinger: Horing[]; fagord: Fagord[]; koblinger: Kobling[] } {
  return {
    horinger: foldHoringer(base.horinger, hendelser),
    fagord: foldFagord(base.fagord, hendelser),
    koblinger: foldKoblinger(hendelser),
  };
}

/**
 * Fagordstatus settes ved å legge til en observasjon, ikke ved å skrive over raden.
 * Samme form som MCP skriver, slik at begge veier gir én logg.
 */
export function observerFagordIState(
  state: AppState,
  fagordId: string,
  status: FagordStatus,
  sisteFeil?: string,
): AppState {
  const observasjon: FagordObservert = {
    id: nyId("fo-obs"),
    type: "fagord-observert",
    tid: new Date().toISOString(),
    fagId: state.innstillinger.aktivtFag,
    kilde: "selv",
    fagordId,
    status,
    ...(sisteFeil?.trim() ? { sisteFeil: sisteFeil.trim() } : {}),
  };
  return {
    ...state,
    hendelser: [...state.hendelser, observasjon],
    fagord: foldFagord(state.fagord, [observasjon]),
  };
}
