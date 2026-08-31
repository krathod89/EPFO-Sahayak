# 14 — Capture EPFiGMS's real dropdown taxonomy for grievance generation

**Status:** Open

Traces to: `spec.md` US4. Rule logic source: `lib/rule-engine/grievance.ts` (source-of-truth gap already flagged inline: *"EPFiGMS's category-dropdown taxonomy was never captured. This module generates the free-text BODY only."*).

## Why

Confirmed during the coverage grill (2026-08-31) — you approved fixing this: grievance text (US4, H13) is the load-bearing hypothesis for the whole product, and it's currently generated as free text only. If EPFiGMS actually requires selecting from fixed dropdown category/subcategory values rather than accepting arbitrary free text, a citizen could produce well-worded body text that still gets filed under the wrong category — or can't be filed at all without picking something first. This is exactly the shape of gap that would poison Phase 2 (real volunteers testing their own case) before you'd learn it from real usage.

## Scope

1. **Capture the real taxonomy.** Visit `epfigms.gov.in`'s actual grievance-filing form (a real or test submission, or a screenshot walkthrough if a real filing isn't advisable) and record the exact category/subcategory dropdown structure — options, labels, and hierarchy.
2. **Map each of the 7 (soon 8, see ticket 10) rule codes to the correct dropdown value(s)** — a lookup table, e.g. `lib/rule-engine/grievance.ts` or a new `epfigmsCategories.ts`, parallel to how `CODE_DEFINITIONS` already maps codes to plain-language copy.
3. **Extend `GrievanceOutput`** to carry the mapped category (not just `subject`/`body`) so the UI can tell the citizen exactly what to select before pasting the body text — closing the gap between "correctly worded" and "correctly filed."
4. **Update `Rule Engine/Rule Engine Spec.md` §6** — source of truth — with the captured taxonomy and mapping, so it's documented once rather than only living in code.

## Not in scope

- Auto-filing the grievance on the citizen's behalf (no API access to EPFiGMS exists or is being pursued) — this stays copy-and-paste, just with the category told to the citizen alongside the body text.

## Done means

- `grievance.test.ts` extended to assert each variant carries its correct mapped category.
- Manual cross-check: each of the (soon 8) codes' mapped category actually exists as a real selectable option on EPFiGMS's live form.
- `PRD.md` §10's "capture the actual EPFiGMS category/subcategory dropdown taxonomy" item checked off.
