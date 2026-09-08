import { useCallback, useEffect, useState, type FormEvent } from "react";
import { harSupabase, supabase } from "../lib/supabase";

/**
 * Samtykkesiden i OAuth-flyten. Supabase sender deg hit med en
 * `authorization_id` når en klient — for eksempel Claude på web — ber om
 * tilgang til læringsdataene dine.
 *
 * Siden gjør fire ting: sørger for at du er innlogget, henter hvem som spør
 * og om hva, lar deg godkjenne eller avslå, og sender deg tilbake dit
 * Supabase sier.
 *
 * Ingenting her omgår RLS. Godkjenner du, får klienten et token som er ditt,
 * og ser nøyaktig de radene du selv ser.
 */

type Detaljer = {
  client: { name?: string; client_name?: string; client_uri?: string } | null;
  scope: string;
  redirect_uri?: string;
};

const SCOPE_TEKST: Record<string, string> = {
  openid: "vite hvem du er",
  email: "se e-postadressen din",
  profile: "se profilen din",
  phone: "se telefonnummeret ditt",
  offline_access: "holde tilgangen ved like uten at du logger inn på nytt",
};

export function Samtykke({ authorizationId }: { authorizationId: string }) {
  const [detaljer, setDetaljer] = useState<Detaljer | null>(null);
  const [feil, setFeil] = useState<string | null>(null);
  const [laster, setLaster] = useState(true);
  const [jobber, setJobber] = useState(false);
  const [innlogget, setInnlogget] = useState<string | null>(null);
  const [epost, setEpost] = useState("");
  const [passord, setPassord] = useState("");

  // Setter ikke `laster` her: kallet skjer fra en effekt, og synkron
  // setState der utløser en runde ekstra. Den starter allerede som true.
  const hentDetaljer = useCallback(async () => {
    try {
      const db = supabase();
      const { data: sesjon } = await db.auth.getSession();
      if (!sesjon.session) {
        setInnlogget(null);
        setLaster(false);
        return;
      }
      setInnlogget(sesjon.session.user.email ?? "innlogget");

      const oauth = (db.auth as unknown as {
        oauth: { getAuthorizationDetails: (id: string) => Promise<{ data: Detaljer | null; error: { message: string } | null }> };
      }).oauth;
      const { data, error } = await oauth.getAuthorizationDetails(authorizationId);
      if (error) throw new Error(error.message);
      setDetaljer(data);
      setFeil(null);
    } catch (e) {
      setFeil(e instanceof Error ? e.message : "Kunne ikke hente forespørselen.");
    } finally {
      setLaster(false);
    }
  }, [authorizationId]);

  useEffect(() => {
    void hentDetaljer();
  }, [hentDetaljer]);

  async function loggInn(e: FormEvent) {
    e.preventDefault();
    setJobber(true);
    try {
      const { error } = await supabase().auth.signInWithPassword({
        email: epost.trim(),
        password: passord,
      });
      if (error) throw new Error(error.message);
      setPassord("");
      setLaster(true);
      await hentDetaljer();
    } catch (e) {
      setFeil(e instanceof Error ? e.message : "Innlogging feilet.");
    } finally {
      setJobber(false);
    }
  }

  async function avgjor(godkjenn: boolean) {
    setJobber(true);
    try {
      const oauth = (supabase().auth as unknown as {
        oauth: {
          approveAuthorization: (id: string) => Promise<{ data: { redirect_url?: string } | null; error: { message: string } | null }>;
          denyAuthorization: (id: string) => Promise<{ data: { redirect_url?: string } | null; error: { message: string } | null }>;
        };
      }).oauth;
      const { data, error } = godkjenn
        ? await oauth.approveAuthorization(authorizationId)
        : await oauth.denyAuthorization(authorizationId);
      if (error) throw new Error(error.message);
      if (data?.redirect_url) {
        window.location.href = data.redirect_url;
        return;
      }
      setFeil("Supabase svarte uten redirect_url. Lukk vinduet og prøv på nytt.");
    } catch (e) {
      setFeil(e instanceof Error ? e.message : "Kunne ikke svare på forespørselen.");
    } finally {
      setJobber(false);
    }
  }

  const navn =
    detaljer?.client?.client_name ?? detaljer?.client?.name ?? "En ukjent klient";
  const scopes = (detaljer?.scope ?? "").split(/\s+/).filter(Boolean);

  return (
    <div className="min-h-dvh bg-bg text-ink">
      <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-5 py-10">
        <div className="rounded-2xl bg-white p-6">
          <p className="text-xs uppercase tracking-wide text-[#191C1F]/45">Øvingsapp</p>
          <h1 className="mt-1 text-xl font-medium">Gi tilgang?</h1>

          {!harSupabase() && (
            <p className="mt-4 rounded-xl bg-[#A63A2A]/10 px-4 py-3 text-sm text-[#A63A2A]">
              Supabase er ikke satt opp i denne bygget. VITE_SUPABASE_URL mangler.
            </p>
          )}

          {feil && (
            <p className="mt-4 rounded-xl bg-[#A63A2A]/10 px-4 py-3 text-sm text-[#A63A2A]" role="alert">
              {feil}
            </p>
          )}

          {laster && <p className="mt-4 text-sm text-[#191C1F]/55">Henter forespørselen …</p>}

          {!laster && !innlogget && (
            <form className="mt-4" onSubmit={loggInn}>
              <p className="text-sm text-[#191C1F]/70">
                Logg inn for å se hva som blir spurt om.
              </p>
              <label className="mt-4 block text-sm font-medium">
                E-post
                <input
                  type="email"
                  autoComplete="username"
                  className="mt-1 w-full rounded-lg border border-[#191C1F]/15 px-3 py-2 text-sm"
                  value={epost}
                  onChange={(e) => setEpost(e.target.value)}
                  required
                />
              </label>
              <label className="mt-3 block text-sm font-medium">
                Passord
                <input
                  type="password"
                  autoComplete="current-password"
                  className="mt-1 w-full rounded-lg border border-[#191C1F]/15 px-3 py-2 text-sm"
                  value={passord}
                  onChange={(e) => setPassord(e.target.value)}
                  required
                />
              </label>
              <button
                type="submit"
                disabled={jobber}
                className="mt-5 w-full rounded-lg bg-[#191C1F] px-4 py-2.5 text-sm text-white disabled:opacity-50"
              >
                {jobber ? "Logger inn …" : "Logg inn"}
              </button>
            </form>
          )}

          {!laster && innlogget && detaljer && (
            <>
              <p className="mt-4 text-sm leading-relaxed">
                <span className="font-medium">{navn}</span> ber om tilgang til
                læringsdataene dine — karakterer, høringer, fagord og kilder.
              </p>

              {scopes.length > 0 && (
                <ul className="mt-4 space-y-1.5 text-sm text-[#191C1F]/75">
                  {scopes.map((s) => (
                    <li key={s} className="flex gap-2">
                      <span aria-hidden>·</span>
                      <span>{SCOPE_TEKST[s] ?? s}</span>
                    </li>
                  ))}
                </ul>
              )}

              <p className="mt-4 text-xs text-[#191C1F]/50">
                Innlogget som {innlogget}. Klienten får se nøyaktig de radene du selv ser —
                ikke andres.
              </p>

              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  disabled={jobber}
                  onClick={() => void avgjor(false)}
                  className="flex-1 rounded-lg bg-[#F6F5F1] px-4 py-2.5 text-sm disabled:opacity-50"
                >
                  Avslå
                </button>
                <button
                  type="button"
                  disabled={jobber}
                  onClick={() => void avgjor(true)}
                  className="flex-1 rounded-lg bg-[#2E6B4B] px-4 py-2.5 text-sm text-white disabled:opacity-50"
                >
                  {jobber ? "Sender …" : "Gi tilgang"}
                </button>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
