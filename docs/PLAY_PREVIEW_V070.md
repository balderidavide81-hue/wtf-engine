# Public Play Preview — v0.7.0

Status: public product preview.

## Purpose

WTF Engine already had a complete production content path, but no public surface that made the concept
feel like a game. v0.7.0 adds a deliberately small mobile-first playable client at:

`/play/`

It consumes only existing public APIs.

## Current gameplay loop

1. Load the latest published feed from `GET /api/feed?limit=30`.
2. Show one card at a time.
3. For MULTIPLE_CHOICE / TRUE_FALSE:
   - submit the selected option to `POST /api/gameplay-answer`;
   - reveal correctness, the correct option and the editorial reveal;
   - expose the original source after answering.
4. For open PREDICT:
   - allow the player to make a session-only selection;
   - do not call the quiz answer endpoint;
   - explicitly state that the outcome is unresolved;
   - show the resolution rule when available.
5. Keep a simple correct/answered score for resolved quiz cards.

## Product decisions in this preview

- mobile-first;
- no framework;
- no login;
- no persistence of player state;
- no analytics;
- no ads;
- no invented fallback cards;
- no exposure of quiz answers before submission;
- PREDICT is visually and behaviorally distinct from quiz content.

The UI uses category-based fallback visuals because most current production cards do not yet carry
approved imagery. When `imageUrl` is present, the client can display it.

## What this preview is for

This is not the final app UI. It exists to answer product questions with a real interaction loop:

- are the hooks strong enough to make the user continue?
- do answer options feel fair and entertaining?
- is the reveal satisfying?
- does mixing WTF / TRUE_FALSE / PREDICT improve pacing?
- how many cards feel repetitive after 5-10 minutes?
- which categories feel strongest?

Those observations should feed back into Scout/Editor quality rules before a larger client investment.
