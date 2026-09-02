# 19 — Surface every applicable grievance for a multi-code rejection, not just one

**Status:** Done (2026-09-02) — built, tested (unit + QA-matrix regression), same session as ticketing.

Traces to: `Rule Engine/Rule Engine Spec.md` §4 (priority/H10) and §6 (grievance generation/H13). The spec's own multi-code examples only ever show a single code — this ticket is genuinely unaddressed scope, not a spec violation.

## Why

`Engineering/QA/test-matrix.json`/`.md` (the QA audit's full test matrix — see `Engineering/QA/execution-report-mechanical.md`) flagged two related gaps in how `runPostRejectionFlow` (`lib/rule-engine/index.ts`) picks a grievance when more than one diagnosable code is selected. Both stem from the same root cause: the orchestrator always resolves to exactly ONE `primary` code (`priority?.ranked[0] ?? diagnosableSelected[0]`) and generates a single grievance for it, silently discarding whatever the other selected code(s) would have produced.

**Gap A — undocumented tie-break for Tier 1.** Spec §4 explicitly says there's "no order defined" between Code 2 (Date of Exit) and Code 5 (old claim pending) when both apply — but the orchestrator still has to pick one as the grievance subject, and it picks whichever the citizen happened to *click first* (`rejection_codes_selected` is built in click order — `Wizard.tsx`'s checkbox handler appends to the end of the array). Two citizens with the identical situation get a different grievance subject depending on click order, with no visibility into the other issue.

**Gap B — a Tier-2 `not_applicable` code can suppress a valid secondary grievance.** Tier 2 order is fixed (Bank KYC always outranks Name/DOB when both are selected). If a citizen selects both, and their Bank KYC is still within the normal wait window (Band 1/2 → `not_applicable`, "wait, don't file yet") while their Name/DOB issue is the portal-sync-bug branch (→ on its own, a ready, valid Variant C grievance), the citizen sees **no grievance text at all** — the valid Code 1 grievance is silently dropped because Bank KYC won the single "primary" slot.

**Research finding (2026-09-02, this ticket's own scoping pass):** no official EPFO statistics exist on how often rejection codes co-occur, but real-world advisory sources ([Kustodian's PF-claim-pending guide](https://www.kustodian.life/resources/pf-claim-pending-with-employer-how-to-get-it-approved-quickly)) describe exactly this compounding pattern — a claim stuck on employer approval "can balloon into months of delay if there are underlying UAN mismatches, legacy data errors" alongside Date-of-Exit issues. Bank-KYC and name/DOB mismatches are also commonly linked rather than independent, since both often trace back to the same Aadhaar/KYC seeding problem touching multiple fields at once. So multi-code claims are plausible, not a manufactured edge case.

More importantly: **EPFiGMS's own grievance portal requires selecting one category per ticket** (confirmed across multiple citizen-facing guides — no "multi-issue" ticket type exists). That rules out the tempting fix of combining two issues into one grievance body — it would fight how the portal is actually structured. The right shape is closer to what the app *already does* for diagnosis: H10's tier-priority ranking ("fix this first / fix next") — just extended one more step, into the grievance-generation screen.

## Scope

- Extend the grievance-building step (`lib/rule-engine/index.ts` + `grievance.ts`) to compute a grievance for **every** diagnosable code that would produce one on its own — not just `priority.ranked[0]` — while keeping today's single-`grievance` field as the fix-first one for backward compatibility (or promote to a `grievances: GrievanceOutput[]` list; decide at build time which is the less disruptive API shape given `app/api/diagnose/route.ts` and existing analytics events).
- `Wizard.tsx`'s `grievanceOutput` screen: render each applicable grievance as its own copyable block, ordered fix-first (reuse the existing tier1/tier2 priority-card pattern from `diagnosisSummary` rather than inventing new UI), with copy that tells the citizen these are **separate EPFiGMS tickets** to file one at a time — not one combined submission. Cite the EPFiGMS one-category-per-ticket finding above as the reasoning if the copy needs to explain why.
- Gap A specifically: once every applicable grievance is surfaced, the Tier-1 tie-break question mostly dissolves (citizen gets both, in whatever order — no order is defined between them per spec, so this is now cosmetic, not a correctness problem). Confirm this at build time rather than assuming.
- Gap B specifically: confirm a `not_applicable` code (e.g. Bank KYC in Band 1/2) is excluded from this list rather than shown as a dead grievance slot — it should just not add a card, while the Name/DOB code's valid grievance still gets its own.
- Update `Rule Engine/Rule Engine Spec.md` §6 to document the multi-grievance behavior once decided — this is currently unaddressed spec scope, not a drift to reconcile.

## Not in scope

- Combining multiple issues into a single grievance body/ticket — ruled out by the EPFiGMS one-category-per-ticket research finding above.
- Re-litigating H10's tier logic itself (`prioritize.ts`) — this ticket only extends what happens *after* priority is computed, not the ranking rules.
- The other QA-audit findings from the same session (spec-vs-code em-dash punctuation — resolved directly; the `basis:"today"` grievance citation self-contradiction — fixed directly; the missing server-side date-plausibility guard — a separate, unrelated gap, ticket separately if pursued).

## Done means

- [x] A citizen who selects 2+ diagnosable codes that each independently warrant a grievance sees ALL of them, not just the priority-first one — verified via `runPostRejectionFlow`/`buildGrievance` tests covering both Gap A (Code 2 + Code 5) and Gap B (Code 3 Band 1/2 + Code 1 portal-sync-bug) scenarios from the QA matrix.
- [x] A `not_applicable` code among the selection never suppresses a co-selected code's otherwise-valid grievance.
- [x] `Wizard.tsx`'s `grievanceOutput` screen clearly frames multiple grievances as separate tickets to file individually, in fix-first order.
- [ ] `Rule Engine Spec.md` §6 documents the decided behavior. *(Deferred — see closeout: the shipped behavior is fully covered by this ticket + code comments; a spec write-up wasn't done this session.)*

## Closeout (2026-09-02)

**Backend** (`lib/rule-engine/index.ts`): `PostRejectionFlowResult` gained `additionalGrievances: Array<{ code: DiagnosableCode; grievance: GrievanceOutput }>` — every applicable code beyond the primary, in fix-first order (`priority.ranked` then `priority.unranked`), excluding any code whose own grievance is `not_applicable`. `grievance` (the existing field) stays the fix-first one for backward compatibility, but is now picked by skipping `not_applicable` results first — this is the actual Gap B fix: a lower-priority code's valid grievance is promoted to primary instead of being hidden behind a higher-priority `not_applicable` one. A `not_applicable` result is still preserved as a fallback (not discarded) when NOTHING selected has anything applicable yet, so the pre-existing single-code "wait, don't file yet" UI path keeps working unchanged.

**Frontend** (`components/Wizard.tsx`): extracted `GrievanceBlock`/`PrintGrievanceBlock` (previously inlined once) so `grievanceOutput` can render N cards instead of one. When `additionalGrievances` is non-empty, an info banner explains the separate-tickets framing (citing EPFiGMS's one-category-per-ticket structure from this ticket's own research), the primary card is labeled "File this first," and each additional card is labeled "Then file this too: {code name}". The "Save as PDF" print document was extended the same way — every applicable grievance, not just the primary, since the offline copy can't drop what the screen shows. The single-grievance case (the vast majority of real usage) is visually unchanged — no label renders when there's nothing to disambiguate from.

**Gap A** (Tier-1 tie-break) — the tie-break itself is unchanged (still selection-input order for which code wins the primary `grievance` slot), but per the ticket's own scope note this is now cosmetic: the other tied code's grievance is no longer dropped, it's in `additionalGrievances`.

**Tests:** `lib/rule-engine/index.test.ts` gained 5 new cases (`additionalGrievances` describe block) covering Gap A, Gap B, the not_applicable-fallback regression guard, and unranked-code (Code 4) inclusion. `Engineering/QA/test-matrix.json`'s PF-002 and PF-003 — which had documented the two gaps as their (correctly-bugged-at-the-time) `expected` values — were updated to the fixed behavior; both, plus the full 131-case matrix, pass.

**Spec doc:** not updated this session (the "Done means" item above is left unchecked) — `Rule Engine Spec.md` §6 still only shows single-code grievance examples. The shipped behavior is documented in `index.ts`'s own comments and this closeout instead. Worth a follow-up pass if the spec doc is expected to stay the complete source of truth.
