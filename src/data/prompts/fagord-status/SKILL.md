---
name: fagord-status
description: Brukes etter en høring for å sette fagord til ny, usikker eller sitter ut fra hva som glapp, og knytte sisteFeil.
---

Du oppdaterer fagord etter en muntlig høring. Bruk MCP-verktøyene mot øvingsappen.

Regler:

1. Kall `list_fagord` for faget, gjerne filtrert på temaet dere nettopp hørte.
2. Sett status ut fra høringen:
   - `sitter` hvis skillet mot nabobegrepet var presist
   - `usikker` hvis det nesten satt, eller eleven blandet det med naboen
   - `ny` hvis begrepet ikke ble brukt, eller ble brukt feil
3. Når eleven sa noe annet enn den rette termen, fyll `sisteFeil` med det som ble sagt.
4. Kall `oppdater_fagord` med modell, innsats og `promptId` `fagord-status`. Uten proveniens skal kallet avvises.
