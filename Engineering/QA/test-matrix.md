# EPFO Sahayak — Test-Case Matrix (companion to `test-matrix.json`)

Human-readable companion to `test-matrix.json`'s 131 machine-executable cases (132 array
entries including one `meta` documentation entry, `NOTES-000`). Every `expected` value in the
JSON was derived independently from `Rule Engine/Rule Engine Spec.md`, the numbered
`Engineering/tickets/*.md`, and real-world EPFO/EPFiGMS domain practice — **not** by running
the app and copying its output. Where the spec is silent and I had to use my own best-effort
judgment, the case is tagged `SPEC-GAP` in the JSON and called out below. Where I believe the
current implementation likely disagrees with my derived expected value, it's flagged in the
"Suspected existing bugs" section at the end.

Today's change under extra scrutiny: the new `rejection_date` field and `DeadlineBasis`
(`"rejection_date"` vs `"today"`) threading through `deadline.ts`, `index.ts`, `grievance.ts`,
and `Wizard.tsx`'s `DeadlineCard`. Covered in `deadline-suppression`, most of
`post-rejection-flow`, several `grievance` cases, and the manual-trace section below.

---

## meta

One non-test entry (`NOTES-000`) documenting two conventions used throughout the JSON: (1) the
task brief's assumed fn name `selfCheckResult` doesn't exist — the real export is
`bucketSelfCheck` (`lib/rule-engine/selfCheck.ts`), used for all `self-check-bucket` cases; (2)
raw JSON has no `undefined` literal, so `null` in an `expected` field (e.g. `"deadline": null`)
means "assert this field is `undefined`/absent on the real result," never a literal `=== null`
check.

---

## deadline-basic — `checkDeadline()` pure function (H11)

Direct unit tests of `lib/rule-engine/deadline.ts`'s `checkDeadline()`, independent of the
orchestrator. Spec Section 5: 3-day deadline if KYC was complete at filing, else 20 days,
calendar days (an explicit, flagged assumption — Section 9 gap 6), `<=` deadline date counts as
on time.

- **DL-001/DL-004** — exact-boundary date (the deadline day itself) is `NOT_YET_DUE` with 0 days remaining, for the 3-day and 20-day branches respectively.
- **DL-002/DL-005** — one calendar day before the boundary, still `NOT_YET_DUE`, 1 day remaining.
- **DL-003/DL-006** — one calendar day after the boundary, `MISSED` by exactly 1 day.
- **DL-007/DL-008** — reference date equal to filing date (zero elapsed time) — full 3/20-day allowance remaining.
- **DL-009** — month-boundary crossing (Jan 30 + 3 days lands correctly in February).
- **DL-010** — a large, multi-month miss (39 calendar days late), regression-checking calendar-day math over a long gap.
- **DL-011/DL-012** — `basis` is threaded straight through into the result, independent of the day-count math itself.
- **DL-013** — adversarial: a reference date before the filing date (shouldn't normally reach this pure function given schema.ts's guard, but must degrade gracefully, not throw). `SPEC-GAP`.
- **DL-014** — leap-year regression (2028's Feb 29 correctly counted in a 20-day calendar-day span).

## deadline-suppression — H11 suppression + `basis` wiring, via `runPostRejectionFlow()`

Tests the orchestrator-level wiring in `lib/rule-engine/index.ts`: `DEADLINE_SUPPRESSED_CODES`
(Codes 8/9 only — Spec Section 5) and today's new `rejection_date`-vs-`today_date` basis
fallback.

- **DS-001/DS-002** — Code 8 suppresses the deadline check entirely, with and without a `rejection_date` supplied.
- **DS-003/DS-004** — same suppression for Code 9.
- **DS-005** — a non-suppressed code with `rejection_date` given: deadline evaluated against the rejection date, `basis: "rejection_date"`.
- **DS-006** — same code/dates, no `rejection_date`: falls back to `today_date`, `basis: "today"`.
- **DS-007** — boundary: `rejection_date` equal to `filing_date` (schema-legal), full deadline allowance remaining.
- **DS-008** — Code 10 (ticket 10) does **not** suppress the deadline, unlike Codes 8/9 — the key differentiator this ticket establishes.

## diagnose-code1 — Name/DOB/father's-name mismatch branches

- **D1-001** — `not_verified` → standard-mismatch branch (Joint Declaration fix).
- **D1-002** — `unsure` → standard-mismatch branch (defaults to the less-severe branch).
- **D1-003** — `approved_and_verified` → portal-sync-bug branch (wait, don't file anything).

## diagnose-code3 — Bank KYC: joint account + wait-time bands (ticket 13, ticket 15)

- **D3-001** — joint account wins outright, independent of any submission date (ticket 15).
- **D3-002** — 5 working days → Band 1's upper boundary.
- **D3-003** — 6 working days → Band 2's lower boundary.
- **D3-004** — 10 working days → Band 2's upper boundary.
- **D3-005** — 11 working days → Band 3's lower boundary.
- **D3-006** — `bank_account_type: unsure` routes to the same band flow as `individual`.
- **D3-007** — weekend edge case (Saturday submission, checked the next day, a Sunday) — 0 working days, still Band 1.

## diagnose-code8 — Eligibility / service-period (ticket 16)

- **D8-001** — `under_six_months` branch.
- **D8-002** — `over_nine_half_years` branch.
- **D8-003** — `unsure` — its own honest third branch, not a default.

## diagnose-code9 — Wrong claim form filed (ticket 17)

- **D9-001..D9-004** — `full_settlement` / `pension_only` / `advance` / `unsure`, each its own branch.

## diagnose-simple-codes — Codes 2, 4, 5, 6 (no branching)

- **DM-001..DM-004** — Code 2 (DOE), Code 4 (EPS), Code 5 (old claim), Code 6 (approved not credited) each resolve to their single explanation/fix pair.

## diagnose-self-check — Codes 7 & 10's shared self-check sub-flow, via `diagnose()`

- **DC-001** — all checks clean → `allClean: true`.
- **DC-002** — single issue (Date of Exit).
- **DC-003** — two issues given out of checklist order — `issueEntries` must still come back in the checklist's own fixed order (index.ts relies on this for "first issue found").
- **DC-004** — bank-KYC-only issue resolves to the general (no-band) Code 3 text.
- **DC-005** — **regression case**: a self-check-routed Code 1 issue must carry `meta.branch: "standard_mismatch"` (the exact bug the 2026-09-02 source-link audit found and fixed in `resolveSelfCheckIssueCode`).
- **DC-006** — unsure-only (not treated as clean).
- **DC-007** — Code 10 triggers the identical bucketing mechanics as Code 7.

## prioritize — H10 tier logic, pure function

- **PR-001/PR-002** — degenerate inputs (single code, empty array) need no ranking.
- **PR-003** — two Tier1 codes (Code 2 + Code 5) — no defined order between them, input order preserved.
- **PR-004** — two Tier2 codes given in reverse — force-reordered to Bank KYC before Name/DOB regardless of selection order.
- **PR-005** — one Tier1 + one Tier2 code.
- **PR-006** — all 5 diagnosable codes together — full tier1/tier2/unranked/ranked shape.
- **PR-007** — Code 4 (EPS) alongside one ranked code — Code 4 always excluded from `ranked`.

## post-rejection-flow — `runPostRejectionFlow()` integration (priority + deadline + grievance dispatch)

- **PF-001** — single code, no ranking needed, normal deadline + Variant A grievance.
- **PF-002** — Tier1 tie (Code 5 + Code 2): grievance primary picked by selection-input order — `SPEC-GAP`, see bugs section.
- **PF-003** — Tier2 winner (Bank KYC, Band 1) has its own `not_applicable` grievance, silently dropping what a secondary code (Code 1 portal-sync-bug) would have offered alone — `SPEC-GAP`, see bugs section.
- **PF-004** — full 3-tier combination; priority order (not branch richness) drives which code's grievance is generated.
- **PF-005** — unranked Code 4 alongside a ranked code never wins the grievance-primary fallback.
- **PF-006** — Code 6 alone: no priority ranking (exclusive code), deadline still runs (not suppressed), Variant D.
- **PF-007** — Code 8: deadline suppressed, grievance `not_applicable`.
- **PF-008/PF-009** — `not_applicable` wins over `missing_info` even with uan/claim_id both absent (Codes 8, 9 — the exact ticket-17 regression fix).
- **PF-010** — same `not_applicable`-before-`missing_info` precedence for Code 3's joint-account branch.
- **PF-011/PF-012** — Code 1 standard vs. portal-sync-bug branches map to Variant A vs. Variant C respectively.
- **PF-013** — Code 7, all self-checks clean → Variant E, deadline still runs.
- **PF-014** — Code 7, two issues found → grievance subject is the FIRST issue in checklist order.
- **PF-015** — Code 7, the only issue found is bank KYC → grievance is entirely absent (not even `not_applicable`).
- **PF-016** — Code 7, unsure-only → no grievance (citizen hasn't actually ruled out the common causes).
- **PF-017/PF-018** — Code 10 mirrors Code 7's mechanics exactly, but with Variant F instead of E, and deadline NOT suppressed.
- **PF-019** — adversarial: bypasses schema validation to confirm the orchestrator's own documented exclusive-code dispatch order (Code 6 wins over Code 8) — `SPEC-GAP`, defensive-only.
- **PF-020/PF-021** — Bank KYC Bands 2 and 3 (`not_applicable` vs. ready Variant B).
- **PF-023/PF-024/PF-025** — deadline-citation presence (`deadlineCited`) tracks MISSED status only, independent of `basis`.
- **PF-026** — `rejection_date` equal to `filing_date` boundary, at the integration level.

## grievance — `buildGrievance()` direct unit tests (H13, Section 6)

- **GR-001** — Variant A exact body (Code 2), no citation. Subject asserted per spec's literal em-dash format — `SPEC-GAP` (see bugs section on likely em-dash/colon style drift).
- **GR-002/GR-003** — `missing_info` with one vs. both of uan/claim_id absent.
- **GR-004** — Variant B (Band 3) exact body, includes the submission date.
- **GR-005/GR-006** — Bands 1/2 → `not_applicable`.
- **GR-007** — joint-account → `not_applicable` even with uan/claim_id both absent (precedence check).
- **GR-008/GR-009** — eligibility / wrong-form → always `not_applicable`.
- **GR-010** — Variant C (portal-sync-bug) exact body.
- **GR-011** — Variant D (approved-not-credited) exact body.
- **GR-012/GR-013** — Variant E vs. Variant F exact bodies, given side by side so the "must not reuse Variant E's wording" requirement (spec Section 3, Code 10) is trivially diffable.
- **GR-014** — MISSED, `basis: "rejection_date"` — citation should state the miss as confirmed fact.
- **GR-015** — MISSED, `basis: "today"` — citation should hedge, not assert the miss as fact. Flagged as a likely **real bug** in the current wording — see bugs section.
- **GR-016** — NOT_YET_DUE never gets a citation, regardless of basis.
- **GR-017/GR-018** — `suggestedCategory`: Code 4 → "Pension Settlement", everything else → "PF Withdrawal".

## schema-validation — `validatePostRejectionCrossFields()` (Section 2 required-conditional fields)

- **SC-001** — Code 1 missing `namedob_kyc_page_status`.
- **SC-002** — Code 1 fully satisfied → no errors.
- **SC-003** — Code 3 with `bank_account_type` entirely absent fires TWO errors simultaneously (account-type AND submission-date guards both trip).
- **SC-004** — Code 3, `individual`, missing submission date.
- **SC-005** — Code 3, `joint` → submission date NOT required, no errors.
- **SC-006/SC-007** — Code 7 / Code 10 missing `self_check_answers`.
- **SC-008** — Code 8 missing `eligibility_issue_type`.
- **SC-009** — Code 9 missing `withdrawal_intent`.
- **SC-010** — Code 7 + Code 8 together → exclusivity error.
- **SC-011** — Code 6 + Code 2 (exclusive + normal code) → exclusivity error.
- **SC-012** — literal duplicate code → duplicate error.
- **SC-013** — `rejection_date` before `filing_date` → error.
- **SC-014** — `rejection_date` equal to `filing_date` → no error (boundary allowed).
- **SC-015** — a fully-valid multi-code request → no errors.
- **SC-016/SC-017** — two more distinct exclusive-pair combinations (Code 9+10, Code 6+7) for broader exclusivity coverage.
- **SC-018** — an implausible filing date (1990) passes cross-field validation with no error — documents a real server-side gap versus the client's `dateInputError()` bounds. `SPEC-GAP`, see bugs section.

## pre-filing-readiness — `runPreFilingFlow()` (H14, Section 7)

- **RD-001** — all pass → `ready`.
- **RD-002** — all issue → `issues_found`, all 5 in checklist order.
- **RD-003** — single Code 1 issue must use the standard-mismatch branch only (no portal-sync-bug pre-filing).
- **RD-004** — unsure-only → `mostly_ready`.
- **RD-005** — mixed issue + unsure → `issues_found` wins (N takes priority over M).
- **RD-006** — isolated `old_claim_pending` polarity-flip check.
- **RD-007** — all 5 unsure → `mostly_ready`, full unsure list.
- **RD-008** — bank-KYC pre-filing issue uses the general (no-band) text.

## self-check-bucket — `bucketSelfCheck()` pure function (lowest-level bucketing)

- **CK-001/CK-002** — all-pass / all-issue, exact bucket arrays in checklist order.
- **CK-003** — genuinely mixed (1 issue, 1 unsure, 3 pass).
- **CK-004/CK-005** — the `old_claim_pending` polarity flip proven from both directions (all "yes" vs. all "no") — a pair, so the flip's correctness doesn't depend on which literal answer value is used.

---

## UI-copy (manual-trace)

These are **not** in the JSON — they require reading rendered React output, not calling a pure
function. Each entry gives the exact input state, the semantic content the copy is REQUIRED to
convey (not necessarily a verbatim string — judge the rendered copy against these requirements),
and which component/function to trace it against.

### MT-01 — DeadlineCard, confirmed-met (`basis: "rejection_date"`, `NOT_YET_DUE`)

**Trace against:** `components/Wizard.tsx`, function `DeadlineCard` (~line 825).
**Input state:** `filingDate="2026-08-01"`, `kycComplete=true`, `rejectionDate="2026-08-03"`, `deadline={status:"NOT_YET_DUE", basis:"rejection_date", deadlineDays:3, deadlineDate:"2026-08-04", daysRemaining:1}`.
**Required content:**
- Heading must assert the outcome as a settled, confirmed fact (e.g. "EPFO settled within its deadline") — no hedging language ("estimate," "as of today," "if").
- Body must name both the citizen's filing date AND the actual rejection date (both are known here), state the 3-day rule and the computed deadline date, and say plainly that EPFO acted within it.
- Must NOT say anything implying the claim is still open or that EPFO "still has time" — a rejection has already happened; the correct framing is past tense ("EPFO settled...", not "EPFO still has X days").
- Green/positive visual treatment (not the red "missed" styling).

### MT-02 — DeadlineCard, confirmed-missed (`basis: "rejection_date"`, `MISSED`)

**Trace against:** same component/function.
**Input state:** `filingDate="2026-08-01"`, `kycComplete=false`, `rejectionDate="2026-08-25"`, `deadline={status:"MISSED", basis:"rejection_date", deadlineDays:20, deadlineDate:"2026-08-21", daysLate:4}`.
**Required content:**
- Heading must assert the miss as fact (e.g. "EPFO missed its own deadline") — no hedging.
- Body must state the exact number of days late (4) as a confirmed number, not a range or estimate.
- Must state the 12% penal-interest entitlement, and instruct the citizen to name it explicitly when filing the grievance.
- Red/warning visual treatment, with the official-source citation links (PIB notification + EPFO FAQ) present.

### MT-03 — DeadlineCard, estimated-met (`basis: "today"`, `NOT_YET_DUE`)

**Trace against:** same component/function.
**Input state:** `filingDate="2026-08-01"`, `kycComplete=false`, `rejectionDate=null` (not provided), `deadline={status:"NOT_YET_DUE", basis:"today", deadlineDays:20, deadlineDate:"2026-08-21", daysRemaining:11}`, evaluated as of `today_date="2026-08-10"`.
**Required content:**
- Heading must NOT claim a confirmed positive outcome — must explicitly hedge with "as of today" or equivalent, since the real rejection date is unknown.
- Body must explicitly say the citizen's actual rejection date is not on record, and that this is an estimate based on today's date standing in for it — must not imply EPFO "still has time" as a guaranteed fact (per deadline.ts's own doc comment: "'today' NOT_YET_DUE does not mean 'EPFO still has time,' it means 'we don't know if EPFO already missed it'").
- Green/positive visual treatment is acceptable, but the copy itself must carry the hedge.

### MT-04 — DeadlineCard, estimated-missed (`basis: "today"`, `MISSED`)

**Trace against:** same component/function.
**Input state:** `filingDate="2026-08-01"`, `kycComplete=false`, `rejectionDate=null`, `deadline={status:"MISSED", basis:"today", deadlineDays:20, deadlineDate:"2026-08-21", daysLate:4}`, evaluated as of `today_date="2026-08-25"`.
**Required content:**
- Heading must hedge ("likely passed," not "EPFO missed its deadline" stated flatly).
- Body must phrase the miss CONDITIONALLY: "if EPFO rejected you after {deadline date}, they missed it" — never assert the miss as a settled fact, since the actual rejection could have happened well before the deadline and the citizen simply hasn't checked back until now.
- Must still surface the 12% penalty as something the citizen should CHECK for / potentially claim, not something confirmed.
- Confirm this reads distinctly from MT-02's confirmed-missed copy — a citizen should not come away equally certain from both.

### MT-05 — Self-check "double-check before filing" recap box (post-rejection, Code 7/10 path)

**Trace against:** `components/Wizard.tsx`, `diagnosisSummary` screen, the block gated on `selfCheckUnsuresOnly` (~line 1964), rendering `selfCheck.unsureItems` against `SELF_CHECK_UI_ITEMS` (~line 192).
**Input state:** Code 7 selected, `self_check_answers` with `eps_history_continuous: "unsure"` and `old_claim_pending: "unsure"`, all others `yes`/`no` in their pass direction.
**Required content:**
- Heading: "Double-check these items before your next step" (or equivalent — must not claim the diagnosis is final).
- Must list exactly 2 items, matching `eps_history_continuous` and `old_claim_pending`'s question text from `SELF_CHECK_UI_ITEMS`.
- Each listed item MUST show its `hint` text beneath the question — for `eps_history_continuous`: "Check your EPFO passbook for any periods showing ₹0 or blank EPS entries."; for `old_claim_pending`: "Check your claim history on the UAN portal."
- Must NOT include any of the 3 answered (yes/no) items in this list.
- Must carry a closing instruction to double-check before filing a grievance, and to restart and pick the relevant reason if an unsure item turns out to be a real issue.

### MT-06 — Readiness result "double-check" recap box (pre-filing path)

**Trace against:** `components/Wizard.tsx`, `readinessResult` screen, the block gated on `result.unsureItems.length > 0` (~line 2276).
**Input state:** pre-filing path, `self_check_answers` with `doe_marked: "unsure"` only, all others in pass direction.
**Required content:**
- Header states "Double-check this before filing:" (singular phrasing since exactly 1 item).
- Lists `doe_marked`'s question text and its hint ("Check your EPFO member passbook or UAN portal under service history.").
- The overall result banner above it must read "Mostly ready: double-check 1 thing" (or equivalent), amber/warning styling, not the green "ready" or red "issues" treatment.

### MT-07 — filingDate / kycAtFiling screens: deadline copy suppressed for Codes 8/9

**Trace against:** `components/Wizard.tsx`, `filingDate` screen (~line 1728) and `kycAtFiling` screen (~line 1795), both gated on `suppressesDeadline = s.selectedCodes.some(c => DEADLINE_SUPPRESSED_CODES.includes(c))`.
**Input state:** Code 8 (or Code 9) selected, en route to the `filingDate` screen.
**Required content:**
- `filingDate` screen's subtitle must read the suppressed variant ("EPFO's settlement deadline and penalty rule don't apply here...") — must NOT show the normal "We'll check whether EPFO has already missed its own deadline..." copy, and the info box with the 3-day/20-day explainer + source links must not render at all.
- `kycAtFiling` screen's two RadioCard options must have NO sublabel at all (not "EPFO's 3-day deadline applies" / "...20-day deadline applies") — this was a real, ticket-16-documented bug (4 UI bugs found from this exact suppression gap) and is worth re-confirming stays fixed.
- The `rejection-date` input (today's new field) must not render at all on the `kycAtFiling` screen for these codes, since it exists purely to feed a deadline check that doesn't apply here.

### MT-08 — diagnosisSummary subtitle override for Code 8 / Code 9

**Trace against:** `components/Wizard.tsx`, `DIAGNOSIS_SUMMARY_SUBTITLE_OVERRIDE` (~line 146) and its use in the `diagnosisSummary` screen (~line 1960).
**Input state:** Code 8 (`eligibility_issue_type: "under_six_months"`) selected alone.
**Required content:**
- Subtitle must read "This is a genuine eligibility rule, not a records mismatch. Here's the specific fix." — must NOT show the default "This is not your fault. Here's the specific fix." (Spec Section 3, Code 8's own framing note: this code is usually NOT a "not your fault" case, and the default copy would directly contradict `codes.ts`'s own `CODE_8_BRANCHES` explanation text.)
- Same check for Code 9 with its own override text ("This is a form-selection issue, not a records mismatch...").

---

## Suspected existing bugs

Ranked roughly by confidence/severity, high to low.

1. **`grievance.ts`'s `deadlineCitation()` for `basis: "today"` + `MISSED` contains a likely factual self-contradiction** (case: GR-015). The exact literal text (read from `lib/rule-engine/grievance.ts`, function `deadlineCitation`) asserts: *"As of today, more than {N} days have passed since filing **without a resolution communicated to me**."* — as an unconditional statement — followed a sentence later by conditional language about "my rejection." But this citation only ever appears in a **post-rejection** grievance: the citizen has, by construction, already received a rejection (a resolution) from EPFO. Asserting "without a resolution communicated to me" is not hedged the way the rest of that same sentence's rejection-date claim is hedged — it directly contradicts the premise of the document it's embedded in (a grievance ABOUT a rejection already received), which risks reading as inconsistent or even dishonest in an actual government filing. Contrast with `Wizard.tsx`'s own `DeadlineCard` body for the identical `basis: "today"` + `MISSED` case (MT-04 above), which correctly avoids this — it says "We don't know your exact rejection date," never "no resolution was communicated." Recommend: fix `deadlineCitation()`'s `today`-basis wording to match the UI's already-careful hedge, e.g. replace "without a resolution communicated to me" with something like "and I have not been able to confirm my exact rejection date."

2. **Grievance subject-line punctuation appears to have drifted from the spec across every variant** (cases GR-001, GR-004, GR-010, GR-011, GR-012, GR-013 — all tagged `SPEC-GAP`). Spec Section 6's literal templates use an em-dash format throughout, e.g. `"Grievance regarding rejection of PF claim — {CODE_NAME}"` and `"Grievance — claim screen shows outdated mismatch... — Claim ID {CLAIM_ID}"`. The implementation (as read in `grievance.ts`'s `buildVariantContent`) consistently uses colon + parenthetical instead, e.g. `"Grievance regarding rejection of PF claim: ${kind.codeName}"` and `"...Approved and Verified (Claim ID ${claim_id})"`. This is uniform across all 6 variants — it reads as a deliberate late copy-editing pass (colons/parens are more Simplified-Technical-English-friendly than em dashes) that was never back-ported into the spec document. Not necessarily a functional bug (meaning is unchanged), but the spec is supposed to be the source of truth per the project's own ADR 0003 — worth a quick decision on which document is actually correct now, and updating the other to match.

3. **Multi-code grievance-primary selection has no documented tie-break, and the implementation's choice (selection-input order) isn't discoverable from the spec** (case PF-002, tagged `SPEC-GAP`). Spec Section 4 explicitly states Tier 1 has "no order defined" between Code 2 and Code 5 when both are selected together — but `index.ts` still has to pick exactly one of them as the SINGLE grievance's subject (an MVP simplification the spec doesn't address at all for multi-code grievances). The result: two citizens with the identical situation but who happened to click the two checkboxes in a different order get a different grievance subject line. Worth a product-owner decision — either document the input-order tie-break as intentional, or generate one combined grievance naming both tied issues.

4. **A Tier2-winning code with a `not_applicable` grievance (e.g. Bank KYC in Band 1/2) silently suppresses what a secondary code's OWN grievance would have offered** (case PF-003, tagged `SPEC-GAP`). Spec Section 6 has no language addressing multi-code grievance interactions at all. As built, a citizen with both "bank KYC still within normal wait time" (no grievance yet) AND a genuine Code 1 portal-sync-bug (which alone would generate a ready Variant C) gets ZERO grievance text, because Bank KYC out-ranks Name/DOB per H10 and "wins" the single-grievance slot — even though its own band doesn't warrant escalation yet. Worth flagging for product-owner review: should a not-yet-applicable primary fall back to a secondary code's valid grievance instead of showing nothing?

5. **`validatePostRejectionCrossFields`/`schema.ts` has no date-plausibility guard, unlike the client-side `dateInputError()`** (case SC-018, tagged `SPEC-GAP`). `lib/ui/date-validation.ts`'s `dateInputError()` rejects any date before 2001-01-01 or in the future — but this check exists only in the browser. A direct `POST /api/diagnose` call (or a future non-Wizard client) can submit `filing_date: "1990-01-01"` or a wildly future date with no server-side rejection; `isoDate` in `schema.ts` only checks the `YYYY-MM-DD` regex shape. Not a functional break today (the shipped UI always goes through `dateInputError()` first), but it's a defense-in-depth gap worth a documented decision — mirror the check server-side, or explicitly accept the risk given ADR 0002's stateless-MVP/no-auth posture.

---

## Summary

- **Total JSON cases:** 131 executable cases + 1 meta/notes entry = 132 array entries.
- **Area breakdown:** deadline-basic (14), deadline-suppression (8), diagnose-code1 (3), diagnose-code3 (7), diagnose-code8 (3), diagnose-code9 (4), diagnose-simple-codes (4), diagnose-self-check (7), prioritize (7), post-rejection-flow (25), grievance (18), schema-validation (18), pre-filing-readiness (8), self-check-bucket (5).
- **SPEC-GAP tagged:** 12 cases (DL-013; PF-002, PF-003, PF-019; GR-001, GR-004, GR-010, GR-011, GR-012, GR-013, GR-015; SC-018).
- **Manual-trace UI-copy cases:** 8 (MT-01 through MT-08), none machine-executable.
- **Suspected existing bugs:** 5, ranked by confidence — headlined by a likely factual self-contradiction in the new `basis: "today"` grievance deadline citation (item 1).
