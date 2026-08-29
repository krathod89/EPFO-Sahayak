import { describe, it, expect } from "vitest";
import { runPostRejectionFlow, runPreFilingFlow } from "./index";
import type { PostRejectionInput, PreFilingInput } from "./types";

const baseInput: Omit<PostRejectionInput, "rejection_codes_selected"> = {
  entry_point: "post_rejection",
  uan: "UAN123456789",
  claim_id: "CLAIM987",
  filing_date: "2026-08-01",
  kyc_complete_at_filing: true,
  today_date: "2026-08-10", // well past the 3-day deadline
};

describe("runPostRejectionFlow — single code, deadline missed", () => {
  it("diagnoses, flags the missed deadline, and generates a Variant A grievance citing the penalty", () => {
    const result = runPostRejectionFlow({ ...baseInput, rejection_codes_selected: ["CODE_2_DOE"] });
    expect(result.diagnosis.entries[0]!.code).toBe("CODE_2_DOE");
    expect(result.priority).toBeUndefined(); // single code, no ranking needed
    expect(result.deadline.status).toBe("MISSED");
    expect(result.grievance?.ready).toBe(true);
    if (result.grievance?.ready) {
      expect(result.grievance.variant).toBe("A");
      expect(result.grievance.deadlineCited).toBe(true);
    }
  });
});

describe("runPostRejectionFlow — two codes, generates grievance for the fix-first code", () => {
  it("picks Bank KYC (Tier 2, ranks above Name/DOB) as the primary grievance subject", () => {
    const result = runPostRejectionFlow({
      ...baseInput,
      rejection_codes_selected: ["CODE_1_NAME_DOB", "CODE_3_BANK_KYC"],
      namedob_kyc_page_status: "not_verified",
      bank_kyc_submission_date: "2026-06-01", // long-pending -> band 3
    });
    expect(result.priority?.tier2).toEqual(["CODE_3_BANK_KYC", "CODE_1_NAME_DOB"]);
    expect(result.grievance?.ready).toBe(true);
    if (result.grievance?.ready) {
      expect(result.grievance.variant).toBe("B"); // bank KYC escalation, band 3
    }
  });
});

describe("runPostRejectionFlow — Code 6 (approved but not credited)", () => {
  it("always generates a Variant D grievance", () => {
    const result = runPostRejectionFlow({
      ...baseInput,
      rejection_codes_selected: ["CODE_6_APPROVED_NOT_CREDITED"],
    });
    expect(result.grievance?.ready).toBe(true);
    if (result.grievance?.ready) expect(result.grievance.variant).toBe("D");
  });
});

describe("runPostRejectionFlow — Code 7, all self-checks clean", () => {
  it("generates the Variant E 'demand the real reason' grievance", () => {
    const result = runPostRejectionFlow({
      ...baseInput,
      rejection_codes_selected: ["CODE_7_NO_REASON"],
      self_check_answers: {
        doe_marked: "yes",
        kyc_verified_not_just_approved: "yes",
        name_dob_fathername_consistent: "yes",
        eps_history_continuous: "yes",
        old_claim_pending: "no",
      },
    });
    expect(result.diagnosis.selfCheck?.allClean).toBe(true);
    expect(result.grievance?.ready).toBe(true);
    if (result.grievance?.ready) expect(result.grievance.variant).toBe("E");
  });
});

describe("runPostRejectionFlow — Code 7, an issue found", () => {
  it("generates a Variant A grievance for the found issue, same as selecting that code directly", () => {
    const result = runPostRejectionFlow({
      ...baseInput,
      rejection_codes_selected: ["CODE_7_NO_REASON"],
      self_check_answers: {
        doe_marked: "no",
        kyc_verified_not_just_approved: "yes",
        name_dob_fathername_consistent: "yes",
        eps_history_continuous: "yes",
        old_claim_pending: "no",
      },
    });
    expect(result.diagnosis.selfCheck?.allClean).toBe(false);
    expect(result.grievance?.ready).toBe(true);
    if (result.grievance?.ready) {
      expect(result.grievance.variant).toBe("A");
      expect(result.grievance.body).toMatch(/Date of Exit/);
    }
  });

  it("generates no grievance when the only issue found is bank KYC (no submission date collected here)", () => {
    const result = runPostRejectionFlow({
      ...baseInput,
      rejection_codes_selected: ["CODE_7_NO_REASON"],
      self_check_answers: {
        doe_marked: "yes",
        kyc_verified_not_just_approved: "no",
        name_dob_fathername_consistent: "yes",
        eps_history_continuous: "yes",
        old_claim_pending: "no",
      },
    });
    expect(result.grievance).toBeUndefined();
  });

  it("generates no grievance when only unsure items were found (nothing conclusive yet)", () => {
    const result = runPostRejectionFlow({
      ...baseInput,
      rejection_codes_selected: ["CODE_7_NO_REASON"],
      self_check_answers: {
        doe_marked: "unsure",
        kyc_verified_not_just_approved: "yes",
        name_dob_fathername_consistent: "yes",
        eps_history_continuous: "yes",
        old_claim_pending: "no",
      },
    });
    expect(result.grievance).toBeUndefined();
  });
});

describe("runPreFilingFlow", () => {
  it("delegates directly to the readiness check, with no priority/deadline fields", () => {
    const input: PreFilingInput = {
      entry_point: "pre_filing",
      self_check_answers: {
        doe_marked: "yes",
        kyc_verified_not_just_approved: "yes",
        name_dob_fathername_consistent: "yes",
        eps_history_continuous: "yes",
        old_claim_pending: "no",
      },
    };
    const result = runPreFilingFlow(input);
    expect(result.outcome).toBe("ready");
  });
});
