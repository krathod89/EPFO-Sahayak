import { describe, it, expect, vi, beforeEach } from "vitest";

const createMock = vi.fn();
vi.mock("@/lib/db", () => ({
  prisma: { analyticsEvent: { create: (...args: unknown[]) => createMock(...args) } },
}));

import { POST } from "./route";

function jsonRequest(body: unknown): Request {
  return new Request("http://localhost/api/events", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
}

beforeEach(() => {
  createMock.mockReset();
  createMock.mockResolvedValue({ id: "evt-1" });
});

describe("POST /api/events", () => {
  it("writes one row for a valid event and returns 201", async () => {
    const res = await POST(
      jsonRequest({ session_id: "sess-1", event_type: "session_started", properties: { foo: "bar" } })
    );
    expect(res.status).toBe(201);
    expect(createMock).toHaveBeenCalledTimes(1);
    const call = createMock.mock.calls[0]![0];
    expect(call.data).toMatchObject({ sessionId: "sess-1", eventType: "session_started" });
  });

  it("defaults properties to {} when omitted", async () => {
    await POST(jsonRequest({ session_id: "sess-1", event_type: "session_started" }));
    const call = createMock.mock.calls[0]![0];
    expect(call.data.properties).toEqual({});
  });

  it("rejects a malformed body (missing session_id) with 400 and writes nothing", async () => {
    const res = await POST(jsonRequest({ event_type: "session_started" }));
    expect(res.status).toBe(400);
    expect(createMock).not.toHaveBeenCalled();
  });

  it("rejects invalid JSON with 400", async () => {
    const badRequest = new Request("http://localhost/api/events", {
      method: "POST",
      body: "{not json",
      headers: { "content-type": "application/json" },
    });
    const res = await POST(badRequest);
    expect(res.status).toBe(400);
  });

  it("rejects an event whose properties carry a citizen-entered field, and writes nothing", async () => {
    // Backstop for Engineering/analytics.md's "not tracked, on purpose" rule / ADR 0002 —
    // catches a caller-side regression loudly instead of letting PII-shaped data land quietly.
    const res = await POST(
      jsonRequest({
        session_id: "sess-1",
        event_type: "diagnosis_shown",
        properties: { uan: "should-not-be-here", codes: ["CODE_2_DOE"] },
      })
    );
    expect(res.status).toBe(400);
    expect(createMock).not.toHaveBeenCalled();
  });
});
