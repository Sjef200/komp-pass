import type { IncomingMessage, ServerResponse } from "node:http";
import path from "node:path";
import type { Plugin, ViteDevServer } from "vite";
import {
  importerPromptFraUrl,
  lesAiOverlay,
  lesPrompterFraDisk,
  lesSkillMarkdown,
  pluginManifestForOrigin,
  repoRot,
  skillKatalogForOrigin,
} from "../mcp/src/fs-state.ts";

function sendLive(server: ViteDevServer): void {
  try {
    server.ws.send({
      type: "custom",
      event: "mfl:ai-overlay",
      data: {
        overlay: lesAiOverlay(),
        prompts: lesPrompterFraDisk(),
      },
    });
  } catch (e) {
    console.error("[mfl-live]", e);
  }
}

function lesBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (c: Buffer) => chunks.push(c));
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

function originFraReq(req: IncomingMessage): string {
  const host = req.headers.host ?? "127.0.0.1:43147";
  const protoHeader = req.headers["x-forwarded-proto"];
  const proto = typeof protoHeader === "string" ? protoHeader.split(",")[0] : "http";
  return `${proto}://${host}`;
}

function corsJson(res: ServerResponse, status: number, body: unknown): void {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.end(JSON.stringify(body, null, 2));
}

function corsText(res: ServerResponse, status: number, body: string, type: string): void {
  res.statusCode = status;
  res.setHeader("Content-Type", type);
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.end(body);
}

export function mflLive(): Plugin {
  const rot = repoRot();
  const overlay = path.join(rot, "src/data/ai-overlay.json");
  const promptsDir = path.join(rot, "src/data/prompts");

  return {
    name: "mfl-live",
    configureServer(server) {
      server.watcher.add(overlay);
      server.watcher.add(promptsDir);

      let timer: ReturnType<typeof setTimeout> | undefined;
      const bump = (fil: string) => {
        const n = fil.replaceAll("\\", "/");
        if (!n.includes("/src/data/ai-overlay") && !n.includes("/src/data/prompts")) return;
        clearTimeout(timer);
        timer = setTimeout(() => sendLive(server), 80);
      };
      server.watcher.on("change", bump);
      server.watcher.on("add", bump);

      server.middlewares.use(async (req, res, next) => {
        const url = req.url?.split("?")[0] ?? "";
        const origin = originFraReq(req);

        if (req.method === "GET" && (url === "/skills" || url === "/skills/")) {
          corsJson(res, 200, skillKatalogForOrigin(origin));
          return;
        }
        const skillFil = url.match(/^\/skills\/([a-z0-9][a-z0-9-]*)\/SKILL\.md$/i);
        if (req.method === "GET" && skillFil) {
          const md = lesSkillMarkdown(skillFil[1] ?? "");
          if (!md) {
            corsText(res, 404, "Fant ikke skillen.", "text/plain; charset=utf-8");
            return;
          }
          corsText(res, 200, md, "text/markdown; charset=utf-8");
          return;
        }
        if (req.method === "GET" && url === "/plugin.json") {
          corsJson(res, 200, pluginManifestForOrigin(origin));
          return;
        }
        if (url === "/api/prompts" && req.method === "GET") {
          corsJson(res, 200, lesPrompterFraDisk());
          return;
        }
        if (url === "/api/hent-skill" && req.method === "POST") {
          try {
            const raw = await lesBody(req);
            const { url: kilde } = JSON.parse(raw) as { url?: string };
            if (!kilde) {
              corsJson(res, 400, { error: "Lim inn URL-en til plattformen. Vi henter /skills." });
              return;
            }
            const prompts = await importerPromptFraUrl(kilde);
            sendLive(server);
            corsJson(res, 200, { prompts });
          } catch (e) {
            const melding = e instanceof Error ? e.message : "Kunne ikke hente.";
            corsJson(res, 400, { error: melding });
          }
          return;
        }
        next();
      });
    },
  };
}
