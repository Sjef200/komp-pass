import type { Hendelse } from "../../src/lib/hendelser.ts";
import type { Chunk, Kildedokument } from "../../src/lib/kilder.ts";

export type ChunkRad = Chunk & { id: string; kildeId: string };
export type Treff = ChunkRad & { kilde: Kildedokument; utdrag: string };

/**
 * Det datalaget må kunne. SQLite gjør det synkront på disk, Postgres over
 * nettet — men tools.ts skal ikke vite hvilken av dem som svarer.
 */
export type Lager = {
  lesHendelser(): Promise<Hendelse[]>;
  skrivHendelse(hendelse: Hendelse): Promise<Hendelse>;
  skrivHendelser(hendelser: Hendelse[]): Promise<number>;
  antallHendelser(): Promise<number>;
  sisteSeq(): Promise<number>;
  lesKilder(fagId?: string, type?: string): Promise<Kildedokument[]>;
  lesKilde(id: string): Promise<Kildedokument | null>;
  lesChunks(kildeId: string, fra?: number, til?: number): Promise<ChunkRad[]>;
  lesChunk(id: string): Promise<ChunkRad | null>;
  skrivKilde(kilde: Kildedokument, chunks: Chunk[]): Promise<number>;
  slettKilde(id: string): Promise<boolean>;
  sokChunks(query: string, fagId?: string, antall?: number): Promise<Treff[]>;
  beskrivelse(): string;
};
