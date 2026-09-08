---
name: fagbytte
description: "Avslutt kontekst før bytte mellom MFL, entreprenørskap og norsk. Bruk når eleven bytter fag, sier 'nå tar vi norsk', 'bytt til entreprenørskap', eller ber om et tema som tilhører et annet fag enn det aktive."
---

# Fagbytte

Hvert fag er en egen kontekst. Temaer, fagord og høringer fra ett fag skal ikke følge med over.

## Trigger

Eleven vil bytte fag, eller et verktøykall feiler fordi temaet tilhører et annet `fagId`.

## Arbeidsflyt

1. Si tydelig hvilket fag som avsluttes (`fagId`, fagkode, navn).
2. Hvis en høring pågår: logg den med `logg-etter-horing`, eller spør om den skal forkastes. Ikke ta den med over.
3. Bekreft det nye `fagId` med `list_fag` om det er uklart.
4. Kall `hent_oversikt` og `hent_lareplan` for det nye faget.
5. Kall `list_skills` med det nye `fagId`. Ikke ta med en fagskill som ikke gjelder.
6. Still neste spørsmål bare fra det nye faget.

## MCP-verktøy

- `list_fag`
- `hent_oversikt`
- `hent_lareplan`
- `list_skills`

## Ikke

- Ikke gjenbruk forrige spørsmål, karakter eller fagord.
- Ikke anta at norsk hovedmål og norsk muntlig er samme økt. De deler kompetansemålsett, men er to fag.
- Ikke logg et tema fra MFL på entreprenørskap eller norsk.
