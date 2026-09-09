import assert from "node:assert/strict";
import { test } from "node:test";
import { mergeTreLag } from "./ai-overlay.ts";
import { EKSAMEN, foldForsok, foldOkter, framgang, gjeldendeNotat, innholdSchema, notatHistorikk, oppgaver, osloDato, osloUke, startmelding, synligVurdering, underpunkter, type LaeringsHendelse } from "./laering.ts";
import { validerLaeringsHendelse, hendelseInnhold } from "./laering-validering.ts";
import { maalDekning } from "./dekning.ts";
import { ovingKo } from "./oving-ko.ts";
import type { AppState, Horing } from "./types.ts";
import type { Hendelse } from "./hendelser.ts";

function base(): AppState { return { fag:[{id:"male1",navn:"MFL",kode:"test",emoji:""},{id:"entrep1",navn:"Ent",kode:"e",emoji:""}],kompetansemaal:[{id:"a",fagId:"male1",tekst:"Mål A",kortnavn:"A",emoji:""},{id:"b",fagId:"male1",tekst:"Mål B",kortnavn:"B",emoji:""}],temaer:[{id:"t",fagId:"male1",navn:"Tema",emoji:"",maalIds:["a","b"]},{id:"t2",fagId:"male1",navn:"Tema 2",emoji:"",maalIds:["a"]}],kapitler:[{id:"k",fagId:"male1",nummer:6,navn:"Kapittel",seksjoner:["Del A","Del B"],temaIds:["t","t2"]}],horinger:[],fagord:[],hendelser:[],koblinger:[],kilder:[],prompts:[],skills:[{id:"laeringsokt",navn:"Økt",beskrivelse:"",markdown:"",kilde:"lokal",fagIds:[],referanser:[],kategori:"plattform"}],innstillinger:{aktivtFag:"male1",visEmoji:true} }; }
function h(id:string,dag="2026-09-09T10:00:00Z"){return{id,tid:dag,fagId:"male1",kilde:"ai" as const};}
function forsok(id="f",hjelp:"ingen"|"hint"|"ukjent"="ingen",tid="2026-09-09T10:00:00Z"): LaeringsHendelse { return{...h(`forsok:${id}`,tid),type:"forsok-lagret",forsok:{id,fagId:"male1",kapittelId:"k",oppgaveId:"o",sporsmal:"Forklar",svar:"Originalt svar",arbeidsmate:"selvtest",hjelp,referanser:[]}}; }
function vurdering(id="v",fid="f",karakter=5,tid="2026-09-09T10:01:00Z"):LaeringsHendelse{return{...h(`vurdering:${id}`,tid),type:"forsok-vurdert",vurdering:{id,forsokId:fid,karakter,riktig:"Begrepet",mangler:"Eksempel",nesteSteg:"Gi eget eksempel",modell:"Testmodell",skillId:"laeringsokt",kriterieversjon:"male1-v1",begrunnelse:"Presis definisjon",maal:[{temaId:"t",maalId:"a",karakter,begrunnelse:"Forklarer A"}]}};}
function oppgave():Hendelse{return{...h("o"),type:"oving-lagt-inn",ovingId:"o",kapittelId:"k",ovingType:"kontroll",tekst:"Forklar"};}
function med(...hs:Hendelse[]){return mergeTreLag(base(),null,{hendelser:[oppgave(),...hs]});}

test("bare eksplisitt vurdert mål får score, og uhørte temaer vises som delvis",()=>{
 const s=med(forsok(),vurdering()); const a=maalDekning(s.kompetansemaal[0],s.temaer,s.horinger);const b=maalDekning(s.kompetansemaal[1],s.temaer,s.horinger);
 assert.equal(a.snitt,5);assert.equal(a.horteTemaer,1);assert.equal(a.totaltTemaer,2);assert.equal(a.delvis,true);assert.equal(b.snitt,null);
});
test("hint og ukjent hjelp gir ingen selvstendig måluttelling",()=>{
 for(const hjelp of ["hint","ukjent"] as const){const s=med(forsok("f",hjelp),vurdering());assert.equal(maalDekning(s.kompetansemaal[0],s.temaer,s.horinger).snitt,null);assert.equal(framgang(s,"male1").selvstendige,0);}
});
test("historisk høring uten hjelp beholdes men gir ikke mestring",()=>{
 const gammel:Horing={id:"gammel",temaId:"t",dato:"2026-09-01",karakter:6,riktig:"",mangler:"",kilde:"ai",maalIds:["a"]};const s=mergeTreLag({...base(),horinger:[gammel]},null,null);
 assert.equal(s.horinger.length,1);assert.equal(maalDekning(s.kompetansemaal[0],s.temaer,s.horinger).snitt,null);
});
test("vurderingsrevisjon endrer score uten å endre originalsvaret eller doble forsøk",()=>{
 const v2=vurdering("v2","f",3,"2026-09-09T10:02:00Z");if(v2.type==="forsok-vurdert")v2.vurdering.erstatter="v";
 const s=med(forsok(),vurdering(),v2);const fs=foldForsok(s.hendelser);assert.equal(fs.length,1);assert.equal(fs[0].svar,"Originalt svar");assert.equal(fs[0].vurderinger.length,2);assert.equal(maalDekning(s.kompetansemaal[0],s.temaer,s.horinger).snitt,3);
 assert.equal(mergeTreLag(s,null,{hendelser:[v2]}).horinger.length,1);
});
test("senere klokkeslett samme dag bestemmer siste selvstendige vurdering",()=>{
 const s=med(forsok(),vurdering(),forsok("f2","ingen","2026-09-09T12:00:00Z"),vurdering("v2","f2",4,"2026-09-09T12:01:00Z"));assert.equal(maalDekning(s.kompetansemaal[0],s.temaer,s.horinger).snitt,4);
});
test("eksamensøkt kan gjenopptas og skjuler vurdering før avslutning",()=>{
 const o:LaeringsHendelse={...h("okt:e","2026-09-09T09:00:00Z"),type:"okt-startet",okt:{id:"e",fagId:"male1",arbeidsmate:"eksamen",kapittelIds:["k"],oppgaveIds:["o"],grunnlag:"Case",hjelpemidler:"Bok"}};
 const f=forsok();if(f.type==="forsok-lagret"){f.forsok.arbeidsmate="eksamen";f.forsok.oktId="e";}
 let s=med(o,f,vurdering());assert.equal(synligVurdering(foldForsok(s.hendelser)[0],s.hendelser),undefined);assert.equal(s.horinger.length,0);assert.match(startmelding(foldOkter(s.hendelser)[0]),/hent_okt/);
 const slutt:LaeringsHendelse={...h("slutt:e","2026-09-09T11:00:00Z"),type:"okt-avsluttet",oktId:"e",status:"fullfort",vurdering:{karakter:4,begrunnelse:"Helheten",manglerBelegg:"B",maalIds:["a"],modell:"test",skillId:"laeringsokt",kriterieversjon:"male1-v1"}};
 validerLaeringsHendelse(s,slutt);s=mergeTreLag(s,null,{hendelser:[slutt]});assert.equal(foldOkter(s.hendelser)[0].vurdering?.karakter,4);assert.equal(s.horinger[0].karakter,5);
});
test("tom økt kan avbrytes, men ikke fullføres",()=>{
 const o:LaeringsHendelse={...h("okt:e"),type:"okt-startet",okt:{id:"e",fagId:"male1",arbeidsmate:"selvtest",kapittelIds:[],oppgaveIds:[],grunnlag:"Case",hjelpemidler:""}};const s=med(o);
 assert.throws(()=>validerLaeringsHendelse(s,{...h("slutt:e"),type:"okt-avsluttet",oktId:"e",status:"fullfort"}),/tom økt/);
 assert.doesNotThrow(()=>validerLaeringsHendelse(s,{...h("slutt:e"),type:"okt-avsluttet",oktId:"e",status:"avbrutt"}));
});
test("notater per underpunkt og gammel kapitteltekst overlever med versjonshistorikk",()=>{
 const gammel:Hendelse={...h("gammel"),type:"kapittel-notat",notatId:"n0",kapittelId:"k",tekst:"Hele kapittelet"};
 const n:LaeringsHendelse={...h("notat:n1"),type:"notat-versjon",notat:{notatId:"n1",kapittelId:"k",plass:"k-s01",tekst:"Del A",forelder:null}};
 const s=med(gammel,n);assert.equal(gjeldendeNotat(s,"k","kapittel")?.tekst,"Hele kapittelet");assert.equal(gjeldendeNotat(s,"k","k-s01")?.tekst,"Del A");assert.equal(underpunkter(s.kapitler[0])[0].id,"k-s01");
});
test("stale notat avvises og samtidige grener bevares synlig uten overskriving",()=>{
 const n:LaeringsHendelse={...h("notat:n1"),type:"notat-versjon",notat:{notatId:"n1",kapittelId:"k",plass:"kapittel",tekst:"Første",forelder:null}};
 const konflikt:LaeringsHendelse={...h("notat:n2","2026-09-09T11:00:00Z"),type:"notat-versjon",notat:{notatId:"n2",kapittelId:"k",plass:"kapittel",tekst:"Andre",forelder:null}};
 const s=med(n);assert.throws(()=>validerLaeringsHendelse(s,konflikt),/Versjonsavvik/);
 const samtidig=mergeTreLag(s,null,{hendelser:[konflikt]});assert.equal(gjeldendeNotat(samtidig,"k","kapittel")?.tekst,"Første");assert.equal(notatHistorikk(samtidig,"k","kapittel")[1].konflikt,true);
});
test("import bevarer kilde, usikkerhet, underpunkter og ubekreftede mål",()=>{
 const inn=innholdSchema.parse({importId:"i",fagId:"male1",kapittel:{id:"k2",bokId:"bok",bokTittel:"Boka",nummer:7,navn:"Neste",underpunkter:[{id:"u",navn:"Underpunkt",side:42}]},temaer:[{id:"nytt",navn:"Tema",maalIds:["a"]}],oppsummering:{tekst:"Original oppsummering",referanse:{tittel:"Boka",side:42,usikker:true}},oppgaver:[{id:"nyopp",tekst:"Originalt spørsmål?",nummer:"7.1",underpunktId:"u",temaIds:["nytt"],maalIds:["a"]}]});
 const e:LaeringsHendelse={...h("import:i"),type:"innhold-importert",innhold:inn};validerLaeringsHendelse(base(),e);const s=med(e);assert.equal(s.kapitler[1].bokId,"bok");assert.deepEqual(s.temaer.find(t=>t.id==="nytt")?.maalIds,[]);assert.deepEqual(s.temaer.find(t=>t.id==="nytt")?.foreslatteMaalIds,["a"]);assert.equal(oppgaver(s,"k2")[0].tekst,"Originalt spørsmål?");assert.equal(inn.oppsummering?.referanse?.original,"ikke-arkivert");assert.equal(mergeTreLag(s,null,{hendelser:[e]}).hendelser.length,s.hendelser.length);
});
test("forsøk kan ikke knyttes til feil fag eller oppgavekapittel",()=>{
 const f=forsok();if(f.type!=="forsok-lagret")return;
 assert.throws(()=>validerLaeringsHendelse(med(),{...f,fagId:"entrep1"}),/annet fag/);
 assert.throws(()=>validerLaeringsHendelse(med(),{...f,forsok:{...f.forsok,kapittelId:undefined}}),/ikke kapittelet/);
});
test("revisjon må oppgi gjeldende vurderings-ID",()=>{
 const s=med(forsok(),vurdering());assert.throws(()=>validerLaeringsHendelse(s,vurdering("v2")),/Hent siste revisjon/);
});
test("besvart oppgave med hint kommer tilbake i neste økt, ikke samme økt",()=>{
 const f=forsok("f","hint");if(f.type==="forsok-lagret")f.forsok.oktId="e";const s=med(f,vurdering());
 assert.equal(ovingKo(s,"male1",{repetisjon:true,oktId:"e"}).length,0);assert.equal(ovingKo(s,"male1",{repetisjon:true,oktId:"neste"})[0].grunn,"Prøv uten hjelp");
});
test("sterk oppgave returnerer når repetisjonsintervallet er utløpt",()=>{
 const s=med(forsok(),vurdering("v","f",6));assert.equal(ovingKo(s,"male1",{repetisjon:true,na:"2026-09-10"}).length,0);assert.equal(ovingKo(s,"male1",{repetisjon:true,na:"2026-10-10"}).length,1);
});
test("Oslo-uke og milepæl krever ulike lokale dager",()=>{
 assert.equal(osloDato("2026-09-06T22:30:00Z"),"2026-09-07");assert.equal(osloUke("2026-09-06T22:30:00Z"),"2026-09-07");
 let s=med(forsok(),vurdering(),forsok("f2","ingen","2026-09-09T12:00:00Z"),vurdering("v2","f2",5,"2026-09-09T12:01:00Z"));assert.ok(!framgang(s,"male1").milepaeler.some(m=>m.startsWith("Mestret igjen")));
 s=mergeTreLag(s,null,{hendelser:[forsok("f3","ingen","2026-09-10T12:00:00Z"),vurdering("v3","f3",5,"2026-09-10T12:01:00Z")]});assert.ok(framgang(s,"male1").milepaeler.some(m=>m.startsWith("Mestret igjen")));
});
test("JSONB nøkkelrekkefølge endrer ikke idempotens",()=>{
 const a=forsok();const b=JSON.parse(JSON.stringify(a));b.forsok=Object.fromEntries(Object.entries(b.forsok).reverse());b.tid="2026-09-10T12:00:00Z";assert.equal(hendelseInnhold(a),hendelseInnhold(b));
});
test("alle seks fag har eksplisitt eksamensform",()=>{
 assert.equal(Object.keys(EKSAMEN).length,6);assert.equal(EKSAMEN.entrep1.form,"Muntlig-praktisk");assert.equal(EKSAMEN.male2.form,"Skriftlig");assert.equal(EKSAMEN["norsk-muntlig"].form,"Muntlig");
});
