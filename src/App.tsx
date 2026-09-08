import { useRef, useState, type ChangeEvent } from "react";
import { FagordListe } from "./components/Fagord";
import { Horinger } from "./components/Horinger";
import { Kilder } from "./components/Kilder";
import { Laringslop } from "./components/Laringslop";
import { Oversikt } from "./components/Oversikt";
import { Promptbibliotek } from "./components/Promptbibliotek";
import { KompetansemaalListe } from "./components/Kompetansemaal";
import { Temaer } from "./components/Temaer";
import { Utvikling } from "./components/Utvikling";
import { eksporterFilnavn } from "./lib/store";
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
  | "prompter"
  | "horinger"
  | "utvikling";

const SIDER: { id: Side; label: string }[] = [
  { id: "oversikt", label: "Oversikt" },
  { id: "kompetansemaal", label: "Kompetansemål" },
  { id: "kapittel", label: "Kapittel" },
  { id: "fagord", label: "Fagord" },
  { id: "kilder", label: "Kilder" },
  { id: "laringslop", label: "Læringsløp" },
  { id: "prompter", label: "Prompter" },
  { id: "horinger", label: "Høringer" },
  { id: "utvikling", label: "Utvikling" },
];

export default function App() {
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
    importer,
    eksporter,
    settBibliotekFraDisk,
    lagringsfeil,
    umigrert,
    koblingTekster,
    avgjorKobling,
  } = useStore();
  const [side, setSide] = useState<Side>("oversikt");
  const [importFeil, setImportFeil] = useState<string | null>(null);
  const [importOk, setImportOk] = useState(false);
  const [horingPagar, setHoringPagar] = useState(false);
  const filRef = useRef<HTMLInputElement>(null);
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

  function lastNed() {
    const blob = new Blob([JSON.stringify(eksporter(), null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = eksporterFilnavn();
    a.click();
    URL.revokeObjectURL(url);
  }

  async function onImport(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setImportOk(false);
    try {
      const text = await file.text();
      const raw: unknown = JSON.parse(text);
      await importer(raw);
      setImportFeil(null);
      setImportOk(true);
    } catch (err) {
      const melding =
        err instanceof SyntaxError
          ? "Filen er ikke gyldig JSON."
          : err instanceof Error
            ? err.message
            : "Kunne ikke lese filen.";
      setImportFeil(melding);
    }
  }

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
              <button
                type="button"
                className={`rounded-lg px-2.5 py-1.5 text-sm ${
                  visEmoji ? "bg-[#191C1F] text-white" : "bg-[#F6F5F1]"
                }`}
                aria-pressed={visEmoji}
                onClick={() => setInnstillinger({ visEmoji: !visEmoji })}
              >
                Emoji
              </button>
              <button
                type="button"
                className="rounded-lg bg-[#F6F5F1] px-2.5 py-1.5 text-sm"
                onClick={lastNed}
              >
                Eksporter
              </button>
              <button
                type="button"
                className="rounded-lg bg-[#F6F5F1] px-2.5 py-1.5 text-sm"
                onClick={() => filRef.current?.click()}
              >
                Importer
              </button>
              <input
                ref={filRef}
                type="file"
                accept="application/json,.json"
                className="hidden"
                onChange={onImport}
              />
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
            rader fra før databasen ble tatt i bruk. De er ikke slettet. Trykk{" "}
            <span className="font-medium">Eksporter</span> og kjør{" "}
            <code className="rounded bg-[#F6F5F1] px-1">npm run migrer -- filen.json</code> for å få
            dem inn.
          </p>
        )}
        {importFeil && (
          <p className="mb-4 rounded-xl bg-[#A63A2A]/10 px-4 py-3 text-sm text-[#A63A2A]" role="alert">
            Import feilet: {importFeil}{" "}
            <button type="button" className="underline" onClick={() => setImportFeil(null)}>
              Lukk
            </button>
          </p>
        )}
        {importOk && !importFeil && (
          <p className="mb-4 rounded-xl bg-[#2E6B4B]/10 px-4 py-3 text-sm text-[#2E6B4B]">
            Tilstanden er lest inn. JSON-filene i repoet er fremdeles utgangspunktet; det du
            importerte ligger i nettleseren.{" "}
            <button type="button" className="underline" onClick={() => setImportOk(false)}>
              Lukk
            </button>
          </p>
        )}

        {side === "oversikt" && <Oversikt state={state} />}
        {side === "kompetansemaal" && (
          <KompetansemaalListe key={state.innstillinger.aktivtFag} state={state} />
        )}
        {side === "kapittel" && (
          <Temaer
            key={state.innstillinger.aktivtFag}
            state={state}
            prompts={proveniensPrompts}
            onLagreHoring={appendHoring}
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
        {side === "prompter" && (
          <Promptbibliotek
            prompts={state.prompts}
            skills={state.skills}
            fag={state.fag}
            onImportert={settBibliotekFraDisk}
          />
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
