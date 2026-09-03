import { useState, type ReactNode } from "react";
import { karakterFarge } from "../lib/colors";
import {
  formatSnitt,
  maalDekning,
  maalStatusLabel,
  snittSisteKarakter,
} from "../lib/dekning";
import { fagordIFag, maalIFag, temaerIFag } from "../lib/store";
import type { AppState, Kompetansemaal } from "../lib/types";
import { Dekningsstripe } from "./Dekningsstripe";

export function Oversikt({ state }: { state: AppState }) {
  const visEmoji = state.innstillinger.visEmoji;
  const temaer = temaerIFag(state);
  const maal = maalIFag(state);
  const fagord = fagordIFag(state);
  const [apnet, setApnet] = useState<string | null>(null);

  const horte = temaer.filter((t) =>
    state.horinger.some((h) => h.temaId === t.id),
  );
  const snitt = snittSisteKarakter(temaer, state.horinger);
  const glipper = fagord.filter((f) => f.status !== "sitter").length;
  const dekning = maal.map((m) => maalDekning(m, temaer, state.horinger));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Kpi label="Snittkarakter" hint="Siste karakter per hørte tema">
          <p
            className="font-serif text-5xl font-semibold leading-none"
            style={{
              color: karakterFarge(
                snitt == null ? null : Math.min(6, Math.max(1, Math.round(snitt))),
              ),
            }}
          >
            {formatSnitt(snitt)}
          </p>
        </Kpi>
        <Kpi label="Temaer hørt" hint="Av temaer i dette faget">
          <p className="font-serif text-5xl font-semibold leading-none">
            {horte.length}
            <span className="text-2xl font-normal text-[#191C1F]/45">
              {" "}
              / {temaer.length}
            </span>
          </p>
        </Kpi>
        <Kpi label="Fagord som ikke sitter" hint="Ny eller usikker">
          <p className="font-serif text-5xl font-semibold leading-none text-[#C2622C]">
            {glipper}
          </p>
          {temaer.length === 0 && (
            <p className="mt-2 text-sm text-[#191C1F]/55">Ingen temaer å knytte fagord til ennå.</p>
          )}
        </Kpi>
      </div>

      {temaer.length === 0 && (
        <p className="rounded-2xl bg-white px-4 py-3 text-sm text-[#191C1F]/70">
          Dette faget har kompetansemål, men ingen temaer ennå. Legg dem inn i{" "}
          <code className="rounded bg-[#F6F5F1] px-1">src/data/temaer.json</code>{" "}
          når dere kommer dit.
        </p>
      )}

      <section>
        <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-[#191C1F]/55">
          Kompetansemål
        </h2>
        <ul className="space-y-2">
          {dekning.map((d) => (
            <MaalRad
              key={d.maal.id}
              d={d}
              visEmoji={visEmoji}
              apnet={apnet === d.maal.id}
              onToggle={() =>
                setApnet((id) => (id === d.maal.id ? null : d.maal.id))
              }
            />
          ))}
        </ul>
      </section>
    </div>
  );
}

function Kpi({
  label,
  hint,
  children,
}: {
  label: string;
  hint: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-2xl bg-white px-5 py-4">
      <p className="text-sm text-[#191C1F]/55">{label}</p>
      <div className="mt-3 flex flex-col items-start">{children}</div>
      <p className="mt-2 text-xs text-[#191C1F]/45">{hint}</p>
    </div>
  );
}

function MaalRad({
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
              <span style={{ color: statusFarge }}>{maalStatusLabel(d.status)}</span>
              {d.snitt != null && <> · snitt {formatSnitt(d.snitt)}</>}
            </p>
          </div>
        </div>
        <div className="flex w-full items-center gap-3 sm:w-64 sm:shrink-0">
          <Dekningsstripe segmenter={d.segmenter} tittel={tittel} />
          <span className="w-20 shrink-0 text-right text-xs text-[#191C1F]/55">
            {d.totaltTemaer === 0
              ? "0 temaer"
              : `${d.totaltTemaer} tema${d.totaltTemaer === 1 ? "" : "er"}`}
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
