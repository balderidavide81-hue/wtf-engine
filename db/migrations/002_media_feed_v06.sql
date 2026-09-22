-- WTF Engine v0.6 media/feed foundation.
-- Source-only migration. Prepare and validate before applying to production.

create extension if not exists pg_trgm;

alter table articles add column if not exists image_url_original text;
alter table articles add column if not exists image_url_cached text;
alter table articles add column if not exists image_alt_text text;
alter table articles add column if not exists image_usage_status text not null default 'unreviewed';
alter table articles add column if not exists discovery_source text;
alter table articles add column if not exists category_hint text;

alter table game_cards add column if not exists interaction_type text not null default 'MULTIPLE_CHOICE';
alter table game_cards add column if not exists category text not null default 'other';
alter table game_cards add column if not exists published_at timestamptz;

-- Drop/re-add named checks so the migration remains idempotent and can be
-- executed by migration runners that split SQL on statement boundaries.
alter table articles drop constraint if exists articles_image_usage_status_ck;
alter table articles add constraint articles_image_usage_status_ck
  check (image_usage_status in ('unreviewed','link-only','remote-display','cache-allowed','owned'));

alter table game_cards drop constraint if exists game_cards_interaction_type_ck;
alter table game_cards add constraint game_cards_interaction_type_ck
  check (interaction_type in ('MULTIPLE_CHOICE','TRUE_FALSE','PREDICT'));

alter table game_cards drop constraint if exists game_cards_category_ck;
alter table game_cards add constraint game_cards_category_ck
  check (category in (
    'animals','records','sports','film-tv','music','culture','work','science','space',
    'technology','transport','food','travel','internet','history-archaeology','people','other'
  ));

alter table game_cards drop constraint if exists game_cards_predict_interaction_ck;
alter table game_cards add constraint game_cards_predict_interaction_ck
  check (
    (mode='PREDICT' and interaction_type='PREDICT')
    or (mode<>'PREDICT' and interaction_type<>'PREDICT')
  );

create index if not exists articles_title_trgm_idx
  on articles using gin (lower(title) gin_trgm_ops);

create index if not exists game_cards_published_at_idx
  on game_cards (published_at desc)
  where published_at is not null;

update game_cards gc
   set published_at=de.published_at
  from daily_edition_cards dec
  join daily_editions de on de.id=dec.edition_id
 where dec.card_id=gc.id
   and de.status='published'
   and de.published_at is not null
   and gc.published_at is null;
