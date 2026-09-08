# Plan: overalt, hele tiden

## Målet

Systemet skal virke fra claude.ai i nettleseren, fra telefonen, fra Claude Desktop og fra Claude Code — også når Macen er av. I dag virker det bare på maskinen: stdio-server, SQLite på disk, dev-server bundet til loopback.

Claude på web støtter ikke lokale stdio-servere. Custom connectors må nås over internett fra Anthropics IP-områder. Derfor må tre ting flyttes: dataene, transporten og innloggingen.

## Det som gjør dette gjennomførbart

**Hendelsesloggen.** Hendelser er append-only med unike id-er, så synk mellom lokal base og sky er en union på id — ikke en konfliktløsning. Det er derfor dette er overkommelig her og ikke i de fleste apper.

**Koden er allerede delt riktig.** 1127 linjer ren logikk i `src/lib` er plattformuavhengig og testet. `mcp/src/tools.ts` er transportfri. Bare `mcp/src/db.ts` — 351 linjer, 19 spørringer — er SQLite-spesifikk.

**MCP-SDK-en har allerede det som trengs.** `@modelcontextprotocol/server` 2.0.0 eksporterer `WebStandardStreamableHTTPServerTransport`, `createMcpHandler`, `requireBearerAuth`, `verifyBearerToken` og `buildOAuthProtectedResourceMetadata`. Ingen bytte av rammeverk, ingen egenskrevet autentisering.

## Prinsipper

- **Lokal modus skal overleve.** SQLite blir ikke kastet. Samme grensesnitt, to implementasjoner. Pluginen virker fortsatt for andre uten konto, og du kan jobbe offline.
- **Lyd forlater aldri maskinen.** Whisper kjører lokalt. Bare transkriptet lastes opp.
- **RLS er ikke pynt.** Straks karakterene ligger bak en offentlig URL, er rad-sikkerheten det eneste som holder dem dine.

---

## Del A1 — Skjema i Supabase ✅ klart til å kjøres

`supabase/migrations/0001_mfl_skjema.sql` er skrevet og de kritiske delene er verifisert mot en levende Postgres 17.

Tre tabeller — `hendelse`, `kilde`, `kilde_chunk` — som speiler SQLite-skjemaet, med tre forskjeller:

- **snake_case**, fordi Postgres folder ubeskyttede navn til små bokstaver. Adapteret mapper.
- **`bruker`-kolonne med RLS** på hver rad, så flere kontoer kan dele basen.
- **`tsvector` med norsk stemming** i stedet for FTS5. `validitet` → `validit`, `reliabilitet` → `reliabilit`, og fyllord faller bort uten stoppordliste.

En trigger avviser `update` og `delete` på `hendelse`, så append-only håndheves i databasen og ikke bare i koden.

**Verifisert mot Postgres 17:** `to_tsvector(regconfig, text)` er immutable, så den genererte kolonnen er lovlig. `websearch_to_tsquery('norwegian', 'validitet reliabilitet')` gir `'validit' & 'reliabilit'`. `ts_headline` lager samme «…»-utdrag som FTS5.

**Gjenstår:** kjøre den. Supabase-MCP-en her ser ikke prosjektet `fttxneqwowavmxzcscnv`, så den limes inn i SQL Editor.

---

## Del A2 — Postgres bak samme grensesnitt ✅ gjort

`mcp/src/db-postgres.ts` implementerer samme signaturer som `db.ts`: `lesHendelser`, `skrivHendelse`, `skrivHendelser`, `sisteSeq`, `lesKilder`, `lesKilde`, `lesChunks`, `lesChunk`, `skrivKilde`, `slettKilde`, `sokChunks`.

`db.ts` blir en dispatcher: `SUPABASE_URL` satt → Postgres, ellers SQLite. Ingenting i `tools.ts` endres.

To ting å passe på:

- **`sokChunks`** går fra FTS5 til `sok_chunks()`-funksjonen i migreringen. `websearch_to_tsquery` bruker AND, mens `ftsUttrykk` i dag bruker OR. For `finn_belegg`, som søker med mange ord fra temanavn og fagord, blir AND for strengt — der trengs OR-semantikk.
- **`sokeord()`** i `src/lib/kilder.ts` kan forenkles for Postgres-veien; stemmingen gjør stoppordlista overflødig.

**Gjort.** `db.ts` er en asynkron fasade, `db-sqlite.ts` er den gamle implementasjonen, `db-postgres.ts` er ny. Datalaget måtte bli asynkront — `node:sqlite` er synkron, Supabase er over nettet — og det løftet rippet gjennom `fs-state.ts`, `tools.ts`, `kilde-inntak.ts`, vite-pluginen, skriptene og testene.

Underveis oppdaget jeg at `mcp/` og `scripts/` aldri har vært typesjekket: ingen `tsconfig` inkluderte dem. `tsconfig.mcp.json` er lagt til og referert fra rot-konfigurasjonen.

**Verifisert:** 69/69 tester, 0 typefeil. SQLite-veien gir samme tall som før (4,0 · 8/13 · 14). Postgres-adapteret kobler til, og RLS avviser både lesing og skriving uten innlogging — «new row violates row-level security policy». OR-spørringen bygges som ventet.

**Gjenstår å teste med innlogging:** en full runde skriv/les mot Postgres.

---

## Del A3 — Innlogging for den lokale MCP-serveren ✅ gjort

Serveren må opptre som deg mot Supabase. Publiserbar nøkkel pluss et brukertoken, ikke en secret key — en secret key ville omgått RLS.

**Gjort.** `npm run logg-inn` leser e-post og passord fra din terminal, lagrer bare tokenet i `~/mfl-data/session.json` med rettigheter 600, utenfor repoet. `--ny` oppretter konto, `--ut` glemmer sesjonen, `--hvem` viser hvem du er.

Presedensen i `db.ts` er bevisst: `MFL_DB` satt eksplisitt vinner alltid (det holder testene lokale), så Supabase hvis du er logget inn, ellers SQLite. Nøkler uten innlogging faller tilbake til lokal base med en beskjed — du mister ikke dataene dine av å legge inn en URL.

**Verifisering:** to kontoer mot samme base ser bare sine egne rader.

---

## Del B — HTTP-transport med auth ⏳ halvveis

Dette er delen som gir deg «overalt».

**Gjort: selve transporten.** `mcp/src/http.ts` pakker samme `createServer()` med `createMcpHandler`, verifiserer bearer-tokenet mot Supabase, og eksponerer OAuth-metadataen klienten trenger. `mcp/src/http-server.ts` kjører den lokalt med `npm run mcp:http`.

`server.ts` er delt: `server-def.ts` holder definisjonen med alle 25 verktøyene, `server.ts` er stdio-inngangen. Samme server, to dører.

**Brukerkontekst per forespørsel.** Over stdio er det alltid deg, men en HTTP-server har mange brukere samtidig. `bruker-kontekst.ts` bærer tokenet gjennom `AsyncLocalStorage`, og `db-postgres.ts` har én klient per token. Uten det ville én brukers klient svart på en annens kall, og RLS ville beskyttet feil person.

**Verifisert lokalt:**

```
/helse                          200
/.well-known/oauth-protected-resource
                                peker på Supabase som autorisasjonsserver
uten token                      401 + WWW-Authenticate med resource_metadata
ugyldig token                   401, Supabase avviste signaturen
stdio etter splitten            25 verktøy, uendret
```

Verifikatoren må kaste `OAuthError`, ikke en vanlig `Error` — ellers svarer SDK-en 500 i stedet for 401 med utfordringen klienten trenger for å starte innloggingen. Det tok den første testrunden å oppdage.

**Gjenstår:**

1. **Gyldig token ende til ende.** Krever en innlogget bruker. `npm run logg-inn`, så en runde `tools/list` og `hent_oversikt` mot Postgres.
2. **Deploy til en offentlig HTTPS-URL.** Vercel, Fly eller Supabase Edge Functions. `MFL_HTTP_URL` må være URL-en klienten ser, siden den går inn i metadataen.
3. **OAuth-flyten mot claude.ai.** Connectors støtter OAuth med klient-ID og hemmelighet, ikke statiske tokens. Supabase Auth må enten fungere som autorisasjonsserver, eller så må serveren tilby et minimalt `/authorize` og `/token` som logger inn mot Supabase. Dette er den reelle gjenstående vanskeligheten.

**Verifisering til slutt:** koble til fra claude.ai, kall `hent_oversikt`, se samme tall som lokalt.

---

## Del C — Hostet UI og synk

Uten dette ser du dataene bare gjennom Claude, ikke i appen.

UI-et bygges som i dag, men leser Supabase direkte med `@supabase/supabase-js` og RLS. Da forsvinner `/api/*`-endepunktene i hostet modus; i lokal modus blir de stående.

Synk mellom lokal SQLite og Supabase er unionen fra prinsippene over: hent alt med `seq` høyere enn sist sett, skriv alt som ikke finnes i den andre. Ingen konfliktløsning.

**Verifisering:** logg en høring offline, synk, se den på telefonen.

---

## Rekkefølge og kostnad

A1 → A2 → A3 → B → C. Til sammen omtrent Del 4, 5 og 6 lagt sammen.

**Gjør du bare A og B, har du det du spurte om.** C er det som får det til å føles ferdig.

## Notat om oppsettet

Supabase-hurtigstarten er skrevet for Next.js. Denne appen er Vite, så `@supabase/ssr`, `next/headers`, `NextRequest` og middleware gjelder ikke. `@supabase/supabase-js` alene er riktig her.

`.env.local` er dekket av `*.local` i `.gitignore`. Den publiserbare nøkkelen er ment å være synlig — det er RLS som beskytter radene. En secret key skal aldri i denne fila.
