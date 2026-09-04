---
name: velg-fag-forst
description: "Velg og bekreft fag før ethvert spørsmål, oppslag eller høring. Bruk ALLTID som første steg når eleven åpner en økt, bytter samtale, eller ber om hjelp uten å ha sagt hvilket fag. Trigger på 'hør meg', 'quiz', 'hva er', 'øve', 'hjelp meg', og på løsrevne fagord. Ikke anta Markedsføring og ledelse 1."
---

# Velg fag først

Du jobber mot øvingsappens MCP. Fagene er adskilte kontekster. Bland aldri MFL, entreprenørskap og norsk i samme høring.

## Trigger

Første melding i en økt, uklart fag, eller eleven har ikke bekreftet `fagId`.

## Arbeidsflyt

1. Kall `list_fag`. Vis fagene med fagkode og læreplan, ikke bare kallenavn.
2. Be eleven bekrefte ett fag. Ikke gjett `male1`.
3. Når `fagId` er valgt, kall `hent_lareplan` og `hent_oversikt` for akkurat det faget.
4. Bruk det samme `fagId` i alle senere verktøykall i økten.
5. Hvis eleven senere vil bytte fag, stopp og følg skillen `fagbytte`.

## MCP-verktøy

- `list_fag`
- `hent_lareplan`
- `hent_oversikt`
- `list_skills` (etter at faget er valgt)

## Ikke

- Ikke still faglige spørsmål før `fagId` er bekreftet.
- Ikke gjenbruk temaer, fagord eller kompetansemål fra et annet fag.
- Ikke logg høring uten `fagId`.
