# PREDICT Source Runtime Health — v0.6.28

Status: manual, authenticated, read-only.

## Purpose

The source registry deliberately distinguishes between sources that are editorially useful and sources
that are proven reachable from production runtime.

NOAA SWPC is the main example: its official JSON product URLs are useful candidates, but external
research currently receives HTTP 403. Rather than guessing, WTF Engine now has a production-runtime
probe that can be triggered manually from the editorial console.

## Endpoint

Authenticated with the existing `EDITORIAL_API_TOKEN`:

`GET /api/predict-source-health`

Returns registry metadata only. No external network requests are made.

`GET /api/predict-source-health?source=<registered-source-id>`

Performs one read-only GET against that registered source's resolution URL.

The endpoint:

- accepts only a registered source ID, never an arbitrary URL;
- follows redirects;
- uses an 8 second timeout;
- cancels the response body after headers are received;
- reports HTTP status, latency, content type, final URL and whether the final host is still within the
  registered official-host allowlist;
- writes nothing to Neon;
- makes no OpenAI call.

Network failures are returned as a successful diagnostic response with `ok=false`, so the console can
show the result without turning source unavailability into a server error.

## Editorial console

The console has a manual **Carica fonti PREDICT** action and a separate **Probe runtime** action.

Nothing is probed automatically. This avoids unnecessary external requests and makes rate-limited or
sensitive official sources opt-in.

## Interpretation

A successful probe proves only that the source is reachable at that moment from the Vercel runtime.

It does not by itself approve an automated adapter. Automation still requires:

- stable machine-readable semantics;
- a deterministic event identity;
- an opening/closing/resolution model;
- evidence that the future outcome is genuinely unresolved at opening;
- source-specific parsing tests.

NOAA remains `runtime-check-required` until a production probe is run and its data semantics are
validated.
