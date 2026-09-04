# Øvingsapp for markedsføring, entreprenørskap og norsk

Lokal app for å se hvor du står per tema, hvilke fagbegreper som glipper, og hvilke kompetansemål som faktisk er dekket gjennom muntlige høringer. Alt kan leses og oppdateres av både deg og KI via MCP.

Kompetansemål, kapittel og tema er tre forskjellige ting:

- **Kompetansemål** er Udirs krav. Du huker dem ikke av.
- **Kapittel** er læreverkets inndeling.
- **Tema** er det dere hører. Ett tema treffer ett eller flere mål, og ligger i ett kapittel.

Dekning på et mål er avledet fra siste karakter per tema, ikke fra at kapittelet er «ferdig».

De seks fagene er adskilte kontekster: Markedsføring og ledelse 1 og 2, Entreprenørskap og bedriftsutvikling 1 og 2, Norsk hovedmål og Norsk muntlig. Norsk hovedmål og muntlig kan dele kompetansemålsett fra Udir, men de er likevel to fag. Bland dem ikke i samme høring.

## Kjøre lokalt

```bash
npm install
npm run dev
```

Åpner på [http://127.0.0.1:43147](http://127.0.0.1:43147). Bygg med `npm run build`. Test med `npm test`.

For at KI-høringer skal dukke opp i UI uten refresh, må **både** `npm run dev` og MCP-serveren kjøre.

## Oppdatere fag og kompetansemål fra Udir

Kompetansemålene er hentet fra Udirs Grep-API (NLOD) og ligger cachet i `src/data/`. Appen kaller ikke Udir i nettleseren.

```bash
npm run fetch:udir
```

Skriptet skriver bare `fag.json`, `kompetansemaal.json` og `udir-meta.json`. Det rører ikke høringer, fagord eller `ai-overlay.json`. Lokale mål-id-er (`male1-01`, …) er stabile.

Fra september 2026 kan anonyme REST-kall rate-limites. Da bruker skriptet den lokale cachen og merker status `rate-limited` i `udir-meta.json`. Sett `UDIR_API_KEY` hvis Udir krever nøkkel:

```bash
UDIR_API_KEY=… npm run fetch:udir
```

## MCP

Lokal stdio-server. Den leser JSON-filene og skriver bare `src/data/ai-overlay.json` (aldri `horinger.json`).

```bash
npm run mcp
```

Test tilkobling med Inspector (åpne URL-en den printer, med token):

```bash
npm run mcp:inspect
```

### Cursor

`.cursor/mcp.json` i repo-roten:

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

`cwd` må være repo-roten.

### Claude Desktop

Bruk **absolutte stier** til `tsx` og serverfilen. Bytt ut `REPO` med der du klonet prosjektet:

```json
{
  "mcpServers": {
    "mfl": {
      "command": "REPO/node_modules/.bin/tsx",
      "args": ["REPO/mcp/src/server.ts"],
      "cwd": "REPO"
    }
  }
}
```

Start alltid med `list_fag` og bekreft `fagId` før spørsmål eller høring.

Ikke bruk `console.log` i MCP-serveren — stdout er JSON-RPC.

### Verktøy

Lesing: `list_fag`, `hent_lareplan`, `list_kapitler`, `hent_oversikt`, `list_temaer`, `list_fagord`, `list_horinger`, `still_sporsmal`, `list_skills`, `hent_skill`, `hent_skill_reference`, `list_prompts`, `hent_prompt`.

Skriving: `logg_horing` og `oppdater_fagord` krever `fagId`, modell, innsats (`lav` | `medium` | `hoy` | `maks`) og `promptId`. Tema og fagord må tilhøre faget. Høringer er append-only.

Import: `importer_prompt` med plattform-URL.

### Resources

Claude kan lese skills uten å lime dem inn i chatten:

- `mfl://skills/markedsforingslaering`
- `mfl://skills/markedsforingslaering/references/markedsundersokelser`
- `mfl://skills/{skillId}` og `mfl://skills/{skillId}/references/{referenceId}`

## Skills

Skills ligger på **denne plattformen**. Samme mønster som Claude: du gir URL-en, så hentes `/skills`.

- Katalog: `http://127.0.0.1:43147/skills`
- En skill: `http://127.0.0.1:43147/skills/velg-fag-forst/SKILL.md`
- Referanse: `http://127.0.0.1:43147/skills/markedsforingslaering/references/markedsundersokelser.md`
- Plugin-manifest: `http://127.0.0.1:43147/plugin.json`

Plattform-skills (alle fag): `velg-fag-forst`, `kompetansemaal-mot-kapittel`, `lareplanstyrt-horing`, `muntlig-horing`, `logg-etter-horing`, `fagbytte`.

Fagskill: `markedsforingslaering` (MFL1 og MFL2) med referansene karakterkjennetegn, markedsføringsfaget og markedsundersøkelser. Last opp en `.skill`-zip i fanen Prompter. Scripts og annen kode i pakken ignoreres.

Claude skal starte med fagvalg. Deretter læreplanstyrt høring, ett spørsmål om gangen, og logging med proveniens.

## Slik er dataene bygget

| Fil | Innhold |
|---|---|
| `src/data/fag.json` | Seks fag med fagkode, læreplan og Udir-lenke |
| `src/data/kompetansemaal.json` | 73 mål. `kortnavn` for navigasjon, `tekst` er Udir-ordlyden |
| `src/data/udir-meta.json` | Cachestatus, hentetidspunkt og kompetansemålsett |
| `src/data/temaer.json` | Temaer med `maalIds` (mange til mange) |
| `src/data/horinger.json` | Seed-høringer. Append-only |
| `src/data/fagord.json` | Begrep og skillet mot nabobegrepet |
| `src/data/ai-overlay.json` | KI-høringer og fagord-patcher fra MCP |
| `src/data/skills/` | Plattform- og fagskills med referanser |
| `src/data/prompts/` | Eldre prompter som fremdeles kan brukes som `promptId` |

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

Kapittelet som ligger inne nå i MFL1 er markedsundersøkelser. Resten av fagenes temaer kan du legge inn i `temaer.json` etter hvert. Bytt aktivt fag i headeren; de andre fagene har mål, men få eller ingen temaer ennå.
