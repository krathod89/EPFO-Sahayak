# 17 — New code: wrong claim form filed

**Status:** Done (2026-09-01) — built, tested, merged (PR #15), and verified live in production

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

## Closeout

Built as `CODE_9_WRONG_FORM` (not `CODE_10` as this ticket's text speculated — sequential by actual build order, ticket 10's code not yet built). New `withdrawal_intent` field (`full_settlement` / `pension_only` / `advance` / `unsure`) drives a 4-way branching question; each branch maps to the correct form and cross-references Code 8's eligibility conditions where relevant. Mutually exclusive with every other code. Grievance is always `not_applicable` (never generated); the deadline/penalty check is suppressed entirely, same reasoning as Code 8.

**Generalized `index.ts`'s dispatch** rather than adding a 4th hand-written special case: `EXCLUSIVE_CODE_GRIEVANCE_KIND` (a lookup table, Codes 6/8/9) and `DEADLINE_SUPPRESSED_CODES` (a shared list, reused by `Wizard.tsx`) replace the old `else if` chain.

**Two code-review passes, both with real findings, both fixed:**
- Pass 1: the new dispatch table was order-dependent on `rejection_codes_selected` rather than always prioritizing Code 6 (fixed — now iterates the table's own key order); a hardcoded exclusivity error message that could drift from `MUTUALLY_EXCLUSIVE_CODES` (fixed — now derived); `Wizard.tsx`'s diagnosisSummary subtitle left as a per-code ternary chain inconsistent with the rest of the ticket's own generalization (fixed — now a lookup table).
- Pass 2 traced a UI symptom (the "Generate grievance text" button and grievance-output screen unconditionally promising grievance text for codes that can never produce one — the same bug shape ticket 16 fixed for the deadline check) back to its real root cause in `grievance.ts`: `buildGrievance()` checked `missing_info` before `not_applicable`, so a never-applicable case looked like "still needs your UAN" until both fields were filled in. Fixed by reordering the check — `not_applicable` depends only on the diagnosed kind, not on which fields are filled — which also made the UI symptom's own fix work as intended. Also generalized `ExplCard`'s badge logic into a table, and corrected stale doc references (spec Section 1/2 code counts, the Section 8a workflow diagram missing Codes 8/9, a stale "7 codes" file header).

**Verification:** 141/141 tests passing (up from 122 pre-ticket), clean typecheck, clean build. Direct API calls against a local dev server for all 4 branches, with and without `uan`/`claim_id`, confirming `deadline` is absent and `grievance.reason` is `not_applicable` immediately in both cases. Full browser walkthrough (Claude-in-Chrome) of the new `code9Question` screen through to grievance output, plus a Code 2 regression check confirming the normal deadline/grievance flow is unaffected.
