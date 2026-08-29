// POST /api/events — anonymous, session-scoped analytics logging (spec.md ticket 07).
// See Engineering/ADR/0002-stateless-mvp-no-auth.md: this table must never carry PII.
// Client-side-only events (session_started, entry_point_selected, grievance_copied,
// feedback_submitted, and the pre-submit interaction events) call this endpoint directly.
// Server-computed events are logged from app/api/diagnose/route.ts using the same
// lib/db.ts client, not a second round-trip through here.

import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { eventRequestSchema } from "@/lib/rule-engine/schema";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON" }, { status: 400 });
  }

  const parsed = eventRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request", issues: parsed.error.issues }, { status: 400 });
  }

  const { session_id, event_type, properties } = parsed.data;

  await prisma.analyticsEvent.create({
    data: {
      sessionId: session_id,
      eventType: event_type,
      properties: (properties ?? {}) as Prisma.InputJsonValue,
    },
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}
