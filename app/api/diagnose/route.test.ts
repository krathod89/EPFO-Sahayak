import { describe, it, expect, vi, beforeEach } from "vitest";

const createMock = vi.fn();
vi.mock("@/lib/db", () => ({
  prisma: { analyticsEvent: { create: (...args: unknown[]) => createMock(...args) } },
}));

import { POST } from "./route";

function jsonRequest(body: unknown): Request {
  return new Request("http://localhost/api/diagnose", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
}

beforeEach(() => {
  createMock.mockReset();
  createMock.mockResolvedValue({ id: "evt-1" });
});

describe("POST /api/diagnose — post_rejection", () => {
  it("returns a diagnosis, deadline check, and grievance for a single code", async () => {
    const res = await POST(
      jsonRequest({
        entry_point: "post_rejection",
        uan: "UAN123",
        claim_id: "CLAIM1",
        rejection_codes_selected: ["CODE_2_DOE"],
        filing_date: "2026-08-01",
        kyc_complete_at_filing: true,
        today_date: "2026-08-10",
        session_id: "sess-1",
      })
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.diagnosis.entries[0].code).toBe("CODE_2_DOE");
    expect(body.deadline.status).toBe("MISSED");
    expect(body.grievance.ready).toBe(true);
  });

  it("fires the expected analytics events when a session_id is present", async () => {
    await POST(
      jsonRequest({
        entry_point: "post_rejection",
        uan: "UAN123",
        claim_id: "CLAIM1",
        rejection_codes_selected: ["CODE_2_DOE"],
        filing_date: "2026-08-01",
        kyc_complete_at_filing: true,
        today_date: "2026-08-10",
        session_id: "sess-1",
      })
    );
    const eventTypes = createMock.mock.calls.map((call) => call[0].data.eventType);
    expect(eventTypes).toEqual(
      expect.arrayContaining(["codes_selected", "diagnosis_shown", "deadline_check_shown", "grievance_generated"])
    );
  });

  it("logs nothing when no session_id is present, but still returns the diagnosis", async () => {
    const res = await POST(
      jsonRequest({
        entry_point: "post_rejection",
        rejection_codes_selected: ["CODE_2_DOE"],
        filing_date: "2026-08-01",
        kyc_complete_at_filing: true,
        today_date: "2026-08-10",
      })
    );
    expect(res.status).toBe(200);
    expect(createMock).not.toHaveBeenCalled();
  });

  it("rejects a request missing a required conditional field (Code 1 without namedob_kyc_page_status)", async () => {
    const res = await POST(
      jsonRequest({
        entry_point: "post_rejection",
        rejection_codes_selected: ["CODE_1_NAME_DOB"],
        filing_date: "2026-08-01",
        kyc_complete_at_filing: true,
      })
    );
    expect(res.status).toBe(400);
  });

  it("rejects a request combining Code 6 with another code", async () => {
    const res = await POST(
      jsonRequest({
        entry_point: "post_rejection",
        rejection_codes_selected: ["CODE_6_APPROVED_NOT_CREDITED", "CODE_2_DOE"],
        filing_date: "2026-08-01",
        kyc_complete_at_filing: true,
      })
    );
    expect(res.status).toBe(400);
  });

  it("rejects malformed JSON with 400", async () => {
    const badRequest = new Request("http://localhost/api/diagnose", {
      method: "POST",
      body: "{not json",
      headers: { "content-type": "application/json" },
    });
    const res = await POST(badRequest);
    expect(res.status).toBe(400);
  });
});

describe("POST /api/diagnose — pre_filing", () => {
  it("returns a readiness result and fires the expected analytics events", async () => {
    const res = await POST(
      jsonRequest({
        entry_point: "pre_filing",
        session_id: "sess-2",
        self_check_answers: {
          doe_marked: "yes",
          kyc_verified_not_just_approved: "yes",
          name_dob_fathername_consistent: "yes",
          eps_history_continuous: "yes",
          old_claim_pending: "no",
        },
      })
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.outcome).toBe("ready");
    expect(body).not.toHaveProperty("deadline"); // no deadline check in this flow

    const eventTypes = createMock.mock.calls.map((call) => call[0].data.eventType);
    expect(eventTypes).toEqual(
      expect.arrayContaining(["self_check_submitted", "readiness_result_shown"])
    );
  });
});
