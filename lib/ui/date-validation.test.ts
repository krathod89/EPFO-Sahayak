import { describe, it, expect } from "vitest";
import { dateInputError } from "./date-validation";

const TODAY = new Date("2026-08-30T12:00:00Z");

describe("dateInputError", () => {
  it("accepts null/empty as 'not entered yet', not an error", () => {
    expect(dateInputError(null, TODAY)).toBeNull();
    expect(dateInputError("", TODAY)).toBeNull();
  });

  it("accepts today itself", () => {
    expect(dateInputError("2026-08-30", TODAY)).toBeNull();
  });

  it("accepts a plausible past date", () => {
    expect(dateInputError("2026-07-15", TODAY)).toBeNull();
  });

  it("rejects a future date", () => {
    expect(dateInputError("2027-12-25", TODAY)).toBe("This date is in the future — please check it.");
  });

  it("rejects a date before EPFO's UAN system existed", () => {
    expect(dateInputError("1999-01-01", TODAY)).toBe("That date looks too far in the past — please check it.");
  });

  it("accepts 2001-01-01 exactly (the stated floor)", () => {
    expect(dateInputError("2001-01-01", TODAY)).toBeNull();
  });

  it("rejects an unparseable string", () => {
    expect(dateInputError("not-a-date", TODAY)).toBe("That doesn't look like a valid date.");
  });
});
