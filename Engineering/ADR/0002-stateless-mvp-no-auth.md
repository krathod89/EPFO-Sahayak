# ADR 0002 — Stateless MVP, no accounts, session-scoped analytics only

**Status:** Accepted (2026-08-29, decided in PRD §7a item 7/8; formalized here for its database shape)

## Context

PRD §7a already decided the product stays fully stateless for the MVP: no login, no saved cases, anonymous session-ID analytics only, with a reference-code case-retrieval mechanism named as a deliberately deferred v2 item (needs a PII retention/deletion policy first). This ADR records what that decision means for the database layer specifically, so a future ticket doesn't quietly reintroduce a users table or start persisting case content.

## Decision

- **No `User` table, no auth of any kind.** `session_id` is an opaque UUID the frontend generates client-side per tab/visit. It identifies nothing about the person — it's a grouping key for anonymous events, the same trust pattern GOV.UK, NHS 111, and the IRS Interactive Tax Assistant (all cited in PRD §7a's design references) use pre-auth.
- **One table for the MVP: `AnalyticsEvent`** (`session_id`, `event_type`, `properties` JSON, `created_at`). See `analytics.md` for the full event list and `prisma/schema.prisma` for the exact shape.
- **Never write UAN, claim ID, filing date, or any other citizen-entered field to the database.** Those fields exist only in the request body of `POST /api/diagnose`, used in-memory to compute a response, and are never persisted. `analytics.md` states this explicitly as a rule for every ticket.

## Consequences

- Nobody can revisit a diagnosis after the tab closes in this MVP — that's the accepted tradeoff PRD §7a already made, not a gap introduced here.
- If the reference-code case-retrieval mechanism (PRD §7a item 8) gets built later, it is new scope: a new table, a retention/deletion policy, and a re-review of this ADR — not an extension of `AnalyticsEvent`, which must stay PII-free.
- Because there's no auth, `POST /api/diagnose` and `POST /api/events` are open endpoints. Basic abuse protection (rate limiting by IP, a request-size cap) is worth adding before a public launch, but is not required to prove the MVP works — tracked as an open item in ticket `08-infra-deploy-setup.md`, not blocking the core build.
