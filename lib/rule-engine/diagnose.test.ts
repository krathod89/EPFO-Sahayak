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
    expect(result.entries[0]!.explanation).toMatch(/typical.*turnaround/);
  });

  // Ticket 13 (2026-08-31): band 2's fix used to tell the citizen to chase their employer's
  // approval — EPFO's April 2025 order removed that step entirely. Confirms the corrected
  // copy neither instructs that nor mentions an employer at all.
  it("computes band 2 without any employer-approval instruction", () => {
    const result = diagnose({
      codes: ["CODE_3_BANK_KYC"],
      today_date: "2026-08-29",
      bank_kyc_submission_date: "2026-08-20", // 6 working days before 2026-08-29
    });
    expect(result.entries[0]!.meta).toMatchObject({ band: 2 });
    expect(result.entries[0]!.fix).not.toMatch(/employer/i);
  });

  it("computes band 3 and an escalate-worthy message for a long-pending submission, with no employer-approval framing", () => {
    const result = diagnose({
      codes: ["CODE_3_BANK_KYC"],
      today_date: "2026-08-29",
      bank_kyc_submission_date: "2026-07-01",
    });
    expect(result.entries[0]!.meta).toMatchObject({ band: 3 });
    expect(result.entries[0]!.fix).toMatch(/Raise a grievance/);
    // The fix (the actionable instruction) must never send the citizen to chase an employer —
    // that was the actual bug. The shared intro deliberately still names "employer" once, to
    // debunk the exact misconception EPFO's own April 2025 order was meant to end.
    expect(result.entries[0]!.fix).not.toMatch(/employer/i);
  });

  it("throws if Code 3 is selected without a submission date, and the account isn't joint", () => {
    expect(() => diagnose({ codes: ["CODE_3_BANK_KYC"], today_date: "2026-08-29" })).toThrow();
    expect(() =>
      diagnose({ codes: ["CODE_3_BANK_KYC"], today_date: "2026-08-29", bank_account_type: "individual" })
    ).toThrow();
    expect(() =>
      diagnose({ codes: ["CODE_3_BANK_KYC"], today_date: "2026-08-29", bank_account_type: "unsure" })
    ).toThrow();
  });
});

describe("diagnose — Code 3 joint-account branch", () => {
  // Ticket 15 (2026-08-31): a joint-account rejection is a hard rejection independent of
  // timing — no submission date needed, no wait-time band, and no employer/bank-verification
  // framing (that's a different failure mode entirely).
  it("resolves the joint-account branch without requiring a submission date", () => {
    const result = diagnose({ codes: ["CODE_3_BANK_KYC"], today_date: "2026-08-29", bank_account_type: "joint" });
    expect(result.entries[0]!.meta).toMatchObject({ branch: "joint_account" });
    expect(result.entries[0]!.explanation).toMatch(/joint account/i);
    expect(result.entries[0]!.fix).toMatch(/individual/i);
  });

  it("the joint-account fix is distinct from the KYC-verification fix text", () => {
    const result = diagnose({ codes: ["CODE_3_BANK_KYC"], today_date: "2026-08-29", bank_account_type: "joint" });
    expect(result.entries[0]!.fix).not.toMatch(/employer/i);
    expect(result.entries[0]!.fix).not.toMatch(/typical.*turnaround/i);
    expect(result.entries[0]!.fix).not.toMatch(/working days/i);
  });

  it("ignores a submission date if one is somehow present alongside a joint account", () => {
    // Belt-and-suspenders: even if the UI sent a stale date, the joint-account branch must
    // win — a joint account is never "still within the normal wait."
    const result = diagnose({
      codes: ["CODE_3_BANK_KYC"],
      today_date: "2026-08-29",
      bank_account_type: "joint",
      bank_kyc_submission_date: "2026-08-27",
    });
    expect(result.entries[0]!.meta).toMatchObject({ branch: "joint_account" });
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

describe("diagnose — Code 8 (eligibility/service-period), ticket 16", () => {
  it("throws if Code 8 is selected without eligibility_issue_type", () => {
    expect(() => diagnose({ codes: ["CODE_8_ELIGIBILITY"], today_date: "2026-08-29" })).toThrow();
  });

  it("resolves the under-six-months branch, without 'not your fault' framing", () => {
    const result = diagnose({
      codes: ["CODE_8_ELIGIBILITY"],
      today_date: "2026-08-29",
      eligibility_issue_type: "under_six_months",
    });
    expect(result.entries[0]!.meta).toMatchObject({ branch: "under_six_months" });
    expect(result.entries[0]!.explanation).toMatch(/6 months/);
    expect(result.entries[0]!.fix).toMatch(/wait/i);
    // PRD §4's core thesis ("not your fault") deliberately does NOT apply here — this is
    // usually a real, correct eligibility rule, not a records mismatch.
    expect(result.entries[0]!.explanation).not.toMatch(/not your fault/i);
  });

  it("resolves the over-nine-half-years branch, pointing to Form 10D instead of waiting", () => {
    const result = diagnose({
      codes: ["CODE_8_ELIGIBILITY"],
      today_date: "2026-08-29",
      eligibility_issue_type: "over_nine_half_years",
    });
    expect(result.entries[0]!.meta).toMatchObject({ branch: "over_nine_half_years" });
    expect(result.entries[0]!.explanation).toMatch(/9\.5 years/);
    expect(result.entries[0]!.fix).toMatch(/Form 10D/);
    expect(result.entries[0]!.explanation).not.toMatch(/not your fault/i);
  });

  it("resolves the unsure branch honestly, without guessing which threshold applies", () => {
    const result = diagnose({
      codes: ["CODE_8_ELIGIBILITY"],
      today_date: "2026-08-29",
      eligibility_issue_type: "unsure",
    });
    expect(result.entries[0]!.meta).toMatchObject({ branch: "unsure" });
    // The unsure fix must cover both possible remedies, not silently pick one.
    expect(result.entries[0]!.fix).toMatch(/6 months/);
    expect(result.entries[0]!.fix).toMatch(/9\.5 years/);
  });
});

describe("diagnose — Code 9 (wrong form filed), ticket 17", () => {
  it("throws if Code 9 is selected without withdrawal_intent", () => {
    expect(() => diagnose({ codes: ["CODE_9_WRONG_FORM"], today_date: "2026-08-29" })).toThrow();
  });

  it("resolves the full_settlement branch, pointing to Form 19", () => {
    const result = diagnose({
      codes: ["CODE_9_WRONG_FORM"],
      today_date: "2026-08-29",
      withdrawal_intent: "full_settlement",
    });
    expect(result.entries[0]!.meta).toMatchObject({ branch: "full_settlement" });
    expect(result.entries[0]!.fix).toMatch(/Form 19/);
    // Same framing rule as Code 8 — this is a filing-choice case, not "not your fault."
    expect(result.entries[0]!.explanation).not.toMatch(/not your fault/i);
  });

  it("resolves the pension_only branch, pointing to Form 10C", () => {
    const result = diagnose({
      codes: ["CODE_9_WRONG_FORM"],
      today_date: "2026-08-29",
      withdrawal_intent: "pension_only",
    });
    expect(result.entries[0]!.meta).toMatchObject({ branch: "pension_only" });
    expect(result.entries[0]!.fix).toMatch(/Form 10C/);
  });

  it("resolves the advance branch, pointing to Form 31", () => {
    const result = diagnose({
      codes: ["CODE_9_WRONG_FORM"],
      today_date: "2026-08-29",
      withdrawal_intent: "advance",
    });
    expect(result.entries[0]!.meta).toMatchObject({ branch: "advance" });
    expect(result.entries[0]!.fix).toMatch(/Form 31/);
  });

  it("resolves the unsure branch honestly, covering all 3 forms rather than guessing", () => {
    const result = diagnose({
      codes: ["CODE_9_WRONG_FORM"],
      today_date: "2026-08-29",
      withdrawal_intent: "unsure",
    });
    expect(result.entries[0]!.meta).toMatchObject({ branch: "unsure" });
    expect(result.entries[0]!.explanation).toMatch(/Form 19/);
    expect(result.entries[0]!.explanation).toMatch(/Form 10C/);
    expect(result.entries[0]!.explanation).toMatch(/Form 31/);
  });
});
