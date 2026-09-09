import { aktivBruker } from "./bruker-kontekst.ts";
import { lagFetchHandler } from "./http.ts";

/**
 * Cloudflare Worker: nettsiden og MCP-serveren på samme domene.
 *
 * Statiske filer serveres av ASSETS. Alt under /mcp og OAuth-metadataen
 * håndteres her. Det gjør at samtykkesiden og MCP-endepunktet deler
 * opprinnelse, som er ryddigere enn to adresser.
 */

type Env = {
  ASSETS: { fetch: (req: Request) => Promise<Response> };
  SUPABASE_URL?: string;
  SUPABASE_PUBLISHABLE_KEY?: string;
  MFL_HTTP_URL?: string;
};

let handler: ReturnType<typeof lagFetchHandler> | null = null;

/** Koden leser process.env. På Workers kommer verdiene fra bindings. */
function speilEnv(env: Env): void {
  for (const navn of ["SUPABASE_URL", "SUPABASE_PUBLISHABLE_KEY", "MFL_HTTP_URL"] as const) {
    const verdi = env[navn];
    if (verdi && !process.env[navn]) process.env[navn] = verdi;
  }
}

function erMcp(sti: string): boolean {
  return (
    sti === "/mcp" ||
    sti.startsWith("/mcp/") ||
    sti === "/helse" ||
    sti.startsWith("/.well-known/oauth-")
  );
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const sti = new URL(request.url).pathname;
    if (!erMcp(sti)) return env.ASSETS.fetch(request);

    speilEnv(env);
    handler ??= lagFetchHandler({
      serverUrl: new URL(env.MFL_HTTP_URL ?? `${new URL(request.url).origin}/mcp`),
    });

    // aktivBruker settes av http.ts inne i medBruker; her er den alltid tom.
    if (aktivBruker()) throw new Error("Uventet brukerkontekst før auth.");
    return handler.fetch(request);
  },
};
