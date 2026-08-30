# EPFO Sahayak

Decodes an EPFO Provident Fund claim rejection into a plain-language diagnosis, a fix-priority order, a deadline/penalty check, and ready-to-paste grievance text — or checks readiness before filing at all. Full product context: `PRD.md`. Full rule logic: `Rule Engine/Rule Engine Spec.md`.

**This repo currently holds the backend layer only.** The UI/UX is being designed separately (see `Design/UI-UX Design Prompt.md`); any frontend can call the API endpoint below over plain JSON.

## Stack

Next.js (App Router, TypeScript) · Mixpanel (analytics) · Vitest. Rationale in `Engineering/ADR/0001-tech-stack-and-hosting.md` and `Engineering/ADR/0004-analytics-via-mixpanel.md`.

**No database.** The MVP tracks anonymous, session-scoped analytics via Mixpanel rather than a custom table — see ADR 0004. A Supabase project exists but is intentionally unused for now, reserved for a v2 feature (PRD §7a item 8).

## Setup

```bash
npm install
cp .env.example .env   # fill in your real Mixpanel project token
npm run dev            # http://localhost:3000
```

`MIXPANEL_TOKEN` (server) and `NEXT_PUBLIC_MIXPANEL_TOKEN` (client, once the UI wires up Mixpanel's browser SDK) come from your Mixpanel project's Access Keys — see `.env.example`. Without a token, `lib/analytics.ts` falls back to a silent no-op, so local dev works either way.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Local dev server |
| `npm run build` | Production build |
| `npm test` | Run the Vitest suite (rule-engine + API unit/integration tests) |
| `npm run typecheck` | `tsc --noEmit` |

## API

- **`POST /api/diagnose`** — `entry_point: "post_rejection" | "pre_filing"` selects the flow; see `Engineering/spec.md` for the request/response shape and `Rule Engine/Rule Engine Spec.md` for the full logic. An optional `session_id` in the body tags the server-computed analytics events this call fires (see `Engineering/analytics.md`).

There is no separate analytics endpoint — client-fired events (session start, entry-point choice, grievance-copy, feedback) go straight to Mixpanel from the browser via its client SDK once the UI exists.

## Project structure

```
app/
  api/diagnose/route.ts   # both entry points
  layout.tsx, page.tsx    # placeholder — the real UI is being designed separately
lib/
  rule-engine/            # pure logic, framework-agnostic, fully unit-tested
  analytics.ts            # server-side Mixpanel tracking
Engineering/
  spec.md, analytics.md   # user stories + event tracking plan
  tickets/                # backend tickets, one file each
  ADR/                    # architecture decisions
Rule Engine/              # the source rule-logic spec (pre-existing, this repo's source of truth)
Research/, PRD.md, Design/  # product research, PRD, design prompt (pre-existing)
```

## Status

Backend logic (rule engine + the API route) is built and unit-tested (79 tests, `npm test`). Not yet deployed — see `Engineering/tickets/08-infra-deploy-setup.md` for the remaining manual steps (Mixpanel token + Vercel provisioning), which need the product owner's own accounts.
