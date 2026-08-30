import { describe, it, expect } from "vitest";
import { buildGrievance } from "./grievance";
import type { DeadlineResult } from "./deadline";

const MISSED: DeadlineResult = {
  status: "MISSED",
  deadlineDays: 3,
  deadlineDate: "2026-08-04",
  daysLate: 5,
};

const NOT_YET_DUE: DeadlineResult = {
  status: "NOT_YET_DUE",
  deadlineDays: 3,
  deadlineDate: "2026-08-04",
  daysRemaining: 2,
};

const base = {
  uan: "UAN123456789",
  claim_id: "CLAIM987",
  filing_date: "2026-08-01",
  today_date: "2026-08-09",
};

describe("buildGrievance — missing-info guard", () => {
  it("refuses to generate text when UAN or claim ID is missing", () => {
    const result = buildGrievance({
      ...base,
      uan: "",
      kind: { type: "standard", codeName: "Date of Exit not marked", issueSentence: "x" },
    });
    expect(result.ready).toBe(false);
    if (!result.ready && result.reason === "missing_info") {
      expect(result.missing).toContain("uan");
    }
  });
});

describe("buildGrievance — Variant A (standard)", () => {
  it("builds standard rejection text with the code name and restatement", () => {
    const result = buildGrievance({
      ...base,
      kind: {
        type: "standard",
        codeName: "Date of Exit not marked",
        issueSentence: "Your former employer has not marked your Date of Exit.",
      },
    });
    expect(result.ready).toBe(true);
    if (result.ready) {
      expect(result.variant).toBe("A");
      expect(result.body).toMatch(/Date of Exit not marked/);
      expect(result.body).toContain(base.uan);
      expect(result.body).toContain(base.claim_id);
      expect(result.deadlineCited).toBe(false);
    }
  });

  it("appends the deadline citation block when the deadline was missed", () => {
    const result = buildGrievance({
      ...base,
      deadline: MISSED,
      kind: { type: "standard", codeName: "Date of Exit not marked", issueSentence: "x" },
    });
    expect(result.ready).toBe(true);
    if (result.ready) {
      expect(result.deadlineCited).toBe(true);
      expect(result.body).toMatch(/12% penal interest/);
      expect(result.body).toMatch(/missed by 5 day/);
    }
  });

  it("does not append a citation when the deadline is not yet due", () => {
    const result = buildGrievance({
      ...base,
      deadline: NOT_YET_DUE,
      kind: { type: "standard", codeName: "Date of Exit not marked", issueSentence: "x" },
    });
    expect(result.ready).toBe(true);
    if (result.ready) {
      expect(result.deadlineCited).toBe(false);
      expect(result.body).not.toMatch(/12% penal interest/);
    }
  });
});

describe("buildGrievance — Variant B (bank KYC escalation)", () => {
  it("builds escalation text only for band 3", () => {
    const result = buildGrievance({
      ...base,
      kind: { type: "bank_kyc_escalate", band: 3, bank_kyc_submission_date: "2026-06-01" },
    });
    expect(result.ready).toBe(true);
    if (result.ready) {
      expect(result.variant).toBe("B");
      expect(result.body).toMatch(/more than 15 working days/);
    }
  });

  it("refuses for band 1 or 2 — no grievance yet at that stage", () => {
    const band1 = buildGrievance({
      ...base,
      kind: { type: "bank_kyc_escalate", band: 1, bank_kyc_submission_date: "2026-08-05" },
    });
    const band2 = buildGrievance({
      ...base,
      kind: { type: "bank_kyc_escalate", band: 2, bank_kyc_submission_date: "2026-07-20" },
    });
    expect(band1.ready).toBe(false);
    expect(band2.ready).toBe(false);
    if (!band1.ready) expect(band1.reason).toBe("not_applicable");
  });
});

describe("buildGrievance — Variant C (portal sync bug)", () => {
  it("builds the sync-bug-specific text", () => {
    const result = buildGrievance({ ...base, kind: { type: "portal_sync_bug" } });
    expect(result.ready).toBe(true);
    if (result.ready) {
      expect(result.variant).toBe("C");
      expect(result.body).toMatch(/synchronization issue/);
    }
  });
});

describe("buildGrievance — Variant D (approved but not credited)", () => {
  it("builds the payment-tracing text using today_date", () => {
    const result = buildGrievance({ ...base, kind: { type: "approved_not_credited" } });
    expect(result.ready).toBe(true);
    if (result.ready) {
      expect(result.variant).toBe("D");
      expect(result.body).toContain(base.today_date);
    }
  });
});

describe("buildGrievance — Variant E (demand the real reason)", () => {
  it("builds the no-reason-given text listing the 5 checked causes", () => {
    const result = buildGrievance({ ...base, kind: { type: "demand_reason" } });
    expect(result.ready).toBe(true);
    if (result.ready) {
      expect(result.variant).toBe("E");
      expect(result.body).toMatch(/Date of Exit/);
      expect(result.body).toMatch(/EPS contribution history/);
    }
  });
});
