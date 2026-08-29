// Pre-filing readiness-check flow (H14). Source: Rule Engine/Rule Engine Spec.md Section 7.
//
// Reuses the exact same 5-item self-check and per-check polarity as Code 7's fallback
// (see selfCheck.ts) and the same explanation/fix text (see diagnose.ts's
// resolveSelfCheckIssueCode). "Approved but not credited" (Code 6) is excluded by
// construction — it has no meaning before a claim is filed. No priority ranking (Section 4)
// and no deadline check (Section 5) apply here — there is no live rejection to rank against
// and no filing_date yet.

import { resolveSelfCheckIssueCode, type DiagnosisEntry } from "./diagnose";
import { bucketSelfCheck } from "./selfCheck";
import type { SelfCheckAnswers } from "./types";

export type ReadinessOutcome = "ready" | "mostly_ready" | "issues_found";

export interface ReadinessResult {
  outcome: ReadinessOutcome;
  issues: DiagnosisEntry[];
  unsureItems: (keyof SelfCheckAnswers)[];
}

export function readinessResult(answers: SelfCheckAnswers): ReadinessResult {
  const bucket = bucketSelfCheck(answers);
  const issues = bucket.issues.map(({ code }) => resolveSelfCheckIssueCode(code));

  let outcome: ReadinessOutcome;
  if (issues.length > 0) {
    outcome = "issues_found";
  } else if (bucket.unsure.length > 0) {
    outcome = "mostly_ready";
  } else {
    outcome = "ready";
  }

  return { outcome, issues, unsureItems: bucket.unsure };
}
