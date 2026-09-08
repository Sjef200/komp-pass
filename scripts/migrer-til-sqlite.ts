import fs from "node:fs";
import path from "node:path";
import { antallHendelser, dbSti, skrivHendelser } from "../mcp/src/db.ts";
import { lesBaseState, repoRot } from "../mcp/src/fs-state.ts";
import { horingTilHendelse, type FagordObservert, type Hendelse } from "../src/lib/hendelser.ts";
import type { AiOverlay, Fagord, Horing, PersistedState } from "../src/lib/types.ts";

/**
 * Flytter læringsdata fra JSON-lagene inn i databasen. Kjøres om igjen uten
 * skade: hendelser er append-only på id, så en id som allerede finnes røres ikke.
 *
 *   npm run migrer                          # ai-overlay.json
 *   npm run migrer -- ~/mfl-tilstand.json   # og en eksportfil fra UI
 */

function lesJson<T>(fil: string): T | null {
  if (!fs.existsSync(fil)) return null;
  try {
    return JSON.parse(fs.readFileSync(fil, "utf8")) as T;
  } catch (e) {
    console.error(`Kunne ikke lese ${fil}: ${e instanceof Error ? e.message : e}`);
    return null;
  }
}

function fagIdForTema(temaId: string, temaer: { id: string; fagId: string }[]): string | null {
  return temaer.find((t) => t.id === temaId)?.fagId ?? null;
}

function horingerTilHendelser(
  horinger: Horing[],
  temaer: { id: string; fagId: string }[],
  kjente: Set<string>,
): { hendelser: Hendelse[]; hoppet: string[] } {
  const hendelser: Hendelse[] = [];
  const hoppet: string[] = [];
  for (const h of horinger) {
    if (kjente.has(h.id)) continue;
    const fagId = fagIdForTema(h.temaId, temaer);
    if (!fagId) {
      hoppet.push(`${h.id} (ukjent tema ${h.temaId})`);
      continue;
    }
    hendelser.push(horingTilHendelse(h, fagId));
  }
  return { hendelser, hoppet };
}

/** Gamle fagord-rader var overskrivinger. Hver blir én observasjon med stabil id. */
function fagordTilObservasjoner(
  fagord: Fagord[],
  base: Fagord[],
  temaer: { id: string; fagId: string }[],
): Hendelse[] {
  const ut: Hendelse[] = [];
  for (const f of fagord) {
    const original = base.find((b) => b.id === f.id);
    if (original && original.status === f.status && !f.ai) continue;
    const fagId = f.temaIds.map((t) => fagIdForTema(t, temaer)).find(Boolean);
    if (!fagId) continue;
    const observasjon: FagordObservert = {
      id: `fo-obs-migrert-${f.id}`,
      type: "fagord-observert",
      tid: "2026-01-01T00:00:00.000Z",
      fagId,
      kilde: f.ai ? "ai" : "selv",
      ...(f.ai ? { ai: f.ai } : {}),
      fagordId: f.id,
      status: f.status,
      ...(f.sisteFeil ? { sisteFeil: f.sisteFeil } : {}),
    };
    ut.push(observasjon);
  }
  return ut;
}

function main(): void {
  const base = lesBaseState();
  const temaer = base.temaer.map((t) => ({ id: t.id, fagId: t.fagId }));
  const kjenteHoringer = new Set(base.horinger.map((h) => h.id));

  const kilder: { navn: string; horinger: Horing[]; fagord: Fagord[]; hendelser: Hendelse[] }[] = [];

  const overlayFil = path.join(repoRot(), "src", "data", "ai-overlay.json");
  const overlay = lesJson<AiOverlay>(overlayFil);
  if (overlay) {
    kilder.push({
      navn: "ai-overlay.json",
      horinger: overlay.horinger ?? [],
      fagord: overlay.fagord ?? [],
      hendelser: overlay.hendelser ?? [],
    });
  }

  for (const arg of process.argv.slice(2)) {
    const fil = path.resolve(arg);
    const eksport = lesJson<PersistedState>(fil);
    if (!eksport) {
      console.error(`Hopper over ${fil}.`);
      continue;
    }
    kilder.push({
      navn: path.basename(fil),
      horinger: eksport.horinger ?? [],
      fagord: eksport.fagord ?? [],
      hendelser: eksport.hendelser ?? [],
    });
  }

  const alle: Hendelse[] = [];
  for (const kilde of kilder) {
    const { hendelser, hoppet } = horingerTilHendelser(kilde.horinger, temaer, kjenteHoringer);
    const observasjoner = fagordTilObservasjoner(kilde.fagord, base.fagord, temaer);
    alle.push(...hendelser, ...observasjoner, ...kilde.hendelser);
    console.log(
      `${kilde.navn}: ${hendelser.length} høringer, ${observasjoner.length} fagord-observasjoner, ${kilde.hendelser.length} hendelser`,
    );
    for (const h of hoppet) console.log(`  hoppet over ${h}`);
  }

  const for_ = antallHendelser();
  const nye = skrivHendelser(alle);
  console.log(`\nDatabase: ${dbSti()}`);
  console.log(`${for_} hendelser fra før, ${nye} nye, ${antallHendelser()} totalt.`);
  if (nye === 0 && alle.length > 0) {
    console.log("Alt lå der allerede. Migreringen kan kjøres om igjen uten skade.");
  }
}

main();
