export type KildeType = "forelesning" | "bok" | "oppgave" | "notat";

export type Segment = { start: number; slutt: number; tekst: string };

export type Chunk = {
  ord: number;
  start?: number;
  slutt?: number;
  side?: number;
  tekst: string;
};

export type Kildedokument = {
  id: string;
  fagId: string;
  type: KildeType;
  tittel: string;
  dato: string;
  sti?: string;
  kapittel?: string;
  lagtInn: string;
};

export const KILDE_TYPER: KildeType[] = ["forelesning", "bok", "oppgave", "notat"];

export function erKildeType(v: string): v is KildeType {
  return (KILDE_TYPER as string[]).includes(v);
}

/**
 * En bit får id-en `<kildeId>#<ord>`. Konvensjonen er satt i skrivKilde, og
 * denne funksjonen er stedet den leses, slik at den ikke spres utover.
 */
export function kildeIdFraChunk(chunkId: string): string {
  const skille = chunkId.lastIndexOf("#");
  return skille > 0 ? chunkId.slice(0, skille) : chunkId;
}

/** Sekunder som mm:ss, eller h:mm:ss når opptaket er over en time. */
export function tidsstempel(sekunder: number): string {
  const s = Math.max(0, Math.floor(sekunder));
  const t = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const rest = s % 60;
  const to = (n: number) => String(n).padStart(2, "0");
  return t > 0 ? `${t}:${to(m)}:${to(rest)}` : `${m}:${to(rest)}`;
}

type ChunkOpts = {
  /** Under dette bryter vi ikke, uansett hvor lang pausen er. */
  minSekunder?: number;
  /** Over dette bryter vi selv om ingen pause finnes. */
  maksSekunder?: number;
  /** Opphold mellom segmenter som regnes som et naturlig brudd. */
  pauseSekunder?: number;
};

/**
 * Slår segmenter sammen til biter på rundt ett minutt. Bryter helst i en
 * naturlig pause, slik at en bit er noe læreren faktisk sa i sammenheng —
 * ikke en vilkårlig oppdeling midt i et resonnement.
 */
export function chunkSegmenter(segmenter: Segment[], opts: ChunkOpts = {}): Chunk[] {
  const minSek = opts.minSekunder ?? 60;
  const maksSek = opts.maksSekunder ?? 90;
  const pause = opts.pauseSekunder ?? 0.8;

  const chunks: Chunk[] = [];
  let buffer: Segment[] = [];

  const skyll = () => {
    if (buffer.length === 0) return;
    const tekst = buffer
      .map((s) => s.tekst.trim())
      .filter(Boolean)
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();
    if (tekst) {
      chunks.push({
        ord: chunks.length,
        start: buffer[0]!.start,
        slutt: buffer[buffer.length - 1]!.slutt,
        tekst,
      });
    }
    buffer = [];
  };

  for (let i = 0; i < segmenter.length; i += 1) {
    const seg = segmenter[i]!;
    // Bryt før segmentet legges til, ikke etter. Da holder maksgrensen —
    // med mindre ett enkelt segment i seg selv er lengre enn den.
    if (buffer.length > 0 && seg.slutt - buffer[0]!.start > maksSek) skyll();
    buffer.push(seg);
    const lengde = seg.slutt - buffer[0]!.start;
    const neste = segmenter[i + 1];
    if (!neste) continue;
    if (lengde >= minSek && neste.start - seg.slutt >= pause) skyll();
  }
  skyll();
  return chunks;
}

/**
 * Deler løpende tekst i biter på avsnitt. Sidetall fanges fra linjer som
 * bare inneholder «s. 42» eller «side 42», slik at boka kan siteres med side.
 */
export function chunkTekst(tekst: string, ordPerChunk = 140): Chunk[] {
  const chunks: Chunk[] = [];
  let side: number | undefined;
  let buffer: string[] = [];
  let antallOrd = 0;

  const skyll = () => {
    const samlet = buffer.join("\n\n").trim();
    buffer = [];
    antallOrd = 0;
    if (!samlet) return;
    chunks.push({
      ord: chunks.length,
      ...(side != null ? { side } : {}),
      tekst: samlet,
    });
  };

  for (const avsnitt of tekst.split(/\n\s*\n/)) {
    const ren = avsnitt.trim();
    if (!ren) continue;
    const sideTreff = ren.match(/^(?:s\.?|side)\s*(\d{1,4})$/i);
    if (sideTreff) {
      skyll();
      side = Number(sideTreff[1]);
      continue;
    }
    const ord = ren.split(/\s+/).length;
    if (antallOrd > 0 && antallOrd + ord > ordPerChunk) skyll();
    buffer.push(ren);
    antallOrd += ord;
  }
  skyll();
  return chunks;
}

type WhisperSegment = { start?: number; end?: number; text?: string };

/** Tar imot whisper.cpp og OpenAI-whisper sitt JSON. Begge har segments med start, end og text. */
export function parseWhisperJson(raw: string): Segment[] {
  const data = JSON.parse(raw) as {
    segments?: WhisperSegment[];
    transcription?: Array<{ offsets?: { from: number; to: number }; text?: string }>;
  };
  if (Array.isArray(data.segments)) {
    return data.segments
      .filter((s) => typeof s.text === "string")
      .map((s) => ({
        start: Number(s.start ?? 0),
        slutt: Number(s.end ?? s.start ?? 0),
        tekst: String(s.text).trim(),
      }))
      .filter((s) => s.tekst.length > 0);
  }
  // whisper.cpp med --output-json-full: offsets i millisekunder
  if (Array.isArray(data.transcription)) {
    return data.transcription
      .filter((s) => typeof s.text === "string")
      .map((s) => ({
        start: (s.offsets?.from ?? 0) / 1000,
        slutt: (s.offsets?.to ?? s.offsets?.from ?? 0) / 1000,
        tekst: String(s.text).trim(),
      }))
      .filter((s) => s.tekst.length > 0);
  }
  throw new Error("Fant ingen segmenter i transkriptet. Forventet «segments» eller «transcription».");
}

const VTT_TID = /^(?:(\d{2}):)?(\d{2}):(\d{2})[.,](\d{3})\s+-->\s+(?:(\d{2}):)?(\d{2}):(\d{2})[.,](\d{3})/;

function vttSekunder(t?: string, m?: string, s?: string, ms?: string): number {
  return Number(t ?? 0) * 3600 + Number(m ?? 0) * 60 + Number(s ?? 0) + Number(ms ?? 0) / 1000;
}

/** VTT og SRT. Nyttig når transkriptet kommer fra et annet verktøy enn whisper. */
export function parseVtt(raw: string): Segment[] {
  const linjer = raw.split(/\r?\n/);
  const ut: Segment[] = [];
  let aktiv: Segment | null = null;
  for (const linje of linjer) {
    const treff = linje.match(VTT_TID);
    if (treff) {
      if (aktiv?.tekst.trim()) ut.push({ ...aktiv, tekst: aktiv.tekst.trim() });
      aktiv = {
        start: vttSekunder(treff[1], treff[2], treff[3], treff[4]),
        slutt: vttSekunder(treff[5], treff[6], treff[7], treff[8]),
        tekst: "",
      };
      continue;
    }
    if (!aktiv) continue;
    if (!linje.trim()) continue;
    if (/^\d+$/.test(linje.trim())) continue;
    aktiv.tekst += `${aktiv.tekst ? " " : ""}${linje.trim()}`;
  }
  if (aktiv?.tekst.trim()) ut.push({ ...aktiv, tekst: aktiv.tekst.trim() });
  return ut;
}

/** Transkriptet som lesbar markdown, med tidsstempel foran hver bit. */
export function chunksTilMarkdown(tittel: string, chunks: Chunk[]): string {
  const linjer = [`# ${tittel}`, ""];
  for (const c of chunks) {
    const merke =
      c.start != null ? `**[${tidsstempel(c.start)}]** ` : c.side != null ? `**[s. ${c.side}]** ` : "";
    linjer.push(`${merke}${c.tekst}`, "");
  }
  return `${linjer.join("\n").trim()}\n`;
}

/**
 * Fyllord som ellers drar søket mot ingenting. Et kompetansemål er full av
 * dem, og uten filteret rangerer «for» og «som» like høyt som «reliabilitet».
 */
const STOPPORD = new Set([
  "alle", "andre", "arbeid", "bare", "begge", "blir", "bruke", "både", "denne", "dere",
  "deres", "dette", "disse", "eller", "etter", "finne", "flere", "fordi", "forhold",
  "gjennom", "gjøre", "hvilke", "hvilken", "hvordan", "ikke", "innen", "kunne", "leggje",
  "mange", "medan", "mellom", "mye", "måte", "noen", "også", "over", "samme", "selv",
  "siden", "skal", "skulle", "slik", "som", "under", "uten", "vere", "være", "vurdere",
  "ville", "eget", "egen", "ulike", "annet", "annen", "hver", "helst", "både", "samt",
  "mot", "med", "det", "den", "der", "har", "hva", "kan", "man", "sin", "sitt", "sine",
  "til", "ved", "vil", "være", "her", "der", "for", "fra", "opp", "inn", "nye", "ny",
]);

/**
 * Ordene i en spørring det faktisk er verdt å søke på. Bruk på fritekst og på
 * kompetansemålstekst, som er lang og full av verb uten særpreg.
 */
export function sokeord(query: string, maks = 10): string[] {
  const sett = new Set<string>();
  for (const ord of query.toLowerCase().split(/[^\p{L}\p{N}]+/u)) {
    if (ord.length < 4) continue;
    if (STOPPORD.has(ord)) continue;
    sett.add(ord);
    if (sett.size >= maks) break;
  }
  return [...sett];
}
