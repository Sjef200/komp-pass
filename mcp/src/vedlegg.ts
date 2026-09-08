import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { nyId } from "../../src/lib/format.ts";

function dataMappe(): string {
  const fra = process.env.MFL_DATA?.trim();
  if (fra) return fra;
  const db = process.env.MFL_DB?.trim();
  if (db) return path.dirname(path.resolve(db));
  return path.join(os.homedir(), "mfl-data");
}

const TILLATT: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".heic": "image/heic",
};

const MAKS_BYTE = 12 * 1024 * 1024;

export function vedleggRot(): string {
  return path.join(dataMappe(), "vedlegg");
}

export function mimeFraNavn(filnavn: string): string | null {
  const ext = path.extname(filnavn).toLowerCase();
  return TILLATT[ext] ?? null;
}

export function extFraMime(mime: string): string {
  if (mime === "image/jpeg") return ".jpg";
  if (mime === "image/png") return ".png";
  if (mime === "image/webp") return ".webp";
  if (mime === "image/gif") return ".gif";
  if (mime === "image/heic") return ".heic";
  return "";
}

function underData(abs: string): boolean {
  const rot = path.resolve(dataMappe());
  const mål = path.resolve(abs);
  return mål === rot || mål.startsWith(rot + path.sep);
}

export type LagretVedlegg = {
  vedleggId: string;
  filnavn: string;
  sti: string;
  mime: string;
};

/** Kopierer eller skriver et bilde inn under ~/mfl-data/vedlegg/{kapittelId}/. */
export function lagreVedleggFil(opts: {
  kapittelId: string;
  filnavn: string;
  mime?: string;
  kildeSti?: string;
  bytes?: Buffer;
}): LagretVedlegg {
  const filnavn = path.basename(opts.filnavn);
  const mime = opts.mime?.trim() || mimeFraNavn(filnavn);
  if (!mime) {
    throw new Error("Bare bildefiler: jpg, png, webp, gif eller heic.");
  }
  const ext = path.extname(filnavn).toLowerCase() || extFraMime(mime);
  if (!TILLATT[ext] && !extFraMime(mime)) {
    throw new Error("Ukjent bildeformat.");
  }
  const vedleggId = nyId("vedlegg");
  const rel = path.join(opts.kapittelId.replace(/[^a-z0-9-]/gi, ""), `${vedleggId}${ext || ".jpg"}`);
  const abs = path.join(vedleggRot(), rel);
  if (!underData(abs)) throw new Error("Ugyldig vedleggssti.");
  fs.mkdirSync(path.dirname(abs), { recursive: true });

  if (opts.bytes) {
    if (opts.bytes.length > MAKS_BYTE) throw new Error("Bildet er for stort (maks 12 MB).");
    fs.writeFileSync(abs, opts.bytes);
  } else if (opts.kildeSti) {
    const kilde = path.resolve(opts.kildeSti);
    if (!underData(kilde)) {
      throw new Error("Bildet må ligge under ~/mfl-data. Flytt det dit, eller last opp i appen.");
    }
    if (!fs.existsSync(kilde)) throw new Error(`Fant ikke fila: ${opts.kildeSti}`);
    const stat = fs.statSync(kilde);
    if (!stat.isFile()) throw new Error("Stien er ikke en fil.");
    if (stat.size > MAKS_BYTE) throw new Error("Bildet er for stort (maks 12 MB).");
    fs.copyFileSync(kilde, abs);
  } else {
    throw new Error("Mangler filinnhold.");
  }

  return { vedleggId, filnavn, sti: rel, mime };
}

export function lesVedleggFil(rel: string): { abs: string; bytes: Buffer } | null {
  const abs = path.resolve(vedleggRot(), rel);
  if (!underData(abs)) return null;
  if (!fs.existsSync(abs) || !fs.statSync(abs).isFile()) return null;
  return { abs, bytes: fs.readFileSync(abs) };
}
