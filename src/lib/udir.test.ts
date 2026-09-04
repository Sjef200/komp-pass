import assert from "node:assert/strict";
import { test } from "node:test";
import { tolkUdirHttpFeil, velgKompetansemaalsett } from "./udir.ts";

test("429 med cache blir rate-limited, uten cache blir feil", () => {
  const med = tolkUdirHttpFeil(429, true);
  assert.equal(med.status, "rate-limited");
  assert.match(med.feilmelding ?? "", /cache/);
  const uten = tolkUdirHttpFeil(429, false);
  assert.equal(uten.status, "feil");
  assert.match(uten.feilmelding ?? "", /UDIR_API_KEY/);
});

test("401 bruker cache når den finnes", () => {
  const med = tolkUdirHttpFeil(401, true);
  assert.equal(med.status, "cache");
});

test("velgKompetansemaalsett hopper over utgåtte sett", () => {
  const valgt = velgKompetansemaalsett([
    { kode: "KV115", status: "utgått" },
    { kode: "KV1114", status: "publisert" },
  ]);
  assert.equal(valgt?.kode, "KV1114");
});
