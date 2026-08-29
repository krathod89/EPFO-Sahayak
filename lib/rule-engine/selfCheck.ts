// The 5-item self-check checklist, shared by Code 7's fallback and the pre-filing flow.
// Source: Rule Engine/Rule Engine Spec.md Section 2 (the checklist) and Section 7
// (the per-check pass/fail polarity table — note old_claim_pending flips direction).

import type { DiagnosableCode, SelfCheckAnswers, YesNoUnsure } from "./types";

type SelfCheckItemKey = keyof SelfCheckAnswers;

interface SelfCheckMapping {
  key: SelfCheckItemKey;
  /** The answer value that means "this is a problem" for this item. */
  issueValue: YesNoUnsure;
  mappedCode: DiagnosableCode;
}

const SELF_CHECK_MAPPING: SelfCheckMapping[] = [
  { key: "doe_marked", issueValue: "no", mappedCode: "CODE_2_DOE" },
  { key: "kyc_verified_not_just_approved", issueValue: "no", mappedCode: "CODE_3_BANK_KYC" },
  { key: "name_dob_fathername_consistent", issueValue: "no", mappedCode: "CODE_1_NAME_DOB" },
  { key: "eps_history_continuous", issueValue: "no", mappedCode: "CODE_4_EPS" },
  // Polarity flip: a pending old claim is itself the problem, so "yes" is the issue answer here.
  { key: "old_claim_pending", issueValue: "yes", mappedCode: "CODE_5_OLD_CLAIM" },
];

export interface SelfCheckBucket {
  issues: { key: SelfCheckItemKey; code: DiagnosableCode }[];
  unsure: SelfCheckItemKey[];
  passed: SelfCheckItemKey[];
}

export function bucketSelfCheck(answers: SelfCheckAnswers): SelfCheckBucket {
  const issues: SelfCheckBucket["issues"] = [];
  const unsure: SelfCheckItemKey[] = [];
  const passed: SelfCheckItemKey[] = [];

  for (const mapping of SELF_CHECK_MAPPING) {
    const answer = answers[mapping.key];
    if (answer === "unsure") {
      unsure.push(mapping.key);
    } else if (answer === mapping.issueValue) {
      issues.push({ key: mapping.key, code: mapping.mappedCode });
    } else {
      passed.push(mapping.key);
    }
  }

  return { issues, unsure, passed };
}
