import { z } from "zod";
import type { AppState, FagId } from "./types";
import type { Hendelse } from "./hendelser";
import { krevFag, krevKapittelIFag, krevTemaIFag } from "./fag-validering";
import { foldForsok, foldOkter, forsokSchema, gjeldendeNotat, innholdSchema, notatSchema, NYE_TYPER, oktSchema, oppgaver, sluttSchema, underpunkter, vurderingSchema } from "./laering";

function krev(ok: unknown, melding: string): asserts ok { if (!ok) throw new Error(melding); }
export function validerLaeringsHendelse(state: AppState, h: Hendelse): void {
  if (!NYE_TYPER.includes(h.type)) return;
  const fag = krevFag(state, h.fagId);
  krev(h.id?.trim() && Number.isFinite(Date.parse(h.tid)), "Hendelsen må ha ID og gyldig tidspunkt.");
  const maal = (ids: string[]) => ids.forEach(id => krev(state.kompetansemaal.some(m => m.id === id && m.fagId === fag.id), `Ukjent mål i faget: ${id}`));
  const tema = (ids: string[]) => ids.forEach(id => krevTemaIFag(state, fag.id, id));
  const kap = (id: string) => krevKapittelIFag(state, fag.id, id);
  const fs = foldForsok(state.hendelser);
  const os = foldOkter(state.hendelser);
  switch (h.type) {
    case "innhold-importert": {
      const i = innholdSchema.parse(h.innhold);
      krev(i.fagId === h.fagId, "Importen tilhører et annet fag.");
      const gammel = state.kapitler.find(k => k.id === i.kapittel.id);
      krev(!gammel || gammel.fagId === fag.id, "Kapittel-ID tilhører et annet fag.");
      if (i.kapittel.sider) krev(i.kapittel.sider.fra <= i.kapittel.sider.til, "Ugyldig sideintervall.");
      for (const liste of [i.kapittel.underpunkter, i.temaer, i.oppgaver]) krev(new Set(liste.map(x => x.id)).size === liste.length, "Duplikate ID-er i importen.");
      for (const t of i.temaer) {
        const gammelTema = state.temaer.find(x => x.id === t.id);
        krev(!gammelTema || gammelTema.fagId === fag.id, "Tema-ID tilhører et annet fag."); maal(t.maalIds);
      }
      const alleTema = new Set([...state.temaer.filter(t => t.fagId === fag.id).map(t => t.id), ...i.temaer.map(t => t.id)]);
      for (const o of i.oppgaver) {
        const gammelO = oppgaver(state).find(x => x.id === o.id);
        krev(!gammelO || gammelO.kapittelId === i.kapittel.id, "Oppgave-ID brukes i et annet kapittel.");
        krev(!o.underpunktId || i.kapittel.underpunkter.some(s => s.id === o.underpunktId), "Ukjent underpunkt.");
        krev(o.temaIds.every(t => alleTema.has(t)), "Ukjent tema i oppgaven."); maal(o.maalIds);
        krev(o.opphav !== "ai" || !!o.originalOppgaveId, "En AI-variant må peke på originaloppgaven.");
        if (o.originalOppgaveId) krev(i.oppgaver.some(p => p.id === o.originalOppgaveId && p.id !== o.id) || oppgaver(state).some(p => p.id === o.originalOppgaveId && state.kapitler.some(k => k.id === p.kapittelId && k.fagId === fag.id)), "Ukjent originaloppgave.");
        if (o.referanse?.original === "arkivert") krev(!!o.referanse.vedleggId && state.hendelser.some(h => h.type === "kapittel-vedlegg" && h.vedleggId === o.referanse!.vedleggId && h.fagId === fag.id), "Originalfilen finnes ikke i arkivet.");
      }
      if (i.oppsummering?.referanse?.original === "arkivert") krev(state.hendelser.some(h => h.type === "kapittel-vedlegg" && h.vedleggId === i.oppsummering!.referanse!.vedleggId && h.fagId === fag.id), "Originalfilen finnes ikke i arkivet.");
      break;
    }
    case "forsok-lagret": {
      const f = forsokSchema.parse(h.forsok); krev(f.fagId === fag.id, "Forsøket tilhører et annet fag.");
      krev(!fs.some(x => x.id === f.id), "Forsøks-ID finnes allerede. Originalsvaret kan ikke overskrives.");
      if (f.kapittelId) kap(f.kapittelId);
      if (f.oppgaveId) { const o = oppgaver(state).find(o => o.id === f.oppgaveId); krev(o && o.kapittelId === f.kapittelId, "Oppgaven tilhører ikke kapittelet."); }
      if (f.oktId) {
        const o = os.find(o => o.id === f.oktId); krev(o && o.fagId === fag.id && o.status === "pagar", "Økten finnes ikke eller er avsluttet.");
        krev(o.arbeidsmate === f.arbeidsmate, "Arbeidsmåten må følge økten.");
        krev(!f.kapittelId || !o.kapittelIds.length || o.kapittelIds.includes(f.kapittelId), "Kapittelet er utenfor økten.");
        krev(!f.oppgaveId || !o.oppgaveIds.length || o.oppgaveIds.includes(f.oppgaveId), "Oppgaven er utenfor økten.");
      }
      krev(f.arbeidsmate !== "eksamen" || !!f.oktId, "Eksamenstrening krever en økt.");
      break;
    }
    case "forsok-vurdert": {
      const v = vurderingSchema.parse(h.vurdering); const f = fs.find(f => f.id === v.forsokId);
      krev(f && f.fagId === fag.id, "Ukjent forsøk i faget.");
      krev(!f.vurderinger.some(x => x.id === v.id), "Vurderings-ID finnes allerede.");
      krev(v.erstatter === f.vurderinger.at(-1)?.id, "Vurderingen er endret. Hent siste revisjon før retting.");
      krev(state.skills.some(s => s.id === v.skillId) || state.prompts.some(s => s.id === v.skillId), "Ukjent skillId.");
      const k = f.kapittelId ? kap(f.kapittelId) : undefined;
      krev(new Set(v.maal.map(m => `${m.temaId}:${m.maalId}`)).size === v.maal.length, "Samme mål og tema er vurdert flere ganger.");
      for (const m of v.maal) { const t = krevTemaIFag(state, fag.id, m.temaId); maal([m.maalId]); krev(t.maalIds.includes(m.maalId), "Målet må være bekreftet koblet til temaet."); krev(!k || k.temaIds.includes(m.temaId), "Temaet tilhører ikke forsøkskapittelet."); }
      break;
    }
    case "okt-startet": {
      const o = oktSchema.parse(h.okt); krev(o.fagId === fag.id && !os.some(x => x.id === o.id), "Ugyldig fag eller eksisterende økt-ID.");
      o.kapittelIds.forEach(kap);
      for (const id of o.oppgaveIds) { const p = oppgaver(state).find(p => p.id === id); krev(p, "Ukjent oppgave."); kap(p.kapittelId); krev(!o.kapittelIds.length || o.kapittelIds.includes(p.kapittelId), "Oppgaven er utenfor valgte kapitler."); }
      break;
    }
    case "okt-avsluttet": {
      const o = os.find(o => o.id === h.oktId); krev(o && o.fagId === fag.id && o.status === "pagar", "Økten finnes ikke eller er avsluttet.");
      krev(["fullfort", "avbrutt"].includes(h.status), "Ugyldig øktstatus.");
      if (h.status === "fullfort") krev(fs.some(f => f.oktId === o.id), "En tom økt kan ikke fullføres.");
      if (o.arbeidsmate === "eksamen" && h.status === "fullfort") krev(h.vurdering, "Eksamenstrening krever en samlet sluttvurdering.");
      if (h.vurdering) { const v = sluttSchema.parse(h.vurdering); maal(v.maalIds); krev(state.skills.some(s => s.id === v.skillId), "Ukjent skillId."); }
      break;
    }
    case "notat-versjon": {
      const n = notatSchema.parse(h.notat); const k = kap(n.kapittelId);
      krev(["kapittel", "min-oppsummering", ...underpunkter(k).map(s => s.id)].includes(n.plass), "Ukjent notatplass.");
      krev(n.forelder === (gjeldendeNotat(state, k.id, n.plass)?.notatId ?? null), "Versjonsavvik: notatet er endret. Hent siste versjon og sammenlign før du lagrer."); break;
    }
    case "notat-kommentar": kap(h.kapittelId); krev(h.tekst.trim(), "Kommentaren er tom."); krev(state.hendelser.some(n => (n.type === "notat-versjon" && n.notat.notatId === h.notatId && n.notat.kapittelId === h.kapittelId) || (n.type === "kapittel-notat" && n.notatId === h.notatId && n.kapittelId === h.kapittelId)), "Ukjent notat."); break;
    case "oppgave-koblet": { const o = oppgaver(state).find(o => o.id === h.oppgaveId); krev(o, "Ukjent oppgave."); const k = kap(o.kapittelId); if (h.underpunktId) krev(underpunkter(k).some(s => s.id === h.underpunktId), "Ukjent underpunkt."); tema(h.temaIds); maal(h.maalIds); krev(h.temaIds.every(id => k.temaIds.includes(id)), "Tema må tilhøre kapittelet."); break; }
    case "tema-koblet": krevTemaIFag(state, fag.id, h.temaId); maal(h.maalIds); break;
    case "ukesmaal-satt": z.number().int().min(1).max(50).parse(h.antall); break;
  }
}
export function fagForKapittel(state: AppState, kapittelId: string): FagId {
  const k = state.kapitler.find(k => k.id === kapittelId); if (!k) throw new Error("Ukjent kapittel."); return krevFag(state, k.fagId).id;
}

/** JSONB kan endre nøkkelrekkefølgen. Sammenlign innhold, ikke serialiseringsrekkefølge. */
export function hendelseInnhold(h: Hendelse): string {
  function normal(v: unknown): unknown {
    if (Array.isArray(v)) return v.map(normal);
    if (v && typeof v === "object") return Object.fromEntries(Object.entries(v).filter(([,v])=>v!==undefined).sort(([a],[b])=>a.localeCompare(b)).map(([k,v])=>[k,normal(v)]));
    return v;
  }
  const { tid: _tid, seq: _seq, ...rest } = h;
  return JSON.stringify(normal(rest));
}
