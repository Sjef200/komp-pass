-- MFL: hendelseslogg, kilder og biter.
--
-- Speiler SQLite-skjemaet i mcp/src/db.ts, med tre forskjeller:
--   * snake_case, siden Postgres folder ubeskyttede navn til små bokstaver
--   * bruker-kolonne på hver rad, med RLS, så flere kontoer kan dele basen
--   * tsvector med norsk stemming i stedet for FTS5
--
-- Kjør i Supabase SQL Editor. Kan kjøres om igjen uten skade.

-- ── Hendelseslogg ──────────────────────────────────────────────────────────
-- Append-only. Nåtilstanden er et fold over loggen, aldri en oppdatering.

create table if not exists public.hendelse (
  seq       bigint generated always as identity primary key,
  bruker    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  id        text not null,
  type      text not null,
  tid       timestamptz not null,
  fag_id    text not null,
  kilde     text not null,
  data      jsonb not null,
  opprettet timestamptz not null default now(),
  unique (bruker, id)
);

create index if not exists hendelse_bruker_tid on public.hendelse (bruker, tid, seq);
create index if not exists hendelse_type on public.hendelse (bruker, type);
create index if not exists hendelse_fag on public.hendelse (bruker, fag_id, tid);

-- Loggen er append-only også i databasen, ikke bare i koden.
create or replace function public.hendelse_er_uforanderlig()
returns trigger language plpgsql as $$
begin
  raise exception 'Hendelser er append-only. Legg til en ny hendelse i stedet.';
end;
$$;

drop trigger if exists hendelse_ingen_endring on public.hendelse;
create trigger hendelse_ingen_endring
  before update or delete on public.hendelse
  for each row execute function public.hendelse_er_uforanderlig();

-- ── Kilder: forelesninger, bok, oppgaver ───────────────────────────────────

create table if not exists public.kilde (
  bruker   uuid not null default auth.uid() references auth.users (id) on delete cascade,
  id       text not null,
  fag_id   text not null,
  type     text not null check (type in ('forelesning', 'bok', 'oppgave', 'notat')),
  tittel   text not null,
  dato     date not null,
  sti      text,
  kapittel text,
  lagt_inn timestamptz not null default now(),
  primary key (bruker, id)
);

create index if not exists kilde_fag on public.kilde (bruker, fag_id, dato desc);

create table if not exists public.kilde_chunk (
  bruker    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  id        text not null,
  kilde_id  text not null,
  ord       integer not null,
  start_sek real,
  slutt_sek real,
  side      integer,
  tekst     text not null,
  -- Norsk stemming: «validitet» og «validiteten» treffer hverandre, og
  -- fyllord faller bort uten at vi må vedlikeholde en stoppordliste.
  sok       tsvector generated always as (to_tsvector('norwegian', tekst)) stored,
  primary key (bruker, id),
  foreign key (bruker, kilde_id) references public.kilde (bruker, id) on delete cascade
);

create index if not exists chunk_kilde on public.kilde_chunk (bruker, kilde_id, ord);
create index if not exists chunk_sok on public.kilde_chunk using gin (sok);

-- ── Rad-sikkerhet ──────────────────────────────────────────────────────────
-- Uten dette ville karakterene dine ligget åpne bak en publiserbar nøkkel.

alter table public.hendelse    enable row level security;
alter table public.kilde       enable row level security;
alter table public.kilde_chunk enable row level security;

drop policy if exists "egne hendelser" on public.hendelse;
create policy "egne hendelser" on public.hendelse
  for all to authenticated
  using (bruker = (select auth.uid()))
  with check (bruker = (select auth.uid()));

drop policy if exists "egne kilder" on public.kilde;
create policy "egne kilder" on public.kilde
  for all to authenticated
  using (bruker = (select auth.uid()))
  with check (bruker = (select auth.uid()));

drop policy if exists "egne biter" on public.kilde_chunk;
create policy "egne biter" on public.kilde_chunk
  for all to authenticated
  using (bruker = (select auth.uid()))
  with check (bruker = (select auth.uid()));

-- ── Søk ────────────────────────────────────────────────────────────────────
-- Erstatter sokChunks i db.ts. RLS gjelder også her, siden funksjonen
-- kjører med kallerens rettigheter (ingen security definer).

create or replace function public.sok_chunks(
  sporring text,
  fag      text default null,
  antall   integer default 8
)
returns table (
  chunk_id  text,
  kilde_id  text,
  ord       integer,
  start_sek real,
  slutt_sek real,
  side      integer,
  tekst     text,
  utdrag    text,
  rang      real
)
language sql stable
set search_path = public
as $$
  select
    c.id, c.kilde_id, c.ord, c.start_sek, c.slutt_sek, c.side, c.tekst,
    ts_headline('norwegian', c.tekst, q, 'StartSel=«, StopSel=», MaxWords=28, MinWords=12'),
    ts_rank(c.sok, q)
  from public.kilde_chunk c
  join public.kilde k on k.bruker = c.bruker and k.id = c.kilde_id
  cross join websearch_to_tsquery('norwegian', sporring) q
  where c.sok @@ q
    and (fag is null or k.fag_id = fag)
  order by ts_rank(c.sok, q) desc
  limit greatest(1, least(antall, 50));
$$;
