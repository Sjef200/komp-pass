import { dagerSiden, erModen, maalDekning, sisteHoring, type MaalDekning } from "./dekning";
import { iDagIso } from "./format";
import { bekreftedeKoblinger, type Kobling } from "./hendelser";
import { kildeIdFraChunk, type Kildedokument } from "./kilder";
import type { AppState, Horing, Karakter, Kompetansemaal, Tema } from "./types";
import { maalIFag, temaerIFag } from "./fag-utvalg";

/**
 * Tre uavhengige spørsmål per kompetansemål, som ofte forveksles:
 *
 *   undervist  — har det vært gjennomgått? (finnes en kilde koblet til målet)
 *   hørt       — har du vist det? (finnes høringer på temaer som treffer målet)
 *   behersket  — sitter det? (karakter og modenhet)
 *
 * Gapet mellom det første og det andre er tallet som ellers ikke finnes noe sted.
 */
export type Gap =
  | "ikke-undervist"
  | "undervist-ikke-hort"
  | "hort-svak"
  | "moden"
  | "sitter";

export const GAP_TEKST: Record<Gap, string> = {
  "ikke-undervist": "ikke gjennomgått",
  "undervist-ikke-hort": "gjennomgått, aldri hørt",
  "hort-svak": "hørt, men svakt",
  moden: "satt en gang, moden for repetisjon",
  sitter: "sitter",
};

/** Rekkefølgen de bør ryddes opp i. Lavest tall er mest påtrengende. */
export const GAP_PRIORITET: Record<Gap, number> = {
  "undervist-ikke-hort": 0,
  "hort-svak": 1,
  moden: 2,
  "ikke-undervist": 3,
  sitter: 4,
};

export type Undervisning = {
  kilder: Kildedokument[];
  /** Første og siste gang målet ble berørt av en kilde. */
  forst?: string;
  sist?: string;
};

export type MaalLinje = {
  maal: Kompetansemaal;
  undervist: Undervisning;
  hortAntall: number;
  hortSist?: string;
  dekning: MaalDekning;
  gap: Gap;
};

export type Laringslop = {
  linjer: MaalLinje[];
  /**
   * Samme tre tall på temanivå. Et kompetansemål henger ofte på et helt
   * kapittel, så gapet på målnivå skjules så snart ett tema er hørt.
   * Temaet er enheten du faktisk kan gjøre noe med.
   */
  temaLinjer: TemaLinje[];
  /** Antall mål per gap-type. */
  fordeling: Record<Gap, number>;
  /** Antall temaer per gap-type. */
  temaFordeling: Record<Gap, number>;
};

function kilderForMaal(
  maal: Kompetansemaal,
  temaer: Tema[],
  koblinger: Kobling[],
  kilder: Kildedokument[],
): Kildedokument[] {
  const temaIds = new Set(temaer.filter((t) => t.maalIds.includes(maal.id)).map((t) => t.id));
  const kildeIds = new Set<string>();
  for (const k of koblinger) {
    const treffer = k.maalId === maal.id || (k.temaId != null && temaIds.has(k.temaId));
    if (treffer) kildeIds.add(kildeIdFraChunk(k.chunkId));
  }
  return kilder.filter((k) => kildeIds.has(k.id));
}

function horingerForMaal(maal: Kompetansemaal, temaer: Tema[], horinger: Horing[]): Horing[] {
  const temaIds = new Set(temaer.filter((t) => t.maalIds.includes(maal.id)).map((t) => t.id));
  return horinger.filter((h) => temaIds.has(h.temaId) && h.hjelp === "ingen" && h.maalIds?.includes(maal.id));
}

export function gapFor(args: {
  harKilde: boolean;
  hortAntall: number;
  svak: boolean;
  moden: boolean;
}): Gap {
  if (args.hortAntall === 0) {
    return args.harKilde ? "undervist-ikke-hort" : "ikke-undervist";
  }
  if (args.svak) return "hort-svak";
  return args.moden ? "moden" : "sitter";
}

export type TemaLinje = {
  tema: Tema;
  undervist: Undervisning;
  hortAntall: number;
  hortSist?: string;
  karakter: Karakter | null;
  dagerSiden: number | null;
  moden: boolean;
  gap: Gap;
};

function tomFordeling(): Record<Gap, number> {
  return {
    "ikke-undervist": 0,
    "undervist-ikke-hort": 0,
    "hort-svak": 0,
    moden: 0,
    sitter: 0,
  };
}

/**
 * Kilder koblet direkte til temaet. Bare direkte kobling teller: en kobling
 * til et kompetansemål sier ingenting om hvilket av målets temaer som
 * faktisk ble gjennomgått.
 */
function kilderForTema(
  tema: Tema,
  koblinger: Kobling[],
  kilder: Kildedokument[],
): Kildedokument[] {
  const kildeIds = new Set(
    koblinger.filter((k) => k.temaId === tema.id).map((k) => kildeIdFraChunk(k.chunkId)),
  );
  return kilder.filter((k) => kildeIds.has(k.id));
}

export function laringslop(
  state: AppState,
  fagId = state.innstillinger.aktivtFag,
  iDag: string = iDagIso(),
): Laringslop {
  const maal = maalIFag(state, fagId);
  const temaer = temaerIFag(state, fagId);
  const koblinger = bekreftedeKoblinger(state.hendelser).filter((k) => k.fagId === fagId);
  const kilder = state.kilder.filter((k) => k.fagId === fagId);

  const linjer: MaalLinje[] = maal.map((m) => {
    const treff = kilderForMaal(m, temaer, koblinger, kilder);
    const datoer = treff.map((k) => k.dato).sort();
    const undervist: Undervisning = {
      kilder: treff,
      ...(datoer.length > 0 ? { forst: datoer[0], sist: datoer.at(-1) } : {}),
    };
    const hort = horingerForMaal(m, temaer, state.horinger);
    const sisteDato = hort
      .map((h) => h.dato)
      .sort()
      .at(-1);
    const dekning = maalDekning(m, temaer, state.horinger, iDag);
    return {
      maal: m,
      undervist,
      hortAntall: hort.length,
      ...(sisteDato ? { hortSist: sisteDato } : {}),
      dekning,
      gap: gapFor({
        harKilde: undervist.kilder.length > 0,
        hortAntall: hort.length,
        svak: dekning.status === "svak" || dekning.delvis,
        moden: dekning.moden,
      }),
    };
  });

  const temaLinjer: TemaLinje[] = temaer.map((tema) => {
    const treff = kilderForTema(tema, koblinger, kilder);
    const datoer = treff.map((k) => k.dato).sort();
    const undervist: Undervisning = {
      kilder: treff,
      ...(datoer.length > 0 ? { forst: datoer[0], sist: datoer.at(-1) } : {}),
    };
    const hort = state.horinger.filter((h) => h.temaId === tema.id);
    const siste = sisteHoring(state.horinger.filter(h => h.hjelp === "ingen"), tema.id);
    const karakter = siste?.karakter ?? null;
    const dager = siste ? dagerSiden(siste.dato, iDag) : null;
    const moden = erModen(karakter, dager);
    return {
      tema,
      undervist,
      hortAntall: hort.length,
      ...(siste ? { hortSist: siste.dato } : {}),
      karakter,
      dagerSiden: dager,
      moden,
      gap: gapFor({
        harKilde: treff.length > 0,
        hortAntall: hort.length,
        svak: karakter == null || karakter < 4,
        moden,
      }),
    };
  });

  const fordeling = tomFordeling();
  for (const l of linjer) fordeling[l.gap] += 1;
  const temaFordeling = tomFordeling();
  for (const l of temaLinjer) temaFordeling[l.gap] += 1;

  return { linjer, temaLinjer, fordeling, temaFordeling };
}

/** Mest påtrengende først, og innen samme gap: sist gjennomgått øverst. */
export function sorterEtterGap(linjer: MaalLinje[]): MaalLinje[] {
  return [...linjer].sort((a, b) => {
    const prio = GAP_PRIORITET[a.gap] - GAP_PRIORITET[b.gap];
    if (prio !== 0) return prio;
    const aSist = a.undervist.sist ?? "";
    const bSist = b.undervist.sist ?? "";
    if (aSist !== bSist) return bSist.localeCompare(aSist);
    return a.maal.id.localeCompare(b.maal.id);
  });
}

export type Tidslinjepunkt = {
  dato: string;
  kilde: Kildedokument;
  maal: Kompetansemaal[];
  /** Høringer på målene etter at kilden ble gjennomgått. */
  hortEtter: number;
};

/**
 * Kildene i rekkefølge, med hvor mye du er hørt i det de dekker *etter* at de
 * ble gjennomgått. En forelesning uten høringer etterpå er et åpent gap.
 */
export function tidslinje(
  state: AppState,
  fagId = state.innstillinger.aktivtFag,
): Tidslinjepunkt[] {
  const maal = maalIFag(state, fagId);
  const temaer = temaerIFag(state, fagId);
  const koblinger = bekreftedeKoblinger(state.hendelser).filter((k) => k.fagId === fagId);
  const kilder = state.kilder.filter((k) => k.fagId === fagId);

  return kilder
    .map((kilde) => {
      const dekkedeMaal = maal.filter((m) =>
        kilderForMaal(m, temaer, koblinger, kilder).some((k) => k.id === kilde.id),
      );
      const temaIds = new Set(
        temaer.filter((t) => dekkedeMaal.some((m) => t.maalIds.includes(m.id))).map((t) => t.id),
      );
      const hortEtter = state.horinger.filter(
        (h) => temaIds.has(h.temaId) && h.dato >= kilde.dato,
      ).length;
      return { dato: kilde.dato, kilde, maal: dekkedeMaal, hortEtter };
    })
    .sort((a, b) => b.dato.localeCompare(a.dato));
}

/** Siste høring på et av målets temaer, for «du er aldri hørt i dette». */
export function sisteHoringForMaal(
  maal: Kompetansemaal,
  temaer: Tema[],
  horinger: Horing[],
): Horing | undefined {
  const treff = temaer
    .filter((t) => t.maalIds.includes(maal.id))
    .map((t) => sisteHoring(horinger, t.id))
    .filter((h): h is Horing => h != null)
    .sort((a, b) => b.dato.localeCompare(a.dato));
  return treff[0];
}

/** Mest påtrengende først. Samme regel som for mål. */
export function sorterTemaEtterGap(linjer: TemaLinje[]): TemaLinje[] {
  return [...linjer].sort((a, b) => {
    const prio = GAP_PRIORITET[a.gap] - GAP_PRIORITET[b.gap];
    if (prio !== 0) return prio;
    const aSist = a.undervist.sist ?? "";
    const bSist = b.undervist.sist ?? "";
    if (aSist !== bSist) return bSist.localeCompare(aSist);
    return a.tema.id.localeCompare(b.tema.id);
  });
}
