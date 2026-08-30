import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const trackMock = vi.fn();
vi.mock("mixpanel", () => ({
  default: { init: () => ({ track: (...args: unknown[]) => trackMock(...args) }) },
}));

beforeEach(() => {
  trackMock.mockReset();
  vi.resetModules();
  vi.stubEnv("MIXPANEL_TOKEN", "test-token"); // otherwise the module falls back to its real no-op client
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("trackServerEvent", () => {
  it("does nothing when sessionId is undefined", async () => {
    const { trackServerEvent } = await import("./analytics");
    trackServerEvent(undefined, "diagnosis_shown", { codes: ["CODE_2_DOE"] });
    expect(trackMock).not.toHaveBeenCalled();
  });

  it("tracks an event using sessionId as distinct_id", async () => {
    const { trackServerEvent } = await import("./analytics");
    trackServerEvent("sess-1", "diagnosis_shown", { codes: ["CODE_2_DOE"] });
    expect(trackMock).toHaveBeenCalledTimes(1);
    const [eventName, props] = trackMock.mock.calls[0]!;
    expect(eventName).toBe("diagnosis_shown");
    expect(props).toMatchObject({ distinct_id: "sess-1", codes: ["CODE_2_DOE"] });
  });

  it("drops the event (and does not call track) when properties carry a blocked citizen-entered field", async () => {
    const { trackServerEvent } = await import("./analytics");
    trackServerEvent("sess-1", "diagnosis_shown", { uan: "should-not-be-here" });
    expect(trackMock).not.toHaveBeenCalled();
  });

  it("never throws even if the underlying client throws", async () => {
    trackMock.mockImplementation(() => {
      throw new Error("network error");
    });
    const { trackServerEvent } = await import("./analytics");
    expect(() => trackServerEvent("sess-1", "diagnosis_shown", {})).not.toThrow();
  });

  it("falls back to a silent no-op when MIXPANEL_TOKEN isn't configured", async () => {
    vi.stubEnv("MIXPANEL_TOKEN", "");
    const { trackServerEvent } = await import("./analytics");
    expect(() => trackServerEvent("sess-1", "diagnosis_shown", {})).not.toThrow();
    expect(trackMock).not.toHaveBeenCalled(); // never reached mixpanel.init()'s mocked client
  });
});
