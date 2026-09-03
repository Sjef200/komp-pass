import type { IncomingMessage, ServerResponse } from "node:http";
import path from "node:path";
import type { Plugin, ViteDevServer } from "vite";
import {
  importerPromptFraUrl,
  lesAiOverlay,
  lesPrompterFraDisk,
  repoRot,
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

function json(res: ServerResponse, status: number, body: unknown): void {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(body));
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
        const url = req.url?.split("?")[0];
        if (url === "/api/prompts" && req.method === "GET") {
          json(res, 200, lesPrompterFraDisk());
          return;
        }
        if (url === "/api/hent-skill" && req.method === "POST") {
          try {
            const raw = await lesBody(req);
            const { url: gh } = JSON.parse(raw) as { url?: string };
            if (!gh) {
              json(res, 400, { error: "Lenken må peke på GitHub (fil, mappe eller gist)." });
              return;
            }
            const prompts = await importerPromptFraUrl(gh);
            sendLive(server);
            json(res, 200, { prompts });
          } catch (e) {
            const melding = e instanceof Error ? e.message : "Kunne ikke hente.";
            json(res, 400, { error: melding });
          }
          return;
        }
        next();
      });
    },
  };
}
