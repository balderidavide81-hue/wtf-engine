# Seven-day Content Gate — v0.6.25

Status: read-only. No schema changes and no database writes.

## Goal

WTF Engine needs evidence across multiple consecutive days before client work is treated as the next
priority. This gate turns the original seven-day requirement into a repeatable read-only report.

The report is intentionally split from PR #56 telemetry:

- v0.6.25 measures whether each stored edition is present, structurally valid and large enough;
- PR #56 will later measure how much human editing/rejection work was required.

## Endpoint

Authenticated:

`GET /api/editorial-gate?through=YYYY-MM-DD&days=7&minActive=5`

Parameters:

- `through`: final day of the window; defaults to the current Europe/Rome edition date;
- `days`: 1-14, default 7;
- `minActive`: minimum non-rejected cards per day, 1-30, default 5.

The endpoint uses the existing `EDITORIAL_API_TOKEN` and existing read-only ContentStore methods.

## Structural day pass

A day passes the deterministic structural gate when:

1. an edition exists for the requested date;
2. its deterministic editorial audit has zero blocking errors;
3. it has at least `minActive` non-rejected cards.

Warnings do not fail the day.

## Seven-day pass

`gatePass=true` only when every requested date exists and every day passes the structural day gate.

The response also exposes:

- missing dates;
- edition status per day;
- total and active card counts;
- structural PASS-day count;
- minimum-volume PASS-day count;
- aggregated errors and warnings;
- aggregated game-mode and interaction-type distributions.

## Important limitation

This is not a claim that the content is funny, surprising or commercially good.

`humanEditorialReviewRequired=true` is always returned. The final Content Gate still requires human
review of whether the cards are genuinely playable and worth shipping. The automatic gate only removes
ambiguity around continuity, structural validity and minimum daily volume.

## Editorial console

The internal `/editorial/` console exposes an explicit **Gate 7 giorni** button.

It does not auto-load the range report when an edition is opened, avoiding unnecessary database reads.
The selected edition date becomes the `through` date for the seven-day window.
