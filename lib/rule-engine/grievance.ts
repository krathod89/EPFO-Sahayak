// Grievance-text generation (H13). Source: Rule Engine/Rule Engine Spec.md Section 6.
// Only the first-level EPFiGMS grievance is built here — a second-level CPGRAMS
// escalation template is named v2 scope (spec Section 9, gap 7), not built in this module.
//
// NOTE (ticket 14, 2026-08-31): EPFiGMS's exact category/subcategory dropdown taxonomy is
// only visible after a real citizen's UAN+OTP login — confirmed unreachable in this
// environment, and no secondary source documents it either (checked). Rather than wait
// indefinitely, this module ships a broad-category HINT (`suggestedCategory` below) built
// from `SUGGESTED_CATEGORY_BY_CODE` in codes.ts (per-code data lives there, alongside every
// other code-keyed copy constant — see that file for the full citation and caveat).

import { SUGGESTED_CATEGORY_BY_CODE, type SuggestedCategory } from "./codes";
import type { DeadlineResult } from "./deadline";
import type { ISODate, RuleCode } from "./types";

export type GrievanceVariant = "A" | "B" | "C" | "D" | "E";
export type { SuggestedCategory } from "./codes";
export { SUGGESTED_CATEGORY_CAVEAT } from "./codes";

/** Variant A's shape — Codes 1 (standard branch), 2, 4, 5. `code` carries which one, so
 * `suggestedCategoryFor()` can look up the right category. Exported so index.ts's two
 * builder functions (`kindForPrimaryCode`, `kindForSelfCheckIssue`) can type their return
 * value against this instead of duplicating the object shape inline. */
export interface StandardKind {
  type: "standard";
  code: RuleCode;
  codeName: string;
  issueSentence: string;
}

// Exported (ticket 15, code-review pass) so index.ts's kindForPrimaryCode can type its
// return value against this directly, instead of re-declaring an overlapping subset union
// that has to be kept in sync by hand every time a variant is added here.
export type VariantKind =
  | StandardKind
  | { type: "bank_kyc_escalate"; band: 1 | 2 | 3; bank_kyc_submission_date: ISODate } // Variant B — Code 3, band 3 only.
    // Text re-anchored 2026-08-31 (ticket 13): no longer references employer approval —
    // EPFO's April 2025 order removed that step from bank-KYC seeding. See waitBands.ts.
  | { type: "portal_sync_bug" } // Variant C — Code 1, portal-sync-bug branch
  | { type: "approved_not_credited" } // Variant D — Code 6
  | { type: "demand_reason" } // Variant E — Code 7, all self-checks clean
  | { type: "joint_account" } // No grievance variant — Code 3, joint-account branch (ticket 15). Always not_applicable; see buildVariantContent.
  | { type: "eligibility" } // No grievance variant — Code 8 (ticket 16). Always not_applicable — a genuine eligibility rule can't be overridden by a grievance.
  | { type: "wrong_form" }; // No grievance variant — Code 9 (ticket 17). Always not_applicable — the fix is refiling under the correct form, not escalating.

export interface GrievanceRequest {
  uan: string;
  claim_id: string;
  filing_date: ISODate;
  today_date: ISODate;
  /** Appends the deadline-citation block when present and MISSED. */
  deadline?: DeadlineResult;
  kind: VariantKind;
}

export type GrievanceOutput =
  | { ready: true; variant: GrievanceVariant; subject: string; body: string; deadlineCited: boolean; suggestedCategory: SuggestedCategory }
  | { ready: false; reason: "missing_info"; missing: ("uan" | "claim_id")[] }
  | { ready: false; reason: "not_applicable"; note: string };

/** Looks up each variant's broad-category guess through the single exhaustive table in
 * codes.ts (`SUGGESTED_CATEGORY_BY_CODE`), rather than a second, separately-maintained guess
 * here — every non-`standard` variant is fixed 1:1 to one code, so it looks that code
 * straight up; `standard` carries its code directly. Only called for a `ready: true` result
 * (see `buildGrievance` below), so `joint_account` — always `not_applicable` — never actually
 * reaches this function; its branch below exists for exhaustiveness, not live behavior. See
 * module note above for why this is a guess, not an exact mapping. */
function suggestedCategoryFor(kind: VariantKind): SuggestedCategory {
  const code: RuleCode = (() => {
    switch (kind.type) {
      case "standard":
        return kind.code;
      case "bank_kyc_escalate":
      case "joint_account":
        return "CODE_3_BANK_KYC";
      case "portal_sync_bug":
        return "CODE_1_NAME_DOB";
      case "approved_not_credited":
        return "CODE_6_APPROVED_NOT_CREDITED";
      case "demand_reason":
        return "CODE_7_NO_REASON";
      case "eligibility":
        return "CODE_8_ELIGIBILITY";
      case "wrong_form":
        return "CODE_9_WRONG_FORM";
    }
  })();
  return SUGGESTED_CATEGORY_BY_CODE[code];
}

function deadlineCitation(deadline: DeadlineResult | undefined, filingDate: ISODate): string | null {
  if (!deadline || deadline.status !== "MISSED") return null;
  return `I also note that EPFO's own rule requires settlement within ${deadline.deadlineDays} days of filing (filed ${filingDate}). This deadline was missed by ${deadline.daysLate} day(s). Under EPFO's delay-penalty rule, I am entitled to 12% penal interest on my claim amount for this delay. I request this penalty be applied.`;
}

function buildVariantContent(request: GrievanceRequest): { variant: GrievanceVariant; subject: string; core: string } | { notApplicable: string } {
  const { uan, claim_id, filing_date, today_date, kind } = request;

  switch (kind.type) {
    case "standard":
      return {
        variant: "A",
        subject: `Grievance regarding rejection of PF claim — ${kind.codeName}`,
        core: `My PF withdrawal claim (Claim ID: ${claim_id}, UAN: ${uan}) was rejected. The stated reason was: ${kind.codeName}. ${kind.issueSentence} I request EPFO to review and resettle my claim.`,
      };

    case "bank_kyc_escalate":
      if (kind.band !== 3) {
        return {
          notApplicable:
            "No grievance is generated for wait-time bands 1-2 — the recommended action is to wait or check with your bank directly, not to file a grievance yet (Rule Engine Spec.md Section 6, Variant B).",
        };
      }
      return {
        variant: "B",
        subject: `Grievance regarding unverified bank KYC — Claim ID ${claim_id}`,
        core: `My PF claim (Claim ID: ${claim_id}, UAN: ${uan}) is blocked because my bank KYC is not verified. I submitted my bank KYC on ${kind.bank_kyc_submission_date}. This has taken longer than the typical bank/NPCI verification turnaround. I request EPFO to check the status of my bank KYC verification directly and resettle my claim.`,
      };

    case "joint_account":
      return {
        notApplicable:
          "No grievance is generated for a joint-account rejection — the fix is opening an individual bank account and resubmitting, not something to escalate with EPFO (Rule Engine Spec.md Section 6).",
      };

    case "eligibility":
      return {
        notApplicable:
          "No grievance is generated for an eligibility rejection — a genuine service-length rule can't be overridden by filing a grievance. See the fix text above for the actual next step (Rule Engine Spec.md Section 6).",
      };

    case "wrong_form":
      return {
        notApplicable:
          "No grievance is generated for a wrong-form-filed rejection — the fix is refiling under the correct form, not something to escalate with EPFO (Rule Engine Spec.md Section 6).",
      };

    case "portal_sync_bug":
      return {
        variant: "C",
        subject: `Grievance — claim screen shows outdated mismatch, KYC page already Approved and Verified — Claim ID ${claim_id}`,
        core: `My PF claim (Claim ID: ${claim_id}, UAN: ${uan}) was rejected for a name/DOB/father's-name mismatch. My KYC page already shows this detail as Approved and Verified (screenshot attached). My claim status page still shows this as an error (screenshot attached). This appears to be a synchronization issue between EPFO's KYC and claim-processing systems, not an actual mismatch in my records. I request EPFO to correct this synchronization issue and reprocess my claim without requiring a new Joint Declaration.`,
      };

    case "approved_not_credited":
      return {
        variant: "D",
        subject: `Grievance — PF claim approved but payment not received — Claim ID ${claim_id}`,
        core: `My PF claim (Claim ID: ${claim_id}, UAN: ${uan}) was approved. The payment has not reached my bank account as of ${today_date}. I have checked my bank statement and found no matching transfer. I request EPFO to trace this payment and confirm its status, or reissue it if it failed.`,
      };

    case "demand_reason":
      return {
        variant: "E",
        subject: `Grievance — PF claim rejected with no reason given — Claim ID ${claim_id}`,
        core: `My PF claim (Claim ID: ${claim_id}, UAN: ${uan}), filed on ${filing_date}, was rejected. EPFO's claim status did not state a reason. I have checked my own records for the common causes of rejection — Date of Exit, KYC verification, name/DOB/father's-name consistency, EPS contribution history, and any pending old claim — and found no issue on my end. I request EPFO to state the specific reason my claim was rejected, and to reprocess my claim once I have that information.`,
      };
  }
}

export function buildGrievance(request: GrievanceRequest): GrievanceOutput {
  // not_applicable is checked BEFORE missing_info, not after: whether a grievance can ever
  // exist for this kind (wait bands 1-2, joint_account, eligibility, wrong_form) is a function
  // of the diagnosed kind alone, not of whether uan/claim_id happen to be filled in yet. The
  // old order surfaced a misleading intermediate "missing_info" state for these kinds — a
  // second code-review pass on ticket 17 traced this back from a Wizard.tsx UI symptom
  // (diagnosisSummary/grievanceOutput unconditionally promising "grievance text" even when the
  // situation could never produce one) to this ordering being the actual root cause.
  const content = buildVariantContent(request);
  if ("notApplicable" in content) {
    return { ready: false, reason: "not_applicable", note: content.notApplicable };
  }

  const missing: ("uan" | "claim_id")[] = [];
  if (!request.uan) missing.push("uan");
  if (!request.claim_id) missing.push("claim_id");
  if (missing.length > 0) return { ready: false, reason: "missing_info", missing };

  const citation = deadlineCitation(request.deadline, request.filing_date);
  const body = citation ? `${content.core}\n\n${citation}` : content.core;

  return {
    ready: true,
    variant: content.variant,
    subject: content.subject,
    body,
    deadlineCited: citation !== null,
    suggestedCategory: suggestedCategoryFor(request.kind),
  };
}
