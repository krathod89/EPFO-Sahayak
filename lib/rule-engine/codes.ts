// The 7 rejection/failure codes and their plain-language copy.
// Source of truth: Rule Engine/Rule Engine Spec.md, Section 3. Copy is reused verbatim
// from that spec (already drafted plain-language text), not rewritten here.
// See Engineering/ADR/0003-rule-content-as-versioned-code.md for why this lives in code.

import type { RuleCode } from "./types";

export interface CodeDefinition {
  code: RuleCode;
  name: string;
  trigger: string;
}

export const CODE_DEFINITIONS: Record<RuleCode, CodeDefinition> = {
  CODE_1_NAME_DOB: {
    code: "CODE_1_NAME_DOB",
    name: "Name / DOB / father's-name mismatch",
    trigger:
      "Matches any EPFO remark citing a mismatch in name, date of birth, or father's name across Aadhaar, UAN, PAN, or bank records.",
  },
  CODE_2_DOE: {
    code: "CODE_2_DOE",
    name: "Date of Exit not marked",
    trigger:
      "Matches EPFO remarks stating the citizen's last working day at a previous employer is not recorded.",
  },
  CODE_3_BANK_KYC: {
    code: "CODE_3_BANK_KYC",
    name: "Bank KYC not verified, or bank details mismatch",
    trigger:
      "Matches EPFO remarks about unverified bank KYC, or a mismatch in account number, IFSC code, or account-holder name.",
  },
  CODE_4_EPS: {
    code: "CODE_4_EPS",
    name: "EPS (pension) discrepancy",
    trigger:
      "Matches EPFO remarks showing zero or missing Employee Pension Scheme (EPS) contributions for a period the citizen was working.",
  },
  CODE_5_OLD_CLAIM: {
    code: "CODE_5_OLD_CLAIM",
    name: "An old claim is still pending",
    trigger:
      "Matches EPFO remarks blocking a new claim because an earlier one (Form 19, 10C, or 31) is unresolved.",
  },
  CODE_6_APPROVED_NOT_CREDITED: {
    code: "CODE_6_APPROVED_NOT_CREDITED",
    name: "Approved, but the money never arrived",
    trigger:
      "The claim status shows approved, but no payment has reached the citizen's bank account.",
  },
  CODE_7_NO_REASON: {
    code: "CODE_7_NO_REASON",
    name: "I don't see a reason",
    trigger:
      "EPFO shows no remark at all, or the citizen cannot find one; citizen selects this option instead of a code.",
  },
};

export interface ExplanationAndFix {
  explanation: string;
  fix: string;
}

/** Broad EPFiGMS category names for the grievance-output "where to file" hint (ticket 14,
 * 2026-08-31), confirmed only in prose by secondary sources (ClearTax, BankBazaar, IndMoney,
 * Paytm, Jainam, Motilal Oswal, Bajaj Finserv, Canara HSBC) — not the exact dropdown values.
 * EPFiGMS's real category/subcategory dropdown only renders after a citizen's own UAN + OTP
 * login, which this project has no access to; no secondary source shows the authenticated
 * form either. This stays a best-guess HINT, never a confirmed instruction — see
 * `SUGGESTED_CATEGORY_CAVEAT` and `Rule Engine/Rule Engine Spec.md` §6/§9 gap 6. A Phase 2
 * follow-up (PRD.md §10) replaces this with the exact captured mapping once a real volunteer
 * reports back what they actually saw on the authenticated form. */
export type SuggestedCategory = "PF Withdrawal" | "Pension Settlement";

/** One entry per `RuleCode` (exhaustive, like `CODE_DEFINITIONS` above) — a future code added
 * to `RuleCode` fails to type-check here until it's given a category too, same safety net
 * `CODE_DEFINITIONS` already has. Every code defaults to "PF Withdrawal" (every code in this
 * tool is about a Form 19/10C/31 withdrawal claim) except Code 4, EPS — literally the pension
 * component, the one deliberate differentiation. */
export const SUGGESTED_CATEGORY_BY_CODE: Record<RuleCode, SuggestedCategory> = {
  CODE_1_NAME_DOB: "PF Withdrawal",
  CODE_2_DOE: "PF Withdrawal",
  CODE_3_BANK_KYC: "PF Withdrawal",
  CODE_4_EPS: "Pension Settlement",
  CODE_5_OLD_CLAIM: "PF Withdrawal",
  CODE_6_APPROVED_NOT_CREDITED: "PF Withdrawal",
  CODE_7_NO_REASON: "PF Withdrawal",
};

/** Caveat shown alongside `suggestedCategory` — must always accompany it; the hint is never
 * presented as a confirmed instruction. */
export const SUGGESTED_CATEGORY_CAVEAT =
  "This is our best guess, not a confirmed EPFiGMS category — pick whichever option on the form looks closest.";

/** Code 2, 4, 5, 6 — one explanation/fix each, no branching. */
export const SIMPLE_CODE_COPY: Partial<Record<RuleCode, ExplanationAndFix>> = {
  CODE_2_DOE: {
    explanation:
      "EPFO does not know your last working day at your previous employer. Your former employer must record this date — called your 'Date of Exit' — in EPFO's system. Until they do, EPFO's records show you as still working there. This blocks your claim. This is not your mistake. It is a step your former employer did not complete.",
    fix: "Ask your former employer's HR or PF team to mark your Date of Exit on the EPFO employer portal. If they are slow or do not respond, file a grievance through EPFiGMS. Name your former employer, and ask EPFO to direct them to complete this step.",
  },
  CODE_4_EPS: {
    explanation:
      "Your Employee Pension Scheme (EPS) contribution record shows zero, or is missing, for a period when you were working and should have had contributions. This often happens after a job change, when an employer's records and EPFO's records fall out of step.",
    fix: "Contact your employer's HR or PF team for the period in question. Ask them to confirm they deposited your EPS contribution. If they confirm they did, file a grievance through EPFiGMS naming the exact period affected, so EPFO can investigate the gap in its own records.",
  },
  CODE_5_OLD_CLAIM: {
    explanation:
      "You have an earlier claim — a Form 19, 10C, or 31 — still open in EPFO's system. EPFO will not process a new claim while an old one is unresolved, even if you forgot about it.",
    fix: "Check your claim history on the UAN portal for any old, unresolved claim. If you no longer need it, you may be able to withdraw or cancel it. If it should already have been settled, raise a grievance on that old claim first. Once it closes, refile your new claim.",
  },
  CODE_6_APPROVED_NOT_CREDITED: {
    explanation:
      "EPFO approved your claim. The money has not reached your bank account. This is a different problem from a rejection — your claim passed, but the payment itself did not go through, or has not shown up yet.",
    fix: "Check your EPFO passbook or claim status page for a payment reference number, sometimes called a UTR. Check your bank statement using this reference. If your bank confirms no such transfer arrived, raise a grievance through EPFiGMS, quoting your claim ID and approval date, and ask EPFO to trace the payment.",
  },
};

/** Code 1's two branches (spec Section 3, Code 1). */
export const CODE_1_BRANCHES = {
  standard_mismatch: {
    explanation:
      "EPFO checks your name, date of birth, and father's name across four records: Aadhaar, your UAN profile, PAN, and your bank account. One of these records does not match the others. This is often a small thing — a spelling difference, or an initial written out in full. This is usually not your mistake. Different offices type your details differently over time.",
    fix: "File a Joint Declaration to correct the mismatched detail. You and your employer both sign this on the UAN portal. Attach the record with the correct spelling — for example, your Aadhaar card. This tells EPFO which record to trust.",
  },
  portal_sync_bug: {
    explanation:
      "Your KYC page already shows this detail as Approved and Verified. Your record is correct. The claim screen has not caught up yet. This is a known sync problem between two EPFO systems. It is not a real mismatch in your data.",
    fix: "Do not file a Joint Declaration. Do not change data that is already correct. Wait 24 to 48 hours and check again. If the claim screen still shows the old error after that, raise a grievance. Attach two screenshots: your KYC page showing Approved and Verified, and your claim status page showing the error.",
  },
} satisfies Record<string, ExplanationAndFix>;

/** Code 3's shared opening explanation, shown before every band's text (spec Section 3, Code 3) —
 * every band's rendered `explanation` includes this verbatim (see `resolveCode3` in diagnose.ts).
 * This is the ONE sanctioned place Code 3's copy names the employer (ticket 13) — deliberately,
 * to debunk the exact old-process misconception the April 2025 order was meant to end. It's
 * unconditional (not gated on `bank_kyc_submission_date`) because the same order auto-approved
 * every request already pending with an employer at the time it took effect — there is no case
 * this tool would diagnose today (well over a year later) where employer approval is still the
 * live blocker. See waitBands.ts for the full citation. */
export const CODE_3_INTRO =
  "EPFO must confirm that your bank account number, IFSC code, and account-holder name all match your other records before it can pay you. Your bank and NPCI verify this directly — since April 2025, your employer's approval is no longer part of this step. If the check is still in progress, or something doesn't match, your claim cannot move forward — even if every other part of it is approved.";

/** Code 3's per-band text. `{X}` is the working-day count, substituted at render time.
 * Re-anchored 2026-08-31 (ticket 13) to the post-April-2025 process — see waitBands.ts for
 * the full citation. Unlike CODE_3_INTRO above, no band's `explanation` or `fix` mentions the
 * employer — there's no employer-facing action left to instruct. */
export const CODE_3_BANDS: Record<1 | 2 | 3, ExplanationAndFix> = {
  1: {
    explanation:
      "You submitted your bank KYC {X} working days ago. This is still within the typical bank/NPCI verification turnaround. No action is needed yet.",
    fix: "No action needed. Check back after a few more working days.",
  },
  2: {
    explanation:
      "You submitted your bank KYC {X} working days ago. This is longer than the typical turnaround. It is worth checking, but not yet clearly stuck.",
    fix: "Contact your bank to confirm your account number, IFSC code, and account-holder name were submitted correctly. If everything on their end looks correct and it still shows unverified, check again in a few more days.",
  },
  3: {
    explanation:
      "You submitted your bank KYC {X} working days ago. This is well beyond the typical bank/NPCI verification turnaround. It is worth escalating.",
    fix: "Raise a grievance through EPFiGMS. Ask EPFO to check why your bank KYC verification is taking longer than the typical turnaround and confirm its status directly.",
  },
};

/** Code 3's named branches, parallel to CODE_1_BRANCHES above — a container for "one code,
 * multiple distinct branches," rather than a standalone constant (ticket 15, 2026-08-31,
 * code-review pass). Currently just the joint-account branch: found while auditing coverage
 * past the original 15-case sample's own biased search terms, EPFO requires the payout
 * account to be solely in the citizen's name — a joint account is a hard rejection, not a
 * timing issue, so no wait-time band applies. The fix is deliberately worded so it can't be
 * confused with the KYC-verification fix text above: this is a citizen-side account change,
 * not something to wait on or escalate. */
export const CODE_3_BRANCHES = {
  joint_account: {
    explanation:
      "EPFO requires the payout account to be in your name only. A joint account — one with more than one holder — is not accepted, even if your name is one of the holders. This is separate from KYC verification timing; it is a hard rejection, not something that clears with more waiting.",
    fix: "Open an individual bank account in your own name only. Then submit a new bank-seeding/KYC request on the UAN portal with that account. You do not need to wait or raise a grievance — the fix is opening the right kind of account.",
  },
} satisfies Record<string, ExplanationAndFix>;

/** Code 7's opening text, shown before the self-check sub-flow runs (spec Section 3, Code 7). */
export const CODE_7_OPENING =
  "EPFO has not told you why your claim was rejected. This can happen. It does not mean nothing is wrong — it means EPFO did not explain. Let's check the common causes yourself, one by one.";

/** Code 3's text when reached via the self-check checklist (Code 7 fallback or pre-filing) —
 * no submission date is collected there, so no wait-time band applies (spec Section 3, Code 7
 * footnote, and Section 7). The fix text below is a spec-consistent extrapolation of the
 * band 1-2 guidance, since the spec only says "show the general explanation," not a fix. */
export const CODE_3_GENERAL: ExplanationAndFix = {
  explanation: CODE_3_INTRO,
  fix: "Contact your bank to confirm your KYC details were submitted correctly. If it has been pending a long time with no update, raise a grievance through EPFiGMS asking EPFO to verify it directly.",
};

export const CODE_7_ALL_CLEAN: ExplanationAndFix = {
  explanation:
    "None of the common causes seem to apply to your case, as far as you can tell from your own records. EPFO has not given you a valid reason. You are entitled to know why your claim was rejected.",
  fix: "File a grievance through EPFiGMS that explicitly asks EPFO to state the actual reason for rejection. Do not guess a fix — demand the reason first.",
};
