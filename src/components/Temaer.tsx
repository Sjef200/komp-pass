import { useMemo, useState } from "react";
import { statusTekst } from "../lib/colors";
import { formatSnitt, sisteHoring, sisteKarakter } from "../lib/dekning";
import { grupperKapittel, maalSomTrefferKapittel } from "../lib/kapittel";
import { maalIFag, temaerIFag } from "../lib/store";
import type { AppState, Horing, Prompt, Tema } from "../lib/types";
import { HoringForm } from "./HoringForm";
import { KarakterTall } from "./KarakterTall";

type Filter = "alle" | "svake" | "uhorte";

export function Temaer({
  state,
  onLagreHoring,
  prompts,
  onHoringPagar,
}: {
  state: AppState;
  onLagreHoring: (h: Horing) => void;
  prompts?: Prompt[];
  onHoringPagar?: (pagar: boolean) => void;
}) {
  const visEmoji = state.innstillinger.visEmoji;
  const temaer = temaerIFag(state);
  const maal = maalIFag(state);
  const maalById = useMemo(
    () => Object.fromEntries(maal.map((m) => [m.id, m])),
    [maal],
  );
  const [filter, setFilter] = useState<Filter>("alle");
  const [skjemaTema, setSkjemaTema] = useState<string | null>(null);
  const kapitler = grupperKapittel(temaer, state.horinger);

  const filtrertIds = new Set(
    temaer
      .filter((t) => {
        const k = sisteKarakter(state.horinger, t.id);
        if (filter === "uhorte") return k == null;
        if (filter === "svake") return k != null && k < 4;
        return true;
      })
      .map((t) => t.id),
  );

  const visteKapitler = kapitler
    .map((k) => ({ ...k, temaer: k.temaer.filter((t) => filtrertIds.has(t.id)) }))
    .filter((k) => k.temaer.length > 0);

  if (temaer.length === 0) {
    return (
      <TomtFag
        tittel="Ingen kapitler i dette faget ennå"
        tekst="Kapittel er læreverkets inndeling. Legg inn temaer med kapittel i src/data/temaer.json."
      />
    );
  }

  return (
    <div>
      <p className="mb-4 text-sm text-[#191C1F]/70">
        Kapittel er læreverkets inndeling, ikke Udirs kompetansemål. Temaer inni kapittelet
        treffer ett eller flere mål. Høringen logges på temaet.
      </p>
      <div className="mb-4 flex flex-wrap gap-2">
        {(
          [
            ["alle", "Alle"],
            ["svake", "Bare svake"],
            ["uhorte", "Bare uhørte"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setFilter(id)}
            className={`rounded-full px-3 py-1.5 text-sm ${
              filter === id ? "bg-[#191C1F] text-white" : "bg-white text-[#191C1F]"
            }`}
            aria-pressed={filter === id}
          >
            {label}
          </button>
        ))}
      </div>

      {visteKapitler.length === 0 ? (
        <p className="rounded-2xl bg-white px-4 py-8 text-center text-sm text-[#191C1F]/60">
          Ingen temaer matcher filteret.
        </p>
      ) : (
        <div className="space-y-8">
          {visteKapitler.map((kapittel) => {
            const maalIKapittel = maalSomTrefferKapittel(maal, kapittel.temaer);
            return (
              <section key={kapittel.id}>
                <div className="mb-3 flex items-end justify-between gap-3">
                  <div>
                    <h2 className="font-medium">{kapittel.navn}</h2>
                    <p className="mt-0.5 text-xs text-[#191C1F]/50">
                      Kapittel · {kapittel.horte}/{kapittel.temaer.length} temaer hørt
                      {kapittel.snitt != null ? ` · snitt ${formatSnitt(kapittel.snitt)}` : ""}
                    </p>
                  </div>
                </div>
                {maalIKapittel.length > 0 && (
                  <div className="mb-3 flex flex-wrap gap-1.5">
                    {maalIKapittel.map((m) => (
                      <span
                        key={m.id}
                        className="rounded-full bg-white px-2 py-0.5 text-xs text-[#191C1F]/70"
                      >
                        {m.udirKode ?? m.id}: {m.kortnavn}
                      </span>
                    ))}
                  </div>
                )}
                <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  {kapittel.temaer.map((tema) => (
                    <TemaKort
                      key={tema.id}
                      tema={tema}
                      state={state}
                      visEmoji={visEmoji}
                      maalById={maalById}
                      onNyHoring={() => {
                        setSkjemaTema(tema.id);
                        onHoringPagar?.(true);
                      }}
                    />
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      )}

      {skjemaTema && (
        <HoringForm
          temaer={temaer}
          visEmoji={visEmoji}
          prompts={prompts ?? state.prompts}
          forhåndsvalgtTemaId={skjemaTema}
          onLagre={(h) => {
            onLagreHoring(h);
            setSkjemaTema(null);
            onHoringPagar?.(false);
          }}
          onAvbryt={() => {
            setSkjemaTema(null);
            onHoringPagar?.(false);
          }}
        />
      )}
    </div>
  );
}

function TemaKort({
  tema,
  state,
  visEmoji,
  maalById,
  onNyHoring,
}: {
  tema: Tema;
  state: AppState;
  visEmoji: boolean;
  maalById: Record<string, { kortnavn: string; emoji: string }>;
  onNyHoring: () => void;
}) {
  const horing = sisteHoring(state.horinger, tema.id);
  const karakter = horing?.karakter ?? null;
  const notat = [horing?.riktig, horing?.mangler].filter(Boolean).join(" · ");

  return (
    <li className="flex flex-col rounded-2xl bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-2">
          {visEmoji && (
            <span className="text-xl" aria-hidden>
              {tema.emoji}
            </span>
          )}
          <div className="min-w-0">
            <h3 className="font-medium leading-snug">{tema.navn}</h3>
            <p className="mt-0.5 text-xs text-[#191C1F]/50">
              {tema.kapittel ? `${tema.kapittel} · ` : ""}
              {statusTekst(karakter)}
            </p>
          </div>
        </div>
        <KarakterTall karakter={karakter} size="lg" />
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {tema.maalIds.map((id) => {
          const maal = maalById[id];
          if (!maal) return null;
          return (
            <span
              key={id}
              className="rounded-full bg-[#F6F5F1] px-2 py-0.5 text-xs text-[#191C1F]/80"
            >
              {maal.kortnavn}
            </span>
          );
        })}
      </div>

      <p className="mt-3 min-h-10 flex-1 text-sm text-[#191C1F]/70">
        {notat || (horing ? "Hørt, men uten notat." : "Ikke hørt ennå.")}
      </p>

      <button
        type="button"
        onClick={onNyHoring}
        className="mt-3 self-start rounded-lg bg-[#F6F5F1] px-3 py-1.5 text-sm"
      >
        Logg høring
      </button>
    </li>
  );
}

export function TomtFag({ tittel, tekst }: { tittel: string; tekst: string }) {
  return (
    <div className="rounded-2xl bg-white px-5 py-10 text-center">
      <p className="font-medium">{tittel}</p>
      <p className="mx-auto mt-2 max-w-md text-sm text-[#191C1F]/60">{tekst}</p>
    </div>
  );
}
