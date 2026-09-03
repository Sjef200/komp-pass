# Øvingsapp for markedsføring og ledelse

Lokal app for å se hvor du står per tema, hvilke fagbegreper som glipper, og hvilke kompetansemål som faktisk er dekket gjennom muntlige høringer. Alt kan leses og oppdateres av både deg og KI via MCP.

Kompetansemål og temaer er to forskjellige ting. Ett mål dekkes av flere temaer, og ett tema treffer flere mål. Dekningsgrad på et mål er avledet fra siste karakter per tema, ikke noe du huker av manuelt.

## Kjøre lokalt

```bash
npm install
npm run dev
```

Åpner på [http://127.0.0.1:43147](http://127.0.0.1:43147). Bygg med `npm run build`.

Ingen innlogging. Dataene ligger i `src/data/` og i nettleseren.

For at KI-høringer skal dukke opp i UI uten refresh, må **både** `npm run dev` og MCP-serveren kjøre.

## MCP

Lokal stdio-server. Den leser JSON-filene og skriver bare `src/data/ai-overlay.json` (aldri `horinger.json`).

```bash
npm run mcp
```

Test tilkobling med Inspector (åpne URL-en den printer, med token):

```bash
npm run mcp:inspect
```

Cursor (`.cursor/mcp.json` i repo-roten):

```json
{
  "mcpServers": {
    "mfl": {
      "command": "./node_modules/.bin/tsx",
      "args": ["mcp/src/server.ts"]
    }
  }
}
```

`cwd` må være repo-roten. Last MCP på nytt i Cursor etter at avhengighetene er installert.

Verktøy: `hent_oversikt`, `list_temaer`, `list_fagord`, `list_horinger`, `logg_horing`, `oppdater_fagord`, `list_prompts`, `hent_prompt`, `importer_prompt`, `still_sporsmal`.

`logg_horing` og `oppdater_fagord` avvises uten modell, innsats og `promptId`. Da vises raden som `KI · modell · innsats · «prompt»`.

Ikke bruk `console.log` i MCP-serveren — stdout er JSON-RPC.

## Promptbibliotek

Skills ligger på **denne plattformen**, ikke på GitHub. Samme mønster som Claude: du gir bare URL-en, så hentes `/skills` og pluginene.

- Katalog: `http://127.0.0.1:43147/skills`
- En skill: `http://127.0.0.1:43147/skills/horing-svake-temaer/SKILL.md`
- Plugin-manifest: `http://127.0.0.1:43147/plugin.json`

Lim inn plattform-URL-en i fanen **Prompter**, eller kall MCP-verktøyet `importer_prompt` med den. Claude henter SKILL.md-filene derfra.

To medfølgende prompter: `horing-svake-temaer` og `fagord-status`.

## Slik er dataene bygget

| Fil | Innhold |
|---|---|
| `src/data/fag.json` | Markedsføring og ledelse 1 og 2 (MFL01-04) |
| `src/data/kompetansemaal.json` | 14 + 13 mål. `kortnavn` for navigasjon, `tekst` er Udir-ordlyden |
| `src/data/temaer.json` | Temaer med `maalIds` (mange til mange) |
| `src/data/horinger.json` | Seed-høringer. Append-only |
| `src/data/fagord.json` | Begrep og skillet mot nabobegrepet |
| `src/data/ai-overlay.json` | KI-høringer og fagord-patcher fra MCP |
| `src/data/prompts/` | Promptkatalog |

JSON-filene er utgangspunktet. Egne endringer i UI lagres i `localStorage` under `mfl:state:v1`. MCP-endringer ligger i `ai-overlay.json`. De tre lagene merges på `id`: høringer er union (første skriving vinner), fagord fra overlay vinner over nettleseren.

## Import og eksport

**Eksporter** laster ned hele den mergete tilstanden, inkludert prompter og KI-proveniens.

**Importer** leser en slik fil inn i nettleseren. Uten Vite-dev vises nye overlay-rader etter refresh.

## Avledet dekning

```
maalDekning(maalId) =
  temaer koblet til målet
  → snitt av siste karakter per hørte tema
  → udekket (ingen høringer) | svak (< 4) | ok (4 til 5) | sterk (>= 5)
```

## Legge til mer innhold

Kapittelet du jobber med nå er markedsundersøkelser. Resten av fagets temaer kan du legge inn i `temaer.json` etter hvert. Bytt aktivt fag i headeren; MFL2 har mål, men ingen temaer ennå.
