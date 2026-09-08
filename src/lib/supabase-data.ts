import { foldKoblinger, type Hendelse } from "./hendelser";
import type { Kildedokument } from "./kilder";
import { supabase } from "./supabase";
import {
  hendelseTilRad,
  radTilHendelse,
  radTilKilde,
  radTilChunk,
  CHUNK_FELT,
  KILDE_FELT,
  type ChunkPgRad,
  type HendelseRad,
  type KildeRad,
} from "./supabase-rader";

/**
 * Læringsdataene lest rett fra Supabase i nettleseren. Ingen server imellom.
 *
 * RLS gjør jobben: spørringene her sier ingenting om hvem du er, men
 * databasen returnerer bare radene som tilhører den innloggede brukeren.
 * Er du ikke logget inn, får du null rader — ikke andres.
 */

export type SkyTilstand = {
  hendelser: Hendelse[];
  kilder: Kildedokument[];
  koblingTekster: Record<string, { tekst: string; kildeId: string; tid?: string; side?: number }>;
};

function tidsstempel(sekunder: number): string {
  const s = Math.max(0, Math.floor(sekunder));
  const t = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const to = (n: number) => String(n).padStart(2, "0");
  return t > 0 ? `${t}:${to(m)}:${to(s % 60)}` : `${m}:${to(s % 60)}`;
}

export async function lesTilstand(): Promise<SkyTilstand> {
  const db = supabase();

  const [hendelseSvar, kildeSvar] = await Promise.all([
    db.from("hendelse").select("seq, data").order("tid").order("seq"),
    db.from("kilde").select(KILDE_FELT).order("dato", { ascending: false }),
  ]);
  if (hendelseSvar.error) throw new Error(hendelseSvar.error.message);
  if (kildeSvar.error) throw new Error(kildeSvar.error.message);

  const hendelser = ((hendelseSvar.data ?? []) as HendelseRad[]).map(radTilHendelse);

  // Bare bitene koblingene faktisk peker på. Hele transkriptet skal ikke
  // over til nettleseren.
  const chunkIds = [...new Set(foldKoblinger(hendelser).map((k) => k.chunkId))];
  const koblingTekster: SkyTilstand["koblingTekster"] = {};
  if (chunkIds.length > 0) {
    const { data, error } = await db
      .from("kilde_chunk")
      .select(CHUNK_FELT)
      .in("id", chunkIds.slice(0, 200));
    if (error) throw new Error(error.message);
    for (const rad of (data ?? []) as ChunkPgRad[]) {
      const c = radTilChunk(rad);
      koblingTekster[c.id] = {
        tekst: c.tekst,
        kildeId: c.kildeId,
        ...(c.start != null ? { tid: tidsstempel(c.start) } : {}),
        ...(c.side != null ? { side: c.side } : {}),
      };
    }
  }

  return {
    hendelser,
    kilder: ((kildeSvar.data ?? []) as KildeRad[]).map(radTilKilde),
    koblingTekster,
  };
}

/** Append-only: en id som finnes fra før røres ikke. */
export async function skrivHendelser(hendelser: Hendelse[]): Promise<void> {
  if (hendelser.length === 0) return;
  const { error } = await supabase()
    .from("hendelse")
    .upsert(hendelser.map(hendelseTilRad), {
      onConflict: "bruker,id",
      ignoreDuplicates: true,
    });
  if (error) throw new Error(error.message);
}
