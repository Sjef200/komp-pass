---
name: lareplanstyrt-horing
description: "Koble spørsmål og vurdering til konkrete kompetansemål i det valgte faget. Bruk når eleven skal høres, øve til prøve, eller når du vurderer et svar. Trigger på 'hør meg', 'knytt til læreplanen', 'kompetansemål', 'er dette godt nok', 'øve til eksamen'."
---

# Læreplanstyrt høring

Hvert spørsmål skal treffe minst ett kompetansemål i det aktive faget. Dekning kommer fra siste høring per tema, ikke fra avkryssing.

## Trigger

Eleven vil øve, høres, eller få vurdert et svar etter at faget er valgt.

## Arbeidsflyt

1. Bekreft `fagId`. Hvis det mangler, følg `velg-fag-forst`.
2. Kall `hent_lareplan` med `fagId`. Les målene. Ikke finn på egne.
3. Kall `list_temaer` med filter `svake` eller `uhorte` for det faget.
4. Kall `still_sporsmal` med både `fagId` og `temaId`. Still **ett** spørsmål i chatten.
5. Når du vurderer: vis hvilket kompetansemål svaret treffer, hva som satt, og hva som mangler for 6.
6. Logg med `logg-etter-horing` når høringen er ferdig.

## MCP-verktøy

- `hent_lareplan`
- `list_temaer`
- `still_sporsmal`
- `hent_skill` / `hent_skill_reference` når faget har en fagskill (for MFL: `markedsforingslaering`)

## Ikke

- Ikke spør om stoff som ikke ligger i læreplanen for dette `fagId`.
- Ikke bruk MFL-begreper i entreprenørskap eller norsk.
- Ikke dump hele læreplanen i chatten. Hent den med verktøy og plukk det som trengs.
