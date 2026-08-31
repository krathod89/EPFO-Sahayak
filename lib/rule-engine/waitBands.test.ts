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
  // Re-anchored 2026-08-31 (ticket 13): EPFO's April 2025 order removed the employer-approval
  // step from bank-KYC seeding entirely (bank/NPCI verification, ~3 working days average, then
  // auto-approval — no employer gate to wait on). The old 0-7/8-15/>15 bands were built around
  // employer approval's own ~13-day average, which no longer applies. These bands are now
  // anchored to the *current* process's stated average, with a buffer — an estimate, not an
  // EPFO-published figure, same caveat status the old bands carried.
  it("bands 0-5 working days as band 1 (within the typical bank/NPCI turnaround)", () => {
    expect(bankKycWaitBand(0).band).toBe(1);
    expect(bankKycWaitBand(5).band).toBe(1);
  });

  it("bands 6-10 working days as band 2 (longer than typical, not yet clearly stuck)", () => {
    expect(bankKycWaitBand(6).band).toBe(2);
    expect(bankKycWaitBand(10).band).toBe(2);
  });

  it("bands more than 10 working days as band 3 (worth escalating)", () => {
    expect(bankKycWaitBand(11).band).toBe(3);
    expect(bankKycWaitBand(100).band).toBe(3);
  });
});
