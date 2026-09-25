# Structured PREDICT Resolution Foundation — v0.6.27

Status: source-only foundation. No database migration, no persistence change and no production resolver.

## Goal

PREDICT must represent a genuinely unresolved future outcome that can later be closed from a named,
authoritative source. A future date alone is not enough.

This foundation separates three concerns:

1. a registry of allowed official resolution source families;
2. a structured event contract;
3. deterministic validation before any future persistence or automation is added.

## Structured event contract

Every structured PREDICT event requires:

- registered `sourceId`;
- external event identity;
- supported game category;
- title and player question;
- 2-4 non-empty unique outcome options;
- opening timestamp;
- closing timestamp;
- earliest resolution timestamp;
- official resolution URL;
- objective resolution rule.

All timestamps must be ISO timestamps with an explicit timezone. Validation requires:

`opensAt < closesAt <= resolvesAfter`

The resolution URL host must belong to the official host allowlist of the registered source.

## Source registry — verified 2026-09-25

### Formula 1 official calendar/results

Status: `manual` / `predict`.

The official 2026 calendar and race-results pages are live and current. Use only unusual or
story-worthy angles. This is not intended to create routine betting inventory.

### Academy Awards

Status: `manual` / `resolution-only`.

The Oscars site and the official Academy Awards Database are live. The database identifies itself as
the official record of past winners and nominees. Use it as an authoritative resolution source once
options are fixed and the future outcome is still unresolved.

### Christie's

Status: `manual` / `resolution-only`.

The official auction calendar and results pages are live. This source is a strong fit when an unusual
object has a genuinely unresolved auction outcome.

### NOAA SWPC

Status: `runtime-check-required` / `predict`.

The registry retains the official SWPC JSON product URLs for K-index forecast/observations and alerts,
but external verification from the current research environment receives HTTP 403. Do not call these
adapters production-ready until a server-side runtime accessibility probe passes.

Forecast information must never be reused as if it were the later observed resolution.

### Guinness World Records

Status: `research` / `resolution-only`.

Strong editorial fit, but keep research/manual-only until access and reuse behavior are explicitly
validated.

### NASA NeoWs

Status: `research` / `guardrail`.

NeoWs is intentionally blocked by the structured PREDICT validator. Many future close-approach values
are already published predictions; presenting those as an unresolved user prediction would be a quiz
disguised as PREDICT.

## What is deliberately NOT in v0.6.27

- no database columns/tables;
- no automated crawler or resolver;
- no notification/subscription storage;
- no change to current generated PREDICT cards;
- no background jobs;
- no OpenAI call;
- no gameplay API change.

The next PREDICT runtime step should happen only after the multi-day Content Gate has enough evidence
or when a specific source adapter is selected for implementation.
