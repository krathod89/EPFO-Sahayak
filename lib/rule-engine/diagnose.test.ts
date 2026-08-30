import { describe, it, expect } from "vitest";
import { diagnose } from "./diagnose";
import type { RuleCode } from "./types";

describe("diagnose — simple codes (2, 4, 5, 6)", () => {
  const simpleCodes: RuleCode[] = [
    "CODE_2_DOE",
    "CODE_4_EPS",
    "CODE_5_OLD_CLAIM",
    "CODE_6_APPROVED_NOT_CREDITED",
  ];

  for (const code of simpleCodes) {
    it(`resolves ${code} to a non-empty explanation and fix`, () => {
      const result = diagnose({ codes: [code], today_date: "2026-08-29" });
      expect(result.entries).toHaveLength(1);
      expect(result.entries[0]!.code).toBe(code);
      expect(result.entries[0]!.explanation.length).toBeGreaterThan(0);
      expect(result.entries[0]!.fix.length).toBeGreaterThan(0);
    });
  }
});

describe("diagnose — Code 1 branching", () => {
  it("routes to the standard mismatch branch when KYC page is not verified", () => {
    const result = diagnose({
      codes: ["CODE_1_NAME_DOB"],
      today_date: "2026-08-29",
      namedob_kyc_page_status: "not_verified",
    });
    expect(result.entries[0]!.meta).toMatchObject({ branch: "standard_mismatch" });
    expect(result.entries[0]!.fix).toMatch(/Joint Declaration/);
  });

  it("routes to the standard mismatch branch when status is unsure", () => {
    const result = diagnose({
      codes: ["CODE_1_NAME_DOB"],
      today_date: "2026-08-29",
      namedob_kyc_page_status: "unsure",
    });
    expect(result.entries[0]!.meta).toMatchObject({ branch: "standard_mismatch" });
  });

  it("routes to the portal-sync-bug branch when KYC page is already approved and verified", () => {
    const result = diagnose({
      codes: ["CODE_1_NAME_DOB"],
      today_date: "2026-08-29",
      namedob_kyc_page_status: "approved_and_verified",
    });
    expect(result.entries[0]!.meta).toMatchObject({ branch: "portal_sync_bug" });
    expect(result.entries[0]!.fix).toMatch(/Do not file a Joint Declaration/);
  });
});

describe("diagnose — Code 3 wait-time bands", () => {
  it("computes band 1 for a recent submission", () => {
    const result = diagnose({
      codes: ["CODE_3_BANK_KYC"],
      today_date: "2026-08-29",
      bank_kyc_submission_date: "2026-08-27",
    });
    expect(result.entries[0]!.meta).toMatchObject({ band: 1 });
    expect(result.entries[0]!.explanation).toMatch(/normal wait/);
  });

  it("computes band 3 and an escalate-worthy message for a long-pending submission", () => {
    const result = diagnose({
      codes: ["CODE_3_BANK_KYC"],
      today_date: "2026-08-29",
      bank_kyc_submission_date: "2026-07-01",
    });
    expect(result.entries[0]!.meta).toMatchObject({ band: 3 });
    expect(result.entries[0]!.fix).toMatch(/Raise a grievance/);
  });

  it("throws if Code 3 is selected without a submission date", () => {
    expect(() => diagnose({ codes: ["CODE_3_BANK_KYC"], today_date: "2026-08-29" })).toThrow();
  });
});

describe("diagnose — Code 7 self-check sub-flow", () => {
  it("returns allClean=true and no issues when every check passes", () => {
    const result = diagnose({
      codes: ["CODE_7_NO_REASON"],
      today_date: "2026-08-29",
      self_check_answers: {
        doe_marked: "yes",
        kyc_verified_not_just_approved: "yes",
        name_dob_fathername_consistent: "yes",
        eps_history_continuous: "yes",
        old_claim_pending: "no",
      },
    });
    expect(result.selfCheck).toBeDefined();
    expect(result.selfCheck!.allClean).toBe(true);
    expect(result.selfCheck!.issueEntries).toHaveLength(0);
  });

  it("routes a failed check to that code's explanation/fix, using Code 3's general text (no band)", () => {
    const result = diagnose({
      codes: ["CODE_7_NO_REASON"],
      today_date: "2026-08-29",
      self_check_answers: {
        doe_marked: "yes",
        kyc_verified_not_just_approved: "no",
        name_dob_fathername_consistent: "yes",
        eps_history_continuous: "yes",
        old_claim_pending: "no",
      },
    });
    expect(result.selfCheck!.allClean).toBe(false);
    expect(result.selfCheck!.issueEntries).toHaveLength(1);
    expect(result.selfCheck!.issueEntries[0]!.code).toBe("CODE_3_BANK_KYC");
    expect(result.selfCheck!.issueEntries[0]!.meta).toBeUndefined(); // no band info in self-check context
  });

  it("does not treat an unsure answer as clean", () => {
    const result = diagnose({
      codes: ["CODE_7_NO_REASON"],
      today_date: "2026-08-29",
      self_check_answers: {
        doe_marked: "yes",
        kyc_verified_not_just_approved: "yes",
        name_dob_fathername_consistent: "unsure",
        eps_history_continuous: "yes",
        old_claim_pending: "no",
      },
    });
    expect(result.selfCheck!.allClean).toBe(false);
    expect(result.selfCheck!.unsureItems).toEqual(["name_dob_fathername_consistent"]);
  });

  it("throws if Code 7 is selected without self-check answers", () => {
    expect(() => diagnose({ codes: ["CODE_7_NO_REASON"], today_date: "2026-08-29" })).toThrow();
  });
});
