// Shared types for the rule engine.
// Source of truth for every field/enum here: Rule Engine/Rule Engine Spec.md, Section 2.

export type EntryPoint = "post_rejection" | "pre_filing";

/** The 10 selectable rejection/failure codes (spec Section 3). */
export type RuleCode =
  | "CODE_1_NAME_DOB"
  | "CODE_2_DOE"
  | "CODE_3_BANK_KYC"
  | "CODE_4_EPS"
  | "CODE_5_OLD_CLAIM"
  | "CODE_6_APPROVED_NOT_CREDITED"
  | "CODE_7_NO_REASON"
  | "CODE_8_ELIGIBILITY"
  | "CODE_9_WRONG_FORM"
  | "CODE_10_UNLISTED_REASON";

/** Codes that can't be combined with anything else, including each other (spec Section 4) —
 * a claim can't be simultaneously "rejected with reason X" and "approved but not credited,"
 * "no reason given," "ineligible," "wrong form filed," or "a reason given but not recognized."
 * Single source of truth, imported by both `schema.ts` (server-side validation) and
 * `Wizard.tsx` (client-side selection UI) — ticket 16's own code-review pass found these
 * hand-maintained as two separate literal arrays, one per layer, risking exactly the
 * client/server drift a shared constant exists to prevent. */
export const MUTUALLY_EXCLUSIVE_CODES: RuleCode[] = [
  "CODE_6_APPROVED_NOT_CREDITED",
  "CODE_7_NO_REASON",
  "CODE_8_ELIGIBILITY",
  "CODE_9_WRONG_FORM",
  "CODE_10_UNLISTED_REASON",
];

/** Codes for which the deadline/penalty check (H11) is deliberately suppressed, not just
 * unused — the claim was never going to be "settled" under the 3/20-day clock regardless,
 * since it was never a valid claim in this shape to begin with (ineligible, or filed under
 * the wrong form entirely). Showing a deadline/penalty check for these would be actively
 * misleading, not just irrelevant (ticket 16 found and fixed 4 UI bugs from this exact gap;
 * ticket 17 generalizes the check itself so a future suppressed code doesn't need another
 * hand-added `if` in `index.ts`). */
export const DEADLINE_SUPPRESSED_CODES: RuleCode[] = ["CODE_8_ELIGIBILITY", "CODE_9_WRONG_FORM"];

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

/** Whether the citizen's bank payout account is solely in their own name — EPFO rejects
 * joint accounts outright, a distinct, non-timing failure inside Code 3's territory
 * (ticket 15). "unsure" routes to the normal wait-time-band flow, same as Code 1's "unsure"
 * defaulting to its less-severe branch. */
export type BankAccountType = "individual" | "joint" | "unsure";

/** Which eligibility rule Code 8's remark points to — the two known EPFO service-length
 * thresholds have opposite remedies (wait vs. switch claim type entirely), so this can't
 * safely default either way the way Code 1's `unsure` does; "unsure" gets its own honest
 * branch instead (ticket 16, ~2026-09-01). */
export type EligibilityIssueType = "under_six_months" | "over_nine_half_years" | "unsure";

/** What the citizen is actually trying to withdraw — Code 9's branching sub-question
 * (ticket 17). Deliberately about intent, not about which form they already filed
 * (`claim_type` below already covers that, and is unrelated) — the fix is telling them which
 * form matches what they're trying to do, so this decodes intent, not the wrong form itself.
 * "unsure" gets its own branch (same pattern as Code 8) since many citizens don't clearly
 * distinguish "my PF" from "my EPS/pension," and guessing wrong here means recommending the
 * wrong form. */
export type WithdrawalIntent = "full_settlement" | "pension_only" | "advance" | "unsure";

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
  /** The date EPFO actually rejected the claim / sent the rejection notice, if the citizen
   * knows it. When present, the deadline/penalty check (H11) is evaluated as of this date —
   * a rejection IS EPFO's act of "settling" the claim, so this is the date that actually
   * determines whether EPFO met its own SLA. When omitted, the check falls back to
   * `today_date` as an approximation (see deadline.ts's `basis` field) — "today" is only a
   * proxy for the real decision date and can make an on-time rejection look late, or vice
   * versa, if the citizen checks well after the fact. */
  rejection_date?: ISODate;
  /** Required if CODE_1_NAME_DOB is selected. */
  namedob_kyc_page_status?: NameDobKycPageStatus;
  /** Required if CODE_3_BANK_KYC is selected. */
  bank_account_type?: BankAccountType;
  /** Required if CODE_3_BANK_KYC is selected and `bank_account_type` isn't "joint" — a
   * joint-account rejection is a hard rejection independent of timing, so no date applies. */
  bank_kyc_submission_date?: ISODate;
  /** Required if CODE_8_ELIGIBILITY is selected. */
  eligibility_issue_type?: EligibilityIssueType;
  /** Required if CODE_9_WRONG_FORM is selected. */
  withdrawal_intent?: WithdrawalIntent;
  /** Required if CODE_7_NO_REASON or CODE_10_UNLISTED_REASON is selected — the two share the
   * same self-check sub-flow (ticket 10). */
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
