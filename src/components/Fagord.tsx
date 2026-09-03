import { useMemo, useState } from "react";
import { fagordIFag, temaerIFag } from "../lib/store";
import type { AppState, Fagord, FagordStatus } from "../lib/types";
import { TomtFag } from "./Temaer";

const STATUS: { id: FagordStatus; label: string }[] = [
  { id: "ny", label: "Ny" },
  { id: "usikker", label: "Usikker" },
  { id: "sitter", label: "Sitter" },
];

const STATUS_FARGE: Record<FagordStatus, string> = {
  ny: "#9B9B93",
  usikker: "#C2622C",
  sitter: "#2E6B4B",
};

export function FagordListe({
  state,
  onStatus,
}: {
  state: AppState;
  onStatus: (id: string, status: FagordStatus) => void;
}) {
  const visEmoji = state.innstillinger.visEmoji;
  const temaer = temaerIFag(state);
  const fagord = fagordIFag(state);
  const [temaFilter, setTemaFilter] = useState("alle");
  const [flashcard, setFlashcard] = useState(false);
  const [skjulte, setSkjulte] = useState<Set<string>>(new Set());

  const filtrert = useMemo(() => {
    if (temaFilter === "alle") return fagord;
    return fagord.filter((f) => f.temaIds.includes(temaFilter));
  }, [fagord, temaFilter]);

  function visForklaring(id: string): boolean {
    const manueltSkjult = skjulte.has(id);
    if (flashcard) return manueltSkjult;
    return !manueltSkjult;
  }

  function toggle(id: string) {
    setSkjulte((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  if (temaer.length === 0) {
    return (
      <TomtFag
        tittel="Ingen fagord å vise"
        tekst="Fagord er knyttet til temaer. Når temaene for dette faget ligger i JSON, dukker begrepene opp her."
      />
    );
  }

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <label className="text-sm">
          <span className="sr-only">Filter på tema</span>
          <select
            className="rounded-lg border border-[#191C1F]/15 bg-white px-3 py-2 text-sm"
            value={temaFilter}
            onChange={(e) => setTemaFilter(e.target.value)}
          >
            <option value="alle">Alle temaer</option>
            {temaer.map((t) => (
              <option key={t.id} value={t.id}>
                {visEmoji ? `${t.emoji} ` : ""}
                {t.navn}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          onClick={() => {
            setFlashcard((v) => !v);
            setSkjulte(new Set());
          }}
          className={`self-start rounded-full px-3 py-1.5 text-sm ${
            flashcard ? "bg-[#191C1F] text-white" : "bg-white"
          }`}
          aria-pressed={flashcard}
        >
          Flashcard-modus
        </button>
      </div>

      {filtrert.length === 0 ? (
        <p className="rounded-2xl bg-white px-4 py-8 text-center text-sm text-[#191C1F]/60">
          Ingen fagord for dette filteret.
        </p>
      ) : (
        <ul className="space-y-2">
          {filtrert.map((f) => (
            <FagordKort
              key={f.id}
              fagord={f}
              visForklaring={visForklaring(f.id)}
              flashcard={flashcard}
              onToggle={() => toggle(f.id)}
              onStatus={(status) => onStatus(f.id, status)}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function FagordKort({
  fagord,
  visForklaring,
  flashcard,
  onToggle,
  onStatus,
}: {
  fagord: Fagord;
  visForklaring: boolean;
  flashcard: boolean;
  onToggle: () => void;
  onStatus: (status: FagordStatus) => void;
}) {
  return (
    <li className="rounded-2xl bg-white">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-start justify-between gap-3 px-4 py-3.5 text-left"
      >
        <div className="min-w-0">
          <p className="font-medium">{fagord.term}</p>
          {visForklaring ? (
            <p className="mt-1 text-sm leading-relaxed text-[#191C1F]/75">
              {fagord.forklaring}
            </p>
          ) : (
            <p className="mt-1 text-sm text-[#191C1F]/40">
              {flashcard ? "Klikk for å vise skillet" : "Klikk for å vise forklaringen"}
            </p>
          )}
          {fagord.sisteFeil ? (
            <p className="mt-2 text-xs text-[#A63A2A]">Sist sagt i stedet: {fagord.sisteFeil}</p>
          ) : null}
        </div>
      </button>
      <div className="flex gap-1.5 border-t border-[#191C1F]/8 px-4 py-2.5">
        {STATUS.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => onStatus(s.id)}
            className="rounded-full px-2.5 py-1 text-xs"
            style={{
              background: fagord.status === s.id ? STATUS_FARGE[s.id] : "#F6F5F1",
              color: fagord.status === s.id ? "#fff" : "#191C1F",
            }}
            aria-pressed={fagord.status === s.id}
          >
            {s.label}
          </button>
        ))}
      </div>
    </li>
  );
}
