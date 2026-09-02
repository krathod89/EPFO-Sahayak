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

// H11 fix (2026-09-02): the deadline check is properly evaluated against EPFO's actual
// rejection date when the citizen gives one — not against "today," which is only when the
// citizen happens to be using the tool. `today_date` here is deliberately far past the
// 3-day deadline (see baseInput) so these cases can tell the two apart: if the check were
// still using today_date, an on-time rejection_date would be reported as MISSED anyway.
describe("runPostRejectionFlow — deadline basis (rejection_date vs today)", () => {
  it("uses rejection_date, not today_date, once given — an on-time rejection reports NOT_YET_DUE even though today is well past the deadline", () => {
    const result = runPostRejectionFlow({
      ...baseInput,
      rejection_codes_selected: ["CODE_2_DOE"],
      rejection_date: "2026-08-02", // 1 day after filing — inside the 3-day KYC-complete window
    });
    expect(result.deadline?.basis).toBe("rejection_date");
    expect(result.deadline?.status).toBe("NOT_YET_DUE");
  });

  it("still reports MISSED off rejection_date when the rejection itself came after the deadline", () => {
    const result = runPostRejectionFlow({
      ...baseInput,
      rejection_codes_selected: ["CODE_2_DOE"],
      rejection_date: "2026-08-06", // 5 days after filing — past the 3-day window
    });
    expect(result.deadline?.basis).toBe("rejection_date");
    expect(result.deadline?.status).toBe("MISSED");
    expect(result.deadline?.daysLate).toBe(2);
  });

  it("falls back to today_date with basis 'today' when rejection_date is omitted", () => {
    const result = runPostRejectionFlow({ ...baseInput, rejection_codes_selected: ["CODE_2_DOE"] });
    expect(result.deadline?.basis).toBe("today");
    expect(result.deadline?.status).toBe("MISSED"); // today_date (Aug 10) is past the Aug 4 deadline
  });

  it("suppressed codes (8/9) suppress the deadline check regardless of rejection_date", () => {
    const result = runPostRejectionFlow({
      ...baseInput,
      rejection_codes_selected: ["CODE_8_ELIGIBILITY"],
      eligibility_issue_type: "under_six_months",
      rejection_date: "2026-08-02",
    });
    expect(result.deadline).toBeUndefined();
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
    // Name/DOB here is `not_verified` — a standard mismatch, which IS itself an applicable
    // (ready, Variant A) grievance, not just an unranked/dead code — so it correctly shows
    // up as a second, separate ticket to file (ticket 19), not silently dropped.
    expect(result.additionalGrievances).toHaveLength(1);
    expect(result.additionalGrievances[0]!.code).toBe("CODE_1_NAME_DOB");
    if (result.additionalGrievances[0]!.grievance.ready) {
      expect(result.additionalGrievances[0]!.grievance.variant).toBe("A");
    }
  });
});

// Ticket 19 (2026-09-02, found during the full-app QA audit): a multi-code selection used to
// silently resolve to exactly ONE grievance, dropping whatever any other selected code would
// have produced on its own. Fixed: every applicable grievance is now returned, fix-first
// order, with `grievance` staying the primary (backward-compatible) and the rest in
// `additionalGrievances`.
describe("runPostRejectionFlow — additionalGrievances (ticket 19)", () => {
  // Gap A: Tier 1 has no defined order between Code 2 and Code 5 (spec Section 4) — both
  // independently warrant their own grievance, so both must come back, not just whichever
  // the citizen happened to select first.
  it("returns a grievance for BOTH Tier-1 codes when neither has priority over the other (Code 2 + Code 5)", () => {
    const result = runPostRejectionFlow({
      ...baseInput,
      rejection_codes_selected: ["CODE_2_DOE", "CODE_5_OLD_CLAIM"],
    });
    expect(result.priority?.tier1).toEqual(["CODE_2_DOE", "CODE_5_OLD_CLAIM"]);
    expect(result.grievance?.ready).toBe(true);
    if (result.grievance?.ready) expect(result.grievance.variant).toBe("A");
    expect(result.additionalGrievances).toHaveLength(1);
    expect(result.additionalGrievances[0]!.code).toBe("CODE_5_OLD_CLAIM");
    expect(result.additionalGrievances[0]!.grievance.ready).toBe(true);
  });

  // Gap B: Bank KYC still within its normal wait band (1 or 2) is not_applicable on its own
  // ("wait, don't file yet") — but it always outranks Name/DOB in Tier 2, so it used to win
  // the single "primary" slot and hide a fully valid Name/DOB grievance underneath it. Fixed:
  // a not_applicable code is skipped when picking the primary, so the citizen now gets the
  // real, ready grievance instead of nothing.
  it("promotes a lower-priority code's valid grievance when the higher-priority one is not_applicable (Bank KYC Band 1 + Name/DOB portal-sync-bug)", () => {
    const result = runPostRejectionFlow({
      ...baseInput,
      rejection_codes_selected: ["CODE_1_NAME_DOB", "CODE_3_BANK_KYC"],
      namedob_kyc_page_status: "approved_and_verified", // -> portal_sync_bug, Variant C
      bank_kyc_submission_date: "2026-08-08", // 1 working day before today_date -> Band 1
    });
    expect(result.priority?.tier2).toEqual(["CODE_3_BANK_KYC", "CODE_1_NAME_DOB"]);
    // Bank KYC (the actual Tier-2 winner) is not_applicable — Name/DOB's portal-sync-bug
    // grievance is promoted to primary instead of the citizen seeing nothing.
    expect(result.grievance?.ready).toBe(true);
    if (result.grievance?.ready) expect(result.grievance.variant).toBe("C");
    // Bank KYC's not_applicable result is correctly excluded, not shown as a dead slot.
    expect(result.additionalGrievances).toEqual([]);
  });

  // Regression guard: when NOTHING selected has an applicable grievance yet, the old
  // single-code "wait, don't file yet" UI path must keep working — `grievance` still carries
  // the not_applicable result (not undefined), since Wizard.tsx's button copy depends on
  // checking `grievance.reason === "not_applicable"`.
  it("surfaces not_applicable (not undefined) when the only selected code's own grievance is not_applicable (joint account)", () => {
    const result = runPostRejectionFlow({
      ...baseInput,
      rejection_codes_selected: ["CODE_3_BANK_KYC"],
      bank_account_type: "joint",
    });
    expect(result.grievance?.ready).toBe(false);
    if (!result.grievance?.ready) expect(result.grievance?.reason).toBe("not_applicable");
    expect(result.additionalGrievances).toEqual([]);
  });

  // Unranked codes (currently only Code 4, EPS) are diagnosable and DO produce their own
  // standard grievance — they must not be dropped just because prioritize() excludes them
  // from `ranked`.
  it("includes an unranked code's grievance in additionalGrievances too (Code 4 alongside a Tier-1 code)", () => {
    const result = runPostRejectionFlow({
      ...baseInput,
      rejection_codes_selected: ["CODE_2_DOE", "CODE_4_EPS"],
    });
    expect(result.priority?.unranked).toEqual(["CODE_4_EPS"]);
    expect(result.grievance?.ready).toBe(true);
    if (result.grievance?.ready) expect(result.grievance.variant).toBe("A");
    expect(result.additionalGrievances).toHaveLength(1);
    expect(result.additionalGrievances[0]!.code).toBe("CODE_4_EPS");
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

describe("runPostRejectionFlow — Code 10 (unmatched reason), all self-checks clean, ticket 10", () => {
  // Written BEFORE index.ts's Code 10 wiring, deliberately — same discipline as tickets 16/17,
  // applying the lesson from ticket 15's second review pass (the orchestrator silently
  // dropping a field despite every lower-level unit test passing) proactively rather than
  // waiting for a review pass to catch it again.
  it("generates the Variant F 'demand clarification' grievance, not Variant E", () => {
    const result = runPostRejectionFlow({
      ...baseInput,
      rejection_codes_selected: ["CODE_10_UNLISTED_REASON"],
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
    if (result.grievance?.ready) expect(result.grievance.variant).toBe("F");
  });

  // Code 10 does NOT suppress the deadline check — unlike Code 8/9, this isn't a claim that
  // was never going to be settled; EPFO gave a real (if unrecognized) reason, so the normal
  // 3/20-day clock still applies, same as Code 7.
  it("still computes the deadline normally for Code 10", () => {
    const result = runPostRejectionFlow({
      ...baseInput,
      rejection_codes_selected: ["CODE_10_UNLISTED_REASON"],
      self_check_answers: {
        doe_marked: "yes",
        kyc_verified_not_just_approved: "yes",
        name_dob_fathername_consistent: "yes",
        eps_history_continuous: "yes",
        old_claim_pending: "no",
      },
    });
    expect(result.deadline).toBeDefined();
  });
});

describe("runPostRejectionFlow — Code 10, an issue found", () => {
  it("generates a Variant A grievance for the found issue, same shape as Code 7's issue-found path", () => {
    const result = runPostRejectionFlow({
      ...baseInput,
      rejection_codes_selected: ["CODE_10_UNLISTED_REASON"],
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

describe("runPostRejectionFlow — self-check all-clean dispatch order (ticket 10 review finding)", () => {
  // schema.ts guarantees at most one of Codes 7/10 ever reaches this function on a real
  // (validated) request — this test bypasses that on purpose, same discipline as the Code
  // 6/9 test above, to lock in that Code 7 always wins regardless of array order (matching
  // SELF_CHECK_ALL_CLEAN_KIND's declared key order), rather than depending on schema.ts alone.
  it("still resolves Code 7 (Variant E) first even when it appears after Code 10 in the array", () => {
    const result = runPostRejectionFlow({
      ...baseInput,
      rejection_codes_selected: ["CODE_10_UNLISTED_REASON", "CODE_7_NO_REASON"],
      self_check_answers: {
        doe_marked: "yes",
        kyc_verified_not_just_approved: "yes",
        name_dob_fathername_consistent: "yes",
        eps_history_continuous: "yes",
        old_claim_pending: "no",
      },
    });
    expect(result.grievance?.ready).toBe(true);
    if (result.grievance?.ready) expect(result.grievance.variant).toBe("E");
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
