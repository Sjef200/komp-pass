import assert from "node:assert/strict";
import { test } from "node:test";
import { dagerSiden, erModen } from "./dekning.ts";
import { nesteTemaer, prioritet } from "./planlegging.ts";
import type { Horing, Karakter, Tema } from "./types.ts";

const IDAG = "2026-09-07";

function tema(id: string, kapittel: string): Tema {
  return { id, fagId: "male1", navn: id, emoji: "📊", maalIds: ["male1-04"], kapittel };
}

function horing(temaId: string, dato: string, karakter: Karakter): Horing {
  return { id: `h-${temaId}-${dato}`, temaId, dato, karakter, riktig: "", mangler: "", kilde: "selv" };
}

/** Dato som ligger `n` dager før IDAG. */
function forDager(n: number): string {
  const d = new Date(`${IDAG}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() - n);
  return d.toISOString().slice(0, 10);
}

test("dagerSiden teller hele dager, også over månedsskifte", () => {
  assert.equal(dagerSiden(IDAG, IDAG), 0);
  assert.equal(dagerSiden("2026-09-01", IDAG), 6);
  assert.equal(dagerSiden("2026-08-07", IDAG), 31);
});

test("erModen følger karakteren: svakt kommer raskt tilbake, sterkt holder lenger", () => {
  assert.equal(erModen(null, null), true, "aldri hørt er alltid modent");
  assert.equal(erModen(3, 5), true);
  assert.equal(erModen(3, 4), false);
  assert.equal(erModen(6, 30), true);
  assert.equal(erModen(6, 29), false);
});

test("uhørt tema står først i køen", () => {
  const temaer = [tema("a1", "A"), tema("a2", "A"), tema("b1", "B")];
  const horinger = [horing("a1", IDAG, 6), horing("b1", IDAG, 3)];
  const ko = nesteTemaer(temaer, horinger, IDAG);
  assert.equal(ko[0]?.tema.id, "a2");
  assert.equal(ko[0]?.grunn, "aldri hørt");
});

test("to temaer fra samme kapittel kommer ikke rett etter hverandre", () => {
  const temaer = [tema("a1", "A"), tema("a2", "A"), tema("b1", "B")];
  const horinger = [horing("a1", IDAG, 6), horing("b1", IDAG, 3)];
  const ko = nesteTemaer(temaer, horinger, IDAG);
  const kapitler = ko.map((p) => p.tema.kapittel);
  assert.equal(kapitler.length, 3);
  for (let i = 1; i < kapitler.length; i += 1) {
    assert.notEqual(kapitler[i], kapitler[i - 1], `plass ${i} gjentar kapittelet`);
  }
});

test("svakt slår sterkt når begge er like ferske", () => {
  const temaer = [tema("sterk", "A"), tema("svak", "B")];
  const horinger = [horing("sterk", IDAG, 6), horing("svak", IDAG, 3)];
  const ko = nesteTemaer(temaer, horinger, IDAG);
  assert.equal(ko[0]?.tema.id, "svak");
});

test("sterkt tema som har stått lenge går forbi et svakt du nettopp hørte", () => {
  const temaer = [tema("gammel-sekser", "A"), tema("fersk-treer", "B")];
  const horinger = [
    horing("gammel-sekser", forDager(60), 6),
    horing("fersk-treer", forDager(1), 3),
  ];
  const ko = nesteTemaer(temaer, horinger, IDAG);
  assert.equal(ko[0]?.tema.id, "gammel-sekser");
  assert.match(ko[0]?.grunn ?? "", /moden/);
});

test("køen endrer seg når temaet er hørt", () => {
  const temaer = [tema("a1", "A"), tema("b1", "B")];
  const for_ = [horing("a1", forDager(30), 3), horing("b1", forDager(2), 5)];
  const forst = nesteTemaer(temaer, for_, IDAG);
  assert.equal(forst[0]?.tema.id, "a1");

  const etter = nesteTemaer(temaer, [...for_, horing("a1", IDAG, 5)], IDAG);
  assert.equal(etter[0]?.tema.id, "b1", "a1 skal ikke komme først rett etter at den er hørt");
});

test("prioritet rapporterer alder og modenhet for ett tema", () => {
  const p = prioritet(tema("a1", "A"), [horing("a1", forDager(20), 4)], IDAG);
  assert.equal(p.karakter, 4);
  assert.equal(p.dagerSiden, 20);
  assert.equal(p.moden, true);
  assert.match(p.grunn, /ikke hørt på 20 dager/);
});

test("antall begrenser køen uten å endre rekkefølgen", () => {
  const temaer = [tema("a1", "A"), tema("b1", "B"), tema("c1", "C")];
  const horinger = [horing("a1", IDAG, 2), horing("b1", IDAG, 4), horing("c1", IDAG, 6)];
  const hele = nesteTemaer(temaer, horinger, IDAG);
  const kort = nesteTemaer(temaer, horinger, IDAG, 2);
  assert.equal(kort.length, 2);
  assert.deepEqual(
    kort.map((p) => p.tema.id),
    hele.slice(0, 2).map((p) => p.tema.id),
  );
});
