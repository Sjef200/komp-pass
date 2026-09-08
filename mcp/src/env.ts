import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Leser .env.local fra reporoten inn i process.env. MCP-serveren startes av
 * Claude uten skall, så --env-file er ikke tilgjengelig der.
 * Variabler som allerede er satt vinner.
 */
let lest = false;

export function lastEnv(): void {
  if (lest) return;
  lest = true;
  const rot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
  const fil = path.join(rot, ".env.local");
  if (!fs.existsSync(fil)) return;
  for (const linje of fs.readFileSync(fil, "utf8").split(/\r?\n/)) {
    const ren = linje.trim();
    if (!ren || ren.startsWith("#")) continue;
    const skille = ren.indexOf("=");
    if (skille < 1) continue;
    const navn = ren.slice(0, skille).trim();
    if (process.env[navn] != null) continue;
    process.env[navn] = ren.slice(skille + 1).trim().replace(/^["']|["']$/g, "");
  }
}
