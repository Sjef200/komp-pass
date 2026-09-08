import { sorterHendelser, type Hendelse } from "./hendelser";
import type { Horing, Kapittel, Karakter, OvingType } from "./types";

export type FoldetNotat = {
  notatId: string;
  kapittelId: string;
  tekst: string;
  seksjon?: string;
  tid: string;
};

export type FoldetVedlegg = {
  vedleggId: string;
  kapittelId: string;
  filnavn: string;
  sti: string;
  mime: string;
  notatId?: string;
  tid: string;
};

export type FoldetOvingSvar = {
  svar: string;
  karakter?: Karakter;
  riktig?: string;
  mangler?: string;
  temaId?: string;
  tid: string;
};

export type FoldetOving = {
  ovingId: string;
  kapittelId: string;
  ovingType: OvingType;
  tekst: string;
  nummer?: string;
  tid: string;
  svar?: FoldetOvingSvar;
  horing?: Horing;
};

export type KapittelArbeid = {
  notater: FoldetNotat[];
  gjeldendeNotat: FoldetNotat | null;
  vedlegg: FoldetVedlegg[];
  ovinger: FoldetOving[];
};

function nøkkel(kapittelId: string, seksjon?: string): string {
  return `${kapittelId}::${seksjon?.trim() ?? ""}`;
}

/** Siste notatsnapshot per kapittel (og valgfri seksjon). Tidligere versjoner ligger i loggen. */
export function foldNotater(hendelser: Hendelse[], kapittelId?: string): FoldetNotat[] {
  const map = new Map<string, FoldetNotat>();
  for (const h of sorterHendelser(hendelser)) {
    if (h.type !== "kapittel-notat") continue;
    if (kapittelId && h.kapittelId !== kapittelId) continue;
    map.set(nøkkel(h.kapittelId, h.seksjon), {
      notatId: h.notatId,
      kapittelId: h.kapittelId,
      tekst: h.tekst,
      ...(h.seksjon ? { seksjon: h.seksjon } : {}),
      tid: h.tid,
    });
  }
  return [...map.values()];
}

export function foldVedlegg(hendelser: Hendelse[], kapittelId?: string): FoldetVedlegg[] {
  const map = new Map<string, FoldetVedlegg>();
  for (const h of sorterHendelser(hendelser)) {
    if (h.type !== "kapittel-vedlegg") continue;
    if (kapittelId && h.kapittelId !== kapittelId) continue;
    map.set(h.vedleggId, {
      vedleggId: h.vedleggId,
      kapittelId: h.kapittelId,
      filnavn: h.filnavn,
      sti: h.sti,
      mime: h.mime,
      ...(h.notatId ? { notatId: h.notatId } : {}),
      tid: h.tid,
    });
  }
  return [...map.values()];
}

export function foldOvinger(
  hendelser: Hendelse[],
  horinger: Horing[],
  kapittelId?: string,
): FoldetOving[] {
  const map = new Map<string, FoldetOving>();
  for (const h of sorterHendelser(hendelser)) {
    if (h.type !== "oving-lagt-inn") continue;
    if (kapittelId && h.kapittelId !== kapittelId) continue;
    map.set(h.ovingId, {
      ovingId: h.ovingId,
      kapittelId: h.kapittelId,
      ovingType: h.ovingType,
      tekst: h.tekst,
      ...(h.nummer ? { nummer: h.nummer } : {}),
      tid: h.tid,
    });
  }
  for (const h of sorterHendelser(hendelser)) {
    if (h.type !== "oving-besvart") continue;
    const oving = map.get(h.ovingId);
    if (!oving) continue;
    oving.svar = {
      svar: h.svar,
      ...(h.karakter != null ? { karakter: h.karakter } : {}),
      ...(h.riktig ? { riktig: h.riktig } : {}),
      ...(h.mangler ? { mangler: h.mangler } : {}),
      ...(h.temaId ? { temaId: h.temaId } : {}),
      tid: h.tid,
    };
  }
  for (const horing of horinger) {
    if (!horing.ovingId) continue;
    const oving = map.get(horing.ovingId);
    if (!oving) continue;
    oving.horing = horing;
    if (!oving.svar && horing.svar) {
      oving.svar = {
        svar: horing.svar,
        karakter: horing.karakter,
        riktig: horing.riktig,
        mangler: horing.mangler,
        temaId: horing.temaId,
        tid: horing.dato,
      };
    }
  }
  return [...map.values()];
}

export function kapittelArbeid(
  hendelser: Hendelse[],
  horinger: Horing[],
  kapittelId: string,
): KapittelArbeid {
  const notater = foldNotater(hendelser, kapittelId);
  const utenSeksjon = notater.filter((n) => !n.seksjon);
  return {
    notater,
    gjeldendeNotat: utenSeksjon.at(-1) ?? notater.at(-1) ?? null,
    vedlegg: foldVedlegg(hendelser, kapittelId),
    ovinger: foldOvinger(hendelser, horinger, kapittelId),
  };
}

export function nesteUbesvarteOving(ovinger: FoldetOving[]): FoldetOving | undefined {
  return ovinger.find((o) => !o.svar && !o.horing);
}

export function kapittelHarLesing(arbeid: KapittelArbeid): boolean {
  return Boolean(arbeid.gjeldendeNotat?.tekst.trim()) || arbeid.vedlegg.length > 0;
}

export function kapittelHarOving(arbeid: KapittelArbeid): boolean {
  return arbeid.ovinger.length > 0;
}

export function kapittelLesingTittel(kapittel: Kapittel): string {
  if (kapittel.sider) {
    return `Kapittel ${kapittel.nummer}. Side ${kapittel.sider.fra}–${kapittel.sider.til}`;
  }
  return `Kapittel ${kapittel.nummer}. ${kapittel.navn}`;
}

export function kapittelOvingTittel(kapittel: Kapittel): string {
  return `Kapittel ${kapittel.nummer}, øving`;
}
