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

export async function lesTilstand(tidligere?: SkyTilstand): Promise<SkyTilstand> {
  const db = supabase();

  const nye: Hendelse[] = [];
  let cursor = Math.max(0, ...(tidligere?.hendelser ?? []).map(h => h.seq ?? 0));
  while (true) {
    const { data, error } = await db.from("hendelse").select("seq, data").gt("seq", cursor).order("seq").limit(500);
    if (error) throw new Error(error.message);
    const side = ((data ?? []) as HendelseRad[]).map(radTilHendelse);
    nye.push(...side);
    if (side.length < 500) break;
    cursor = side.at(-1)!.seq!;
  }
  const kildeRader: KildeRad[] = [];
  for (let fra = 0; ; fra += 500) {
    const { data, error } = await db.from("kilde").select(KILDE_FELT).order("id").range(fra, fra + 499);
    if (error) throw new Error(error.message);
    const side = (data ?? []) as KildeRad[]; kildeRader.push(...side); if (side.length < 500) break;
  }
  const hendelser = [...new Map([...(tidligere?.hendelser ?? []), ...nye].map(h => [h.id, h])).values()];

  // Bare bitene koblingene faktisk peker på. Hele transkriptet skal ikke
  // over til nettleseren.
  const chunkIds = [...new Set(foldKoblinger(hendelser).map((k) => k.chunkId))];
  const koblingTekster: SkyTilstand["koblingTekster"] = {};
  for (let fra = 0; fra < chunkIds.length; fra += 200) {
    const { data, error } = await db
      .from("kilde_chunk")
      .select(CHUNK_FELT)
      .in("id", chunkIds.slice(fra, fra + 200));
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
    kilder: kildeRader.map(radTilKilde),
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
