import { z } from "zod";
import type { AppState, FagId, Horing, Kapittel, Tema, Karakter } from "./types";
import type { Hendelse, HendelseBase } from "./hendelser";
import { sorterHendelser } from "./hendelser";

export const arbeidsmateSchema = z.enum(["laering", "selvtest", "eksamen"]);
export const hjelpSchema = z.enum(["ingen", "hint", "vist-losning", "ukjent"]);
export type Arbeidsmate = z.infer<typeof arbeidsmateSchema>;
export type Hjelp = z.infer<typeof hjelpSchema>;
const id = z.string().trim().min(1).max(200);
const tekst = z.string().trim().min(1);
const karakter = z.number().int().min(1).max(6);
export const referanseSchema = z.object({
  tittel: tekst, side: z.number().int().positive().optional(), vedleggId: id.optional(),
  original: z.enum(["arkivert", "ikke-arkivert"]).default("ikke-arkivert"), usikker: z.boolean().default(false),
});
export type Referanse = z.infer<typeof referanseSchema>;
export const underpunktSchema = z.object({ id, navn: tekst, side: z.number().int().positive().optional() });
export const oppgaveSchema = z.object({
  id, tekst, nummer: z.string().optional(), type: z.enum(["kontroll", "oppgave"]).default("kontroll"),
  underpunktId: id.optional(), temaIds: z.array(id).default([]), maalIds: z.array(id).default([]),
  koblingBekreftet: z.boolean().default(false), referanse: referanseSchema.optional(),
  opphav: z.enum(["bok", "ai"]).default("bok"), originalOppgaveId: id.optional(),
});
export type Oppgave = z.infer<typeof oppgaveSchema> & { kapittelId: string };
export const innholdSchema = z.object({
  importId: id, fagId: id,
  kapittel: z.object({ id, bokId: id, bokTittel: tekst, utgave: z.string().optional(), nummer: z.number().int().positive(), navn: tekst,
    del: z.string().optional(), sider: z.object({ fra: z.number().int().positive(), til: z.number().int().positive() }).optional(),
    underpunkter: z.array(underpunktSchema), }),
  temaer: z.array(z.object({ id, navn: tekst, maalIds: z.array(id).default([]), bekreftet: z.boolean().default(false) })).default([]),
  oppsummering: z.object({ tekst, referanse: referanseSchema.optional() }).optional(),
  oppgaver: z.array(oppgaveSchema).default([]),
});
export type Innhold = z.infer<typeof innholdSchema>;
export const forsokSchema = z.object({
  id, fagId: id, oktId: id.optional(), oppgaveId: id.optional(), kapittelId: id.optional(),
  sporsmal: tekst, svar: tekst, arbeidsmate: arbeidsmateSchema, hjelp: hjelpSchema,
  referanser: z.array(referanseSchema).default([]),
});
export type Forsok = z.infer<typeof forsokSchema> & { tid: string; kilde: string; vurderinger: Vurdering[] };
export const vurderingSchema = z.object({
  id, forsokId: id, riktig: z.string(), mangler: z.string(), nesteSteg: tekst, karakter: karakter.optional(),
  modell: tekst, skillId: id, kriterieversjon: tekst, begrunnelse: tekst,
  erstatter: id.optional(), modellsvar: z.string().optional(),
  maal: z.array(z.object({ temaId: id, maalId: id, karakter, begrunnelse: tekst })).default([]),
});
export type Vurdering = z.infer<typeof vurderingSchema> & { tid: string; kilde: string };
export const oktSchema = z.object({
  id, fagId: id, arbeidsmate: arbeidsmateSchema, kapittelIds: z.array(id).default([]),
  oppgaveIds: z.array(id).default([]), grunnlag: tekst, hjelpemidler: z.string().default("Ingen oppgitt"),
  minutter: z.number().int().positive().max(1440).optional(),
});
export type Okt = z.infer<typeof oktSchema> & {
  tid: string; status: "pagar" | "fullfort" | "avbrutt"; slutt?: string;
  vurdering?: Sluttvurdering;
};
export const sluttSchema = z.object({
  karakter: karakter.optional(), begrunnelse: tekst, manglerBelegg: z.string(), maalIds: z.array(id),
  modell: tekst, skillId: id, kriterieversjon: tekst,
});
export type Sluttvurdering = z.infer<typeof sluttSchema>;
export const notatSchema = z.object({
  notatId: id, kapittelId: id, plass: id, tekst: z.string(), forelder: id.nullable(),
});
export type NotatVersjon = z.infer<typeof notatSchema> & { tid: string; konflikt: boolean };

export type LaeringsHendelse = HendelseBase & (
  | { type: "innhold-importert"; innhold: Innhold }
  | { type: "forsok-lagret"; forsok: z.infer<typeof forsokSchema> }
  | { type: "forsok-vurdert"; vurdering: z.infer<typeof vurderingSchema> }
  | { type: "okt-startet"; okt: z.infer<typeof oktSchema> }
  | { type: "okt-avsluttet"; oktId: string; status: "fullfort" | "avbrutt"; vurdering?: Sluttvurdering }
  | { type: "notat-versjon"; notat: z.infer<typeof notatSchema> }
  | { type: "notat-kommentar"; kapittelId: string; notatId: string; tekst: string }
  | { type: "oppgave-koblet"; oppgaveId: string; underpunktId?: string | null; temaIds: string[]; maalIds: string[]; bekreftet: boolean }
  | { type: "tema-koblet"; temaId: string; maalIds: string[]; bekreftet: boolean }
  | { type: "ukesmaal-satt"; antall: number }
);
export { NYE_TYPER } from "./laering-typer";

export function stabileId(tekst: string): string {
  let h = 2166136261;
  for (const c of tekst) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return (h >>> 0).toString(36);
}
export function underpunkter(k: Kapittel) {
  return k.underpunkter ?? k.seksjoner.map((navn, i) => ({ id: `${k.id}-s${String(i + 1).padStart(2, "0")}`, navn }));
}
export function innholdIFag(state: AppState, fagId: string) {
  return state.hendelser.filter((h): h is Extract<LaeringsHendelse, { type: "innhold-importert" }> => h.type === "innhold-importert" && h.fagId === fagId);
}
export function foldStruktur(kapitler: Kapittel[], temaer: Tema[], hendelser: Hendelse[]) {
  const ks = new Map(kapitler.map(k => [k.id, { ...k, bokId: k.bokId ?? `${k.fagId}-bok`, underpunkter: underpunkter(k) }]));
  const ts = new Map(temaer.map(t => [t.id, t]));
  for (const h of sorterHendelser(hendelser)) {
    if (h.type === "innhold-importert") {
      const { kapittel: k } = h.innhold;
      const forrige = ks.get(k.id);
      ks.set(k.id, { ...forrige, ...k, fagId: h.fagId, seksjoner: k.underpunkter.map(s => s.navn), temaIds: [...new Set([...(forrige?.temaIds ?? []), ...h.innhold.temaer.map(t => t.id)])] });
      for (const t of h.innhold.temaer) ts.set(t.id, { id: t.id, navn: t.navn, fagId: h.fagId, emoji: "", kapittel: k.navn, maalIds: t.bekreftet ? t.maalIds : [], foreslatteMaalIds: t.bekreftet ? [] : t.maalIds });
    }
    if (h.type === "tema-koblet") {
      const t = ts.get(h.temaId);
      if (t) ts.set(t.id, { ...t, maalIds: h.bekreftet ? h.maalIds : [], foreslatteMaalIds: h.bekreftet ? [] : h.maalIds });
    }
  }
  return { kapitler: [...ks.values()], temaer: [...ts.values()] };
}
export function oppgaver(state: AppState, kapittelId?: string): Oppgave[] {
  const map = new Map<string, Oppgave>();
  for (const h of sorterHendelser(state.hendelser)) {
    if (h.type === "oving-lagt-inn") map.set(h.ovingId, { id: h.ovingId, kapittelId: h.kapittelId, tekst: h.tekst, nummer: h.nummer, type: h.ovingType, temaIds: [], maalIds: [], koblingBekreftet: false, opphav: "bok" });
    if (h.type === "innhold-importert") for (const o of h.innhold.oppgaver) map.set(o.id, { ...o, kapittelId: h.innhold.kapittel.id });
    if (h.type === "oppgave-koblet") {
      const o = map.get(h.oppgaveId);
      if (o) map.set(o.id, { ...o, temaIds: h.temaIds, maalIds: h.maalIds, koblingBekreftet: h.bekreftet, ...(h.underpunktId !== undefined ? { underpunktId: h.underpunktId ?? undefined } : {}) });
    }
  }
  return [...map.values()].filter(o => !kapittelId || o.kapittelId === kapittelId);
}
export function foldForsok(hendelser: Hendelse[]): Forsok[] {
  const map = new Map<string, Forsok>();
  const sortert = sorterHendelser(hendelser);
  for (const h of sortert) if (h.type === "forsok-lagret" && !map.has(h.forsok.id)) map.set(h.forsok.id, { ...h.forsok, tid: h.tid, kilde: h.kilde, vurderinger: [] });
  for (const h of sortert) if (h.type === "forsok-vurdert") {
    const f = map.get(h.vurdering.forsokId);
    if (f && !f.vurderinger.some(v => v.id === h.vurdering.id)) f.vurderinger.push({ ...h.vurdering, tid: h.tid, kilde: h.kilde });
  }
  return [...map.values()];
}
export function foldOkter(hendelser: Hendelse[]): Okt[] {
  const map = new Map<string, Okt>();
  for (const h of sorterHendelser(hendelser)) {
    if (h.type === "okt-startet" && !map.has(h.okt.id)) map.set(h.okt.id, { ...h.okt, tid: h.tid, status: "pagar" });
    if (h.type === "okt-avsluttet") {
      const o = map.get(h.oktId);
      if (o) map.set(o.id, { ...o, status: h.status, slutt: h.tid, vurdering: h.vurdering });
    }
  }
  return [...map.values()];
}
export function synligVurdering(f: Forsok, hendelser: Hendelse[]): Vurdering | undefined {
  if (f.arbeidsmate === "eksamen" && foldOkter(hendelser).find(o => o.id === f.oktId)?.status === "pagar") return undefined;
  return f.vurderinger.at(-1);
}
export function forsokTilHoringer(hendelser: Hendelse[]): Horing[] {
  return foldForsok(hendelser).flatMap(f => {
    const v = synligVurdering(f, hendelser);
    if (!v) return [];
    return v.maal.map((m, i) => ({ id: `${f.id}:${i}`, forsokId: f.id, temaId: m.temaId, dato: f.tid,
      karakter: m.karakter as Karakter, riktig: v.riktig, mangler: v.mangler, sporsmal: f.sporsmal, svar: f.svar,
      modellsvar: v.modellsvar, maalIds: [m.maalId], hjelp: f.hjelp, arbeidsmate: f.arbeidsmate,
      ovingId: f.oppgaveId, kapittelId: f.kapittelId, kilde: v.kilde as Horing["kilde"],
      ai: { modell: v.modell, innsats: "medium" as const, promptId: v.skillId, promptNavn: v.skillId } }));
  });
}
export function notatHistorikk(state: AppState, kapittelId: string, plass: string): NotatVersjon[] {
  const k = state.kapitler.find(k => k.id === kapittelId);
  const ut: NotatVersjon[] = [];
  let sist: string | null = null;
  for (const h of sorterHendelser(state.hendelser)) {
    if (h.type === "kapittel-notat" && h.kapittelId === kapittelId) {
      const gammelPlass = h.seksjon ? (k ? underpunkter(k) : []).find(s => s.navn === h.seksjon)?.id ?? "kapittel" : "kapittel";
      if (gammelPlass === plass) { ut.push({ notatId: h.notatId, kapittelId, plass, tekst: h.tekst, forelder: sist, tid: h.tid, konflikt: false }); sist = h.notatId; }
    }
    if (h.type === "notat-versjon" && h.notat.kapittelId === kapittelId && h.notat.plass === plass) {
      const konflikt = h.notat.forelder !== sist;
      ut.push({ ...h.notat, tid: h.tid, konflikt });
      if (!konflikt) sist = h.notat.notatId;
    }
  }
  return ut;
}
export function gjeldendeNotat(state: AppState, kapittelId: string, plass: string) {
  return notatHistorikk(state, kapittelId, plass).filter(n => !n.konflikt).at(-1);
}
export const EKSAMEN: Record<FagId, { form: string; kriterier: string[] }> = {
  male1: { form: "Muntlig", kriterier: ["Presise fagbegreper", "Anvendelse i case", "Begrunnelse og fagsamtale"] },
  male2: { form: "Skriftlig", kriterier: ["Oppgaveforståelse", "Analyse av case", "Begrunnede strategiske valg", "Sammenheng og kilder"] },
  entrep1: { form: "Muntlig-praktisk", kriterier: ["Praktisk leveranse", "Gjennomførbarhet", "Begrunnelse av valg i samtalen"] },
  entrep2: { form: "Skriftlig", kriterier: ["Oppgaveforståelse", "Analyse og forretningsutvikling", "Begrunnelse og konsekvenser", "Sammenheng og kilder"] },
  "norsk-hovedmal": { form: "Skriftlig", kriterier: ["Oppgaveforståelse", "Innhold og tekstgrunnlag", "Struktur", "Språk og kildebruk"] },
  "norsk-muntlig": { form: "Muntlig", kriterier: ["Faglig forståelse", "Bruk av tekstgrunnlag", "Muntlig framstilling", "Refleksjon i fagsamtale"] },
};
export function startmelding(o: Okt) {
  return `Fortsett økt ${o.id} i fag ${o.fagId}. Kall hent_okt med fagId og oktId. Følg skillen laeringsokt. Arbeidsmåte: ${o.arbeidsmate}. Lagre besvarelser med logg_forsok og vurderinger med vurder_forsok. ${o.arbeidsmate === "eksamen" ? "Vent med karakter og fasit til avslutningen." : "Ta ett spørsmål om gangen."}`;
}
export function osloDato(tid: string): string { return new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Oslo" }).format(new Date(tid)); }
export function osloUke(tid: string): string {
  const d = new Date(`${osloDato(tid)}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() - (d.getUTCDay() + 6) % 7);
  return d.toISOString().slice(0, 10);
}
export function framgang(state: AppState, fagId: string, na = new Date().toISOString()) {
  const fs = foldForsok(state.hendelser).filter(f => f.fagId === fagId);
  const os = foldOkter(state.hendelser).filter(o => o.fagId === fagId);
  const selv = fs.filter(f => f.hjelp === "ingen" && synligVurdering(f, state.hendelser));
  const mestret = new Map<string, Set<string>>();
  for (const f of selv) if (f.oppgaveId && f.vurderinger.some(v => (v.karakter ?? 0) >= 4)) {
    const dager = mestret.get(f.oppgaveId) ?? new Set<string>(); dager.add(osloDato(f.tid)); mestret.set(f.oppgaveId, dager);
  }
  const ks = state.kapitler.filter(k => k.fagId === fagId);
  // Milepæler beskriver hva som var oppnådd på et tidspunkt, også når nye oppgaver kommer til.
  const historiskFullfort = new Set<string>();
  const bokOppgaver = new Map<string, Set<string>>();
  const forsokt = new Set<string>();
  for (const h of sorterHendelser(state.hendelser)) {
    if (h.fagId !== fagId) continue;
    if (h.type === "oving-lagt-inn") { const sett = bokOppgaver.get(h.kapittelId) ?? new Set<string>(); sett.add(h.ovingId); bokOppgaver.set(h.kapittelId, sett); }
    if (h.type === "innhold-importert") { const sett = bokOppgaver.get(h.innhold.kapittel.id) ?? new Set<string>(); h.innhold.oppgaver.filter(o => o.opphav === "bok").forEach(o => sett.add(o.id)); bokOppgaver.set(h.innhold.kapittel.id, sett); }
    if (h.type === "forsok-lagret" && h.forsok.oppgaveId) forsokt.add(h.forsok.oppgaveId);
    for (const [kapittelId, opp] of bokOppgaver) if (opp.size > 0 && [...opp].every(id => forsokt.has(id))) historiskFullfort.add(kapittelId);
  }
  const fullforteKapitler = ks.filter(k => historiskFullfort.has(k.id));
  const maal = sorterHendelser(state.hendelser).filter(h => h.type === "ukesmaal-satt" && h.fagId === fagId).at(-1);
  return { forsok: fs.length, selvstendige: selv.length, ukesmaal: maal?.type === "ukesmaal-satt" ? maal.antall : 3,
    denneUken: os.filter(o => o.status === "fullfort" && o.slutt && osloUke(o.slutt) === osloUke(na)).length,
    milepaeler: [ ...(selv.length ? ["Første selvstendige besvarelse"] : []), ...fullforteKapitler.map(k => `Alle bokspørsmål forsøkt · ${k.navn}`),
      ...[...mestret].filter(([, dager]) => dager.size >= 2).map(([id]) => `Mestret igjen · ${oppgaver(state).find(o => o.id === id)?.nummer ?? id}`) ] };
}
