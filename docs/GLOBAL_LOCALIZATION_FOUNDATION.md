# Global ingestion and localization foundation

## Goal

WTF Engine should discover playable stories from local sources around the world without multiplying
AI cost by source language or by player count.

The core rule is:

> ingest once in the original language, select once, localize only publishable game content, cache forever by version.

## Canonical discovery layer

Each `ArticleCandidate` keeps:

- source URL and source name;
- title and summary in the publisher's original language;
- `language` tag;
- source/edition geography in `country`;
- discovery source and category hint;
- media-rights status.

Do not machine-translate every RSS item before Scout. Most candidates are rejected, so translating the
raw firehose would pay for content the player never sees.

Luna Scout is explicitly instructed to evaluate supplied material directly in its original language.
A non-English candidate must not receive a lower score merely because it is non-English.

## Canonical game-card layer

For the current beta, Luna Editor still generates one player-facing canonical card using the configured
editor language (Italian by default, English when explicitly selected).

The next localization block should happen only after a draft has passed editorial validation and is
eligible for publication.

Recommended future persistence shape:

`game_card_localizations`

- `card_id`
- `locale`
- `hook`
- `question`
- `options_json`
- `reveal`
- `source_content_hash`
- `translator_model`
- `translator_prompt_version`
- `translated_at`
- unique `(card_id, locale, source_content_hash)`

This keeps translation immutable for the exact source card version and makes retranslation explicit
when the canonical copy changes.

## Translation workflow

1. Discover source content in its original language.
2. Deterministic filtering, dedupe and diversity.
3. Multilingual Scout on the original text.
4. Editor creates the canonical playable card.
5. Only cards selected for publication enter localization.
6. Generate each requested locale once.
7. Store translations and serve them without runtime LLM calls.
8. If a locale is missing, serve the canonical fallback and enqueue/generate the localization according
   to the chosen release policy.

No translation should run when a player opens a card.

## Cost consequence

AI cost scales mainly with:

- number of candidate stories submitted to Scout;
- number of publishable cards sent to Editor;
- number of published cards times enabled locales.

It does **not** scale linearly with player count because players consume persisted localized cards.

For an early beta, enable only the locales being actively tested. Expanding from Italian/English to
Spanish, French, Portuguese, Indonesian, Japanese, Korean and others can be a content-generation
operation, not an app rewrite.

## Quality rules

- Preserve names, numbers, dates, units and option semantics exactly.
- Keep resolution rules semantically identical across locales.
- Never translate or alter source URLs.
- Store the source language separately from the player locale.
- Translation must not add facts or explanatory context absent from the canonical card.
- PREDICT options must remain mutually exclusive after translation.
- TRUE_FALSE option ordering must remain stable.
- Re-run structural validation after localization.
- Third-party article text and media rights remain independent from translation rights.

## Geographic discovery

The source pack is intentionally multilingual and regional, but `country` currently represents the
source/edition geography, not necessarily the event location described by the article.

That is sufficient for pre-AI source diversity. A later extraction stage may add a separate
`event_country` / `event_location` field when maps and geographic gameplay need actual story location.
