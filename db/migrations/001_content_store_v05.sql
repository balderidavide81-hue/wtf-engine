-- WTF Engine v0.5 content store foundation.
-- Source-only migration: do not apply automatically.

create extension if not exists pgcrypto;

create table if not exists sources (
  id uuid primary key default gen_random_uuid(),
  source_key text not null unique,
  name text not null,
  feed_url text,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists articles (
  id uuid primary key default gen_random_uuid(),
  external_id text not null unique,
  source_id uuid references sources(id),
  source_name text not null,
  source_url text not null,
  canonical_url text not null,
  title text not null,
  summary text,
  published_at timestamptz,
  language text,
  country text,
  content_hash text,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  unique (canonical_url)
);
create index if not exists articles_published_at_idx on articles (published_at desc);

create table if not exists pipeline_runs (
  id uuid primary key default gen_random_uuid(),
  run_kind text not null default 'daily',
  status text not null check (status in ('running','completed','failed')),
  prompt_versions jsonb not null default '{}'::jsonb,
  model_versions jsonb not null default '{}'::jsonb,
  diagnostics jsonb not null default '{}'::jsonb,
  estimated_cost_usd numeric(12,8) not null default 0 check (estimated_cost_usd >= 0),
  started_at timestamptz not null default now(),
  completed_at timestamptz
);

create table if not exists scout_results (
  id uuid primary key default gen_random_uuid(),
  article_id uuid not null references articles(id) on delete cascade,
  run_id uuid references pipeline_runs(id) on delete set null,
  prompt_version text not null,
  model text not null,
  decision text not null check (decision in ('KEEP','MAYBE','REJECT')),
  modes jsonb not null,
  scores jsonb not null,
  reason text not null,
  evidence_status text not null check (evidence_status in ('SUPPORTED','UNCERTAIN','UNSUPPORTED')),
  raw_output jsonb,
  created_at timestamptz not null default now()
);
create index if not exists scout_results_article_created_idx on scout_results(article_id, created_at desc);
create unique index if not exists scout_results_article_prompt_uq on scout_results(article_id, prompt_version);

create table if not exists game_cards (
  id uuid primary key default gen_random_uuid(),
  article_id uuid not null references articles(id) on delete cascade,
  scout_result_id uuid references scout_results(id) on delete set null,
  run_id uuid references pipeline_runs(id) on delete set null,
  prompt_version text not null,
  model text not null,
  mode text not null check (mode in ('WTF','PREDICT','STORY')),
  hook text not null,
  question text not null,
  options jsonb not null,
  correct_option_index integer,
  reveal text not null,
  resolution_rule text,
  lifecycle_status text not null default 'draft'
    check (lifecycle_status in ('draft','reviewed','published','open','resolved','void','rejected')),
  resolution jsonb,
  constraint game_cards_options_array_ck
    check (jsonb_typeof(options) = 'array' and jsonb_array_length(options) >= 2),
  constraint game_cards_answer_index_ck
    check (
      correct_option_index is null
      or (correct_option_index >= 0 and correct_option_index < jsonb_array_length(options))
    ),
  constraint game_cards_wtf_answer_ck
    check (mode <> 'WTF' or correct_option_index is not null),
  constraint game_cards_predict_rule_ck
    check (mode <> 'PREDICT' or (resolution_rule is not null and btrim(resolution_rule) <> '')),
  constraint game_cards_predict_unresolved_ck
    check (mode <> 'PREDICT' or lifecycle_status = 'resolved' or correct_option_index is null),
  constraint game_cards_predict_resolved_answer_ck
    check (mode <> 'PREDICT' or lifecycle_status <> 'resolved' or correct_option_index is not null),
  constraint game_cards_predict_lifecycle_ck
    check (
      lifecycle_status not in ('open','resolved','void')
      or mode = 'PREDICT'
    ),
  constraint game_cards_predict_not_plain_published_ck
    check (mode <> 'PREDICT' or lifecycle_status <> 'published'),
  constraint game_cards_resolution_payload_ck
    check (lifecycle_status not in ('resolved','void') or resolution is not null),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists game_cards_status_created_idx on game_cards(lifecycle_status, created_at desc);
create unique index if not exists game_cards_article_prompt_uq on game_cards(article_id, prompt_version);

create table if not exists daily_editions (
  id uuid primary key default gen_random_uuid(),
  edition_date date not null unique,
  status text not null default 'draft' check (status in ('draft','reviewed','published')),
  title text,
  created_at timestamptz not null default now(),
  published_at timestamptz
);

create table if not exists daily_edition_cards (
  edition_id uuid not null references daily_editions(id) on delete cascade,
  card_id uuid not null references game_cards(id) on delete cascade,
  position integer not null check (position >= 0),
  primary key (edition_id, card_id),
  unique (edition_id, position)
);
