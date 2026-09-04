import assert from "node:assert/strict";
import { test } from "node:test";
import { mergeHoringerAppendOnly, mergeByIdSisteVinner, mergeTreLag } from "./ai-overlay.ts";
import type { AppState, Fagord, Horing } from "./types.ts";

const baseHoring = (id: string, karakter: 1 | 2 | 3 | 4 | 5 | 6): Horing => ({
  id,
  temaId: "def",
  dato: "2026-08-01",
  karakter,
  riktig: "",
  mangler: "",
  kilde: "selv",
});

test("høringer: første skriving vinner, ny AI-id kommer med", () => {
  const seed = [baseHoring("h-def-1", 4)];
  const local = [baseHoring("h-def-1", 6), baseHoring("h-local-1", 5)];
  const ai = [
    {
      ...baseHoring("h-ai-design", 5),
      kilde: "ai" as const,
      ai: {
        modell: "Cursor Grok 4.6",
        innsats: "hoy" as const,
        promptId: "horing-svake-temaer",
        promptNavn: "Høring i svake temaer",
      },
    },
  ];
  const merget = mergeHoringerAppendOnly([seed, local, ai]);
  assert.equal(merget.find((h) => h.id === "h-def-1")?.karakter, 4);
  assert.ok(merget.some((h) => h.id === "h-local-1"));
  assert.ok(merget.some((h) => h.id === "h-ai-design"));
});

test("fagord: ai-overlay slår localStorage på samme id", () => {
  const base: Fagord[] = [
    {
      id: "fo-mis",
      term: "MIS",
      forklaring: "x",
      temaIds: ["mis"],
      status: "usikker",
    },
  ];
  const local: Fagord[] = [{ ...base[0]!, status: "sitter" }];
  const ai: Fagord[] = [{ ...base[0]!, status: "ny" }];
  const merget = mergeByIdSisteVinner([base, local, ai]);
  assert.equal(merget[0]?.status, "ny");
});

test("mergeTreLag gir tre lag på app-state", () => {
  const base = {
    fag: [],
    kompetansemaal: [],
    temaer: [],
    horinger: [baseHoring("h-def-1", 4)],
    fagord: [
      {
        id: "fo-mis",
        term: "MIS",
        forklaring: "x",
        temaIds: ["mis"],
        status: "usikker",
      },
    ],
    prompts: [],
    skills: [],
    innstillinger: { aktivtFag: "male1", visEmoji: true },
  } as AppState;
  const next = mergeTreLag(
    base,
    { horinger: [baseHoring("h-def-1", 1)], fagord: [{ ...base.fagord[0]!, status: "sitter" }] },
    {
      horinger: [baseHoring("h-ai-1", 5)],
      fagord: [{ ...base.fagord[0]!, status: "ny" }],
    },
  );
  assert.equal(next.horinger.find((h) => h.id === "h-def-1")?.karakter, 4);
  assert.ok(next.horinger.some((h) => h.id === "h-ai-1"));
  assert.equal(next.fagord[0]?.status, "ny");
});
