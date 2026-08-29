# ADR 0001 — Tech stack and hosting

**Status:** Accepted (2026-08-29)

## Context

Backend + database groundwork is needed for the EPFO decoder (PRD §7a). The product owner is designing the UI separately and asked which shape the frontend/backend split should take, and where the analytics database should live. Two real questions, decided together since they constrain each other:

1. Single app (API routes colocated with the eventual UI) vs. a fully headless API deployed separately from the frontend.
2. Where the `AnalyticsEvent` table (see ADR 0002) actually runs.

## Decision

- **Next.js (App Router, TypeScript), one repo.** API routes (`app/api/*/route.ts`) live alongside the UI the product owner will build or paste in later. Any frontend — Next.js pages, a separately hosted SPA, even a static export — can call these routes over plain HTTP/JSON, so colocating them doesn't lock in a frontend choice; it just avoids standing up and paying for a second deploy target for a 9-day solo build.
- **Prisma** as the ORM, talking to **Supabase Postgres (free tier)** via `DATABASE_URL`.
- **Vercel** as the deploy target — zero-config for Next.js, free-tier PR preview environments (a route prerequisite), one env var to wire in Supabase.
- **Vitest** for tests — fast, native TypeScript, no separate Babel/webpack config needed for the rule-engine unit tests that matter most here.

## Alternatives considered

- **Headless API (Fastify/Express) + frontend hosted separately.** Rejected for now: adds a second deploy target, CORS configuration, and two sets of env vars to manage solo, for a decoupling benefit that plain JSON API routes already give without the overhead. Revisit if the product owner's design work turns into a frontend that genuinely can't live in the same repo (e.g., a no-code builder export with its own hosting).
- **SQLite, no hosted DB.** Rejected: the MVP's only stateful data is the anonymous events table, but it still needs to survive a serverless prod deploy (Vercel's filesystem is ephemeral) and handle concurrent writes once more than one person tests it. A managed Postgres free tier removes both problems for the cost of one signup.

## Consequences

- Local dev needs a `DATABASE_URL` pointed at a Supabase project (see `README.md` for setup) — there is no zero-config local DB fallback. `.env.example` documents the required shape.
- Deploying to Vercel and provisioning Supabase are manual, one-time steps only the product owner can do (account creation, linking the GitHub repo) — tracked as ticket `08-infra-deploy-setup.md`, not something this session can complete unattended.
- If the product owner's design work ends up as a separately-hosted frontend after all, the API routes here still work as-is (they're plain HTTP endpoints) — only CORS headers would need adding.
