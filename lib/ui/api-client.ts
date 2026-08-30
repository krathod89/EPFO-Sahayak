"use client";

// Thin typed wrapper around POST /api/diagnose — the wizard's only network call. No
// business logic here; lib/rule-engine (via the API route) owns all of that, so the UI
// never re-derives a diagnosis/priority/deadline/grievance itself.

import type {
  PostRejectionInput,
  PreFilingInput,
  PostRejectionFlowResult,
  ReadinessResult,
} from "@/lib/rule-engine";

export class DiagnoseApiError extends Error {}

async function postJson(body: unknown): Promise<unknown> {
  const res = await fetch("/api/diagnose", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const parsed: unknown = await res.json().catch(() => null);
    const message =
      parsed && typeof parsed === "object" && "error" in parsed && typeof parsed.error === "string"
        ? parsed.error
        : `Request failed with status ${res.status}`;
    throw new DiagnoseApiError(message);
  }
  return res.json();
}

/** Overloaded on `entry_point` so callers get the correctly-typed response without a cast. */
export function postDiagnose(
  input: PostRejectionInput & { session_id: string }
): Promise<PostRejectionFlowResult>;
export function postDiagnose(input: PreFilingInput & { session_id: string }): Promise<ReadinessResult>;
export function postDiagnose(
  input: (PostRejectionInput | PreFilingInput) & { session_id: string }
): Promise<PostRejectionFlowResult | ReadinessResult> {
  return postJson(input) as Promise<PostRejectionFlowResult | ReadinessResult>;
}
