import { McpServer } from "@modelcontextprotocol/server";
import { serveStdio } from "@modelcontextprotocol/server/stdio";
import { z } from "zod";
import {
  hentOversikt,
  hentPrompt,
  kallImporterPrompt,
  kallLoggHoring,
  kallOppdaterFagord,
  listFagord,
  listHoringer,
  listPrompts,
  listTemaer,
  stillSporsmal,
} from "./tools.ts";

const innsats = z.enum(["lav", "medium", "hoy", "maks"]);

export function createServer(): McpServer {
  const server = new McpServer({ name: "mfl", version: "0.1.0" });

  server.registerTool(
    "hent_oversikt",
    {
      title: "Hent oversikt",
      description: "Snittkarakter, temaer hørt og kompetansemåldekning for et fag.",
      inputSchema: z.object({
        fagId: z.string().optional().describe("male1 eller male2. Standard: male1"),
      }),
    },
    async ({ fagId }) => hentOversikt(fagId),
  );

  server.registerTool(
    "list_temaer",
    {
      title: "List temaer",
      description: "Temaer med siste karakter. Filter: alle, svake eller uhorte.",
      inputSchema: z.object({
        fagId: z.string().optional(),
        filter: z.enum(["alle", "svake", "uhorte"]).optional(),
      }),
    },
    async ({ fagId, filter }) => listTemaer(fagId, filter),
  );

  server.registerTool(
    "list_fagord",
    {
      title: "List fagord",
      description: "Fagbegrep med status og skillet mot nabobegrepet.",
      inputSchema: z.object({
        fagId: z.string().optional(),
        status: z.enum(["ny", "usikker", "sitter"]).optional(),
      }),
    },
    async ({ fagId, status }) => listFagord(fagId, status),
  );

  server.registerTool(
    "list_horinger",
    {
      title: "List høringer",
      description: "Høringer, nyeste først. Inkluderer KI-proveniens når den finnes.",
      inputSchema: z.object({
        fagId: z.string().optional(),
        temaId: z.string().optional(),
        limit: z.number().int().positive().optional(),
      }),
    },
    async ({ fagId, temaId, limit }) => listHoringer(fagId, temaId, limit),
  );

  server.registerTool(
    "logg_horing",
    {
      title: "Logg høring",
      description:
        "Append-only. Krever modell, innsats og promptId. Skriver src/data/ai-overlay.json.",
      inputSchema: z.object({
        temaId: z.string(),
        karakter: z.number().int().min(1).max(6),
        riktig: z.string(),
        mangler: z.string(),
        dato: z.string().optional(),
        modell: z.string().describe("F.eks. Cursor Grok 4.6"),
        innsats,
        promptId: z.string(),
      }),
    },
    async (args) =>
      kallLoggHoring({
        temaId: args.temaId,
        karakter: args.karakter,
        riktig: args.riktig,
        mangler: args.mangler,
        dato: args.dato,
        modell: args.modell,
        innsats: args.innsats,
        promptId: args.promptId,
      }),
  );

  server.registerTool(
    "oppdater_fagord",
    {
      title: "Oppdater fagord",
      description: "Sett status på et fagord. Krever modell, innsats og promptId.",
      inputSchema: z.object({
        id: z.string(),
        status: z.enum(["ny", "usikker", "sitter"]),
        sisteFeil: z.string().optional(),
        modell: z.string(),
        innsats,
        promptId: z.string(),
      }),
    },
    async (args) => kallOppdaterFagord(args),
  );

  server.registerTool(
    "list_prompts",
    {
      title: "List prompter",
      description: "Promptbiblioteket uten full body.",
      inputSchema: z.object({}),
    },
    async () => listPrompts(),
  );

  server.registerTool(
    "hent_prompt",
    {
      title: "Hent prompt",
      description: "Full SKILL.md-tekst. Videre skriving må sette promptId.",
      inputSchema: z.object({ id: z.string() }),
    },
    async ({ id }) => hentPrompt(id),
  );

  server.registerTool(
    "importer_prompt",
    {
      title: "Importer prompt fra plattform",
      description:
        "Lim inn URL-en til plattformen. Vi henter /skills og SKILL.md-filene (pluginene). Eksempel: http://127.0.0.1:43147 eller …/skills.",
      inputSchema: z.object({ url: z.string().url() }),
    },
    async ({ url }) => kallImporterPrompt(url),
  );

  server.registerTool(
    "still_sporsmal",
    {
      title: "Still spørsmål",
      description:
        "Foreslår spørsmål fra svake eller uhørte temaer. Modellen stiller ett spørsmål i chatten.",
      inputSchema: z.object({
        fagId: z.string().optional(),
        temaId: z.string().optional(),
      }),
    },
    async ({ fagId, temaId }) => stillSporsmal(fagId, temaId),
  );

  return server;
}

void serveStdio(createServer);
console.error("mfl MCP-server kjører på stdio");
