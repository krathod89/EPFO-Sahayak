# 16 — New code: eligibility / service-period not met

**Status:** Open

Traces to: `spec.md` US1 (extends it — new code, same pattern as ticket 10). Rule logic source to extend: `Rule Engine/Rule Engine Spec.md` §3.

## Why

Found during the broader error-code coverage check (2026-08-31). EPFO's own "Track Claim Status" remarks include eligibility/service-period rejections — e.g., under 6 months of eligible service for Form 10C, or total service exceeding 9.5 years (which routes the citizen to a monthly pension claim instead of a lump-sum Form 10C withdrawal). Confirmed via multiple convergent sources ([ClearTax](https://cleartax.in/s/epf-claim-rejected-reasons-and-how-to-apply-again), [Kotak Life](https://www.kotaklife.com/insurance-guide/retirement/epfo-claim-rejected-reason), [Kustodian](https://kustodian.life/resources/form-10c-in-epf-the-complete-2026-guide-to-eps-withdrawal-scheme)) that this shows up as a specific remark, not a pre-submission block — same mechanism as every other code, so per the team's own coverage rule it gets added rather than logged as out of scope.

**Framing note, worth deciding at build time, not here:** this is a genuinely different kind of case than Codes 1–7 — those are all "two records disagree, and that's not the citizen's fault" (PRD §4's core thesis). This one is "you're not eligible yet, and that's correct." The explanation copy should be honest about that distinction (not framed as "not your fault," since here it usually is just a timing issue) rather than force-fitting PRD §4's tone onto a case where it doesn't apply.

## Scope

- New `RuleCode` entry (e.g. `CODE_9_ELIGIBILITY`) in `lib/rule-engine/types.ts`, kept out of `DiagnosableCode`'s priority-ranking set if it's mutually exclusive with the other codes at the UI level (a service-period rejection isn't "also" a bank-KYC issue) — confirm against Rule Engine Spec §4's priority logic before wiring in.
- `CODE_DEFINITIONS` + explanation/fix copy in `codes.ts`: explain the specific eligibility rule that wasn't met (6-month minimum for Form 10C; the 9.5-year pension-vs-lump-sum threshold) and the correct next step (wait until eligible, or refile under the correct claim type for their actual situation — this overlaps with ticket 17's wrong-form code; keep the two copy blocks cross-consistent when both are built).
- A grievance variant is likely **not applicable** here — filing a grievance won't override a genuine eligibility rule. `buildVariantContent` should probably return `not_applicable` for this code, mirroring how `bank_kyc_escalate` already returns `notApplicable` for bands 1–2. Confirm this framing before generating misleading "file a grievance" advice for a correct rejection.
- Update `Rule Engine/Rule Engine Spec.md` §3 with the new code.

## Not in scope

- No change to the deadline/penalty logic (H11) — an ineligible claim was never going to be settled regardless of the 3/20-day clock, so the penalty framing doesn't apply here either. Worth an explicit skip in the deadline-check step for this code, decided at build time.

## Done means

- Tests cover the new code's explanation/fix text and confirm it correctly returns "not applicable" (or equivalent) for grievance generation rather than producing misleading escalation copy.
- Manual read-through: the copy doesn't claim "not your fault" for a case that usually is just a timing issue — matches PRD §4's honesty standard rather than its default tone.
