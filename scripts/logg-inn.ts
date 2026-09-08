import { createClient } from "@supabase/supabase-js";
import readline from "node:readline";
import { Writable } from "node:stream";
import { lastEnv } from "../mcp/src/env.ts";
import { lesSesjon, sesjonSti, skrivSesjon, slettSesjon } from "../mcp/src/sesjon.ts";

/**
 * Logger MCP-serveren inn mot Supabase som deg.
 *
 *   npm run logg-inn          # logg inn
 *   npm run logg-inn -- --ny  # opprett konto først
 *   npm run logg-inn -- --ut  # glem sesjonen
 *   npm run logg-inn -- --hvem
 *
 * Passordet leses fra terminalen din og lagres aldri — bare tokenet blir
 * liggende, i ~/mfl-data/session.json med rettigheter 600, utenfor repoet.
 *
 * Serveren bruker den publiserbare nøkkelen og ditt eget token. Aldri en
 * secret key: den ville omgått RLS og gjort alle rader lesbare på tvers.
 */

lastEnv();

function sporr(spm: string, skjult = false): Promise<string> {
  const stum = new Writable({
    write(_chunk, _enc, cb) {
      cb();
    },
  });
  const rl = readline.createInterface({
    input: process.stdin,
    output: skjult ? stum : process.stdout,
    terminal: true,
  });
  return new Promise((resolve) => {
    if (skjult) process.stdout.write(spm);
    rl.question(skjult ? "" : spm, (svar) => {
      if (skjult) process.stdout.write("\n");
      rl.close();
      resolve(svar.trim());
    });
  });
}

function klient() {
  const url = process.env.SUPABASE_URL?.trim();
  const nokkel = process.env.SUPABASE_PUBLISHABLE_KEY?.trim();
  if (!url || !nokkel) {
    console.error("SUPABASE_URL og SUPABASE_PUBLISHABLE_KEY mangler i .env.local.");
    process.exit(1);
  }
  return createClient(url, nokkel, { auth: { persistSession: false } });
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.includes("--ut")) {
    slettSesjon();
    console.log("Sesjonen er slettet. MCP-serveren faller tilbake til lokal SQLite-modus.");
    return;
  }

  if (args.includes("--hvem")) {
    const sesjon = lesSesjon();
    if (!sesjon) {
      console.log("Ikke logget inn. Kjør npm run logg-inn.");
      return;
    }
    const { data, error } = await klient().auth.getUser(sesjon.access_token);
    if (error || !data.user) {
      console.log(`Sesjonen svarer ikke (${error?.message ?? "ukjent"}). Logg inn på nytt.`);
      return;
    }
    console.log(`Logget inn som ${data.user.email}`);
    console.log(`Sesjon: ${sesjonSti()}`);
    return;
  }

  const ny = args.includes("--ny");
  const epost = await sporr("E-post: ");
  const passord = await sporr("Passord: ", true);
  if (!epost || !passord) {
    console.error("Både e-post og passord må fylles ut.");
    process.exit(1);
  }

  const db = klient();
  const svar = ny
    ? await db.auth.signUp({ email: epost, password: passord })
    : await db.auth.signInWithPassword({ email: epost, password: passord });

  if (svar.error) {
    console.error(`Gikk ikke: ${svar.error.message}`);
    process.exit(1);
  }
  if (!svar.data.session) {
    console.log(
      "Kontoen er opprettet, men Supabase krever at du bekrefter e-posten før du kan logge inn.\nBekreft, og kjør deretter npm run logg-inn.",
    );
    return;
  }

  skrivSesjon({
    access_token: svar.data.session.access_token,
    refresh_token: svar.data.session.refresh_token,
    expires_at: svar.data.session.expires_at,
    bruker: svar.data.user?.email ?? epost,
  });

  console.log(`\nLogget inn som ${svar.data.user?.email ?? epost}.`);
  console.log(`Sesjon lagret i ${sesjonSti()} (rettigheter 600, utenfor repoet).`);
  console.log("MCP-serveren bruker nå Supabase. npm run logg-inn -- --ut går tilbake til lokal base.");
}

await main();
