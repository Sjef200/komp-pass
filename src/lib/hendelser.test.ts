import assert from "node:assert/strict";
import { test } from "node:test";
import { mergeHendelser } from "./ai-overlay.ts";
import {
  fagordHistorikk,
  fold,
  foldFagord,
  foldHoringer,
  horingTilHendelse,
  observerFagordIState,
  type FagordObservert,
  type Hendelse,
} from "./hendelser.ts";
import type { AppState, Fagord, FagordStatus, Horing } from "./types.ts";

function fagord(id: string, status: FagordStatus = "ny"): Fagord {
  return { id, term: id, forklaring: "", temaIds: ["def"], status };
}

function obs(
  id: string,
  fagordId: string,
  tid: string,
  status: FagordStatus,
  sisteFeil?: string,
): FagordObservert {
  return {
    id,
    type: "fagord-observert",
    tid,
    fagId: "male1",
    kilde: "ai",
    fagordId,
    status,
    ...(sisteFeil ? { sisteFeil } : {}),
  };
}

const HENDELSER: Hendelse[] = [
  obs("o1", "fo-a", "2026-08-01T10:00:00.000Z", "ny", "blandet med sekundærdata"),
  obs("o2", "fo-a", "2026-08-20T10:00:00.000Z", "usikker"),
  obs("o3", "fo-a", "2026-09-01T10:00:00.000Z", "sitter"),
  obs("o4", "fo-b", "2026-08-15T10:00:00.000Z", "usikker", "sa kvantitativ"),
];

test("siste observasjon bestemmer status", () => {
  const ut = foldFagord([fagord("fo-a"), fagord("fo-b")], HENDELSER);
  assert.equal(ut.find((f) => f.id === "fo-a")?.status, "sitter");
  assert.equal(ut.find((f) => f.id === "fo-b")?.status, "usikker");
});

test("foldet er uavhengig av rekkefølgen hendelsene kom inn i", () => {
  const base = [fagord("fo-a"), fagord("fo-b")];
  const framover = foldFagord(base, HENDELSER);
  const bakover = foldFagord(base, [...HENDELSER].reverse());
  const blandet = foldFagord(base, [HENDELSER[2]!, HENDELSER[0]!, HENDELSER[3]!, HENDELSER[1]!]);
  assert.deepEqual(framover, bakover);
  assert.deepEqual(framover, blandet);
});

test("seq fra databasen bryter lik tid før id gjør det", () => {
  const fraDb: Hendelse[] = [
    { ...obs("z", "fo-a", "2026-09-01T10:00:00.000Z", "ny"), seq: 2 },
    { ...obs("a", "fo-a", "2026-09-01T10:00:00.000Z", "sitter"), seq: 1 },
  ];
  const ut = foldFagord([fagord("fo-a")], fraDb);
  assert.equal(ut[0]?.status, "ny", "høyeste seq vinner, ikke høyeste id");
  assert.deepEqual(ut, foldFagord([fagord("fo-a")], [...fraDb].reverse()));
});

test("lik tid brytes på id, så foldet blir stabilt", () => {
  const samtidig: Hendelse[] = [
    obs("b", "fo-a", "2026-09-01T10:00:00.000Z", "sitter"),
    obs("a", "fo-a", "2026-09-01T10:00:00.000Z", "ny"),
  ];
  const ut = foldFagord([fagord("fo-a")], samtidig);
  const omvendt = foldFagord([fagord("fo-a")], [...samtidig].reverse());
  assert.equal(ut[0]?.status, "sitter", "høyeste id vinner ved lik tid");
  assert.deepEqual(ut, omvendt);
});

test("ingen observasjon går tapt", () => {
  const historikk = fagordHistorikk(HENDELSER, "fo-a");
  assert.equal(historikk.length, 3);
  assert.deepEqual(historikk.map((o) => o.id), ["o3", "o2", "o1"], "nyeste først");
});

test("en gammel feil overlever en nyere observasjon uten feil", () => {
  const ut = foldFagord([fagord("fo-a")], HENDELSER);
  assert.equal(ut[0]?.sisteFeil, "blandet med sekundærdata");
});

test("foldHoringer legger til uten å duplisere eller overskrive", () => {
  const eksisterende: Horing = {
    id: "h-1",
    temaId: "def",
    dato: "2026-01-01",
    karakter: 4,
    riktig: "",
    mangler: "",
    kilde: "selv",
  };
  const nyHoring: Horing = { ...eksisterende, id: "h-2", karakter: 6 };
  const hendelser = [
    horingTilHendelse({ ...eksisterende, karakter: 2 }, "male1"),
    horingTilHendelse(nyHoring, "male1"),
  ];
  const ut = foldHoringer([eksisterende], hendelser);
  assert.equal(ut.length, 2);
  assert.equal(ut.find((h) => h.id === "h-1")?.karakter, 4, "eksisterende høring er urørt");
  assert.equal(ut.find((h) => h.id === "h-2")?.karakter, 6);
});

test("mergeHendelser er union på id og gir kronologisk logg", () => {
  const merget = mergeHendelser([
    [HENDELSER[2]!, HENDELSER[0]!],
    [HENDELSER[0]!, HENDELSER[1]!],
    undefined,
  ]);
  assert.deepEqual(merget.map((h) => h.id), ["o1", "o2", "o3"]);
});

test("UI-skriving lager samme hendelsesform som MCP", () => {
  const start: AppState = {
    fag: [],
    kompetansemaal: [],
    temaer: [],
    kapitler: [],
    horinger: [],
    fagord: [fagord("fo-kvalitativ")],
    hendelser: [],
    koblinger: [],
    kilder: [],
    prompts: [],
    skills: [],
    innstillinger: { aktivtFag: "male1", visEmoji: true },
  };
  const etter = observerFagordIState(start, "fo-kvalitativ", "usikker", "blandet med kvantitativ");

  assert.equal(etter.hendelser.length, 1);
  const o = etter.hendelser[0]!;
  assert.equal(o.type, "fagord-observert");
  assert.equal(o.kilde, "selv");
  assert.equal(o.fagId, "male1");
  assert.equal(etter.fagord.find((f) => f.id === "fo-kvalitativ")?.status, "usikker");
  assert.equal(start.hendelser.length, 0, "utgangstilstanden er ikke mutert");

  const igjen = observerFagordIState(etter, "fo-kvalitativ", "sitter");
  assert.equal(igjen.hendelser.length, 2, "observasjonen legges til, den erstatter ikke");
  assert.equal(fagordHistorikk(igjen.hendelser, "fo-kvalitativ").length, 2);
});

test("fold gir både høringer og fagord i én operasjon", () => {
  const ut = fold({ horinger: [], fagord: [fagord("fo-a")] }, HENDELSER);
  assert.equal(ut.horinger.length, 0);
  assert.equal(ut.fagord[0]?.status, "sitter");
});
