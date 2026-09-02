// Deadline / penalty check logic (H11). Source: Rule Engine/Rule Engine Spec.md Section 5,
// a direct translation of that section's pseudocode.
//
// CAVEAT (carried forward from spec Section 5/9, gap 3): the source states "3 days
// (complete KYC)" / "20 days (otherwise)" without saying whether these are calendar or
// working days — unlike the Code 3 wait-time bands, which are explicitly working days.
// This module assumes CALENDAR days, matching how the rule is generally described in news
// coverage. This is an assumption, not a confirmed detail. Do not silently switch it to
// working days without checking a primary EPFO source first.

import type { ISODate } from "./types";

export type DeadlineStatus = "NOT_YET_DUE" | "MISSED";

/** What `status` was actually evaluated against.
 *
 * This check only ever runs post-rejection (index.ts never calls it from the pre-filing
 * flow), so by the time it runs, EPFO has already settled the claim one way or another — a
 * rejection IS a settlement. "rejection_date" means the caller knows that date and the
 * result is definitive. "today" means the caller doesn't, and `referenceDate` was today's
 * date as a stand-in — the result is only an as-of-today estimate, since the real rejection
 * could have landed on either side of the deadline. Callers must phrase `status` differently
 * per basis (see Wizard.tsx's DeadlineCard and grievance.ts's deadlineCitation) — "today"
 * NOT_YET_DUE does not mean "EPFO still has time," it means "we don't know if EPFO already
 * missed it." */
export type DeadlineBasis = "rejection_date" | "today";

export interface DeadlineResult {
  status: DeadlineStatus;
  deadlineDays: 3 | 20;
  deadlineDate: ISODate;
  basis: DeadlineBasis;
  /** Present only when status is NOT_YET_DUE. */
  daysRemaining?: number;
  /** Present only when status is MISSED. */
  daysLate?: number;
}

function parseISODate(date: ISODate): Date {
  return new Date(`${date}T00:00:00Z`);
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

function toISODate(date: Date): ISODate {
  return date.toISOString().slice(0, 10);
}

function diffDaysCalendar(later: Date, earlier: Date): number {
  const MS_PER_DAY = 24 * 60 * 60 * 1000;
  return Math.round((later.getTime() - earlier.getTime()) / MS_PER_DAY);
}

/** `referenceDate` is the date `status` is evaluated as of — the citizen's actual rejection
 * date when known, otherwise today's date as a fallback (see `DeadlineBasis` above). `basis`
 * says which one the caller passed, and is threaded straight through into the result so
 * downstream copy (UI card, grievance text) can phrase a definitive answer differently from
 * an as-of-today estimate. */
export function checkDeadline(
  filingDate: ISODate,
  kycCompleteAtFiling: boolean,
  referenceDate: ISODate,
  basis: DeadlineBasis
): DeadlineResult {
  const deadlineDays = kycCompleteAtFiling ? 3 : 20;
  const filing = parseISODate(filingDate);
  const reference = parseISODate(referenceDate);
  const deadline = addDays(filing, deadlineDays);

  if (reference.getTime() <= deadline.getTime()) {
    return {
      status: "NOT_YET_DUE",
      deadlineDays,
      deadlineDate: toISODate(deadline),
      basis,
      daysRemaining: diffDaysCalendar(deadline, reference),
    };
  }

  return {
    status: "MISSED",
    deadlineDays,
    deadlineDate: toISODate(deadline),
    basis,
    daysLate: diffDaysCalendar(reference, deadline),
  };
}
