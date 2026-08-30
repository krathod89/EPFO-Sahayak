import { describe, it, expect } from "vitest";
import { bucketSelfCheck } from "./selfCheck";
import type { SelfCheckAnswers } from "./types";

const allPass: SelfCheckAnswers = {
  doe_marked: "yes",
  kyc_verified_not_just_approved: "yes",
  name_dob_fathername_consistent: "yes",
  eps_history_continuous: "yes",
  old_claim_pending: "no",
};

describe("bucketSelfCheck", () => {
  it("treats all-pass answers as zero issues, zero unsure", () => {
    const result = bucketSelfCheck(allPass);
    expect(result.issues).toHaveLength(0);
    expect(result.unsure).toHaveLength(0);
    expect(result.passed).toHaveLength(5);
  });

  it("flips polarity correctly for old_claim_pending (yes = issue, unlike the other 4)", () => {
    const result = bucketSelfCheck({ ...allPass, old_claim_pending: "yes" });
    expect(result.issues).toEqual([{ key: "old_claim_pending", code: "CODE_5_OLD_CLAIM" }]);
  });

  it("maps each other item to its code when the answer is the issue direction", () => {
    const result = bucketSelfCheck({
      doe_marked: "no",
      kyc_verified_not_just_approved: "no",
      name_dob_fathername_consistent: "no",
      eps_history_continuous: "no",
      old_claim_pending: "no",
    });
    const codes = result.issues.map((i) => i.code).sort();
    expect(codes).toEqual(
      ["CODE_1_NAME_DOB", "CODE_2_DOE", "CODE_3_BANK_KYC", "CODE_4_EPS"].sort()
    );
  });

  it("buckets an unsure answer separately, not as pass or issue", () => {
    const result = bucketSelfCheck({ ...allPass, eps_history_continuous: "unsure" });
    expect(result.unsure).toEqual(["eps_history_continuous"]);
    expect(result.issues).toHaveLength(0);
    expect(result.passed).toHaveLength(4);
  });
});
