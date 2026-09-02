# Manual-trace execution report — UI-copy cases (MT-01 through MT-08)

Traced against `components/Wizard.tsx` as it exists on branch `fix-priority-order-and-source-links`. Static source trace only — no `npm test`/`npm run dev`/browser tooling used, no files modified.

## Results

- MT-01 — PASS
- MT-02 — PASS
- MT-03 — FAIL (fixed 2026-09-02, see below)
- MT-04 — PASS
- MT-05 — PASS
- MT-06 — PASS
- MT-07 — PASS
- MT-08 — PASS

**Original run: 7 / 8 PASS, 1 / 8 FAIL (MT-03). MT-03 fixed same day — now 8 / 8.**

**MT-03 fix (2026-09-02):** `components/Wizard.tsx`'s `basis:"today"`+`NOT_YET_DUE` body was
rewritten from the one-directional "so EPFO settling on time is still possible" to a neutral
conditional mirroring MT-04's already-correct branch: "...but we don't know if EPFO already
missed it, since this isn't based on your actual rejection date. If EPFO rejected you on or
before {deadlineDate}, they met it." Also addressed additional observation #1 below in the
same edit (the "That date is more than N day(s) ago" ambiguous referent → "That deadline
passed N day(s) ago").

---

## MT-01 — DeadlineCard, confirmed-met — PASS

Traced `DeadlineCard` (`components/Wizard.tsx:825-871`), `confirmed` branch (`missed=false`, `confirmed=true`, line 842-846). Heading resolves to `"EPFO settled within its deadline"` (line 843, no-hedge branch); body reads "You filed on August 1, 2026 and EPFO rejected your claim on August 3, 2026. Because your KYC was complete when you filed, EPFO had to settle within 3 days, by August 4, 2026. That's within the deadline." (line 846) — names both dates, states the 3-day rule and computed deadline date, states plainly EPFO acted within it, no "still has time"/still-open language, and `missed=false` selects the green treatment (line 857-862). All bullets satisfied.

## MT-02 — DeadlineCard, confirmed-missed — PASS

Same function, `confirmed` branch, `missed=true` (line 845). Heading `"EPFO missed its own deadline"` (no hedge). Body: "...EPFO missed this deadline by 4 day(s) before rejecting." — states the 4-day miss as a plain confirmed number. The `missed`-gated box (lines 863-867) states "You may be owed 12% penalty interest on your claim amount for this delay. Ask for this by name when you file your grievance." — states the entitlement and instructs naming it in the grievance. Red treatment applies (`missed=true`), and `DeadlineRuleSources` (line 868, defined 751-761) unconditionally renders both the PIB notification link and the EPFO FAQ link regardless of tone. All bullets satisfied.

## MT-03 — DeadlineCard, estimated-met — FAIL

**Bullet violated:** "must not imply EPFO 'still has time' as a guaranteed fact (per deadline.ts's own doc comment: "'today' NOT_YET_DUE does not mean 'EPFO still has time,' it means 'we don't know if EPFO already missed it'")."

**Actual code** (`components/Wizard.tsx:853`, the `basis:"today"`/`NOT_YET_DUE` body branch):

```
`You filed your claim on ${fmtIsoDate(filingDate)}. ${kycClause} As of today, that deadline hasn't passed yet — so EPFO settling on time is still possible. This isn't based on your actual rejection date, since we don't have it.`
```

Rendered for the given input: "You filed your claim on August 1, 2026. Because your KYC was not complete when you filed, EPFO had to settle within 20 days, by August 21, 2026. As of today, that deadline hasn't passed yet — **so EPFO settling on time is still possible.** This isn't based on your actual rejection date, since we don't have it."

**Mismatch:** the clause "so EPFO settling on time is still possible" is a reworded restatement of exactly the framing `deadline.ts`'s own doc comment says is wrong — it leans the reader toward the hopeful "still has time to be fine" direction, rather than the doc comment's required neutral framing ("we don't know if EPFO already missed it"). Grammatically it is hedged with "possible" rather than asserted as certain, so it stops short of a literal "guaranteed fact" claim — but it is directionally one-sided (implying the good outcome is the live possibility) instead of neutral/50-50 the way MT-04's parallel branch is (see below), which is the actual thing this bullet is testing for. The final sentence ("This isn't based on your actual rejection date, since we don't have it.") does correctly satisfy the other half of the bullet (say the rejection date isn't on record / this is an estimate), so only the "still has time" framing itself is at fault.

For contrast: MT-04's analogous branch (line 852) phrases its uncertainty as a genuinely neutral conditional — "if EPFO rejected you after {deadline date}, they missed their own deadline" — never leaning toward either outcome. MT-03's branch has no equivalent neutral construction; it states the positive outcome as "still possible" without ever pairing it with the equally-true "or they may have already missed it, we can't tell" framing the doc comment calls for.

**Bullets 1 and 3 pass:** heading (line 850) is `"EPFO's deadline hasn't passed yet, as of today"` — explicitly hedges with "as of today," doesn't claim a confirmed positive outcome. Green treatment applies (`missed=false`), and the copy itself does carry a hedge (just not the specific "not guaranteed" framing bullet 2 requires).

## MT-04 — DeadlineCard, estimated-missed — PASS

Same function, `basis:"today"` + `missed=true` branch (line 852). Heading `"EPFO's deadline has likely passed"` (line 850) — hedged, matches the required "likely passed" wording exactly. Body: "...That date is more than 4 day(s) ago. We don't know your exact rejection date, so this is based on today — **if EPFO rejected you after August 21, 2026, they missed their own deadline.**" — phrases the miss as an explicit conditional, matching the bullet's required "if EPFO rejected you after {deadline date}, they missed it" pattern almost verbatim; never asserts the miss as settled fact. The same `missed`-gated penalty box as MT-02 renders, hedged with "You may be owed..." — satisfies "surface as something to check for / potentially claim, not confirmed." Reads clearly distinct from MT-02's confirmed-missed copy (definite heading/body vs. hedged heading + conditional body). All bullets satisfied.

## MT-05 — Self-check "double-check before filing" recap box — PASS

Traced the `selfCheckUnsuresOnly` block (`components/Wizard.tsx:1921-1922`, rendered 1964-1988) against `SELF_CHECK_UI_ITEMS` (lines 192-223). For Code 7 with `eps_history_continuous` and `old_claim_pending` both `"unsure"` and the rest in their pass direction: `selfCheck.issueEntries.length === 0` and `unsureItems.length === 2`, so `selfCheckUnsuresOnly = true`. Heading (line 1946) is exactly `"Double-check these items before your next step"`. The list (lines 1970-1981) iterates `selfCheck.unsureItems`, rendering each item's `question` and `hint` (line 1976-1977) — for the two items in question, this is exactly "Is your EPS contribution history continuous, with no zero or missing periods?" / "Check your EPFO passbook for any periods showing ₹0 or blank EPS entries." and "Do you have an old PF claim (Form 19 / 10C / 31) that is still pending?" / "Check your claim history on the UAN portal." — both required question+hint pairs, only those two items (the 3 answered items aren't in `unsureItems`). Closing line (1983-1985): "Double-check these before filing a grievance. If any of them turns out to be an issue, restart and select the relevant reason." — matches the required closing instruction. All bullets satisfied.

## MT-06 — Readiness result "double-check" recap box — PASS

Traced the `result.unsureItems.length > 0` block (`components/Wizard.tsx:2276-2294`) plus the status banner (2223-2266). For `doe_marked: "unsure"` only (all else pass): `M = 1`, `status = "mostly"`. Banner heading (line 2256): `` `Mostly ready: double-check ${M} thing${M > 1 ? "s" : ""}` `` → renders exactly "Mostly ready: double-check 1 thing", with amber classes (`bg-amber-50 border-amber-200`, `text-amber-800`) — not green/red. Recap header (line 2278): `` `Double-check ${result.unsureItems.length === 1 ? "this" : "these"} before filing:` `` → renders exactly "Double-check this before filing:" (singular, since 1 item). List renders `doe_marked`'s question ("Has your former employer marked your Date of Exit in EPFO's system?") and hint ("Check your EPFO member passbook or UAN portal under service history.") (lines 2286-2287). All bullets satisfied.

## MT-07 — filingDate / kycAtFiling: deadline copy suppressed for Codes 8/9 — PASS

Traced `suppressesDeadline` on both screens (`components/Wizard.tsx:1735` and `1800`, both `= s.selectedCodes.some((c) => DEADLINE_SUPPRESSED_CODES.includes(c))`). With Code 8 (or 9) selected, `suppressesDeadline = true` on both screens.

- `filingDate` subtitle (line 1742-1744): ternary selects "EPFO's settlement deadline and penalty rule don't apply here. We still ask for your filing date to keep your case details complete." — the normal "We'll check whether EPFO has already missed..." copy is not shown. The info box with the 3-day/20-day explainer + `DeadlineRuleSources` (lines 1772-1783) is wrapped in `{!suppressesDeadline && (...)}`, so it does not render at all.
- `kycAtFiling` RadioCards (lines 1820-1831): `sublabel={suppressesDeadline ? undefined : "..."}` on both options — no sublabel renders for either "Yes" or "No" option.
- The `rejection-date` input block (lines 1834-1863) is wrapped in `{!suppressesDeadline && (...)}` — does not render.

All three required-content bullets satisfied.

## MT-08 — diagnosisSummary subtitle override for Code 8 / Code 9 — PASS

Traced `DIAGNOSIS_SUMMARY_SUBTITLE_OVERRIDE` (lines 146-149) and `subtitleOverride` computation (lines 1885-1887), used in the subtitle ternary (line 1960: `... : (subtitleOverride ?? "This is not your fault. Here's the specific fix.")`). For Code 8 alone: not a self-check code, `showPriorityRanking` false (single exclusive code, no ranking needed) → falls through to `subtitleOverride`, which resolves to `"This is a genuine eligibility rule, not a records mismatch. Here's the specific fix."` — exact required text, and the default "not your fault" copy is not shown. Same mechanism for Code 9 resolves to `"This is a form-selection issue, not a records mismatch. Here's the specific fix."` — exact required text. Both bullets satisfied.

---

## Additional observations

Not covered by any of the 8 cases' explicit "Required content" bullets — noted, not fixed.

1. **RESOLVED (2026-09-02).** ~~MT-04's "That date is more than {daysLate} day(s) ago" (line 852) has an ambiguous/likely-wrong referent.~~ "That date" grammatically follows `kycClause`, whose last-mentioned date is the *deadline* date, not the filing date. For MT-04's own input (`deadlineDate = 2026-08-21`, evaluated `today_date = 2026-08-25`), the gap is exactly 4 days — so "more than 4 day(s) ago" is off by one (should read "4 days ago" or "at least"). This doesn't violate any of MT-04's four explicit bullets (none test this specific clause), but it's a real numeric/wording imprecision worth a look, and the same sentence pattern is reused for every `basis:"today"`+`MISSED` case, not just this one input.

2. **The 12%-penalty box (lines 863-867) is byte-for-byte identical regardless of `basis`.** It isn't conditioned on `confirmed`, only on `missed` — so MT-02 (confirmed miss) and MT-04 (estimated/conditional miss) show the exact same "You may be owed 12% penalty interest... Ask for this by name when you file your grievance." text. The shared "may be owed" hedge happens to satisfy both MT-02's "state the entitlement" bullet and MT-04's "surface as something to check for, not confirmed" bullet, but the box makes no distinction between "this delay is confirmed, here's your entitlement" and "if this delay turns out to be real, here's what to check for" — worth a product-owner look even though it isn't a bullet failure today.

3. **RESOLVED (2026-09-02) — was the root cause of the MT-03 failure.** ~~MT-03 and MT-04's parallel branches are not symmetric in how they handle uncertainty~~, which is the root cause of MT-03's failure above: MT-04's miss framing is an explicit neutral conditional ("if EPFO rejected you after X, they missed it"), while MT-03's met framing is a one-directional declarative ("so EPFO settling on time is still possible") with no equivalent "...or they may have already missed it" counterweight. Bringing MT-03's branch to the same conditional/neutral construction MT-04 already uses would likely resolve the MT-03 failure directly.
