# 17 — New code: wrong claim form filed

**Status:** Open

Traces to: `spec.md` US1 (extends it — new code, same pattern as ticket 10). Rule logic source to extend: `Rule Engine/Rule Engine Spec.md` §3.

## Why

Found during the broader error-code coverage check (2026-08-31), alongside ticket 16. EPFO rejects claims where the citizen filed the wrong form for their actual situation (e.g., filed Form 19 for a full PF settlement when their case calls for Form 10C's pension withdrawal, or vice versa) — confirmed as a real, tracked rejection remark (not a pre-submission block) via multiple sources. Same coverage rule as ticket 16: it produces a specific remark on EPFO's own status tracker, so it gets added rather than logged out of scope.

**Framing note:** like ticket 16, this is a user-error case, not a records-disagree-with-each-other case. Copy should say plainly which form fits their situation and why, without implying EPFO made a mistake.

## Scope

- New `RuleCode` entry (e.g. `CODE_10_WRONG_FORM`) in `lib/rule-engine/types.ts`, likely mutually exclusive with the other codes at the UI level, same as Codes 6/7/9 — confirm against priority logic (Rule Engine Spec §4) before wiring in.
- `CODE_DEFINITIONS` + explanation/fix copy in `codes.ts`: a short decision guide — Form 19 for full PF settlement, Form 10C for pension-portion withdrawal (with ticket 16's eligibility conditions), Form 31 for an advance — so the citizen refiles under the form that actually matches what they're trying to withdraw, not just "try again."
- Grievance applicability: likely **not applicable**, same reasoning as ticket 16 — a wrong-form rejection doesn't call for an EPFiGMS escalation, it calls for a refile under the correct form. Confirm at build time rather than defaulting to always generating grievance text.
- Update `Rule Engine/Rule Engine Spec.md` §3 with the new code.

## Not in scope

- No general "which form should I file" wizard beyond this rejection-context use — this code only fires once a citizen already has a rejection remark pointing at wrong-form selection, not as a standalone pre-filing form-picker (that's a bigger, separate feature, not this ticket).

## Done means

- Tests cover the new code's explanation/fix text (correctly distinguishes Form 19 / 10C / 31 use cases) and confirm grievance generation is skipped/not-applicable for this code rather than producing misleading escalation copy.
- Manual read-through: copy is clear about which form the citizen should refile under, not just "you picked wrong, try again."
