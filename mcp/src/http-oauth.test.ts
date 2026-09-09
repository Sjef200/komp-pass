import { after, before, describe, it } from "node:test";
import assert from "node:assert/strict";
import { lagFetchHandler } from "./http.ts";

/**
 * OAuth-metadata og bearer-challenge uten ekte Supabase-kall.
 * SUPABASE_* må være satt (verdier trenger ikke fungere for metadata-stiene).
 */

describe("mcp http oauth metadata", () => {
  const prevUrl = process.env.SUPABASE_URL;
  const prevKey = process.env.SUPABASE_PUBLISHABLE_KEY;
  let handler: ReturnType<typeof lagFetchHandler>;

  before(() => {
    process.env.SUPABASE_URL = "https://example.supabase.co";
    process.env.SUPABASE_PUBLISHABLE_KEY = "test-key";
    handler = lagFetchHandler({ serverUrl: new URL("https://learn.example.com/mcp") });
  });

  after(async () => {
    await handler.close();
    if (prevUrl === undefined) delete process.env.SUPABASE_URL;
    else process.env.SUPABASE_URL = prevUrl;
    if (prevKey === undefined) delete process.env.SUPABASE_PUBLISHABLE_KEY;
    else process.env.SUPABASE_PUBLISHABLE_KEY = prevKey;
  });

  it("serverer path-aware PRM uten auth", async () => {
    const res = await handler.fetch(
      new Request("https://learn.example.com/.well-known/oauth-protected-resource/mcp"),
    );
    assert.equal(res.status, 200);
    const body = (await res.json()) as { resource: string; authorization_servers: string[] };
    assert.equal(body.resource, "https://learn.example.com/mcp");
    assert.equal(body.authorization_servers[0], "https://example.supabase.co/auth/v1");
  });

  it("serverer rot-PRM bakoverkompatibelt", async () => {
    const res = await handler.fetch(
      new Request("https://learn.example.com/.well-known/oauth-protected-resource"),
    );
    assert.equal(res.status, 200);
    const body = (await res.json()) as { resource: string };
    assert.equal(body.resource, "https://learn.example.com/mcp");
  });

  it("serverer AS-metadata på resource-origin", async () => {
    const res = await handler.fetch(
      new Request("https://learn.example.com/.well-known/oauth-authorization-server"),
    );
    assert.equal(res.status, 200);
    const body = (await res.json()) as { issuer: string };
    assert.equal(body.issuer, "https://example.supabase.co/auth/v1");
  });

  it("gir 401 med path-aware resource_metadata mot /mcp", async () => {
    const res = await handler.fetch(
      new Request("https://learn.example.com/mcp", {
        method: "POST",
        headers: { "content-type": "application/json", accept: "application/json, text/event-stream" },
        body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "initialize", params: {} }),
      }),
    );
    assert.equal(res.status, 401);
    const challenge = res.headers.get("www-authenticate") ?? "";
    assert.match(
      challenge,
      /resource_metadata="https:\/\/learn\.example\.com\/\.well-known\/oauth-protected-resource\/mcp"/,
    );
  });
});
