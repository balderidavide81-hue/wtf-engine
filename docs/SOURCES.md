# Source policy v0.5

The collector uses a deliberately small automatic RSS portfolio plus optional operator-configured feeds.

## Active default feeds

- UPI Odd News
- Phys.org Plants & Animals
- Phys.org Archaeology
- Phys.org Space
- New Atlas Science
- New Atlas Technology
- New Atlas Transport

The exact feed URLs and metadata live in `src/ingest/sources.ts`.

## Ingestion rules

- ingest only title/summary/source metadata needed for discovery;
- retain a canonical HTTP(S) source URL for attribution and review;
- strip common tracking parameters before identity/dedupe;
- reject non-HTTP(S) article links;
- use deterministic duplicate/sensitivity filtering before AI;
- do not republish third-party article bodies or media without appropriate rights.

RSS fetches have a finite timeout so one stalled publisher cannot occupy the whole generation window indefinitely.

## Expansion

Additional feeds can be added through `WTF_RSS_SOURCES`:

`Name|URL|language|country,Name 2|URL|language|country`

Before activation:
1. verify the machine-readable endpoint and freshness;
2. review access/reuse/attribution terms;
3. prefer stable canonical URLs and timestamps;
4. verify that summaries are sufficient for classification;
5. keep publication subject to editorial source review.

Discovery breadth does not bypass Scout or editorial review.
