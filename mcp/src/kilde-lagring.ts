import { skrivKilde } from "./db.ts";
import { slugify } from "../../src/lib/skill-import.ts";
import { chunkTekst, type Chunk, type KildeType, type Kildedokument } from "../../src/lib/kilder.ts";

/**
 * Å lagre en kilde krever ingen disk — bare databasen. Derfor bor dette her
 * og ikke i kilde-inntak.ts, som trenger node:child_process til whisper og
 * unzip og aldri kan kjøre på en Worker.
 */
export type KildeMeta = {
  id: string;
  fagId: string;
  type: KildeType;
  tittel: string;
  dato?: string;
  kapittel?: string;
  sti?: string;
};

export function byggKilde(meta: KildeMeta): Kildedokument {
  return {
    id: meta.id,
    fagId: meta.fagId,
    type: meta.type,
    tittel: meta.tittel,
    dato: meta.dato ?? new Date().toISOString().slice(0, 10),
    ...(meta.sti ? { sti: meta.sti } : {}),
    ...(meta.kapittel ? { kapittel: meta.kapittel } : {}),
    lagtInn: new Date().toISOString(),
  };
}

export async function lagreChunks(
  chunks: Chunk[],
  meta: KildeMeta,
): Promise<{ kilde: Kildedokument; antallBiter: number }> {
  if (chunks.length === 0) throw new Error("Ingen tekst å legge inn.");
  const kilde = byggKilde(meta);
  return { kilde, antallBiter: await skrivKilde(kilde, chunks) };
}

/** Fagstoff limt inn i chatten. Ingen fil innom disk. */
export async function indekserTekst(opts: {
  tekst: string;
  fagId: string;
  tittel: string;
  type?: KildeType;
  dato?: string;
  kapittel?: string;
  id?: string;
}): Promise<{ kilde: Kildedokument; antallBiter: number }> {
  const tekst = opts.tekst.trim();
  if (!tekst) throw new Error("Teksten er tom.");
  return lagreChunks(chunkTekst(tekst), {
    id: opts.id ?? `${opts.fagId}-${slugify(opts.tittel)}`,
    fagId: opts.fagId,
    type: opts.type ?? "notat",
    tittel: opts.tittel,
    dato: opts.dato,
    kapittel: opts.kapittel,
  });
}
