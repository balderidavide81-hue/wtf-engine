-- WTF Engine v0.6.24 Content Gate editorial telemetry.
-- SOURCE-ONLY until validated on PostgreSQL 18 / temporary Neon branch.
-- Do not apply to production before the code block is ready to merge.

create table if not exists editorial_events (
  id uuid primary key default gen_random_uuid(),
  edition_id uuid not null references daily_editions(id) on delete cascade,
  card_id uuid references game_cards(id) on delete cascade,
  event_type text not null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table editorial_events drop constraint if exists editorial_events_type_ck;
alter table editorial_events add constraint editorial_events_type_ck
  check (event_type in (
    'card_edited',
    'card_reviewed',
    'card_rejected',
    'edition_reviewed',
    'edition_published'
  ));

alter table editorial_events drop constraint if exists editorial_events_scope_ck;
alter table editorial_events add constraint editorial_events_scope_ck
  check (
    (event_type in ('card_edited','card_reviewed','card_rejected') and card_id is not null)
    or
    (event_type in ('edition_reviewed','edition_published') and card_id is null)
  );

alter table editorial_events drop constraint if exists editorial_events_edition_card_fk;
alter table editorial_events add constraint editorial_events_edition_card_fk
  foreign key (edition_id, card_id)
  references daily_edition_cards (edition_id, card_id)
  on delete cascade;

create index if not exists editorial_events_edition_created_idx
  on editorial_events (edition_id, created_at);

create index if not exists editorial_events_card_created_idx
  on editorial_events (card_id, created_at)
  where card_id is not null;
