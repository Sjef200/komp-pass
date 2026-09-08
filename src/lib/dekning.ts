import type { Karakter, Kompetansemaal, MaalStatus, Tema, Horing } from "./types";
import { karakterFarge } from "./colors";
import { iDagIso } from "./format";

/** Hele dager fra `dato` fram til `iDag`. Negativ hvis datoen ligger i framtiden. */
export function dagerSiden(dato: string, iDag: string = iDagIso()): number {
  const fra = Date.parse(`${dato.slice(0, 10)}T12:00:00Z`);
  const til = Date.parse(`${iDag.slice(0, 10)}T12:00:00Z`);
  if (Number.isNaN(fra) || Number.isNaN(til)) return 0;
  return Math.round((til - fra) / 86400000);
}

/**
 * Hvor lenge en karakter får stå før temaet bør høres igjen.
 * Et svakt svar kommer raskt tilbake, en sekser holder en måned.
 */
export const MODNINGSDAGER: Record<Karakter, number> = {
  1: 2,
  2: 3,
  3: 5,
  4: 9,
  5: 16,
  6: 30,
};

/** Uhørt er alltid modent. Ellers avgjør karakteren hvor lenge den holder. */
export function erModen(karakter: Karakter | null, dager: number | null): boolean {
  if (karakter == null || dager == null) return true;
  return dager >= MODNINGSDAGER[karakter];
}

export function horingerForTema(horinger: Horing[], temaId: string): Horing[] {
  return horinger
    .filter((h) => h.temaId === temaId)
    .sort((a, b) => {
      const dato = b.dato.localeCompare(a.dato);
      if (dato !== 0) return dato;
      return b.id.localeCompare(a.id);
    });
}

export function sisteHoring(horinger: Horing[], temaId: string): Horing | undefined {
  return horingerForTema(horinger, temaId)[0];
}

export function sisteKarakter(
  horinger: Horing[],
  temaId: string,
): Karakter | null {
  return sisteHoring(horinger, temaId)?.karakter ?? null;
}

export type TemaSegment = {
  temaId: string;
  navn: string;
  karakter: Karakter | null;
  farge: string;
  dagerSiden: number | null;
  moden: boolean;
};

export type MaalDekning = {
  maal: Kompetansemaal;
  snitt: number | null;
  status: MaalStatus;
  segmenter: TemaSegment[];
  horteTemaer: number;
  totaltTemaer: number;
  /** Dager siden siste høring på et av temaene. Null hvis målet aldri er hørt. */
  dagerSiden: number | null;
  /** Minst ett hørt tema har stått lenge nok til at det bør høres igjen. */
  moden: boolean;
};

export function maalStatusFraSnitt(snitt: number | null): MaalStatus {
  if (snitt == null) return "udekket";
  if (snitt < 4) return "svak";
  if (snitt < 5) return "ok";
  return "sterk";
}

export function maalDekning(
  maal: Kompetansemaal,
  temaer: Tema[],
  horinger: Horing[],
  iDag: string = iDagIso(),
): MaalDekning {
  const linked = temaer.filter((t) => t.maalIds.includes(maal.id));
  const segmenter: TemaSegment[] = linked.map((tema) => {
    const siste = sisteHoring(horinger, tema.id);
    const karakter = siste?.karakter ?? null;
    const dager = siste ? dagerSiden(siste.dato, iDag) : null;
    return {
      temaId: tema.id,
      navn: tema.navn,
      karakter,
      farge: karakterFarge(karakter),
      dagerSiden: dager,
      moden: erModen(karakter, dager),
    };
  });
  const horte = segmenter.filter((s) => s.karakter != null);
  const snitt =
    horte.length === 0
      ? null
      : horte.reduce((sum, s) => sum + (s.karakter as number), 0) / horte.length;
  const dager = horte
    .map((s) => s.dagerSiden)
    .filter((d): d is number => d != null);

  return {
    maal,
    snitt,
    status: maalStatusFraSnitt(snitt),
    segmenter,
    horteTemaer: horte.length,
    totaltTemaer: linked.length,
    dagerSiden: dager.length === 0 ? null : Math.min(...dager),
    moden: horte.some((s) => s.moden),
  };
}

export function snittSisteKarakter(
  temaer: Tema[],
  horinger: Horing[],
): number | null {
  const karakterer = temaer
    .map((t) => sisteKarakter(horinger, t.id))
    .filter((k): k is Karakter => k != null);
  if (karakterer.length === 0) return null;
  return karakterer.reduce((a, b) => a + b, 0) / karakterer.length;
}

export function formatSnitt(n: number | null): string {
  if (n == null) return "–";
  return n.toFixed(1).replace(".", ",");
}

export function maalStatusLabel(status: MaalStatus): string {
  switch (status) {
    case "udekket":
      return "udekket";
    case "svak":
      return "svak";
    case "ok":
      return "ok";
    case "sterk":
      return "sterk";
  }
}
