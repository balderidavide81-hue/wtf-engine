# Manual Daily Operations — v0.6.26

Status: manual-only. No cron and no automatic generation.

## Goal

The seven-day Content Gate needs consecutive persisted editions. The production backend already exposes
a safe authenticated daily-generation endpoint, so the editorial console can operate it directly
without temporary probes, local scripts or Neon connector access.

## Console controls

The internal `/editorial/` console now has a separate `GENERATION_API_TOKEN` field and a
**Genera edizione di oggi** button.

Security and cost rules:

- the generation token stays only in the current page DOM; it is never stored in URL, localStorage or
  sessionStorage;
- generation remains protected by the existing `GENERATION_API_TOKEN` bearer check;
- the console requires an explicit confirmation before every run;
- there is no schedule, cron or background generation;
- the button is disabled while a run is in flight;
- the result reports Scout count, Editor count, new cards, edition size and estimated AI cost.

## Same-day retries

The existing backend behavior remains authoritative:

- if today's edition is `reviewed` or `published`, `/api/daily` rejects the run before collection
  and AI generation;
- if today's edition is still `draft`, another manual run is allowed;
- processed-candidate and known-story dedupe prevent paying again for already processed/known stories;
- a draft retry may still discover and pay for genuinely new candidates and append new cards.

This makes a second run useful only as an intentional draft top-up, not as a normal refresh button.

## After a successful run

If the response contains an edition date, the console selects it automatically. When an editorial token
is also present, the console reloads that edition so its deterministic audit is immediately visible.

The seven-day gate remains a separate on-demand action.
