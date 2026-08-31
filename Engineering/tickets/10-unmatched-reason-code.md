# 10 — 8th selectable option: "I see a reason, but it's not listed here"

**Status:** Open

Traces to: `spec.md` US1 (extends it — see note below). Rule logic source to extend: `Rule Engine/Rule Engine Spec.md` §3.

## Why

Coverage gap found while auditing the shipped build against real-world use cases. The 6 diagnosable codes plus `CODE_7_NO_REASON` cover every case in the 15-case test sample (`Research/EPFO Findings.md`), but that sample can't guarantee full real-world coverage. `CODE_7_NO_REASON`'s selection text is explicitly *"I don't see a reason — EPFO didn't explain"* — it only fits a citizen who sees **no** remark. A citizen who sees a **real remark that just isn't one of the 6 modeled codes** has no honest option today: they either force-fit a wrong code (bad diagnosis) or pick Code 7 (factually wrong — EPFO did explain, just not in a way the tool recognizes) or abandon the tool.

## Scope

- **`lib/rule-engine/types.ts`** — add `CODE_8_UNLISTED_REASON` to the `RuleCode` union. Keep it out of `DiagnosableCode`, same as Code 7 — mutually exclusive with the other 6 at the UI level (a citizen either matches a known code, sees nothing, or sees something unrecognized; these don't combine).
- **`lib/rule-engine/codes.ts`** — add a `CODE_DEFINITIONS` entry (name: *"I see a reason, but it's not listed here"*) and a `CODE_8_OPENING` string, parallel to `CODE_7_OPENING` but honest about the difference: acknowledges EPFO did give a reason, explains the self-check still helps rule out the common causes even though this specific remark isn't modeled yet.
- **`lib/rule-engine/diagnose.ts`** — route `CODE_8_UNLISTED_REASON` through the same self-check sub-flow Code 7 already uses (`nextScreen` in `components/Wizard.tsx:244` — add the new code alongside Code 7's check).
- **`lib/rule-engine/codes.ts`** — add `CODE_8_ALL_CLEAN` (parallel to `CODE_7_ALL_CLEAN`), worded for this case specifically — not "EPFO gave no reason" but "the reason you saw doesn't match a known cause, and none of the common causes turned up an issue either."
- **`lib/rule-engine/grievance.ts`** — add **Variant F**: a `demand_clarification`-type grievance. Must NOT reuse Variant E's wording (*"EPFO's claim status did not state a reason"*) — that's factually false for this case. Variant F should state EPFO gave a reason the citizen couldn't match to a known cause, that self-checks came back clean, and ask EPFO to clarify the specific corrective action needed.
- **`components/Wizard.tsx`** — add the 8th entry to `RULE_CODE_SELECTION_TEXT`; selection screen already renders from that map, no separate UI needed.
- **`Rule Engine/Rule Engine Spec.md`** §3 — add Code 8 as the source-of-truth entry (this ticket's code changes must trace back to the spec, matching how Codes 1–7 are already documented there), so the spec doesn't drift from what ships.
- **`Engineering/analytics.md`** — `grievance_generated`'s `variant` property range is currently documented as `A`–`E`; update to `A`–`F`. `codes_selected`'s `codes: array of RuleCode` already covers the new value with no change needed.
- **`spec.md`** — extend US1's scope note to mention Code 8, or add a short US1a — team's call at build time; not deciding the exact split here.

## Not in scope

- No free-text capture of the citizen's actual EPFO remark. Variant F stays a generic clarification request, not a quote of what they typed — avoids scope creep into a new input field and a new PII surface.
- No change to the CPGRAMS v2 escalation path.

## Analytics

No new event. Existing `codes_selected` (fires with the new enum value), `self_check_submitted`, `diagnosis_shown`, `grievance_generated` (now `variant: F` possible) all already cover this path structurally — only the documented variant range changes.

## Done means

- Vitest coverage: Code 8 selection routes to self-check (mirrors existing Code 7 tests in `diagnose.test.ts`); Variant F grievance text generation (`grievance.test.ts`), asserting it does NOT contain Variant E's "did not state a reason" language.
- Manual walkthrough: select "I see a reason, but it's not listed here" → self-check → grievance output reads honestly (doesn't claim no reason was given).
