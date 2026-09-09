import { test, after } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import type { McpServer } from "@modelcontextprotocol/server";
import type { z } from "zod";
import { foldForsok } from "./laering.ts";
const mappe=fs.mkdtempSync(path.join(os.tmpdir(),"komp-mcp-test-"));
process.env.MFL_DB=path.join(mappe,"test.db");
const {registrerLaeringsverktoy}=await import("../../mcp/src/laering-tools.ts");
const {lastMcpState}=await import("../../mcp/src/state.ts");
const {hentKapittel,kallLoggHoring,loggOving}=await import("../../mcp/src/tools.ts");
const {lukkDb}=await import("../../mcp/src/db.ts");
after(()=>{lukkDb();fs.rmSync(mappe,{recursive:true,force:true});});
const verktøy=new Map<string,{schema:z.ZodType;run:(a:unknown)=>Promise<any>}>();
registrerLaeringsverktoy({registerTool:(navn:string,config:{inputSchema:z.ZodType},run:(a:unknown)=>Promise<any>)=>{verktøy.set(navn,{schema:config.inputSchema,run});}} as unknown as McpServer);
async function kall(navn:string,args:unknown){const t=verktøy.get(navn)!;const r=await t.run(t.schema.parse(args));const data=JSON.parse(r.content[0].text);if(r.isError)throw new Error(data.feil);return data;}

test("MCP-pilot: import, notater, forsøk, vurdering, retry og gjenopptatt eksamen",async()=>{
 const inn={importId:"pilot",fagId:"male1",kapittel:{id:"male1-k06",bokId:"male1-bok",bokTittel:"Syntetisk testgrunnlag",nummer:6,navn:"Markedsundersøkelser",underpunkter:[{id:"male1-k06-s01",navn:"Vær kildekritisk"}]},oppsummering:{tekst:"Kun testdata, ikke boktekst.",referanse:{tittel:"Test",side:117,usikker:true}},oppgaver:[{id:"pilot-o",tekst:"Forklar markedsundersøkelser.",nummer:"1",temaIds:["def"],maalIds:["male1-04"]}]};
 await kall("importer_kapittelinnhold",inn);await kall("importer_kapittelinnhold",inn);
 for(const [id,plass] of [["n1","kapittel"],["n2","male1-k06-s01"]])await kall("lagre_notatversjon",{fagId:"male1",notatId:id,kapittelId:"male1-k06",plass,tekst:`Egne ord ${id}`,forelder:null});
 const kap=await hentKapittel("male1","male1-k06");const k=JSON.parse(kap.content[0].text);assert.equal(k.notater.filter((n:any)=>n.gjeldende).length,2);assert.equal(k.oppgaver.length,1);
 const okt={id:"eksamen",fagId:"male1",arbeidsmate:"eksamen",kapittelIds:["male1-k06"],oppgaveIds:["pilot-o"],grunnlag:"Testcase"};await kall("start_okt",okt);await kall("start_okt",okt);
 const f={id:"pilot-f",fagId:"male1",oktId:"eksamen",oppgaveId:"pilot-o",kapittelId:"male1-k06",sporsmal:"Forklar markedsundersøkelser.",svar:"Mitt selvstendige svar",arbeidsmate:"eksamen",hjelp:"ingen"};await kall("logg_forsok",f);await kall("logg_forsok",f);
 await assert.rejects(()=>kall("logg_forsok",{...f,svar:"Overskrevet"}),/annet innhold/);
 const v={id:"pilot-v",fagId:"male1",forsokId:"pilot-f",karakter:5,riktig:"Definisjonen",mangler:"Et eksempel",nesteSteg:"Gi eksempel",modell:"Testmodell",skillId:"laeringsokt",kriterieversjon:"male1-v1",begrunnelse:"Presist",maal:[{temaId:"def",maalId:"male1-04",karakter:5,begrunnelse:"Definisjonen forklares"}]};await kall("vurder_forsok",v);await kall("vurder_forsok",v);
 let g=await kall("hent_okt",{fagId:"male1",oktId:"eksamen"});assert.equal(g.forsok.length,1);assert.deepEqual(g.forsok[0].vurderinger,[]);
 await assert.rejects(()=>kall("hent_okt",{fagId:"entrep1",oktId:"eksamen"}),/Ukjent økt/);
 await assert.rejects(()=>kall("avslutt_okt",{fagId:"male1",oktId:"eksamen",status:"fullfort"}),/sluttvurdering/);
 const slutt={fagId:"male1",oktId:"eksamen",status:"fullfort",vurdering:{karakter:4,begrunnelse:"Helheten er vurdert separat",manglerBelegg:"Andre temaer",maalIds:["male1-04"],modell:"Testmodell",skillId:"laeringsokt",kriterieversjon:"male1-v1"}};await kall("avslutt_okt",slutt);await kall("avslutt_okt",slutt);
 g=await kall("hent_okt",{fagId:"male1",oktId:"eksamen"});assert.equal(g.forsok[0].vurderinger.length,1);assert.equal(g.okt.vurdering.karakter,4);
 const state=await lastMcpState();assert.equal(foldForsok(state.hendelser).length,1);assert.equal(state.horinger.filter(h=>h.forsokId==="pilot-f").length,1);
});

test("eldre dobbeltlogging samles i ett forsøk med ukjent hjelp",async()=>{
 const {leggInnOving}=await import("../../mcp/src/tools.ts");const res=await leggInnOving({fagId:"male1",kapittelId:"male1-k06",tekst:"Et eldre spørsmål"});const o=JSON.parse(res.content[0].text);
 await loggOving({fagId:"male1",kapittelId:"male1-k06",ovingId:o.ovingId,svar:"Eldre svar",temaId:"def",karakter:4});
 const input={fagId:"male1",temaId:"def",kapittelId:"male1-k06",ovingId:o.ovingId,sporsmal:"Et eldre spørsmål",svar:"Eldre svar",riktig:"Noe riktig",mangler:"Eksempel",karakter:4,modell:"Testmodell",innsats:"medium" as const,promptId:"kapittelarbeid",maalIds:["male1-04"]};
 const h=await kallLoggHoring(input);assert.ok(!("isError" in h));await kallLoggHoring(input);
 const fs=foldForsok((await lastMcpState()).hendelser).filter(f=>f.oppgaveId===o.ovingId);assert.equal(fs.length,1);assert.equal(fs[0].hjelp,"ukjent");assert.equal(fs[0].vurderinger.length,2);
});
