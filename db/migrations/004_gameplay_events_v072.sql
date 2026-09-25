-- WTF Engine v0.7.2 anonymous gameplay telemetry.
-- SOURCE-ONLY until validated on an isolated Neon branch.
-- No IP address, user agent, account identifier or persistent client identifier is stored.

create table if not exists gameplay_events (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null,
  event_key text not null,
  event_type text not null,
  card_id uuid references game_cards(id) on delete cascade,
  position integer,
  selected_option_index integer,
  correct boolean,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table gameplay_events drop constraint if exists gameplay_events_type_ck;
alter table gameplay_events add constraint gameplay_events_type_ck
  check (event_type in (
    'session_started',
    'card_viewed',
    'card_answered',
    'predict_selected',
    'session_completed'
  ));

alter table gameplay_events drop constraint if exists gameplay_events_scope_ck;
alter table gameplay_events add constraint gameplay_events_scope_ck
  check (
    (
      event_type in ('session_started','session_completed')
      and card_id is null
      and selected_option_index is null
      and correct is null
    )
    or
    (
      event_type='card_viewed'
      and card_id is not null
      and selected_option_index is null
      and correct is null
    )
    or
    (
      event_type='card_answered'
      and card_id is not null
      and selected_option_index is not null
      and selected_option_index >= 0
      and correct is not null
    )
    or
    (
      event_type='predict_selected'
      and card_id is not null
      and selected_option_index is not null
      and selected_option_index >= 0
      and correct is null
    )
  );

alter table gameplay_events drop constraint if exists gameplay_events_position_ck;
alter table gameplay_events add constraint gameplay_events_position_ck
  check (position is null or position >= 0);

create unique index if not exists gameplay_events_session_event_key_uidx
  on gameplay_events (session_id, event_key);

create index if not exists gameplay_events_created_idx
  on gameplay_events (created_at);

create index if not exists gameplay_events_card_type_created_idx
  on gameplay_events (card_id, event_type, created_at)
  where card_id is not null;

create index if not exists gameplay_events_session_created_idx
  on gameplay_events (session_id, created_at);
