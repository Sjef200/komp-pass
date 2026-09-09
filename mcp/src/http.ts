import { createClient } from "@supabase/supabase-js";
import {
  bearerAuthChallengeResponse,
  buildOAuthProtectedResourceMetadata,
  createMcpHandler,
  getOAuthProtectedResourceMetadataUrl,
  OAuthError,
  OAuthErrorCode,
  oauthMetadataResponse,
  requireBearerAuth,
  type AuthInfo,
  type OAuthMetadata,
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

/** Les `exp` fra JWT-payload uten å stole på signaturen (Supabase har allerede sjekket). */
function jwtExpiresAt(token: string): number | undefined {
  const del = token.split(".");
  if (del.length < 2) return undefined;
  try {
    const json = atob(del[1].replace(/-/g, "+").replace(/_/g, "/"));
    const payload = JSON.parse(json) as { exp?: unknown };
    return typeof payload.exp === "number" ? payload.exp : undefined;
  } catch {
    return undefined;
  }
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
      const expiresAt = jwtExpiresAt(token);
      if (expiresAt == null) {
        throw new OAuthError(OAuthErrorCode.InvalidToken, "Tokenet mangler utløpstid.");
      }
      return {
        token,
        clientId: data.user.id,
        scopes: ["openid", "email"],
        expiresAt,
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

  // Supabase Auth er autorisasjonsserveren, og den ligger under /auth/v1 —
  // ikke på prosjektroten. Endepunktene er hentet fra prosjektets egen
  // openid-configuration, ikke gjettet.
  const as = `${supabaseUrl()}/auth/v1`;
  const oauthMetadata: OAuthMetadata = {
    issuer: as,
    authorization_endpoint: `${as}/oauth/authorize`,
    token_endpoint: `${as}/oauth/token`,
    registration_endpoint: `${as}/oauth/clients/register`,
    response_types_supported: ["code"],
    grant_types_supported: ["authorization_code", "refresh_token"],
    code_challenge_methods_supported: ["S256"],
    token_endpoint_auth_methods_supported: ["client_secret_basic", "client_secret_post", "none"],
  };
  const metaOpts = {
    oauthMetadata,
    resourceServerUrl: opts.serverUrl,
    resourceName: "MFL øvingsapp",
    scopesSupported: ["openid", "email", "offline_access"],
  };
  const metadata = buildOAuthProtectedResourceMetadata(metaOpts);

  return {
    close: () => handler.close(),
    async fetch(request: Request): Promise<Response> {
      const url = new URL(request.url);

      // Path-aware PRM (…/oauth-protected-resource/mcp) + AS-metadata på RS-origin.
      const oauthDoc = oauthMetadataResponse(request, metaOpts);
      if (oauthDoc) return oauthDoc;

      // Bakoverkompatibel rot-PRM for klienter som fortsatt leser den gamle URL-en.
      if (url.pathname === "/.well-known/oauth-protected-resource") {
        return Response.json(metadata, { headers: { "Access-Control-Allow-Origin": "*" } });
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
