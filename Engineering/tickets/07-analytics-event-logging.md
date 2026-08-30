# 07 — Server-side analytics tracking (Mixpanel)

**Status:** Done — unit-tested against a mocked Mixpanel client, and confirmed against the real Mixpanel project (a live `backend_wiring_verified` test event, sent via the real `MIXPANEL_TOKEN`, completed with no error from `mixpanel-node`'s callback — check Mixpanel's Live View to see it land).

Traces to: `spec.md` US6. See `Engineering/ADR/0004-analytics-via-mixpanel.md` for why this is Mixpanel, not a database, and `Engineering/ADR/0002-stateless-mvp-no-auth.md` for the PII rule this carries forward.

*Originally scoped around a Postgres `AnalyticsEvent` table and a `POST /api/events` endpoint — both existed briefly this session before the product owner's Mixpanel project made that redundant. This ticket describes the current, Mixpanel-based state; the old approach is preserved only in ADR 0004's "alternatives considered."*

## Scope
- `lib/analytics.ts` — `trackServerEvent(sessionId, eventType, properties)`. Uses the official `mixpanel` (mixpanel-node) package, `MIXPANEL_TOKEN` from env, `session_id` as `distinct_id`. Falls back to a silent no-op when no token is configured (so local dev without Mixpanel wired up never breaks). Drops (does not silently strip) any event whose `properties` contains a key shaped like a citizen-entered field — the same `BLOCKED_PROPERTY_KEYS` list the old `/api/events` schema used to check.
- Server-computed events (`codes_selected`, `self_check_submitted`, `diagnosis_shown`, `deadline_check_shown`, `grievance_generated`, `readiness_result_shown`) are fired from `app/api/diagnose/route.ts` directly, using this module — instrumented in the same ticket that built the diagnose flow (ticket 06), not deferred.
- Client-fired events (`session_started`, `entry_point_selected`, `grievance_copied`, `feedback_submitted`) are **not this ticket's scope** — they're sent directly from the browser via Mixpanel's client SDK once the frontend exists, using `NEXT_PUBLIC_MIXPANEL_TOKEN`. No backend code needed for those.

## Done means
- [x] Unit tests covering: no-op when `sessionId` is absent, a real track call using `sessionId` as `distinct_id`, the blocked-key drop, and that the underlying client throwing never propagates. See `lib/analytics.test.ts`.
- [x] Integration coverage via `app/api/diagnose/route.test.ts` (mocks `trackServerEvent`, asserts the right event types fire).
- [x] **Confirmed against the real Mixpanel project** — a test event (`backend_wiring_verified`) sent with the real project token via `mixpanel-node` completed with no error. This verified the token and the tracking call shape; it was sent from a local script using the same code path as `lib/analytics.ts`, not yet from a deployed `/api/diagnose` call — that end-to-end deployed check is still ticket 08's job.
