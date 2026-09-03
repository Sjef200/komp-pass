import type { Karakter, Kompetansemaal, MaalStatus, Tema, Horing } from "./types";
import { karakterFarge } from "./colors";

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
};

export type MaalDekning = {
  maal: Kompetansemaal;
  snitt: number | null;
  status: MaalStatus;
  segmenter: TemaSegment[];
  horteTemaer: number;
  totaltTemaer: number;
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
): MaalDekning {
  const linked = temaer.filter((t) => t.maalIds.includes(maal.id));
  const segmenter: TemaSegment[] = linked.map((tema) => {
    const karakter = sisteKarakter(horinger, tema.id);
    return {
      temaId: tema.id,
      navn: tema.navn,
      karakter,
      farge: karakterFarge(karakter),
    };
  });
  const horte = segmenter.filter((s) => s.karakter != null);
  const snitt =
    horte.length === 0
      ? null
      : horte.reduce((sum, s) => sum + (s.karakter as number), 0) / horte.length;

  return {
    maal,
    snitt,
    status: maalStatusFraSnitt(snitt),
    segmenter,
    horteTemaer: horte.length,
    totaltTemaer: linked.length,
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
