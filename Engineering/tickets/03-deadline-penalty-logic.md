# 03 — Deadline / penalty check logic (H11)

**Status:** Done (this session)

Traces to: `spec.md` US3. Rule logic source: `Rule Engine/Rule Engine Spec.md` §5.

## Scope
- `lib/rule-engine/deadline.ts` — implements `check_deadline` exactly per the spec's pseudocode: 3 days if `kyc_complete_at_filing`, else 20; calendar days (spec's stated working assumption — Section 9/gap-3 flags this as unconfirmed, carried forward as a code comment, not silently resolved); returns `NOT_YET_DUE` (with `days_remaining`) or `MISSED` (with `days_late`).

## Analytics
Fired by the API layer (ticket 06): `deadline_check_shown` (`status`, `deadline_days`).

## Done means
- Vitest coverage for: exact-boundary date (today == deadline date, must be `NOT_YET_DUE`), one day before/after the boundary, both the 3-day and 20-day branches, and that `days_remaining`/`days_late` are only present on the matching status.
