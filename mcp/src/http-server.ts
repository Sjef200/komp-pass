import { createServer as createHttpServer, type IncomingMessage, type ServerResponse } from "node:http";
import { lagFetchHandler } from "./http.ts";

/**
 * Kjører HTTP-transporten lokalt, så den kan testes før den deployes.
 *
 *   npm run mcp:http
 *   MFL_HTTP_PORT=8787 MFL_HTTP_URL=https://mfl.example.com npm run mcp:http
 *
 * MFL_HTTP_URL må være den URL-en klienten ser, siden den går inn i
 * OAuth-metadataen. Bak en tunnel eller proxy er det ikke localhost.
 */

const port = Number(process.env.MFL_HTTP_PORT ?? 8787);
const serverUrl = new URL(process.env.MFL_HTTP_URL ?? `http://localhost:${port}`);

const mcp = lagFetchHandler({ serverUrl });

/** node:http → web-standard Request. */
async function tilRequest(req: IncomingMessage, base: URL): Promise<Request> {
  const url = new URL(req.url ?? "/", base);
  const headers = new Headers();
  for (const [navn, verdi] of Object.entries(req.headers)) {
    if (verdi == null) continue;
    for (const v of Array.isArray(verdi) ? verdi : [verdi]) headers.append(navn, v);
  }
  const harKropp = req.method !== "GET" && req.method !== "HEAD";
  const biter: Buffer[] = [];
  if (harKropp) {
    for await (const bit of req) biter.push(bit as Buffer);
  }
  return new Request(url, {
    method: req.method ?? "GET",
    headers,
    ...(harKropp && biter.length > 0 ? { body: Buffer.concat(biter) } : {}),
  });
}

async function skrivSvar(svar: Response, res: ServerResponse): Promise<void> {
  res.statusCode = svar.status;
  svar.headers.forEach((verdi, navn) => res.setHeader(navn, verdi));
  if (!svar.body) {
    res.end();
    return;
  }
  for await (const bit of svar.body as unknown as AsyncIterable<Uint8Array>) {
    res.write(bit);
  }
  res.end();
}

const http = createHttpServer((req, res) => {
  void (async () => {
    try {
      const svar = await mcp.fetch(await tilRequest(req, serverUrl));
      await skrivSvar(svar, res);
    } catch (e) {
      console.error("[mfl-http]", e);
      res.statusCode = 500;
      res.end(JSON.stringify({ error: e instanceof Error ? e.message : "Ukjent feil" }));
    }
  })();
});

http.listen(port, "127.0.0.1", () => {
  console.log(`mfl MCP over HTTP: http://127.0.0.1:${port}`);
  console.log(`  klienten ser:   ${serverUrl.href}`);
  console.log(`  metadata:       ${serverUrl.origin}/.well-known/oauth-protected-resource`);
  console.log(`\nBind til loopback med vilje. Skal den nås utenfra, sett en tunnel foran.`);
});

for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.on(signal, () => {
    void mcp.close().then(() => http.close(() => process.exit(0)));
  });
}
