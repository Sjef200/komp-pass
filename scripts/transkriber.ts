import fs from "node:fs";
import path from "node:path";
import { dbSti } from "../mcp/src/db.ts";
import { lesBaseState } from "../mcp/src/fs-state.ts";
import {
  finnWhisper,
  indekserFil,
  opptakMappe,
  transkriberLyd,
  transkriptMappe,
  WHISPER_HJELP,
} from "../mcp/src/kilde-inntak.ts";
import { slugify } from "../src/lib/skill-import.ts";
import { erFagId } from "../src/lib/types.ts";

/**
 * Tar opp forelesningen inn i systemet: lydfil → lokalt transkript → biter i
 * databasen. Whisper kjører på maskinen din. Ingenting sendes ut.
 *
 *   npm run transkriber -- ~/mfl-data/opptak/uke36.m4a --fag male1 --tittel "Uke 36: utvalg"
 *
 * Kjøres den om igjen på samme fil, brukes transkriptet som allerede finnes.
 */

function parseArgs(argv: string[]): { lyd?: string; flagg: Record<string, string | undefined> } {
  const flagg: Record<string, string | undefined> = {};
  let lyd: string | undefined;
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i]!;
    if (a.startsWith("--")) {
      const verdi = argv[i + 1];
      if (verdi && !verdi.startsWith("--")) {
        flagg[a.slice(2)] = verdi;
        i += 1;
      } else {
        flagg[a.slice(2)] = "true";
      }
      continue;
    }
    lyd ??= a;
  }
  return { lyd, flagg };
}

async function main(): Promise<void> {
  const { lyd, flagg } = parseArgs(process.argv.slice(2));

  if (flagg.sjekk) {
    const whisper = finnWhisper();
    console.log(whisper ? `Fant ${whisper.kommando}.` : WHISPER_HJELP);
    console.log(`Opptak      ${opptakMappe()}`);
    console.log(`Transkript  ${transkriptMappe()}`);
    console.log(`Database    ${dbSti()}`);
    return;
  }

  if (!lyd) {
    console.error(`Oppgi lydfilen.

  npm run transkriber -- <lydfil> --fag <fagId> [--tittel "..."] [--dato ...] [--kapittel "..."]
  npm run transkriber -- --sjekk        # er whisper på plass?

Fag: ${lesBaseState().fag.map((f) => f.id).join(", ")}`);
    process.exit(1);
  }

  const lydfil = path.resolve(lyd);
  if (!fs.existsSync(lydfil)) {
    console.error(`Fant ikke lydfilen: ${lydfil}`);
    process.exit(1);
  }

  const fagId = flagg.fag ?? flagg.fagId;
  if (!fagId || !erFagId(fagId)) {
    console.error("--fag mangler eller er ukjent. En forelesning hører til ett fag.");
    process.exit(1);
  }

  const tittel = flagg.tittel ?? path.basename(lydfil, path.extname(lydfil));
  const id = flagg.id ?? `${fagId}-${slugify(tittel)}`;

  const transkript = transkriberLyd(lydfil, id);
  const { kilde, antallBiter } = await indekserFil({
    fil: transkript,
    fagId,
    type: "forelesning",
    tittel,
    dato: flagg.dato,
    kapittel: flagg.kapittel,
    id,
  });

  console.log(`\n${kilde.tittel} lagt inn med ${antallBiter} biter.`);
  console.log(`  transkript ${transkript}`);
  console.log(`  lesbar     ${path.join(transkriptMappe(), `${kilde.id}.md`)}`);
  console.log(`\nLydfilen ligger igjen der den var. Verken den eller transkriptet havner i git.`);
}

await main();
