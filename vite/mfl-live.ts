import type { IncomingMessage, ServerResponse } from "node:http";
import path from "node:path";
import type { Plugin, ViteDevServer } from "vite";
import { lesChunk, lesHendelser, lesKilder, sisteSeq } from "../mcp/src/db.ts";
import { erHendelse, foldKoblinger, type Hendelse } from "../src/lib/hendelser.ts";
import { tidsstempel } from "../src/lib/kilder.ts";
import {
  lesPrompterFraDisk,
  lesSkillMarkdown,
  lesSkillsFraDisk,
  lesUdirMeta,
  pluginManifestForOrigin,
  repoRot,
  skillKatalogForOrigin,
  skrivHendelserFraKlient,
} from "../mcp/src/fs-state.ts";

/**
 * Tekstene til de bitene koblingene faktisk peker på. Hele transkriptet skal
 * ikke over til nettleseren — bare det som trengs for å bekrefte et forslag.
 */
async function koblingTekster(hendelser: Hendelse[]): Promise<Record<string, unknown>> {
  const ut: Record<string, unknown> = {};
  for (const k of foldKoblinger(hendelser)) {
    if (ut[k.chunkId]) continue;
    const chunk = await lesChunk(k.chunkId);
    if (!chunk) continue;
    ut[k.chunkId] = {
      tekst: chunk.tekst,
      kildeId: chunk.kildeId,
      ...(chunk.start != null ? { tid: tidsstempel(chunk.start) } : {}),
      ...(chunk.side != null ? { side: chunk.side } : {}),
    };
  }
  return ut;
}

async function tilstand() {
  const hendelser = await lesHendelser();
  return {
    hendelser,
    kilder: await lesKilder(),
    koblingTekster: await koblingTekster(hendelser),
    prompts: lesPrompterFraDisk(),
    skills: lesSkillsFraDisk(),
  };
}

async function sendLive(server: ViteDevServer): Promise<void> {
  try {
    const data = await tilstand();
    server.ws.send({
      type: "custom",
      event: "mfl:ai-overlay",
      data: {
        overlay: { hendelser: data.hendelser, kilder: data.kilder },
        koblingTekster: data.koblingTekster,
        prompts: data.prompts,
        skills: data.skills,
      },
    });
  } catch (e) {
    console.error("[mfl-live]", e);
  }
}

function lesBody(req: IncomingMessage): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (c: Buffer) => chunks.push(c));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

function originFraReq(req: IncomingMessage): string {
  const host = req.headers.host ?? "127.0.0.1:43147";
  const protoHeader = req.headers["x-forwarded-proto"];
  const proto = typeof protoHeader === "string" ? protoHeader.split(",")[0] : "http";
  return `${proto}://${host}`;
}

/**
 * Skills og plugin-manifestet er ment å hentes utenfra — det er hele
 * plattform-mønsteret, og filene ligger i git uansett. Derfor åpen CORS her,
 * og bare her.
 */
function offentligJson(res: ServerResponse, status: number, body: unknown): void {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.end(JSON.stringify(body, null, 2));
}

function offentligText(res: ServerResponse, status: number, body: string, type: string): void {
  res.statusCode = status;
  res.setHeader("Content-Type", type);
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.end(body);
}

/**
 * Læringsdataene dine. Ingen Access-Control-Allow-Origin, så en nettside på
 * et annet domene får ikke lese svaret selv om den klarer å sende kallet.
 */
function apiJson(res: ServerResponse, status: number, body: unknown): void {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Vary", "Origin");
  res.end(JSON.stringify(body, null, 2));
}

/**
 * En nettleser sender alltid Origin på kryssopprinnelse. Mangler headeren, er
 * kallet fra samme side eller fra et skall — og et skall har full tilgang til
 * databasefilen uansett. Finnes den og peker et annet sted, er det ikke oss.
 *
 * Uten denne sjekken kunne en vilkårlig nettside du besøkte poste inn
 * hendelser med Content-Type text/plain, som slipper unna preflight.
 */
function erSammeOpprinnelse(req: IncomingMessage): boolean {
  const origin = req.headers.origin;
  if (!origin) return true;
  const host = req.headers.host;
  if (!host) return false;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

export function mflLive(): Plugin {
  const rot = repoRot();
  const promptsDir = path.join(rot, "src/data/prompts");
  const skillsDir = path.join(rot, "src/data/skills");

  return {
    name: "mfl-live",
    async configureServer(server) {
      server.watcher.add(promptsDir);
      server.watcher.add(skillsDir);

      let timer: ReturnType<typeof setTimeout> | undefined;
      const bump = (fil: string) => {
        const n = fil.replaceAll("\\", "/");
        if (!n.includes("/src/data/prompts") && !n.includes("/src/data/skills")) return;
        clearTimeout(timer);
        timer = setTimeout(() => void sendLive(server), 80);
      };
      server.watcher.on("change", bump);
      server.watcher.on("add", bump);

      // Databasen ligger utenfor repoet og skrives av MCP-prosessen. Å følge
      // sekvensnummeret er mer robust enn å se på WAL-filen.
      let sett = await sisteSeq();
      const puls = setInterval(() => {
        void (async () => {
          try {
            const na = await sisteSeq();
            if (na !== sett) {
              sett = na;
              await sendLive(server);
            }
          } catch (e) {
            console.error("[mfl-live] databasen svarer ikke", e);
          }
        })();
      }, 1000);
      puls.unref?.();
      server.httpServer?.on("close", () => clearInterval(puls));

      server.middlewares.use(async (req, res, next) => {
        const url = req.url?.split("?")[0] ?? "";
        const origin = originFraReq(req);

        if (url.startsWith("/api/") && !erSammeOpprinnelse(req)) {
          apiJson(res, 403, {
            error:
              "Kallet kom fra et annet domene. API-et er bare for appen selv og for MCP-serveren på denne maskinen.",
          });
          return;
        }

        if (req.method === "GET" && (url === "/skills" || url === "/skills/")) {
          offentligJson(res, 200, skillKatalogForOrigin(origin));
          return;
        }
        const skillRef = url.match(
          /^\/skills\/([a-z0-9][a-z0-9-]*)\/references\/([a-z0-9][a-z0-9-]*)\.md$/i,
        );
        if (req.method === "GET" && skillRef) {
          const skill = lesSkillsFraDisk().find((s) => s.id === skillRef[1]);
          const ref = skill?.referanser.find((r) => r.id === skillRef[2]);
          if (!ref) {
            offentligText(res, 404, "Fant ikke referansen.", "text/plain; charset=utf-8");
            return;
          }
          offentligText(res, 200, ref.markdown, "text/markdown; charset=utf-8");
          return;
        }
        const skillFil = url.match(/^\/skills\/([a-z0-9][a-z0-9-]*)\/SKILL\.md$/i);
        if (req.method === "GET" && skillFil) {
          const md = lesSkillMarkdown(skillFil[1] ?? "");
          if (!md) {
            offentligText(res, 404, "Fant ikke skillen.", "text/plain; charset=utf-8");
            return;
          }
          offentligText(res, 200, md, "text/markdown; charset=utf-8");
          return;
        }
        if (req.method === "GET" && url === "/plugin.json") {
          offentligJson(res, 200, pluginManifestForOrigin(origin));
          return;
        }
        // SPA-ruting for samtykkesiden: Supabase sender brukeren hit med
        // en authorization_id, og Vite ville ellers svart 404.
        if (req.method === "GET" && url === "/oauth/consent") {
          req.url = "/";
        }
        if (url === "/api/tilstand" && req.method === "GET") {
          apiJson(res, 200, await tilstand());
          return;
        }
        if (url === "/api/hendelser" && req.method === "POST") {
          try {
            const raw = (await lesBody(req)).toString("utf8");
            const kropp = JSON.parse(raw) as { hendelser?: unknown };
            const inn = Array.isArray(kropp.hendelser) ? kropp.hendelser : [];
            const gyldige = inn.filter(erHendelse) as Hendelse[];
            if (gyldige.length !== inn.length) {
              apiJson(res, 400, { error: "Noen av hendelsene manglet id, tid eller type." });
              return;
            }
            const skrevet = await skrivHendelserFraKlient(gyldige);
            sett = await sisteSeq();
            await sendLive(server);
            apiJson(res, 200, { skrevet: skrevet.length, ...(await tilstand()) });
          } catch (e) {
            apiJson(res, 400, {
              error: e instanceof Error ? e.message : "Kunne ikke lagre hendelsene.",
            });
          }
          return;
        }
        if (url === "/api/prompts" && req.method === "GET") {
          apiJson(res, 200, lesPrompterFraDisk());
          return;
        }
        if (url === "/api/skills" && req.method === "GET") {
          apiJson(res, 200, lesSkillsFraDisk());
          return;
        }
        if (url === "/api/udir-meta" && req.method === "GET") {
          apiJson(res, 200, lesUdirMeta());
          return;
        }
        next();
      });
    },
  };
}
