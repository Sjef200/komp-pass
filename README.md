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

## Tilgang

Serveren lytter bare på `127.0.0.1`. Ingen andre på nettverket kommer til, og det er med vilje: databasen inneholder karakterene dine, hva du svarte feil, og hvilke modeller som har hørt deg.

`/api/*` svarer bare på kall fra appen selv. En nettside på et annet domene får `403`, og svaret har ingen `Access-Control-Allow-Origin` — uten den sperren kunne en vilkårlig side du besøkte poste hendelser inn i databasen mens `npm run dev` sto på. `/skills`, `/plugin.json` og skill-filene er fortsatt åpne; de er ment å hentes utenfra, og ligger i git uansett.

Vil du bruke appen fra telefonen på samme nett:

```bash
npm run dev -- --host
```

Da er den tilgjengelig for alle på nettverket, uten passord. Gjør det bare på et nett du stoler på, og ikke la den stå på. Skal den nås fra noe annet enn din egen maskin på fast basis, trenger den ekte autentisering — det finnes ikke i dag.

## Databasen

Læringsdataene ligger i SQLite utenfor repoet, som standard `~/mfl-data/mfl.db`. Sett `MFL_DB` for en annen sti. Både UI og MCP åpner samme fil i WAL-modus — det er ingen ekstra server mellom dem, og det er derfor de endelig ser de samme dataene.

Første gang flytter du innholdet fra JSON-lagene inn:

```bash
npm run migrer
```

Har du data i nettleseren fra før, trykk **Eksporter** først og ta filen med:

```bash
npm run migrer -- ~/Downloads/mfl-tilstand-2026-09-07.json
```

Migreringen er append-only på id og kan kjøres om igjen uten skade. UI-en skriver gjennom `/api/hendelser` i utviklingsserveren; uten `npm run dev` kan den ikke lagre, og sier fra.

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

## Forelesninger og bokstoff

Opptak og transkripsjoner ligger under `~/mfl-data/` (sett `MFL_DATA` for en annen sti). **De skal ikke i git.** Et opptak er lærerens stemme; den blir på maskinen, og whisper kjører lokalt.

```bash
npm run transkriber -- --sjekk                 # er whisper på plass?
npm run transkriber -- ~/mfl-data/opptak/uke36.m4a --fag male1 --tittel "Uke 36: utvalg"
```

Har du transkriptet fra før, eller vil legge inn bokstoff:

```bash
npm run indekser -- ~/mfl-data/transkript/uke36.json --fag male1 --tittel "Uke 36"
npm run indekser -- ~/notater/kap3.md --fag male1 --type bok --kapittel "Markedsundersøkelser"
```

`.json` leses som whisper-transkript, `.vtt` og `.srt` som undertekster, alt annet som løpende tekst. Forelesninger deles i biter på rundt ett minutt som bryter i en naturlig pause; bokstoff deles på avsnitt, og linjer som bare sier `s. 42` gir sidetall. Hver bit får tidsstempel eller side, så Claude kan sitere læreren og du kan slå det opp i opptaket.

Fant ikke skriptet whisper? `brew install whisper-cpp` og last ned en modell til `~/mfl-data/modeller/`. `npm run transkriber -- --sjekk` sier hva som mangler.

### Koblinger

`finn_belegg` svarer på hva i forelesningene og boka som dekker et kompetansemål. Fordi Udirs ordlyd er abstrakt og læreren sier «survey» og «kontrollgruppe», søker den på temanavnene og fagordene som hører til målet, ikke på målteksten alene.

Claude kan foreslå at en bit dekker et tema med `foresla_kobling`. **Et forslag er ikke dekning.** Det står som foreslått til du bekrefter det under fanen Kilder. Foreslått, bekreftet og avvist er tre tilstander, og de slås aldri sammen.

Et tomt svar fra `finn_belegg` er ikke en feil. Det er gapet: målet er ikke undervist, eller forelesningen er ikke lagt inn ennå.

## Læringsløpet

Tre uavhengige spørsmål per tema og per kompetansemål:

- **Undervist** — har det vært gjennomgått? (finnes en bekreftet kobling til en kilde)
- **Hørt** — har du vist det? (finnes høringer)
- **Behersket** — sitter det? (karakter og modenhet)

Avstanden mellom det første og det andre er tallet som ellers ikke finnes noe sted: **gjennomgått, men aldri hørt**. Det er der karakterer forsvinner uten at noen merker det.

Tallet regnes både per tema og per kompetansemål, og **temanivået er det du handler på**. Et kompetansemål henger ofte på et helt kapittel, så gapet på målnivå lukkes så snart ett av kapittelets temaer er hørt. Bare en kobling direkte til temaet gjør temaet undervist; en kobling på målnivå sier ingenting om hvilket tema som faktisk ble gjennomgått.

Fanen Læringsløp viser tidslinjen over hva som er gjennomgått når, og hvor mange høringer som kom etterpå. `hent_laringslop` gir Claude det samme, slik at den kan si «dette ble gjennomgått 2. september, du er aldri hørt i det».

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

### Lære med Claude

Flyten er:

1. **Lim inn fagstoffet i chatten** — et bokkapittel, notater fra timen, en oppgavetekst. Claude kaller `legg_inn_kilde`, som deler det i biter og gjør det søkbart.
2. **Claude foreslår koblinger** til temaene stoffet dekker. Du bekrefter dem under fanen Kilder. Først da teller de som dekning.
3. **Claude hører deg** — ett spørsmål om gangen, med lærerens eller bokas egne ord som grunnlag.
4. **Høringen logges** med karakter, spørsmål, svar og hvilken modell som hørte deg.
5. **Spør «hvor mye kan jeg?»** — Claude henter snitt, temaer hørt, fagord som glipper, og gapet mellom gjennomgått og hørt.

Ikke bruk `console.log` i MCP-serveren — stdout er JSON-RPC.

### Verktøy

Lesing: `list_fag`, `hent_lareplan`, `list_kapitler`, `hent_oversikt`, `list_temaer`, `list_fagord`, `list_horinger`, `neste_horing`, `still_sporsmal`, `list_skills`, `hent_skill`, `hent_skill_reference`, `list_prompts`, `hent_prompt`.

Kilder: `list_kilder`, `sok_kilder`, `hent_kilde`, `finn_belegg`, `list_koblinger`, `hent_laringslop`. Skriving: `foresla_kobling`.

Skriving: `logg_horing` og `oppdater_fagord` krever `fagId`, modell, innsats (`lav` | `medium` | `hoy` | `maks`) og `promptId`. `logg_horing` krever i tillegg `sporsmal` og `svar` — karakteren skal ha beviset med seg. Tema og fagord må tilhøre faget. Høringer er append-only.

Kilder inn: `legg_inn_kilde` for stoff limt inn i chatten. Import: `importer_prompt` med plattform-URL.

### Resources

Claude kan lese skills uten å lime dem inn i chatten:

- `mfl://skills/markedsforingslaering`
- `mfl://skills/markedsforingslaering/references/markedsundersokelser`
- `mfl://skills/{skillId}` og `mfl://skills/{skillId}/references/{referenceId}`
- `mfl://kilder/{kildeId}` — hele forelesningen som markdown med tidsstempler

## Plugin

Skillene og MCP-serveren er også pakket som en Claude Code-plugin, bygget fra `src/data/skills` så det bare er én kilde å vedlikeholde:

```bash
npm run bygg:plugin
claude plugin marketplace add .
claude plugin install mfl@komp-pass
```

Pluginen gir åtte skills, én MCP-server og fire kommandoer:

| Kommando | Gjør |
|---|---|
| `/mfl:nytt-stoff` | Lim inn fagstoff, få det lagret og koblet, bli hørt i det |
| `/mfl:hor-meg` | Høring, ett spørsmål om gangen, med karakter og begrunnelse |
| `/mfl:score` | Snitt, dekning og gapet mellom gjennomgått og hørt |
| `/mfl:fag` | Bytt fag, eller se hvilke som finnes |

`plugin/commands/` er håndskrevet. Alt annet under `plugin/` genereres på nytt av `npm run bygg:plugin`. Stiene i `plugin/.mcp.json` er absolutte — flytter du repoet, kjør skriptet igjen.

Serveren er den samme lokale stdio-serveren mot din egen SQLite. Pluginen sender ingenting ut av maskinen.

Installerer du fra git, klon og kjør `npm install` i klonen først — MCP-serveren trenger `tsx` og `zod`. Stiene i `.mcp.json` bruker `${CLAUDE_PLUGIN_ROOT}`, så de virker uansett hvor repoet ligger.

**Ingen karakterer i repoet.** Høringer, fagord-observasjoner og kilder ligger bare i din egen `~/mfl-data/mfl.db`. `horinger.json` og `ai-overlay.json` er tomme med vilje — de er igjen som format, ikke som data.

## Skills

Skills ligger på **denne plattformen**. Samme mønster som Claude: du gir URL-en, så hentes `/skills`.

- Katalog: `http://127.0.0.1:43147/skills`
- En skill: `http://127.0.0.1:43147/skills/velg-fag-forst/SKILL.md`
- Referanse: `http://127.0.0.1:43147/skills/markedsforingslaering/references/markedsundersokelser.md`
- Plugin-manifest: `http://127.0.0.1:43147/plugin.json`

Plattform-skills (alle fag): `velg-fag-forst`, `kompetansemaal-mot-kapittel`, `nytt-fagstoff`, `lareplanstyrt-horing`, `muntlig-horing`, `logg-etter-horing`, `fagbytte`.

Fagskill: `markedsforingslaering` (MFL1 og MFL2) med referansene karakterkjennetegn, markedsføringsfaget og markedsundersøkelser. Last opp en `.skill`-zip i fanen Prompter. Scripts og annen kode i pakken ignoreres.

Claude skal starte med fagvalg. Deretter læreplanstyrt høring, ett spørsmål om gangen, og logging med proveniens.

## Slik er dataene bygget

| Fil | Innhold |
|---|---|
| `src/data/fag.json` | Seks fag med fagkode, læreplan og Udir-lenke |
| `src/data/kompetansemaal.json` | 73 mål. `kortnavn` for navigasjon, `tekst` er Udir-ordlyden |
| `src/data/udir-meta.json` | Cachestatus, hentetidspunkt og kompetansemålsett |
| `src/data/temaer.json` | Temaer med `maalIds` (mange til mange) |
| `src/data/horinger.json` | Tom. Høringer ligger i databasen, ikke i repoet |
| `src/data/fagord.json` | Begrep og skillet mot nabobegrepet |
| `src/data/ai-overlay.json` | Tomt. Gammelt KI-lag, migrert inn i databasen |
| `src/data/skills/` | Plattform- og fagskills med referanser |
| `src/data/prompts/` | Eldre prompter som fremdeles kan brukes som `promptId` |

JSON-filene er utgangspunktet: læreplan, temaer og begrepsdefinisjoner. Alt som skjer — høringer og fagord-observasjoner — ligger i databasen. `localStorage` holder bare preferansene (`mfl:innstillinger:v1`): aktivt fag og emoji.

`src/data/ai-overlay.json` er nå historikk. Den leses av migreringen og fungerer som utgangspunkt i en produksjonsbygg uten server, men ingenting skrives dit lenger.

## Hendelseslogg

Fagordstatus settes ikke ved å skrive over raden, men ved å legge til en **observasjon** i `hendelse`-tabellen. Både UI og MCP skriver samme form. Nåtilstanden er et fold over loggen: siste observasjon bestemmer status, men alle ligger igjen.

Det er hele poenget. Et begrep du har blandet tre ganger trenger et nytt skille, ikke en ny definisjon — og det ser du bare hvis feilene står igjen. `list_fagord` returnerer `antallObservasjoner` og de tre siste; fagordkortet i UI viser historikken.

Foldet sorterer på `tid`, med databasens `seq` som tiebreak, så resultatet er det samme uansett hvilken rekkefølge hendelsene kom inn i.

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

Status kommer fra karakteren alene. Tiden er et eget tall: et tema er **modent**
når det har stått lengre enn karakteren holder — 2 dager for en ener, 30 for en
sekser. «Sterk, ikke hørt på 42 dager» er riktigere enn å nedgradere i stillhet.
Modne segmenter vises dempet i dekningsstripa.

`neste_horing` sorterer etter det samme: uhørt først, så svakt og modent. To
temaer fra samme kapittel kommer aldri rett etter hverandre.

## Legge til mer innhold

Kapittelet som ligger inne nå i MFL1 er markedsundersøkelser. Resten av fagenes temaer kan du legge inn i `temaer.json` etter hvert. Bytt aktivt fag i headeren; de andre fagene har mål, men få eller ingen temaer ennå.
