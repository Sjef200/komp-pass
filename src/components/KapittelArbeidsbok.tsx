import { useState, type FormEvent } from "react";
import {
  kapittelArbeid,
  kapittelLesingTittel,
  kapittelOvingTittel,
  type FoldetOving,
} from "../lib/arbeidsbok";
import { nyId } from "../lib/format";
import type { Hendelse, OvingBesvart, OvingLagtInn, KapittelNotat } from "../lib/hendelser";
import { kapitlerIFag, temaerIKapittel } from "../lib/kapittel";
import { karakterFarge } from "../lib/colors";
import type { AppState, Horing, Kapittel, Karakter, OvingType } from "../lib/types";
import { FagordListe } from "./Fagord";
import { HoringForm } from "./HoringForm";
import { Temaer, TomtFag } from "./Temaer";

type Valg =
  | { side: "lesing"; kapittelId: string }
  | { side: "oving"; kapittelId: string }
  | { side: "ordbank"; kapittelId: string };

export function KapittelArbeidsbok({
  state,
  onLagreHoring,
  onHendelser,
  onFagordStatus,
  onHoringPagar,
}: {
  state: AppState;
  onLagreHoring: (h: Horing) => void;
  onHendelser: (h: Hendelse[]) => Promise<void>;
  onFagordStatus: (id: string, status: "ny" | "usikker" | "sitter") => void;
  onHoringPagar?: (pagar: boolean) => void;
}) {
  const kapitler = kapitlerIFag(state);
  const [valg, setValg] = useState<Valg | null>(
    kapitler[0] ? { side: "lesing", kapittelId: kapitler[0].id } : null,
  );

  if (kapitler.length === 0) {
    return (
      <Temaer
        state={state}
        prompts={state.prompts}
        onLagreHoring={onLagreHoring}
        onHoringPagar={onHoringPagar}
      />
    );
  }

  const aktiv = valg ? kapitler.find((k) => k.id === valg.kapittelId) : undefined;

  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-start">
      <nav
        className="w-full shrink-0 rounded-2xl bg-white p-2 md:w-64"
        aria-label="Kapitler"
      >
        {kapitler.map((k) => {
          const arbeid = kapittelArbeid(state.hendelser, state.horinger, k.id);
          const lesingAktiv = valg?.side === "lesing" && valg.kapittelId === k.id;
          const ovingAktiv = valg?.side === "oving" && valg.kapittelId === k.id;
          return (
            <div key={k.id} className="mb-1">
              {k.nummer === 1 || k.del !== kapitler.find((x) => x.nummer === k.nummer - 1)?.del ? (
                <p className="px-2 pb-1 pt-2 text-[10px] font-medium uppercase tracking-wide text-[#191C1F]/40">
                  {k.del}
                </p>
              ) : null}
              <button
                type="button"
                onClick={() => setValg({ side: "lesing", kapittelId: k.id })}
                className={`block w-full rounded-lg px-2.5 py-1.5 text-left text-sm ${
                  lesingAktiv ? "bg-[#F6F5F1] font-medium" : "text-[#191C1F]/80"
                }`}
                aria-current={lesingAktiv ? "page" : undefined}
              >
                {kapittelLesingTittel(k)}
              </button>
              <button
                type="button"
                onClick={() => setValg({ side: "oving", kapittelId: k.id })}
                className={`block w-full rounded-lg px-2.5 py-1.5 text-left text-sm ${
                  ovingAktiv ? "bg-[#F6F5F1] font-medium" : "text-[#191C1F]/80"
                }`}
                aria-current={ovingAktiv ? "page" : undefined}
              >
                {kapittelOvingTittel(k)}
                {arbeid.ovinger.length > 0 ? (
                  <span className="ml-1 text-xs text-[#191C1F]/45">
                    {arbeid.ovinger.filter((o) => o.svar || o.horing).length}/{arbeid.ovinger.length}
                  </span>
                ) : null}
              </button>
            </div>
          );
        })}
        <button
          type="button"
          onClick={() =>
            setValg({ side: "ordbank", kapittelId: valg?.kapittelId ?? kapitler[0]!.id })
          }
          className={`mt-2 block w-full rounded-lg px-2.5 py-1.5 text-left text-sm ${
            valg?.side === "ordbank" ? "bg-[#F6F5F1] font-medium" : "text-[#191C1F]/80"
          }`}
          aria-current={valg?.side === "ordbank" ? "page" : undefined}
        >
          Ordbank
        </button>
      </nav>

      <div className="min-w-0 flex-1">
        {!aktiv || !valg ? (
          <TomtFag tittel="Velg et kapittel" tekst="Lesing, øving eller ordbank til venstre." />
        ) : valg.side === "lesing" ? (
          <LesingSide key={aktiv.id} kapittel={aktiv} state={state} onHendelser={onHendelser} />
        ) : valg.side === "oving" ? (
          <OvingSide
            key={aktiv.id}
            kapittel={aktiv}
            state={state}
            onHendelser={onHendelser}
            onLagreHoring={onLagreHoring}
            onHoringPagar={onHoringPagar}
          />
        ) : (
          <div>
            <h2 className="mb-3 font-medium">Ordbank · {aktiv.navn}</h2>
            <FagordListe
              state={state}
              onStatus={onFagordStatus}
              temaIds={aktiv.temaIds}
            />
          </div>
        )}
      </div>
    </div>
  );
}

function LesingSide({
  kapittel,
  state,
  onHendelser,
}: {
  kapittel: Kapittel;
  state: AppState;
  onHendelser: (h: Hendelse[]) => Promise<void>;
}) {
  const arbeid = kapittelArbeid(state.hendelser, state.horinger, kapittel.id);
  const [tekst, setTekst] = useState(arbeid.gjeldendeNotat?.tekst ?? "");
  const [laster, setLaster] = useState(false);
  const [feil, setFeil] = useState<string | null>(null);

  async function lagreNotat(e: FormEvent) {
    e.preventDefault();
    const t = tekst.trim();
    if (!t) {
      setFeil("Skriv notatet med egne ord.");
      return;
    }
    setLaster(true);
    setFeil(null);
    const hendelse: KapittelNotat = {
      id: nyId("k-notat"),
      type: "kapittel-notat",
      tid: new Date().toISOString(),
      fagId: kapittel.fagId,
      kilde: "selv",
      kapittelId: kapittel.id,
      notatId: nyId("notat"),
      tekst: t,
    };
    await onHendelser([hendelse]);
    setLaster(false);
  }

  async function lastOpp(fil: File) {
    setLaster(true);
    setFeil(null);
    try {
      const res = await fetch("/api/vedlegg", {
        method: "POST",
        headers: {
          "Content-Type": fil.type || "application/octet-stream",
          "X-Kapittel-Id": kapittel.id,
          "X-Fag-Id": kapittel.fagId,
          "X-Filnavn": encodeURIComponent(fil.name),
        },
        body: await fil.arrayBuffer(),
      });
      const kropp = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) throw new Error(kropp?.error ?? "Kunne ikke laste opp bildet.");
    } catch (e) {
      setFeil(e instanceof Error ? e.message : "Kunne ikke laste opp bildet.");
    }
    setLaster(false);
  }

  return (
    <div className="space-y-4">
      <header>
        <h2 className="font-medium">{kapittelLesingTittel(kapittel)}</h2>
        <p className="mt-0.5 text-sm text-[#191C1F]/60">{kapittel.navn}</p>
      </header>
      {kapittel.seksjoner.length > 0 && (
        <ul className="flex flex-wrap gap-1.5">
          {kapittel.seksjoner.map((s) => (
            <li key={s} className="rounded-full bg-white px-2.5 py-0.5 text-xs text-[#191C1F]/70">
              {s}
            </li>
          ))}
        </ul>
      )}
      <p className="text-sm text-[#191C1F]/65">
        Noter med egne ord. Grafer og skisser tar du på ark, laster opp her, og renskriver ved siden av.
        Ikke lim inn brødtekst fra boka.
      </p>
      {arbeid.vedlegg.length > 0 && (
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {arbeid.vedlegg.map((v) => (
            <li key={v.vedleggId} className="overflow-hidden rounded-xl bg-white">
              <img
                src={`/api/vedlegg/${v.vedleggId}`}
                alt={v.filnavn}
                className="h-36 w-full object-cover"
              />
              <p className="truncate px-2 py-1 text-xs text-[#191C1F]/50">{v.filnavn}</p>
            </li>
          ))}
        </ul>
      )}
      <form onSubmit={(e) => void lagreNotat(e)} className="space-y-3">
        <label className="block text-sm font-medium">
          Ren digital versjon
          <textarea
            className="mt-1 min-h-48 w-full rounded-xl border border-[#191C1F]/15 bg-white px-3 py-2 text-sm leading-relaxed"
            value={tekst}
            onChange={(e) => setTekst(e.target.value)}
            placeholder="Din formulering av kapittelet"
          />
        </label>
        <div className="flex flex-wrap items-center gap-2">
          <label className="cursor-pointer rounded-lg bg-white px-3 py-2 text-sm">
            Last opp foto av ark
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif,image/heic"
              className="sr-only"
              onChange={(e) => {
                const fil = e.target.files?.[0];
                if (fil) void lastOpp(fil);
                e.target.value = "";
              }}
            />
          </label>
          <button
            type="submit"
            disabled={laster}
            className="rounded-lg bg-[#191C1F] px-4 py-2 text-sm text-white disabled:opacity-50"
          >
            {laster ? "Lagrer…" : "Lagre notat"}
          </button>
        </div>
        {feil ? (
          <p className="text-sm text-[#A63A2A]" role="alert">
            {feil}
          </p>
        ) : null}
      </form>
    </div>
  );
}

function OvingSide({
  kapittel,
  state,
  onHendelser,
  onLagreHoring,
  onHoringPagar,
}: {
  kapittel: Kapittel;
  state: AppState;
  onHendelser: (h: Hendelse[]) => Promise<void>;
  onLagreHoring: (h: Horing) => void;
  onHoringPagar?: (pagar: boolean) => void;
}) {
  const arbeid = kapittelArbeid(state.hendelser, state.horinger, kapittel.id);
  const temaer = temaerIKapittel(kapittel, state.temaer);
  const [nyTekst, setNyTekst] = useState("");
  const [nyType, setNyType] = useState<OvingType>("kontroll");
  const [nyNummer, setNyNummer] = useState("");
  const [horOving, setHorOving] = useState<FoldetOving | null>(null);

  async function limInn(e: FormEvent) {
    e.preventDefault();
    const tekst = nyTekst.trim();
    if (!tekst) return;
    const hendelse: OvingLagtInn = {
      id: nyId("k-oving"),
      type: "oving-lagt-inn",
      tid: new Date().toISOString(),
      fagId: kapittel.fagId,
      kilde: "selv",
      kapittelId: kapittel.id,
      ovingId: nyId("oving"),
      ovingType: nyType,
      tekst,
      ...(nyNummer.trim() ? { nummer: nyNummer.trim() } : {}),
    };
    await onHendelser([hendelse]);
    setNyTekst("");
    setNyNummer("");
  }

  const kontroll = arbeid.ovinger.filter((o) => o.ovingType === "kontroll");
  const oppgaver = arbeid.ovinger.filter((o) => o.ovingType === "oppgave");

  return (
    <div className="space-y-6">
      <header>
        <h2 className="font-medium">{kapittelOvingTittel(kapittel)}</h2>
        <p className="mt-0.5 text-sm text-[#191C1F]/60">
          Lim inn bokas kontrollspørsmål og oppgaver. Claude hører deg i dem — ikke i en parallell
          spørsmålsbank.
        </p>
      </header>

      <OvingListe
        tittel="Kontrollspørsmål"
        ovinger={kontroll}
        onHor={(o) => {
          setHorOving(o);
          onHoringPagar?.(true);
        }}
      />
      <OvingListe
        tittel="Oppgaver"
        ovinger={oppgaver}
        onHor={(o) => {
          setHorOving(o);
          onHoringPagar?.(true);
        }}
      />

      <form onSubmit={(e) => void limInn(e)} className="rounded-2xl bg-white p-4">
        <p className="text-sm font-medium">Lim inn fra boka</p>
        <div className="mt-2 flex gap-2">
          {(["kontroll", "oppgave"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setNyType(t)}
              className={`rounded-lg px-3 py-1.5 text-sm ${
                nyType === t ? "bg-[#191C1F] text-white" : "bg-[#F6F5F1]"
              }`}
              aria-pressed={nyType === t}
            >
              {t === "kontroll" ? "Kontrollspørsmål" : "Oppgave"}
            </button>
          ))}
        </div>
        <input
          className="mt-3 w-full rounded-lg border border-[#191C1F]/15 px-3 py-2 text-sm"
          value={nyNummer}
          onChange={(e) => setNyNummer(e.target.value)}
          placeholder="Nummer, f.eks. 1 eller 1.2"
        />
        <textarea
          className="mt-2 min-h-20 w-full rounded-lg border border-[#191C1F]/15 px-3 py-2 text-sm"
          value={nyTekst}
          onChange={(e) => setNyTekst(e.target.value)}
          placeholder="Lim inn ett spørsmål eller én oppgave"
        />
        <button type="submit" className="mt-2 rounded-lg bg-[#191C1F] px-4 py-2 text-sm text-white">
          Legg inn
        </button>
      </form>

      {horOving && temaer.length > 0 && (
        <HoringForm
          temaer={temaer}
          visEmoji={state.innstillinger.visEmoji}
          prompts={state.prompts}
          forhåndsvalgtTemaId={temaer[0]?.id}
          forhåndsutfyltSporsmal={horOving.tekst}
          ovingId={horOving.ovingId}
          kapittelId={kapittel.id}
          onLagre={(h) => {
            onLagreHoring(h);
            setHorOving(null);
            onHoringPagar?.(false);
          }}
          onAvbryt={() => {
            setHorOving(null);
            onHoringPagar?.(false);
          }}
        />
      )}
      {horOving && temaer.length === 0 && (
        <OvingSvarUtenTema
          oving={horOving}
          fagId={kapittel.fagId}
          kapittelId={kapittel.id}
          onLagre={async (h) => {
            await onHendelser([h]);
            setHorOving(null);
            onHoringPagar?.(false);
          }}
          onAvbryt={() => {
            setHorOving(null);
            onHoringPagar?.(false);
          }}
        />
      )}
    </div>
  );
}

function OvingListe({
  tittel,
  ovinger,
  onHor,
}: {
  tittel: string;
  ovinger: FoldetOving[];
  onHor: (o: FoldetOving) => void;
}) {
  if (ovinger.length === 0) return null;
  return (
    <section>
      <h3 className="mb-2 text-sm font-medium">{tittel}</h3>
      <ol className="space-y-2">
        {ovinger.map((o) => {
          const karakter = o.horing?.karakter ?? o.svar?.karakter;
          return (
            <li key={o.ovingId} className="rounded-2xl bg-white p-4">
              <p className="text-sm">
                {o.nummer ? <span className="text-[#191C1F]/45">{o.nummer} · </span> : null}
                {o.tekst}
              </p>
              <div className="mt-2 flex items-center justify-between gap-2">
                <p className="text-xs text-[#191C1F]/50">
                  {karakter != null ? (
                    <span style={{ color: karakterFarge(karakter) }}>Karakter {karakter}</span>
                  ) : (
                    "Ikke besvart"
                  )}
                </p>
                <button
                  type="button"
                  onClick={() => onHor(o)}
                  className="rounded-lg bg-[#F6F5F1] px-3 py-1.5 text-sm"
                >
                  Hør meg i denne
                </button>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

function OvingSvarUtenTema({
  oving,
  fagId,
  kapittelId,
  onLagre,
  onAvbryt,
}: {
  oving: FoldetOving;
  fagId: string;
  kapittelId: string;
  onLagre: (h: OvingBesvart) => Promise<void>;
  onAvbryt: () => void;
}) {
  const [svar, setSvar] = useState("");
  const [karakter, setKarakter] = useState<Karakter | null>(null);

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-[#191C1F]/40 p-0 sm:items-center sm:p-4">
      <form
        className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-white p-5 sm:rounded-2xl"
        onSubmit={(e) => {
          e.preventDefault();
          if (!svar.trim()) return;
          const h: OvingBesvart = {
            id: nyId("k-osvar"),
            type: "oving-besvart",
            tid: new Date().toISOString(),
            fagId,
            kilde: "selv",
            kapittelId,
            ovingId: oving.ovingId,
            svar: svar.trim(),
            ...(karakter != null ? { karakter } : {}),
          };
          void onLagre(h);
        }}
      >
        <h2 className="text-lg font-medium">Svar</h2>
        <p className="mt-1 text-sm text-[#191C1F]/65">{oving.tekst}</p>
        <p className="mt-2 text-xs text-[#191C1F]/45">
          Dette kapittelet har ingen hørbare temaer ennå, så svaret teller ikke mot kompetansemål.
        </p>
        <textarea
          className="mt-4 min-h-24 w-full rounded-lg border border-[#191C1F]/15 px-3 py-2 text-sm"
          value={svar}
          onChange={(e) => setSvar(e.target.value)}
          required
        />
        <div className="mt-3 flex gap-2">
          {([1, 2, 3, 4, 5, 6] as Karakter[]).map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setKarakter(k)}
              className="flex h-9 flex-1 items-center justify-center rounded-lg text-sm"
              style={{
                background: karakter === k ? karakterFarge(k) : "#F6F5F1",
                color: karakter === k ? "#fff" : "#191C1F",
              }}
            >
              {k}
            </button>
          ))}
        </div>
        <div className="mt-4 flex gap-2">
          <button type="button" onClick={onAvbryt} className="flex-1 rounded-lg py-2 text-sm">
            Avbryt
          </button>
          <button type="submit" className="flex-1 rounded-lg bg-[#191C1F] py-2 text-sm text-white">
            Lagre
          </button>
        </div>
      </form>
    </div>
  );
}
