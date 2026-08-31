// Grievance-text generation (H13). Source: Rule Engine/Rule Engine Spec.md Section 6.
// Only the first-level EPFiGMS grievance is built here — a second-level CPGRAMS
// escalation template is named v2 scope (spec Section 9, gap 7), not built in this module.
//
// NOTE (spec Section 6, gap 8): EPFiGMS's category-dropdown taxonomy was never captured.
// This module generates the free-text BODY only. Selecting the right dropdown category is
// a known open gap, not something this module can do yet.

import type { DeadlineResult } from "./deadline";
import type { ISODate } from "./types";

export type GrievanceVariant = "A" | "B" | "C" | "D" | "E";

type VariantKind =
  | { type: "standard"; codeName: string; issueSentence: string } // Variant A — Codes 1 (standard branch), 2, 4, 5
  | { type: "bank_kyc_escalate"; band: 1 | 2 | 3; bank_kyc_submission_date: ISODate } // Variant B — Code 3, band 3 only.
    // Text re-anchored 2026-08-31 (ticket 13): no longer references employer approval —
    // EPFO's April 2025 order removed that step from bank-KYC seeding. See waitBands.ts.
  | { type: "portal_sync_bug" } // Variant C — Code 1, portal-sync-bug branch
  | { type: "approved_not_credited" } // Variant D — Code 6
  | { type: "demand_reason" }; // Variant E — Code 7, all self-checks clean

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
  | { ready: true; variant: GrievanceVariant; subject: string; body: string; deadlineCited: boolean }
  | { ready: false; reason: "missing_info"; missing: ("uan" | "claim_id")[] }
  | { ready: false; reason: "not_applicable"; note: string };

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
  const missing: ("uan" | "claim_id")[] = [];
  if (!request.uan) missing.push("uan");
  if (!request.claim_id) missing.push("claim_id");
  if (missing.length > 0) return { ready: false, reason: "missing_info", missing };

  const content = buildVariantContent(request);
  if ("notApplicable" in content) {
    return { ready: false, reason: "not_applicable", note: content.notApplicable };
  }

  const citation = deadlineCitation(request.deadline, request.filing_date);
  const body = citation ? `${content.core}\n\n${citation}` : content.core;

  return {
    ready: true,
    variant: content.variant,
    subject: content.subject,
    body,
    deadlineCited: citation !== null,
  };
}
