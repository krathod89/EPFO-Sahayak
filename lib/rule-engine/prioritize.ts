// Priority-check logic (H10). Source: Rule Engine/Rule Engine Spec.md Section 4,
// including its pseudocode — this is a direct translation of that pseudocode.
//
// Tier 1 (blocks eligibility first): Code 2 (Date of Exit), Code 5 (old claim pending).
// Tier 2 (blocks payment outright): Code 3 (Bank KYC), Code 1 (Name/DOB) — in that order.
// Code 4 (EPS) is deliberately unranked — the source finding does not place it in either
// tier (spec Section 9, gap 4). Do not assign it a tier without new source evidence.

import type { DiagnosableCode } from "./types";

const TIER1: DiagnosableCode[] = ["CODE_2_DOE", "CODE_5_OLD_CLAIM"];
const TIER2_ORDER: DiagnosableCode[] = ["CODE_3_BANK_KYC", "CODE_1_NAME_DOB"];

export interface PriorityResult {
  needsRanking: boolean;
  /** Tier 1 codes present, in the input's order (no defined order between them). */
  tier1: DiagnosableCode[];
  /** Tier 2 codes present, ordered Bank KYC before Name/DOB per the source finding. */
  tier2: DiagnosableCode[];
  /** Codes with no established tier (currently just Code 4, EPS) — shown separately,
   * never given an implied rank. */
  unranked: DiagnosableCode[];
  /** tier1 + tier2, in fix-first order. Empty/single-element when no ranking is needed. */
  ranked: DiagnosableCode[];
}

export function prioritize(selectedCodes: DiagnosableCode[]): PriorityResult {
  if (selectedCodes.length <= 1) {
    return { needsRanking: false, tier1: [], tier2: [], unranked: [], ranked: [...selectedCodes] };
  }

  const tier1 = selectedCodes.filter((c) => TIER1.includes(c));
  const tier2 = TIER2_ORDER.filter((c) => selectedCodes.includes(c));
  const unranked = selectedCodes.filter((c) => !tier1.includes(c) && !tier2.includes(c));

  return {
    needsRanking: true,
    tier1,
    tier2,
    unranked,
    ranked: [...tier1, ...tier2],
  };
}
