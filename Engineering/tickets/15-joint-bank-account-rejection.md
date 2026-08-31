# 15 — Extend Code 3 to cover joint-bank-account rejection

**Status:** Open

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

- `diagnose.test.ts` / `codes` tests cover the joint-account branch's explanation and fix text.
- Manual check: the joint-account fix text is clearly distinct from the KYC-verification fix text, so a citizen can't confuse the two remedies.
