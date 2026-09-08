import fs from "node:fs";
import path from "node:path";
import { repoRot } from "../mcp/src/fs-state.ts";

/**
 * Genererer `mcp/src/base-data.ts` med læreplanen, temaene, fagordene og
 * skillene bakt inn.
 *
 *   npm run bygg:basedata
 *
 * Poenget: en Cloudflare Worker har ingen disk. Alt `fs-state.ts` i dag
 * leser med readFileSync må ligge i bundelen i stedet. Til sammen er det
 * rundt 140K, som er ingenting for en Worker.
 *
 * JSON-filene er fortsatt kilden. Denne fila er et resultat — ikke rediger
 * den for hånd.
 */

const rot = repoRot();
const dataDir = path.join(rot, "src", "data");

function les(...deler: string[]): string {
  return fs.readFileSync(path.join(dataDir, ...deler), "utf8");
}

function json(...deler: string[]): unknown {
  return JSON.parse(les(...deler));
}

/** Markdown inn i en TS-modul. JSON.stringify tar seg av backticks og ${}. */
function tekst(verdi: string): string {
  return JSON.stringify(verdi);
}

function samleMarkdown(mappe: "skills" | "prompts"): Record<string, string> {
  const indexFil = path.join(dataDir, mappe, "index.json");
  if (!fs.existsSync(indexFil)) return {};
  const index = JSON.parse(fs.readFileSync(indexFil, "utf8")) as {
    skills?: { fil: string; referanser?: { sti: string }[] }[];
    prompts?: { fil: string }[];
  };
  const rader = index.skills ?? index.prompts ?? [];
  const ut: Record<string, string> = {};
  for (const rad of rader) {
    const stier = [rad.fil, ...((rad as { referanser?: { sti: string }[] }).referanser ?? []).map((r) => r.sti)];
    for (const sti of stier) {
      const abs = path.join(dataDir, mappe, sti);
      if (fs.existsSync(abs)) ut[sti] = fs.readFileSync(abs, "utf8");
    }
  }
  return ut;
}

function main(): void {
  const skillFiler = samleMarkdown("skills");
  const promptFiler = samleMarkdown("prompts");

  const linjer = [
    "// GENERERT AV scripts/bygg-basedata.ts — IKKE REDIGER.",
    "//",
    "// Læreplan, temaer, fagord og skills bakt inn, slik at serveren kan",
    "// kjøre der det ikke finnes noen disk. Kjør npm run bygg:basedata når",
    "// noe i src/data endres.",
    "",
    'import type { Fag, Fagord, Horing, Kompetansemaal, Tema } from "../../src/lib/types.ts";',
    'import type { PromptKatalogRad, SkillKatalogRad } from "../../src/lib/types.ts";',
    "",
    `export const FAG = ${JSON.stringify(json("fag.json"), null, 2)} as Fag[];`,
    "",
    `export const KOMPETANSEMAAL = ${JSON.stringify(json("kompetansemaal.json"))} as Kompetansemaal[];`,
    "",
    `export const TEMAER = ${JSON.stringify(json("temaer.json"), null, 2)} as Tema[];`,
    "",
    `export const FAGORD = ${JSON.stringify(json("fagord.json"))} as Fagord[];`,
    "",
    `export const HORINGER = ${JSON.stringify(json("horinger.json"))} as Horing[];`,
    "",
    `export const UDIR_META = ${JSON.stringify(json("udir-meta.json"), null, 2)} as Record<string, unknown>;`,
    "",
    `export const SKILL_INDEX = ${JSON.stringify(json("skills", "index.json"), null, 2)} as { skills: SkillKatalogRad[] };`,
    "",
    `export const PROMPT_INDEX = ${JSON.stringify(json("prompts", "index.json"), null, 2)} as { prompts: PromptKatalogRad[] };`,
    "",
    "/** Sti under src/data/skills → innhold. */",
    "export const SKILL_FILER: Record<string, string> = {",
    ...Object.entries(skillFiler).map(([sti, innhold]) => `  ${tekst(sti)}: ${tekst(innhold)},`),
    "};",
    "",
    "/** Sti under src/data/prompts → innhold. */",
    "export const PROMPT_FILER: Record<string, string> = {",
    ...Object.entries(promptFiler).map(([sti, innhold]) => `  ${tekst(sti)}: ${tekst(innhold)},`),
    "};",
    "",
  ];

  const ut = path.join(rot, "mcp", "src", "base-data.ts");
  fs.writeFileSync(ut, linjer.join("\n"), "utf8");

  const kb = (fs.statSync(ut).size / 1024).toFixed(0);
  console.log(`Skrev ${path.relative(rot, ut)} (${kb} KB)`);
  console.log(`  fag ${(json("fag.json") as unknown[]).length}`);
  console.log(`  kompetansemål ${(json("kompetansemaal.json") as unknown[]).length}`);
  console.log(`  temaer ${(json("temaer.json") as unknown[]).length}`);
  console.log(`  fagord ${(json("fagord.json") as unknown[]).length}`);
  console.log(`  skill-filer ${Object.keys(skillFiler).length}`);
  console.log(`  prompt-filer ${Object.keys(promptFiler).length}`);
}

main();
