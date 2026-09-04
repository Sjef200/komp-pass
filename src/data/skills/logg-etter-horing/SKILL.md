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
   - `riktig` og `mangler`
   - `modell`, `innsats` (`lav` | `medium` | `hoy` | `maks`) og `promptId`
2. `promptId` skal være skillen du faktisk fulgte, for eksempel `muntlig-horing` eller `markedsforingslaering`.
3. Kall `list_fagord` for samme `fagId`. Oppdater **bare** begrepene som ble brukt eller blandet.
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

- Ikke kall uten `fagId`, modell, innsats og `promptId`. Serveren skal avvise det.
- Ikke overskriv gamle høringer.
- Ikke oppdater fagord i et annet fag.
- Ikke skriv til `horinger.json`.
