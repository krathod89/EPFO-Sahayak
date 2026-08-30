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

/** Code 3's shared opening explanation, shown before the band-specific text (spec Section 3, Code 3). */
export const CODE_3_INTRO =
  "EPFO must confirm that your bank account number, IFSC code, and account-holder name all match your other records before it can pay you. If any of these does not match, or the check is still in progress, your claim cannot move forward — even if every other part of it is approved.";

/** Code 3's per-band text. `{X}` is the working-day count, substituted at render time. */
export const CODE_3_BANDS: Record<1 | 2 | 3, ExplanationAndFix> = {
  1: {
    explanation:
      "You submitted your bank KYC {X} working days ago. This is still within the normal wait. No action is needed yet.",
    fix: "No action needed. Check back after a few more working days.",
  },
  2: {
    explanation:
      "You submitted your bank KYC {X} working days ago. This is at the edge of the normal wait. It is worth checking, but not yet clearly stuck.",
    fix: "Contact your employer's HR or PF team and ask if they have approved your KYC request on their end. If they have, and it still shows unverified, check again in a few more days.",
  },
  3: {
    explanation:
      "You submitted your bank KYC {X} working days ago. EPFO's own rule lets its Field Offices verify your KYC directly if your employer has not done so within 15 days. You have passed this point. It is time to escalate.",
    fix: "Raise a grievance through EPFiGMS. Ask EPFO's Field Office to verify your bank KYC directly, since your employer has not completed this within 15 working days.",
  },
};

/** Code 7's opening text, shown before the self-check sub-flow runs (spec Section 3, Code 7). */
export const CODE_7_OPENING =
  "EPFO has not told you why your claim was rejected. This can happen. It does not mean nothing is wrong — it means EPFO did not explain. Let's check the common causes yourself, one by one.";

/** Code 3's text when reached via the self-check checklist (Code 7 fallback or pre-filing) —
 * no submission date is collected there, so no wait-time band applies (spec Section 3, Code 7
 * footnote, and Section 7). The fix text below is a spec-consistent extrapolation of the
 * band 1-2 guidance, since the spec only says "show the general explanation," not a fix. */
export const CODE_3_GENERAL: ExplanationAndFix = {
  explanation: CODE_3_INTRO,
  fix: "Contact your employer's HR or PF team to confirm your bank KYC has been submitted and approved on their end. If it has been pending a long time with no update, raise a grievance through EPFiGMS asking EPFO's Field Office to verify it directly.",
};

export const CODE_7_ALL_CLEAN: ExplanationAndFix = {
  explanation:
    "None of the common causes seem to apply to your case, as far as you can tell from your own records. EPFO has not given you a valid reason. You are entitled to know why your claim was rejected.",
  fix: "File a grievance through EPFiGMS that explicitly asks EPFO to state the actual reason for rejection. Do not guess a fix — demand the reason first.",
};
