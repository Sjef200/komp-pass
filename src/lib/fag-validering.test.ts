import assert from "node:assert/strict";
import { test } from "node:test";
import kompetansemaal from "../data/kompetansemaal.json" with { type: "json" };
import fag from "../data/fag.json" with { type: "json" };
import { krevFag, krevFagordIFag, krevProveniens, krevTemaIFag } from "./fag-validering.ts";
import { FAG_IDS, type AppState, type Fag, type Kompetansemaal } from "./types.ts";

const maal = kompetansemaal as Kompetansemaal[];
const fagListe = fag as Fag[];

function miniState(): AppState {
  return {
    fag: fagListe,
    kompetansemaal: maal,
    temaer: [
      { id: "def", fagId: "male1", navn: "Design", emoji: "", maalIds: ["male1-04"] },
      { id: "forretning", fagId: "entrep1", navn: "Forretningsidé", emoji: "", maalIds: ["entrep1-01"] },
    ],
    kapitler: [],
    horinger: [],
    fagord: [
      { id: "fo-mis", term: "MIS", forklaring: "x", temaIds: ["def"], status: "usikker" },
      { id: "fo-pitch", term: "Pitch", forklaring: "x", temaIds: ["forretning"], status: "ny" },
    ],
    hendelser: [],
    koblinger: [],
    kilder: [],
    prompts: [],
    skills: [],
    innstillinger: { aktivtFag: "male1", visEmoji: true },
  };
}

test("alle seks fag har egne lokale mål-id-er", () => {
  assert.deepEqual(
    [...new Set(fagListe.map((f) => f.id))].sort(),
    [...FAG_IDS].sort(),
  );
  for (const id of FAG_IDS) {
    const mine = maal.filter((m) => m.fagId === id);
    assert.ok(mine.length > 0, `mangler mål for ${id}`);
    assert.ok(mine.every((m) => m.id.startsWith(`${id}-`)));
  }
});

test("norsk hovedmål og muntlig deler Udir-koder men ikke lokale fag-id-er", () => {
  const hoved = maal.filter((m) => m.fagId === "norsk-hovedmal");
  const muntlig = maal.filter((m) => m.fagId === "norsk-muntlig");
  assert.equal(hoved.length, 10);
  assert.equal(muntlig.length, 10);
  assert.deepEqual(
    hoved.map((m) => m.udirKode),
    muntlig.map((m) => m.udirKode),
  );
  assert.notDeepEqual(
    hoved.map((m) => m.id),
    muntlig.map((m) => m.id),
  );
});

test("ukjent fag avvises", () => {
  assert.throws(() => krevFag(miniState(), "matte"), /Ukjent fagId/);
  assert.throws(() => krevFag(miniState(), undefined), /fagId er påkrevd/);
});

test("tema fra ett fag kan ikke logges på et annet", () => {
  const state = miniState();
  assert.throws(() => krevTemaIFag(state, "male1", "forretning"), /tilhører entrep1/);
  assert.equal(krevTemaIFag(state, "male1", "def").id, "def");
});

test("fagord fra ett fag kan ikke oppdateres på et annet", () => {
  const state = miniState();
  assert.throws(() => krevFagordIFag(state, "male1", "fo-pitch"), /tilhører ikke male1/);
  assert.equal(krevFagordIFag(state, "male1", "fo-mis").term, "MIS");
});

test("proveniens krever modell, innsats og promptId", () => {
  assert.throws(() => krevProveniens({ innsats: "hoy", promptId: "x" }), /modell/);
  assert.throws(() => krevProveniens({ modell: "Claude", promptId: "x" }), /innsats/);
  assert.throws(() => krevProveniens({ modell: "Claude", innsats: "hoy" }), /promptId/);
  krevProveniens({ modell: "Claude", innsats: "hoy", promptId: "muntlig-horing" });
});
