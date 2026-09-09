import type { McpServer } from "@modelcontextprotocol/server";
import { z } from "zod";
import { EKSAMEN, foldForsok, foldOkter, forsokSchema, framgang, innholdSchema, notatSchema, oktSchema, oppgaver, sluttSchema, startmelding, synligVurdering, vurderingSchema, type LaeringsHendelse } from "../../src/lib/laering.ts";
import { ovingKo } from "../../src/lib/oving-ko.ts";
import { krevFag, krevKapittelIFag } from "../../src/lib/fag-validering.ts";
import { lastMcpState, skrivHendelserFraKlient } from "./state.ts";
import { iSky } from "./db.ts";
const json = (data: unknown) => ({ content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] });
async function sikkert(fn: () => Promise<unknown>) { try { return json(await fn()); } catch (e) { return { ...json({ feil: e instanceof Error ? e.message : "Ukjent feil" }), isError: true }; } }
const fagId = z.string().min(1);
export async function lagreLaering(h: LaeringsHendelse) {
  const [lagret] = await skrivHendelserFraKlient([h]); return { lagret: true, hendelseId: lagret.id };
}
function base(id: string, fagId: string) { return { id, fagId, tid: new Date().toISOString(), kilde: "ai" as const }; }
export function registrerLaeringsverktoy(server: McpServer) {
  server.registerTool("importer_kapittelinnhold", { description: "Lagre strukturert bokinnhold etter gjennomgang med eleven. Samme importId gjør gjentatte kall idempotente. Bevar ordlyd og kilder. AI-foreslåtte koblinger skal ha bekreftet=false.", inputSchema: innholdSchema }, args => sikkert(async () => lagreLaering({ ...base(`import:${args.importId}`, args.fagId), type: "innhold-importert", innhold: args })));
  server.registerTool("start_okt", { description: "Start en varig lærings-, selvtest- eller eksamensøkt. Velg en stabil id og gjenbruk ved retry.", inputSchema: oktSchema }, args => sikkert(async () => {
    await lagreLaering({ ...base(`okt:${args.id}`, args.fagId), type: "okt-startet", okt: args });
    const state = await lastMcpState(); const o = foldOkter(state.hendelser).find(o => o.id === args.id)!;
    return { okt: o, startmelding: startmelding(o), eksamen: EKSAMEN[krevFag(state, args.fagId).id] };
  }));
  server.registerTool("hent_okt", { description: "Hent og fortsett en økt, eller list aktive økter i faget. Eksamen skjuler vurderinger til økten er avsluttet.", inputSchema: z.object({ fagId, oktId: z.string().optional() }) }, args => sikkert(async () => {
    const state = await lastMcpState(); const fag = krevFag(state, args.fagId);
    const okter = foldOkter(state.hendelser).filter(o => o.fagId === fag.id);
    if (!args.oktId) return { okter, framgang: framgang(state, fag.id) };
    const o = okter.find(o => o.id === args.oktId); if (!o) throw new Error("Ukjent økt i faget.");
    const fs = foldForsok(state.hendelser).filter(f => f.oktId === o.id).map(f => ({ ...f, vurderinger: synligVurdering(f, state.hendelser) ? f.vurderinger : [] }));
    return { okt: o, forsok: fs, oppgaver: oppgaver(state).filter(p => o.oppgaveIds.length ? o.oppgaveIds.includes(p.id) : o.kapittelIds.includes(p.kapittelId)),
      eksamen: EKSAMEN[fag.id], kriterieversjon: `${fag.id}-v1`, ko: ovingKo(state, fag.id, { oktId: o.id, repetisjon: true }).filter(r => !o.kapittelIds.length || o.kapittelIds.includes(r.oppgave.kapittelId)),
      instruksjon: o.arbeidsmate === "eksamen" ? "Ingen karakter eller fasit før avslutt_okt. Vurder hele prestasjonen separat. Følg oppgaveverb og oppgavegrunnlag." : "Ett spørsmål om gangen. Registrer hjelp ærlig. Hent kildegrunnlaget før vurdering." };
  }));
  server.registerTool("logg_forsok", { description: "Lagre originalbesvarelsen én gang. Samme id ved retry. Ingen karakter nødvendig; vurder separat med vurder_forsok.", inputSchema: forsokSchema }, args => sikkert(async () => lagreLaering({ ...base(`forsok:${args.id}`, args.fagId), type: "forsok-lagret", forsok: args })));
  server.registerTool("vurder_forsok", { description: "Legg til vurdering eller begrunnet revisjon. maal er bare eksplisitt demonstrerte mål. Ved retting: erstatter=siste vurderings-ID. Karakter/fasit holdes skjult under eksamen.", inputSchema: vurderingSchema.extend({ fagId }) }, args => sikkert(async () => {
    const { fagId, ...vurdering } = args;
    return lagreLaering({ ...base(`vurdering:${args.id}`, fagId), type: "forsok-vurdert", vurdering });
  }));
  server.registerTool("avslutt_okt", { description: "Fullfør eller avbryt en økt. Fullført eksamen krever egen helhetsvurdering, aldri automatisk snitt av spørsmålene.", inputSchema: z.object({ fagId, oktId: z.string(), status: z.enum(["fullfort", "avbrutt"]), vurdering: sluttSchema.optional() }) }, args => sikkert(async () => lagreLaering({ ...base(`slutt:${args.oktId}`, args.fagId), type: "okt-avsluttet", oktId: args.oktId, status: args.status, vurdering: args.vurdering })));
  server.registerTool("lagre_notatversjon", { description: "Lagre elevtekst med versjonskontroll. forelder er gjeldende notatId, eller null for nytt notat. Ved konflikt, hent kapittelet igjen og sammenlign.", inputSchema: notatSchema.extend({ fagId }) }, args => sikkert(async () => {
    const { fagId, ...notat } = args; return lagreLaering({ ...base(`notat:${args.notatId}`, fagId), type: "notat-versjon", notat });
  }));
  server.registerTool("kommenter_notat", { description: "Kommenter elevens notat uten å endre originalteksten.", inputSchema: z.object({ id: z.string(), fagId, kapittelId: z.string(), notatId: z.string(), tekst: z.string().min(1) }) }, a => sikkert(async () => lagreLaering({ ...base(`kommentar:${a.id}`, a.fagId), type: "notat-kommentar", kapittelId: a.kapittelId, notatId: a.notatId, tekst: a.tekst })));
  server.registerTool("hent_vedlegg", { description: "Hent et bilde som MCP-innhold, eller PDF som nedlastbar ressurs. Hvis klienten ikke leser ressursen, last ned og legg ved i AI-chatten.", inputSchema: z.object({ fagId, vedleggId: z.string() }) }, async args => {
    try {
      const state = await lastMcpState(); const fag = krevFag(state, args.fagId);
      const v = state.hendelser.find(h => h.type === "kapittel-vedlegg" && h.vedleggId === args.vedleggId && h.fagId === fag.id);
      if (!v || v.type !== "kapittel-vedlegg") throw new Error("Fant ikke vedlegget i faget.");
      krevKapittelIFag(state, fag.id, v.kapittelId);
      if (v.lager === "sky") {
        const { hentKlient } = await import("./db-postgres.ts");
        const { data, error } = await hentKlient().storage.from("laeringsvedlegg").createSignedUrl(v.sti, 300);
        if (error || !data) throw new Error(error?.message ?? "Kunne ikke hente vedlegg.");
        return { content: [{ type: "resource_link" as const, uri: data.signedUrl, name: v.filnavn, mimeType: v.mime, description: "Privat vedlegg. Lenken utløper om fem minutter. Last ned og legg ved i chatten hvis nødvendig." }] };
      }
      if (iSky()) throw new Error("Dette er et lokalt vedlegg. Last opp originalen i appen for å bruke det i skyen.");
      const { lesVedleggFil } = await import("./vedlegg.ts"); const fil = lesVedleggFil(v.sti); if (!fil) throw new Error("Originalfilen finnes ikke lokalt.");
      if (["image/jpeg", "image/png", "image/webp", "image/gif"].includes(v.mime)) return { content: [{ type: "image" as const, mimeType: v.mime, data: fil.bytes.toString("base64") }] };
      return { content: [{ type: "resource" as const, resource: { uri: `mfl://vedlegg/${v.vedleggId}`, mimeType: v.mime, blob: fil.bytes.toString("base64") } }] };
    } catch (e) { return { ...json({ feil: e instanceof Error ? e.message : "Kunne ikke lese fil" }), isError: true }; }
  });
}
