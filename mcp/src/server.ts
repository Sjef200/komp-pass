import { serveStdio } from "@modelcontextprotocol/server/stdio";
import { lastEnv } from "./env.ts";
import { beskrivLager } from "./db.ts";
import { createServer } from "./server-def.ts";

lastEnv();

void serveStdio(createServer);
console.error(`mfl MCP-server kjører på stdio · ${beskrivLager()}`);
