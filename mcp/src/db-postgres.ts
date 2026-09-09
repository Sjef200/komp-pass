import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Hendelse } from "../../src/lib/hendelser.ts";
import { sokeord, type Chunk, type Kildedokument } from "../../src/lib/kilder.ts";
import type { ChunkRad, Lager, Treff } from "./db-typer.ts";
import {
  chunkTilRad,
  hendelseTilRad as tilRad,
  radTilChunk as tilChunk,
  radTilHendelse as tilHendelse,
  radTilKilde as tilKilde,
  CHUNK_FELT,
  KILDE_FELT,
  type ChunkPgRad,
  type HendelseRad,
  type KildeRad,
} from "../../src/lib/supabase-rader.ts";
import { aktivBruker } from "./bruker-kontekst.ts";
import { lesSesjon } from "./sesjon.ts";

/**
 * Supabase-implementasjonen. Radene ligger i Postgres med RLS, så klienten
 * kjører alltid som en innlogget bruker — aldri med en secret key, som ville
 * omgått rad-sikkerheten og gjort alle karakterene lesbare på tvers.
 *
 * Kolonnene er snake_case fordi Postgres folder ubeskyttede navn til små
 * bokstaver. Kartleggingen skjer her, slik at resten av koden ser samme
 * former som SQLite-veien gir.
 */

const klienter = new Map<string, SupabaseClient>();

function oppsett(): { url: string; nokkel: string } {
  const url = process.env.SUPABASE_URL?.trim();
  const nokkel = process.env.SUPABASE_PUBLISHABLE_KEY?.trim();
  if (!url || !nokkel) {
    throw new Error(
      "SUPABASE_URL og SUPABASE_PUBLISHABLE_KEY mangler. Sett dem i .env.local.",
    );
  }
  return { url, nokkel };
}

/**
 * Én klient per token. Over HTTP er tokenet forespørselens, over stdio er
 * det sesjonsfilas. Klientene bufres, men aldri på tvers av brukere.
 */
export function hentKlient(): SupabaseClient {
  const { url, nokkel } = oppsett();
  const token = aktivBruker()?.token ?? lesSesjon()?.access_token ?? "";
  const bufret = klienter.get(token);
  if (bufret) return bufret;

  const ny = createClient(url, nokkel, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: token ? { headers: { Authorization: `Bearer ${token}` } } : {},
  });
  if (klienter.size > 32) klienter.clear();
  klienter.set(token, ny);
  return ny;
}

/** Tvinger nye klienter, for eksempel etter innlogging. */
export function glemKlient(): void {
  klienter.clear();
}

function krev<T>(data: T | null, feil: { message: string } | null, hva: string): T {
  if (feil) throw new Error(`${hva}: ${feil.message}`);
  if (data == null) throw new Error(`${hva}: tomt svar`);
  return data;
}

// ── Hendelser ──────────────────────────────────────────────────────────────


export async function lesHendelser(): Promise<Hendelse[]> {
  const ut: Hendelse[] = []; let cursor = 0;
  while (true) {
    const { data, error } = await hentKlient().from("hendelse").select("seq, data").gt("seq", cursor).order("seq").limit(500);
    const side = krev(data, error, "Kunne ikke lese hendelser").map(r => tilHendelse(r as HendelseRad));
    ut.push(...side); if (side.length < 500) return ut; cursor = side.at(-1)!.seq!;
  }
}

/** Append-only: en id som finnes fra før røres ikke, og raden leses tilbake. */
export async function skrivHendelse(hendelse: Hendelse): Promise<Hendelse> {
  const db = hentKlient();
  const { error } = await db
    .from("hendelse")
    .upsert(tilRad(hendelse), { onConflict: "bruker,id", ignoreDuplicates: true });
  if (error) throw new Error(`Kunne ikke skrive hendelse: ${error.message}`);

  const { data, error: lesefeil } = await db
    .from("hendelse")
    .select("seq, data")
    .eq("id", hendelse.id)
    .maybeSingle();
  if (lesefeil) throw new Error(`Kunne ikke lese tilbake hendelsen: ${lesefeil.message}`);
  return data ? tilHendelse(data as HendelseRad) : hendelse;
}

export async function skrivHendelser(hendelser: Hendelse[]): Promise<number> {
  if (hendelser.length === 0) return 0;
  const for_ = await antallHendelser();
  const { error } = await hentKlient()
    .from("hendelse")
    .upsert(hendelser.map(tilRad), { onConflict: "bruker,id", ignoreDuplicates: true });
  if (error) throw new Error(`Kunne ikke skrive hendelser: ${error.message}`);
  return (await antallHendelser()) - for_;
}

export async function antallHendelser(): Promise<number> {
  const { count, error } = await hentKlient()
    .from("hendelse")
    .select("seq", { count: "exact", head: true });
  if (error) throw new Error(`Kunne ikke telle hendelser: ${error.message}`);
  return count ?? 0;
}

export async function sisteSeq(): Promise<number> {
  const { data, error } = await hentKlient()
    .from("hendelse")
    .select("seq")
    .order("seq", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(`Kunne ikke lese sekvensnummer: ${error.message}`);
  return (data as { seq: number } | null)?.seq ?? 0;
}

// ── Kilder ─────────────────────────────────────────────────────────────────


export async function lesKilder(fagId?: string, type?: string): Promise<Kildedokument[]> {
  let q = hentKlient().from("kilde").select(KILDE_FELT);
  if (fagId) q = q.eq("fag_id", fagId);
  if (type) q = q.eq("type", type);
  const { data, error } = await q.order("dato", { ascending: false }).order("id");
  return krev(data, error, "Kunne ikke lese kilder").map((r) => tilKilde(r as KildeRad));
}

export async function lesKilde(id: string): Promise<Kildedokument | null> {
  const { data, error } = await hentKlient()
    .from("kilde")
    .select(KILDE_FELT)
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(`Kunne ikke lese kilden: ${error.message}`);
  return data ? tilKilde(data as KildeRad) : null;
}


export async function lesChunks(
  kildeId: string,
  fra?: number,
  til?: number,
): Promise<ChunkRad[]> {
  let q = hentKlient().from("kilde_chunk").select(CHUNK_FELT).eq("kilde_id", kildeId);
  if (fra != null) q = q.or(`slutt_sek.is.null,slutt_sek.gte.${fra}`);
  if (til != null) q = q.or(`start_sek.is.null,start_sek.lte.${til}`);
  const { data, error } = await q.order("ord");
  return krev(data, error, "Kunne ikke lese biter").map((r) => tilChunk(r as ChunkPgRad));
}

export async function lesChunk(id: string): Promise<ChunkRad | null> {
  const { data, error } = await hentKlient()
    .from("kilde_chunk")
    .select(CHUNK_FELT)
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(`Kunne ikke lese biten: ${error.message}`);
  return data ? tilChunk(data as ChunkPgRad) : null;
}

/** Skriver kilde og biter. En kilde som finnes fra før erstattes. */
export async function skrivKilde(kilde: Kildedokument, chunks: Chunk[]): Promise<number> {
  const db = hentKlient();
  const { error: slettFeil } = await db
    .from("kilde_chunk")
    .delete()
    .eq("kilde_id", kilde.id);
  if (slettFeil) throw new Error(`Kunne ikke rydde gamle biter: ${slettFeil.message}`);

  const { error: kildeFeil } = await db.from("kilde").upsert(
    {
      id: kilde.id,
      fag_id: kilde.fagId,
      type: kilde.type,
      tittel: kilde.tittel,
      dato: kilde.dato,
      sti: kilde.sti ?? null,
      kapittel: kilde.kapittel ?? null,
      lagt_inn: kilde.lagtInn,
    },
    { onConflict: "bruker,id" },
  );
  if (kildeFeil) throw new Error(`Kunne ikke skrive kilden: ${kildeFeil.message}`);

  if (chunks.length === 0) return 0;
  const { error: chunkFeil } = await db
    .from("kilde_chunk")
    .insert(chunks.map((c) => chunkTilRad(kilde.id, c)));
  if (chunkFeil) throw new Error(`Kunne ikke skrive bitene: ${chunkFeil.message}`);
  return chunks.length;
}

export async function slettKilde(id: string): Promise<boolean> {
  const { error, count } = await hentKlient()
    .from("kilde")
    .delete({ count: "exact" })
    .eq("id", id);
  if (error) throw new Error(`Kunne ikke slette kilden: ${error.message}`);
  return (count ?? 0) > 0;
}

/**
 * websearch_to_tsquery bruker AND mellom ordene. finn_belegg søker med alle
 * temanavn og fagord for et mål, og der ville AND gitt null treff — så
 * ordene bindes med OR, som gir samme oppførsel som FTS5-veien.
 */
export function pgSporring(query: string): string {
  return sokeord(query).join(" OR ");
}

type TreffRad = ChunkPgRad & { chunk_id: string; utdrag: string; rang: number };

export async function sokChunks(
  query: string,
  fagId?: string,
  antall = 8,
): Promise<Treff[]> {
  const sporring = pgSporring(query);
  if (!sporring) return [];
  const { data, error } = await hentKlient().rpc("sok_chunks", {
    sporring,
    fag: fagId ?? null,
    antall,
  });
  if (error) throw new Error(`Søket feilet: ${error.message}`);

  const rader = (data ?? []) as TreffRad[];
  const kilder = new Map<string, Kildedokument>();
  const ut: Treff[] = [];
  for (const rad of rader) {
    let kilde = kilder.get(rad.kilde_id);
    if (!kilde) {
      const hentet = await lesKilde(rad.kilde_id);
      if (!hentet) continue;
      kilde = hentet;
      kilder.set(rad.kilde_id, kilde);
    }
    ut.push({
      ...tilChunk({ ...rad, id: rad.chunk_id }),
      kilde,
      utdrag: rad.utdrag ?? "",
    });
  }
  return ut;
}

export function beskrivelse(): string {
  return `Supabase ${process.env.SUPABASE_URL ?? ""}`;
}

export const lager: Lager = {
  lesHendelser,
  skrivHendelse,
  skrivHendelser,
  antallHendelser,
  sisteSeq,
  lesKilder,
  lesKilde,
  lesChunks,
  lesChunk,
  skrivKilde,
  slettKilde,
  sokChunks,
  beskrivelse,
};
