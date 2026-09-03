# Øvingsapp for markedsføring og ledelse

Lokal app for å se hvor du står per tema, hvilke fagbegreper som glipper, og hvilke kompetansemål som faktisk er dekket gjennom muntlige høringer. Alt kan leses og oppdateres av både deg og Claude.

Kompetansemål og temaer er to forskjellige ting. Ett mål dekkes av flere temaer, og ett tema treffer flere mål. Dekningsgrad på et mål er avledet fra siste karakter per tema, ikke noe du huker av manuelt.

## Kjøre lokalt

```bash
npm install
npm run dev
```

Åpner på [http://127.0.0.1:43147](http://127.0.0.1:43147). Bygg med `npm run build`.

Ingen backend, ingen innlogging. Dataene ligger i `src/data/` og i nettleseren.

## Slik er dataene bygget

| Fil | Innhold |
|---|---|
| `src/data/fag.json` | Markedsføring og ledelse 1 og 2 (MFL01-04) |
| `src/data/kompetansemaal.json` | 14 + 13 mål. `kortnavn` for navigasjon, `tekst` er Udir-ordlyden |
| `src/data/temaer.json` | Temaer med `maalIds` (mange til mange). Nå: kapittelet markedsundersøkelser |
| `src/data/horinger.json` | Append-only. Karakteren på et tema er den siste høringen |
| `src/data/fagord.json` | Begrep, skillet mot nabobegrepet, status |

JSON-filene er utgangspunktet. Egne endringer (nye høringer, fagordstatus, innstillinger) lagres i `localStorage` under `mfl:state:v1` og merges på `id`. Oppdaterer du innholdsfilene i repoet, forsvinner ikke det du har gjort i nettleseren.

## Import og eksport

**Eksporter** laster ned hele den mergete tilstanden som JSON. Det er denne filen du limer til Claude etter en høring.

**Importer** leser en slik fil inn igjen. Samme format som Claude gir tilbake. Importen blir overlay i nettleseren; JSON-filene i prosjektet forblir kilden for nye id-er.

Høringer kan ikke endres eller slettes i appen, bare legges til.

## Avledet dekning

```
maalDekning(maalId) =
  temaer koblet til målet
  → snitt av siste karakter per hørte tema
  → udekket (ingen høringer) | svak (< 4) | ok (4 til 5) | sterk (>= 5)
```

Fargestripen på oversikten er ett segment per tema bak målet.

## Legge til mer innhold

Kapittelet du jobber med nå er markedsundersøkelser. Resten av fagets temaer kan du legge inn i `temaer.json` etter hvert. Strukturen tåler det uten endringer. Bytt aktivt fag i headeren; MFL2 har mål, men ingen temaer ennå.
