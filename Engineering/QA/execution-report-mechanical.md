# Execution report — machine-executable cases (test-matrix.json)

Executed via `Engineering/QA/matrix-runner.ts` + `matrix.groupA.exec.test.ts` /
`matrix.groupB.exec.test.ts`, run with `npx vitest run --config Engineering/QA/vitest.config.ts`.
Each case calls the real exported function with its `args` and asserts the result against
`expected` (partial match via `toMatchObject`, with the JSON-`null`-means-`undefined` and
bare-array-return conventions from the matrix's own `NOTES-000` entry). This is a deterministic
mechanical run — re-running it produces identical results.

**Original result: 125 / 131 passed. 6 failed — all in one area (`grievance`), all the same root cause. Resolved same day (2026-09-02) — now 131 / 131.**

**Resolution:** product decision was to update `Rule Engine Spec.md` to match the shipped
code's colon/parenthetical punctuation (the code is what citizens actually see and what's
tested; the spec was the stale document here). `test-matrix.json`'s 6 `expected` values were
updated to match and their `SPEC-GAP` tags removed accordingly — this was a documentation-sync
call, not a code change. See below for what the drift looked like.

## Failures

All 6 failures are `buildGrievance()` subject-line / body-text assertions where the real
implementation uses colon + parenthetical punctuation and the matrix's `expected` value (derived
independently from `Rule Engine Spec.md` Section 6's literal templates, which use em dashes)
expected em-dash punctuation instead:

| Case | Variant | Field | Expected (spec literal) | Actual (implementation) |
|---|---|---|---|---|
| GR-001 | A | `subject` | `Grievance regarding rejection of PF claim — {CODE_NAME}` | `Grievance regarding rejection of PF claim: {CODE_NAME}` |
| GR-004 | B | `subject` | em-dash form | `Grievance regarding unverified bank KYC (Claim ID {ID})` |
| GR-010 | C | `subject` | em-dash form | `Grievance: claim screen shows outdated mismatch... (Claim ID {ID})` |
| GR-011 | D | `subject` | em-dash form | `Grievance: PF claim approved but payment not received (Claim ID {ID})` |
| GR-012 | E | `subject` + `body` | em-dash form; body uses `—` around the causes list | `Grievance: PF claim rejected with no reason given (Claim ID {ID})`; body uses `(...)` around the causes list |
| GR-013 | F | `subject` + `body` | em-dash form; body uses `—` around the causes list | `Grievance: PF claim rejected, stated reason unclear (Claim ID {ID})`; body uses `(...)` around the causes list |

This is **case #2 in the expert's "Suspected existing bugs" section** (`test-matrix.md`) — a
uniform colon/parenthetical-vs-em-dash drift across all 6 grievance variants, consistent with a
deliberate STE-friendly copy-editing pass that was never back-ported into the spec document. Not
a functional break (meaning is unchanged either way) — a documentation-sync question: which
document is actually correct now, spec or implementation?

## Passed (125)

Every other area passed cleanly, including all of today's new `rejection_date`/`basis` wiring
(`deadline-basic`, `deadline-suppression`, and the corresponding `post-rejection-flow` /
`grievance` cases), every rule-code branch, wait-band boundary, priority-ranking case, schema
cross-field validation (including the new `rejection_date < filing_date` guard), and pre-filing
readiness outcome.

## Not covered by this run

Two other categories of findings exist outside this mechanical pass — see
`Engineering/QA/test-matrix.md`'s own sections for detail, and
`Engineering/QA/execution-report-manual-trace.md` for the UI-copy trace:

- **8 UI-copy cases (MT-01–MT-08)** — not machine-executable (require reading rendered
  React/JSX output), executed separately by trace.
- **4 additional "suspected bugs"** the expert flagged as product-judgment calls rather than
  hard pass/fail assertions (their `expected` values intentionally don't encode a single
  objectively-correct answer):
  - Bug #1, the `basis: "today"` grievance citation's "without a resolution communicated to
    me" self-contradiction — **fixed 2026-09-02** in `lib/rule-engine/grievance.ts`
    (`deadlineCitation`), reworded to "I have not been able to confirm my exact rejection
    date," matching the hedge `DeadlineCard`'s UI copy already used correctly.
  - Bugs #3/#4, the undocumented multi-code grievance tie-break and a Tier2-`not_applicable`
    code silently suppressing a valid secondary grievance — **ticketed**, not fixed this
    session: `Engineering/tickets/19-multi-code-grievance-suppression.md`. Includes research
    on real-world plausibility and EPFiGMS's one-category-per-ticket structure, which reframes
    the fix as "surface every applicable grievance, fix-first order" rather than picking a
    single winner.
  - Bug #5, the missing server-side date-plausibility guard — **fixed 2026-09-02** in
    `lib/rule-engine/schema.ts` (`validatePostRejectionCrossFields`), mirroring
    `dateInputError()`'s bounds (future-dated, or before 2001-01-01) server-side for
    `filing_date`, `rejection_date`, and `bank_kyc_submission_date`, with an injectable
    `today` param for deterministic tests (defaults to the server's real clock in
    production — the client can never supply its own "today" for this check, since that
    would let it bypass its own future-date guard).
