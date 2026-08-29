# 08 — Infra: Supabase + Vercel provisioning, preview environments

**Status:** Not started — owner: product owner (needs their accounts/credentials, not something an agent session can do unattended)

Traces to: route prerequisites 5–6 (deploy target decided, PR preview environment actually works, local + prod verification methods agreed).

## Scope
- Create a Supabase project (free tier), copy its Postgres connection string into `DATABASE_URL`.
- Create a Vercel project linked to `github.com/krathod89/EPFO-Sahayak`, set `DATABASE_URL` as an environment variable (Production + Preview).
- Push this branch, open a PR, and **confirm the PR preview deployment actually builds and the two API routes respond** before merging — a broken preview silently downgrades verify-then-merge to the riskier merge-then-verify (per the route's standing rule).
- Decide and document the local + prod verification method for future tickets: local = `npm run dev` + `curl`/Vitest integration tests before every PR; prod = hit the deployed `/api/diagnose` and `/api/events` once merged, and check the Supabase table editor to confirm events actually land — not just that the code compiled.
- Optional, not blocking: basic rate limiting or a request-size cap on the two open (no-auth) endpoints before any public/real-user traffic (flagged in ADR 0002).

## Done means
- A PR preview URL that actually responds on both API routes.
- `DATABASE_URL` set in both Preview and Production Vercel environments, pointing at Supabase.
- One row visible in Supabase's table editor after hitting the deployed `/api/events` — the prod verification step from the route (step 10), not just a local check.
