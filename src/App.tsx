import { useState } from "react";
import { FagordListe } from "./components/Fagord";
import { Horinger } from "./components/Horinger";
import { Kilder } from "./components/Kilder";
import { Laringslop } from "./components/Laringslop";
import { Samtykke } from "./components/Samtykke";
import { Innlogging } from "./components/Innlogging";
import { Oversikt } from "./components/Oversikt";
import { KompetansemaalListe } from "./components/Kompetansemaal";
import { KapittelArbeidsbok } from "./components/KapittelArbeidsbok";
import { Utvikling } from "./components/Utvikling";
import { StoreProvider, useStore } from "./lib/store-context";
import udirMetaJson from "./data/udir-meta.json";
import { skillsSomPrompts } from "./lib/skill-katalog";

type Side =
  | "oversikt"
  | "kompetansemaal"
  | "kapittel"
  | "fagord"
  | "kilder"
  | "laringslop"
  | "horinger"
  | "utvikling";

const SIDER: { id: Side; label: string }[] = [
  { id: "oversikt", label: "Oversikt" },
  { id: "kompetansemaal", label: "Kompetansemål" },
  { id: "kapittel", label: "Kapittel" },
  { id: "fagord", label: "Fagord" },
  { id: "kilder", label: "Kilder" },
  { id: "laringslop", label: "Læringsløp" },
  { id: "horinger", label: "Høringer" },
  { id: "utvikling", label: "Utvikling" },
];

export default function App() {
  // Samtykkesiden står utenfor appen: den skal ikke laste læringstilstand,
  // og den kan treffes før du i det hele tatt er logget inn.
  if (window.location.pathname === "/oauth/consent") {
    const id = new URLSearchParams(window.location.search).get("authorization_id");
    if (id) return <Samtykke authorizationId={id} />;
  }
  return (
    <StoreProvider>
      <Skall />
    </StoreProvider>
  );
}

function Skall() {
  const {
    state,
    appendHoring,
    setFagordStatus,
    setInnstillinger,
    lagringsfeil,
    umigrert,
    koblingTekster,
    avgjorKobling,
    innlogget,
    loggUt,
    krevInnlogging,
    klar,
    appendHendelser,
  } = useStore();
  const [side, setSide] = useState<Side>("oversikt");
  const [horingPagar, setHoringPagar] = useState(false);
  const fag = state.fag.find((f) => f.id === state.innstillinger.aktivtFag);
  const visEmoji = state.innstillinger.visEmoji;
  const udir = udirMetaJson as {
    status?: string;
    hentet?: string;
    feilmelding?: string | null;
  };
  const proveniensPrompts = [
    ...skillsSomPrompts(state.skills),
    ...state.prompts.filter((p) => !state.skills.some((s) => s.id === p.id)),
  ];

  function byttFag(neste: string) {
    if (neste === state.innstillinger.aktivtFag) return;
    if (horingPagar) {
      const ok = window.confirm(
        "En høring pågår. Bytt fag likevel? Konteksten fra dette faget følger ikke med.",
      );
      if (!ok) return;
      setHoringPagar(false);
    }
    setInnstillinger({ aktivtFag: neste });
  }

  if (!klar) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-bg text-sm text-[#191C1F]/50">
        Laster …
      </div>
    );
  }
  if (krevInnlogging) {
    return <Innlogging onInnlogget={() => undefined} />;
  }

  const udirStatus =
    udir.status === "rate-limited"
      ? "Udir rate-limitet · lokal cache"
      : udir.status === "cache"
        ? "Udir-cache"
        : udir.status === "feil"
          ? "Udir-feil · lokal cache"
          : "Udir Grep";

  return (
    <div className="min-h-dvh bg-bg text-ink">
      <header className="sticky top-0 z-[60] border-b border-[#191C1F]/8 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl flex-col gap-4 px-4 py-4 sm:px-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-wide text-[#191C1F]/45">
                Øvingsapp · {fag?.kode}
                {fag?.laereplanKode ? ` · ${fag.laereplanKode}` : ""}
                {" · "}
                {udirStatus}
              </p>
              <h1 className="mt-0.5 truncate text-xl font-medium sm:text-2xl">
                {visEmoji && fag ? <span className="mr-2">{fag.emoji}</span> : null}
                {fag?.navn ?? "Øvingsapp"}
              </h1>
              {udir.feilmelding ? (
                <p className="mt-1 text-xs text-[#C2622C]">{udir.feilmelding}</p>
              ) : null}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <label className="sr-only" htmlFor="fag-velger">
                Aktivt fag
              </label>
              <select
                id="fag-velger"
                className="rounded-lg border border-[#191C1F]/15 bg-white px-2.5 py-1.5 text-sm"
                value={state.innstillinger.aktivtFag}
                onChange={(e) => byttFag(e.target.value)}
              >
                {state.fag.map((f) => (
                  <option key={f.id} value={f.id}>
                    {visEmoji ? `${f.emoji} ` : ""}
                    {f.navn} ({f.kode})
                  </option>
                ))}
              </select>
              {innlogget && (
                <button
                  type="button"
                  className="rounded-lg bg-[#F6F5F1] px-2.5 py-1.5 text-sm"
                  title={`Innlogget som ${innlogget}`}
                  onClick={() => void loggUt()}
                >
                  Logg ut
                </button>
              )}
            </div>
          </div>

          <nav className="-mx-1 flex gap-1 overflow-x-auto pb-1" aria-label="Hovedmeny">
            {SIDER.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setSide(s.id)}
                className={`shrink-0 rounded-full px-3 py-1.5 text-sm ${
                  side === s.id ? "bg-[#191C1F] text-white" : "text-[#191C1F]/70"
                }`}
                aria-current={side === s.id ? "page" : undefined}
              >
                {s.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
        {lagringsfeil && (
          <p className="mb-4 rounded-xl bg-[#A63A2A]/10 px-4 py-3 text-sm text-[#A63A2A]" role="alert">
            {lagringsfeil}
          </p>
        )}
        {umigrert && (
          <p className="mb-4 rounded-xl bg-[#B0770F]/10 px-4 py-3 text-sm text-[#191C1F]/80">
            Nettleseren har {(umigrert.horinger?.length ?? 0) + (umigrert.hendelser?.length ?? 0)}{" "}
            rader fra før databasen ble tatt i bruk. De er ikke slettet. Kjør{" "}
            <code className="rounded bg-[#F6F5F1] px-1">npm run migrer -- filen.json</code> med en
            eksportfil for å få dem inn.
          </p>
        )}

        {side === "oversikt" && <Oversikt state={state} />}
        {side === "kompetansemaal" && (
          <KompetansemaalListe key={state.innstillinger.aktivtFag} state={state} />
        )}
        {side === "kapittel" && (
          <KapittelArbeidsbok
            key={state.innstillinger.aktivtFag}
            state={state}
            onLagreHoring={appendHoring}
            onHendelser={appendHendelser}
            onFagordStatus={setFagordStatus}
            onHoringPagar={setHoringPagar}
          />
        )}
        {side === "fagord" && (
          <FagordListe key={state.innstillinger.aktivtFag} state={state} onStatus={setFagordStatus} />
        )}
        {side === "kilder" && (
          <Kilder
            key={state.innstillinger.aktivtFag}
            state={state}
            koblingTekster={koblingTekster}
            onAvgjor={(id, bekreftet) => void avgjorKobling(id, bekreftet)}
          />
        )}
        {side === "laringslop" && (
          <Laringslop key={state.innstillinger.aktivtFag} state={state} />
        )}
        {side === "horinger" && (
          <Horinger
            key={state.innstillinger.aktivtFag}
            state={state}
            prompts={proveniensPrompts}
            onLagreHoring={appendHoring}
            onHoringPagar={setHoringPagar}
          />
        )}
        {side === "utvikling" && <Utvikling key={state.innstillinger.aktivtFag} state={state} />}
      </main>
    </div>
  );
}
