# 13 — Fix Code 3: employer-approval step no longer exists (EPFO order, April 2025)

**Status:** Open — real correctness bug, not a copy nit

Traces to: `spec.md` US1 (Code 3 branch). Rule logic source: `lib/rule-engine/codes.ts` (`CODE_3_INTRO`, `CODE_3_BANDS`, `CODE_3_GENERAL`), `lib/rule-engine/waitBands.ts`.

## Why — verified, not just unconfirmed

Resolves the open item from `PRD.md` §10 ("re-check the bank-KYC wait-time thresholds… against EPFO's own Citizen Charter once reachable"). EPFO's own domains still 404 mid-migration (confirmed again this session, both `epfindia.gov.in` and `epfo.gov.in`), but an EPFO order dated **3 April 2025** is directly quoted, identically, across multiple independent secondary sources (StaffNews, CAalley, United Consultancy, PlanivestFin):

> "There shall be no requirement of approval of Employer in the bank account seeding process henceforth." … "All requests pending for bank KYC seeding at Employer level will be auto-approved following the verification process from the Bank/NPCI."

This predates the app's build (Aug 2026) by well over a year. The shipped Code 3 copy is built on the pre-April-2025 process:
- `CODE_3_BANDS[2].fix` tells the citizen to *"contact your employer's HR or PF team and ask if they have approved your KYC request."* — that approval step doesn't exist anymore.
- `CODE_3_BANDS[3]` and `CODE_3_GENERAL` frame the 15-working-day Field-Office-escalation rule around the employer being the blocker — also stale under the new process (bank/NPCI verification + auto-approval, no employer gate).
- The whole premise — "waiting on your employer" — no longer matches how bank KYC seeding actually works today.

## Scope

- Rewrite `CODE_3_INTRO`, all three `CODE_3_BANDS` entries, and `CODE_3_GENERAL` in `lib/rule-engine/codes.ts` around the current process: bank/NPCI verification (order cites ~3 days average), then auto-approval, no employer step.
- Re-derive the 3 wait-bands (or collapse to fewer) against the *current* process's actual typical/stuck timing — the old 0–7 / 8–15 / 15+ bands were themselves built around the employer's ~13-day average approval time (per the same order's own stated baseline), which no longer applies.
- Update `Rule Engine/Rule Engine Spec.md` §3 (Code 3) — source of truth — so it doesn't keep describing the retired process.
- Update the grievance **Variant B** copy in `lib/rule-engine/grievance.ts` (`bank_kyc_escalate`) — it also cites "employer has not done so within 15 days," same stale premise.
- Add a one-line dated citation comment in `codes.ts` (matching the existing inline-comment convention in `waitBands.ts`) pointing to the April 2025 order, so the next person doesn't have to re-derive this.

## Not in scope

- Re-verifying the 3-day/20-day claim-*settlement* deadline (H11) — that's a separate rule (Section 5), not affected by this bank-KYC-seeding change. No evidence found suggesting it changed.

## Done means

- `waitBands.test.ts` / `codes` tests updated to match the new band definitions and copy.
- Manual read-through confirming no remaining copy tells a citizen to chase employer approval for bank KYC.
- `PRD.md` §10's "re-check the bank-KYC wait-time thresholds" item checked off, with this ticket's citation as the resolution.
