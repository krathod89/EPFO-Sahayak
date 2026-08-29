# 05 — Pre-filing readiness-check flow (H14)

**Status:** Done (this session)

Traces to: `spec.md` US5. Rule logic source: `Rule Engine/Rule Engine Spec.md` §7.

## Scope
- `lib/rule-engine/readiness.ts` — implements `readiness_result` exactly: reuses the 5-item self-check, applies the per-check pass/fail polarity table (note `old_claim_pending` flips direction), buckets into issues/unsure/pass, and returns one of the three output shapes (`ready`, `mostly_ready`, `issues_found`) with reused Code 1/2/3/4/5 explanation+fix text for each issue (Code 3 shown as general text only, no wait-time band — no submission date is collected pre-filing).
- No priority ranking and no deadline check apply here (per spec §7) — this ticket must not call `prioritize()` or `checkDeadline()`.

## Analytics
Fired by the API layer (ticket 06): `readiness_result_shown` (`result`, `issue_count`, `unsure_count`).

## Done means
- Vitest coverage for: all-clean (ready), some-unsure-none-issue (mostly_ready), at-least-one-issue (issues_found), the `old_claim_pending` polarity flip specifically, and confirming Code 6 text is never reachable from this flow.
