import { slugify } from "./skill-import";
import { formatSnitt, snittSisteKarakter, sisteKarakter } from "./dekning";
import type { AppState, Fagord, Horing, Kapittel, Kompetansemaal, Tema } from "./types";

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

export function kapitlerIFag(state: AppState, fagId = state.innstillinger.aktivtFag): Kapittel[] {
  return state.kapitler
    .filter((k) => k.fagId === fagId)
    .slice()
    .sort((a, b) => a.nummer - b.nummer);
}

export function temaerIKapittel(kapittel: Kapittel, temaer: Tema[]): Tema[] {
  const byId = new Map(temaer.map((t) => [t.id, t]));
  return kapittel.temaIds.flatMap((id) => {
    const t = byId.get(id);
    return t ? [t] : [];
  });
}

export function kapittelForTema(kapitler: Kapittel[], temaId: string): Kapittel | undefined {
  return kapitler.find((k) => k.temaIds.includes(temaId));
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

export type FagordKapittelGruppe = {
  kapittel: Kapittel | null;
  fagord: Fagord[];
};

/** Ordbank per kapittel. Et begrep kan ligge i flere kapitler hvis temaene gjør det. */
export function grupperFagordEtterKapittel(
  fagord: Fagord[],
  kapitler: Kapittel[],
): FagordKapittelGruppe[] {
  const sortert = [...kapitler].sort((a, b) => a.nummer - b.nummer);
  const grupper: FagordKapittelGruppe[] = sortert.map((kapittel) => ({
    kapittel,
    fagord: fagord.filter((f) => f.temaIds.some((id) => kapittel.temaIds.includes(id))),
  }));
  const temaIKapittel = new Set(sortert.flatMap((k) => k.temaIds));
  const uten = fagord.filter((f) => !f.temaIds.some((id) => temaIKapittel.has(id)));
  if (uten.length > 0) grupper.push({ kapittel: null, fagord: uten });
  return grupper.filter((g) => g.fagord.length > 0);
}
