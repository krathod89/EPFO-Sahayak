# ADR 0003 — Rule content lives in versioned TypeScript, not a database or CMS

**Status:** Accepted (2026-08-29)

## Context

`Rule Engine/Rule Engine Spec.md` §9 flags several rule-content items as unverified or provisional: the bank-KYC wait-time bands (secondary-sourced only, pending a primary Citizen Charter recheck), the calendar-vs-working-day assumption on the deadline rule, and the EPS-discrepancy code's unranked priority status. This content will change at least once as those gaps close.

## Decision

The 7 rejection/failure codes, their explanation/fix copy, the priority tiers, and the wait-time thresholds are implemented as typed data in `lib/rule-engine/codes.ts` and `lib/rule-engine/waitBands.ts` — plain TypeScript, reviewed and shipped like any other code change. **Not** a database table, and not an admin-editable CMS.

## Rationale

- This content changes rarely (a handful of times before launch, as open research gaps close) and needs a developer's judgment to change correctly — a wrong wait-time band or a mis-stated deadline rule is a citizen-facing factual claim, not a copy tweak. Git review is the right gate for that, not an admin form.
- A CMS or DB-backed rule table would add real build time (an admin UI, or at minimum a migration + seed step) for a 9-day MVP with one editor (the product owner) and no multi-tenant need.
- Keeping unverified thresholds in code, next to a comment citing the exact open gap (mirroring Rule Engine Spec §9), makes the "do not ship this unchecked" flag visible to whoever touches that file next — a database row doesn't carry that context as legibly.

## Consequences

- Updating a rule (e.g., once the primary-source wait-time recheck lands) is a normal code change + PR + review, not a content-team task. That's the intended tradeoff.
- If the product later needs non-developers to edit copy without a deploy, that's a real scope change — revisit this ADR then, don't quietly bolt a CMS onto the existing data module.
