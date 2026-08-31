import { describe, it, expect } from "vitest";
import { buildFeedbackEvent } from "./feedback";

describe("buildFeedbackEvent", () => {
  it("includes sentiment and context with no comment key when the comment is empty", () => {
    expect(buildFeedbackEvent("like", "grievance_output", "")).toEqual({
      sentiment: "like",
      context: "grievance_output",
    });
  });

  it("treats a whitespace-only comment as no comment", () => {
    expect(buildFeedbackEvent("dislike", "readiness_result", "   \n\t  ")).toEqual({
      sentiment: "dislike",
      context: "readiness_result",
    });
  });

  it("trims a real comment", () => {
    expect(buildFeedbackEvent("like", "grievance_output", "  this really helped  ")).toEqual({
      sentiment: "like",
      context: "grievance_output",
      comment: "this really helped",
    });
  });

  it("caps an overlong comment at 500 characters", () => {
    const long = "a".repeat(600);
    const result = buildFeedbackEvent("dislike", "readiness_result", long);
    expect(result.comment).toHaveLength(500);
    expect(result.comment).toBe("a".repeat(500));
  });

  it("redacts a UAN-shaped digit run typed into the comment", () => {
    const result = buildFeedbackEvent("dislike", "grievance_output", "my UAN 100123456789 still shows rejected");
    expect(result.comment).toBe("my UAN [redacted] still shows rejected");
  });

  it("redacts an email address typed into the comment", () => {
    const result = buildFeedbackEvent("like", "readiness_result", "reach me at priya.k@example.com if needed");
    expect(result.comment).toBe("reach me at [redacted] if needed");
  });

  it("leaves short digit runs (not PII-shaped) untouched", () => {
    const result = buildFeedbackEvent("like", "grievance_output", "waited 87 days for this, thanks!");
    expect(result.comment).toBe("waited 87 days for this, thanks!");
  });
});
