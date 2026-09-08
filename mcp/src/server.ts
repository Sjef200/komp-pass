import { McpServer, ResourceTemplate } from "@modelcontextprotocol/server";
import { serveStdio } from "@modelcontextprotocol/server/stdio";
import { z } from "zod";
import { lesSkillMarkdown, lesSkillsFraDisk } from "./fs-state.ts";
import { lesChunks, lesKilder } from "./db.ts";
import { chunksTilMarkdown } from "../../src/lib/kilder.ts";
import {
  hentLareplan,
  hentOversikt,
  hentPrompt,
  hentSkill,
  hentSkillReference,
  kallImporterPrompt,
  kallLoggHoring,
  kallOppdaterFagord,
  listKapitler,
  listFag,
  listFagord,
  listHoringer,
  listPrompts,
  listSkills,
  listTemaer,
  nesteHoring,
  stillSporsmal,
  finnBelegg,
  foreslaKobling,
  hentLaringslop,
  leggInnKilde,
  hentKilde,
  listKilder,
  listKoblinger,
  sokKilder,
} from "./tools.ts";

const innsats = z.enum(["lav", "medium", "hoy", "maks"]);
const fagIdFelt = z
  .string()
  .describe("male1 | male2 | entrep1 | entrep2 | norsk-hovedmal | norsk-muntlig");

export function createServer(): McpServer {
  const server = new McpServer({ name: "mfl", version: "0.2.0" });

  server.registerTool(
    "list_fag",
    {
      title: "List fag",
      description:
        "Alle fag med fagkode og læreplankilde. Kall dette først og bekreft fagId før neste verktøy.",
      inputSchema: z.object({}),
    },
    async () => listFag(),
  );

  server.registerTool(
    "hent_lareplan",
    {
      title: "Hent læreplan",
      description: "Kompetansemål for ett fag, med Udir-kode og cachestatus.",
      inputSchema: z.object({ fagId: fagIdFelt }),
    },
    async ({ fagId }) => hentLareplan(fagId),
  );

  server.registerTool(
    "hent_oversikt",
    {
      title: "Hent oversikt",
      description: "Snittkarakter, temaer hørt og kompetansemåldekning for ett fag.",
      inputSchema: z.object({
        fagId: fagIdFelt.optional().describe("Standard: aktivt fag i appen."),
      }),
    },
    async ({ fagId }) => hentOversikt(fagId),
  );

  server.registerTool(
    "list_kapitler",
    {
      title: "List kapitler",
      description:
        "Læreverkets kapitler i faget, med temaer og hvilke kompetansemål de treffer. Ikke det samme som hent_lareplan.",
      inputSchema: z.object({ fagId: fagIdFelt.optional() }),
    },
    async ({ fagId }) => listKapitler(fagId),
  );

  server.registerTool(
    "list_temaer",
    {
      title: "List temaer",
      description: "Temaer i faget med siste karakter. Filter: alle, svake eller uhorte.",
      inputSchema: z.object({
        fagId: fagIdFelt.optional(),
        filter: z.enum(["alle", "svake", "uhorte"]).optional(),
      }),
    },
    async ({ fagId, filter }) => listTemaer(fagId, filter),
  );

  server.registerTool(
    "list_fagord",
    {
      title: "List fagord",
      description: "Fagbegrep i faget med status og skillet mot nabobegrepet.",
      inputSchema: z.object({
        fagId: fagIdFelt.optional(),
        status: z.enum(["ny", "usikker", "sitter"]).optional(),
      }),
    },
    async ({ fagId, status }) => listFagord(fagId, status),
  );

  server.registerTool(
    "list_horinger",
    {
      title: "List høringer",
      description: "Høringer i faget, nyeste først. Inkluderer KI-proveniens når den finnes.",
      inputSchema: z.object({
        fagId: fagIdFelt.optional(),
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
        "Append-only. Krever fagId, temaId, karakter, spørsmålet du stilte, elevens svar og full proveniens. Skriver src/data/ai-overlay.json.",
      inputSchema: z.object({
        fagId: fagIdFelt,
        temaId: z.string(),
        karakter: z.number().int().min(1).max(6),
        riktig: z.string(),
        mangler: z.string(),
        sporsmal: z.string().describe("Spørsmålet du faktisk stilte, ordrett."),
        svar: z
          .string()
          .describe("Elevens svar, ordrett nok til at det kan vurderes på nytt senere."),
        modellsvar: z
          .string()
          .optional()
          .describe("Svaret som ville gitt 6, hvis du viste det."),
        maalIds: z
          .array(z.string())
          .optional()
          .describe("Målene svaret faktisk viste. Må være koblet til temaet."),
        dato: z.string().optional(),
        modell: z.string().describe("F.eks. Claude eller Cursor Grok 4.6"),
        innsats,
        promptId: z.string(),
      }),
    },
    async (args) =>
      kallLoggHoring({
        fagId: args.fagId,
        temaId: args.temaId,
        karakter: args.karakter,
        riktig: args.riktig,
        mangler: args.mangler,
        sporsmal: args.sporsmal,
        svar: args.svar,
        modellsvar: args.modellsvar,
        maalIds: args.maalIds,
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
      description: "Sett status på et fagord i ett fag. Krever fagId og full proveniens.",
      inputSchema: z.object({
        fagId: fagIdFelt,
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
      description: "Prompt- og skillbiblioteket uten full body.",
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
    "list_skills",
    {
      title: "List skills",
      description: "Plattform- og fagskills. Filtrer på fagId for å skjule skills som ikke gjelder.",
      inputSchema: z.object({ fagId: fagIdFelt.optional() }),
    },
    async ({ fagId }) => listSkills(fagId),
  );

  server.registerTool(
    "hent_skill",
    {
      title: "Hent skill",
      description: "Full skill-markdown og liste over referanser. Valgfritt fagId avviser feil fag.",
      inputSchema: z.object({
        skillId: z.string(),
        fagId: fagIdFelt.optional(),
      }),
    },
    async ({ skillId, fagId }) => hentSkill(skillId, fagId),
  );

  server.registerTool(
    "hent_skill_reference",
    {
      title: "Hent skill-referanse",
      description: "Ett referansedokument under en skill, for eksempel markedsundersøkelser.",
      inputSchema: z.object({
        skillId: z.string(),
        referenceId: z.string(),
      }),
    },
    async ({ skillId, referenceId }) => hentSkillReference(skillId, referenceId),
  );

  server.registerTool(
    "importer_prompt",
    {
      title: "Importer prompt fra plattform",
      description:
        "Lim inn URL-en til plattformen. Vi henter /skills og SKILL.md-filene. Eksempel: http://127.0.0.1:43147 eller …/skills.",
      inputSchema: z.object({ url: z.string().url() }),
    },
    async ({ url }) => kallImporterPrompt(url),
  );

  server.registerTool(
    "neste_horing",
    {
      title: "Neste høring",
      description:
        "Køen over hva som bør høres nå: uhørt først, så svakt og modent. To temaer fra samme kapittel kommer aldri rett etter hverandre.",
      inputSchema: z.object({
        fagId: fagIdFelt.optional(),
        antall: z.number().int().positive().max(20).optional(),
      }),
    },
    async ({ fagId, antall }) => nesteHoring(fagId, antall),
  );

  server.registerTool(
    "still_sporsmal",
    {
      title: "Still spørsmål",
      description:
        "Foreslår spørsmål fra det temaet som står først i køen. Svarer med begrunnelsen for valget. Modellen stiller ett spørsmål i chatten.",
      inputSchema: z.object({
        fagId: fagIdFelt.optional(),
        temaId: z.string().optional(),
      }),
    },
    async ({ fagId, temaId }) => stillSporsmal(fagId, temaId),
  );

  server.registerTool(
    "hent_laringslop",
    {
      title: "Hent læringsløp",
      description:
        "Hvor langt du er kommet: undervist, hørt og behersket per kompetansemål, og tidslinjen over hva som er gjennomgått når. Gapet undervist-ikke-hort er det mest presise stedet å begynne.",
      inputSchema: z.object({ fagId: fagIdFelt.optional() }),
    },
    async ({ fagId }) => hentLaringslop(fagId),
  );

  server.registerTool(
    "list_kilder",
    {
      title: "List kilder",
      description:
        "Forelesninger, bokkapitler og oppgaver som er lagt inn for faget. Innholdet ligger lokalt, ikke i repoet.",
      inputSchema: z.object({
        fagId: fagIdFelt.optional(),
        type: z.enum(["forelesning", "bok", "oppgave", "notat"]).optional(),
      }),
    },
    async ({ fagId, type }) => listKilder(fagId, type),
  );

  server.registerTool(
    "legg_inn_kilde",
    {
      title: "Legg inn fagstoff",
      description:
        "Lagre fagstoff eleven gir deg i chatten som en kilde i faget: et bokkapittel, notater fra timen, en oppgavetekst. Teksten deles i biter og blir søkbar. Bruk den før du hører eleven i nytt stoff.",
      inputSchema: z.object({
        fagId: fagIdFelt,
        tittel: z.string().describe("Kort navn eleven kjenner igjen, f.eks. «Kapittel 3: segmentering»."),
        tekst: z.string().describe("Selve fagstoffet. Behold avsnittene; linjer som bare sier «s. 42» blir sidetall."),
        type: z.enum(["forelesning", "bok", "oppgave", "notat"]).optional(),
        kapittel: z.string().optional(),
        dato: z.string().optional(),
      }),
    },
    async (args) => leggInnKilde(args),
  );

  server.registerTool(
    "sok_kilder",
    {
      title: "Søk i kilder",
      description:
        "Fulltekstsøk i forelesninger og bokstoff for faget. Gir tidsstempel tilbake til opptaket, så du kan sitere læreren ordrett.",
      inputSchema: z.object({
        fagId: fagIdFelt,
        query: z.string().describe("Fritekst. Alle ordene teller, ingen må treffe eksakt."),
        antall: z.number().int().positive().max(25).optional(),
      }),
    },
    async ({ fagId, query, antall }) => sokKilder(fagId, query, antall),
  );

  server.registerTool(
    "hent_kilde",
    {
      title: "Hent kilde",
      description:
        "Hele kilden, eller et utsnitt av opptaket. fraSekund og tilSekund avgrenser til en del av forelesningen.",
      inputSchema: z.object({
        kildeId: z.string(),
        fraSekund: z.number().nonnegative().optional(),
        tilSekund: z.number().nonnegative().optional(),
      }),
    },
    async ({ kildeId, fraSekund, tilSekund }) => hentKilde(kildeId, fraSekund, tilSekund),
  );

  server.registerTool(
    "finn_belegg",
    {
      title: "Finn belegg",
      description:
        "Hva i forelesningene og boka som dekker et kompetansemål eller tema. Bekreftede koblinger først, deretter kandidater fra søk. Tomt svar er selve gapet mellom undervist og hørt.",
      inputSchema: z.object({
        fagId: fagIdFelt,
        maalId: z.string().optional(),
        temaId: z.string().optional(),
      }),
    },
    async ({ fagId, maalId, temaId }) => finnBelegg(fagId, maalId, temaId),
  );

  server.registerTool(
    "foresla_kobling",
    {
      title: "Foreslå kobling",
      description:
        "Foreslå at en bit av en kilde dekker et tema eller kompetansemål. Forslaget teller ikke som dekning før eleven bekrefter det i UI.",
      inputSchema: z.object({
        fagId: fagIdFelt,
        chunkId: z.string().describe("Fra sok_kilder eller hent_kilde."),
        temaId: z.string().optional(),
        maalId: z.string().optional(),
        begrunnelse: z.string().optional().describe("Hvorfor denne biten treffer."),
        modell: z.string(),
        innsats,
        promptId: z.string(),
      }),
    },
    async (args) => foreslaKobling(args),
  );

  server.registerTool(
    "list_koblinger",
    {
      title: "List koblinger",
      description: "Koblinger mellom kilder og mål, med tilstand foreslatt, bekreftet eller avvist.",
      inputSchema: z.object({
        fagId: fagIdFelt.optional(),
        tilstand: z.enum(["foreslatt", "bekreftet", "avvist"]).optional(),
      }),
    },
    async ({ fagId, tilstand }) => listKoblinger(fagId, tilstand),
  );

  server.registerResource(
    "kilder",
    new ResourceTemplate("mfl://kilder/{kildeId}", {
      list: async () => ({
        resources: lesKilder().map((k) => ({
          uri: `mfl://kilder/${k.id}`,
          name: k.tittel,
          description: `${k.type} · ${k.fagId} · ${k.dato}`,
          mimeType: "text/markdown",
        })),
      }),
    }),
    { title: "Kilde", mimeType: "text/markdown" },
    async (uri, vars) => {
      const kildeId = String(vars.kildeId ?? "");
      const kilde = lesKilder().find((k) => k.id === kildeId);
      if (!kilde) throw new Error(`Fant ikke kilden: ${kildeId}`);
      const tekst = chunksTilMarkdown(kilde.tittel, lesChunks(kildeId));
      return { contents: [{ uri: uri.href, mimeType: "text/markdown", text: tekst }] };
    },
  );

  server.registerResource(
    "skills",
    new ResourceTemplate("mfl://skills/{skillId}", {
      list: async () => ({
        resources: lesSkillsFraDisk().map((s) => ({
          uri: `mfl://skills/${s.id}`,
          name: s.navn,
          description: s.beskrivelse,
          mimeType: "text/markdown",
        })),
      }),
    }),
    { title: "Skill", mimeType: "text/markdown" },
    async (uri, vars) => {
      const skillId = String(vars.skillId ?? "");
      const text = lesSkillMarkdown(skillId);
      if (!text) {
        throw new Error(`Fant ikke skill: ${skillId}`);
      }
      return { contents: [{ uri: uri.href, mimeType: "text/markdown", text }] };
    },
  );

  server.registerResource(
    "skill-references",
    new ResourceTemplate("mfl://skills/{skillId}/references/{referenceId}", {
      list: async () => ({
        resources: lesSkillsFraDisk().flatMap((s) =>
          s.referanser.map((r) => ({
            uri: `mfl://skills/${s.id}/references/${r.id}`,
            name: `${s.navn}: ${r.navn}`,
            mimeType: "text/markdown",
          })),
        ),
      }),
    }),
    { title: "Skill-referanse", mimeType: "text/markdown" },
    async (uri, vars) => {
      const skillId = String(vars.skillId ?? "");
      const referenceId = String(vars.referenceId ?? "");
      const skill = lesSkillsFraDisk().find((s) => s.id === skillId);
      const ref = skill?.referanser.find((r) => r.id === referenceId);
      if (!ref) throw new Error(`Fant ikke referanse: ${skillId}/${referenceId}`);
      return {
        contents: [{ uri: uri.href, mimeType: "text/markdown", text: ref.markdown }],
      };
    },
  );

  return server;
}

void serveStdio(createServer);
console.error("mfl MCP-server kjører på stdio");
