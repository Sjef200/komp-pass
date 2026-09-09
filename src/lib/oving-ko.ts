import type { AppState } from "./types";
import { foldForsok, oppgaver, synligVurdering, type Oppgave } from "./laering";
import { dagerSiden, MODNINGSDAGER } from "./dekning";
export function ovingKo(state: AppState, fagId: string, opts: { kapittelId?: string; oktId?: string; repetisjon?: boolean; na?: string } = {}) {
  const fs = foldForsok(state.hendelser).filter(f => f.fagId === fagId);
  const ks = new Set(state.kapitler.filter(k => k.fagId === fagId).map(k => k.id));
  const rader = oppgaver(state, opts.kapittelId).filter(o => ks.has(o.kapittelId)).map(o => {
    const forsok = fs.filter(f => f.oppgaveId === o.id);
    const siste = forsok.at(-1);
    const selv = forsok.filter(f => f.hjelp === "ingen" && synligVurdering(f, state.hendelser)?.karakter).at(-1);
    const karakter = selv ? synligVurdering(selv, state.hendelser)?.karakter : undefined;
    const alder = selv ? dagerSiden(selv.tid, opts.na) : null;
    const sammeOkt = opts.oktId && siste?.oktId === opts.oktId;
    const hjelp = siste && siste.hjelp !== "ingen";
    const forfalt = karakter != null && alder != null && alder >= MODNINGSDAGER[karakter as keyof typeof MODNINGSDAGER];
    const svak = karakter != null && karakter < 4;
    const grunn = !siste ? "Ikke forsøkt" : hjelp ? "Prøv uten hjelp" : !karakter ? "Mangler selvstendig vurdering" : svak ? "Trenger mer øving" : forfalt ? "Tid for repetisjon" : "Nylig vurdert";
    return { oppgave: o, grunn, prioritet: !siste ? 1000 : hjelp ? 900 : !karakter ? 800 : svak ? 700 : forfalt ? 600 : 0, aktuell: !sammeOkt && (!siste || !!hjelp || !karakter || svak || forfalt), sisteForsok: siste?.id };
  }).filter(r => opts.repetisjon ? r.aktuell : !r.sisteForsok);
  rader.sort((a, b) => b.prioritet - a.prioritet);
  if (opts.kapittelId) return rader;
  const ut: typeof rader = []; let forrige: Oppgave | undefined;
  while (rader.length) { const i = rader.findIndex(r => r.oppgave.kapittelId !== forrige?.kapittelId); const [r] = rader.splice(i < 0 ? 0 : i, 1); ut.push(r); forrige = r.oppgave; }
  return ut;
}
