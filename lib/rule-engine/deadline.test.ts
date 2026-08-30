import { describe, it, expect } from "vitest";
import { checkDeadline } from "./deadline";

describe("checkDeadline (H11)", () => {
  it("uses a 3-day deadline when KYC was complete at filing", () => {
    const result = checkDeadline("2026-08-01", true, "2026-08-02");
    expect(result.deadlineDays).toBe(3);
    expect(result.deadlineDate).toBe("2026-08-04");
  });

  it("uses a 20-day deadline when KYC was not complete at filing", () => {
    const result = checkDeadline("2026-08-01", false, "2026-08-05");
    expect(result.deadlineDays).toBe(20);
    expect(result.deadlineDate).toBe("2026-08-21");
  });

  it("is NOT_YET_DUE exactly on the deadline date itself", () => {
    const result = checkDeadline("2026-08-01", true, "2026-08-04");
    expect(result.status).toBe("NOT_YET_DUE");
    expect(result.daysRemaining).toBe(0);
    expect(result.daysLate).toBeUndefined();
  });

  it("is NOT_YET_DUE one day before the deadline, with 1 day remaining", () => {
    const result = checkDeadline("2026-08-01", true, "2026-08-03");
    expect(result.status).toBe("NOT_YET_DUE");
    expect(result.daysRemaining).toBe(1);
  });

  it("is MISSED one day after the deadline, with 1 day late", () => {
    const result = checkDeadline("2026-08-01", true, "2026-08-05");
    expect(result.status).toBe("MISSED");
    expect(result.daysLate).toBe(1);
    expect(result.daysRemaining).toBeUndefined();
  });

  it("computes days late correctly further past the 20-day deadline", () => {
    const result = checkDeadline("2026-08-01", false, "2026-09-01");
    expect(result.status).toBe("MISSED");
    expect(result.daysLate).toBe(11); // deadline 2026-08-21, today 2026-09-01
  });
});
