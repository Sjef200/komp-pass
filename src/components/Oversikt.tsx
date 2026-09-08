import { type ReactNode } from "react";
import { karakterFarge } from "../lib/colors";
import { formatSnitt, maalDekning, maalStatusLabel, snittSisteKarakter } from "../lib/dekning";
import { grupperKapittel, kapittelNavn } from "../lib/kapittel";
import { nesteTemaer } from "../lib/planlegging";
import { fagordIFag, maalIFag, temaerIFag, aktivtFag } from "../lib/store";
import type { AppState } from "../lib/types";

export function Oversikt({ state }: { state: AppState }) {
  const fag = aktivtFag(state);
  const temaer = temaerIFag(state);
  const maal = maalIFag(state);
  const fagord = fagordIFag(state);
  const kapitler = grupperKapittel(temaer, state.horinger);

  const horte = temaer.filter((t) =>
    state.horinger.some((h) => h.temaId === t.id),
  );
  const snitt = snittSisteKarakter(temaer, state.horinger);
  const glipper = fagord.filter((f) => f.status !== "sitter").length;
  const dekning = maal.map((m) => maalDekning(m, temaer, state.horinger));
  const maalUdekket = dekning.filter((d) => d.status === "udekket").length;
  const maalSvake = dekning.filter((d) => d.status === "svak").length;
  const ko = nesteTemaer(temaer, state.horinger, undefined, 4);

  return (
    <div className="space-y-6">
      {fag && (
        <p className="text-sm text-[#191C1F]/60">
          {fag.navn} · {fag.kode}
          {fag.laereplanKode ? ` · ${fag.laereplanKode}` : ""}
          {fag.kompetansemaalsettKode ? ` · ${fag.kompetansemaalsettKode}` : ""}
        </p>
      )}

      <div className="rounded-2xl bg-white px-4 py-3.5 text-sm leading-relaxed text-[#191C1F]/75">
        <p>
          <span className="font-medium text-[#191C1F]">Kompetansemål</span> er Udirs krav
          til hva du skal kunne.{" "}
          <span className="font-medium text-[#191C1F]">Kapittel</span> er hvordan boka
          deler opp faget. Du huker ikke av et mål fordi kapittelet er ferdig — dekning
          kommer fra høringer på temaer.
        </p>
      </div>

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

      {ko.length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-medium uppercase tracking-wide text-[#191C1F]/55">
            Hør meg i dette nå
          </h2>
          <p className="mb-3 text-sm text-[#191C1F]/60">
            Uhørt først, så det svake og det som har stått lenge. Rekkefølgen bytter kapittel
            med vilje.
          </p>
          <ol className="space-y-2">
            {ko.map((p) => (
              <li
                key={p.tema.id}
                className="flex items-center justify-between gap-3 rounded-2xl bg-white px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">
                    {state.innstillinger.visEmoji ? `${p.tema.emoji} ` : ""}
                    {p.tema.navn}
                  </p>
                  <p className="text-xs text-[#191C1F]/55">
                    {kapittelNavn(p.tema)} · {p.grunn}
                  </p>
                </div>
                <p
                  className="shrink-0 font-serif text-2xl font-semibold"
                  style={{ color: karakterFarge(p.karakter) }}
                >
                  {p.karakter ?? "–"}
                </p>
              </li>
            ))}
          </ol>
        </section>
      )}

      <section>
        <h2 className="mb-2 text-sm font-medium uppercase tracking-wide text-[#191C1F]/55">
          Kompetansemål
        </h2>
        <p className="mb-3 text-sm text-[#191C1F]/60">
          {maal.length} mål fra Udir
          {maalUdekket > 0 ? ` · ${maalUdekket} udekket` : ""}
          {maalSvake > 0 ? ` · ${maalSvake} svake` : ""}
          . Full liste under fanen Kompetansemål.
        </p>
        <ul className="space-y-2">
          {dekning.slice(0, 4).map((d) => (
            <li key={d.maal.id} className="rounded-2xl bg-white px-4 py-3">
              <p className="truncate font-medium">{d.maal.kortnavn}</p>
              <p className="text-xs text-[#191C1F]/55">
                {maalStatusLabel(d.status)}
                {d.snitt != null && <> · snitt {formatSnitt(d.snitt)}</>}
                {d.maal.udirKode ? <> · {d.maal.udirKode}</> : null}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="mb-2 text-sm font-medium uppercase tracking-wide text-[#191C1F]/55">
          Kapittel
        </h2>
        {kapitler.length === 0 ? (
          <p className="rounded-2xl bg-white px-4 py-3 text-sm text-[#191C1F]/70">
            Dette faget har kompetansemål, men ingen kapitler eller temaer ennå. Legg dem inn i{" "}
            <code className="rounded bg-[#F6F5F1] px-1">src/data/temaer.json</code>.
          </p>
        ) : (
          <ul className="space-y-2">
            {kapitler.map((k) => (
              <li key={k.id} className="rounded-2xl bg-white px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium">{k.navn}</p>
                    <p className="text-xs text-[#191C1F]/55">
                      {k.horte}/{k.temaer.length} temaer hørt · læreverk, ikke Udir-mål
                    </p>
                  </div>
                  <p
                    className="font-serif text-2xl font-semibold"
                    style={{
                      color: karakterFarge(
                        k.snitt == null ? null : Math.min(6, Math.max(1, Math.round(k.snitt))),
                      ),
                    }}
                  >
                    {formatSnitt(k.snitt)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
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
