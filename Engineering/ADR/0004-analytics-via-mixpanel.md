# ADR 0004 — Analytics tracked via Mixpanel, not a custom Postgres table

**Status:** Accepted (2026-08-29). Supersedes the analytics-storage half of ADR 0001 and ADR 0002 — both are updated to point here rather than describing the old Postgres `AnalyticsEvent` table.

## Context

ADR 0001/0002 originally put analytics in a single `AnalyticsEvent` Postgres table (via Prisma + Supabase), reachable through a `POST /api/events` endpoint (`Engineering/tickets/07-analytics-event-logging.md`). The product owner then created both a Supabase project and a Mixpanel project. Running two systems that do the same job (record what happened) was never the intent — one had to give.

## Decision

**Analytics events are tracked in Mixpanel, not Postgres.** Concretely:

- **Client-side events** (`session_started`, `entry_point_selected`, `grievance_copied`, `feedback_submitted`, and the pre-submit interaction events — see `analytics.md`) are sent **directly from the browser** via Mixpanel's client SDK, using the session-scoped `session_id` as Mixpanel's `distinct_id`. This is Mixpanel's standard architecture — project tokens are meant to be public/client-safe, the same way a publishable API key is — so there is no need to proxy these through our own backend.
- **Server-computed events** (`codes_selected`, `diagnosis_shown`, `deadline_check_shown`, `grievance_generated`, `self_check_submitted`, `readiness_result_shown`) are tracked from inside `app/api/diagnose/route.ts`, via `lib/analytics.ts`'s `trackServerEvent()`, using the official `mixpanel` (mixpanel-node) package and the same `session_id` as `distinct_id`.
- **`POST /api/events` and the `AnalyticsEvent` Prisma model are removed.** There is no longer a standalone endpoint for client-fired events, and no database table for analytics.
- **The PII rule from ADR 0002 carries over unchanged**, just enforced in a new place: `lib/analytics.ts` keeps the same `BLOCKED_PROPERTY_KEYS` check that `POST /api/events`'s schema used to run, so a citizen-entered field (UAN, claim ID, filing date, …) reaching Mixpanel is caught and dropped, not silently forwarded.

## Alternatives considered

- **Dual-write (Mixpanel + the Postgres table).** Rejected: two write paths is one extra failure mode and an ongoing sync question ("which one is the record of truth?"), for a benefit — an owned raw copy of the data — Mixpanel's own data export already covers for a 9-day MVP.
- **Keep the Postgres table, ignore Mixpanel.** Rejected by the product owner in favor of Mixpanel's built-in dashboards/funnels, which the custom table would need real extra work (a dashboard, or at least ad-hoc queries) to match.

## Consequences

- **Prisma and `@prisma/client` are removed from the project entirely** — there is nothing left in the MVP that needs a database. `prisma/`, `lib/db.ts`, and `app/api/events/` were deleted, not just left unused.
- **The Supabase project the product owner created is not wasted — it's reserved, unused, for v2.** PRD §7a already names a v2 feature (reference-code case retrieval) that would need a real database; when that gets built, Supabase is the obvious place to point Prisma at again. Nothing about this ADR removes that option — it just means the MVP itself needs zero database setup to run.
- **`MIXPANEL_TOKEN`** (server) and **`NEXT_PUBLIC_MIXPANEL_TOKEN`** (client, once the UI wires up Mixpanel's browser SDK) are the only new env vars this introduces — see `.env.example`.
- Local dev with no Mixpanel token configured falls back to a silent no-op (`lib/analytics.ts`) — the diagnose flow never breaks because analytics isn't set up yet, matching how the removed Postgres path was also best-effort and non-blocking.
