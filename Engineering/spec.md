# EPFO Decoder — Backend & Database Spec

*Scope: backend + database layers only. UI/UX is being designed separately by the product owner and is out of scope for this document. Written in Simplified Technical English.*

**Source of truth for logic:** `Rule Engine/Rule Engine Spec.md`. This file turns that logic into buildable user stories and ticket scope. It does not repeat the full rule table — see the Rule Engine Spec for exact copy, thresholds, and pseudocode.

**Source of truth for product decisions:** `PRD.md`, especially Section 7a (solution direction, stateless-MVP decision) and Section 10 (open gaps).

---

## Stack decision

Confirmed with the product owner (2026-08-29, analytics backend revised same day once a Mixpanel project existed too):

- **One Next.js app** (App Router, TypeScript) — holds both the API route below and, later, the UI the product owner is designing separately.
- **Analytics:** Mixpanel (client SDK for client-fired events, the `mixpanel` server package for server-computed events). **No database** — the Supabase project the product owner also created is kept, unused by the MVP, reserved for a v2 feature (PRD §7a item 8).
- **Tests:** Vitest.
- **Deploy target:** Vercel (matches the Next.js choice, zero-config preview environments per PR).

Full rationale in `Engineering/ADR/0001-tech-stack-and-hosting.md` and `Engineering/ADR/0004-analytics-via-mixpanel.md`.

---

## User stories (MVP, backend-facing)

Each maps to one PRD §7a feature. Analytics events each story fires are named in `analytics.md`.

**US1 — Diagnose a rejection.**
As a citizen whose PF claim was rejected, I want to select the remark(s) EPFO showed me and get a plain-language explanation of what each one means, so I understand why my claim was rejected without decoding EPFO's jargon myself.
*Covers Rule Engine Spec §3 (all 7 codes, including Code 1's portal-sync-bug branch, Code 3's wait-time bands, and Code 7's self-check sub-flow).*

**US2 — Know what to fix first.**
As a citizen who sees more than one rejection reason at once, I want to be told which one actually blocks my claim first, so I don't waste a refiling attempt fixing the wrong one first.
*Covers Rule Engine Spec §4 (H10 priority logic).*

**US3 — Know if EPFO missed its own deadline.**
As a citizen who filed a claim, I want to know whether EPFO has missed its legal settlement deadline (3 or 20 days) and whether I'm owed a 12% penalty, so I can ask for what I'm legally owed instead of not knowing it exists.
*Covers Rule Engine Spec §5 (H11 deadline/penalty logic).*

**US4 — Get ready-to-paste grievance text.**
As a citizen ready to escalate, I want grievance text tailored to my exact situation (code, deadline status), so I don't have to write my own complaint from scratch or guess the right wording.
*Covers Rule Engine Spec §6 (H13, 5 variants + deadline citation block).*

**US5 — Check readiness before filing.**
As a citizen who hasn't filed yet, I want to run the same 5-item self-check before I file, so I catch a problem before it causes a rejection instead of after.
*Covers Rule Engine Spec §7 (H14 pre-filing flow).*

**US6 — Track usage anonymously, no login.**
As the product owner, I want usage and feedback tracked per anonymous session (no account, no PII), so I can learn which codes get selected and whether the tool helps, without taking on login infrastructure or a PII retention policy this MVP explicitly avoids (PRD §7a item 7).

**Explicitly out of scope for this MVP** (named in PRD §7a item 8, not silently dropped):
- CPGRAMS second-level escalation template (v2).
- Reference-code case retrieval / any case data persistence (v2 — needs a retention/deletion policy first).
- Any login/account system (rejected even for v2).

---

## API surface

One endpoint covers the whole rule engine (it already shares logic across both entry points — see Rule Engine Spec §1):

- **`POST /api/diagnose`** — body carries `entry_point: "post_rejection" | "pre_filing"` plus the fields Rule Engine Spec §2 lists as required for that entry point, and an optional `session_id` used only to tag the server-computed analytics events this call fires (see `analytics.md`). Returns the diagnosis, priority order (if applicable), deadline/penalty result (post-rejection only), and grievance text (post-rejection only) or the readiness result (pre-filing only).

There is no separate analytics endpoint. Client-fired events go straight to Mixpanel from the browser via its client SDK (ADR 0004) — never through this backend. The endpoint above is stateless request/response; analytics tracking inside it is fire-and-forget and never blocks the response.
