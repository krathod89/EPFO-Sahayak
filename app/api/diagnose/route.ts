// POST /api/diagnose — the single HTTP boundary for both entry points (spec.md, ticket 06).
// No business logic lives here: this route only validates the request, calls
// lib/rule-engine, fires the request/response analytics events, and shapes the response.

import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { runPostRejectionFlow, runPreFilingFlow } from "@/lib/rule-engine";
import { diagnoseRequestSchema, validatePostRejectionCrossFields } from "@/lib/rule-engine/schema";

async function logEvent(sessionId: string | undefined, eventType: string, properties: Record<string, unknown>) {
  if (!sessionId) return; // analytics is best-effort; never block the diagnose response on it
  try {
    await prisma.analyticsEvent.create({
      data: { sessionId, eventType, properties: properties as Prisma.InputJsonValue },
    });
  } catch {
    // Analytics must never break the core flow. A logging failure is not the citizen's problem.
  }
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON" }, { status: 400 });
  }

  const parsed = diagnoseRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request", issues: parsed.error.issues }, { status: 400 });
  }

  const input = parsed.data;
  const sessionId = typeof (body as { session_id?: unknown }).session_id === "string"
    ? (body as { session_id: string }).session_id
    : undefined;

  if (input.entry_point === "post_rejection") {
    const crossFieldErrors = validatePostRejectionCrossFields(input);
    if (crossFieldErrors.length > 0) {
      return NextResponse.json({ error: "Invalid request", issues: crossFieldErrors }, { status: 400 });
    }

    await logEvent(sessionId, "codes_selected", { codes: input.rejection_codes_selected });

    const result = runPostRejectionFlow(input);

    await logEvent(sessionId, "diagnosis_shown", {
      codes: input.rejection_codes_selected,
      priority_ranked: result.priority?.needsRanking ?? false,
      tier1: result.priority?.tier1 ?? [],
      tier2: result.priority?.tier2 ?? [],
      unranked: result.priority?.unranked ?? [],
    });
    await logEvent(sessionId, "deadline_check_shown", {
      status: result.deadline.status,
      deadline_days: result.deadline.deadlineDays,
    });
    if (result.grievance?.ready) {
      await logEvent(sessionId, "grievance_generated", {
        variant: result.grievance.variant,
        deadline_cited: result.grievance.deadlineCited,
      });
    }

    return NextResponse.json(result);
  }

  // entry_point === "pre_filing"
  await logEvent(sessionId, "self_check_submitted", { answers: input.self_check_answers });

  const result = runPreFilingFlow(input);

  await logEvent(sessionId, "readiness_result_shown", {
    result: result.outcome,
    issue_count: result.issues.length,
    unsure_count: result.unsureItems.length,
  });

  return NextResponse.json(result);
}
