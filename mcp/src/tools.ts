import {
  formatSnitt,
  maalDekning,
  sisteHoring,
  sisteKarakter,
  snittSisteKarakter,
} from "../../src/lib/dekning.ts";
import { grupperKapittel, kapittelNavn } from "../../src/lib/kapittel.ts";
import { nesteTemaer } from "../../src/lib/planlegging.ts";
import { fagordIFag, horingerIFag, maalIFag, temaerIFag } from "../../src/lib/fag-utvalg.ts";
import { krevFag, krevTemaIFag } from "../../src/lib/fag-validering.ts";
import { skillGjelderFag } from "../../src/lib/skill-pack.ts";
import type { AppState, FagId, FagordStatus, Karakter, Skill } from "../../src/lib/types.ts";
import {
  bekreftedeKoblinger,
  fagordHistorikk,
  foldKoblinger,
  type KoblingForeslatt,
} from "../../src/lib/hendelser.ts";
import { erKildeType, tidsstempel, type Kildedokument } from "../../src/lib/kilder.ts";
import { indekserTekst } from "./kilde-lagring.ts";
import {
  GAP_TEKST,
  laringslop,
  sorterEtterGap,
  sorterTemaEtterGap,
  tidslinje,
} from "../../src/lib/laringslop.ts";
import { lesChunk, lesChunks, lesKilde, lesKilder, skrivHendelse, sokChunks, type Treff } from "./db.ts";
import { nyId } from "../../src/lib/format.ts";
import {
  byggProveniens,
  lastMcpState,
  lesPrompterFraDisk,
  lesSkillsFraDisk,
  lesUdirMeta,
  loggHoring,
  oppdaterFagord,
} from "./state.ts";

function jsonText(data: unknown): { content: { type: "text"; text: string }[] } {
  return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
}

function feil(melding: string): { content: { type: "text"; text: string }[]; isError: true } {
  return { content: [{ type: "text", text: melding }], isError: true };
}

async function medFag(fagId: string | undefined): Promise<{ state: AppState; fagId: string }> {
  const state = await lastMcpState();
  const fag = krevFag(state, fagId ?? state.innstillinger.aktivtFag);
  return {
    state: { ...state, innstillinger: { ...state.innstillinger, aktivtFag: fag.id } },
    fagId: fag.id,
  };
}

async function wrap<T>(fn: () => Promise<T>): Promise<T | ReturnType<typeof feil>> {
  try {
    return await fn();
  } catch (e) {
    return feil(e instanceof Error ? e.message : "Ukjent feil.");
  }
}

export async function listFag() {
  const state = await lastMcpState();
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

export async function hentLareplan(fagId: string) {
  return wrap(async () => {
    const { state, fagId: id } = await medFag(fagId);
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

export async function hentOversikt(fagId?: string) {
  return wrap(async () => {
    const { state, fagId: id } = await medFag(fagId);
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

export async function listTemaer(fagId?: string, filter?: "alle" | "svake" | "uhorte") {
  return wrap(async () => {
    const { state, fagId: id } = await medFag(fagId);
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

export async function listKapitler(fagId?: string) {
  return wrap(async () => {
    const { state, fagId: id } = await medFag(fagId);
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

export async function listFagord(fagId?: string, status?: FagordStatus) {
  return wrap(async () => {
    const { state, fagId: id } = await medFag(fagId);
    let liste = fagordIFag(state, id);
    if (status) liste = liste.filter((f) => f.status === status);
    return jsonText({
      fagId: id,
      fagord: liste.map((f) => {
        const historikk = fagordHistorikk(state.hendelser, f.id);
        return {
          id: f.id,
          term: f.term,
          forklaring: f.forklaring,
          status: f.status,
          temaIds: f.temaIds,
          sisteFeil: f.sisteFeil ?? "",
          ai: f.ai ?? null,
          antallObservasjoner: historikk.length,
          historikk: historikk.slice(0, 3).map((o) => ({
            tid: o.tid,
            status: o.status,
            sisteFeil: o.sisteFeil ?? "",
            modell: o.ai?.modell ?? o.kilde,
          })),
        };
      }),
      merknad:
        "historikk er de tre siste observasjonene, nyeste først. Et begrep som er blandet flere ganger trenger et nytt skille, ikke en ny definisjon.",
    });
  });
}

export async function listHoringer(fagId?: string, temaId?: string, limit?: number) {
  return wrap(async () => {
    const { state, fagId: id } = await medFag(fagId);
    let liste = [...horingerIFag(state, id)].sort((a, b) => b.dato.localeCompare(a.dato));
    if (temaId) liste = liste.filter((h) => h.temaId === temaId);
    if (limit && limit > 0) liste = liste.slice(0, limit);
    return jsonText({ fagId: id, horinger: liste });
  });
}

export async function listPrompts() {
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

export async function listSkills(fagId?: string) {
  return wrap(async () => {
    if (fagId) krevFag(await lastMcpState(), fagId);
    const skills = lesSkillsFraDisk().filter((s) => skillGjelderFag(s, fagId));
    return jsonText({
      fagId: fagId ?? null,
      skills: skills.map(skillKort),
      merknad: "Les full skill med hent_skill eller resource mfl://skills/{id}.",
    });
  });
}

export async function hentSkill(skillId: string, fagId?: string) {
  return wrap(async () => {
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

export async function hentSkillReference(skillId: string, referenceId: string) {
  return wrap(async () => {
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

export async function hentPrompt(id: string) {
  const p = lesPrompterFraDisk().find((x) => x.id === id);
  if (!p) return feil(`Ukjent prompt: ${id}`);
  return jsonText({
    ...p,
    merknad:
      "Når du logger høring eller oppdaterer fagord etter denne prompten, sett promptId til id-en over.",
  });
}

export async function stillSporsmal(fagId?: string, temaId?: string) {
  return wrap(async () => {
    const { state, fagId: id } = await medFag(fagId);
    const fag = krevFag(state, id);
    const temaer = temaerIFag(state, id);
    const ko = nesteTemaer(temaer, state.horinger);
    const tema = temaId ? temaer.find((t) => t.id === temaId) : ko[0]?.tema;
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
    const valgt = ko.find((p) => p.tema.id === tema.id);
    return jsonText({
      fagId: fag.id,
      fag: { id: fag.id, navn: fag.navn, kode: fag.kode },
      tema: { id: tema.id, navn: tema.navn, kapittel: tema.kapittel ?? null, maalIds: tema.maalIds },
      valgtFordi: valgt?.grunn ?? "valgt av eleven",
      dagerSiden: valgt?.dagerSiden ?? null,
      moden: valgt?.moden ?? true,
      nesteIKoen: ko
        .filter((p) => p.tema.id !== tema.id)
        .slice(0, 3)
        .map((p) => ({ id: p.tema.id, navn: p.tema.navn, grunn: p.grunn })),
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

export async function nesteHoring(fagId?: string, antall?: number) {
  return wrap(async () => {
    const { state, fagId: id } = await medFag(fagId);
    const temaer = temaerIFag(state, id);
    const ko = nesteTemaer(temaer, state.horinger, undefined, antall ?? 5);
    return jsonText({
      fagId: id,
      ko: ko.map((p, i) => ({
        plass: i + 1,
        temaId: p.tema.id,
        navn: p.tema.navn,
        kapittel: kapittelNavn(p.tema),
        maalIds: p.tema.maalIds,
        sisteKarakter: p.karakter,
        dagerSiden: p.dagerSiden,
        moden: p.moden,
        grunn: p.grunn,
      })),
      merknad:
        "Uhørte temaer først, deretter svake og modne. To temaer fra samme kapittel kommer aldri rett etter hverandre. Ta ett om gangen med still_sporsmal.",
    });
  });
}

export async function kallLoggHoring(args: {
  fagId: string;
  temaId: string;
  karakter: number;
  riktig: string;
  mangler: string;
  sporsmal: string;
  svar: string;
  modellsvar?: string;
  maalIds?: string[];
  dato?: string;
  modell: string;
  innsats: "lav" | "medium" | "hoy" | "maks";
  promptId: string;
}) {
  try {
    const h = await loggHoring({
      ...args,
      karakter: args.karakter as Karakter,
    });
    return jsonText({ fagId: args.fagId, horing: h });
  } catch (e) {
    return feil(e instanceof Error ? e.message : "Kunne ikke logge høring.");
  }
}

export async function kallOppdaterFagord(args: {
  fagId: string;
  id: string;
  status: FagordStatus;
  sisteFeil?: string;
  modell: string;
  innsats: "lav" | "medium" | "hoy" | "maks";
  promptId: string;
}) {
  try {
    return jsonText({ fagId: args.fagId, fagord: await oppdaterFagord(args) });
  } catch (e) {
    return feil(e instanceof Error ? e.message : "Kunne ikke oppdatere fagord.");
  }
}

export async function kallImporterPrompt(url: string) {
  try {
    // Lastes lazy: den skriver til disk, og skal ikke havne i Worker-bundelen.
    const { importerPromptFraUrl } = await import("./fs-state.ts");
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


// ── Kilder ─────────────────────────────────────────────────────────────────

function kildeKort(k: Kildedokument) {
  return {
    id: k.id,
    fagId: k.fagId,
    type: k.type,
    tittel: k.tittel,
    dato: k.dato,
    kapittel: k.kapittel ?? null,
    uri: `mfl://kilder/${k.id}`,
  };
}

function treffRad(t: Treff) {
  return {
    chunkId: t.id,
    kildeId: t.kildeId,
    kilde: t.kilde.tittel,
    type: t.kilde.type,
    dato: t.kilde.dato,
    ...(t.start != null
      ? { tid: tidsstempel(t.start), startSekund: Math.round(t.start) }
      : {}),
    ...(t.side != null ? { side: t.side } : {}),
    utdrag: t.utdrag,
    tekst: t.tekst,
  };
}

export async function listKilder(fagId?: string, type?: string) {
  return wrap(async () => {
    if (fagId) krevFag(await lastMcpState(), fagId);
    const kilder = await lesKilder(fagId, type);
    return jsonText({
      fagId: fagId ?? null,
      antall: kilder.length,
      kilder: kilder.map(kildeKort),
      merknad:
        kilder.length === 0
          ? "Ingen kilder ennå. Kjør npm run transkriber eller npm run indekser for å legge inn forelesninger og bokstoff."
          : "Les innholdet med hent_kilde, eller søk med sok_kilder.",
    });
  });
}

export async function sokKilder(fagId: string, query: string, antall?: number) {
  return wrap(async () => {
    const { fagId: id } = await medFag(fagId);
    const treff = await sokChunks(query, id, antall ?? 8);
    return jsonText({
      fagId: id,
      query,
      antall: treff.length,
      treff: treff.map(treffRad),
      merknad:
        "Sitér læreren med tidsstempel når du hører eleven. Utdraget er kortet ned; tekst er hele biten.",
    });
  });
}

export async function hentKilde(kildeId: string, fraSekund?: number, tilSekund?: number) {
  return wrap(async () => {
    const kilde = await lesKilde(kildeId);
    if (!kilde) return feil(`Ukjent kilde: ${kildeId}`);
    const chunks = await lesChunks(kildeId, fraSekund, tilSekund);
    return jsonText({
      ...kildeKort(kilde),
      antallBiter: chunks.length,
      biter: chunks.map((c) => ({
        chunkId: c.id,
        ...(c.start != null ? { tid: tidsstempel(c.start) } : {}),
        ...(c.side != null ? { side: c.side } : {}),
        tekst: c.tekst,
      })),
    });
  });
}

export async function finnBelegg(fagId: string, maalId?: string, temaId?: string) {
  return wrap(async () => {
    const { state, fagId: id } = await medFag(fagId);
    if (!maalId && !temaId) return feil("Oppgi maalId eller temaId.");

    const maal = maalId ? maalIFag(state, id).find((m) => m.id === maalId) : undefined;
    if (maalId && !maal) return feil(`Ukjent kompetansemål i ${id}: ${maalId}`);
    const tema = temaId ? temaerIFag(state, id).find((t) => t.id === temaId) : undefined;
    if (temaId && !tema) return feil(`Ukjent tema i ${id}: ${temaId}`);

    const bekreftet = bekreftedeKoblinger(state.hendelser).filter(
      (k) => (maalId ? k.maalId === maalId : true) && (temaId ? k.temaId === temaId : true),
    );
    const bekreftedeBiter: Array<Record<string, unknown>> = [];
    for (const k of bekreftet) {
      const chunk = await lesChunk(k.chunkId);
      if (!chunk) continue;
      const kilde = await lesKilde(chunk.kildeId);
      if (!kilde) continue;
      bekreftedeBiter.push({
        chunkId: chunk.id,
        kilde: kilde.tittel,
        ...(chunk.start != null ? { tid: tidsstempel(chunk.start) } : {}),
        ...(chunk.side != null ? { side: chunk.side } : {}),
        tekst: chunk.tekst,
        begrunnelse: k.begrunnelse ?? "",
      });
    }

    // Udirs ordlyd er abstrakt; læreren sier «survey» og «kontrollgruppe».
    // Temaene og fagordene er broen mellom målet og det som faktisk blir sagt.
    const relevanteTemaer = tema
      ? [tema]
      : temaerIFag(state, id).filter((t) => t.maalIds.includes(maalId!));
    const temaIds = new Set(relevanteTemaer.map((t) => t.id));
    const begreper = fagordIFag(state, id)
      .filter((f) => f.temaIds.some((t) => temaIds.has(t)))
      .map((f) => f.term);
    const query = [
      ...relevanteTemaer.map((t) => t.navn),
      ...begreper,
      maal?.kortnavn ?? "",
    ]
      .join(" ")
      .trim();
    const kandidater = (await sokChunks(query, id, 6)).filter(
      (t) => !bekreftet.some((k) => k.chunkId === t.id),
    );

    return jsonText({
      fagId: id,
      ...(maal ? { maal: { id: maal.id, kortnavn: maal.kortnavn, udirKode: maal.udirKode ?? null } } : {}),
      ...(tema ? { tema: { id: tema.id, navn: tema.navn, kapittel: tema.kapittel ?? null } } : {}),
      sokteEtter: query,
      bekreftet: bekreftedeBiter,
      kandidater: kandidater.map(treffRad),
      merknad:
        bekreftedeBiter.length === 0 && kandidater.length === 0
          ? "Ingen kilder dekker dette ennå. Det er selve gapet: målet er ikke undervist, eller forelesningen er ikke lagt inn."
          : "Bekreftet er koblinger du har godkjent. Kandidater er fritekstsøk — foreslå kobling med foresla_kobling hvis en av dem faktisk treffer.",
    });
  });
}

export async function foreslaKobling(args: {
  fagId: string;
  chunkId: string;
  temaId?: string;
  maalId?: string;
  begrunnelse?: string;
  modell: string;
  innsats: "lav" | "medium" | "hoy" | "maks";
  promptId: string;
}) {
  return wrap(async () => {
    const { state, fagId: id } = await medFag(args.fagId);
    if (!args.temaId && !args.maalId) return feil("Oppgi temaId eller maalId.");
    const chunk = await lesChunk(args.chunkId);
    if (!chunk) return feil(`Ukjent chunkId: ${args.chunkId}`);
    const kilde = await lesKilde(chunk.kildeId);
    if (!kilde) return feil(`Kilden til ${args.chunkId} finnes ikke.`);
    if (kilde.fagId !== id) {
      return feil(`Kilden «${kilde.tittel}» tilhører ${kilde.fagId}, ikke ${id}.`);
    }
    if (args.temaId) krevTemaIFag(state, id as FagId, args.temaId);
    if (args.maalId && !maalIFag(state, id).some((m) => m.id === args.maalId)) {
      return feil(`Ukjent kompetansemål i ${id}: ${args.maalId}`);
    }
    const ai = byggProveniens(args.modell, args.innsats, args.promptId, state.prompts);

    const hendelse: KoblingForeslatt = {
      id: nyId("kobling"),
      type: "kobling-foreslatt",
      tid: new Date().toISOString(),
      fagId: id,
      kilde: "ai",
      ai,
      koblingId: nyId("k"),
      chunkId: args.chunkId,
      ...(args.temaId ? { temaId: args.temaId } : {}),
      ...(args.maalId ? { maalId: args.maalId } : {}),
      ...(args.begrunnelse?.trim() ? { begrunnelse: args.begrunnelse.trim() } : {}),
    };
    skrivHendelse(hendelse);
    return jsonText({
      koblingId: hendelse.koblingId,
      tilstand: "foreslatt",
      merknad:
        "Forslaget står som foreslått til eleven bekrefter det under fanen Kilder. Et forslag teller ikke som dekning.",
    });
  });
}

export async function listKoblinger(fagId?: string, tilstand?: string) {
  return wrap(async () => {
    const { state, fagId: id } = await medFag(fagId);
    const koblinger = foldKoblinger(state.hendelser)
      .filter((k) => k.fagId === id)
      .filter((k) => (tilstand ? k.tilstand === tilstand : true));
    return jsonText({
      fagId: id,
      koblinger: await Promise.all(
        koblinger.map(async (k) => ({
          ...k,
          chunk: (await lesChunk(k.chunkId))?.tekst.slice(0, 160) ?? null,
        })),
      ),
    });
  });
}


// ── Læringsløp ─────────────────────────────────────────────────────────────

export async function hentLaringslop(fagId?: string) {
  return wrap(async () => {
    const { state, fagId: id } = await medFag(fagId);
    const fag = krevFag(state, id);
    const lop = laringslop(state, id);
    const linjer = sorterEtterGap(lop.linjer);

    return jsonText({
      fagId: id,
      fag: { id: fag.id, navn: fag.navn, kode: fag.kode },
      fordeling: Object.fromEntries(
        Object.entries(lop.fordeling).map(([gap, antall]) => [gap, antall]),
      ),
      gapet: {
        temaer: lop.temaFordeling["undervist-ikke-hort"],
        maal: lop.fordeling["undervist-ikke-hort"],
        forklaring:
          "Gjennomgått i en kilde, men aldri hørt. Bruk temanivået — et kompetansemål henger på et helt kapittel, så måltallet skjuler gapet så snart ett tema er hørt.",
      },
      temaer: sorterTemaEtterGap(lop.temaLinjer).map((l) => ({
        id: l.tema.id,
        navn: l.tema.navn,
        kapittel: l.tema.kapittel ?? null,
        maalIds: l.tema.maalIds,
        gap: l.gap,
        gapTekst: GAP_TEKST[l.gap],
        undervist: {
          antallKilder: l.undervist.kilder.length,
          sist: l.undervist.sist ?? null,
          kilder: l.undervist.kilder.map((k) => ({ id: k.id, tittel: k.tittel, dato: k.dato })),
        },
        hort: { antall: l.hortAntall, sist: l.hortSist ?? null },
        sisteKarakter: l.karakter,
        dagerSiden: l.dagerSiden,
        moden: l.moden,
      })),
      maal: linjer.map((l) => ({
        id: l.maal.id,
        kortnavn: l.maal.kortnavn,
        udirKode: l.maal.udirKode ?? null,
        gap: l.gap,
        gapTekst: GAP_TEKST[l.gap],
        undervist: {
          antallKilder: l.undervist.kilder.length,
          forst: l.undervist.forst ?? null,
          sist: l.undervist.sist ?? null,
          kilder: l.undervist.kilder.map((k) => ({ id: k.id, tittel: k.tittel, dato: k.dato })),
        },
        hort: { antall: l.hortAntall, sist: l.hortSist ?? null },
        behersket: {
          status: l.dekning.status,
          snitt: formatSnitt(l.dekning.snitt),
          dagerSiden: l.dekning.dagerSiden,
          moden: l.dekning.moden,
        },
      })),
      tidslinje: tidslinje(state, id).map((p) => ({
        dato: p.dato,
        kilde: p.kilde.tittel,
        type: p.kilde.type,
        dekkerMaal: p.maal.map((m) => m.id),
        hortEtterpa: p.hortEtter,
      })),
      merknad:
        "Undervist, hørt og behersket er tre forskjellige ting. Si «dette ble gjennomgått <dato>, du er aldri hørt i det» når gapet er undervist-ikke-hort, og bruk temanivået når du velger hva som skal høres. Uten kilder i faget er alt ikke-undervist, og da sier tallet ingenting ennå.",
    });
  });
}


export async function leggInnKilde(args: {
  fagId: string;
  tittel: string;
  tekst: string;
  type?: string;
  kapittel?: string;
  dato?: string;
}) {
  return wrap(async () => {
    const { state, fagId: id } = await medFag(args.fagId);
    if (!args.tittel.trim()) return feil("tittel er påkrevd. Gi stoffet et navn du kjenner igjen.");
    if (!args.tekst.trim()) return feil("tekst er påkrevd.");
    const type = args.type ?? "notat";
    if (!erKildeType(type)) return feil(`Ukjent type: ${type}. Bruk forelesning, bok, oppgave eller notat.`);

    const { kilde, antallBiter } = await indekserTekst({
      tekst: args.tekst,
      fagId: id,
      tittel: args.tittel.trim(),
      type,
      dato: args.dato,
      kapittel: args.kapittel,
    });

    // Temaene i faget, så modellen kan foreslå koblinger med én gang.
    const temaer = temaerIFag(state, id).map((t) => ({
      id: t.id,
      navn: t.navn,
      kapittel: t.kapittel ?? null,
    }));

    return jsonText({
      fagId: id,
      kildeId: kilde.id,
      tittel: kilde.tittel,
      type: kilde.type,
      antallBiter,
      chunkIds: Array.from({ length: antallBiter }, (_, i) => `${kilde.id}#${i}`),
      temaer,
      merknad:
        "Stoffet er lagret. Foreslå nå koblinger til temaene det faktisk dekker med foresla_kobling, én per bit som treffer. Eleven bekrefter dem under fanen Kilder. Deretter kan du høre i det.",
    });
  });
}
