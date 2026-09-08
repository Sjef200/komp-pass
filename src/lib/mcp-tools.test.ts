import assert from "node:assert/strict";
import { test } from "node:test";
import { mergeHoringerAppendOnly } from "./ai-overlay.ts";
import { hentLareplan, hentOversikt, hentSkill, hentSkillReference, kallLoggHoring, kallOppdaterFagord, listFag, listKapitler, listSkills, nesteHoring, stillSporsmal } from "../../mcp/src/tools.ts";

function parse(res: { content: { type: "text"; text: string }[]; isError?: boolean }) {
  if (res.isError) return { error: res.content[0]?.text ?? "" };
  return JSON.parse(res.content[0]?.text ?? "{}") as Record<string, unknown>;
}

test("list_fag returnerer seks fag med læreplankilde", () => {
  const data = parse(listFag());
  const fag = data.fag as Array<{ id: string; kode: string }>;
  assert.equal(fag.length, 6);
  assert.ok(fag.some((f) => f.id === "male1" && f.kode === "SAM3045"));
  assert.ok(fag.some((f) => f.id === "norsk-muntlig" && f.kode === "NOR1269"));
});

test("hent_lareplan gir separate mål per fag, også når norsk deler sett", async () => {
  const male1 = parse(hentLareplan("male1"));
  const entrep1 = parse(hentLareplan("entrep1"));
  const norsk = parse(hentLareplan("norsk-hovedmal"));
  const muntlig = parse(hentLareplan("norsk-muntlig"));
  assert.equal((male1.kompetansemaal as unknown[]).length, 14);
  assert.equal((entrep1.kompetansemaal as unknown[]).length, 13);
  assert.equal(male1.fagId, "male1");
  assert.equal(norsk.fagId, "norsk-hovedmal");
  assert.equal(muntlig.fagId, "norsk-muntlig");
  assert.notEqual(norsk.fagId, muntlig.fagId);
});

test("hent_oversikt holder fagene adskilt", () => {
  const a = parse(hentOversikt("male1"));
  const b = parse(hentOversikt("entrep1"));
  assert.equal(a.fagId, "male1");
  assert.equal(b.fagId, "entrep1");
  assert.notEqual(a.temaerHort, undefined);
});

test("list_skills(male1) inkluderer markedsforingslaering og kompetansemaal-mot-kapittel", () => {
  const data = parse(listSkills("male1"));
  const skills = data.skills as Array<{ id: string }>;
  assert.ok(skills.some((s) => s.id === "markedsforingslaering"));
  assert.ok(skills.some((s) => s.id === "kompetansemaal-mot-kapittel"));
  assert.ok(skills.some((s) => s.id === "velg-fag-forst"));
});

test("list_kapitler er læreverk, ikke Udir-mål", () => {
  const data = parse(listKapitler("male1"));
  const kapitler = data.kapitler as Array<{ navn: string; temaer: unknown[]; maal: Array<{ id: string }> }>;
  assert.ok(kapitler.some((k) => k.navn === "Markedsundersøkelser"));
  const undersokelse = kapitler.find((k) => k.navn === "Markedsundersøkelser");
  assert.ok((undersokelse?.temaer.length ?? 0) > 0);
  assert.ok(undersokelse?.maal.some((m) => m.id === "male1-04"));
});

test("hent_skill og referanse for markedsundersøkelser", () => {
  const skill = parse(hentSkill("markedsforingslaering", "male1"));
  assert.equal(skill.id, "markedsforingslaering");
  const ref = parse(hentSkillReference("markedsforingslaering", "markedsundersokelser"));
  assert.match(String(ref.markdown), /Markedsundersøkelser/);
  const feilFag = hentSkill("markedsforingslaering", "norsk-hovedmal");
  assert.equal(feilFag.isError, true);
});

test("neste_horing gir en kø med begrunnelse per tema", () => {
  const data = parse(nesteHoring("male1", 3));
  const ko = data.ko as Array<{ plass: number; temaId: string; grunn: string; moden: boolean }>;
  assert.equal(data.fagId, "male1");
  assert.ok(ko.length > 0 && ko.length <= 3);
  assert.deepEqual(ko.map((r) => r.plass), ko.map((_, i) => i + 1));
  for (const rad of ko) {
    assert.ok(rad.grunn.length > 0, `mangler grunn for ${rad.temaId}`);
  }
});

test("still_sporsmal begrunner hvilket tema det valgte", () => {
  const data = parse(stillSporsmal("male1"));
  assert.ok(typeof data.valgtFordi === "string" && (data.valgtFordi as string).length > 0);
  const forste = (parse(nesteHoring("male1", 1)).ko as Array<{ temaId: string }>)[0];
  assert.equal((data.tema as { id: string }).id, forste?.temaId);
});

test("still_sporsmal avviser tema fra annet fag", () => {
  const res = stillSporsmal("entrep1", "def");
  assert.equal(res.isError, true);
  assert.match(res.content[0]?.text ?? "", /tilhører male1|ikke entrep1/);
});

const GYLDIG_HORING = {
  fagId: "male1",
  temaId: "def",
  karakter: 4,
  riktig: "x",
  mangler: "y",
  sporsmal: "Hva er en markedsundersøkelse?",
  svar: "En systematisk innsamling av data om markedet.",
  modell: "Claude",
  innsats: "hoy" as const,
  promptId: "muntlig-horing",
};

test("logg_horing avvises uten proveniens og med kryss-fag", () => {
  const uten = kallLoggHoring({ ...GYLDIG_HORING, modell: "" });
  assert.equal(uten.isError, true);
  const kryss = kallLoggHoring({ ...GYLDIG_HORING, fagId: "entrep1" });
  assert.equal(kryss.isError, true);
});

test("logg_horing krever spørsmålet og svaret", () => {
  const utenSvar = kallLoggHoring({ ...GYLDIG_HORING, svar: "   " });
  assert.equal(utenSvar.isError, true);
  assert.match(utenSvar.content[0]?.text ?? "", /svar er påkrevd/);
  const utenSporsmal = kallLoggHoring({ ...GYLDIG_HORING, sporsmal: "" });
  assert.equal(utenSporsmal.isError, true);
  assert.match(utenSporsmal.content[0]?.text ?? "", /sporsmal er påkrevd/);
});

test("logg_horing avviser mål som ikke er koblet til temaet", () => {
  const res = kallLoggHoring({ ...GYLDIG_HORING, maalIds: ["male1-01"] });
  assert.equal(res.isError, true);
  assert.match(res.content[0]?.text ?? "", /ikke koblet til temaet/);
});

test("oppdater_fagord avvises uten promptId", () => {
  const res = kallOppdaterFagord({
    fagId: "male1",
    id: "fo-mis",
    status: "usikker",
    modell: "Claude",
    innsats: "hoy",
    promptId: "",
  });
  assert.equal(res.isError, true);
});

test("høringer forblir append-only på id", () => {
  const merget = mergeHoringerAppendOnly([
    [{ id: "h-1", temaId: "def", dato: "2026-01-01", karakter: 4, riktig: "", mangler: "", kilde: "selv" }],
    [{ id: "h-1", temaId: "def", dato: "2026-01-02", karakter: 6, riktig: "", mangler: "", kilde: "selv" }],
  ]);
  assert.equal(merget[0]?.karakter, 4);
});
