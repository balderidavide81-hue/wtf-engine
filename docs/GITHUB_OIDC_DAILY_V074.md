# GitHub OIDC Manual Daily Generation — v0.7.4

Status: source-ready; production activation requires merge + Vercel READY.

## Goal

Allow the repository owner to start a production Daily Edition from the GitHub Actions UI without copying
`GENERATION_API_TOKEN` into GitHub.

The existing bearer-token authorization remains supported.

## Workflow

`.github/workflows/generate-daily.yml`

Trigger: manual `workflow_dispatch` only.

Inputs:

- candidate limit: 15 or 30;
- explicit boolean confirmation that the run may incur OpenAI API cost.

The workflow:

1. requests a short-lived GitHub Actions OIDC token with audience `wtf-engine-daily`;
2. masks the token in Actions logs;
3. sends it as the Bearer token to production `POST /api/daily`;
4. does not print the generated response payload because this repository is public;
5. relies on both GitHub concurrency and the existing database generation lease to prevent parallel runs.

## Server trust policy

`src/auth/github-oidc.ts` verifies the JWT signature against GitHub's official JWKS and requires:

- issuer: `https://token.actions.githubusercontent.com`;
- algorithm: `RS256`;
- audience: `wtf-engine-daily`;
- repository: `balderidavide81-hue/wtf-engine`;
- repository ID: `1378812314`;
- ref: `refs/heads/main`;
- event name: `workflow_dispatch`;
- workflow ref: `balderidavide81-hue/wtf-engine/.github/workflows/generate-daily.yml@refs/heads/main`;
- valid `exp` / `nbf` / `iat` timing.

Signature verification is mandatory. Unverified claims are checked first only as a cheap rejection path before
fetching GitHub's public signing keys.

GitHub JWKS are cached in-memory for ten minutes per warm serverless instance.

## Cost and publication safety

This workflow only runs the existing daily generation pipeline. It does not review or publish an edition.

Therefore:

- generation can incur OpenAI API cost;
- the generated edition remains subject to the existing editorial review flow;
- publication still requires explicit editorial actions;
- generated payload content is not exposed in public Actions logs.

## Existing authorization

`GENERATION_API_TOKEN` continues to work unchanged. OIDC is an additional operator path, not a replacement.

## Activation smoke

After deployment:

1. unauthenticated `POST /api/daily` must remain 401;
2. normal GET must remain 405;
3. manual GitHub workflow with cost confirmation should return HTTP 200;
4. editorial console should show the newly generated draft;
5. no automatic review or publication should occur.
