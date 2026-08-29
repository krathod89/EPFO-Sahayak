import { describe, it, expect } from "vitest";
import { readinessResult } from "./readiness";
import type { SelfCheckAnswers } from "./types";

const allPass: SelfCheckAnswers = {
  doe_marked: "yes",
  kyc_verified_not_just_approved: "yes",
  name_dob_fathername_consistent: "yes",
  eps_history_continuous: "yes",
  old_claim_pending: "no",
};

describe("readinessResult (H14)", () => {
  it("returns 'ready' when every check passes clean", () => {
    const result = readinessResult(allPass);
    expect(result.outcome).toBe("ready");
    expect(result.issues).toHaveLength(0);
    expect(result.unsureItems).toHaveLength(0);
  });

  it("returns 'mostly_ready' when there are unsure items but no issues", () => {
    const result = readinessResult({ ...allPass, eps_history_continuous: "unsure" });
    expect(result.outcome).toBe("mostly_ready");
    expect(result.unsureItems).toEqual(["eps_history_continuous"]);
    expect(result.issues).toHaveLength(0);
  });

  it("returns 'issues_found' when at least one issue exists, alongside any unsure items", () => {
    const result = readinessResult({
      ...allPass,
      doe_marked: "no",
      name_dob_fathername_consistent: "unsure",
    });
    expect(result.outcome).toBe("issues_found");
    expect(result.issues.map((i) => i.code)).toEqual(["CODE_2_DOE"]);
    expect(result.unsureItems).toEqual(["name_dob_fathername_consistent"]);
  });

  it("flips polarity for old_claim_pending — 'yes' is the issue direction", () => {
    const result = readinessResult({ ...allPass, old_claim_pending: "yes" });
    expect(result.outcome).toBe("issues_found");
    expect(result.issues.map((i) => i.code)).toEqual(["CODE_5_OLD_CLAIM"]);
  });

  it("never reaches Code 6 text — that code has no meaning before filing", () => {
    const result = readinessResult({
      ...allPass,
      doe_marked: "no",
      kyc_verified_not_just_approved: "no",
      eps_history_continuous: "no",
      old_claim_pending: "yes",
    });
    for (const issue of result.issues) {
      expect(issue.code).not.toBe("CODE_6_APPROVED_NOT_CREDITED");
    }
  });

  it("does not apply a priority ranking or a deadline check — no such fields on the result", () => {
    const result = readinessResult(allPass);
    expect(result).not.toHaveProperty("ranked");
    expect(result).not.toHaveProperty("deadline");
  });
});
