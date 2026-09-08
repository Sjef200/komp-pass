import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import type { Hendelse } from "../../src/lib/hendelser.ts";
import { sokeord } from "../../src/lib/kilder.ts";
import type { Chunk, Kildedokument } from "../../src/lib/kilder.ts";

/**
 * Én databasefil, to prosesser. MCP-serveren og Vite-middlewaren åpner samme
 * fil i WAL-modus i stedet for å snakke gjennom en ekstra daemon. Det er
 * dette som gjør at UI og KI endelig ser de samme dataene.
 *
 * Filen ligger utenfor repoet, så læringsdataene dine ikke havner i git.
 */
export function dbSti(): string {
  const fra = process.env.MFL_DB?.trim();
  if (fra) return fra;
  return path.join(os.homedir(), "mfl-data", "mfl.db");
}

const SKJEMA = `
CREATE TABLE IF NOT EXISTS hendelse (
  seq   INTEGER PRIMARY KEY AUTOINCREMENT,
  id    TEXT NOT NULL UNIQUE,
  type  TEXT NOT NULL,
  tid   TEXT NOT NULL,
  fagId TEXT NOT NULL,
  kilde TEXT NOT NULL,
  data  TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS hendelse_type ON hendelse (type);
CREATE INDEX IF NOT EXISTS hendelse_fag ON hendelse (fagId, tid);

CREATE TABLE IF NOT EXISTS kilde (
  id       TEXT PRIMARY KEY,
  fagId    TEXT NOT NULL,
  type     TEXT NOT NULL,
  tittel   TEXT NOT NULL,
  dato     TEXT NOT NULL,
  sti      TEXT,
  kapittel TEXT,
  lagtInn  TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS kilde_fag ON kilde (fagId, dato);

CREATE TABLE IF NOT EXISTS kilde_chunk (
  id      TEXT PRIMARY KEY,
  kildeId TEXT NOT NULL REFERENCES kilde(id) ON DELETE CASCADE,
  ord     INTEGER NOT NULL,
  start   REAL,
  slutt   REAL,
  side    INTEGER,
  tekst   TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS chunk_kilde ON kilde_chunk (kildeId, ord);

CREATE VIRTUAL TABLE IF NOT EXISTS chunk_fts USING fts5(
  chunkId UNINDEXED,
  kildeId UNINDEXED,
  tekst,
  tokenize = "unicode61 remove_diacritics 0"
);
`;

let apen: { sti: string; db: DatabaseSync } | null = null;

export function apneDb(): DatabaseSync {
  const sti = dbSti();
  if (apen && apen.sti === sti) return apen.db;
  if (apen) apen.db.close();

  fs.mkdirSync(path.dirname(sti), { recursive: true });
  const db = new DatabaseSync(sti);
  db.exec("PRAGMA journal_mode = WAL");
  db.exec("PRAGMA busy_timeout = 4000");
  db.exec(SKJEMA);
  apen = { sti, db };
  return db;
}

export function lukkDb(): void {
  apen?.db.close();
  apen = null;
}

type Rad = { seq: number; data: string };

function tilHendelse(rad: Rad): Hendelse {
  return { ...(JSON.parse(rad.data) as Hendelse), seq: rad.seq };
}

/** Hele loggen, kronologisk. `seq` bryter lik tid, så rekkefølgen er entydig. */
export function lesHendelser(): Hendelse[] {
  const rader = apneDb()
    .prepare("SELECT seq, data FROM hendelse ORDER BY tid, seq")
    .all() as unknown as Rad[];
  return rader.map(tilHendelse);
}

export function lesHendelserForFag(fagId: string): Hendelse[] {
  const rader = apneDb()
    .prepare("SELECT seq, data FROM hendelse WHERE fagId = ? ORDER BY tid, seq")
    .all(fagId) as unknown as Rad[];
  return rader.map(tilHendelse);
}

/** Append-only: en id som allerede finnes røres ikke. Returnerer raden slik den ligger. */
export function skrivHendelse(hendelse: Hendelse): Hendelse {
  const db = apneDb();
  const { seq: _ignorert, ...uten } = hendelse;
  db.prepare(
    "INSERT OR IGNORE INTO hendelse (id, type, tid, fagId, kilde, data) VALUES (?, ?, ?, ?, ?, ?)",
  ).run(
    hendelse.id,
    hendelse.type,
    hendelse.tid,
    hendelse.fagId,
    hendelse.kilde,
    JSON.stringify(uten),
  );
  const rad = db
    .prepare("SELECT seq, data FROM hendelse WHERE id = ?")
    .get(hendelse.id) as unknown as Rad | undefined;
  return rad ? tilHendelse(rad) : hendelse;
}

export function skrivHendelser(hendelser: Hendelse[]): number {
  const db = apneDb();
  const for_ = antallHendelser();
  db.exec("BEGIN");
  try {
    for (const h of hendelser) skrivHendelse(h);
    db.exec("COMMIT");
  } catch (e) {
    db.exec("ROLLBACK");
    throw e;
  }
  return antallHendelser() - for_;
}

export function antallHendelser(): number {
  const rad = apneDb().prepare("SELECT COUNT(*) AS n FROM hendelse").get() as
    | { n: number }
    | undefined;
  return rad?.n ?? 0;
}

/** Høyeste sekvensnummer. Brukes til å oppdage at en annen prosess har skrevet. */
export function sisteSeq(): number {
  const rad = apneDb().prepare("SELECT MAX(seq) AS s FROM hendelse").get() as
    | { s: number | null }
    | undefined;
  return rad?.s ?? 0;
}

// ── Kilder: forelesninger, bok, oppgaver ────────────────────────────────────

type KildeRad = {
  id: string;
  fagId: string;
  type: string;
  tittel: string;
  dato: string;
  sti: string | null;
  kapittel: string | null;
  lagtInn: string;
};

function tilKilde(rad: KildeRad): Kildedokument {
  return {
    id: rad.id,
    fagId: rad.fagId,
    type: rad.type as Kildedokument["type"],
    tittel: rad.tittel,
    dato: rad.dato,
    ...(rad.sti ? { sti: rad.sti } : {}),
    ...(rad.kapittel ? { kapittel: rad.kapittel } : {}),
    lagtInn: rad.lagtInn,
  };
}

export function lesKilder(fagId?: string, type?: string): Kildedokument[] {
  const db = apneDb();
  const betingelser: string[] = [];
  const args: string[] = [];
  if (fagId) {
    betingelser.push("fagId = ?");
    args.push(fagId);
  }
  if (type) {
    betingelser.push("type = ?");
    args.push(type);
  }
  const hvor = betingelser.length ? `WHERE ${betingelser.join(" AND ")}` : "";
  const rader = db
    .prepare(`SELECT * FROM kilde ${hvor} ORDER BY dato DESC, id`)
    .all(...args) as unknown as KildeRad[];
  return rader.map(tilKilde);
}

export function lesKilde(id: string): Kildedokument | null {
  const rad = apneDb().prepare("SELECT * FROM kilde WHERE id = ?").get(id) as
    | unknown as KildeRad
    | undefined;
  return rad ? tilKilde(rad) : null;
}

export type ChunkRad = Chunk & { id: string; kildeId: string };

function tilChunk(rad: Record<string, unknown>): ChunkRad {
  return {
    id: String(rad.id),
    kildeId: String(rad.kildeId),
    ord: Number(rad.ord),
    ...(rad.start != null ? { start: Number(rad.start) } : {}),
    ...(rad.slutt != null ? { slutt: Number(rad.slutt) } : {}),
    ...(rad.side != null ? { side: Number(rad.side) } : {}),
    tekst: String(rad.tekst),
  };
}

export function lesChunks(kildeId: string, fra?: number, til?: number): ChunkRad[] {
  const db = apneDb();
  const betingelser = ["kildeId = ?"];
  const args: (string | number)[] = [kildeId];
  if (fra != null) {
    betingelser.push("(slutt IS NULL OR slutt >= ?)");
    args.push(fra);
  }
  if (til != null) {
    betingelser.push("(start IS NULL OR start <= ?)");
    args.push(til);
  }
  const rader = db
    .prepare(`SELECT * FROM kilde_chunk WHERE ${betingelser.join(" AND ")} ORDER BY ord`)
    .all(...args) as unknown as Record<string, unknown>[];
  return rader.map(tilChunk);
}

export function lesChunk(id: string): ChunkRad | null {
  const rad = apneDb().prepare("SELECT * FROM kilde_chunk WHERE id = ?").get(id) as
    | Record<string, unknown>
    | undefined;
  return rad ? tilChunk(rad) : null;
}

/** Skriver kilde og biter i én transaksjon. En kilde som finnes fra før erstattes. */
export function skrivKilde(kilde: Kildedokument, chunks: Chunk[]): number {
  const db = apneDb();
  db.exec("BEGIN");
  try {
    db.prepare("DELETE FROM chunk_fts WHERE kildeId = ?").run(kilde.id);
    db.prepare("DELETE FROM kilde_chunk WHERE kildeId = ?").run(kilde.id);
    db.prepare(
      `INSERT INTO kilde (id, fagId, type, tittel, dato, sti, kapittel, lagtInn)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         fagId = excluded.fagId, type = excluded.type, tittel = excluded.tittel,
         dato = excluded.dato, sti = excluded.sti, kapittel = excluded.kapittel`,
    ).run(
      kilde.id,
      kilde.fagId,
      kilde.type,
      kilde.tittel,
      kilde.dato,
      kilde.sti ?? null,
      kilde.kapittel ?? null,
      kilde.lagtInn,
    );
    const settChunk = db.prepare(
      "INSERT INTO kilde_chunk (id, kildeId, ord, start, slutt, side, tekst) VALUES (?, ?, ?, ?, ?, ?, ?)",
    );
    const settFts = db.prepare("INSERT INTO chunk_fts (chunkId, kildeId, tekst) VALUES (?, ?, ?)");
    for (const c of chunks) {
      const chunkId = `${kilde.id}#${c.ord}`;
      settChunk.run(
        chunkId,
        kilde.id,
        c.ord,
        c.start ?? null,
        c.slutt ?? null,
        c.side ?? null,
        c.tekst,
      );
      settFts.run(chunkId, kilde.id, c.tekst);
    }
    db.exec("COMMIT");
  } catch (e) {
    db.exec("ROLLBACK");
    throw e;
  }
  return chunks.length;
}

export function slettKilde(id: string): boolean {
  const db = apneDb();
  db.exec("BEGIN");
  try {
    db.prepare("DELETE FROM chunk_fts WHERE kildeId = ?").run(id);
    db.prepare("DELETE FROM kilde_chunk WHERE kildeId = ?").run(id);
    const res = db.prepare("DELETE FROM kilde WHERE id = ?").run(id);
    db.exec("COMMIT");
    return Number(res.changes) > 0;
  } catch (e) {
    db.exec("ROLLBACK");
    throw e;
  }
}

export type Treff = ChunkRad & { kilde: Kildedokument; utdrag: string };

/** Fritekst til FTS5-uttrykk. Fyllord er luket bort, lange ord får prefikstreff. */
export function ftsUttrykk(query: string): string {
  const ord = sokeord(query);
  if (ord.length === 0) return "";
  return ord
    .map((o) => {
      const rent = o.replaceAll('"', "");
      return o.length >= 6 ? `"${rent}"*` : `"${rent}"`;
    })
    .join(" OR ");
}

export function sokChunks(query: string, fagId?: string, antall = 8): Treff[] {
  const uttrykk = ftsUttrykk(query);
  if (!uttrykk) return [];
  const db = apneDb();
  const args: (string | number)[] = [uttrykk];
  let hvor = "chunk_fts MATCH ?";
  if (fagId) {
    hvor += " AND k.fagId = ?";
    args.push(fagId);
  }
  args.push(antall);
  const rader = db
    .prepare(
      `SELECT c.*, snippet(chunk_fts, 2, '«', '»', ' … ', 18) AS utdrag
       FROM chunk_fts
       JOIN kilde_chunk c ON c.id = chunk_fts.chunkId
       JOIN kilde k ON k.id = c.kildeId
       WHERE ${hvor}
       ORDER BY bm25(chunk_fts) LIMIT ?`,
    )
    .all(...args) as unknown as Record<string, unknown>[];
  return rader.flatMap((rad) => {
    const kilde = lesKilde(String(rad.kildeId));
    if (!kilde) return [];
    return [{ ...tilChunk(rad), kilde, utdrag: String(rad.utdrag ?? "") }];
  });
}
