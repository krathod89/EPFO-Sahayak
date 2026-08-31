# EPFO Sahayak

Decodes an EPFO Provident Fund claim rejection into a plain-language diagnosis, a fix-priority order, a deadline/penalty check, and ready-to-paste grievance text — or checks readiness before filing at all. Full product context: `PRD.md`. Full rule logic: `Rule Engine/Rule Engine Spec.md`.

**Live at [epfo-sahayak-pi.vercel.app](https://epfo-sahayak-pi.vercel.app).** The citizen-facing UI (`components/Wizard.tsx`) is built and wired to the rule engine below via the same API endpoint any other frontend could call over plain JSON.

## Stack

Next.js (App Router, TypeScript) · Mixpanel (analytics) · Vitest. Rationale in `Engineering/ADR/0001-tech-stack-and-hosting.md` and `Engineering/ADR/0004-analytics-via-mixpanel.md`.

**No database.** The MVP tracks anonymous, session-scoped analytics via Mixpanel rather than a custom table — see ADR 0004. A Supabase project exists but is intentionally unused for now, reserved for a v2 feature (PRD §7a item 8).

## Setup

```bash
npm install
cp .env.example .env   # fill in your real Mixpanel project token
npm run dev            # http://localhost:3000
```

`MIXPANEL_TOKEN` (server) and `NEXT_PUBLIC_MIXPANEL_TOKEN` (client) come from your Mixpanel project's Access Keys — see `.env.example`. Without a token, `lib/analytics.ts` falls back to a silent no-op, so local dev works either way.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Local dev server |
| `npm run build` | Production build |
| `npm test` | Run the Vitest suite (rule-engine + API unit/integration tests) |
| `npm run typecheck` | `tsc --noEmit` |

## API

- **`POST /api/diagnose`** — `entry_point: "post_rejection" | "pre_filing"` selects the flow; see `Engineering/spec.md` for the request/response shape and `Rule Engine/Rule Engine Spec.md` for the full logic. An optional `session_id` in the body tags the server-computed analytics events this call fires (see `Engineering/analytics.md`).

There is no separate analytics endpoint — client-fired events (session start, entry-point choice, grievance-copy, feedback) go straight to Mixpanel from the browser via `lib/ui/mixpanel-client.ts`, using a per-browser session id shared with the API call.

## Project structure

```
app/
  api/diagnose/route.ts   # both entry points
  layout.tsx, page.tsx    # renders <Wizard />, the citizen-facing flow
components/
  Wizard.tsx              # the full decoder + pre-filing wizard, calls /api/diagnose directly
lib/
  rule-engine/            # pure logic, framework-agnostic, fully unit-tested
  analytics.ts            # server-side Mixpanel tracking
  ui/                     # client-only helpers: api-client, date-validation, session, mixpanel-client
Engineering/
  spec.md, analytics.md   # user stories + event tracking plan
  tickets/                # backend tickets, one file each
  ADR/                    # architecture decisions
Rule Engine/              # the source rule-logic spec (pre-existing, this repo's source of truth)
Research/, PRD.md, Design/  # product research, PRD, design prompt (pre-existing)
```

## Status

Backend logic (rule engine + the API route) and the citizen-facing UI are both built, tested (92 tests, `npm test`), and deployed — live at [epfo-sahayak-pi.vercel.app](https://epfo-sahayak-pi.vercel.app) on Vercel, connected to this repo's `main` branch. Both entry points (post-rejection diagnosis and pre-filing readiness check) verified working end to end against the live API. Remaining open items are tracked in `PRD.md` Section 10 — notably test-plan step 2 Phase 2 (real-volunteer usage testing) and a handful of primary-source verification items.
