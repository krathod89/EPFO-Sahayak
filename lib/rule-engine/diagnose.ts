// Diagnosis logic: resolves selected code(s) to plain-language explanation/fix text,
// including Code 1's branch and Code 3's wait-time band, and runs Code 7's self-check
// sub-flow. Source: Rule Engine/Rule Engine Spec.md Section 3.

import {
  CODE_1_BRANCHES,
  CODE_3_BANDS,
  CODE_3_BRANCHES,
  CODE_3_GENERAL,
  CODE_3_INTRO,
  SIMPLE_CODE_COPY,
} from "./codes";
import { bucketSelfCheck } from "./selfCheck";
import { bankKycWaitBand, workingDaysBetween } from "./waitBands";
import type {
  BankAccountType,
  ISODate,
  NameDobKycPageStatus,
  RuleCode,
  SelfCheckAnswers,
} from "./types";

/** Every named branch across every code that has one (Code 1's two, Code 3's joint-account
 * branch). One shared union rather than redeclared per meta-shape, so `hasBranch()` below
 * stays a single, reusable type guard instead of the 4x-duplicated inline check it replaced
 * (ticket 15, code-review pass). */
export type EntryBranch = "standard_mismatch" | "portal_sync_bug" | "joint_account";

export interface DiagnosisEntry {
  code: RuleCode;
  explanation: string;
  fix: string;
  /** Branch/band details for codes that resolve differently depending on context. */
  meta?: { branch: EntryBranch } | { band: 1 | 2 | 3; workingDays: number };
}

/** True when this entry resolved to the named branch — the one shared check for what was
 * duplicated inline at 4 call sites (2x in Wizard.tsx, 2x in index.ts) before ticket 15 added
 * a 4th copy. Use this instead of re-checking `"branch" in entry.meta` by hand. */
export function hasBranch(entry: DiagnosisEntry, branch: EntryBranch): boolean {
  return !!entry.meta && "branch" in entry.meta && entry.meta.branch === branch;
}

export interface DiagnoseResult {
  /** Empty when Code 7 was selected — see `selfCheck` instead. */
  entries: DiagnosisEntry[];
  selfCheck?: {
    allClean: boolean;
    unsureItems: (keyof SelfCheckAnswers)[];
    issueEntries: DiagnosisEntry[];
  };
}

export interface DiagnoseParams {
  codes: RuleCode[];
  today_date: ISODate;
  namedob_kyc_page_status?: NameDobKycPageStatus;
  bank_account_type?: BankAccountType;
  bank_kyc_submission_date?: ISODate;
  self_check_answers?: SelfCheckAnswers;
}

function resolveCode1(status: NameDobKycPageStatus | undefined): DiagnosisEntry {
  if (status === "approved_and_verified") {
    return { code: "CODE_1_NAME_DOB", ...CODE_1_BRANCHES.portal_sync_bug, meta: { branch: "portal_sync_bug" } };
  }
  return { code: "CODE_1_NAME_DOB", ...CODE_1_BRANCHES.standard_mismatch, meta: { branch: "standard_mismatch" } };
}

/** A joint-account rejection (ticket 15) is a hard rejection independent of timing — it wins
 * over any wait-time band regardless of what submission date was also sent. */
function resolveCode3JointAccount(): DiagnosisEntry {
  return {
    code: "CODE_3_BANK_KYC",
    explanation: `${CODE_3_INTRO} ${CODE_3_BRANCHES.joint_account.explanation}`,
    fix: CODE_3_BRANCHES.joint_account.fix,
    meta: { branch: "joint_account" },
  };
}

function resolveCode3(submissionDate: ISODate, todayDate: ISODate): DiagnosisEntry {
  const workingDays = workingDaysBetween(submissionDate, todayDate);
  const { band } = bankKycWaitBand(workingDays);
  const bandCopy = CODE_3_BANDS[band];
  return {
    code: "CODE_3_BANK_KYC",
    explanation: `${CODE_3_INTRO} ${bandCopy.explanation.replace("{X}", String(workingDays))}`,
    fix: bandCopy.fix,
    meta: { band, workingDays },
  };
}

function resolveSimpleCode(code: RuleCode): DiagnosisEntry {
  const copy = SIMPLE_CODE_COPY[code];
  if (!copy) throw new Error(`Unsupported code in diagnose(): ${code}`);
  return { code, ...copy };
}

/** Resolves an issue found during the self-check sub-flow (Code 7, or the pre-filing flow
 * via readiness.ts) to display text — Code 3 here uses the general (no-band) text, since
 * no submission date is collected in this context (spec Section 3 footnote / Section 7). */
export function resolveSelfCheckIssueCode(code: RuleCode): DiagnosisEntry {
  if (code === "CODE_1_NAME_DOB") {
    // No claim screen exists yet in a self-check context, so only the standard branch applies.
    return { code, ...CODE_1_BRANCHES.standard_mismatch };
  }
  if (code === "CODE_3_BANK_KYC") {
    return { code, ...CODE_3_GENERAL };
  }
  return resolveSimpleCode(code);
}

export function diagnose(params: DiagnoseParams): DiagnoseResult {
  const { codes, today_date, namedob_kyc_page_status, bank_account_type, bank_kyc_submission_date, self_check_answers } = params;

  if (codes.includes("CODE_7_NO_REASON")) {
    if (!self_check_answers) {
      throw new Error("self_check_answers is required when CODE_7_NO_REASON is selected");
    }
    const bucket = bucketSelfCheck(self_check_answers);
    const issueEntries = bucket.issues.map(({ code }) => resolveSelfCheckIssueCode(code));
    return {
      entries: [],
      selfCheck: {
        allClean: issueEntries.length === 0 && bucket.unsure.length === 0,
        unsureItems: bucket.unsure,
        issueEntries,
      },
    };
  }

  const entries = codes.map((code): DiagnosisEntry => {
    if (code === "CODE_1_NAME_DOB") return resolveCode1(namedob_kyc_page_status);
    if (code === "CODE_3_BANK_KYC") {
      // Joint-account rejection (ticket 15) wins outright — a hard rejection independent of
      // timing, so it's checked before the submission-date requirement below, and no date
      // is needed for this branch even if one happens to be present.
      if (bank_account_type === "joint") {
        return resolveCode3JointAccount();
      }
      if (!bank_kyc_submission_date) {
        throw new Error("bank_kyc_submission_date is required when CODE_3_BANK_KYC is selected and the account is not joint");
      }
      return resolveCode3(bank_kyc_submission_date, today_date);
    }
    return resolveSimpleCode(code);
  });

  return { entries };
}
