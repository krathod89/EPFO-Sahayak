// Working-day math for Code 3 (bank KYC). Source: Rule Engine Spec.md Section 3, Code 3.
//
// NOTE (carries forward spec Section 9, gap 1): "working days" here means Mon-Fri only.
// It does NOT account for Indian public holidays — no holiday calendar was in scope for
// this MVP. Only the >15-day cutoff is backed by an actual EPFO rule (Field Offices may
// seed KYC directly if the employer hasn't within 15 days); the 0-7 and 8-15 bands are
// built from secondary sources, not EPFO's own Citizen Charter (unreachable during
// research, see Rule Engine Spec.md Section 3/9). Do not tighten this without a primary
// source recheck.

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
  if (workingDays <= 7) return { band: 1, workingDays };
  if (workingDays <= 15) return { band: 2, workingDays };
  return { band: 3, workingDays };
}
