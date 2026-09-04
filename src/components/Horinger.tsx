import { useState } from "react";
import { formatDato, kildeLinje } from "../lib/format";
import { aktivtFag, horingerIFag, temaerIFag } from "../lib/store";
import type { AppState, Horing, Prompt } from "../lib/types";
import { HoringForm } from "./HoringForm";
import { KarakterTall } from "./KarakterTall";
import { TomtFag } from "./Temaer";

export function Horinger({
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
  const fag = aktivtFag(state);
  const temaer = temaerIFag(state);
  const temaById = Object.fromEntries(temaer.map((t) => [t.id, t]));
  const horinger = [...horingerIFag(state)].sort((a, b) => {
    const dato = b.dato.localeCompare(a.dato);
    if (dato !== 0) return dato;
    return b.id.localeCompare(a.id);
  });
  const [skjema, setSkjema] = useState(false);

  if (temaer.length === 0) {
    return (
      <TomtFag
        tittel="Ingen temaer å høre i dette faget"
        tekst="Bytt til Markedsføring og ledelse 1, eller legg inn temaer før du logger høringer."
      />
    );
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-sm text-[#191C1F]/60">
          {fag ? `${fag.navn} · ${fag.kode}` : "Fag"} · {horinger.length} høring
          {horinger.length === 1 ? "" : "er"} · nyeste først
        </p>
        <button
          type="button"
          onClick={() => {
            setSkjema(true);
            onHoringPagar?.(true);
          }}
          className="rounded-lg bg-[#191C1F] px-3 py-2 text-sm text-white"
        >
          Ny høring
        </button>
      </div>

      {horinger.length === 0 ? (
        <p className="rounded-2xl bg-white px-4 py-8 text-center text-sm text-[#191C1F]/60">
          Ingen høringer i dette faget ennå. Logg den første, så får temaet karakter og
          kompetansemålene dekning.
        </p>
      ) : (
        <ol className="space-y-2">
          {horinger.map((h) => {
            const tema = temaById[h.temaId];
            return (
              <li key={h.id} className="rounded-2xl bg-white px-4 py-3.5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs text-[#191C1F]/50">{formatDato(h.dato)}</p>
                    <p className="mt-0.5 flex items-center gap-2 font-medium">
                      {visEmoji && tema && (
                        <span aria-hidden>{tema.emoji}</span>
                      )}
                      <span className="truncate">
                        {tema?.navn ?? h.temaId}
                      </span>
                    </p>
                  </div>
                  <KarakterTall karakter={h.karakter} size="md" />
                </div>
                {h.riktig ? (
                  <p className="mt-2 text-sm">
                    <span className="text-[#191C1F]/45">Satt: </span>
                    {h.riktig}
                  </p>
                ) : null}
                {h.mangler ? (
                  <p className="mt-1 text-sm">
                    <span className="text-[#191C1F]/45">Manglet: </span>
                    {h.mangler}
                  </p>
                ) : null}
                {!h.riktig && !h.mangler && (
                  <p className="mt-2 text-sm text-[#191C1F]/45">Uten notat.</p>
                )}
                <p className="mt-2 text-xs text-[#191C1F]/45">
                  {fag ? `${fag.kode} · ` : ""}
                  {kildeLinje(h)}
                </p>
              </li>
            );
          })}
        </ol>
      )}

      {skjema && (
        <HoringForm
          temaer={temaer}
          visEmoji={visEmoji}
          prompts={prompts ?? state.prompts}
          onLagre={(h) => {
            onLagreHoring(h);
            setSkjema(false);
            onHoringPagar?.(false);
          }}
          onAvbryt={() => {
            setSkjema(false);
            onHoringPagar?.(false);
          }}
        />
      )}
    </div>
  );
}
