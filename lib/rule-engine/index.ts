// Orchestrator: combines diagnose + prioritize + deadline + grievance for the
// post-rejection entry point, and delegates to the readiness check for pre-filing.
// This is the module the API layer (app/api/diagnose/route.ts) calls — it should not
// need to import from the individual rule-engine modules directly.

import { CODE_DEFINITIONS } from "./codes";
import { checkDeadline, type DeadlineResult } from "./deadline";
import { diagnose, hasBranch, type DiagnoseResult, type DiagnosisEntry } from "./diagnose";
import { buildGrievance, type GrievanceOutput, type StandardKind, type VariantKind } from "./grievance";
import { prioritize, type PriorityResult } from "./prioritize";
import { readinessResult, type ReadinessResult } from "./readiness";
import { DEADLINE_SUPPRESSED_CODES, type DiagnosableCode, type PostRejectionInput, type PreFilingInput, type RuleCode } from "./types";

/** Codes that are mutually exclusive with everything else (see `MUTUALLY_EXCLUSIVE_CODES` in
 * types.ts) AND always build one fixed grievance kind, regardless of branch — Code 6
 * (approved, not credited), Code 8 (eligibility, ticket 16), Code 9 (wrong form, ticket 17).
 * Code 7 is exclusive too but runs a structurally different self-check sub-flow, so it's
 * handled separately below, not folded into this table.
 *
 * A code-review pass on ticket 16 flagged the previous shape here — a fresh `else if
 * (input.rejection_codes_selected.includes("CODE_X"))` block hand-added per code — as the
 * point where a declarative lookup starts paying for itself, once a 4th such code showed up.
 * Ticket 17 (this one) is that 4th code; this table is the generalization. */
const EXCLUSIVE_CODE_GRIEVANCE_KIND: Partial<Record<RuleCode, VariantKind>> = {
  CODE_6_APPROVED_NOT_CREDITED: { type: "approved_not_credited" },
  CODE_8_ELIGIBILITY: { type: "eligibility" },
  CODE_9_WRONG_FORM: { type: "wrong_form" },
};

const DIAGNOSABLE_CODES: DiagnosableCode[] = [
  "CODE_1_NAME_DOB",
  "CODE_2_DOE",
  "CODE_3_BANK_KYC",
  "CODE_4_EPS",
  "CODE_5_OLD_CLAIM",
];

function isDiagnosableCode(code: RuleCode): code is DiagnosableCode {
  return (DIAGNOSABLE_CODES as RuleCode[]).includes(code);
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

/** First sentence of an explanation, used as Variant A's "one-sentence restatement of the
 * issue" (spec Section 6, Variant A). Falls back to the whole string if no sentence break
 * is found. */
function firstSentence(text: string): string {
  const match = text.match(/^.*?[.!?](?:\s|$)/);
  return (match ? match[0] : text).trim();
}

export interface PostRejectionFlowResult {
  diagnosis: DiagnoseResult;
  /** Present only when 2+ diagnosable codes were selected (spec Section 4). */
  priority?: PriorityResult;
  /** Absent for any code in DEADLINE_SUPPRESSED_CODES (types.ts) — currently Code 8 (ticket
   * 16) and Code 9 (ticket 17). Those claims were never going to be settled under the 3/20-day
   * clock regardless, so showing a deadline/penalty check would be actively misleading, not
   * just unused. Present for every other code. */
  deadline?: DeadlineResult;
  /** Present when the situation warrants an auto-generated grievance. Absent when, e.g.,
   * Code 7's self-check found an issue to fix first (spec Section 3, Code 7). */
  grievance?: GrievanceOutput;
}

// Return type is the full VariantKind (grievance.ts) rather than a re-declared subset union —
// this function only ever constructs 4 of its 6 members (approved_not_credited/demand_reason
// are built directly elsewhere, for Codes 6/7), but typing it as the shared union means a
// future VariantKind addition needs updating in exactly one place, not two kept in sync by
// hand (ticket 15, code-review pass).
function kindForPrimaryCode(code: DiagnosableCode, diag: DiagnoseResult, input: PostRejectionInput): VariantKind {
  const entry = diag.entries.find((e) => e.code === code);
  if (!entry) throw new Error(`No diagnosis entry found for primary code ${code}`);

  if (code === "CODE_1_NAME_DOB" && hasBranch(entry, "portal_sync_bug")) {
    return { type: "portal_sync_bug" };
  }
  if (code === "CODE_3_BANK_KYC" && hasBranch(entry, "joint_account")) {
    return { type: "joint_account" };
  }
  if (code === "CODE_3_BANK_KYC" && entry.meta && "band" in entry.meta) {
    return {
      type: "bank_kyc_escalate",
      band: entry.meta.band,
      bank_kyc_submission_date: input.bank_kyc_submission_date!,
    };
  }
  return { type: "standard", code, codeName: CODE_DEFINITIONS[code].name, issueSentence: firstSentence(entry.explanation) };
}

/** Grievance kind for an issue found via the self-check sub-flow (Code 7's fallback).
 * Returns null when no grievance variant applies yet — currently only Code 3 (bank KYC),
 * since no submission date is collected in this context (spec Section 3 footnote), so
 * there's no band to justify Variant B's escalation text, and Variant A never covers Code 3
 * (spec Section 6 scopes it to Codes 1, 2, 4, 5 only). */
function kindForSelfCheckIssue(entry: DiagnosisEntry): StandardKind | null {
  if (entry.code === "CODE_3_BANK_KYC") return null;
  return { type: "standard", code: entry.code, codeName: CODE_DEFINITIONS[entry.code].name, issueSentence: firstSentence(entry.explanation) };
}

export function runPostRejectionFlow(input: PostRejectionInput): PostRejectionFlowResult {
  const today = input.today_date ?? todayISO();

  const diagnosis = diagnose({
    codes: input.rejection_codes_selected,
    today_date: today,
    namedob_kyc_page_status: input.namedob_kyc_page_status,
    bank_account_type: input.bank_account_type,
    bank_kyc_submission_date: input.bank_kyc_submission_date,
    eligibility_issue_type: input.eligibility_issue_type,
    withdrawal_intent: input.withdrawal_intent,
    self_check_answers: input.self_check_answers,
  });

  // Ticket 16 (Code 8) / ticket 17 (Code 9): these claims were never going to be settled
  // regardless of the 3/20-day clock — showing "EPFO missed its deadline, you're owed a
  // penalty" here would be actively misleading, not just unused, so the check is skipped
  // entirely rather than computed-but-hidden. Declarative list in types.ts (DEADLINE_SUPPRESSED_CODES)
  // so a future suppressed code doesn't need another hand-added branch here.
  const suppressesDeadline = input.rejection_codes_selected.some((c) => DEADLINE_SUPPRESSED_CODES.includes(c));
  const deadline = suppressesDeadline ? undefined : checkDeadline(input.filing_date, input.kyc_complete_at_filing, today);

  const diagnosableSelected = input.rejection_codes_selected.filter(isDiagnosableCode);
  const priority = diagnosableSelected.length > 1 ? prioritize(diagnosableSelected) : undefined;

  const uan = input.uan ?? "";
  const claimId = input.claim_id ?? "";

  let grievance: GrievanceOutput | undefined;

  // Exclusive code with a fixed grievance kind (Code 6, 8, or 9) — see EXCLUSIVE_CODE_GRIEVANCE_KIND
  // above. Each of Code 8's 3 branches and Code 9's 4 branches all map to the same
  // not_applicable outcome in grievance.ts, so no branch-specific lookup is needed here.
  //
  // Iterate the TABLE's key order (Code 6, then 8, then 9 — as declared above), not
  // rejection_codes_selected's order. schema.ts's cross-field validation already guarantees
  // at most one exclusive code reaches this function on any real (validated) request, but a
  // code-review pass on this ticket flagged that a caller bypassing that validation would get
  // an outcome that depends on array order — Code 6 no longer always winning, unlike the old
  // hand-written `else if` chain this table replaced. This restores that old guarantee.
  const exclusiveCode = (Object.keys(EXCLUSIVE_CODE_GRIEVANCE_KIND) as RuleCode[]).find((code) =>
    input.rejection_codes_selected.includes(code)
  );
  const exclusiveKind = exclusiveCode ? EXCLUSIVE_CODE_GRIEVANCE_KIND[exclusiveCode] : undefined;

  if (exclusiveKind) {
    grievance = buildGrievance({
      uan,
      claim_id: claimId,
      filing_date: input.filing_date,
      today_date: today,
      deadline,
      kind: exclusiveKind,
    });
  } else if (input.rejection_codes_selected.includes("CODE_7_NO_REASON")) {
    if (diagnosis.selfCheck?.allClean) {
      grievance = buildGrievance({
        uan,
        claim_id: claimId,
        filing_date: input.filing_date,
        today_date: today,
        deadline,
        kind: { type: "demand_reason" },
      });
    } else if (diagnosis.selfCheck && diagnosis.selfCheck.issueEntries.length > 0) {
      // Spec Section 8a's workflow diagram routes this path (node E) through the deadline
      // check into grievance generation (node V), the same as every other single-code
      // diagnosis path — it is not a dead end. No priority ranking applies to self-check-
      // derived issues (Section 4 is keyed off rejection_codes_selected, not these; this
      // mirrors the pre-filing flow's explicit "no ranking" rule in Section 7), so the first
      // issue found, in the checklist's fixed order, is the grievance subject.
      const primaryIssue = diagnosis.selfCheck.issueEntries[0]!;
      const kind = kindForSelfCheckIssue(primaryIssue);
      if (kind) {
        grievance = buildGrievance({
          uan,
          claim_id: claimId,
          filing_date: input.filing_date,
          today_date: today,
          deadline,
          kind,
        });
      }
      // Else: the primary issue is Code 3 (bank KYC) with no submission date collected —
      // no grievance variant applies yet (see kindForSelfCheckIssue). The citizen sees
      // CODE_3_GENERAL's fix text (contact your bank — ticket 13) and should follow that first.
    }
    // Else: only unsure items were found, nothing conclusive — nothing to escalate yet.
  } else if (diagnosableSelected.length > 0) {
    // MVP simplification (not stated explicitly in the spec, which only shows single-code
    // grievance examples): when multiple codes are selected, generate one grievance for the
    // fix-first ("primary") code — the same code the priority check tells the citizen to
    // fix first. Secondary/unranked codes still get their own diagnosis text, just not a
    // second grievance.
    const primary = priority?.ranked[0] ?? diagnosableSelected[0]!;
    const kind = kindForPrimaryCode(primary, diagnosis, input);
    grievance = buildGrievance({
      uan,
      claim_id: claimId,
      filing_date: input.filing_date,
      today_date: today,
      deadline,
      kind,
    });
  }

  return { diagnosis, priority, deadline, grievance };
}

export function runPreFilingFlow(input: PreFilingInput): ReadinessResult {
  return readinessResult(input.self_check_answers);
}

export * from "./types";
export type { DiagnosisEntry, EntryBranch } from "./diagnose";
export { hasBranch } from "./diagnose";
export type { PriorityResult } from "./prioritize";
export type { DeadlineResult, DeadlineStatus } from "./deadline";
export type { GrievanceOutput, GrievanceVariant, SuggestedCategory } from "./grievance";
export { SUGGESTED_CATEGORY_CAVEAT } from "./grievance";
export type { ReadinessResult, ReadinessOutcome } from "./readiness";
