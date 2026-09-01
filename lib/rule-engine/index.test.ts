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
    expect(result.deadline?.status).toBe("MISSED");
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

describe("runPostRejectionFlow — Code 3, joint-account branch (ticket 15)", () => {
  // Regression coverage for a real bug the second code-review pass caught: diagnose.ts's own
  // unit tests all set bank_account_type directly, but the orchestrator's diagnose() call
  // itself omitted the field entirely — so a real citizen picking "joint account" through the
  // actual app would have hit an uncaught throw ("bank_kyc_submission_date is required...")
  // despite every lower-level unit test passing. This test exercises the real entry point
  // (runPostRejectionFlow), not diagnose()/grievance.ts in isolation, so a future orchestrator-
  // forwarding gap like this one fails here instead of shipping silently.
  it("resolves the joint-account branch with no submission date, and generates no grievance", () => {
    const result = runPostRejectionFlow({
      ...baseInput,
      rejection_codes_selected: ["CODE_3_BANK_KYC"],
      bank_account_type: "joint",
      // Deliberately no bank_kyc_submission_date — matches what the real UI sends for this path.
    });
    expect(result.diagnosis.entries[0]!.meta).toMatchObject({ branch: "joint_account" });
    expect(result.diagnosis.entries[0]!.explanation).toMatch(/joint account/i);
    expect(result.grievance?.ready).toBe(false);
    if (result.grievance && !result.grievance.ready && result.grievance.reason === "not_applicable") {
      expect(result.grievance.note).toMatch(/individual/i);
    }
  });
});

describe("runPostRejectionFlow — Code 8, eligibility branch (ticket 16)", () => {
  // Written BEFORE index.ts's Code 8 wiring, deliberately — ticket 15's second review pass
  // found the orchestrator's diagnose() call silently dropped a new field despite every
  // lower-level unit test passing. Exercising the real entry point here, first, means this
  // class of gap fails immediately during this ticket's own TDD cycle instead of needing a
  // dedicated review pass to catch it again.
  it("resolves the eligibility branch end to end, and generates no grievance", () => {
    const result = runPostRejectionFlow({
      ...baseInput,
      rejection_codes_selected: ["CODE_8_ELIGIBILITY"],
      eligibility_issue_type: "over_nine_half_years",
    });
    expect(result.diagnosis.entries[0]!.meta).toMatchObject({ branch: "over_nine_half_years" });
    expect(result.diagnosis.entries[0]!.fix).toMatch(/Form 10D/);
    expect(result.grievance?.ready).toBe(false);
    if (result.grievance && !result.grievance.ready && result.grievance.reason === "not_applicable") {
      expect(result.grievance.note).toMatch(/eligibility/i);
    }
  });

  // Ticket 16's own scope: an ineligible claim was never going to be settled regardless of
  // the 3/20-day clock, so showing "EPFO missed its deadline, you're owed a penalty" would be
  // actively misleading here — deliberately suppressed, not just left unused.
  it("suppresses the deadline check entirely for an eligibility rejection", () => {
    const result = runPostRejectionFlow({
      ...baseInput, // today_date is well past any 3/20-day deadline from filing_date
      rejection_codes_selected: ["CODE_8_ELIGIBILITY"],
      eligibility_issue_type: "under_six_months",
    });
    expect(result.deadline).toBeUndefined();
  });

  it("still computes the deadline normally for every other code", () => {
    const result = runPostRejectionFlow({ ...baseInput, rejection_codes_selected: ["CODE_2_DOE"] });
    expect(result.deadline).toBeDefined();
  });
});

describe("runPostRejectionFlow — Code 9, wrong-form branch (ticket 17)", () => {
  // Same discipline as ticket 16's Code 8 tests: written before index.ts's Code 9 wiring, to
  // catch an orchestrator-forwarding gap (a new field silently dropped) in this ticket's own
  // red phase rather than needing a dedicated review pass.
  it("resolves the wrong-form branch end to end, and generates no grievance", () => {
    const result = runPostRejectionFlow({
      ...baseInput,
      rejection_codes_selected: ["CODE_9_WRONG_FORM"],
      withdrawal_intent: "pension_only",
    });
    expect(result.diagnosis.entries[0]!.meta).toMatchObject({ branch: "pension_only" });
    expect(result.diagnosis.entries[0]!.fix).toMatch(/Form 10C/);
    expect(result.grievance?.ready).toBe(false);
    if (result.grievance && !result.grievance.ready && result.grievance.reason === "not_applicable") {
      expect(result.grievance.note).toMatch(/form/i);
    }
  });

  // A wrong-form-filed claim was never going to be settled under that form regardless of the
  // clock — same suppression reasoning as Code 8, deliberately, not just left unused.
  it("suppresses the deadline check entirely for a wrong-form rejection", () => {
    const result = runPostRejectionFlow({
      ...baseInput,
      rejection_codes_selected: ["CODE_9_WRONG_FORM"],
      withdrawal_intent: "advance",
    });
    expect(result.deadline).toBeUndefined();
  });
});

describe("runPostRejectionFlow — exclusive-code dispatch order (ticket 17 review finding)", () => {
  // schema.ts's cross-field validation guarantees at most one of Codes 6/8/9 ever reaches this
  // function on a real (validated) request — this test bypasses that on purpose, the way a
  // future internal caller might, to lock in that the orchestrator itself still prioritizes
  // Code 6 regardless of array order (matching the old hand-written `else if` chain's
  // behavior), rather than depending on schema.ts as the only thing preventing drift.
  it("still resolves Code 6 first even when it appears after Code 9 in the array", () => {
    const result = runPostRejectionFlow({
      ...baseInput,
      rejection_codes_selected: ["CODE_9_WRONG_FORM", "CODE_6_APPROVED_NOT_CREDITED"],
      withdrawal_intent: "advance",
    });
    expect(result.grievance?.ready).toBe(true);
    if (result.grievance?.ready) expect(result.grievance.variant).toBe("D");
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
