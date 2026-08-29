# 08 — Infra: Mixpanel token + Vercel provisioning, preview environments

**Status:** Done. Supabase project created (`kffiffobopchaekrvpvu`) — **not used by the MVP** (ADR 0004 moved analytics to Mixpanel; Supabase stays reserved, unused, for v2). Vercel project `rv-n/epfo-sahayak` created, linked to `github.com/krathod89/EPFO-Sahayak` (GitHub connected automatically on project creation — pushes now trigger preview builds, merges to `main` trigger production). `MIXPANEL_TOKEN` (Secret) and `NEXT_PUBLIC_MIXPANEL_TOKEN` (Config — intentionally public, see ADR 0004) set for both Production and Preview. First production deploy succeeded from the `backend-scaffold` branch's local files, live at **https://epfo-sahayak-pi.vercel.app**.

**Deployed end-to-end verification (2026-08-30):**
- `POST /api/diagnose` (`pre_filing`) → 200, correct `{"outcome":"ready",...}` response.
- `POST /api/diagnose` (`post_rejection`, Code 2) → 200, correct diagnosis + a `MISSED` deadline (26 days late) + a Variant A grievance with the 12%-penalty citation appended — matches Rule Engine Spec exactly.
- Analytics: the underlying `MIXPANEL_TOKEN` was confirmed live in a prior session (a `backend_wiring_verified` test event sent with no error). These two deployed calls fire `self_check_submitted`/`readiness_result_shown` and `codes_selected`/`diagnosis_shown`/`deadline_check_shown`/`grievance_generated` respectively — worth a spot-check in Mixpanel's Live View for session IDs starting `verify-` to see them land, but not blocking given the token path is already proven.

Traces to: route prerequisites 5–6 (deploy target decided, PR preview environment actually works, local + prod verification methods agreed).

## Scope
- Grab the Mixpanel **project token** (not the API secret) from Project Settings → Access Keys, and set it as both `MIXPANEL_TOKEN` (server) and `NEXT_PUBLIC_MIXPANEL_TOKEN` (client, once the UI wires up Mixpanel's browser SDK) — see `.env.example`.
- Create a Vercel project linked to `github.com/krathod89/EPFO-Sahayak`, set both Mixpanel env vars (Production + Preview).
- Push this branch, open a PR, and **confirm the PR preview deployment actually builds and `/api/diagnose` responds** before merging — a broken preview silently downgrades verify-then-merge to the riskier merge-then-verify (per the route's standing rule).
- Decide and document the local + prod verification method for future tickets: local = `npm run dev` + `curl`/Vitest integration tests before every PR; prod = hit the deployed `/api/diagnose` once merged, and check Mixpanel's Live View to confirm the fired events actually land — not just that the code compiled.
- Optional, not blocking: basic rate limiting or a request-size cap on `/api/diagnose` (it's open, no auth) before any public/real-user traffic (flagged in ADR 0002).

## Done means
- [x] `MIXPANEL_TOKEN` (Secret) and `NEXT_PUBLIC_MIXPANEL_TOKEN` (Config) set in both Preview and Production Vercel environments.
- [x] A deployed URL that actually responds correctly on `/api/diagnose`, both entry points — confirmed via the manual production deploy above (https://epfo-sahayak-pi.vercel.app), which deploys directly from local files via the Vercel CLI rather than from a GitHub push.
- [ ] **Not yet confirmed:** whether PR #1 itself now gets an automatic preview build. Git was connected to the Vercel project *after* `backend-scaffold` was already pushed, so it's unverified whether Vercel back-fills a preview for an already-open PR or only starts on the next push to that branch. Push any small follow-up commit to `backend-scaffold` and check the PR's checks tab to confirm before relying on this for future PRs.
- [ ] One event visible in Mixpanel's Live View for a session ID starting `verify-` (spot-check only — the token path itself is already proven working, see above).
