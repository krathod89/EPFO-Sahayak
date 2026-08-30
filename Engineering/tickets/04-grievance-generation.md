# 04 — Grievance-text generation (H13)

**Status:** Done (this session)

Traces to: `spec.md` US4. Rule logic source: `Rule Engine/Rule Engine Spec.md` §6.

## Scope
- `lib/rule-engine/grievance.ts` — builds Variants A–E exactly as drafted in the spec, substituting `{UAN}`, `{CLAIM_ID}`, `{CODE_NAME}`, `{TODAY_DATE}` placeholders, and appending the deadline-citation block only when the deadline check (ticket 03) returned `MISSED`. Variant selection logic: A (standard, Codes 1/2/4/5), B (Code 3 + Band 3 only — no grievance for Bands 1–2), C (Code 1 portal-sync-bug branch), D (Code 6), E (Code 7, all self-checks clean).
- Requires `uan` and `claim_id` to be present (per spec §2, both are "optional for diagnosis, required for grievance text") — if either is missing, return a result indicating the grievance step needs them rather than emitting a template with empty placeholders.

## Analytics
Fired by the API layer (ticket 06): `grievance_generated` (`variant`, `deadline_cited`). Note `grievance_copied` fires from the frontend directly (client-side clipboard action), not from this module or the API response — see `analytics.md`.

## Done means
- Vitest coverage for all 5 variants, the deadline-citation block appended/omitted correctly, Band 1/2 producing no grievance text, and the missing-UAN/claim-ID guard.
