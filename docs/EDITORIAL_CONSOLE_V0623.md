# Editorial Console — v0.6.23

Status: source-only feature branch. No production deploy, Neon mutation, or AI call is required by this block.

## Purpose

Provide the small internal editorial surface planned after Content Store validation, using the existing
authenticated `/api/editorial` contract rather than adding a second backend.

The console lives at `editorial/index.html` and is intentionally framework-free so the current
TypeScript/Vercel backend does not gain a frontend build dependency.

## Security model

- the page contains no editorial data by itself;
- every read/write still goes through `/api/editorial`;
- `EDITORIAL_API_TOKEN` is entered manually and kept only in JavaScript memory;
- the token is never placed in the URL, localStorage or sessionStorage;
- no third-party JavaScript, font or analytics dependency is loaded;
- publication and PREDICT adjudication require explicit browser confirmation.

The page being reachable is not an authorization boundary. The existing API bearer-token check remains
the authorization boundary.

## Supported workflow

For a selected Daily Edition the console can:

- load full editorial card/source context;
- display edition/card lifecycle state;
- edit complete draft card copy through the existing deterministic validator;
- review or reject draft cards;
- review the whole edition once every non-rejected card is reviewed;
- publish a reviewed edition;
- review image/media usage status;
- resolve or void an open PREDICT card with evidence.

It does not bypass lifecycle freezes. Once an edition leaves `draft`, the same backend restrictions
continue to apply.

## Deployment discipline

Feature branches are covered by `vercel.json` with `"**": false`, so this branch does not create a
preview deployment. Merge to `main` should happen only after source review. The first production smoke
should be read-only first: load an existing published edition, then use a future draft for mutation tests.

## Next gate

After this console is merged and smoke-tested, use it to run the planned multi-day Content Gate:

1. generate one bounded daily draft;
2. editorially audit the cards;
3. record accepted/rejected/edit counts and obvious failure classes;
4. publish only when the edition is sound;
5. repeat across enough days to judge whether the engine supplies consistently playable material.

This gate should measure content quality rather than add new gameplay scope.
