---
name: nytt-fagstoff
description: "Ta imot fagstoff eleven limer inn i chatten, lagre det som kilde, koble det til temaer, og hør eleven i det med én gang. Bruk når eleven limer inn et bokkapittel, notater fra timen, en oppgavetekst eller sier «her er stoffet», «lær dette», «vi har hatt om dette», «hør meg i dette»."
---

# Nytt fagstoff

Eleven gir deg stoff. Du lagrer det, kobler det til læreplanen, og hører hen i det. Ikke bare oppsummer — oppsummering er det svakeste du kan gjøre med et fagstoff.

## Trigger

Eleven limer inn tekst, eller sier at dere har hatt om noe nytt.

## Arbeidsflyt

1. `fagId` må være satt. Ellers `velg-fag-forst`.
2. Kall `legg_inn_kilde` med `fagId`, en tittel eleven kjenner igjen, og teksten **ordrett**. Ikke forkort den. Sett `type`: `bok`, `forelesning`, `oppgave` eller `notat`.
3. Se på temalisten du får tilbake. For hver bit som faktisk dekker et tema, kall `foresla_kobling` med `chunkId`, `temaId` og en kort begrunnelse.
   - Foreslå bare der stoffet virkelig treffer. Et forslag som ikke holder, koster eleven tid.
   - Treffer stoffet ingen tema som finnes, si det. Da mangler temaet i `temaer.json`, og det er verdt å vite.
4. Si kort hva du la inn: tittel, antall biter, og hvilke temaer du foreslo. Minn om at forslagene må bekreftes under fanen Kilder før de teller som dekning.
5. Gå rett til høring: `neste_horing`, så `muntlig-horing`. Stoffet er ferskt nå — det er det beste tidspunktet.

## Score

Når eleven spør hvor mye hen kan:

- Kall `hent_oversikt` for snittkarakter og hvor mange temaer som er hørt.
- Kall `hent_laringslop` for gapet mellom gjennomgått og hørt.
- Gi ett tall med én setnings begrunnelse, og **ett** konkret neste steg.

Si aldri et snilt tall. Snittet er av siste karakter per tema, ikke av alle forsøk, så det stiger bare når du faktisk blir bedre.

## MCP-verktøy

- `legg_inn_kilde`
- `foresla_kobling`
- `neste_horing`, `still_sporsmal`
- `hent_oversikt`, `hent_laringslop`

## Ikke

- Ikke lagre stoff i feil fag. Sjekk `fagId` først.
- Ikke skriv om teksten før du lagrer den. Den skal kunne siteres tilbake til eleven som den sto.
- Ikke behandle et koblingsforslag som dekning.
- Ikke lever en oppsummering og stopp der. Poenget er å bli hørt i stoffet.
