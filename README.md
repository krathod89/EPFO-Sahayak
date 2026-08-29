# EPFO Sahayak

Decodes an EPFO Provident Fund claim rejection into a plain-language diagnosis, a fix-priority order, a deadline/penalty check, and ready-to-paste grievance text — or checks readiness before filing at all. Full product context: `PRD.md`. Full rule logic: `Rule Engine/Rule Engine Spec.md`.

**This repo currently holds the backend + database layers only.** The UI/UX is being designed separately (see `Design/UI-UX Design Prompt.md`); any frontend can call the two API endpoints below over plain JSON.

## Stack

Next.js (App Router, TypeScript) · Prisma + Supabase Postgres · Vitest. Rationale in `Engineering/ADR/0001-tech-stack-and-hosting.md`.

## Setup

```bash
npm install
cp .env.example .env   # fill in a real Supabase connection string
npx prisma migrate dev # creates the AnalyticsEvent table
npm run dev            # http://localhost:3000
```

`DATABASE_URL` (and `DIRECT_URL`, for migrations) must point at a Supabase Postgres project — see `.env.example`. There is no local-DB fallback; this was a deliberate call (ADR 0001) given the MVP's tiny, single-table footprint.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Local dev server |
| `npm run build` | Production build |
| `npm test` | Run the Vitest suite (rule-engine unit tests) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run db:migrate` | Apply Prisma migrations locally |
| `npm run db:studio` | Prisma's DB browser |

## API

- **`POST /api/diagnose`** — `entry_point: "post_rejection" | "pre_filing"` selects the flow; see `Engineering/spec.md` for the request/response shape and `Rule Engine/Rule Engine Spec.md` for the full logic.
- **`POST /api/events`** — `{ session_id, event_type, properties }`. Anonymous analytics only — see `Engineering/analytics.md` for the event list and `Engineering/ADR/0002-stateless-mvp-no-auth.md` for what must never be logged.

## Project structure

```
app/
  api/diagnose/route.ts   # both entry points
  api/events/route.ts     # analytics logging
  layout.tsx, page.tsx    # placeholder — the real UI is being designed separately
lib/
  rule-engine/            # pure logic, framework-agnostic, fully unit-tested
  db.ts                   # Prisma client singleton
prisma/
  schema.prisma           # one table: AnalyticsEvent
Engineering/
  spec.md, analytics.md   # user stories + event tracking plan
  tickets/                # backend/DB tickets, one file each
  ADR/                    # architecture decisions
Rule Engine/              # the source rule-logic spec (pre-existing, this repo's source of truth)
Research/, PRD.md, Design/  # product research, PRD, design prompt (pre-existing)
```

## Status

Backend logic (rule engine + both API routes + DB schema) is built and unit-tested (65 tests, `npm test`). Not yet deployed — see `Engineering/tickets/08-infra-deploy-setup.md` for the remaining manual steps (Supabase + Vercel provisioning), which need the product owner's own accounts.
