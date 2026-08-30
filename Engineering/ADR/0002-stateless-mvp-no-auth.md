# ADR 0002 — Stateless MVP, no accounts, session-scoped analytics only

**Status:** Accepted (2026-08-29, decided in PRD §7a item 7/8; formalized here for its data shape). **Updated the same day by ADR 0004**: analytics events are tracked in Mixpanel, not a Postgres table — the principles below (no accounts, `session_id` as an opaque grouping key, never persist citizen-entered fields) are unchanged, only where they're enforced moved.

## Context

PRD §7a already decided the product stays fully stateless for the MVP: no login, no saved cases, anonymous session-ID analytics only, with a reference-code case-retrieval mechanism named as a deliberately deferred v2 item (needs a PII retention/deletion policy first). This ADR records what that decision means for how citizen data is (and isn't) tracked, so a future ticket doesn't quietly reintroduce accounts or start persisting case content.

## Decision

- **No `User` model, no auth of any kind, anywhere in this project.** `session_id` is an opaque UUID the frontend generates client-side per tab/visit. It identifies nothing about the person — it's a grouping key for anonymous events (Mixpanel's `distinct_id`), the same trust pattern GOV.UK, NHS 111, and the IRS Interactive Tax Assistant (all cited in PRD §7a's design references) use pre-auth.
- **Analytics events are tracked in Mixpanel** (see ADR 0004 for the full architecture — client-side events sent directly from the browser, server-computed events sent from `app/api/diagnose/route.ts` via `lib/analytics.ts`). There is no database table for this in the MVP.
- **Never send UAN, claim ID, filing date, or any other citizen-entered field as an event property.** Those fields exist only in the request body of `POST /api/diagnose`, used in-memory to compute a response, and are never tracked. `lib/analytics.ts`'s `trackServerEvent()` enforces this with a blocked-key check as a backstop; `analytics.md` states the rule explicitly for every future event added.

## Consequences

- Nobody can revisit a diagnosis after the tab closes in this MVP — that's the accepted tradeoff PRD §7a already made, not a gap introduced here.
- If the reference-code case-retrieval mechanism (PRD §7a item 8) gets built later, it is new scope: a real database (the Supabase project the product owner already created is reserved for exactly this), a retention/deletion policy, and a re-review of this ADR — not an extension of the Mixpanel event stream, which must stay PII-free and is the wrong tool for storing retrievable case data anyway.
- Because there's no auth, `POST /api/diagnose` is an open endpoint. Basic abuse protection (rate limiting by IP, a request-size cap) is worth adding before a public launch, but is not required to prove the MVP works — tracked as an open item in ticket `08-infra-deploy-setup.md`, not blocking the core build.
