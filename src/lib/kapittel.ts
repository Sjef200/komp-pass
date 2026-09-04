import { slugify } from "./skill-import";
import { formatSnitt, snittSisteKarakter, sisteKarakter } from "./dekning";
import type { Horing, Kompetansemaal, Tema } from "./types";

export type KapittelGruppe = {
  id: string;
  navn: string;
  temaer: Tema[];
  snitt: number | null;
  horte: number;
};

export function kapittelNavn(tema: Tema): string {
  const n = tema.kapittel?.trim();
  return n && n.length > 0 ? n : "Uten kapittel";
}

export function grupperKapittel(temaer: Tema[], horinger: Horing[]): KapittelGruppe[] {
  const rekkefølge: string[] = [];
  const map = new Map<string, Tema[]>();
  for (const tema of temaer) {
    const navn = kapittelNavn(tema);
    if (!map.has(navn)) {
      rekkefølge.push(navn);
      map.set(navn, []);
    }
    map.get(navn)!.push(tema);
  }
  return rekkefølge.map((navn) => {
    const gruppe = map.get(navn) ?? [];
    const snitt = snittSisteKarakter(gruppe, horinger);
    const horte = gruppe.filter((t) => sisteKarakter(horinger, t.id) != null).length;
    return {
      id: slugify(navn),
      navn,
      temaer: gruppe,
      snitt,
      horte,
    };
  });
}

export function maalSomTrefferKapittel(
  maal: Kompetansemaal[],
  temaer: Tema[],
): Kompetansemaal[] {
  const ids = new Set(temaer.flatMap((t) => t.maalIds));
  return maal.filter((m) => ids.has(m.id));
}

export function formatKapittelSnitt(snitt: number | null): string {
  return formatSnitt(snitt);
}
