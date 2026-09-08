import fs from "node:fs";
import os from "node:os";
import path from "node:path";

/**
 * Innloggingen mot Supabase, lagret utenfor repoet. Serveren opptrer som deg,
 * med et brukertoken — ikke med en secret key, som ville omgått RLS.
 */
export type Sesjon = {
  access_token: string;
  refresh_token: string;
  expires_at?: number;
  bruker?: string;
};

export function sesjonSti(): string {
  const fra = process.env.MFL_DATA?.trim();
  return path.join(fra ? fra : path.join(os.homedir(), "mfl-data"), "session.json");
}

export function lesSesjon(): Sesjon | null {
  const fil = sesjonSti();
  if (!fs.existsSync(fil)) return null;
  try {
    return JSON.parse(fs.readFileSync(fil, "utf8")) as Sesjon;
  } catch {
    return null;
  }
}

export function skrivSesjon(sesjon: Sesjon): void {
  const fil = sesjonSti();
  fs.mkdirSync(path.dirname(fil), { recursive: true });
  fs.writeFileSync(fil, `${JSON.stringify(sesjon, null, 2)}\n`, { mode: 0o600 });
}

export function slettSesjon(): void {
  const fil = sesjonSti();
  if (fs.existsSync(fil)) fs.rmSync(fil);
}
