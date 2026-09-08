import fs from "node:fs";
import path from "node:path";
import { lesSkillsFraDisk, repoRot } from "../mcp/src/fs-state.ts";

/**
 * Bygger Claude Code-pluginen fra skillene som allerede ligger i
 * `src/data/skills`. Skillene har én kilde; pluginmappa er et resultat.
 *
 *   npm run bygg:plugin
 *
 * `plugin/commands/` er håndskrevet og røres ikke. Alt annet under `plugin/`
 * skrives på nytt hver gang.
 *
 * Stiene i `.mcp.json` er absolutte. Flytter du repoet, kjør skriptet igjen.
 */

const rot = repoRot();
const pluginDir = path.join(rot, "plugin");

function skriv(fil: string, innhold: string): void {
  fs.mkdirSync(path.dirname(fil), { recursive: true });
  fs.writeFileSync(fil, innhold, "utf8");
}

function json(fil: string, data: unknown): void {
  skriv(fil, `${JSON.stringify(data, null, 2)}\n`);
}

function byggSkills(): number {
  const ut = path.join(pluginDir, "skills");
  fs.rmSync(ut, { recursive: true, force: true });

  const skills = lesSkillsFraDisk();
  for (const skill of skills) {
    const fra = path.join(rot, "src", "data", "skills", skill.id, "SKILL.md");
    if (!fs.existsSync(fra)) {
      console.warn(`  hopper over ${skill.id}: fant ikke SKILL.md`);
      continue;
    }
    skriv(path.join(ut, skill.id, "SKILL.md"), fs.readFileSync(fra, "utf8"));
    for (const ref of skill.referanser) {
      const refFra = path.join(rot, "src", "data", "skills", ref.sti);
      if (!fs.existsSync(refFra)) continue;
      skriv(
        path.join(ut, skill.id, "references", `${ref.id}.md`),
        fs.readFileSync(refFra, "utf8"),
      );
    }
  }
  return skills.length;
}

function byggManifest(): void {
  json(path.join(pluginDir, ".claude-plugin", "plugin.json"), {
    name: "mfl",
    description:
      "Øvingsapp for markedsføring, entreprenørskap og norsk. Gir Claude læreplanen fra Udir, temaene dine, høringene og fagordene dine — og lar den høre deg mot kompetansemål med karakter og proveniens.",
    version: "0.3.0",
    author: { name: "Fokus digital" },
  });

  // Stdio-server som leser den lokale databasen. Ingenting går ut av maskinen.
  // CLAUDE_PLUGIN_ROOT peker på plugin/, så «..» er repoet — også når noen
  // andre installerer pluginen fra git. Da må de kjøre npm install der først.
  const iRepo = (...deler: string[]) => ["${CLAUDE_PLUGIN_ROOT}", "..", ...deler].join("/");
  json(path.join(pluginDir, ".mcp.json"), {
    mfl: {
      command: iRepo("node_modules", ".bin", "tsx"),
      args: [iRepo("mcp", "src", "server.ts")],
      cwd: iRepo(),
    },
  });

  json(path.join(rot, ".claude-plugin", "marketplace.json"), {
    name: "komp-pass",
    description: "Øvingsplugin for markedsføring, entreprenørskap og norsk.",
    owner: { name: "Fokus digital" },
    plugins: [
      {
        name: "mfl",
        description:
          "Læreplanstyrt øving: lim inn fagstoff, bli hørt mot kompetansemål, få karakter med begrunnelse.",
        source: "./plugin",
        category: "productivity",
      },
    ],
  });
}

function main(): void {
  const antall = byggSkills();
  byggManifest();
  const kommandoer = fs.existsSync(path.join(pluginDir, "commands"))
    ? fs.readdirSync(path.join(pluginDir, "commands")).filter((f) => f.endsWith(".md")).length
    : 0;

  console.log(`Plugin bygget: ${pluginDir}`);
  console.log(`  skills     ${antall}`);
  console.log(`  kommandoer ${kommandoer} (håndskrevet, ikke rørt)`);
  console.log(`  mcp        ${path.join(rot, "mcp", "src", "server.ts")}`);
  console.log(`\nInstaller i Claude Code:`);
  console.log(`  /plugin marketplace add ${rot}`);
  console.log(`  /plugin install mfl@komp-pass`);
  console.log(`\nInstallerer noen andre fra git, må de kjøre npm install i klonen`);
  console.log(`før MCP-serveren starter. Den trenger tsx og zod.`);
}

main();
