import { useEffect, useId, useState, type FormEvent } from "react";
import { karakterFarge } from "../lib/colors";
import { iDagIso, nyId } from "../lib/format";
import type { AiInnsats, Karakter, Horing, Kilde, Prompt, Tema } from "../lib/types";

const KARAKTERER: Karakter[] = [1, 2, 3, 4, 5, 6];
const KILDER: { id: Kilde; label: string }[] = [
  { id: "selv", label: "Selv" },
  { id: "larer", label: "Lærer" },
  { id: "ai", label: "KI" },
];
const INNSATS: { id: AiInnsats; label: string }[] = [
  { id: "lav", label: "Lav" },
  { id: "medium", label: "Medium" },
  { id: "hoy", label: "Høy" },
  { id: "maks", label: "Maks" },
];

type Props = {
  temaer: Tema[];
  visEmoji: boolean;
  prompts?: Prompt[];
  forhåndsvalgtTemaId?: string;
  onLagre: (horing: Horing) => void;
  onAvbryt: () => void;
};

export function HoringForm({
  temaer,
  visEmoji,
  prompts = [],
  forhåndsvalgtTemaId,
  onLagre,
  onAvbryt,
}: Props) {
  const headingId = useId();
  const [temaId, setTemaId] = useState(
    forhåndsvalgtTemaId ?? temaer[0]?.id ?? "",
  );
  const [dato, setDato] = useState(iDagIso);
  const [karakter, setKarakter] = useState<Karakter | null>(null);
  const [sporsmal, setSporsmal] = useState("");
  const [svar, setSvar] = useState("");
  const [riktig, setRiktig] = useState("");
  const [mangler, setMangler] = useState("");
  const [kilde, setKilde] = useState<Kilde>("selv");
  const [modell, setModell] = useState("");
  const [innsats, setInnsats] = useState<AiInnsats>("hoy");
  const [promptId, setPromptId] = useState(prompts[0]?.id ?? "");
  const valgtPromptId = promptId || prompts[0]?.id || "";
  const [feil, setFeil] = useState<string | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onAvbryt();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onAvbryt]);

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!temaId) {
      setFeil("Velg et tema.");
      return;
    }
    if (karakter == null) {
      setFeil("Velg karakter.");
      return;
    }
    if (kilde === "ai") {
      if (!sporsmal.trim() || !svar.trim()) {
        setFeil("En KI-høring må ha både spørsmålet og svaret ditt.");
        return;
      }
      if (!modell.trim()) {
        setFeil("Oppgi hvilken modell som ble brukt.");
        return;
      }
      if (!valgtPromptId) {
        setFeil("Velg hvilken prompt som ble brukt.");
        return;
      }
    }
    const prompt = prompts.find((p) => p.id === valgtPromptId);
    onLagre({
      id: nyId("h"),
      temaId,
      dato,
      karakter,
      riktig: riktig.trim(),
      mangler: mangler.trim(),
      ...(sporsmal.trim() ? { sporsmal: sporsmal.trim() } : {}),
      ...(svar.trim() ? { svar: svar.trim() } : {}),
      kilde,
      ai:
        kilde === "ai"
          ? {
              modell: modell.trim(),
              innsats,
              promptId: valgtPromptId,
              promptNavn: prompt?.navn ?? valgtPromptId,
            }
          : undefined,
    });
  }

  return (
    <div
      className="fixed inset-0 z-40 flex items-end justify-center bg-[#191C1F]/40 p-0 sm:items-center sm:p-4 pt-[env(safe-area-inset-top)]"
      onClick={onAvbryt}
      role="presentation"
    >
      <form
        className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-white p-5 shadow-xl sm:rounded-2xl sm:p-6"
        onClick={(e) => e.stopPropagation()}
        onSubmit={submit}
        aria-labelledby={headingId}
      >
        <h2 id={headingId} className="text-lg font-medium">
          Ny høring
        </h2>
        <p className="mt-1 text-sm text-[#191C1F]/65">
          Høringer er append-only. Karakteren på temaet blir den siste du logger.
        </p>

        <label className="mt-5 block text-sm font-medium">
          Tema
          <select
            className="mt-1 w-full rounded-lg border border-[#191C1F]/15 bg-white px-3 py-2 text-sm"
            value={temaId}
            onChange={(e) => setTemaId(e.target.value)}
          >
            {temaer.length === 0 && <option value="">Ingen temaer i faget</option>}
            {temaer.map((t) => (
              <option key={t.id} value={t.id}>
                {visEmoji ? `${t.emoji} ` : ""}
                {t.navn}
              </option>
            ))}
          </select>
        </label>

        <label className="mt-4 block text-sm font-medium">
          Dato
          <input
            type="date"
            className="mt-1 w-full rounded-lg border border-[#191C1F]/15 px-3 py-2 text-sm"
            value={dato}
            onChange={(e) => setDato(e.target.value)}
            required
          />
        </label>

        <fieldset className="mt-4">
          <legend className="text-sm font-medium">Karakter</legend>
          <div className="mt-2 flex gap-2">
            {KARAKTERER.map((k) => {
              const valgt = karakter === k;
              return (
                <button
                  key={k}
                  type="button"
                  onClick={() => setKarakter(k)}
                  className="flex h-11 flex-1 items-center justify-center rounded-lg font-serif text-xl font-semibold transition"
                  style={{
                    background: valgt ? karakterFarge(k) : "transparent",
                    color: valgt ? "#fff" : karakterFarge(k),
                    boxShadow: valgt ? "none" : `inset 0 0 0 1px ${karakterFarge(k)}40`,
                  }}
                  aria-pressed={valgt}
                >
                  {k}
                </button>
              );
            })}
          </div>
        </fieldset>

        <label className="mt-4 block text-sm font-medium">
          Spørsmålet
          <textarea
            className="mt-1 min-h-16 w-full rounded-lg border border-[#191C1F]/15 px-3 py-2 text-sm"
            value={sporsmal}
            onChange={(e) => setSporsmal(e.target.value)}
            placeholder="Spørsmålet du ble stilt"
          />
        </label>

        <label className="mt-4 block text-sm font-medium">
          Svaret ditt
          <textarea
            className="mt-1 min-h-24 w-full rounded-lg border border-[#191C1F]/15 px-3 py-2 text-sm"
            value={svar}
            onChange={(e) => setSvar(e.target.value)}
            placeholder="Så ordrett du husker det. Da kan du ta samme spørsmål på nytt og se forskjellen."
          />
        </label>

        <label className="mt-4 block text-sm font-medium">
          Hva som satt
          <textarea
            className="mt-1 min-h-20 w-full rounded-lg border border-[#191C1F]/15 px-3 py-2 text-sm"
            value={riktig}
            onChange={(e) => setRiktig(e.target.value)}
            placeholder="Det som var på plass i høringen"
          />
        </label>

        <label className="mt-4 block text-sm font-medium">
          Hva som manglet for 6
          <textarea
            className="mt-1 min-h-20 w-full rounded-lg border border-[#191C1F]/15 px-3 py-2 text-sm"
            value={mangler}
            onChange={(e) => setMangler(e.target.value)}
            placeholder="Det som gjenstår"
          />
        </label>

        <fieldset className="mt-4">
          <legend className="text-sm font-medium">Kilde</legend>
          <div className="mt-2 flex gap-2">
            {KILDER.map((k) => (
              <button
                key={k.id}
                type="button"
                onClick={() => setKilde(k.id)}
                className={`flex-1 rounded-lg px-3 py-2 text-sm ${
                  kilde === k.id
                    ? "bg-[#191C1F] text-white"
                    : "bg-[#F6F5F1] text-[#191C1F]"
                }`}
                aria-pressed={kilde === k.id}
              >
                {k.label}
              </button>
            ))}
          </div>
        </fieldset>

        {kilde === "ai" && (
          <div className="mt-4 space-y-3 rounded-xl bg-[#F6F5F1] p-3">
            <label className="block text-sm font-medium">
              Modell
              <input
                className="mt-1 w-full rounded-lg border border-[#191C1F]/15 bg-white px-3 py-2 text-sm"
                value={modell}
                onChange={(e) => setModell(e.target.value)}
                placeholder="f.eks. Cursor Grok 4.6"
              />
            </label>
            <fieldset>
              <legend className="text-sm font-medium">Innsats</legend>
              <div className="mt-2 flex flex-wrap gap-2">
                {INNSATS.map((i) => (
                  <button
                    key={i.id}
                    type="button"
                    onClick={() => setInnsats(i.id)}
                    className={`rounded-lg px-3 py-1.5 text-sm ${
                      innsats === i.id ? "bg-[#191C1F] text-white" : "bg-white"
                    }`}
                    aria-pressed={innsats === i.id}
                  >
                    {i.label}
                  </button>
                ))}
              </div>
            </fieldset>
            <label className="block text-sm font-medium">
              Prompt
              <select
                className="mt-1 w-full rounded-lg border border-[#191C1F]/15 bg-white px-3 py-2 text-sm"
                value={valgtPromptId}
                onChange={(e) => setPromptId(e.target.value)}
              >
                {prompts.length === 0 && (
                  <option value="">Ingen prompter i biblioteket</option>
                )}
                {prompts.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.navn}
                  </option>
                ))}
              </select>
            </label>
          </div>
        )}

        {feil && (
          <p className="mt-4 text-sm text-[#A63A2A]" role="alert">
            {feil}
          </p>
        )}

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onAvbryt}
            className="flex-1 rounded-lg px-4 py-2.5 text-sm text-[#191C1F]/80"
          >
            Avbryt
          </button>
          <button
            type="submit"
            className="flex-1 rounded-lg bg-[#191C1F] px-4 py-2.5 text-sm text-white"
          >
            Lagre høring
          </button>
        </div>
      </form>
    </div>
  );
}
