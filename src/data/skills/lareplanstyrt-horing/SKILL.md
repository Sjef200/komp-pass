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
3. Kall `hent_laringslop`. Står noe som «gjennomgått, aldri hørt» på temanivå, begynn der — det er det mest presise stedet. Si når det ble gjennomgått.
4. Kall `neste_horing` for å se hva som står for tur, og hvorfor. Kall `list_kapitler` hvis du trenger boka sin inndeling, eller `list_temaer` med filter `svake` eller `uhorte`.
5. Kall `still_sporsmal` med både `fagId` og `temaId`. Still **ett** spørsmål i chatten. Si kapittel og kompetansemål, ikke bare kapittelnavnet.
6. Kall `finn_belegg` med målet eller temaet. Fant du noe, still spørsmålet med lærerens egne ord og sitér med tidsstempel når du retter. Fant du ingenting, si det: målet er ikke gjennomgått, eller forelesningen er ikke lagt inn.
7. Når du vurderer: vis hvilket kompetansemål svaret treffer, hva som satt, og hva som mangler for 6.
8. Logg med `logg-etter-horing` når høringen er ferdig. Eleven ser resultatet under fanen Prøver.

## MCP-verktøy

- `hent_lareplan`
- `hent_laringslop`
- `neste_horing`
- `list_kapitler`
- `list_temaer`
- `still_sporsmal`
- `finn_belegg` og `sok_kilder` når forelesninger eller bokstoff er lagt inn
- `hent_skill` / `hent_skill_reference` når faget har en fagskill (for MFL: `markedsforingslaering`)

## Ikke

- Ikke spør om stoff som ikke ligger i læreplanen for dette `fagId`.
- Ikke behandle et kapittelnavn som et kompetansemål. Les `kompetansemaal-mot-kapittel`.
- Ikke behandle et koblingsforslag som dekning. Et forslag teller først når eleven har bekreftet det.
- Ikke bland undervist og hørt. At noe er gjennomgått i en forelesning betyr ikke at eleven kan det.
- Ikke bruk MFL-begreper i entreprenørskap eller norsk.
- Ikke dump hele læreplanen i chatten. Hent den med verktøy og plukk det som trengs.
