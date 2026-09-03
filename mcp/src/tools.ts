import {
  formatSnitt,
  maalDekning,
  sisteHoring,
  sisteKarakter,
  snittSisteKarakter,
} from "../../src/lib/dekning.ts";
import { fagordIFag, horingerIFag, maalIFag, temaerIFag } from "../../src/lib/fag-utvalg.ts";
import type { AppState, FagordStatus, Karakter } from "../../src/lib/types.ts";
import {
  importerPromptFraUrl,
  lastMcpState,
  lesPrompterFraDisk,
  loggHoring,
  oppdaterFagord,
} from "./fs-state.ts";

function jsonText(data: unknown): { content: { type: "text"; text: string }[] } {
  return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
}

function feil(melding: string): { content: { type: "text"; text: string }[]; isError: true } {
  return { content: [{ type: "text", text: melding }], isError: true };
}

function stateForFag(fagId?: string): { state: AppState; fagId: string } {
  const state = lastMcpState();
  const id = fagId ?? state.innstillinger.aktivtFag ?? "male1";
  return {
    state: { ...state, innstillinger: { ...state.innstillinger, aktivtFag: id } },
    fagId: id,
  };
}

export function hentOversikt(fagId?: string) {
  const { state } = stateForFag(fagId);
  const temaer = temaerIFag(state);
  const maal = maalIFag(state);
  const fagord = fagordIFag(state);
  const horte = temaer.filter((t) => state.horinger.some((h) => h.temaId === t.id));
  const snitt = snittSisteKarakter(temaer, state.horinger);
  return jsonText({
    fagId: state.innstillinger.aktivtFag,
    snittkarakter: formatSnitt(snitt),
    temaerHort: `${horte.length}/${temaer.length}`,
    fagordSomIkkeSitter: fagord.filter((f) => f.status !== "sitter").length,
    maal: maal.map((m) => {
      const d = maalDekning(m, temaer, state.horinger);
      return {
        id: m.id,
        kortnavn: m.kortnavn,
        status: d.status,
        snitt: formatSnitt(d.snitt),
        temaer: d.totaltTemaer,
      };
    }),
  });
}

export function listTemaer(fagId?: string, filter?: "alle" | "svake" | "uhorte") {
  const { state } = stateForFag(fagId);
  const temaer = temaerIFag(state).filter((t) => {
    const k = sisteKarakter(state.horinger, t.id);
    if (filter === "uhorte") return k == null;
    if (filter === "svake") return k != null && k < 4;
    return true;
  });
  return jsonText(
    temaer.map((t) => {
      const siste = sisteHoring(state.horinger, t.id);
      return {
        id: t.id,
        navn: t.navn,
        maalIds: t.maalIds,
        sisteKarakter: siste?.karakter ?? null,
        sisteMangler: siste?.mangler ?? "",
      };
    }),
  );
}

export function listFagord(fagId?: string, status?: FagordStatus) {
  const { state } = stateForFag(fagId);
  let liste = fagordIFag(state);
  if (status) liste = liste.filter((f) => f.status === status);
  return jsonText(
    liste.map((f) => ({
      id: f.id,
      term: f.term,
      forklaring: f.forklaring,
      status: f.status,
      temaIds: f.temaIds,
      sisteFeil: f.sisteFeil ?? "",
      ai: f.ai ?? null,
    })),
  );
}

export function listHoringer(fagId?: string, temaId?: string, limit?: number) {
  const { state } = stateForFag(fagId);
  let liste = [...horingerIFag(state)].sort((a, b) => b.dato.localeCompare(a.dato));
  if (temaId) liste = liste.filter((h) => h.temaId === temaId);
  if (limit && limit > 0) liste = liste.slice(0, limit);
  return jsonText(liste);
}

export function listPrompts() {
  return jsonText(
    lesPrompterFraDisk().map((p) => ({
      id: p.id,
      navn: p.navn,
      beskrivelse: p.beskrivelse,
      kilde: p.kilde,
      kildeUrl: p.kildeUrl ?? null,
    })),
  );
}

export function hentPrompt(id: string) {
  const p = lesPrompterFraDisk().find((x) => x.id === id);
  if (!p) return feil(`Ukjent prompt: ${id}`);
  return jsonText({
    ...p,
    merknad:
      "Når du logger høring eller oppdaterer fagord etter denne prompten, sett promptId til id-en over.",
  });
}

export function stillSporsmal(fagId?: string, temaId?: string) {
  const { state } = stateForFag(fagId);
  const temaer = temaerIFag(state);
  const kandidater = temaer.filter((t) => {
    const k = sisteKarakter(state.horinger, t.id);
    return k == null || k < 4;
  });
  const tema = temaId
    ? temaer.find((t) => t.id === temaId)
    : kandidater[0] ?? temaer[0];
  if (!tema) return feil("Ingen temaer i faget.");
  const siste = sisteHoring(state.horinger, tema.id);
  const maal = maalIFag(state).filter((m) => tema.maalIds.includes(m.id));
  const fagord = fagordIFag(state).filter(
    (f) => f.temaIds.includes(tema.id) && f.status !== "sitter",
  );
  const forslagTilSporsmal = [
    `Forklar ${tema.navn.toLowerCase()} og skill det fra det nærmeste nabobegrepet.`,
    fagord[0]
      ? `Hva er forskjellen på ${fagord[0].term} og nabobegrepet det ofte blandes med?`
      : `Når ville du brukt ${tema.navn.toLowerCase()} som beslutningsgrunnlag?`,
    siste?.mangler
      ? `Sist manglet du dette for 6: «${siste.mangler}». Ta det på nytt, mer presist.`
      : `Knytt ${tema.navn.toLowerCase()} til kompetansemålet ${maal[0]?.kortnavn ?? "i faget"}.`,
  ];
  return jsonText({
    tema: { id: tema.id, navn: tema.navn, maalIds: tema.maalIds },
    maal: maal.map((m) => ({ id: m.id, kortnavn: m.kortnavn, tekst: m.tekst })),
    fagordSomGlipper: fagord.map((f) => ({ id: f.id, term: f.term, status: f.status })),
    sisteMangler: siste?.mangler ?? "",
    forslagTilSporsmal,
    merknad: "Still ett av forslagene i chatten. Ikke dump listen til eleven.",
  });
}

export function kallLoggHoring(args: {
  temaId: string;
  karakter: number;
  riktig: string;
  mangler: string;
  dato?: string;
  modell: string;
  innsats: "lav" | "medium" | "hoy" | "maks";
  promptId: string;
}) {
  try {
    const h = loggHoring({
      ...args,
      karakter: args.karakter as Karakter,
    });
    return jsonText(h);
  } catch (e) {
    return feil(e instanceof Error ? e.message : "Kunne ikke logge høring.");
  }
}

export function kallOppdaterFagord(args: {
  id: string;
  status: FagordStatus;
  sisteFeil?: string;
  modell: string;
  innsats: "lav" | "medium" | "hoy" | "maks";
  promptId: string;
}) {
  try {
    return jsonText(oppdaterFagord(args));
  } catch (e) {
    return feil(e instanceof Error ? e.message : "Kunne ikke oppdatere fagord.");
  }
}

export async function kallImporterPrompt(url: string) {
  try {
    const prompts = await importerPromptFraUrl(url);
    return jsonText({
      antall: prompts.length,
      ids: prompts.map((p) => p.id),
      merknad: "Bare SKILL.md er hentet.",
    });
  } catch (e) {
    return feil(e instanceof Error ? e.message : "Kunne ikke importere prompt.");
  }
}
