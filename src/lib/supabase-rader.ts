import type { Hendelse } from "./hendelser";
import type { Chunk, Kildedokument } from "./kilder";

/**
 * Oversettelsen mellom Postgres-rader og formene resten av koden bruker.
 *
 * Postgres folder ubeskyttede navn til små bokstaver, så kolonnene er
 * snake_case mens typene er camelCase. Denne oversettelsen skjer to steder —
 * i MCP-serveren og i nettleseren — og skal derfor bare finnes én gang.
 */

export type HendelseRad = { seq: number; data: Hendelse };

export function radTilHendelse(rad: HendelseRad): Hendelse {
  return { ...rad.data, seq: rad.seq };
}

export function hendelseTilRad(hendelse: Hendelse): {
  id: string;
  type: string;
  tid: string;
  fag_id: string;
  kilde: string;
  data: Omit<Hendelse, "seq">;
} {
  const { seq: _ignorert, ...uten } = hendelse;
  return {
    id: hendelse.id,
    type: hendelse.type,
    tid: hendelse.tid,
    fag_id: hendelse.fagId,
    kilde: hendelse.kilde,
    data: uten,
  };
}

export type KildeRad = {
  id: string;
  fag_id: string;
  type: string;
  tittel: string;
  dato: string;
  sti: string | null;
  kapittel: string | null;
  lagt_inn: string;
};

export const KILDE_FELT = "id, fag_id, type, tittel, dato, sti, kapittel, lagt_inn";

export function radTilKilde(rad: KildeRad): Kildedokument {
  return {
    id: rad.id,
    fagId: rad.fag_id,
    type: rad.type as Kildedokument["type"],
    tittel: rad.tittel,
    dato: rad.dato.slice(0, 10),
    ...(rad.sti ? { sti: rad.sti } : {}),
    ...(rad.kapittel ? { kapittel: rad.kapittel } : {}),
    lagtInn: rad.lagt_inn,
  };
}

export type ChunkPgRad = {
  id: string;
  kilde_id: string;
  ord: number;
  start_sek: number | null;
  slutt_sek: number | null;
  side: number | null;
  tekst: string;
};

export const CHUNK_FELT = "id, kilde_id, ord, start_sek, slutt_sek, side, tekst";

export function radTilChunk(rad: ChunkPgRad): Chunk & { id: string; kildeId: string } {
  return {
    id: rad.id,
    kildeId: rad.kilde_id,
    ord: rad.ord,
    ...(rad.start_sek != null ? { start: rad.start_sek } : {}),
    ...(rad.slutt_sek != null ? { slutt: rad.slutt_sek } : {}),
    ...(rad.side != null ? { side: rad.side } : {}),
    tekst: rad.tekst,
  };
}

export function chunkTilRad(kildeId: string, c: Chunk): ChunkPgRad {
  return {
    id: `${kildeId}#${c.ord}`,
    kilde_id: kildeId,
    ord: c.ord,
    start_sek: c.start ?? null,
    slutt_sek: c.slutt ?? null,
    side: c.side ?? null,
    tekst: c.tekst,
  };
}
