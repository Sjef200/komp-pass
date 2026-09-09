import { supabase } from "./supabase";
import { nyId } from "./format";
import type { Hendelse } from "./hendelser";
export const VEDLEGG_BUCKET = "laeringsvedlegg";
export function sjekkFil(fil: File) {
  const tillatt = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/heic", "application/pdf"];
  const mime = fil.type || (fil.name.toLowerCase().endsWith(".pdf") ? "application/pdf" : fil.name.toLowerCase().endsWith(".heic") ? "image/heic" : "");
  if (!tillatt.includes(mime)) throw new Error("Velg foto (JPEG, PNG, WebP, GIF, HEIC) eller PDF.");
  if (fil.size > (mime === "application/pdf" ? 25 : 12) * 1024 * 1024) throw new Error("Filen er for stor: maks 12 MB for foto og 25 MB for PDF.");
  return mime;
}
export async function lastOppVedlegg(fil: File, fagId: string, kapittelId: string, sky: boolean, lagre: (h: Hendelse[]) => Promise<void>) {
  const mime = sjekkFil(fil);
  if (!sky) {
    const res = await fetch("/api/vedlegg", { method: "POST", headers: { "Content-Type": mime, "X-Kapittel-Id": kapittelId, "X-Fag-Id": fagId, "X-Filnavn": encodeURIComponent(fil.name) }, body: fil });
    const data = await res.json(); if (!res.ok) throw new Error(data.error ?? "Kunne ikke laste opp."); return;
  }
  const db = supabase(); const { data: { user } } = await db.auth.getUser(); if (!user) throw new Error("Logg inn på nytt.");
  const vedleggId = nyId("vedlegg"); const sti = `${user.id}/${kapittelId}/${vedleggId}`;
  const { error } = await db.storage.from(VEDLEGG_BUCKET).upload(sti, fil, { contentType: mime, upsert: false });
  if (error) throw new Error(error.message);
  try { await lagre([{ id: nyId("vedlegg-h"), tid: new Date().toISOString(), type: "kapittel-vedlegg", fagId, kilde: "selv", kapittelId, vedleggId, filnavn: fil.name, mime, sti, lager: "sky", byte: fil.size }]); }
  catch (e) { await db.storage.from(VEDLEGG_BUCKET).remove([sti]); throw e; }
}
export async function vedleggUrl(v: { vedleggId: string; sti: string; lager?: string }) {
  if (v.lager !== "sky") return `/api/vedlegg/${encodeURIComponent(v.vedleggId)}`;
  const { data, error } = await supabase().storage.from(VEDLEGG_BUCKET).createSignedUrl(v.sti, 300);
  if (error || !data) throw new Error(error?.message ?? "Kunne ikke hente vedlegget."); return data.signedUrl;
}
