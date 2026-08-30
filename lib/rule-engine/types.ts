// Shared types for the rule engine.
// Source of truth for every field/enum here: Rule Engine/Rule Engine Spec.md, Section 2.

export type EntryPoint = "post_rejection" | "pre_filing";

/** The 7 selectable rejection/failure codes (spec Section 3). */
export type RuleCode =
  | "CODE_1_NAME_DOB"
  | "CODE_2_DOE"
  | "CODE_3_BANK_KYC"
  | "CODE_4_EPS"
  | "CODE_5_OLD_CLAIM"
  | "CODE_6_APPROVED_NOT_CREDITED"
  | "CODE_7_NO_REASON";

/** Codes that can be diagnosed and ranked together (excludes Code 6/7, which are mutually
 * exclusive with the other codes at the UI level — spec Section 4). */
export type DiagnosableCode =
  | "CODE_1_NAME_DOB"
  | "CODE_2_DOE"
  | "CODE_3_BANK_KYC"
  | "CODE_4_EPS"
  | "CODE_5_OLD_CLAIM";

export type YesNoUnsure = "yes" | "no" | "unsure";

/** The 5-item self-check checklist, reused by Code 7's fallback and the pre-filing flow
 * (spec Section 2 / Section 7). */
export interface SelfCheckAnswers {
  doe_marked: YesNoUnsure;
  kyc_verified_not_just_approved: YesNoUnsure;
  name_dob_fathername_consistent: YesNoUnsure;
  eps_history_continuous: YesNoUnsure;
  old_claim_pending: YesNoUnsure;
}

export type NameDobKycPageStatus = "approved_and_verified" | "not_verified" | "unsure";

export type ClaimType = "Form 19" | "Form 10C" | "Form 31" | "unsure";

/** ISO date string, e.g. "2026-08-29". */
export type ISODate = string;

export interface PostRejectionInput {
  entry_point: "post_rejection";
  uan?: string;
  claim_id?: string;
  claim_type?: ClaimType;
  rejection_codes_selected: RuleCode[];
  filing_date: ISODate;
  kyc_complete_at_filing: boolean;
  /** Defaults to the server's current date if omitted. */
  today_date?: ISODate;
  /** Required if CODE_1_NAME_DOB is selected. */
  namedob_kyc_page_status?: NameDobKycPageStatus;
  /** Required if CODE_3_BANK_KYC is selected. */
  bank_kyc_submission_date?: ISODate;
  /** Required if CODE_7_NO_REASON is selected. */
  self_check_answers?: SelfCheckAnswers;
}

export interface PreFilingInput {
  entry_point: "pre_filing";
  uan?: string;
  claim_id?: string;
  today_date?: ISODate;
  self_check_answers: SelfCheckAnswers;
}

export type DiagnoseInput = PostRejectionInput | PreFilingInput;
