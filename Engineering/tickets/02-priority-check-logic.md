# 02 — Priority-check logic (H10)

**Status:** Done (this session)

Traces to: `spec.md` US2. Rule logic source: `Rule Engine/Rule Engine Spec.md` §4.

## Scope
- `lib/rule-engine/prioritize.ts` — implements the decision table exactly: Tier 1 (Code 2, Code 5) before Tier 2 (Code 3, Code 1); within Tier 2, Bank KYC before Name/DOB; Code 4 always shown unranked; single-code selections skip ranking entirely.

## Analytics
Fired by the API layer (ticket 06): `diagnosis_shown` carries `priority_ranked`, `tier1`, `tier2`, `unranked`.

## Done means
- Vitest coverage for every row of the decision table in Rule Engine Spec §4, including: single code (no ranking), both Tier 1 codes together (unranked relative to each other), both Tier 2 codes together (KYC before mismatch), Code 4 alongside another code (shown unranked, not silently dropped).
