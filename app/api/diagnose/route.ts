// POST /api/diagnose — the single HTTP boundary for both entry points (spec.md, ticket 06).
// No business logic lives here: this route only validates the request, calls
// lib/rule-engine, fires the request/response analytics events, and shapes the response.

import { NextResponse } from "next/server";
import { trackServerEvent } from "@/lib/analytics";
import { runPostRejectionFlow, runPreFilingFlow } from "@/lib/rule-engine";
import { diagnoseRequestSchema, validatePostRejectionCrossFields } from "@/lib/rule-engine/schema";

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

    trackServerEvent(sessionId, "codes_selected", { codes: input.rejection_codes_selected });
    // Fires whenever Code 7 or Code 10 (ticket 10) ran the self-check sub-flow — this branch
    // never fired it at all before this fix, a pre-existing gap (predating ticket 10) found
    // by a code-review pass on this ticket that also caught its own Analytics-section claim
    // as false. Mirrors the pre_filing branch's already-correct call below.
    if (input.self_check_answers) {
      trackServerEvent(sessionId, "self_check_submitted", { answers: input.self_check_answers });
    }

    const result = runPostRejectionFlow(input);

    trackServerEvent(sessionId, "diagnosis_shown", {
      codes: input.rejection_codes_selected,
      priority_ranked: result.priority?.needsRanking ?? false,
      tier1: result.priority?.tier1 ?? [],
      tier2: result.priority?.tier2 ?? [],
      unranked: result.priority?.unranked ?? [],
    });
    // Absent for any code in DEADLINE_SUPPRESSED_CODES (Code 8, ticket 16; Code 9, ticket 17)
    // — those claims were never going to be settled regardless of the clock, so index.ts
    // deliberately skips computing this at all.
    if (result.deadline) {
      trackServerEvent(sessionId, "deadline_check_shown", {
        status: result.deadline.status,
        deadline_days: result.deadline.deadlineDays,
        // "rejection_date" (citizen gave EPFO's actual rejection date) vs "today" (no
        // rejection date given, estimated off today's date) — see deadline.ts's DeadlineBasis.
        basis: result.deadline.basis,
      });
    }
    if (result.grievance?.ready) {
      trackServerEvent(sessionId, "grievance_generated", {
        variant: result.grievance.variant,
        deadline_cited: result.grievance.deadlineCited,
        // Ticket 19: how many OTHER applicable grievances this selection produced beyond the
        // primary one — signal for how often the multi-grievance case actually happens.
        additional_grievance_count: result.additionalGrievances.length,
      });
    }

    return NextResponse.json(result);
  }

  // entry_point === "pre_filing"
  trackServerEvent(sessionId, "self_check_submitted", { answers: input.self_check_answers });

  const result = runPreFilingFlow(input);

  trackServerEvent(sessionId, "readiness_result_shown", {
    result: result.outcome,
    issue_count: result.issues.length,
    unsure_count: result.unsureItems.length,
  });

  return NextResponse.json(result);
}
