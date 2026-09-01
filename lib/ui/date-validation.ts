// The native <input type="date">'s `max` attribute blocks the calendar picker but not
// manual keyboard entry — typing a mistyped digit can silently produce a syntactically
// valid but wrong date (e.g. a future filing date), which the app would then treat as
// real input for its deadline/penalty math with no warning. This closes that gap.

/** Returns a plain-language error, or null when `value` (an ISO "YYYY-MM-DD" string, or
 * null/empty for "not entered yet") is a valid, plausible date. `today` defaults to the
 * real current date/time but can be injected for deterministic tests — same pattern as
 * lib/rule-engine's own today_date parameters. */
export function dateInputError(value: string | null, today: Date = new Date()): string | null {
  if (!value) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return "That doesn't look like a valid date.";
  const [, yearStr, monthStr, dayStr] = match;
  const d = new Date(`${value}T00:00:00`);
  // JS's Date parser doesn't reject an out-of-range component (e.g. month "13") — it
  // silently rolls it over into a different, still-valid date instead of Invalid Date.
  // Confirm the parsed date's own components match what was typed, not just that parsing
  // "succeeded," so a rolled-over date (e.g. "2026-13-05" becoming 2027-01-05) is caught.
  if (
    Number.isNaN(d.getTime()) ||
    d.getFullYear() !== Number(yearStr) ||
    d.getMonth() + 1 !== Number(monthStr) ||
    d.getDate() !== Number(dayStr)
  ) {
    return "That doesn't look like a valid date.";
  }
  const todayMidnight = new Date(today);
  todayMidnight.setHours(0, 0, 0, 0);
  if (d.getTime() > todayMidnight.getTime()) return "This date is in the future. Please check it.";
  // EPFO's UAN system postdates 2001; anything before that is implausible for a PF claim.
  // Parsed the same way as `d` (local midnight, no Z) so the comparison isn't off by a
  // few hours depending on the browser's timezone relative to UTC.
  if (d.getTime() < new Date("2001-01-01T00:00:00").getTime()) {
    return "That date looks too far in the past. Please check it.";
  }
  return null;
}
