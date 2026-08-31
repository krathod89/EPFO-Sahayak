import { describe, it, expect } from "vitest";
import { diagnoseRequestSchema, validatePostRejectionCrossFields } from "./schema";

describe("diagnoseRequestSchema", () => {
  it("accepts a minimal valid pre_filing request", () => {
    const result = diagnoseRequestSchema.safeParse({
      entry_point: "pre_filing",
      self_check_answers: {
        doe_marked: "yes",
        kyc_verified_not_just_approved: "yes",
        name_dob_fathername_consistent: "yes",
        eps_history_continuous: "yes",
        old_claim_pending: "no",
      },
    });
    expect(result.success).toBe(true);
  });

  it("rejects a post_rejection request with no codes selected", () => {
    const result = diagnoseRequestSchema.safeParse({
      entry_point: "post_rejection",
      rejection_codes_selected: [],
      filing_date: "2026-08-01",
      kyc_complete_at_filing: true,
    });
    expect(result.success).toBe(false);
  });

  it("rejects a malformed date", () => {
    const result = diagnoseRequestSchema.safeParse({
      entry_point: "post_rejection",
      rejection_codes_selected: ["CODE_2_DOE"],
      filing_date: "08/01/2026",
      kyc_complete_at_filing: true,
    });
    expect(result.success).toBe(false);
  });
});

describe("validatePostRejectionCrossFields", () => {
  const base = {
    entry_point: "post_rejection" as const,
    filing_date: "2026-08-01",
    kyc_complete_at_filing: true,
  };

  it("requires namedob_kyc_page_status when CODE_1 is selected", () => {
    const errors = validatePostRejectionCrossFields({ ...base, rejection_codes_selected: ["CODE_1_NAME_DOB"] });
    expect(errors.length).toBeGreaterThan(0);
  });

  it("passes when CODE_1 is selected with the required field present", () => {
    const errors = validatePostRejectionCrossFields({
      ...base,
      rejection_codes_selected: ["CODE_1_NAME_DOB"],
      namedob_kyc_page_status: "not_verified",
    });
    expect(errors).toHaveLength(0);
  });

  it("rejects Code 6 combined with another code", () => {
    const errors = validatePostRejectionCrossFields({
      ...base,
      rejection_codes_selected: ["CODE_6_APPROVED_NOT_CREDITED", "CODE_2_DOE"],
    });
    expect(errors.some((e) => e.includes("cannot be combined"))).toBe(true);
  });

  it("rejects Code 6 and Code 7 selected together, with nothing else", () => {
    // Regression case: a length-based check that only compares against the exclusive
    // subset misses this, since both codes count toward that subset.
    const errors = validatePostRejectionCrossFields({
      ...base,
      rejection_codes_selected: ["CODE_6_APPROVED_NOT_CREDITED", "CODE_7_NO_REASON"],
      self_check_answers: {
        doe_marked: "yes",
        kyc_verified_not_just_approved: "yes",
        name_dob_fathername_consistent: "yes",
        eps_history_continuous: "yes",
        old_claim_pending: "no",
      },
    });
    expect(errors.some((e) => e.includes("cannot be combined"))).toBe(true);
  });

  it("rejects a duplicate code in rejection_codes_selected", () => {
    const errors = validatePostRejectionCrossFields({
      ...base,
      rejection_codes_selected: ["CODE_2_DOE", "CODE_2_DOE"],
    });
    expect(errors.some((e) => e.includes("duplicate"))).toBe(true);
  });

  // Ticket 15 (joint-account rejection): bank_account_type is required whenever CODE_3 is
  // selected, and bank_kyc_submission_date is required too — UNLESS the account is joint,
  // since a joint-account rejection is a hard rejection independent of timing.
  it("requires bank_account_type when CODE_3 is selected", () => {
    const errors = validatePostRejectionCrossFields({
      ...base,
      rejection_codes_selected: ["CODE_3_BANK_KYC"],
      bank_kyc_submission_date: "2026-08-01",
    });
    expect(errors.some((e) => e.includes("bank_account_type"))).toBe(true);
  });

  it("requires bank_kyc_submission_date when the account is individual", () => {
    const errors = validatePostRejectionCrossFields({
      ...base,
      rejection_codes_selected: ["CODE_3_BANK_KYC"],
      bank_account_type: "individual",
    });
    expect(errors.some((e) => e.includes("bank_kyc_submission_date"))).toBe(true);
  });

  it("does NOT require bank_kyc_submission_date when the account is joint", () => {
    const errors = validatePostRejectionCrossFields({
      ...base,
      rejection_codes_selected: ["CODE_3_BANK_KYC"],
      bank_account_type: "joint",
    });
    expect(errors).toHaveLength(0);
  });
});
