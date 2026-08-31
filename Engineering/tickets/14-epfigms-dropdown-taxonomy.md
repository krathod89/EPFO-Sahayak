# 14 — Capture EPFiGMS's real dropdown taxonomy for grievance generation

**Status:** Open

Traces to: `spec.md` US4. Rule logic source: `lib/rule-engine/grievance.ts` (source-of-truth gap already flagged inline: *"EPFiGMS's category-dropdown taxonomy was never captured. This module generates the free-text BODY only."*).

## Why

Confirmed during the coverage grill (2026-08-31) — you approved fixing this: grievance text (US4, H13) is the load-bearing hypothesis for the whole product, and it's currently generated as free text only. If EPFiGMS actually requires selecting from fixed dropdown category/subcategory values rather than accepting arbitrary free text, a citizen could produce well-worded body text that still gets filed under the wrong category — or can't be filed at all without picking something first. This is exactly the shape of gap that would poison Phase 2 (real volunteers testing their own case) before you'd learn it from real usage.

## Scope — revised 2026-08-31, see "Blocker found" below

**Original plan (capture the exact taxonomy) hit a hard wall — walked the real EPFiGMS "Register Grievance" flow live and confirmed the category/subcategory dropdown only renders after UAN + OTP login. No secondary source documents the exact list either (checked — every guide describes only broad categories in prose: PF Withdrawal, Transfer, Pension Settlement, UAN). Getting the exact list needs a real citizen's live UAN + OTP, which isn't available in this environment.**

**Revised scope (Choice 2, decided with the product owner):** ship an honestly-labeled *broad-category hint* now, not a precise mapping:

1. **Extend `GrievanceOutput`** (ready:true case) with a `suggestedCategory: string` field — a best-guess broad category per variant, sourced from the confirmed secondary-source category names (PF Withdrawal, Pension Settlement, Transfer, UAN).
2. **Map each grievance variant to a broad category**, not a precise dropdown value — e.g. Variant A/B/C/D/E all suggest "PF Withdrawal / Final Settlement," except the EPS-related standard case (Code 4), which suggests "Pension Settlement." Both ticket 10's future Code 8 and tickets 15–17's future codes get the same broad-category treatment when built.
3. **UI shows the hint with an explicit caveat**, not as fact: something like *"This likely falls under '{category}' or the closest-matching option — EPFiGMS's exact category list isn't confirmed yet. Pick whichever option looks closest."* Never presented as a confirmed instruction.
4. **Update `Rule Engine/Rule Engine Spec.md` §6** with the broad-category mapping and the caveat, so the "known limitation" is documented, not just the guess itself.

## Phase 2 follow-up (new, not this ticket)

Once Phase 2 real volunteers are using the shipped tool on their own real cases, ask one to walk through EPFiGMS's actual form (their own UAN, their own OTP) and report back the real category/subcategory list they saw. That becomes a follow-up ticket to replace the broad-category guess with the precise mapping originally scoped here. Tracked in `PRD.md` §10 as a new open item — don't let this silently drop once Phase 2 starts.

## Not in scope

- Auto-filing the grievance on the citizen's behalf (no API access to EPFiGMS exists or is being pursued) — this stays copy-and-paste, just with a category *hint* told to the citizen alongside the body text, not a guarantee.
- The precise dropdown taxonomy — deferred to the Phase 2 follow-up above, not attempted here.

## Done means

- `grievance.test.ts` extended to assert each variant carries a `suggestedCategory` and that it's a plain broad-category string (not fabricated as a confirmed EPFiGMS value).
- UI copy reviewed to confirm the hint reads as a guess, never as a confirmed instruction.
- `PRD.md` §10's "capture the actual EPFiGMS category/subcategory dropdown taxonomy" item updated (not simply checked off) — records the blocker found, the Choice 2 decision, and the new Phase 2 follow-up item.
