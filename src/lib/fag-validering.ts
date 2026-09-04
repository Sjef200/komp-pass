import type { AppState, Fag, FagId, Fagord, Tema } from "./types";
import { erFagId } from "./types";
import { fagordIFag, temaerIFag } from "./fag-utvalg";

export function krevFag(state: AppState, fagId: string | undefined): Fag {
  if (!fagId || !fagId.trim()) {
    throw new Error("fagId er påkrevd. Kall list_fag og velg faget før du fortsetter.");
  }
  if (!erFagId(fagId)) {
    throw new Error(
      `Ukjent fagId: ${fagId}. Gyldige: male1, male2, entrep1, entrep2, norsk-hovedmal, norsk-muntlig.`,
    );
  }
  const fag = state.fag.find((f) => f.id === fagId);
  if (!fag) throw new Error(`Ukjent fagId: ${fagId}.`);
  return fag;
}

export function krevTemaIFag(state: AppState, fagId: FagId, temaId: string): Tema {
  const tema = state.temaer.find((t) => t.id === temaId);
  if (!tema) throw new Error(`Ukjent temaId: ${temaId}.`);
  if (tema.fagId !== fagId) {
    throw new Error(
      `Temaet «${tema.navn}» tilhører ${tema.fagId}, ikke ${fagId}. Bytt fag med fagbytte før du logger.`,
    );
  }
  const iFag = temaerIFag(state, fagId).some((t) => t.id === temaId);
  if (!iFag) {
    throw new Error(`Temaet ${temaId} ligger ikke i faget ${fagId}.`);
  }
  return tema;
}

export function krevFagordIFag(state: AppState, fagId: FagId, fagordId: string): Fagord {
  const fagord = state.fagord.find((f) => f.id === fagordId);
  if (!fagord) throw new Error(`Ukjent fagord: ${fagordId}.`);
  const iFag = fagordIFag(state, fagId).some((f) => f.id === fagordId);
  if (!iFag) {
    throw new Error(
      `Fagordet «${fagord.term}» tilhører ikke ${fagId}. Ikke oppdater begreper på tvers av fag.`,
    );
  }
  return fagord;
}

export function krevProveniens(args: {
  modell?: string;
  innsats?: string;
  promptId?: string;
}): void {
  if (!args.modell?.trim()) throw new Error("modell er påkrevd.");
  if (!args.innsats?.trim()) throw new Error("innsats er påkrevd.");
  if (!args.promptId?.trim()) throw new Error("promptId er påkrevd.");
}
