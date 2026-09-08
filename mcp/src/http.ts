import { createClient } from "@supabase/supabase-js";
import {
  bearerAuthChallengeResponse,
  buildOAuthProtectedResourceMetadata,
  createMcpHandler,
  getOAuthProtectedResourceMetadataUrl,
  OAuthError,
  OAuthErrorCode,
  requireBearerAuth,
  type AuthInfo,
  type OAuthTokenVerifier,
} from "@modelcontextprotocol/server";
import { medBruker } from "./bruker-kontekst.ts";
import { lastEnv } from "./env.ts";
import { createServer } from "./server-def.ts";

lastEnv();

/**
 * Samme MCP-server som over stdio, servert over HTTP. Det er dette claude.ai
 * kan koble seg til — web støtter ikke lokale stdio-servere.
 *
 * Tokenet i Authorization-headeren er brukerens eget Supabase-token, og det
 * følger forespørselen hele veien ned til Postgres. RLS gjør resten: to
 * brukere mot samme server ser hver sine rader, uten at koden må filtrere.
 */

function supabaseUrl(): string {
  const url = process.env.SUPABASE_URL?.trim();
  if (!url) throw new Error("SUPABASE_URL mangler.");
  return url;
}

/**
 * Verifiserer tokenet ved å spørre Supabase hvem det tilhører. Supabase
 * sjekker signatur og utløp; vi stoler ikke på innholdet selv.
 */
export function supabaseVerifier(): OAuthTokenVerifier {
  return {
    async verifyAccessToken(token: string): Promise<AuthInfo> {
      const db = createClient(supabaseUrl(), process.env.SUPABASE_PUBLISHABLE_KEY ?? "", {
        auth: { persistSession: false, autoRefreshToken: false },
      });
      const { data, error } = await db.auth.getUser(token);
      if (error || !data.user) {
        // Må være en OAuthError, ellers svarer SDK-en 500 i stedet for 401
        // med utfordringen klienten trenger for å starte innloggingen.
        throw new OAuthError(
          OAuthErrorCode.InvalidToken,
          error?.message ?? "Tokenet er ukjent eller utløpt.",
        );
      }
      return {
        token,
        clientId: data.user.id,
        scopes: ["mfl"],
        extra: { epost: data.user.email },
      };
    },
  };
}

export type HttpOpts = { serverUrl: URL };

export function lagFetchHandler(opts: HttpOpts) {
  const handler = createMcpHandler(() => createServer(), {
    onerror: (e) => console.error("[mfl-http]", e.message),
  });

  const resourceMetadataUrl = getOAuthProtectedResourceMetadataUrl(opts.serverUrl);
  const auth = requireBearerAuth({
    verifier: supabaseVerifier(),
    resourceMetadataUrl,
  });

  // Supabase Auth er autorisasjonsserveren. Claude finner den herfra.
  const metadata = buildOAuthProtectedResourceMetadata({
    oauthMetadata: {
      issuer: supabaseUrl(),
      authorization_endpoint: `${supabaseUrl()}/auth/v1/authorize`,
      token_endpoint: `${supabaseUrl()}/auth/v1/token`,
      response_types_supported: ["code"],
    },
    resourceServerUrl: opts.serverUrl,
    resourceName: "MFL øvingsapp",
    scopesSupported: ["mfl"],
  });

  return {
    close: () => handler.close(),
    async fetch(request: Request): Promise<Response> {
      const url = new URL(request.url);

      if (url.pathname === "/.well-known/oauth-protected-resource") {
        return Response.json(metadata);
      }
      if (url.pathname === "/helse") {
        return Response.json({ ok: true, tjeneste: "mfl", tid: new Date().toISOString() });
      }

      const resultat = await auth(request);
      if (resultat instanceof Response) return resultat;

      try {
        return await medBruker(
          { token: resultat.token, id: resultat.clientId, epost: String(resultat.extra?.epost ?? "") },
          () => handler.fetch(request, { authInfo: resultat }),
        );
      } catch (e) {
        return bearerAuthChallengeResponse(e, { resourceMetadataUrl });
      }
    },
  };
}
