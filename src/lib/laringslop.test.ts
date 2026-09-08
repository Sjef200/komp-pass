import assert from "node:assert/strict";
import { test } from "node:test";
import { laringslop, sorterEtterGap, sorterTemaEtterGap, tidslinje } from "./laringslop.ts";
import type { Hendelse, KoblingAvgjort, KoblingForeslatt } from "./hendelser.ts";
import type { AppState, Horing, Karakter } from "./types.ts";

const IDAG = "2026-09-07";

function tilstand(over: Partial<AppState> = {}): AppState {
  return {
    fag: [{ id: "male1", navn: "MFL1", kode: "SAM3045", emoji: "📊" }],
    kompetansemaal: [
      { id: "m-1", fagId: "male1", kortnavn: "mål 1", tekst: "", emoji: "📊" },
      { id: "m-2", fagId: "male1", kortnavn: "mål 2", tekst: "", emoji: "📊" },
    ],
    temaer: [
      { id: "t-1", fagId: "male1", navn: "tema 1", emoji: "🔍", maalIds: ["m-1"] },
      { id: "t-2", fagId: "male1", navn: "tema 2", emoji: "🎯", maalIds: ["m-2"] },
    ],
    kapitler: [],
    horinger: [],
    fagord: [],
    hendelser: [],
    koblinger: [],
    kilder: [],
    prompts: [],
    skills: [],
    innstillinger: { aktivtFag: "male1", visEmoji: true },
    ...over,
  };
}

function forelesning(id: string, dato: string) {
  return {
    id,
    fagId: "male1",
    type: "forelesning" as const,
    tittel: `Forelesning ${id}`,
    dato,
    lagtInn: dato,
  };
}

/** Et bekreftet forslag er to hendelser: forslaget, og avgjørelsen. */
function bekreftetKobling(koblingId: string, chunkId: string, temaId: string): Hendelse[] {
  const foreslatt: KoblingForeslatt = {
    id: `f-${koblingId}`,
    type: "kobling-foreslatt",
    tid: "2026-09-01T10:00:00.000Z",
    fagId: "male1",
    kilde: "ai",
    koblingId,
    chunkId,
    temaId,
  };
  const avgjort: KoblingAvgjort = {
    id: `a-${koblingId}`,
    type: "kobling-avgjort",
    tid: "2026-09-01T11:00:00.000Z",
    fagId: "male1",
    kilde: "selv",
    koblingId,
    bekreftet: true,
  };
  return [foreslatt, avgjort];
}

function horing(temaId: string, dato: string, karakter: Karakter): Horing {
  return { id: `h-${temaId}-${dato}`, temaId, dato, karakter, riktig: "", mangler: "", kilde: "selv" };
}

test("uten kilder og høringer er alt ikke gjennomgått", () => {
  const lop = laringslop(tilstand(), "male1", IDAG);
  assert.equal(lop.fordeling["ikke-undervist"], 2);
  assert.equal(lop.fordeling["undervist-ikke-hort"], 0);
});

test("en bekreftet kobling gjør målet undervist, men ikke hørt", () => {
  const state = tilstand({
    kilder: [forelesning("uke36", "2026-09-02")],
    hendelser: bekreftetKobling("k1", "uke36#0", "t-1"),
  });
  const lop = laringslop(state, "male1", IDAG);
  const m1 = lop.linjer.find((l) => l.maal.id === "m-1")!;
  assert.equal(m1.gap, "undervist-ikke-hort");
  assert.equal(m1.undervist.kilder.length, 1);
  assert.equal(m1.undervist.sist, "2026-09-02");
  assert.equal(m1.hortAntall, 0);
  assert.equal(lop.fordeling["undervist-ikke-hort"], 1, "bare målet kilden dekker");
});

test("et forslag som ikke er bekreftet gjør ingenting undervist", () => {
  const [foreslatt] = bekreftetKobling("k1", "uke36#0", "t-1");
  const state = tilstand({
    kilder: [forelesning("uke36", "2026-09-02")],
    hendelser: [foreslatt!],
  });
  const lop = laringslop(state, "male1", IDAG);
  assert.equal(lop.fordeling["undervist-ikke-hort"], 0);
  assert.equal(lop.fordeling["ikke-undervist"], 2);
});

test("gapet lukkes når du blir hørt i det som er gjennomgått", () => {
  const base = tilstand({
    kilder: [forelesning("uke36", "2026-09-02")],
    hendelser: bekreftetKobling("k1", "uke36#0", "t-1"),
  });
  assert.equal(laringslop(base, "male1", IDAG).fordeling["undervist-ikke-hort"], 1);

  const etter = { ...base, horinger: [horing("t-1", "2026-09-05", 5)] };
  const lop = laringslop(etter, "male1", IDAG);
  assert.equal(lop.fordeling["undervist-ikke-hort"], 0);
  const m1 = lop.linjer.find((l) => l.maal.id === "m-1")!;
  assert.equal(m1.gap, "sitter");
  assert.equal(m1.hortSist, "2026-09-05");
});

test("svak karakter og modenhet skilles fra hverandre", () => {
  const svak = tilstand({ horinger: [horing("t-1", "2026-09-06", 3)] });
  assert.equal(laringslop(svak, "male1", IDAG).linjer[0]?.gap, "hort-svak");

  const gammel = tilstand({ horinger: [horing("t-1", "2026-07-01", 5)] });
  assert.equal(laringslop(gammel, "male1", IDAG).linjer[0]?.gap, "moden");
});

test("sortering setter gjennomgått-men-ikke-hørt øverst", () => {
  const state = tilstand({
    kilder: [forelesning("uke36", "2026-09-02")],
    hendelser: bekreftetKobling("k1", "uke36#0", "t-2"),
    horinger: [horing("t-1", "2026-09-06", 3)],
  });
  const sortert = sorterEtterGap(laringslop(state, "male1", IDAG).linjer);
  assert.equal(sortert[0]?.maal.id, "m-2", "gjennomgått uten høring først");
  assert.equal(sortert[0]?.gap, "undervist-ikke-hort");
  assert.equal(sortert[1]?.gap, "hort-svak");
});

test("tidslinjen teller bare høringer etter at kilden ble gjennomgått", () => {
  const state = tilstand({
    kilder: [forelesning("uke36", "2026-09-02")],
    hendelser: bekreftetKobling("k1", "uke36#0", "t-1"),
    horinger: [horing("t-1", "2026-08-20", 4), horing("t-1", "2026-09-05", 5)],
  });
  const punkter = tidslinje(state, "male1");
  assert.equal(punkter.length, 1);
  assert.equal(punkter[0]?.hortEtter, 1, "høringen fra august teller ikke");
  assert.deepEqual(punkter[0]?.maal.map((m) => m.id), ["m-1"]);
});

test("temanivået fanger gapet der målnivået skjuler det", () => {
  // Begge temaene henger på samme mål. Kilden dekker bare tema 2.
  const state = tilstand({
    kompetansemaal: [{ id: "m-1", fagId: "male1", kortnavn: "mål 1", tekst: "", emoji: "📊" }],
    temaer: [
      { id: "t-1", fagId: "male1", navn: "tema 1", emoji: "🔍", maalIds: ["m-1"] },
      { id: "t-2", fagId: "male1", navn: "tema 2", emoji: "🎯", maalIds: ["m-1"] },
    ],
    kilder: [forelesning("uke36", "2026-09-02")],
    hendelser: bekreftetKobling("k1", "uke36#0", "t-2"),
    horinger: [horing("t-1", "2026-09-05", 5)],
  });
  const lop = laringslop(state, "male1", IDAG);

  assert.equal(lop.fordeling["undervist-ikke-hort"], 0, "målet ser dekket ut");
  assert.equal(lop.temaFordeling["undervist-ikke-hort"], 1, "temaet avslører gapet");

  const t2 = lop.temaLinjer.find((l) => l.tema.id === "t-2")!;
  assert.equal(t2.gap, "undervist-ikke-hort");
  assert.equal(t2.undervist.sist, "2026-09-02");
  assert.equal(t2.hortAntall, 0);
});

test("en kobling til et mål gjør ikke alle målets temaer undervist", () => {
  const foreslatt: KoblingForeslatt = {
    id: "f-k9",
    type: "kobling-foreslatt",
    tid: "2026-09-01T10:00:00.000Z",
    fagId: "male1",
    kilde: "ai",
    koblingId: "k9",
    chunkId: "uke36#0",
    maalId: "m-1",
  };
  const avgjort: KoblingAvgjort = {
    id: "a-k9",
    type: "kobling-avgjort",
    tid: "2026-09-01T11:00:00.000Z",
    fagId: "male1",
    kilde: "selv",
    koblingId: "k9",
    bekreftet: true,
  };
  const state = tilstand({
    kilder: [forelesning("uke36", "2026-09-02")],
    hendelser: [foreslatt, avgjort],
  });
  const lop = laringslop(state, "male1", IDAG);
  assert.equal(lop.fordeling["undervist-ikke-hort"], 1, "målet er undervist");
  assert.equal(
    lop.temaLinjer.find((l) => l.tema.id === "t-1")?.gap,
    "ikke-undervist",
    "temaet er ikke undervist av en kobling på målnivå",
  );
});

test("temaer sorteres med gjennomgått-men-ikke-hørt først", () => {
  const state = tilstand({
    kilder: [forelesning("uke36", "2026-09-02")],
    hendelser: bekreftetKobling("k1", "uke36#0", "t-2"),
    horinger: [horing("t-1", "2026-09-06", 2)],
  });
  const sortert = sorterTemaEtterGap(laringslop(state, "male1", IDAG).temaLinjer);
  assert.equal(sortert[0]?.tema.id, "t-2");
  assert.equal(sortert[1]?.gap, "hort-svak");
});
