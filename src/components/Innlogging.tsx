import { useState, type FormEvent } from "react";
import { supabase } from "../lib/supabase";

/**
 * Porten inn. Uten en sesjon kommer du ikke til dataene — og med en sesjon
 * ser du bare dine egne, fordi RLS filtrerer på brukeren i tokenet.
 */
export function Innlogging({ onInnlogget }: { onInnlogget: () => void }) {
  const [ny, setNy] = useState(false);
  const [epost, setEpost] = useState("");
  const [passord, setPassord] = useState("");
  const [feil, setFeil] = useState<string | null>(null);
  const [beskjed, setBeskjed] = useState<string | null>(null);
  const [jobber, setJobber] = useState(false);

  async function send(e: FormEvent) {
    e.preventDefault();
    setJobber(true);
    setFeil(null);
    setBeskjed(null);
    try {
      const db = supabase();
      const svar = ny
        ? await db.auth.signUp({ email: epost.trim(), password: passord })
        : await db.auth.signInWithPassword({ email: epost.trim(), password: passord });
      if (svar.error) throw new Error(svar.error.message);
      setPassord("");
      if (!svar.data.session) {
        setBeskjed("Kontoen er opprettet. Bekreft e-posten, så kan du logge inn.");
        return;
      }
      onInnlogget();
    } catch (e) {
      setFeil(e instanceof Error ? e.message : "Innlogging feilet.");
    } finally {
      setJobber(false);
    }
  }

  return (
    <div className="min-h-dvh bg-bg text-ink">
      <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-5 py-10">
        <div className="rounded-2xl bg-white p-6">
          <p className="text-xs uppercase tracking-wide text-[#191C1F]/45">Øvingsapp</p>
          <h1 className="mt-1 text-xl font-medium">
            {ny ? "Lag konto" : "Logg inn"}
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-[#191C1F]/70">
            Karakterene, høringene og fagordene dine er dine. Du ser bare dem —
            databasen slipper ingen andre til radene.
          </p>

          {feil && (
            <p className="mt-4 rounded-xl bg-[#A63A2A]/10 px-4 py-3 text-sm text-[#A63A2A]" role="alert">
              {feil}
            </p>
          )}
          {beskjed && (
            <p className="mt-4 rounded-xl bg-[#2E6B4B]/10 px-4 py-3 text-sm text-[#2E6B4B]">
              {beskjed}
            </p>
          )}

          <form className="mt-5" onSubmit={send}>
            <label className="block text-sm font-medium">
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
                autoComplete={ny ? "new-password" : "current-password"}
                className="mt-1 w-full rounded-lg border border-[#191C1F]/15 px-3 py-2 text-sm"
                value={passord}
                onChange={(e) => setPassord(e.target.value)}
                required
                minLength={6}
              />
            </label>
            <button
              type="submit"
              disabled={jobber}
              className="mt-5 w-full rounded-lg bg-[#191C1F] px-4 py-2.5 text-sm text-white disabled:opacity-50"
            >
              {jobber ? "Vent …" : ny ? "Lag konto" : "Logg inn"}
            </button>
          </form>

          <button
            type="button"
            onClick={() => {
              setNy((v) => !v);
              setFeil(null);
              setBeskjed(null);
            }}
            className="mt-4 w-full text-sm text-[#191C1F]/55 underline"
          >
            {ny ? "Jeg har konto fra før" : "Jeg trenger å lage konto"}
          </button>
        </div>
      </main>
    </div>
  );
}
