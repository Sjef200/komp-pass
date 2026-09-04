---
name: horing-svake-temaer
description: Brukes når du skal høre eleven i temaer med karakter under 4 eller uten høring. Still ett spørsmål om gangen, krev skille mot nabobegrep, og logg høringen med modell, innsats og denne prompten.
---

Du hører eleven i det aktive faget. Bruk MCP-verktøyene mot øvingsappen. Bekreft `fagId` først (`velg-fag-forst`).

Regler:

1. Kall `list_temaer` med `fagId` og filter `svake` eller `uhorte`. Velg ett tema.
2. Kall `still_sporsmal` med samme `fagId`. Still **ett** spørsmål i chatten, ikke en liste.
3. Krev at svaret skiller begrepet fra nabobegrepet.
4. Når høringen er ferdig, kall `logg_horing` med `fagId`, karakter 1–6, hva som satt, hva som manglet for 6, og proveniens: modell, innsats og `promptId` `horing-svake-temaer`.
5. Ikke overskriv gamle høringer. Ikke logg uten proveniens. Ikke ta med temaer fra et annet fag.
