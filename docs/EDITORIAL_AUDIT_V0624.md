# Deterministic Editorial Audit — v0.6.24

Status: read-only. No schema change and no production write is required.

## Purpose

The first published edition proved the end-to-end production path. While Neon connector access is
unreliable, WTF Engine can still evaluate edition quality through the application's existing read-only
database connection.

The deterministic audit is deliberately separate from the future Content Gate telemetry in PR #56:

- this audit answers **"is the edition structurally sound now?"**;
- telemetry answers **"how much editorial work did this edition require?"**.

## Endpoint

Authenticated:

`GET /api/editorial-audit?date=YYYY-MM-DD`

Authentication uses the existing `EDITORIAL_API_TOKEN`. The endpoint loads the edition through the
existing `ContentStore`, performs no database writes and returns a deterministic report.

## Checks

Blocking errors:

- existing Editor card validation;
- invalid source URLs;
- duplicate article IDs;
- duplicate source URLs inside the active edition;
- duplicate normalized questions;
- PREDICT answer/lifecycle inconsistencies;
- edition/card lifecycle mismatches after review or publication.

Warnings:

- duplicate normalized hooks;
- answer-position imbalance after editorial rejects;
- one source representing more than 50% of an edition with at least six active cards;
- one category representing more than 60% of an edition with at least six active cards;
- an edition with at least ten active cards but only one game mode.

The report also includes mode, interaction, category and lifecycle distributions, unique source count,
top-source share and answer-index distributions.

## PASS semantics

`pass=true` means the deterministic audit found zero blocking errors. Warnings remain visible and are
not silently promoted to failures.

This is not a subjective quality score. Humor, writing quality and whether a story is genuinely fun
still require editorial judgment.

## Editorial console

The internal `/editorial/` page loads the audit alongside the edition. It displays PASS/FAIL, error
count, warning count, active-card count, source diversity and every issue with its code and optional
card ID.

Failure to load the audit does not block the existing editorial console; it is reported only to the
browser console so the main review path remains usable.
