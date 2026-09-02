import { describe, it, expect } from "vitest";
import { checkDeadline } from "./deadline";

describe("checkDeadline (H11)", () => {
  it("uses a 3-day deadline when KYC was complete at filing", () => {
    const result = checkDeadline("2026-08-01", true, "2026-08-02", "today");
    expect(result.deadlineDays).toBe(3);
    expect(result.deadlineDate).toBe("2026-08-04");
  });

  it("uses a 20-day deadline when KYC was not complete at filing", () => {
    const result = checkDeadline("2026-08-01", false, "2026-08-05", "today");
    expect(result.deadlineDays).toBe(20);
    expect(result.deadlineDate).toBe("2026-08-21");
  });

  it("is NOT_YET_DUE exactly on the deadline date itself", () => {
    const result = checkDeadline("2026-08-01", true, "2026-08-04", "today");
    expect(result.status).toBe("NOT_YET_DUE");
    expect(result.daysRemaining).toBe(0);
    expect(result.daysLate).toBeUndefined();
  });

  it("is NOT_YET_DUE one day before the deadline, with 1 day remaining", () => {
    const result = checkDeadline("2026-08-01", true, "2026-08-03", "today");
    expect(result.status).toBe("NOT_YET_DUE");
    expect(result.daysRemaining).toBe(1);
  });

  it("is MISSED one day after the deadline, with 1 day late", () => {
    const result = checkDeadline("2026-08-01", true, "2026-08-05", "today");
    expect(result.status).toBe("MISSED");
    expect(result.daysLate).toBe(1);
    expect(result.daysRemaining).toBeUndefined();
  });

  it("computes days late correctly further past the 20-day deadline", () => {
    const result = checkDeadline("2026-08-01", false, "2026-09-01", "today");
    expect(result.status).toBe("MISSED");
    expect(result.daysLate).toBe(11); // deadline 2026-08-21, today 2026-09-01
  });

  // basis: threaded straight through into the result, unchanged, so callers can tell a
  // confirmed rejection-date answer apart from a today-fallback estimate (H11 ticket, 2026-09-02).
  describe("basis", () => {
    it("carries basis 'rejection_date' straight through on a met deadline", () => {
      const result = checkDeadline("2026-08-01", true, "2026-08-03", "rejection_date");
      expect(result.basis).toBe("rejection_date");
      expect(result.status).toBe("NOT_YET_DUE");
    });

    it("carries basis 'rejection_date' straight through on a missed deadline", () => {
      const result = checkDeadline("2026-08-01", true, "2026-08-05", "rejection_date");
      expect(result.basis).toBe("rejection_date");
      expect(result.status).toBe("MISSED");
    });

    it("carries basis 'today' straight through", () => {
      const result = checkDeadline("2026-08-01", true, "2026-08-02", "today");
      expect(result.basis).toBe("today");
    });

    // The reference date is EPFO's rejection date when known — using it (rather than
    // "today") is the whole point of this parameter. A claim rejected same-day as filing,
    // with KYC complete, is comfortably inside the 3-day window regardless of how much later
    // the citizen happens to open this tool.
    it("evaluates status against the rejection date, not against some other 'today'", () => {
      // Filed and rejected same day — clearly on time — but checkDeadline is never told
      // "today" here, only the rejection date itself as the reference.
      const result = checkDeadline("2026-08-01", true, "2026-08-01", "rejection_date");
      expect(result.status).toBe("NOT_YET_DUE");
      expect(result.daysRemaining).toBe(3);
    });
  });
});
