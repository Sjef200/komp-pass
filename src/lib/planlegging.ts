import { MODNINGSDAGER, dagerSiden, erModen, sisteHoring } from "./dekning";
import { iDagIso } from "./format";
import { kapittelNavn } from "./kapittel";
import type { Horing, Karakter, Tema } from "./types";

export type TemaPrioritet = {
  tema: Tema;
  karakter: Karakter | null;
  dagerSiden: number | null;
  moden: boolean;
  score: number;
  grunn: string;
};

/** Et uhørt tema slår alt annet. Konstanten holder det øverst uten å bruke Infinity. */
const UHORT_SCORE = 1000;

/** Hvor mye et tema kan tjene på å ha stått lenge. To hele modningsperioder er taket. */
const MAKS_FORFALL = 2;

function grunnTekst(karakter: Karakter | null, dager: number | null, moden: boolean): string {
  if (karakter == null || dager == null) return "aldri hørt";
  if (dager <= 0) {
    return `karakter ${karakter}, hørt i dag`;
  }
  const dagerTekst = `${dager} ${dager === 1 ? "dag" : "dager"}`;
  if (moden && karakter < 4) return `svak: karakter ${karakter} for ${dagerTekst} siden`;
  if (moden) return `moden: karakter ${karakter}, ikke hørt på ${dagerTekst}`;
  if (karakter < 4) return `svak: karakter ${karakter}, hørt for ${dagerTekst} siden`;
  return `fersk: karakter ${karakter} for ${dagerTekst} siden`;
}

/**
 * Hva som gjør et tema aktuelt nå: hvor svakt det sist satt, og hvor lenge
 * det er siden. Svakhet veier tyngst, men et sterkt tema som har stått lenge
 * går forbi et svakt tema du nettopp har hørt.
 */
export function prioritet(
  tema: Tema,
  horinger: Horing[],
  iDag: string = iDagIso(),
): TemaPrioritet {
  const siste = sisteHoring(horinger, tema.id);
  const karakter = siste?.karakter ?? null;
  const dager = siste ? dagerSiden(siste.dato, iDag) : null;
  const moden = erModen(karakter, dager);

  let score = UHORT_SCORE;
  if (karakter != null && dager != null) {
    const forfall = Math.min(Math.max(dager, 0) / MODNINGSDAGER[karakter], MAKS_FORFALL);
    score = (6 - karakter) * 10 + forfall * 20;
  }

  return {
    tema,
    karakter,
    dagerSiden: dager,
    moden,
    score: Math.round(score * 100) / 100,
    grunn: grunnTekst(karakter, dager, moden),
  };
}

/**
 * Køen over hva som bør høres neste gang. Sortert på prioritet, men to temaer
 * fra samme kapittel kommer aldri rett etter hverandre — du lærer mer av å
 * bytte kontekst enn av å bore i det samme.
 */
export function nesteTemaer(
  temaer: Tema[],
  horinger: Horing[],
  iDag: string = iDagIso(),
  antall?: number,
): TemaPrioritet[] {
  const igjen = temaer
    .map((tema) => prioritet(tema, horinger, iDag))
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      const aDager = a.dagerSiden ?? Number.POSITIVE_INFINITY;
      const bDager = b.dagerSiden ?? Number.POSITIVE_INFINITY;
      if (bDager !== aDager) return bDager - aDager;
      return a.tema.id.localeCompare(b.tema.id);
    });

  const ut: TemaPrioritet[] = [];
  let forrigeKapittel: string | null = null;
  while (igjen.length > 0) {
    let i = igjen.findIndex((p) => kapittelNavn(p.tema) !== forrigeKapittel);
    if (i === -1) i = 0;
    const [valgt] = igjen.splice(i, 1);
    if (!valgt) break;
    ut.push(valgt);
    forrigeKapittel = kapittelNavn(valgt.tema);
    if (antall != null && ut.length >= antall) break;
  }
  return ut;
}
