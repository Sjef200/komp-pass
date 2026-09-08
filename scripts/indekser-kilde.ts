import path from "node:path";
import { dbSti } from "../mcp/src/db.ts";
import { indekserFil, transkriptMappe } from "../mcp/src/kilde-inntak.ts";
import { lesBaseState } from "../mcp/src/fs-state.ts";
import { erKildeType, KILDE_TYPER, tidsstempel } from "../src/lib/kilder.ts";
import { erFagId } from "../src/lib/types.ts";

/**
 * Legger en ferdig tekst inn som kilde: transkript fra whisper (.json),
 * undertekster (.vtt, .srt) eller løpende tekst fra boka (.md, .txt).
 *
 *   npm run indekser -- ~/mfl-data/transkript/uke36.json --fag male1 --tittel "Uke 36"
 *   npm run indekser -- ~/notater/kap3.md --fag male1 --type bok --kapittel "Markedsundersøkelser"
 */

type Flagg = Record<string, string | undefined>;

function parseArgs(argv: string[]): { fil?: string; flagg: Flagg } {
  const flagg: Flagg = {};
  let fil: string | undefined;
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i]!;
    if (a.startsWith("--")) {
      const navn = a.slice(2);
      const verdi = argv[i + 1];
      if (verdi && !verdi.startsWith("--")) {
        flagg[navn] = verdi;
        i += 1;
      } else {
        flagg[navn] = "true";
      }
      continue;
    }
    fil ??= a;
  }
  return { fil, flagg };
}

function brukVeiledning(melding: string): never {
  console.error(`${melding}

  npm run indekser -- <fil> --fag <fagId> [--type ${KILDE_TYPER.join("|")}]
                     [--tittel "..."] [--dato 2026-09-07] [--kapittel "..."] [--id ...]

Fag: ${lesBaseState().fag.map((f) => f.id).join(", ")}`);
  process.exit(1);
}

function main(): void {
  const { fil, flagg } = parseArgs(process.argv.slice(2));
  if (!fil) brukVeiledning("Oppgi filen som skal legges inn.");

  const fagId = flagg.fag ?? flagg.fagId;
  if (!fagId) brukVeiledning("--fag mangler. Kilder hører til ett fag.");
  if (!erFagId(fagId)) brukVeiledning(`Ukjent fagId: ${fagId}`);

  const type = flagg.type ?? "forelesning";
  if (!erKildeType(type)) brukVeiledning(`Ukjent type: ${type}`);

  const { kilde, antallBiter } = indekserFil({
    fil: path.resolve(fil),
    fagId,
    type,
    tittel: flagg.tittel,
    dato: flagg.dato,
    kapittel: flagg.kapittel,
    id: flagg.id,
  });

  console.log(`\n${kilde.tittel}`);
  console.log(`  id       ${kilde.id}`);
  console.log(`  fag      ${kilde.fagId} · ${kilde.type}${kilde.kapittel ? ` · ${kilde.kapittel}` : ""}`);
  console.log(`  biter    ${antallBiter}`);
  console.log(`  lesbar   ${path.join(transkriptMappe(), `${kilde.id}.md`)}`);
  console.log(`  database ${dbSti()}`);
  console.log(`\nSøk med sok_kilder, eller be Claude om belegg med finn_belegg.`);
  if (antallBiter > 0) {
    console.log(`Første bit starter på ${tidsstempel(0)}.`);
  }
}

main();
