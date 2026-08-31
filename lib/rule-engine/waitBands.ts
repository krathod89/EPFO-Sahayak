// Working-day math for Code 3 (bank KYC). Source: Rule Engine Spec.md Section 3, Code 3.
//
// NOTE (carries forward spec Section 9, gap 1): "working days" here means Mon-Fri only.
// It does NOT account for Indian public holidays — no holiday calendar was in scope for
// this MVP.
//
// RE-ANCHORED 2026-08-31 (ticket 13): the bands below used to key off employer approval —
// EPFO's own order dated 3 April 2025 removed that step from bank-KYC seeding entirely.
// Quoting the order directly: "there shall be no requirement of approval of Employer in the
// bank account seeding process henceforth"; pending employer-level requests now auto-approve
// once bank/NPCI verification clears. The same order states banks average ~3 working days for
// that verification. (Confirmed via multiple convergent secondary sources — StaffNews,
// CAalley, United Consultancy, PlanivestFin — since epfindia.gov.in/epfo.gov.in both still
// 404 mid-migration and pib.gov.in blocks direct fetch; same convergent-sourcing bar the
// project already uses elsewhere.) The old 15-day "Field Office can step in on the employer's
// behalf" rule is now moot — there's no employer step left to step in on. These bands are a
// reasoned estimate off the ~3-day average with a buffer, not an EPFO-published figure — same
// caveat status the original bands carried. Do not tighten further without a primary-source
// recheck once EPFO's site is reachable again.

export type WaitBand = 1 | 2 | 3;

export interface WaitBandResult {
  band: WaitBand;
  workingDays: number;
}

/** Counts Mon-Fri days strictly between two ISO dates (exclusive of `from`, inclusive of `to`). */
export function workingDaysBetween(from: string, to: string): number {
  const start = new Date(`${from}T00:00:00Z`);
  const end = new Date(`${to}T00:00:00Z`);
  let count = 0;
  const cursor = new Date(start);
  cursor.setUTCDate(cursor.getUTCDate() + 1);
  while (cursor <= end) {
    const day = cursor.getUTCDay(); // 0 = Sunday, 6 = Saturday
    if (day !== 0 && day !== 6) count++;
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return count;
}

export function bankKycWaitBand(workingDays: number): WaitBandResult {
  if (workingDays <= 5) return { band: 1, workingDays };
  if (workingDays <= 10) return { band: 2, workingDays };
  return { band: 3, workingDays };
}
