# Anonymous Gameplay Telemetry — v0.7.2

Status: source-only until migration 004 is validated and applied.

## Goal

The Play Preview is now a real product surface, so WTF Engine needs evidence about how it is actually
played. The telemetry is intentionally minimal and anonymous.

Questions this block should answer:

- did anyone start playing?
- how many cards did a session view?
- where did sessions stop?
- which cards were answered?
- which cards were easy or hard?
- which PREDICT options were selected?
- how many sessions reached the end?

## Privacy model

The browser creates a fresh random UUID for each play session.

The backend does **not** intentionally persist:

- IP address;
- user agent;
- account identity;
- email;
- cookies;
- device fingerprint;
- cross-session identifier.

The session UUID is not stored in localStorage, sessionStorage or a cookie. Reloading the page creates a
new session. Restarting the feed also creates a new session.

The Play Preview displays a short disclosure that anonymous per-session telemetry is active.

## Migration 004

`db/migrations/004_gameplay_events_v072.sql` creates `gameplay_events`.

Stored fields are limited to:

- random `session_id`;
- deterministic per-session `event_key`;
- event type;
- optional card ID;
- zero-based card position;
- optional selected option index;
- server-computed correctness for quiz answers;
- small server-whitelisted numeric details;
- server timestamp.

Allowed events:

- `session_started`;
- `card_viewed`;
- `card_answered`;
- `predict_selected`;
- `session_completed`.

`(session_id, event_key)` is unique. This makes client/network retries idempotent.

## Public endpoints

### POST /api/gameplay-event

Records non-answer events.

The browser can submit only a supported event shape. Arbitrary metadata is not accepted.

### POST /api/gameplay-answer

The existing answer endpoint remains the authoritative quiz evaluator.

When an anonymous session ID is supplied, the backend records `card_answered` using the correctness it
computed itself. The browser cannot declare whether an answer was correct.

Existing clients that omit session telemetry remain compatible.

## Editorial metrics

Authenticated:

`GET /api/gameplay-metrics?hours=24`

Allowed window: 1-168 hours.

Returns:

- sessions started/completed;
- completion rate;
- cards viewed;
- unique cards viewed;
- average cards viewed per started session;
- answers and accuracy;
- PREDICT selections;
- per-card views/answers/accuracy/PREDICT selections;
- up to 20 recent anonymous sessions with an 8-character display key.

The editorial console exposes 24h, 72h and 7-day views.

## Failure behavior

Telemetry is best-effort on the player surface.

If `/api/gameplay-event` fails, gameplay continues. Quiz answer telemetry is attached to the real answer
request, but the answer result itself remains authoritative.

## Deployment order

Because the new production code writes `gameplay_events`, do not merge v0.7.2 before the table exists.

Required order:

1. validate migration 004 on an isolated Neon branch for WTF Engine;
2. test valid and invalid event inserts plus idempotency;
3. apply migration 004 to WTF Engine production `main`;
4. verify the production schema is empty and correct;
5. merge the v0.7.2 code;
6. wait for Vercel READY;
7. smoke the public event endpoint and authenticated metrics endpoint;
8. play a fresh session in `/play/`;
9. confirm the session and per-card events appear in the editorial console.

No historical play event will be fabricated. The user's earlier v0.7.0 play session predates this
telemetry and will remain unrecorded.
