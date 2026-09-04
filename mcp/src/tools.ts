import {
  formatSnitt,
  maalDekning,
  sisteHoring,
  sisteKarakter,
  snittSisteKarakter,
} from "../../src/lib/dekning.ts";
import { grupperKapittel } from "../../src/lib/kapittel.ts";
import { fagordIFag, horingerIFag, maalIFag, temaerIFag } from "../../src/lib/fag-utvalg.ts";
import { krevFag } from "../../src/lib/fag-validering.ts";
import { skillGjelderFag } from "../../src/lib/skill-pack.ts";
import type { AppState, FagordStatus, Karakter, Skill } from "../../src/lib/types.ts";
import {
  importerPromptFraUrl,
  lastMcpState,
  lesPrompterFraDisk,
  lesSkillsFraDisk,
  lesUdirMeta,
  loggHoring,
  oppdaterFagord,
} from "./fs-state.ts";

function jsonText(data: unknown): { content: { type: "text"; text: string }[] } {
  return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
}

function feil(melding: string): { content: { type: "text"; text: string }[]; isError: true } {
  return { content: [{ type: "text", text: melding }], isError: true };
}

function medFag(fagId: string | undefined): { state: AppState; fagId: string } {
  const state = lastMcpState();
  const fag = krevFag(state, fagId ?? state.innstillinger.aktivtFag);
  return {
    state: { ...state, innstillinger: { ...state.innstillinger, aktivtFag: fag.id } },
    fagId: fag.id,
  };
}

function wrap<T>(fn: () => T): T | ReturnType<typeof feil> {
  try {
    return fn();
  } catch (e) {
    return feil(e instanceof Error ? e.message : "Ukjent feil.");
  }
}

export function listFag() {
  const state = lastMcpState();
  const meta = lesUdirMeta();
  return jsonText({
    udir: {
      status: meta.status ?? "ok",
      hentet: meta.hentet ?? null,
      kilde: meta.kilde ?? "Udir Grep",
      feilmelding: meta.feilmelding ?? null,
    },
    fag: state.fag.map((f) => ({
      id: f.id,
      navn: f.navn,
      kode: f.kode,
      laereplanKode: f.laereplanKode ?? null,
      kompetansemaalsettKode: f.kompetansemaalsettKode ?? null,
      apiUrl: f.apiUrl ?? null,
      spraak: f.spraak ?? "nob",
    })),
    merknad: "Velg ett fagId før spørsmål, høring eller oppslag. Bland aldri fag.",
  });
}

export function hentLareplan(fagId: string) {
  return wrap(() => {
    const { state, fagId: id } = medFag(fagId);
    const fag = krevFag(state, id);
    const maal = maalIFag(state, id);
    return jsonText({
      fagId: fag.id,
      navn: fag.navn,
      kode: fag.kode,
      laereplanKode: fag.laereplanKode ?? null,
      kompetansemaalsettKode: fag.kompetansemaalsettKode ?? null,
      kompetansemaalsettUrl: fag.kompetansemaalsettUrl ?? null,
      spraak: fag.spraak ?? "nob",
      udir: lesUdirMeta(),
      kompetansemaal: maal.map((m) => ({
        id: m.id,
        kortnavn: m.kortnavn,
        tekst: m.tekst,
        udirKode: m.udirKode ?? null,
        apiUrl: m.apiUrl ?? null,
      })),
    });
  });
}

export function hentOversikt(fagId?: string) {
  return wrap(() => {
    const { state, fagId: id } = medFag(fagId);
    const fag = krevFag(state, id);
    const temaer = temaerIFag(state, id);
    const maal = maalIFag(state, id);
    const fagord = fagordIFag(state, id);
    const horte = temaer.filter((t) => state.horinger.some((h) => h.temaId === t.id));
    const snitt = snittSisteKarakter(temaer, state.horinger);
    return jsonText({
      fagId: fag.id,
      fag: { id: fag.id, navn: fag.navn, kode: fag.kode, laereplanKode: fag.laereplanKode ?? null },
      snittkarakter: formatSnitt(snitt),
      temaerHort: `${horte.length}/${temaer.length}`,
      fagordSomIkkeSitter: fagord.filter((f) => f.status !== "sitter").length,
      maal: maal.map((m) => {
        const d = maalDekning(m, temaer, state.horinger);
        return {
          id: m.id,
          kortnavn: m.kortnavn,
          udirKode: m.udirKode ?? null,
          status: d.status,
          snitt: formatSnitt(d.snitt),
          temaer: d.totaltTemaer,
        };
      }),
    });
  });
}

export function listTemaer(fagId?: string, filter?: "alle" | "svake" | "uhorte") {
  return wrap(() => {
    const { state, fagId: id } = medFag(fagId);
    const temaer = temaerIFag(state, id).filter((t) => {
      const k = sisteKarakter(state.horinger, t.id);
      if (filter === "uhorte") return k == null;
      if (filter === "svake") return k != null && k < 4;
      return true;
    });
    return jsonText({
      fagId: id,
      temaer: temaer.map((t) => {
        const siste = sisteHoring(state.horinger, t.id);
        return {
          id: t.id,
          navn: t.navn,
          fagId: t.fagId,
          kapittel: t.kapittel ?? null,
          maalIds: t.maalIds,
          sisteKarakter: siste?.karakter ?? null,
          sisteMangler: siste?.mangler ?? "",
        };
      }),
    });
  });
}

export function listKapitler(fagId?: string) {
  return wrap(() => {
    const { state, fagId: id } = medFag(fagId);
    const temaer = temaerIFag(state, id);
    const maal = maalIFag(state, id);
    const kapitler = grupperKapittel(temaer, state.horinger);
    return jsonText({
      fagId: id,
      merknad:
        "Kapittel er læreverkets inndeling. Kompetansemål er Udir. Ikke behandle kapittelnavn som mål.",
      kapitler: kapitler.map((k) => ({
        id: k.id,
        navn: k.navn,
        snitt: formatSnitt(k.snitt),
        temaerHort: `${k.horte}/${k.temaer.length}`,
        maalIds: [...new Set(k.temaer.flatMap((t) => t.maalIds))],
        maal: maal
          .filter((m) => k.temaer.some((t) => t.maalIds.includes(m.id)))
          .map((m) => ({ id: m.id, kortnavn: m.kortnavn, udirKode: m.udirKode ?? null })),
        temaer: k.temaer.map((t) => ({ id: t.id, navn: t.navn, maalIds: t.maalIds })),
      })),
    });
  });
}

export function listFagord(fagId?: string, status?: FagordStatus) {
  return wrap(() => {
    const { state, fagId: id } = medFag(fagId);
    let liste = fagordIFag(state, id);
    if (status) liste = liste.filter((f) => f.status === status);
    return jsonText({
      fagId: id,
      fagord: liste.map((f) => ({
        id: f.id,
        term: f.term,
        forklaring: f.forklaring,
        status: f.status,
        temaIds: f.temaIds,
        sisteFeil: f.sisteFeil ?? "",
        ai: f.ai ?? null,
      })),
    });
  });
}

export function listHoringer(fagId?: string, temaId?: string, limit?: number) {
  return wrap(() => {
    const { state, fagId: id } = medFag(fagId);
    let liste = [...horingerIFag(state, id)].sort((a, b) => b.dato.localeCompare(a.dato));
    if (temaId) liste = liste.filter((h) => h.temaId === temaId);
    if (limit && limit > 0) liste = liste.slice(0, limit);
    return jsonText({ fagId: id, horinger: liste });
  });
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

function skillKort(s: Skill) {
  return {
    id: s.id,
    navn: s.navn,
    beskrivelse: s.beskrivelse,
    kilde: s.kilde,
    kategori: s.kategori,
    fagIds: s.fagIds,
    referanser: s.referanser.map((r) => ({ id: r.id, navn: r.navn })),
    uri: `mfl://skills/${s.id}`,
  };
}

export function listSkills(fagId?: string) {
  return wrap(() => {
    if (fagId) krevFag(lastMcpState(), fagId);
    const skills = lesSkillsFraDisk().filter((s) => skillGjelderFag(s, fagId));
    return jsonText({
      fagId: fagId ?? null,
      skills: skills.map(skillKort),
      merknad: "Les full skill med hent_skill eller resource mfl://skills/{id}.",
    });
  });
}

export function hentSkill(skillId: string, fagId?: string) {
  return wrap(() => {
    const skill = lesSkillsFraDisk().find((s) => s.id === skillId);
    if (!skill) {
      const prompt = lesPrompterFraDisk().find((p) => p.id === skillId);
      if (!prompt) return feil(`Ukjent skill: ${skillId}`);
      return jsonText({
        id: prompt.id,
        navn: prompt.navn,
        beskrivelse: prompt.beskrivelse,
        markdown: prompt.innhold,
        fagIds: prompt.fagIds ?? [],
        referanser: [],
        uri: `mfl://skills/${prompt.id}`,
        merknad:
          "Når du logger høring eller oppdaterer fagord etter denne skillen, sett promptId til id-en over.",
      });
    }
    if (fagId && !skillGjelderFag(skill, fagId)) {
      return feil(`Skillen «${skill.navn}» gjelder ikke faget ${fagId}.`);
    }
    return jsonText({
      id: skill.id,
      navn: skill.navn,
      beskrivelse: skill.beskrivelse,
      markdown: skill.markdown,
      kilde: skill.kilde,
      kategori: skill.kategori,
      fagIds: skill.fagIds,
      referanser: skill.referanser.map((r) => ({
        id: r.id,
        navn: r.navn,
        uri: `mfl://skills/${skill.id}/references/${r.id}`,
      })),
      uri: `mfl://skills/${skill.id}`,
      merknad:
        "Når du logger høring eller oppdaterer fagord etter denne skillen, sett promptId til id-en over.",
    });
  });
}

export function hentSkillReference(skillId: string, referenceId: string) {
  return wrap(() => {
    const skill = lesSkillsFraDisk().find((s) => s.id === skillId);
    if (!skill) return feil(`Ukjent skill: ${skillId}`);
    const ref = skill.referanser.find((r) => r.id === referenceId);
    if (!ref) return feil(`Ukjent referanse: ${referenceId} i ${skillId}`);
    return jsonText({
      skillId,
      id: ref.id,
      navn: ref.navn,
      markdown: ref.markdown,
      uri: `mfl://skills/${skillId}/references/${ref.id}`,
    });
  });
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
  return wrap(() => {
    const { state, fagId: id } = medFag(fagId);
    const fag = krevFag(state, id);
    const temaer = temaerIFag(state, id);
    const kandidater = temaer.filter((t) => {
      const k = sisteKarakter(state.horinger, t.id);
      return k == null || k < 4;
    });
    const tema = temaId
      ? temaer.find((t) => t.id === temaId)
      : kandidater[0] ?? temaer[0];
    if (temaId && !tema) {
      const fremmed = state.temaer.find((t) => t.id === temaId);
      if (fremmed) {
        return feil(
          `Temaet «${fremmed.navn}» tilhører ${fremmed.fagId}, ikke ${id}. Bytt fag før du hører.`,
        );
      }
      return feil(`Ukjent temaId: ${temaId}`);
    }
    if (!tema) return feil("Ingen temaer i faget.");
    const siste = sisteHoring(state.horinger, tema.id);
    const maal = maalIFag(state, id).filter((m) => tema.maalIds.includes(m.id));
    const fagord = fagordIFag(state, id).filter(
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
      fagId: fag.id,
      fag: { id: fag.id, navn: fag.navn, kode: fag.kode },
      tema: { id: tema.id, navn: tema.navn, kapittel: tema.kapittel ?? null, maalIds: tema.maalIds },
      maal: maal.map((m) => ({
        id: m.id,
        kortnavn: m.kortnavn,
        tekst: m.tekst,
        udirKode: m.udirKode ?? null,
      })),
      fagordSomGlipper: fagord.map((f) => ({ id: f.id, term: f.term, status: f.status })),
      sisteMangler: siste?.mangler ?? "",
      forslagTilSporsmal,
      merknad:
        "Still ett av forslagene i chatten. Si både kapittel og kompetansemål. Ikke dump listen til eleven.",
    });
  });
}

export function kallLoggHoring(args: {
  fagId: string;
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
    return jsonText({ fagId: args.fagId, horing: h });
  } catch (e) {
    return feil(e instanceof Error ? e.message : "Kunne ikke logge høring.");
  }
}

export function kallOppdaterFagord(args: {
  fagId: string;
  id: string;
  status: FagordStatus;
  sisteFeil?: string;
  modell: string;
  innsats: "lav" | "medium" | "hoy" | "maks";
  promptId: string;
}) {
  try {
    return jsonText({ fagId: args.fagId, fagord: oppdaterFagord(args) });
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
