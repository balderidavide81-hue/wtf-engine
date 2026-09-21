# Source policy v0.2

The collector now has a deliberately small automatic default registry.

## Active default source

- UPI Odd News — official odd-news publisher; machine-readable RSS endpoint used for discovery.

UPI describes Odd News as weird/viral news from around the world. Its news content is copyrighted/licensed, so WTF Engine uses feed metadata for discovery and keeps the canonical source URL; it must not republish article bodies or media without the appropriate rights.

## Expansion

Additional feeds can be added through `WTF_RSS_SOURCES` without a code deploy:

`Name|URL|language|country,Name 2|URL|language|country`

Before activating another source:
1. verify the feed/API endpoint;
2. review access and reuse/licensing terms;
3. ingest only what is needed for candidate selection;
4. retain canonical URLs for attribution and verification;
5. do not republish third-party bodies/images without rights.

## Priority families

- odd/local curiosities
- records
- contests and festivals
- animals
- entertainment and public events
- food and unusual competitions
- technology curiosities

Guinness World Records is a strong discovery/reference source, but its public site content is protected by copyright and no official RSS endpoint was verified in this pass, so it is not scraped automatically in v0.2.
