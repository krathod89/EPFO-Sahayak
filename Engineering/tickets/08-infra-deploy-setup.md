# 08 — Infra: Mixpanel token + Vercel provisioning, preview environments

**Status:** In progress — owner: product owner (needs their own accounts/credentials, not something an agent session can do unattended). Supabase project created (`kffiffobopchaekrvpvu`) and Mixpanel project created (project `4058729`) — **Supabase is not used by the MVP** (ADR 0004 moved analytics to Mixpanel; Supabase stays reserved, unused, for v2). Mixpanel's project token still needs to be pulled and wired in as an env var.

Traces to: route prerequisites 5–6 (deploy target decided, PR preview environment actually works, local + prod verification methods agreed).

## Scope
- Grab the Mixpanel **project token** (not the API secret) from Project Settings → Access Keys, and set it as both `MIXPANEL_TOKEN` (server) and `NEXT_PUBLIC_MIXPANEL_TOKEN` (client, once the UI wires up Mixpanel's browser SDK) — see `.env.example`.
- Create a Vercel project linked to `github.com/krathod89/EPFO-Sahayak`, set both Mixpanel env vars (Production + Preview).
- Push this branch, open a PR, and **confirm the PR preview deployment actually builds and `/api/diagnose` responds** before merging — a broken preview silently downgrades verify-then-merge to the riskier merge-then-verify (per the route's standing rule).
- Decide and document the local + prod verification method for future tickets: local = `npm run dev` + `curl`/Vitest integration tests before every PR; prod = hit the deployed `/api/diagnose` once merged, and check Mixpanel's Live View to confirm the fired events actually land — not just that the code compiled.
- Optional, not blocking: basic rate limiting or a request-size cap on `/api/diagnose` (it's open, no auth) before any public/real-user traffic (flagged in ADR 0002).

## Done means
- A PR preview URL that actually responds on `/api/diagnose`.
- `MIXPANEL_TOKEN` (and `NEXT_PUBLIC_MIXPANEL_TOKEN`, once the frontend needs it) set in both Preview and Production Vercel environments.
- One event visible in Mixpanel's Live View after hitting the deployed `/api/diagnose` — the prod verification step from the route (step 10), not just a local check.
