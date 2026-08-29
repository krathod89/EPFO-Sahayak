import { describe, it, expect } from "vitest";
import { workingDaysBetween, bankKycWaitBand } from "./waitBands";

describe("workingDaysBetween", () => {
  it("counts only weekdays, excluding both endpoints' weekend days appropriately", () => {
    // Mon 2026-08-24 -> Fri 2026-08-28 is 4 working days apart (Mon,Tue,Wed,Thu,Fri = 5 days span, 4 diffs)
    expect(workingDaysBetween("2026-08-24", "2026-08-28")).toBe(4);
  });

  it("skips a weekend entirely", () => {
    // Fri 2026-08-28 -> Mon 2026-08-31 should count as 1 working day (weekend doesn't count)
    expect(workingDaysBetween("2026-08-28", "2026-08-31")).toBe(1);
  });

  it("returns 0 for the same day", () => {
    expect(workingDaysBetween("2026-08-29", "2026-08-29")).toBe(0);
  });
});

describe("bankKycWaitBand", () => {
  it("bands 0-7 working days as band 1", () => {
    expect(bankKycWaitBand(0).band).toBe(1);
    expect(bankKycWaitBand(7).band).toBe(1);
  });

  it("bands 8-15 working days as band 2", () => {
    expect(bankKycWaitBand(8).band).toBe(2);
    expect(bankKycWaitBand(15).band).toBe(2);
  });

  it("bands more than 15 working days as band 3", () => {
    expect(bankKycWaitBand(16).band).toBe(3);
    expect(bankKycWaitBand(100).band).toBe(3);
  });
});
