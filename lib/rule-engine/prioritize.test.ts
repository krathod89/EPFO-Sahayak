import { describe, it, expect } from "vitest";
import { prioritize } from "./prioritize";
import type { DiagnosableCode } from "./types";

describe("prioritize (H10)", () => {
  it("needs no ranking for a single code", () => {
    const result = prioritize(["CODE_2_DOE"]);
    expect(result.needsRanking).toBe(false);
    expect(result.ranked).toEqual(["CODE_2_DOE"]);
  });

  it("ranks a Tier 1 + Tier 2 combination: Tier 1 first", () => {
    const result = prioritize(["CODE_1_NAME_DOB", "CODE_2_DOE"]);
    expect(result.tier1).toEqual(["CODE_2_DOE"]);
    expect(result.tier2).toEqual(["CODE_1_NAME_DOB"]);
    expect(result.ranked).toEqual(["CODE_2_DOE", "CODE_1_NAME_DOB"]);
  });

  it("orders Bank KYC before Name/DOB mismatch within Tier 2", () => {
    const result = prioritize(["CODE_1_NAME_DOB", "CODE_3_BANK_KYC"]);
    expect(result.tier2).toEqual(["CODE_3_BANK_KYC", "CODE_1_NAME_DOB"]);
  });

  it("leaves both Tier 1 codes unranked relative to each other", () => {
    const result = prioritize(["CODE_2_DOE", "CODE_5_OLD_CLAIM"]);
    expect(result.tier1.sort()).toEqual(["CODE_2_DOE", "CODE_5_OLD_CLAIM"].sort());
    expect(result.tier2).toEqual([]);
  });

  it("shows Code 4 (EPS) as unranked alongside any other code", () => {
    const result = prioritize(["CODE_4_EPS", "CODE_2_DOE"]);
    expect(result.unranked).toEqual(["CODE_4_EPS"]);
    expect(result.tier1).toEqual(["CODE_2_DOE"]);
  });

  it("handles all five diagnosable codes together without dropping any", () => {
    const all: DiagnosableCode[] = [
      "CODE_1_NAME_DOB",
      "CODE_2_DOE",
      "CODE_3_BANK_KYC",
      "CODE_4_EPS",
      "CODE_5_OLD_CLAIM",
    ];
    const result = prioritize(all);
    const accounted = [...result.tier1, ...result.tier2, ...result.unranked].sort();
    expect(accounted).toEqual([...all].sort());
  });
});
