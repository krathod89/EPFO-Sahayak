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

export interface DeadlineResult {
  status: DeadlineStatus;
  deadlineDays: 3 | 20;
  deadlineDate: ISODate;
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

export function checkDeadline(
  filingDate: ISODate,
  kycCompleteAtFiling: boolean,
  todayDate: ISODate
): DeadlineResult {
  const deadlineDays = kycCompleteAtFiling ? 3 : 20;
  const filing = parseISODate(filingDate);
  const today = parseISODate(todayDate);
  const deadline = addDays(filing, deadlineDays);

  if (today.getTime() <= deadline.getTime()) {
    return {
      status: "NOT_YET_DUE",
      deadlineDays,
      deadlineDate: toISODate(deadline),
      daysRemaining: diffDaysCalendar(deadline, today),
    };
  }

  return {
    status: "MISSED",
    deadlineDays,
    deadlineDate: toISODate(deadline),
    daysLate: diffDaysCalendar(today, deadline),
  };
}
