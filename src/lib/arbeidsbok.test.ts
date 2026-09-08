import assert from "node:assert/strict";
import { test } from "node:test";
import {
  foldNotater,
  foldOvinger,
  nesteUbesvarteOving,
  type FoldetOving,
} from "./arbeidsbok.ts";
import type { Hendelse } from "./hendelser.ts";
import type { Horing } from "./types.ts";

function notat(id: string, tid: string, tekst: string): Hendelse {
  return {
    id: `h-${id}`,
    type: "kapittel-notat",
    tid,
    fagId: "male1",
    kilde: "selv",
    kapittelId: "male1-k06",
    notatId: id,
    tekst,
  };
}

test("siste notatsnapshot vinner per kapittel", () => {
  const ut = foldNotater([
    notat("n1", "2026-09-01T10:00:00.000Z", "første"),
    notat("n2", "2026-09-02T10:00:00.000Z", "andre"),
  ]);
  assert.equal(ut.length, 1);
  assert.equal(ut[0]?.tekst, "andre");
  assert.equal(ut[0]?.notatId, "n2");
});

test("neste ubesvarte øving er første uten svar", () => {
  const hendelser: Hendelse[] = [
    {
      id: "o1",
      type: "oving-lagt-inn",
      tid: "2026-09-01T10:00:00.000Z",
      fagId: "male1",
      kilde: "selv",
      kapittelId: "male1-k01",
      ovingId: "ov-1",
      ovingType: "kontroll",
      tekst: "Forklar markedsføring.",
      nummer: "1",
    },
    {
      id: "o2",
      type: "oving-lagt-inn",
      tid: "2026-09-01T10:01:00.000Z",
      fagId: "male1",
      kilde: "selv",
      kapittelId: "male1-k01",
      ovingId: "ov-2",
      ovingType: "kontroll",
      tekst: "Hva er et marked?",
      nummer: "2",
    },
    {
      id: "s1",
      type: "oving-besvart",
      tid: "2026-09-01T11:00:00.000Z",
      fagId: "male1",
      kilde: "selv",
      kapittelId: "male1-k01",
      ovingId: "ov-1",
      svar: "Markedsføring er …",
    },
  ];
  const ovinger = foldOvinger(hendelser, []);
  const neste = nesteUbesvarteOving(ovinger);
  assert.equal(neste?.ovingId, "ov-2");
});

test("høring med ovingId teller som besvarelse", () => {
  const hendelser: Hendelse[] = [
    {
      id: "o1",
      type: "oving-lagt-inn",
      tid: "2026-09-01T10:00:00.000Z",
      fagId: "male1",
      kilde: "selv",
      kapittelId: "male1-k06",
      ovingId: "ov-1",
      ovingType: "oppgave",
      tekst: "1.1",
    },
  ];
  const horinger: Horing[] = [
    {
      id: "h-1",
      temaId: "def",
      dato: "2026-09-01",
      karakter: 5,
      riktig: "satt",
      mangler: "",
      kilde: "ai",
      ovingId: "ov-1",
      svar: "svar",
    },
  ];
  const ovinger: FoldetOving[] = foldOvinger(hendelser, horinger);
  assert.equal(ovinger[0]?.horing?.karakter, 5);
  assert.equal(nesteUbesvarteOving(ovinger), undefined);
});
