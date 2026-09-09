import { useState } from "react";
import { karakterFarge } from "../lib/colors";
import {
  formatSnitt,
  maalDekning,
  maalStatusLabel,
} from "../lib/dekning";
import { aktivtFag, maalIFag, temaerIFag } from "../lib/store";
import type { AppState, Kompetansemaal } from "../lib/types";
import { Dekningsstripe } from "./Dekningsstripe";
import { TomtFag } from "./Temaer";

export function KompetansemaalListe({ state }: { state: AppState }) {
  const visEmoji = state.innstillinger.visEmoji;
  const fag = aktivtFag(state);
  const temaer = temaerIFag(state);
  const maal = maalIFag(state);
  const [apnet, setApnet] = useState<string | null>(null);
  const dekning = maal.map((m) => maalDekning(m, temaer, state.horinger));

  if (maal.length === 0) {
    return (
      <TomtFag
        tittel="Ingen kompetansemål i dette faget"
        tekst="Kompetansemålene kommer fra Udir Grep. Kjør npm run fetch:udir, eller bytt fag."
      />
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-[#191C1F]/70">
        Kompetansemål er Udirs krav til hva du skal kunne
        {fag ? ` i ${fag.navn}` : ""}. De er ikke kapitler i boka. Dekning kommer fra
        selvstendige svar som eksplisitt er vurdert mot målet. Innholdskartleggingen er foreløpig ufullstendig; dette er ikke en eksamenskarakter.
      </p>
      <ul className="space-y-2">
        {dekning.map((d) => (
          <MaalRad
            key={d.maal.id}
            d={d}
            visEmoji={visEmoji}
            apnet={apnet === d.maal.id}
            onToggle={() => setApnet((id) => (id === d.maal.id ? null : d.maal.id))}
          />
        ))}
      </ul>
    </div>
  );
}

export function MaalRad({
  d,
  visEmoji,
  apnet,
  onToggle,
}: {
  d: ReturnType<typeof maalDekning>;
  visEmoji: boolean;
  apnet: boolean;
  onToggle: () => void;
}) {
  const maal: Kompetansemaal = d.maal;
  const statusFarge =
    d.status === "udekket"
      ? "#9B9B93"
      : d.status === "svak"
        ? "#C2622C"
        : d.status === "ok"
          ? "#B0770F"
          : "#2E6B4B";

  const tittel = d.segmenter
    .map((s) => `${s.navn}: ${s.karakter ?? "ikke hørt"}`)
    .join(" · ");

  return (
    <li className="rounded-2xl bg-white">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full flex-col gap-3 px-4 py-3.5 text-left sm:flex-row sm:items-center"
        aria-expanded={apnet}
      >
        <div className="flex min-w-0 flex-1 items-center gap-3">
          {visEmoji && (
            <span className="text-xl" aria-hidden>
              {maal.emoji}
            </span>
          )}
          <div className="min-w-0">
            <p className="truncate font-medium">{maal.kortnavn}</p>
            <p className="text-xs text-[#191C1F]/55">
              <span style={{ color: statusFarge }}>{d.delvis ? "delvis vurdert" : maalStatusLabel(d.status)}</span>
              {d.snitt != null && <> · snitt {formatSnitt(d.snitt)}</>}
              {maal.udirKode ? <> · Udir {maal.udirKode}</> : null}
            </p>
          </div>
        </div>
        <div className="flex w-full items-center gap-3 sm:w-64 sm:shrink-0">
          <Dekningsstripe segmenter={d.segmenter} tittel={tittel} />
          <span className="w-20 shrink-0 text-right text-xs text-[#191C1F]/55">
            {d.totaltTemaer === 0
              ? "0 temaer"
              : `${d.horteTemaer} av ${d.totaltTemaer} vurdert`}
          </span>
        </div>
      </button>
      {apnet && (
        <div className="border-t border-[#191C1F]/8 px-4 py-3 text-sm text-[#191C1F]/80">
          <p className="leading-relaxed">{maal.tekst}</p>
          {d.segmenter.length > 0 ? (
            <ul className="mt-3 space-y-1.5">
              {d.segmenter.map((s) => (
                <li key={s.temaId} className="flex items-center justify-between gap-3">
                  <span>{s.navn}</span>
                  <span
                    className="font-serif font-semibold"
                    style={{ color: karakterFarge(s.karakter) }}
                  >
                    {s.karakter ?? "–"}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-[#191C1F]/55">Ingen temaer er koblet til dette målet ennå.</p>
          )}
        </div>
      )}
    </li>
  );
}
