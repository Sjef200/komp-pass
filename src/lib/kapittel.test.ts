import assert from "node:assert/strict";
import { test } from "node:test";
import { grupperKapittel } from "./kapittel.ts";
import { maalDekning } from "./dekning.ts";
import type { Horing, Kompetansemaal, Tema } from "./types.ts";

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
