# 01 — Rule engine: code data + diagnosis logic

**Status:** Done (this session)

Traces to: `spec.md` US1. Rule logic source: `Rule Engine/Rule Engine Spec.md` §2–3.

## Scope
- `lib/rule-engine/types.ts` — shared types (`RuleCode`, `EntryPoint`, `SelfCheckAnswers`, `PostRejectionInput`, `PreFilingInput`).
- `lib/rule-engine/codes.ts` — the 7 codes as typed data: id, trigger description, explanation copy, fix copy. Includes Code 1's two branches (standard mismatch vs. portal-sync-bug) and Code 6/7's distinct shapes.
- `lib/rule-engine/waitBands.ts` — working-day calculation (Mon–Fri only; does not account for public holidays — flagged inline) and the 3-band lookup for Code 3, carrying forward the Section 9/gap-1 caveat that bands 1–2 are secondary-sourced.
- `lib/rule-engine/diagnose.ts` — given selected code(s) + branching inputs, returns per-code explanation/fix, resolving Code 1's branch and Code 3's band; runs Code 7's self-check sub-flow per spec §3.

## Analytics
None fired directly by this module — `codes_selected` / `self_check_submitted` / `diagnosis_shown` are fired by the API layer (ticket 06), which is the request/response boundary.

## Done means
- Vitest coverage for: all 7 codes' happy path, Code 1's both branches, Code 3's 3 bands (boundary cases at 7/8/15/16 working days), Code 7's clean-vs-issue-vs-unsure self-check paths.
- No network/DB dependency — pure functions, unit-testable in isolation.
