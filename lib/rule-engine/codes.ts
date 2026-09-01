// The 10 rejection/failure codes and their plain-language copy.
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
  CODE_8_ELIGIBILITY: {
    code: "CODE_8_ELIGIBILITY",
    name: "Not eligible yet, or eligible for pension instead",
    trigger:
      "Matches EPFO remarks about a service-length eligibility rule not being met: under 6 months of service for Form 10C, or more than 9.5 years of service (which routes to a monthly pension claim instead of a lump-sum withdrawal).",
  },
  CODE_9_WRONG_FORM: {
    code: "CODE_9_WRONG_FORM",
    name: "Wrong claim form filed",
    trigger:
      "Matches EPFO remarks stating the claim was filed under the wrong form for the citizen's actual situation (e.g. Form 19 filed when Form 10C's pension withdrawal fits, or vice versa).",
  },
  CODE_10_UNLISTED_REASON: {
    code: "CODE_10_UNLISTED_REASON",
    name: "I see a reason, but it's not listed here",
    trigger:
      "The citizen sees a real EPFO remark, but it doesn't match any of the 9 modeled codes above, distinct from Code 7, where EPFO shows no remark at all.",
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
  // Never actually surfaced to a citizen — Codes 8 (ticket 16) and 9 (ticket 17) never
  // generate a grievance in any branch, so these entries exist only to satisfy the exhaustive
  // Record above. "PF Withdrawal" is the least-wrong placeholder if that ever changes.
  CODE_8_ELIGIBILITY: "PF Withdrawal",
  CODE_9_WRONG_FORM: "PF Withdrawal",
  CODE_10_UNLISTED_REASON: "PF Withdrawal",
};

/** Caveat shown alongside `suggestedCategory` — must always accompany it; the hint is never
 * presented as a confirmed instruction. */
export const SUGGESTED_CATEGORY_CAVEAT =
  "This is our best guess, not a confirmed EPFiGMS category. Pick whichever option on the form looks closest.";

/** Code 2, 4, 5, 6 — one explanation/fix each, no branching. */
export const SIMPLE_CODE_COPY: Partial<Record<RuleCode, ExplanationAndFix>> = {
  CODE_2_DOE: {
    explanation:
      "EPFO does not know your last working day at your previous employer. Your former employer must record this date (called your 'Date of Exit') in EPFO's system. Until they do, EPFO's records show you as still working there. This blocks your claim. This is not your mistake. It is a step your former employer did not complete.",
    fix: "Ask your former employer's HR or PF team to mark your Date of Exit on the EPFO employer portal. If they are slow or do not respond, file a grievance through EPFiGMS. Name your former employer, and ask EPFO to direct them to complete this step.",
  },
  CODE_4_EPS: {
    explanation:
      "Your Employee Pension Scheme (EPS) contribution record shows zero, or is missing, for a period when you were working and should have had contributions. This often happens after a job change, when an employer's records and EPFO's records fall out of step.",
    fix: "Contact your employer's HR or PF team for the period in question. Ask them to confirm they deposited your EPS contribution. If they confirm they did, file a grievance through EPFiGMS naming the exact period affected, so EPFO can investigate the gap in its own records.",
  },
  CODE_5_OLD_CLAIM: {
    explanation:
      "You have an earlier claim (a Form 19, 10C, or 31) still open in EPFO's system. EPFO will not process a new claim while an old one is unresolved, even if you forgot about it.",
    fix: "Check your claim history on the UAN portal for any old, unresolved claim. If you no longer need it, you may be able to withdraw or cancel it. If it should already have been settled, raise a grievance on that old claim first. Once it closes, refile your new claim.",
  },
  CODE_6_APPROVED_NOT_CREDITED: {
    explanation:
      "EPFO approved your claim. The money has not reached your bank account. This is a different problem from a rejection: your claim passed, but the payment itself did not go through, or has not shown up yet.",
    fix: "Check your EPFO passbook or claim status page for a payment reference number, sometimes called a UTR. Check your bank statement using this reference. If your bank confirms no such transfer arrived, raise a grievance through EPFiGMS, quoting your claim ID and approval date, and ask EPFO to trace the payment.",
  },
};

/** Code 1's two branches (spec Section 3, Code 1). */
export const CODE_1_BRANCHES = {
  standard_mismatch: {
    explanation:
      "EPFO checks your name, date of birth, and father's name across four records: Aadhaar, your UAN profile, PAN, and your bank account. One of these records does not match the others. This is often a small thing: a spelling difference, or an initial written out in full. This is usually not your mistake. Different offices type your details differently over time.",
    fix: "File a Joint Declaration to correct the mismatched detail. You and your employer both sign this on the UAN portal. Attach the record with the correct spelling (for example, your Aadhaar card). This tells EPFO which record to trust.",
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
  "EPFO must confirm that your bank account number, IFSC code, and account-holder name all match your other records before it can pay you. Your bank and NPCI verify this directly. Since April 2025, your employer's approval is no longer part of this step. If the check is still in progress, or something doesn't match, your claim cannot move forward, even if every other part of it is approved.";

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
      "EPFO requires the payout account to be in your name only. A joint account (one with more than one holder) is not accepted, even if your name is one of the holders. This is separate from KYC verification timing; it is a hard rejection, not something that clears with more waiting.",
    fix: "Open an individual bank account in your own name only. Then submit a new bank-seeding/KYC request on the UAN portal with that account. You do not need to wait or raise a grievance. The fix is opening the right kind of account.",
  },
} satisfies Record<string, ExplanationAndFix>;

/** Code 8's three branches (ticket 16, ~2026-09-01). Deliberately NOT framed as "not your
 * fault" the way Codes 1-7 are — those are all records-mismatch cases; this one is usually a
 * genuine, correct eligibility rule (PRD §4's core thesis doesn't apply here, and the ticket's
 * own framing note says so explicitly). The two known thresholds have opposite remedies (wait,
 * vs. switch claim type entirely), so `unsure` gets its own honest branch rather than
 * defaulting to either — guessing wrong here would send the citizen down the wrong fix. */
export const CODE_8_BRANCHES = {
  under_six_months: {
    explanation:
      "Form 10C (withdrawing your EPS pension balance) requires at least 6 months of eligible service. EPFO's records show you have not reached this yet. This is not a records mismatch. It is a genuine eligibility rule, and as things stand today, EPFO's rejection is correct.",
    fix: "Wait until you reach 6 months of eligible service, then refile Form 10C. If you believe your recorded service length itself is wrong (for example, a missing contribution month), check your service history on the UAN portal first.",
  },
  over_nine_half_years: {
    explanation:
      "Once your service crosses 9.5 years, EPFO no longer allows a lump-sum Form 10C withdrawal of your pension balance. Past this point, you are eligible for a monthly pension instead of a one-time payout. This is a genuine eligibility rule, not a records mismatch.",
    fix: "File Form 10D to claim your monthly pension benefit instead of Form 10C. Refiling Form 10C will keep getting rejected past this service length, regardless of anything else on your claim.",
  },
  unsure: {
    explanation:
      "EPFO's remark points to a service-length eligibility rule, but which one applies changes the fix: under 6 months of service, or over 9.5 years. We can't tell which from what's been entered here.",
    fix: "Check your exact service length on the UAN portal's service history page. If it's under 6 months, wait and refile Form 10C once eligible. If it's over 9.5 years, file Form 10D for a monthly pension instead. Form 10C will keep being rejected past that point either way.",
  },
} satisfies Record<string, ExplanationAndFix>;

/** Code 9's four branches (ticket 17, ~2026-09-01) — same treatment as Code 8: never framed
 * as "not your fault" (this is a filing-choice case, not a records mismatch), and `unsure`
 * gets its own honest branch rather than guessing, since many citizens don't clearly
 * distinguish "my PF" from "my EPS/pension" and a wrong guess here recommends the wrong form. */
export const CODE_9_BRANCHES = {
  full_settlement: {
    explanation:
      "You're trying to withdraw your full PF balance after leaving your job. That calls for Form 19, not Form 10C or Form 31. This is a form-selection issue, not a records mismatch.",
    fix: "Refile using Form 19. If Form 19 is also rejected, check the specific remark it gives: that may point to a different, unrelated issue (a records mismatch or eligibility rule) rather than this one.",
  },
  pension_only: {
    explanation:
      "You're trying to withdraw only your pension (EPS) balance, not your full PF. That calls for Form 10C, not Form 19 or Form 31. Note: Form 10C has its own eligibility conditions, at least 6 months of service, and a different process past 9.5 years of service.",
    fix: "Refile using Form 10C. If Form 10C is then rejected for a service-length reason, that's a separate eligibility issue, not a wrong-form one. Check the specific remark it gives.",
  },
  advance: {
    explanation:
      "You're trying to withdraw an advance while still employed (for example, for medical, housing, or education expenses). That calls for Form 31, not Form 19 or Form 10C.",
    fix: "Refile using Form 31, selecting the reason that matches your actual purpose (medical, housing, education, etc.). Different reasons have different supporting-document requirements.",
  },
  unsure: {
    explanation:
      "EPFO's remark points to a wrong-form-filed issue, but which form actually fits depends on what you're trying to withdraw. Form 19 is your full PF balance after leaving a job. Form 10C is only your pension (EPS) balance. Form 31 is an advance while still employed.",
    fix: "Pick whichever of the three matches what you're actually trying to do, then refile under that form. If you're not sure whether you want your full balance or just the pension portion, your UAN portal's passbook shows both components separately.",
  },
} satisfies Record<string, ExplanationAndFix>;

/** Code 7's opening text, shown before the self-check sub-flow runs (spec Section 3, Code 7). */
export const CODE_7_OPENING =
  "EPFO has not told you why your claim was rejected. This can happen. It does not mean nothing is wrong. It means EPFO did not explain. Let's check the common causes yourself, one by one.";

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
  fix: "File a grievance through EPFiGMS that explicitly asks EPFO to state the actual reason for rejection. Do not guess a fix. Demand the reason first.",
};

/** Code 10's opening text (ticket 10, spec-parallel to CODE_7_OPENING above) — honest about
 * the real difference from Code 7: EPFO DID give a reason here, it just isn't one of the 9
 * modeled codes. Note: like CODE_7_OPENING/CODE_7_ALL_CLEAN, this constant documents the
 * source-of-truth copy per the spec but isn't imported into Wizard.tsx directly — the UI
 * writes its own (consistent) copy inline, matching how Code 7's equivalent already works
 * today. Flagged as a pre-existing gap, not introduced by this ticket; not fixed here to
 * avoid an unrelated behavior change to Code 7's already-shipped screen. */
export const CODE_10_OPENING =
  "EPFO gave you a reason, but it's not one this tool recognizes yet. That doesn't mean nothing is wrong on your end. Let's check the common causes yourself, one by one, the same way we would if EPFO had given no reason at all.";

export const CODE_10_ALL_CLEAN: ExplanationAndFix = {
  explanation:
    "The reason EPFO gave doesn't match a cause this tool recognizes, and none of the common causes turned up an issue either, as far as you can tell from your own records. EPFO's stated reason isn't specific enough to act on.",
  fix: "File a grievance through EPFiGMS asking EPFO to clarify the specific corrective action needed. Reference the exact remark EPFO showed you, and note that you've already ruled out the common causes on your own.",
};
