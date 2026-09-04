import assert from "node:assert/strict";
import { test } from "node:test";
import { mergeHoringerAppendOnly } from "./ai-overlay.ts";
import { hentLareplan, hentOversikt, hentSkill, hentSkillReference, kallLoggHoring, kallOppdaterFagord, listFag, listKapitler, listSkills, stillSporsmal } from "../../mcp/src/tools.ts";

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

test("still_sporsmal avviser tema fra annet fag", () => {
  const res = stillSporsmal("entrep1", "def");
  assert.equal(res.isError, true);
  assert.match(res.content[0]?.text ?? "", /tilhører male1|ikke entrep1/);
});

test("logg_horing avvises uten proveniens og med kryss-fag", () => {
  const uten = kallLoggHoring({
    fagId: "male1",
    temaId: "def",
    karakter: 4,
    riktig: "x",
    mangler: "y",
    modell: "",
    innsats: "hoy",
    promptId: "muntlig-horing",
  });
  assert.equal(uten.isError, true);
  const kryss = kallLoggHoring({
    fagId: "entrep1",
    temaId: "def",
    karakter: 4,
    riktig: "x",
    mangler: "y",
    modell: "Claude",
    innsats: "hoy",
    promptId: "muntlig-horing",
  });
  assert.equal(kryss.isError, true);
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
