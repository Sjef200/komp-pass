import { test } from "node:test";
import assert from "node:assert/strict";
import { grupperKapittel, grupperFagordEtterKapittel, kapitlerIFag, temaerIKapittel } from "./kapittel.ts";
import { maalDekning } from "./dekning.ts";
import type { AppState, Horing, Kompetansemaal, Tema } from "./types.ts";
import kapitlerJson from "../data/kapitler.json" with { type: "json" };
import temaerJson from "../data/temaer.json" with { type: "json" };

const temaer: Tema[] = [
  {
    id: "def",
    fagId: "male1",
    navn: "Definisjon",
    emoji: "",
    maalIds: ["male1-04"],
    kapittel: "Markedsundersøkelser",
  },
  {
    id: "obs",
    fagId: "male1",
    navn: "Observasjon",
    emoji: "",
    maalIds: ["male1-04", "male1-02"],
    kapittel: "Markedsundersøkelser",
  },
];

const maal: Kompetansemaal[] = [
  {
    id: "male1-04",
    fagId: "male1",
    kortnavn: "markedsundersøkelser",
    tekst: "bruke og utvikle markedsundersøkelser",
    emoji: "",
  },
  {
    id: "male1-02",
    fagId: "male1",
    kortnavn: "forbrukeratferd",
    tekst: "vurdere forbrukeratferd",
    emoji: "",
  },
  {
    id: "male1-08",
    fagId: "male1",
    kortnavn: "pris",
    tekst: "prisstrategier",
    emoji: "",
  },
];

const horinger: Horing[] = [
  {
    id: "h-1",
    temaId: "def",
    dato: "2026-09-01",
    karakter: 5,
    riktig: "",
    mangler: "",
    kilde: "selv",
  },
];

test("kapittel grupperer temaer og er ikke det samme som kompetansemål", () => {
  const grupper = grupperKapittel(temaer, horinger);
  assert.equal(grupper.length, 1);
  assert.equal(grupper[0]?.navn, "Markedsundersøkelser");
  assert.equal(grupper[0]?.temaer.length, 2);
  assert.notEqual(grupper[0]?.id, "male1-04");
});

test("kompetansemål dekkes av temaer, ikke av at kapittelet finnes", () => {
  const undersokelse = maalDekning(maal[0]!, temaer, horinger);
  const pris = maalDekning(maal[2]!, temaer, horinger);
  assert.equal(undersokelse.totaltTemaer, 2);
  assert.equal(undersokelse.status, "sterk");
  assert.equal(pris.totaltTemaer, 0);
  assert.equal(pris.status, "udekket");
});

test("seedede kapitler 1–6 for male1, temaer henger på kapittel 6", () => {
  const state = {
    kapitler: kapitlerJson,
    innstillinger: { aktivtFag: "male1", visEmoji: true },
    temaer: temaerJson as Tema[],
  } as AppState;
  const kapitler = kapitlerIFag(state, "male1");
  assert.equal(kapitler.length, 6);
  assert.equal(kapitler[0]?.id, "male1-k01");
  const k6 = kapitler.find((k) => k.nummer === 6);
  assert.equal(k6?.navn, "Markedsundersøkelser");
  assert.equal(k6?.sider?.fra, 117);
  const temaerI6 = temaerIKapittel(k6!, temaerJson as Tema[]);
  assert.equal(temaerI6.length, 13);
  assert.ok(temaerI6.some((t) => t.id === "def"));
});

test("ordbank grupperes per kapittel og totalt", () => {
  const kapitler = [
    { id: "k1", fagId: "male1" as const, nummer: 1, navn: "Ett", seksjoner: [], temaIds: ["t1"] },
    { id: "k2", fagId: "male1" as const, nummer: 2, navn: "To", seksjoner: [], temaIds: ["t2"] },
  ];
  const fagord = [
    { id: "fo-a", term: "A", forklaring: "", temaIds: ["t1"], status: "ny" as const },
    { id: "fo-b", term: "B", forklaring: "", temaIds: ["t2"], status: "ny" as const },
    { id: "fo-c", term: "C", forklaring: "", temaIds: ["t9"], status: "ny" as const },
  ];
  const grupper = grupperFagordEtterKapittel(fagord, kapitler);
  assert.equal(grupper.length, 3);
  assert.equal(grupper[0]?.kapittel?.id, "k1");
  assert.deepEqual(grupper[0]?.fagord.map((f) => f.id), ["fo-a"]);
  assert.equal(grupper[1]?.kapittel?.id, "k2");
  assert.equal(grupper[2]?.kapittel, null);
  assert.deepEqual(grupper[2]?.fagord.map((f) => f.id), ["fo-c"]);
});
