---
name: logg-etter-horing
description: "Logg høring og oppdater bare relevante fagord, med full KI-proveniens. Bruk straks etter en ferdig muntlig høring. Trigger på 'logg', 'sett karakter', 'ferdig å høre', og når du selv har satt karakter."
---

# Logg etter høring

Bruk `laeringsokt`: `logg_forsok` bevarer originalspørsmål og svar; `vurder_forsok` lagrer begrunnet vurdering og eventuell karakter. Ett forsøk har én ID, også ved retry. Rett vurderinger med en ny revisjon, uten å endre svaret.

Registrer arbeidsmåte og hjelp. Oppgi bare mål som faktisk ble undersøkt, med belegg per mål og tema. Modell, skillId og kriterieversjon må følge vurderingen. Vent med å vise karakter og fasit under eksamen til økten avsluttes.

Les fagordenes historikk og oppdater bare begreper som ble brukt eller blandet, med `oppdater_fagord`. Nye skills bruker ikke dobbeltlogging med logg_oving og logg_horing.
