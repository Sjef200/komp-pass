import { useMemo } from "react";
import { karakterFarge } from "../lib/colors";
import { isoUkeNokkel, ukeEtikett } from "../lib/format";
import { horingerIFag, temaerIFag } from "../lib/store";
import type { AppState, Horing, Tema } from "../lib/types";
import { TomtFag } from "./Temaer";

type UkePunkt = { uke: string; snitt: number; n: number };

export function Utvikling({ state }: { state: AppState }) {
  const visEmoji = state.innstillinger.visEmoji;
  const temaer = temaerIFag(state);
  const horinger = horingerIFag(state);

  const uker = useMemo(() => ukesnitt(horinger), [horinger]);
  const temaSerier = useMemo(
    () =>
      temaer
        .map((tema) => {
          const hs = horinger
            .filter((h) => h.temaId === tema.id)
            .sort((a, b) => a.dato.localeCompare(b.dato));
          return { tema, horinger: hs };
        })
        .filter((s) => s.horinger.length >= 2),
    [temaer, horinger],
  );

  if (temaer.length === 0) {
    return (
      <TomtFag
        tittel="Ingen utvikling å vise"
        tekst="Bytt fag, eller legg inn temaer og høringer først."
      />
    );
  }

  if (horinger.length === 0) {
    return (
      <TomtFag
        tittel="For få høringer til å vise utvikling"
        tekst="Logg høringer over tid. Grafen bruker snitt per uke, og tegner en linje per tema som er hørt mer enn én gang."
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-white p-4 sm:p-5">
        <h2 className="text-sm font-medium">Snittkarakter per uke</h2>
        <p className="mt-1 text-xs text-[#191C1F]/50">
          Gjennomsnitt av alle høringer den uken. Tynne linjer er temaer med mer enn én høring.
        </p>
        <UkeGraf uker={uker} temaSerier={temaSerier} visEmoji={visEmoji} />
      </div>

      {temaSerier.length === 0 && (
        <p className="text-sm text-[#191C1F]/55">
          Ingen temaer har mer enn én høring ennå. Logg en ny høring på et tema du allerede har
          hørt, så dukker linjen opp.
        </p>
      )}
    </div>
  );
}

function ukesnitt(horinger: Horing[]): UkePunkt[] {
  const map = new Map<string, { sum: number; n: number }>();
  for (const h of horinger) {
    const uke = isoUkeNokkel(h.dato);
    const cur = map.get(uke) ?? { sum: 0, n: 0 };
    cur.sum += h.karakter;
    cur.n += 1;
    map.set(uke, cur);
  }
  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([uke, { sum, n }]) => ({ uke, snitt: sum / n, n }));
}

function UkeGraf({
  uker,
  temaSerier,
  visEmoji,
}: {
  uker: UkePunkt[];
  temaSerier: { tema: Tema; horinger: Horing[] }[];
  visEmoji: boolean;
}) {
  const w = 640;
  const h = 260;
  const pad = { l: 36, r: 16, t: 16, b: 44 };
  const innerW = w - pad.l - pad.r;
  const innerH = h - pad.t - pad.b;
  const yMin = 1;
  const yMax = 6;

  const xAt = (i: number, n: number) => {
    if (n <= 1) return pad.l + innerW / 2;
    return pad.l + (i / (n - 1)) * innerW;
  };
  const yAt = (v: number) => pad.t + ((yMax - v) / (yMax - yMin)) * innerH;

  const ukeIndex = new Map(uker.map((u, i) => [u.uke, i]));
  const hoved = uker.map((u, i) => `${xAt(i, uker.length).toFixed(1)},${yAt(u.snitt).toFixed(1)}`);

  return (
    <div className="mt-4 overflow-x-auto">
      <svg
        viewBox={`0 0 ${w} ${h}`}
        className="h-auto w-full min-w-[20rem]"
        role="img"
        aria-label="Snittkarakter per uke"
      >
        {[1, 2, 3, 4, 5, 6].map((k) => (
          <g key={k}>
            <line
              x1={pad.l}
              x2={w - pad.r}
              y1={yAt(k)}
              y2={yAt(k)}
              stroke={k === 4 ? "#B0770F" : "#191C1F"}
              strokeOpacity={k === 4 ? 0.35 : 0.08}
            />
            <text
              x={pad.l - 8}
              y={yAt(k) + 4}
              textAnchor="end"
              className="fill-[#191C1F]/50"
              fontSize="11"
              fontFamily="Source Serif 4, Georgia, serif"
            >
              {k}
            </text>
          </g>
        ))}

        {temaSerier.map(({ tema, horinger }) => {
          const pts = horinger
            .map((h) => {
              const i = ukeIndex.get(isoUkeNokkel(h.dato));
              if (i == null) return null;
              return `${xAt(i, uker.length).toFixed(1)},${yAt(h.karakter).toFixed(1)}`;
            })
            .filter(Boolean);
          if (pts.length < 2) return null;
          return (
            <polyline
              key={tema.id}
              fill="none"
              stroke={karakterFarge(horinger[horinger.length - 1]?.karakter)}
              strokeWidth="1.25"
              strokeOpacity="0.45"
              points={pts.join(" ")}
            />
          );
        })}

        {hoved.length > 1 && (
          <polyline
            fill="none"
            stroke="#191C1F"
            strokeWidth="2.25"
            points={hoved.join(" ")}
          />
        )}

        {uker.map((u, i) => (
          <g key={u.uke}>
            <circle
              cx={xAt(i, uker.length)}
              cy={yAt(u.snitt)}
              r="4.5"
              fill={karakterFarge(Math.round(u.snitt))}
              stroke="white"
              strokeWidth="1.5"
            />
            <text
              x={xAt(i, uker.length)}
              y={h - 12}
              textAnchor="middle"
              className="fill-[#191C1F]/55"
              fontSize="10"
            >
              {ukeEtikett(u.uke).replace(/ 20\d\d/, "")}
            </text>
          </g>
        ))}
      </svg>
      {visEmoji && temaSerier.length > 0 && (
        <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#191C1F]/60">
          {temaSerier.map(({ tema }) => (
            <li key={tema.id}>
              {tema.emoji} {tema.navn}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
