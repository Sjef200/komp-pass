import type { Hendelse } from "../../src/lib/hendelser.ts";
import type { Chunk, Kildedokument } from "../../src/lib/kilder.ts";
import type { ChunkRad, Lager, Treff } from "./db-typer.ts";
import * as sqlite from "./db-sqlite.ts";
import { lastEnv } from "./env.ts";
import { aktivBruker } from "./bruker-kontekst.ts";
import { lesSesjon } from "./sesjon.ts";

lastEnv();

export type { ChunkRad, Treff } from "./db-typer.ts";
export { dbSti, lukkDb } from "./db-sqlite.ts";

/**
 * Ett grensesnitt, to lagre. SQLite på disk når du jobber lokalt, Postgres
 * i Supabase når SUPABASE_URL er satt. Resten av koden ser ingen forskjell.
 *
 * SQLite er synkron og Postgres er over nettet, så fasaden er asynkron for
 * begge. Det er prisen for at det samme skal virke overalt.
 */
const sqliteLager: Lager = {
  lesHendelser: async () => sqlite.lesHendelser(),
  skrivHendelse: async (h) => sqlite.skrivHendelse(h),
  skrivHendelser: async (h) => sqlite.skrivHendelser(h),
  antallHendelser: async () => sqlite.antallHendelser(),
  sisteSeq: async () => sqlite.sisteSeq(),
  lesKilder: async (fagId, type) => sqlite.lesKilder(fagId, type),
  lesKilde: async (id) => sqlite.lesKilde(id),
  lesChunks: async (kildeId, fra, til) => sqlite.lesChunks(kildeId, fra, til),
  lesChunk: async (id) => sqlite.lesChunk(id),
  skrivKilde: async (kilde, chunks) => sqlite.skrivKilde(kilde, chunks),
  slettKilde: async (id) => sqlite.slettKilde(id),
  sokChunks: async (q, fagId, antall) => sqlite.sokChunks(q, fagId, antall),
  beskrivelse: () => `SQLite ${sqlite.dbSti()}`,
};

let valgt: Lager | null = null;
let pgLager: Lager | null = null;

/**
 * Rekkefølgen er bevisst:
 *
 *   1. MFL_DB satt eksplisitt  → SQLite. Peker du på en fil, mener du fila.
 *      Det er dette som holder testene på den lokale basen.
 *   2. SUPABASE_URL og innlogget → Postgres.
 *   3. Ellers                    → SQLite.
 *
 * Nøkler uten innlogging faller tilbake til lokal base i stedet for å vise
 * ingenting. Du mister ikke dataene dine av å legge inn en URL.
 */
export function iSky(): boolean {
  // Over HTTP følger tokenet forespørselen, og da finnes det ingen
  // sesjonsfil å slå opp i. Dette er veien en Worker alltid tar.
  if (aktivBruker()) return true;
  if (process.env.MFL_DB?.trim()) return false;
  if (!process.env.SUPABASE_URL?.trim()) return false;
  return lesSesjon() != null;
}

let advart = false;

function lager(): Lager {
  // Bufres ikke når en bruker følger forespørselen: samme prosess kan
  // betjene flere brukere, og valget må tas på nytt hver gang.
  if (aktivBruker()) {
    pgLager ??= (require("./db-postgres.ts") as { lager: Lager }).lager;
    return pgLager;
  }
  if (valgt) return valgt;
  if (!iSky()) {
    if (process.env.SUPABASE_URL?.trim() && !process.env.MFL_DB?.trim() && !advart) {
      advart = true;
      console.error("[mfl] Supabase er satt opp, men du er ikke logget inn. Bruker lokal base. Kjør: npm run logg-inn");
    }
    valgt = sqliteLager;
    return valgt;
  }
  // Lastes bare når skyen faktisk brukes, så lokal drift ikke krever nøkler.
  const pg = require("./db-postgres.ts") as { lager: Lager };
  valgt = pg.lager;
  return valgt;
}

/** Tvinger nytt valg, for eksempel etter innlogging eller i tester. */
export function glemLager(): void {
  valgt = null;
}

export function beskrivLager(): string {
  return lager().beskrivelse();
}

export const lesHendelser = (): Promise<Hendelse[]> => lager().lesHendelser();
export const skrivHendelse = (h: Hendelse): Promise<Hendelse> => lager().skrivHendelse(h);
export const skrivHendelser = (h: Hendelse[]): Promise<number> => lager().skrivHendelser(h);
export const antallHendelser = (): Promise<number> => lager().antallHendelser();
export const sisteSeq = (): Promise<number> => lager().sisteSeq();
export const lesKilder = (fagId?: string, type?: string): Promise<Kildedokument[]> =>
  lager().lesKilder(fagId, type);
export const lesKilde = (id: string): Promise<Kildedokument | null> => lager().lesKilde(id);
export const lesChunks = (kildeId: string, fra?: number, til?: number): Promise<ChunkRad[]> =>
  lager().lesChunks(kildeId, fra, til);
export const lesChunk = (id: string): Promise<ChunkRad | null> => lager().lesChunk(id);
export const skrivKilde = (kilde: Kildedokument, chunks: Chunk[]): Promise<number> =>
  lager().skrivKilde(kilde, chunks);
export const slettKilde = (id: string): Promise<boolean> => lager().slettKilde(id);
export const sokChunks = (q: string, fagId?: string, antall?: number): Promise<Treff[]> =>
  lager().sokChunks(q, fagId, antall);
