import assert from "node:assert/strict";
import { test } from "node:test";
import {
  chunkSegmenter,
  chunkTekst,
  chunksTilMarkdown,
  parseVtt,
  parseWhisperJson,
  sokeord,
  tidsstempel,
  type Segment,
} from "./kilder.ts";

/** Segmenter på fem sekunder hver, med pause der `pauserEtter` sier. */
function segmenter(antall: number, pauserEtter: number[] = []): Segment[] {
  const ut: Segment[] = [];
  let t = 0;
  for (let i = 0; i < antall; i += 1) {
    ut.push({ start: t, slutt: t + 5, tekst: `setning ${i}` });
    t += 5 + (pauserEtter.includes(i) ? 2 : 0.1);
  }
  return ut;
}

test("tidsstempel skifter til timer først når det trengs", () => {
  assert.equal(tidsstempel(0), "0:00");
  assert.equal(tidsstempel(75), "1:15");
  assert.equal(tidsstempel(3671), "1:01:11");
});

test("chunking bryter i en pause etter minstelengden", () => {
  // Pause etter segment 13, altså rundt 70 sekunder inn.
  const chunks = chunkSegmenter(segmenter(24, [13]));
  assert.ok(chunks.length >= 2);
  const forste = chunks[0]!;
  assert.ok(forste.slutt! >= 60, "bryter ikke før minstelengden");
  assert.ok(forste.slutt! <= 90, "bryter senest ved maks");
  assert.match(forste.tekst, /setning 13$/, "bruddet ligger i pausen");
});

test("chunking bryter uansett ved maks når ingen pause finnes", () => {
  const chunks = chunkSegmenter(segmenter(40));
  for (const c of chunks) {
    assert.ok((c.slutt ?? 0) - (c.start ?? 0) <= 90, "ingen bit er lengre enn maks");
  }
  assert.ok(chunks.length >= 2);
});

test("chunking beholder rekkefølge og tidsstempler", () => {
  const chunks = chunkSegmenter(segmenter(30, [12, 25]));
  assert.deepEqual(chunks.map((c) => c.ord), chunks.map((_, i) => i));
  for (let i = 1; i < chunks.length; i += 1) {
    assert.ok(chunks[i]!.start! >= chunks[i - 1]!.slutt!, "bitene overlapper ikke");
  }
});

test("bok deles på avsnitt og fanger sidetall", () => {
  const tekst = [
    "s. 42",
    "Et markedsinformasjonssystem samler inn data løpende.",
    "Det skiller seg fra en markedsundersøkelse, som er avgrenset i tid.",
    "side 43",
    "Primærdata samler du inn selv.",
  ].join("\n\n");
  const chunks = chunkTekst(tekst, 40);
  assert.equal(chunks[0]?.side, 42);
  assert.equal(chunks.at(-1)?.side, 43);
  assert.match(chunks.at(-1)!.tekst, /Primærdata/);
});

test("parseWhisperJson tar både segments og whisper.cpp sine offsets", () => {
  const openai = parseWhisperJson(
    JSON.stringify({ segments: [{ start: 1, end: 4, text: " Hei." }] }),
  );
  assert.deepEqual(openai, [{ start: 1, slutt: 4, tekst: "Hei." }]);

  const cpp = parseWhisperJson(
    JSON.stringify({ transcription: [{ offsets: { from: 1500, to: 4000 }, text: " Hei." }] }),
  );
  assert.deepEqual(cpp, [{ start: 1.5, slutt: 4, tekst: "Hei." }]);

  assert.throws(() => parseWhisperJson("{}"), /Fant ingen segmenter/);
});

test("parseVtt leser tid og slår sammen linjer", () => {
  const vtt = `WEBVTT

1
00:00:01.000 --> 00:00:04.500
Undersøkelsesdesign er
den overordnede planen.

2
00:00:05.000 --> 00:00:07.000
Metoden er verktøyet.`;
  const segs = parseVtt(vtt);
  assert.equal(segs.length, 2);
  assert.equal(segs[0]?.start, 1);
  assert.equal(segs[0]?.slutt, 4.5);
  assert.equal(segs[0]?.tekst, "Undersøkelsesdesign er den overordnede planen.");
});

test("sokeord luker fyllord og beholder fagbegrepene", () => {
  const ord = sokeord(
    "bruke og utvikle markedsundersøkelser for å utforske og få innsikt i markeder og målgrupper",
  );
  assert.ok(ord.includes("markedsundersøkelser"));
  assert.ok(ord.includes("målgrupper"));
  assert.ok(!ord.includes("bruke"), "fyllord skal bort");
  assert.ok(!ord.includes("for"), "for korte ord skal bort");
});

test("markdown får tidsstempel foran hver bit", () => {
  const md = chunksTilMarkdown("Uke 36", [
    { ord: 0, start: 0, slutt: 60, tekst: "Første." },
    { ord: 1, start: 75, slutt: 130, tekst: "Andre." },
  ]);
  assert.match(md, /# Uke 36/);
  assert.match(md, /\*\*\[0:00\]\*\* Første\./);
  assert.match(md, /\*\*\[1:15\]\*\* Andre\./);
});
