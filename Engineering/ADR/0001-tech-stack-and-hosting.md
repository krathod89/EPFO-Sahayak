# ADR 0001 — Tech stack and hosting

**Status:** Accepted (2026-08-29). **The database half of this decision was superseded the same day by ADR 0004** — analytics moved to Mixpanel, so the MVP now has no database at all. This ADR's stack/hosting choice otherwise stands as originally decided.

## Context

Backend + database groundwork is needed for the EPFO decoder (PRD §7a). The product owner is designing the UI separately and asked which shape the frontend/backend split should take, and where analytics data should live. Two real questions, decided together since they constrain each other:

1. Single app (API routes colocated with the eventual UI) vs. a fully headless API deployed separately from the frontend.
2. Where analytics events actually get recorded.

## Decision

- **Next.js (App Router, TypeScript), one repo.** API routes (`app/api/*/route.ts`) live alongside the UI the product owner will build or paste in later. Any frontend — Next.js pages, a separately hosted SPA, even a static export — can call these routes over plain HTTP/JSON, so colocating them doesn't lock in a frontend choice; it just avoids standing up and paying for a second deploy target for a 9-day solo build.
- ~~Prisma as the ORM, talking to Supabase Postgres (free tier) via `DATABASE_URL`.~~ **Superseded by ADR 0004: analytics is tracked via Mixpanel instead.** The Supabase project the product owner created is kept, unused by the MVP, reserved for the v2 case-retrieval feature named in PRD §7a.
- **Vercel** as the deploy target — zero-config for Next.js, free-tier PR preview environments (a route prerequisite).
- **Vitest** for tests — fast, native TypeScript, no separate Babel/webpack config needed for the rule-engine unit tests that matter most here.

## Alternatives considered

- **Headless API (Fastify/Express) + frontend hosted separately.** Rejected for now: adds a second deploy target, CORS configuration, and two sets of env vars to manage solo, for a decoupling benefit that plain JSON API routes already give without the overhead. Revisit if the product owner's design work turns into a frontend that genuinely can't live in the same repo (e.g., a no-code builder export with its own hosting).
- ~~SQLite, no hosted DB.~~ Moot now that the MVP has no database at all (ADR 0004).

## Consequences

- Deploying to Vercel is a manual, one-time step only the product owner can do (account creation, linking the GitHub repo, setting `MIXPANEL_TOKEN`/`NEXT_PUBLIC_MIXPANEL_TOKEN`) — tracked as ticket `08-infra-deploy-setup.md`, not something this session can complete unattended.
- If the product owner's design work ends up as a separately-hosted frontend after all, the API routes here still work as-is (they're plain HTTP endpoints) — only CORS headers would need adding.
