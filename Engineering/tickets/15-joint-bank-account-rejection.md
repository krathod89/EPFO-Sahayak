# 15 — Extend Code 3 to cover joint-bank-account rejection

**Status:** Done (2026-09-01) — built, tested, merged (PR #13), and verified live in production

Traces to: `spec.md` US1 (Code 3). Rule logic source to extend: `Rule Engine/Rule Engine Spec.md` §3 (Code 3).

## Why

Found during a broader error-code coverage check (2026-08-31), going past the original 15-case Reddit sample — which searched specifically for "bank KYC OR IFSC," a term set that would tend to confirm the existing Code 3 framing rather than surface a case outside it. EPFO requires the payout bank account to be solely in the citizen's name; a **joint account gets rejected outright**, not just flagged as unverified KYC. This is a distinct failure inside Code 3's own territory:

- `CODE_3_INTRO` and the trigger text in `codes.ts` (*"a mismatch in account number, IFSC code, or account-holder name"*) don't clearly name this case.
- More importantly, **every Code 3 fix path currently tells the citizen to chase KYC verification or Field-Office escalation** (see ticket 13, also being corrected) — none of it tells a citizen with a joint account that the actual fix is opening an individual account. A citizen hitting this case today gets advice that doesn't solve their problem.

## Scope

- Add a joint-account branch to Code 3 (parallel to the existing name/DOB-mismatch portal-sync-bug branch in `CODE_1_BRANCHES`) — its own explanation ("EPFO requires the account to be in your name only; a joint account is not accepted") and fix ("open an individual bank account in your own name, then submit a new bank-seeding/KYC request with that account").
- Since this ticket lands after ticket 13's rewrite of Code 3's copy (employer-approval-removed correction), sequence this one after — avoid two people rewriting the same file's Code 3 section at once.
- Update `Rule Engine/Rule Engine Spec.md` §3 (Code 3) — source of truth — with the new branch.

## Not in scope

- No change to `lib/rule-engine/waitBands.ts`'s wait-time bands — a joint-account rejection isn't a timing issue, it's a hard rejection independent of how long the citizen has waited.

## Done means

- [x] `diagnose.test.ts` / `codes` tests cover the joint-account branch's explanation and fix text.
- [x] Manual check: the joint-account fix text is clearly distinct from the KYC-verification fix text, so a citizen can't confuse the two remedies.

## Closeout (2026-09-01)

Built TDD (red: `schema.test.ts`/`diagnose.test.ts`/`grievance.test.ts`, then green: `schema.ts`/`codes.ts`/`diagnose.ts`/`grievance.ts`/`index.ts`/`Wizard.tsx`).

**First code-review pass caught a real critical bug**, not a style nit: `runPostRejectionFlow()` in `index.ts` never forwarded `bank_account_type` to its `diagnose()` call. A real citizen picking "joint account" through the actual app would have hit `diagnose()`'s `bank_account_type === "joint"` check as `undefined`, fallen through to the submission-date-required guard, and thrown — an uncaught 500 through `app/api/diagnose/route.ts`, for exactly the citizen this ticket exists to help. All 109 pre-fix tests passed anyway, because `diagnose.test.ts`, `schema.test.ts`, and `grievance.test.ts` each call their own module directly with `bank_account_type` already set — none of them exercised the real orchestrator. Fixed with a one-line addition (`bank_account_type: input.bank_account_type,`), plus a new `runPostRejectionFlow`-level regression test in `index.test.ts` that exercises the real entry point end to end, so an orchestrator-forwarding gap like this fails a test next time instead of shipping silently.

Same pass flagged 3 maintainability issues, all fixed: `CODE_3_JOINT_ACCOUNT` folded into a `CODE_3_BRANCHES` record (matching `CODE_1_BRANCHES`'s established shape for "one code, multiple branches"); the same inline `"branch" in entry.meta && entry.meta.branch === "X"` check, duplicated 4 times across `Wizard.tsx` and `index.ts`, replaced with one shared `hasBranch()` type guard exported from `diagnose.ts`; `kindForPrimaryCode`'s return type now references `grievance.ts`'s own exported `VariantKind` directly instead of a re-declared subset union that had to be kept in sync by hand.

Second code-review pass: clean, zero findings.

**Verified locally**: queried the exact broken path (joint account, no submission date) directly against the real dev-server API before the fix would have failed it — confirmed no 500, correct response. Full browser walkthrough confirmed the new question screen, the "Joint account" badge, and the fix/explanation text all render correctly and skip the submission-date screen as designed.

Merged via PR #13. **Verified live in production** by querying the same exact path directly against `epfo-sahayak-pi.vercel.app` — HTTP 200, correct diagnosis and "no grievance" response, matching what was verified locally.
