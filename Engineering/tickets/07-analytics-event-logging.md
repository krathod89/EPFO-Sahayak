# 07 — Database schema + POST /api/events

**Status:** Code complete, unit/integration-tested against a mocked Prisma client — **the live migration has not run** (needs a real `DATABASE_URL`, which is ticket 08's job to provision). Do not treat this as fully done until that migration succeeds against Supabase.

Traces to: `spec.md` US6. See `Engineering/ADR/0002-stateless-mvp-no-auth.md` for why this is the only table.

## Scope
- `prisma/schema.prisma` — `AnalyticsEvent` model: `id` (uuid, pk), `sessionId` (string, indexed), `eventType` (string, indexed), `properties` (Json), `createdAt` (timestamp, default now, indexed). Postgres provider, `DATABASE_URL` from env.
- `lib/db.ts` — a singleton `PrismaClient`, guarded against creating a new client per serverless invocation in dev (the standard Next.js + Prisma pattern).
- `app/api/events/route.ts` — validates `{ session_id, event_type, properties }`, writes one row, returns 201. Also **rejects** (400, not silently strips) any event whose `properties` contains a key shaped like a citizen-entered field (`uan`, `claim_id`, `filing_date`, etc. — see `lib/rule-engine/schema.ts`'s `BLOCKED_PROPERTY_KEYS`) — a server-side backstop for ADR 0002's PII rule, not just caller discipline. No auth, no rate limiting yet (tracked in ticket 08).
- Client-only events (`session_started`, `entry_point_selected`, `codes_selected` pre-submit interactions, `grievance_copied`, `feedback_submitted`) call this endpoint directly from the frontend the product owner is building; server-computed events (`diagnosis_shown`, etc.) are fired from ticket 06's route handler using the same `lib/db.ts` client, not a second HTTP round-trip to this endpoint.

## Done means
- [x] Integration test: POST a valid event, confirm one row lands with the right shape; POST a malformed body, confirm 400 and no row written. See `app/api/events/route.test.ts`.
- [x] Confirm `properties` carrying an excluded field (UAN, claim ID, filing date) is rejected outright, not just documented — covered by both a schema unit test and a route integration test.
- [ ] **A local migration (`prisma migrate dev`) runs clean against a real Supabase dev database.** Not yet done — blocked on ticket 08 provisioning a real `DATABASE_URL`. `npx prisma generate` and `tsc --noEmit` both succeed against the schema as written, which confirms the schema itself is valid, but that is not the same as a verified migration.
