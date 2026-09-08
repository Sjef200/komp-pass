import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Nettleserklienten. Brukes av samtykkesiden, der du logger inn og
 * godkjenner at Claude får lese læringsdataene dine.
 *
 * Den publiserbare nøkkelen er ment å ligge i nettleseren — det er RLS som
 * beskytter radene, ikke nøkkelen.
 */
const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const nokkel = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;

export function harSupabase(): boolean {
  return Boolean(url && nokkel);
}

let klient: SupabaseClient | null = null;

export function supabase(): SupabaseClient {
  if (!url || !nokkel) {
    throw new Error(
      "VITE_SUPABASE_URL og VITE_SUPABASE_PUBLISHABLE_KEY mangler i .env.local.",
    );
  }
  klient ??= createClient(url, nokkel);
  return klient;
}
