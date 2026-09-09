---
name: laeringsokt
description: "Gjennomfør og gjenoppta læring, selvtest og eksamenstrening i øvingsappen. Bruk ved økt-ID, bokspørsmål, repetisjon eller eksamensøving."
---

# Læringsøkt

Appen lagrer læringsgrunnlaget. Samtalen foregår her, med brukerens AI-abonnement. Bruk MCP til å lese og lagre, uten egen modell-API.

## Velg riktig flyt

- En økt-ID: kall `hent_okt`. Fortsett med lagret arbeidsmåte og fag. Opprett ikke en ny økt som erstatning.
- Et kapittel: `hent_kapittel` gir alle underpunkter, notatversjoner, bokas oppsummering, oppgaver og tidligere forsøk. Bruk originalspørsmål først, og `neste_oving` med repetisjon når eldre stoff skal tilbake.
- Uten økt: velg fag og grunnlag, deretter `start_okt`. Tidsgrense er valgfri. Hent læreplanen før du kobler vurderingen til mål.
- Nytt foto/PDF: les vedlegget i klienten eller med `hent_vedlegg`. Ved manglende klientstøtte kan eleven laste ned originalen fra appen og legge den ved her. Bruk `importer_kapittelinnhold`; bevar ordlyd, nummer, sider og usikker transkripsjon. Ikke påstå at originalen er arkivert uten en faktisk vedleggs-ID.

## Arbeidsmåte

- Læring: gi støtte underveis. Registrer hint eller vist løsning på forsøket.
- Selvtest: eleven svarer før vurdering og forklaring. Still ett spørsmål om gangen.
- Eksamen: følg fagets form fra `hent_okt`. Bruk naturlige oppfølgere, men vent med karakter, fasit og retting til avslutningen. Les `references/eksamensformer.md` for fagets kriterier.

Et definisjonsspørsmål vurderes som en definisjon. Krev ikke drøfting eller eksempler som oppgaven ikke etterspør. Vurder en lang besvarelse som helhet, og knytt konkret belegg til målene den faktisk undersøker. Vurderingskriteriene er treningskriterier; oppgitte eksamensoppgaver og lærerens kriterier supplerer dem.

## Lagre og fortsett

1. `logg_forsok` lagrer originalspørsmål og originalsvaret. Oppgi økt, eventuell oppgave/kapittel, arbeidsmåte, hjelp og kildereferanser. Gjenbruk samme forsøks-ID ved retry. Et nytt forsøk får ny ID.
2. `vurder_forsok` legger til hva som satt, mangler, neste steg, begrunnelse og eventuell oppgavekarakter. Oppgi modell, skillId=`laeringsokt` og kriterieversjon fra `hent_okt`.
3. `maal` inneholder bare eksplisitt vurderte kombinasjoner av mål og tema, med eget belegg og karakter. Oppgavens mulige målkoblinger er ikke dokumentert mestring. Hvis en relevant kobling mangler, lagre vurderingen uten måluttelling og forklar gapet.
4. Rett en vurdering med ny vurderings-ID og `erstatter` satt til siste revisjon. Begrunn rettingen; originalsvaret endres ikke.
5. Avslutt med `avslutt_okt`. Fullført eksamen krever en egen helhetsvurdering og angivelse av manglende belegg. Ikke regn eksamenskarakter som snitt av enkeltsvar.

Si at dataene er lagret først når verktøyet bekrefter det. Ved feil, behold samme ID og rett feilen; ikke lag en ekstra registrering. `logg_oving` og `logg_horing` er kompatibilitetsverktøy, ikke den nye dobbeltloggingsflyten.

## Notater og fagbegreper

Elevtekst lagres med `lagre_notatversjon`, med gjeldende notatId som forelder. Ved versjonsavvik: hent på nytt og sammenlign. Gi AI-kommentarer gjennom `kommenter_notat`; ikke skriv over elevens egne formuleringer. Bokas oppsummering og elevens oppsummering er forskjellige innholdstyper.

Oppdater bare fagord som faktisk ble brukt eller blandet. Hjelpestøttede svar skal ikke omtales som selvstendig mestring. Bruk nye case og varianter ved senere repetisjon, merket som AI-variant med kobling til originaloppgaven.
