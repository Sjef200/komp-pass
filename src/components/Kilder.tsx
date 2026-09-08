import { formatDato } from "../lib/format";
import type { Kobling } from "../lib/hendelser";
import type { KoblingTekst } from "../lib/store-context";
import { aktivtFag, maalIFag, temaerIFag } from "../lib/store";
import type { AppState } from "../lib/types";
import { TomtFag } from "./Temaer";

const TYPE_EMOJI: Record<string, string> = {
  forelesning: "🎧",
  bok: "📖",
  oppgave: "📝",
  notat: "🗒️",
};

export function Kilder({
  state,
  koblingTekster,
  onAvgjor,
}: {
  state: AppState;
  koblingTekster: Record<string, KoblingTekst>;
  onAvgjor: (koblingId: string, bekreftet: boolean) => void;
}) {
  const fag = aktivtFag(state);
  const visEmoji = state.innstillinger.visEmoji;
  const kilder = state.kilder.filter((k) => k.fagId === state.innstillinger.aktivtFag);
  const koblinger = state.koblinger.filter((k) => k.fagId === state.innstillinger.aktivtFag);
  const foreslatte = koblinger.filter((k) => k.tilstand === "foreslatt");
  const bekreftede = koblinger.filter((k) => k.tilstand === "bekreftet");

  const temaNavn = new Map(temaerIFag(state).map((t) => [t.id, t.navn]));
  const maalNavn = new Map(maalIFag(state).map((m) => [m.id, m.kortnavn]));

  function merkelapp(k: Kobling): string {
    const deler = [
      k.temaId ? temaNavn.get(k.temaId) ?? k.temaId : null,
      k.maalId ? maalNavn.get(k.maalId) ?? k.maalId : null,
    ].filter(Boolean) as string[];
    return deler.join(" · ");
  }

  if (kilder.length === 0) {
    return (
      <TomtFag
        tittel="Ingen kilder i dette faget ennå"
        tekst="Ta opp en forelesning og kjør npm run transkriber, eller legg inn bokstoff med npm run indekser. Lyd og transkript blir liggende lokalt."
      />
    );
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-[#191C1F]/60">
        {fag ? `${fag.navn} · ${fag.kode}` : "Fag"} · {kilder.length} kilde
        {kilder.length === 1 ? "" : "r"} · innholdet ligger lokalt, ikke i repoet
      </p>

      {foreslatte.length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-medium uppercase tracking-wide text-[#191C1F]/55">
            Forslag til godkjenning
          </h2>
          <p className="mb-3 text-sm text-[#191C1F]/60">
            KI har foreslått at disse bitene dekker et tema eller mål. Et forslag teller ikke som
            dekning før du sier ja.
          </p>
          <ul className="space-y-2">
            {foreslatte.map((k) => {
              const bit = koblingTekster[k.chunkId];
              return (
                <li key={k.id} className="rounded-2xl bg-white px-4 py-3.5">
                  <p className="text-xs text-[#191C1F]/50">
                    {bit?.tid ? `[${bit.tid}] ` : bit?.side != null ? `[s. ${bit.side}] ` : ""}
                    {bit?.kildeId ?? k.chunkId}
                  </p>
                  <p className="mt-1 font-medium">{merkelapp(k)}</p>
                  {bit?.tekst ? (
                    <p className="mt-2 rounded-lg bg-[#F6F5F1] px-3 py-2 text-sm leading-relaxed">
                      {bit.tekst}
                    </p>
                  ) : (
                    <p className="mt-2 text-sm text-[#191C1F]/45">
                      Fant ikke teksten. Er kilden slettet?
                    </p>
                  )}
                  {k.begrunnelse ? (
                    <p className="mt-2 text-sm">
                      <span className="text-[#191C1F]/45">Begrunnelse: </span>
                      {k.begrunnelse}
                    </p>
                  ) : null}
                  {k.foreslattAv ? (
                    <p className="mt-2 text-xs text-[#191C1F]/45">
                      Foreslått av {k.foreslattAv.modell} · «{k.foreslattAv.promptNavn}»
                    </p>
                  ) : null}
                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      onClick={() => onAvgjor(k.id, true)}
                      className="rounded-lg bg-[#2E6B4B] px-3 py-1.5 text-sm text-white"
                    >
                      Bekreft
                    </button>
                    <button
                      type="button"
                      onClick={() => onAvgjor(k.id, false)}
                      className="rounded-lg bg-[#F6F5F1] px-3 py-1.5 text-sm"
                    >
                      Avvis
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <section>
        <h2 className="mb-2 text-sm font-medium uppercase tracking-wide text-[#191C1F]/55">
          Kilder
        </h2>
        <ul className="space-y-2">
          {kilder.map((k) => (
            <li key={k.id} className="rounded-2xl bg-white px-4 py-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="flex items-center gap-2 font-medium">
                    {visEmoji && <span aria-hidden>{TYPE_EMOJI[k.type] ?? "📄"}</span>}
                    <span className="truncate">{k.tittel}</span>
                  </p>
                  <p className="text-xs text-[#191C1F]/55">
                    {k.type} · {formatDato(k.dato)}
                    {k.kapittel ? ` · ${k.kapittel}` : ""}
                  </p>
                </div>
                <p className="shrink-0 text-xs text-[#191C1F]/45">
                  {bekreftede.filter((b) => b.chunkId.startsWith(`${k.id}#`)).length} koblinger
                </p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {bekreftede.length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-medium uppercase tracking-wide text-[#191C1F]/55">
            Bekreftet dekning
          </h2>
          <ul className="space-y-2">
            {bekreftede.map((k) => {
              const bit = koblingTekster[k.chunkId];
              return (
                <li key={k.id} className="rounded-2xl bg-white px-4 py-3 text-sm">
                  <p className="font-medium">{merkelapp(k)}</p>
                  <p className="mt-1 text-xs text-[#191C1F]/55">
                    {bit?.tid ? `[${bit.tid}] ` : bit?.side != null ? `[s. ${bit.side}] ` : ""}
                    {bit?.tekst?.slice(0, 120) ?? k.chunkId}
                    {bit?.tekst && bit.tekst.length > 120 ? " …" : ""}
                  </p>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}
