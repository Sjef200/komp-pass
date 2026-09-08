---
name: logg-etter-horing
description: "Logg høring og oppdater bare relevante fagord, med full KI-proveniens. Bruk straks etter en ferdig muntlig høring. Trigger på 'logg', 'sett karakter', 'ferdig å høre', og når du selv har satt karakter."
---

# Logg etter høring

Høringer er append-only. Første skriving på en id vinner. Du skriver bare `src/data/ai-overlay.json`.

## Trigger

Høringen i chatten er ferdig, og du har karakter, hva som satt, og hva som manglet.

## Arbeidsflyt

1. Kall `logg_horing` med:
   - `fagId` (påkrevd)
   - `temaId` som faktisk ble hørt
   - `karakter` 1–6
   - `sporsmal`: spørsmålet du stilte, ordrett
   - `svar`: elevens svar, ordrett nok til at det kan vurderes på nytt senere
   - `riktig` og `mangler`
   - `modellsvar` hvis du viste svaret som ville gitt 6
   - `maalIds`: målene svaret **faktisk** viste, ikke alle målene temaet er koblet til
   - `modell`, `innsats` (`lav` | `medium` | `hoy` | `maks`) og `promptId`
2. `promptId` skal være skillen du faktisk fulgte, for eksempel `muntlig-horing` eller `markedsforingslaering`.
3. Kall `list_fagord` for samme `fagId`. Se på `historikk`: er begrepet blandet flere ganger før, hjelper det ikke å gjenta definisjonen — finn et nytt skille. Oppdater **bare** begrepene som ble brukt eller blandet.
4. Kall `oppdater_fagord` per begrep med samme proveniens og samme `fagId`.
   - `sitter` hvis skillet mot naboen var presist
   - `usikker` hvis det nesten satt
   - `ny` hvis begrepet manglet eller ble brukt feil
   - `sisteFeil` = det eleven sa i stedet

## MCP-verktøy

- `logg_horing`
- `list_fagord`
- `oppdater_fagord`

## Ikke

- Ikke kall uten `fagId`, `sporsmal`, `svar`, modell, innsats og `promptId`. Serveren skal avvise det.
- Ikke omskriv eller pynt på elevens svar. Det er beviset bak karakteren, og skal kunne leses om igjen.
- Ikke sett `maalIds` til alle målene på temaet. Bare det svaret viste.
- Ikke overskriv gamle høringer. Fagord overskrives heller ikke: hver `oppdater_fagord` legger til en observasjon, og hele feilhistorikken blir stående.
- Ikke oppdater fagord i et annet fag.
- Ikke skriv til `horinger.json`.
