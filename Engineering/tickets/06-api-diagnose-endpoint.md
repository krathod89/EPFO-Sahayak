# 06 — API layer: POST /api/diagnose

**Status:** Done (this session) — unit + integration tests pass (Prisma mocked); not yet exercised against a live database (see ticket 08).

Traces to: `spec.md` US1–US5 (both entry points). Wraps tickets 01–05 in a single HTTP boundary.

## Scope
- `app/api/diagnose/route.ts` — validates the request body against `entry_point`:
  - `post_rejection`: requires `rejection_codes_selected`, `filing_date`, `kyc_complete_at_filing`, plus the conditional fields (`namedob_kyc_page_status` if Code 1 selected, `bank_kyc_submission_date` if Code 3 selected, `self_check_answers` if Code 7 selected). Runs diagnose → prioritize (if 2+ codes) → deadline check → grievance generation, and returns all four results together.
  - `pre_filing`: requires `self_check_answers`. Runs the readiness flow only.
- Input validation with a schema library (zod) — reject malformed/missing fields with a 400 and a plain-language error, not a 500.
- Fires the request-scoped analytics events named in `analytics.md` (`codes_selected` or `self_check_submitted` on receipt; `diagnosis_shown`, `deadline_check_shown`, `grievance_generated`, or `readiness_result_shown` on response) via the same `AnalyticsEvent` write path as ticket 07 — instrumented in this ticket, not deferred.

## Done means
- [x] Integration tests (Vitest, invoking the route handler directly) covering both entry points end-to-end, validation-failure cases, and confirming the right analytics events fire (Prisma mocked, asserted on `event_type`). See `app/api/diagnose/route.test.ts`.
- [x] No business logic lives in the route handler itself — it only validates, calls the `lib/rule-engine` functions, and shapes the response.
- [ ] Exercised against a real (Supabase) database, not just a mocked Prisma client — blocked on ticket 08.
