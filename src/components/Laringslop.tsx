import { useMemo } from "react";
import { karakterFarge } from "../lib/colors";
import { formatSnitt } from "../lib/dekning";
import { formatDato } from "../lib/format";
import {
  GAP_TEKST,
  laringslop,
  sorterEtterGap,
  sorterTemaEtterGap,
  tidslinje,
  type Gap,
  type MaalLinje,
  type TemaLinje,
} from "../lib/laringslop";
import { aktivtFag } from "../lib/store";
import type { AppState } from "../lib/types";

const GAP_FARGE: Record<Gap, string> = {
  "undervist-ikke-hort": "#C2622C",
  "hort-svak": "#A63A2A",
  moden: "#B0770F",
  "ikke-undervist": "#9B9B93",
  sitter: "#2E6B4B",
};

export function Laringslop({ state }: { state: AppState }) {
  const fag = aktivtFag(state);
  const fagId = state.innstillinger.aktivtFag;
  const lop = useMemo(() => laringslop(state, fagId), [state, fagId]);
  const linjer = useMemo(() => sorterEtterGap(lop.linjer), [lop.linjer]);
  const temaLinjer = useMemo(() => sorterTemaEtterGap(lop.temaLinjer), [lop.temaLinjer]);
  const punkter = useMemo(() => tidslinje(state, fagId), [state, fagId]);

  const harKilder = state.kilder.some((k) => k.fagId === fagId);
  const gapet = lop.temaFordeling["undervist-ikke-hort"];

  return (
    <div className="space-y-6">
      <p className="text-sm text-[#191C1F]/60">
        {fag ? `${fag.navn} · ${fag.kode}` : "Fag"} · {lop.linjer.length} kompetansemål
      </p>

      <div className="rounded-2xl bg-white px-4 py-3.5 text-sm leading-relaxed text-[#191C1F]/75">
        <p>
          <span className="font-medium text-[#191C1F]">Undervist</span> er om det har vært
          gjennomgått i en kilde.{" "}
          <span className="font-medium text-[#191C1F]">Hørt</span> er om du har vist det.{" "}
          <span className="font-medium text-[#191C1F]">Behersket</span> er om det sitter. Tre
          forskjellige spørsmål — og avstanden mellom det første og det andre er der du taper
          karakterer uten å merke det.
        </p>
      </div>

      {harKilder ? (
        <div
          className="rounded-2xl px-5 py-4"
          style={{ background: gapet > 0 ? "#C2622C14" : "#2E6B4B14" }}
        >
          <p className="text-sm text-[#191C1F]/60">Gjennomgått, men aldri hørt</p>
          <p
            className="mt-2 font-serif text-5xl font-semibold leading-none"
            style={{ color: gapet > 0 ? "#C2622C" : "#2E6B4B" }}
          >
            {gapet}
          </p>
          <p className="mt-2 text-xs text-[#191C1F]/55">
            {gapet > 0
              ? `${gapet === 1 ? "Ett tema er" : `${gapet} temaer er`} gjennomgått uten at du er hørt i det. Det er det mest presise stedet å begynne.`
              : "Ingenting står ubesvart av det som er gjennomgått."}
          </p>
        </div>
      ) : (
        <p className="rounded-2xl bg-white px-4 py-3 text-sm text-[#191C1F]/70">
          Ingen kilder i dette faget ennå, så alt står som «ikke gjennomgått». Legg inn en
          forelesning eller et bokkapittel under fanen Kilder, så begynner tallet å bety noe.
        </p>
      )}

      {punkter.length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-medium uppercase tracking-wide text-[#191C1F]/55">
            Tidslinje
          </h2>
          <ul className="space-y-2">
            {punkter.map((p) => (
              <li key={p.kilde.id} className="rounded-2xl bg-white px-4 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{p.kilde.tittel}</p>
                    <p className="text-xs text-[#191C1F]/55">
                      {formatDato(p.dato)} · dekker {p.maal.length} mål
                    </p>
                  </div>
                  <p
                    className="shrink-0 text-xs"
                    style={{ color: p.hortEtter === 0 ? "#C2622C" : "#2E6B4B" }}
                  >
                    {p.hortEtter === 0 ? "aldri hørt etterpå" : `${p.hortEtter} høringer etterpå`}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <h2 className="mb-2 text-sm font-medium uppercase tracking-wide text-[#191C1F]/55">
          Per tema
        </h2>
        <p className="mb-3 text-sm text-[#191C1F]/60">
          Temaet er enheten du kan gjøre noe med. Et kompetansemål henger på et helt kapittel, så
          gapet der skjules så snart ett tema er hørt.
        </p>
        <ul className="space-y-2">
          {temaLinjer.map((l) => (
            <TemaRad key={l.tema.id} linje={l} visEmoji={state.innstillinger.visEmoji} />
          ))}
        </ul>
      </section>

      <section>
        <h2 className="mb-2 text-sm font-medium uppercase tracking-wide text-[#191C1F]/55">
          Per kompetansemål
        </h2>
        <ul className="space-y-2">
          {linjer.map((l) => (
            <MaalRad key={l.maal.id} linje={l} />
          ))}
        </ul>
      </section>
    </div>
  );
}

function MaalRad({ linje }: { linje: MaalLinje }) {
  const { maal, undervist, hortAntall, hortSist, dekning, gap } = linje;
  return (
    <li className="rounded-2xl bg-white px-4 py-3">
      <div className="flex items-start justify-between gap-3">
        <p className="min-w-0 truncate font-medium">{maal.kortnavn}</p>
        <span
          className="shrink-0 rounded-full px-2 py-0.5 text-xs"
          style={{ background: `${GAP_FARGE[gap]}1a`, color: GAP_FARGE[gap] }}
        >
          {GAP_TEKST[gap]}
        </span>
      </div>
      <dl className="mt-2 grid grid-cols-3 gap-3 text-xs">
        <div>
          <dt className="text-[#191C1F]/45">Undervist</dt>
          <dd className="mt-0.5">
            {undervist.kilder.length === 0
              ? "–"
              : `${undervist.kilder.length} kilde${undervist.kilder.length === 1 ? "" : "r"}`}
            {undervist.sist ? (
              <span className="text-[#191C1F]/45"> · {formatDato(undervist.sist)}</span>
            ) : null}
          </dd>
        </div>
        <div>
          <dt className="text-[#191C1F]/45">Hørt</dt>
          <dd className="mt-0.5">
            {hortAntall === 0 ? "aldri" : `${hortAntall} ganger`}
            {hortSist ? <span className="text-[#191C1F]/45"> · {formatDato(hortSist)}</span> : null}
          </dd>
        </div>
        <div>
          <dt className="text-[#191C1F]/45">Behersket</dt>
          <dd className="mt-0.5" style={{ color: karakterFarge(dekning.snitt) }}>
            {formatSnitt(dekning.snitt)}
            {dekning.dagerSiden != null ? (
              <span className="text-[#191C1F]/45"> · {dekning.dagerSiden} d siden</span>
            ) : null}
          </dd>
        </div>
      </dl>
      {undervist.kilder.length > 0 && (
        <p className="mt-2 truncate text-xs text-[#191C1F]/45">
          {undervist.kilder.map((k) => k.tittel).join(" · ")}
        </p>
      )}
    </li>
  );
}

function TemaRad({ linje, visEmoji }: { linje: TemaLinje; visEmoji: boolean }) {
  const { tema, undervist, hortAntall, hortSist, karakter, dagerSiden, gap } = linje;
  return (
    <li className="rounded-2xl bg-white px-4 py-3">
      <div className="flex items-start justify-between gap-3">
        <p className="min-w-0 truncate font-medium">
          {visEmoji ? `${tema.emoji} ` : ""}
          {tema.navn}
        </p>
        <span
          className="shrink-0 rounded-full px-2 py-0.5 text-xs"
          style={{ background: `${GAP_FARGE[gap]}1a`, color: GAP_FARGE[gap] }}
        >
          {GAP_TEKST[gap]}
        </span>
      </div>
      <p className="mt-1.5 text-xs text-[#191C1F]/55">
        {undervist.sist ? `Gjennomgått ${formatDato(undervist.sist)}` : "Ikke gjennomgått"}
        {" · "}
        {hortAntall === 0
          ? "aldri hørt"
          : `hørt ${hortAntall} ${hortAntall === 1 ? "gang" : "ganger"}${
              hortSist ? `, sist ${formatDato(hortSist)}` : ""
            }`}
        {karakter != null ? (
          <>
            {" · "}
            <span style={{ color: karakterFarge(karakter) }}>karakter {karakter}</span>
            {dagerSiden != null ? ` for ${dagerSiden} d siden` : ""}
          </>
        ) : null}
      </p>
    </li>
  );
}
