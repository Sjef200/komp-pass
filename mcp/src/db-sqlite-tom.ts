import type { Chunk, Kildedokument } from "../../src/lib/kilder.ts";
import type { Hendelse } from "../../src/lib/hendelser.ts";
import type { ChunkRad, Treff } from "./db-typer.ts";

/**
 * Stubb som erstatter db-sqlite.ts i Worker-bundelen. En Worker har ingen
 * disk og ingen node:sqlite, og skal alltid gå mot Postgres. Blir noe av
 * dette kalt, er valget av lager feil — og da er en tydelig feil bedre enn
 * en stille tom liste.
 */
function nei(): never {
  throw new Error(
    "SQLite finnes ikke her. Denne serveren kjører mot Supabase, og forespørselen må ha et gyldig token.",
  );
}

export function dbSti(): string {
  return "(ingen)";
}
export function lukkDb(): void {}
export function lesHendelser(): Hendelse[] {
  return nei();
}
export function skrivHendelse(_h: Hendelse): Hendelse {
  return nei();
}
export function skrivHendelser(_h: Hendelse[]): number {
  return nei();
}
export function antallHendelser(): number {
  return nei();
}
export function sisteSeq(): number {
  return nei();
}
export function lesKilder(_fagId?: string, _type?: string): Kildedokument[] {
  return nei();
}
export function lesKilde(_id: string): Kildedokument | null {
  return nei();
}
export function lesChunks(_kildeId: string, _fra?: number, _til?: number): ChunkRad[] {
  return nei();
}
export function lesChunk(_id: string): ChunkRad | null {
  return nei();
}
export function skrivKilde(_kilde: Kildedokument, _chunks: Chunk[]): number {
  return nei();
}
export function slettKilde(_id: string): boolean {
  return nei();
}
export function sokChunks(_q: string, _fagId?: string, _antall?: number): Treff[] {
  return nei();
}
