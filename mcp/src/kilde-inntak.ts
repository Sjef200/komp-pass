import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { skrivKilde } from "./db.ts";
import { slugify } from "../../src/lib/skill-import.ts";
import {
  chunkSegmenter,
  chunkTekst,
  chunksTilMarkdown,
  parseVtt,
  parseWhisperJson,
  type Chunk,
  type Kildedokument,
  type KildeType,
} from "../../src/lib/kilder.ts";

/**
 * Lyd og transkripsjoner ligger utenfor repoet. Dette er lærerens stemme —
 * den skal ikke i git, og den skal ikke ut av maskinen.
 */
export function dataMappe(): string {
  const fra = process.env.MFL_DATA?.trim();
  return fra ? fra : path.join(os.homedir(), "mfl-data");
}

export function opptakMappe(): string {
  return path.join(dataMappe(), "opptak");
}

export function transkriptMappe(): string {
  return path.join(dataMappe(), "transkript");
}

export type WhisperKommando = { kommando: string; lagArgs: (lyd: string, ut: string) => string[] };

function finnes(kommando: string): boolean {
  try {
    execFileSync("command", ["-v", kommando], { stdio: "pipe", shell: "/bin/sh" });
    return true;
  } catch {
    return false;
  }
}

function modellSti(): string | null {
  const fra = process.env.WHISPER_MODELL?.trim();
  if (fra && fs.existsSync(fra)) return fra;
  const vanlige = [
    path.join(dataMappe(), "modeller", "ggml-large-v3-turbo.bin"),
    path.join(dataMappe(), "modeller", "ggml-medium.bin"),
    path.join(os.homedir(), "models", "ggml-medium.bin"),
  ];
  return vanlige.find((s) => fs.existsSync(s)) ?? null;
}

/** whisper.cpp først, så OpenAI-whisper. Begge kjører helt lokalt. */
export function finnWhisper(): WhisperKommando | null {
  for (const kommando of ["whisper-cli", "whisper-cpp", "main"]) {
    if (!finnes(kommando)) continue;
    const modell = modellSti();
    if (!modell) continue;
    return {
      kommando,
      lagArgs: (lyd, ut) => [
        "-m", modell,
        "-f", lyd,
        "-l", "no",
        "--output-json",
        "--output-file", ut.replace(/\.json$/, ""),
      ],
    };
  }
  if (finnes("whisper")) {
    return {
      kommando: "whisper",
      lagArgs: (lyd, ut) => [
        lyd,
        "--language", "Norwegian",
        "--model", process.env.WHISPER_MODELL?.trim() || "medium",
        "--output_format", "json",
        "--output_dir", path.dirname(ut),
      ],
    };
  }
  return null;
}

export const WHISPER_HJELP = `Fant ingen lokal whisper.

  brew install whisper-cpp
  mkdir -p ~/mfl-data/modeller
  curl -L -o ~/mfl-data/modeller/ggml-large-v3-turbo.bin \\
    https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-large-v3-turbo.bin

Eller «pip install openai-whisper». Sett WHISPER_MODELL hvis modellen ligger et annet sted.
Har du allerede et transkript, bruk «npm run indekser» i stedet.`;

/** Kjører whisper på lydfilen og returnerer stien til transkriptet. Idempotent. */
export function transkriberLyd(lydfil: string, kildeId: string): string {
  const whisper = finnWhisper();
  if (!whisper) throw new Error(WHISPER_HJELP);
  fs.mkdirSync(transkriptMappe(), { recursive: true });
  const ut = path.join(transkriptMappe(), `${kildeId}.json`);
  if (fs.existsSync(ut)) {
    console.log(`Transkript finnes allerede: ${ut}`);
    return ut;
  }
  console.log(`Transkriberer med ${whisper.kommando}. Dette tar tid.`);
  execFileSync(whisper.kommando, whisper.lagArgs(lydfil, ut), { stdio: "inherit" });
  if (!fs.existsSync(ut)) {
    const alternativ = path.join(
      transkriptMappe(),
      `${path.basename(lydfil, path.extname(lydfil))}.json`,
    );
    if (fs.existsSync(alternativ)) {
      fs.renameSync(alternativ, ut);
      return ut;
    }
    throw new Error(`Whisper skrev ikke ${ut}. Sjekk utdataene over.`);
  }
  return ut;
}

export function bitesFraFil(fil: string): Chunk[] {
  const raw = fs.readFileSync(fil, "utf8");
  const ext = path.extname(fil).toLowerCase();
  if (ext === ".json") return chunkSegmenter(parseWhisperJson(raw));
  if (ext === ".vtt" || ext === ".srt") return chunkSegmenter(parseVtt(raw));
  return chunkTekst(raw);
}

export type InntakOpts = {
  fil: string;
  fagId: string;
  type: KildeType;
  tittel?: string;
  dato?: string;
  kapittel?: string;
  id?: string;
};

function lagreKilde(
  chunks: Chunk[],
  meta: { id: string; fagId: string; type: KildeType; tittel: string; dato?: string; kapittel?: string; sti?: string },
): { kilde: Kildedokument; antallBiter: number } {
  if (chunks.length === 0) throw new Error("Ingen tekst å legge inn.");
  const kilde: Kildedokument = {
    id: meta.id,
    fagId: meta.fagId,
    type: meta.type,
    tittel: meta.tittel,
    dato: meta.dato ?? new Date().toISOString().slice(0, 10),
    ...(meta.sti ? { sti: meta.sti } : {}),
    ...(meta.kapittel ? { kapittel: meta.kapittel } : {}),
    lagtInn: new Date().toISOString(),
  };
  const antallBiter = skrivKilde(kilde, chunks);

  // En lesbar kopi ved siden av transkriptet, så du kan bla i det uten appen.
  fs.mkdirSync(transkriptMappe(), { recursive: true });
  fs.writeFileSync(
    path.join(transkriptMappe(), `${meta.id}.md`),
    chunksTilMarkdown(meta.tittel, chunks),
    "utf8",
  );
  return { kilde, antallBiter };
}

export function indekserFil(opts: InntakOpts): { kilde: Kildedokument; antallBiter: number } {
  if (!fs.existsSync(opts.fil)) throw new Error(`Fant ikke filen: ${opts.fil}`);
  const tittel = opts.tittel ?? path.basename(opts.fil, path.extname(opts.fil));
  return lagreKilde(bitesFraFil(opts.fil), {
    id: opts.id ?? `${opts.fagId}-${slugify(tittel)}`,
    fagId: opts.fagId,
    type: opts.type,
    tittel,
    dato: opts.dato,
    kapittel: opts.kapittel,
    sti: opts.fil,
  });
}

/**
 * Fagstoff limt inn i chatten. Samme lagring som en fil, men uten at teksten
 * må innom disk først — det er dette som gjør at du kan gi Claude et
 * bokkapittel direkte og bli hørt i det med én gang.
 */
export function indekserTekst(opts: {
  tekst: string;
  fagId: string;
  tittel: string;
  type?: KildeType;
  dato?: string;
  kapittel?: string;
  id?: string;
}): { kilde: Kildedokument; antallBiter: number } {
  const tekst = opts.tekst.trim();
  if (!tekst) throw new Error("Teksten er tom.");
  return lagreKilde(chunkTekst(tekst), {
    id: opts.id ?? `${opts.fagId}-${slugify(opts.tittel)}`,
    fagId: opts.fagId,
    type: opts.type ?? "notat",
    tittel: opts.tittel,
    dato: opts.dato,
    kapittel: opts.kapittel,
  });
}
