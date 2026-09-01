// Zod request-validation schemas for POST /api/diagnose. Kept separate from types.ts so the
// rule-engine core has zero dependency on a validation library — only the API boundary
// (app/api/diagnose/route.ts) imports this file.

import { z } from "zod";

import { MUTUALLY_EXCLUSIVE_CODES } from "./types";

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Expected an ISO date, e.g. 2026-08-29");

const ruleCode = z.enum([
  "CODE_1_NAME_DOB",
  "CODE_2_DOE",
  "CODE_3_BANK_KYC",
  "CODE_4_EPS",
  "CODE_5_OLD_CLAIM",
  "CODE_6_APPROVED_NOT_CREDITED",
  "CODE_7_NO_REASON",
  "CODE_8_ELIGIBILITY",
  "CODE_9_WRONG_FORM",
  "CODE_10_UNLISTED_REASON",
]);

const yesNoUnsure = z.enum(["yes", "no", "unsure"]);

const selfCheckAnswers = z.object({
  doe_marked: yesNoUnsure,
  kyc_verified_not_just_approved: yesNoUnsure,
  name_dob_fathername_consistent: yesNoUnsure,
  eps_history_continuous: yesNoUnsure,
  old_claim_pending: yesNoUnsure,
});

const postRejectionSchema = z.object({
  entry_point: z.literal("post_rejection"),
  uan: z.string().optional(),
  claim_id: z.string().optional(),
  claim_type: z.enum(["Form 19", "Form 10C", "Form 31", "unsure"]).optional(),
  rejection_codes_selected: z.array(ruleCode).min(1, "Select at least one code"),
  filing_date: isoDate,
  kyc_complete_at_filing: z.boolean(),
  today_date: isoDate.optional(),
  namedob_kyc_page_status: z.enum(["approved_and_verified", "not_verified", "unsure"]).optional(),
  bank_account_type: z.enum(["individual", "joint", "unsure"]).optional(),
  bank_kyc_submission_date: isoDate.optional(),
  eligibility_issue_type: z.enum(["under_six_months", "over_nine_half_years", "unsure"]).optional(),
  withdrawal_intent: z.enum(["full_settlement", "pension_only", "advance", "unsure"]).optional(),
  self_check_answers: selfCheckAnswers.optional(),
});

const preFilingSchema = z.object({
  entry_point: z.literal("pre_filing"),
  uan: z.string().optional(),
  claim_id: z.string().optional(),
  today_date: isoDate.optional(),
  self_check_answers: selfCheckAnswers,
});

// z.discriminatedUnion requires each member to be a plain ZodObject, so the cross-field
// rules below (Code 1/3/7's conditional-required fields, Code 6/7's exclusivity) are
// applied as a second pass in validatePostRejectionCrossFields(), not via .superRefine()
// on the member schema itself.
export const diagnoseRequestSchema = z.discriminatedUnion("entry_point", [
  postRejectionSchema,
  preFilingSchema,
]);

export type PostRejectionRequest = z.infer<typeof postRejectionSchema>;

/** Returns a list of plain-language error messages, empty when the cross-field rules all pass. */
export function validatePostRejectionCrossFields(data: PostRejectionRequest): string[] {
  const errors: string[] = [];
  const codes = data.rejection_codes_selected;

  if (codes.includes("CODE_1_NAME_DOB") && !data.namedob_kyc_page_status) {
    errors.push("namedob_kyc_page_status is required when CODE_1_NAME_DOB is selected");
  }
  if (codes.includes("CODE_3_BANK_KYC") && !data.bank_account_type) {
    errors.push("bank_account_type is required when CODE_3_BANK_KYC is selected");
  }
  // A joint-account rejection (ticket 15) is a hard rejection independent of timing — no
  // submission date applies, so it's only required for the individual/unsure paths.
  if (codes.includes("CODE_3_BANK_KYC") && data.bank_account_type !== "joint" && !data.bank_kyc_submission_date) {
    errors.push("bank_kyc_submission_date is required when CODE_3_BANK_KYC is selected and the account is not joint");
  }
  if (codes.includes("CODE_7_NO_REASON") && !data.self_check_answers) {
    errors.push("self_check_answers is required when CODE_7_NO_REASON is selected");
  }
  // Ticket 10: Code 10 shares Code 7's self-check mechanics exactly (see diagnose.ts), so it
  // needs the same required-field check.
  if (codes.includes("CODE_10_UNLISTED_REASON") && !data.self_check_answers) {
    errors.push("self_check_answers is required when CODE_10_UNLISTED_REASON is selected");
  }
  // Ticket 16: a genuine eligibility rejection isn't "also" a records mismatch — Code 8
  // joins Codes 6/7 in the mutual-exclusivity set below.
  if (codes.includes("CODE_8_ELIGIBILITY") && !data.eligibility_issue_type) {
    errors.push("eligibility_issue_type is required when CODE_8_ELIGIBILITY is selected");
  }
  // Ticket 17: a wrong-form-filed rejection is a user-error case, same treatment as Code 8 —
  // not "also" a records mismatch, and it joins the same mutual-exclusivity set.
  if (codes.includes("CODE_9_WRONG_FORM") && !data.withdrawal_intent) {
    errors.push("withdrawal_intent is required when CODE_9_WRONG_FORM is selected");
  }
  // Codes 6, 7, 8, 9, and 10 are mutually exclusive with every other code, INCLUDING each
  // other (spec Section 4) — a claim cannot be simultaneously "rejected with reason X" and
  // "approved but not credited," "no reason given," "ineligible," "wrong form filed," or "a
  // reason given but not recognized." (A length-based comparison against just the exclusive
  // subset misses the case where two of these are selected together with nothing else — both
  // then count toward "exclusive," so the two lengths come out equal instead of flagging a
  // conflict.)
  const hasExclusiveCode = codes.some((c) => MUTUALLY_EXCLUSIVE_CODES.includes(c));
  if (hasExclusiveCode && codes.length > 1) {
    // Derived from MUTUALLY_EXCLUSIVE_CODES rather than hand-typed, so this message can't
    // drift out of sync with the array itself when a future code is added to it.
    errors.push(
      `${MUTUALLY_EXCLUSIVE_CODES.join(", ")} cannot be combined with any other code, including each other`
    );
  }
  // rejection_codes_selected is a "set" per spec Section 2 — reject a duplicate outright
  // rather than silently deduplicating, which would otherwise produce a doubled-up
  // explanation/fix in the response (diagnose.ts maps directly over the raw code list).
  if (new Set(codes).size !== codes.length) {
    errors.push("rejection_codes_selected must not contain duplicate codes");
  }

  return errors;
}
