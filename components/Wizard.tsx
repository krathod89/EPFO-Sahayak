"use client";

import { useState, useRef, useEffect, useId } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  ChevronLeft,
  Copy,
  Check,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ExternalLink,
  Info,
  Shield,
  ArrowRight,
  CircleAlert,
  ThumbsUp,
  ThumbsDown,
} from "lucide-react";
import { CODE_DEFINITIONS } from "@/lib/rule-engine/codes";
import type {
  RuleCode,
  YesNoUnsure,
  SelfCheckAnswers,
  NameDobKycPageStatus,
  BankAccountType,
  EligibilityIssueType,
  WithdrawalIntent,
  DiagnosisEntry,
  DeadlineResult,
  GrievanceOutput,
  PostRejectionInput,
  PostRejectionFlowResult,
  ReadinessResult,
} from "@/lib/rule-engine";
import { SUGGESTED_CATEGORY_CAVEAT, hasBranch, MUTUALLY_EXCLUSIVE_CODES, DEADLINE_SUPPRESSED_CODES } from "@/lib/rule-engine";
import { dateInputError } from "@/lib/ui/date-validation";
import { getOrCreateSessionId } from "@/lib/ui/session";
import { trackClientEvent } from "@/lib/ui/mixpanel-client";
import { postDiagnose, DiagnoseApiError } from "@/lib/ui/api-client";
import { buildFeedbackEvent, type FeedbackContext, type FeedbackSentiment } from "@/lib/ui/feedback";

// ─── Types ──────────────────────────────────────────────────────────────────

type Screen =
  | "landing"
  | "selectCodes"
  | "code1Question"
  | "code3AccountTypeQuestion"
  | "code3Question"
  | "code8Question"
  | "code9Question"
  | "selfCheck"
  | "filingDate"
  | "kycAtFiling"
  | "diagnosisSummary"
  | "grievanceOutput"
  | "readinessResult";

/** Same shape as the backend's SelfCheckAnswers, but every field starts unanswered — the
 * backend's own type requires a real yes/no/unsure per field, which isn't true mid-form. */
interface SelfCheckAnswersState {
  doe_marked: YesNoUnsure | null;
  kyc_verified_not_just_approved: YesNoUnsure | null;
  name_dob_fathername_consistent: YesNoUnsure | null;
  eps_history_continuous: YesNoUnsure | null;
  old_claim_pending: YesNoUnsure | null;
}

interface WizardState {
  screen: Screen;
  history: Screen[];
  path: "A" | "B" | null;
  selectedCodes: RuleCode[];
  namedobKycPageStatus: NameDobKycPageStatus | null;
  bankAccountType: BankAccountType | null;
  bankKycSubmissionDate: string | null;
  eligibilityIssueType: EligibilityIssueType | null;
  withdrawalIntent: WithdrawalIntent | null;
  selfCheckAnswers: SelfCheckAnswersState;
  filingDate: string | null;
  kycCompleteAtFiling: boolean | null;
  uan: string;
  claimId: string;
}

const emptySelfCheck: SelfCheckAnswersState = {
  doe_marked: null,
  kyc_verified_not_just_approved: null,
  name_dob_fathername_consistent: null,
  eps_history_continuous: null,
  old_claim_pending: null,
};

const init: WizardState = {
  screen: "landing",
  history: [],
  path: null,
  selectedCodes: [],
  namedobKycPageStatus: null,
  bankAccountType: null,
  bankKycSubmissionDate: null,
  eligibilityIssueType: null,
  withdrawalIntent: null,
  selfCheckAnswers: { ...emptySelfCheck },
  filingDate: null,
  kycCompleteAtFiling: null,
  uan: "",
  claimId: "",
};

function isSelfCheckComplete(a: SelfCheckAnswersState): a is Record<keyof SelfCheckAnswersState, YesNoUnsure> {
  return Object.values(a).every((v) => v !== null);
}

// UI-only presentational copy — the citizen-facing option text/self-check questions aren't
// business logic (lib/rule-engine owns the diagnosis text itself), so this stays here the
// same way it always would for any form's option labels.

const RULE_CODE_SELECTION_TEXT: Record<RuleCode, string> = {
  CODE_1_NAME_DOB: "Name, date of birth, or father's name doesn't match across records",
  CODE_2_DOE: "Date of Exit not recorded by my former employer",
  CODE_3_BANK_KYC: "Bank KYC not verified, or bank details don't match",
  CODE_4_EPS: "EPS (pension) contribution shows zero or is missing for a period",
  CODE_5_OLD_CLAIM: "An earlier claim (Form 19 / 10C / 31) is still open in EPFO's system",
  CODE_6_APPROVED_NOT_CREDITED: "Claim was approved but the money never arrived in my account",
  CODE_7_NO_REASON: "I don't see a reason — EPFO didn't explain",
  CODE_8_ELIGIBILITY: "Rejected for not meeting a service-length rule (under 6 months, or over 9.5 years)",
  CODE_9_WRONG_FORM: "Rejected for filing the wrong form (Form 19 / 10C / 31)",
};

// diagnosisSummary's subtitle default ("This is not your fault...") is wrong for Code 8 and
// Code 9 — codes.ts's own CODE_8_BRANCHES/CODE_9_BRANCHES copy says the opposite (a genuine
// eligibility rule / a filing-choice issue), so the summary must not contradict it. A table
// here (rather than a growing per-code ternary chain) so a future such code is one new entry,
// not another nested branch — each entry's wording is intentionally distinct, not a shared
// skip, which is why this is a message table and not reused from DEADLINE_SUPPRESSED_CODES.
const DIAGNOSIS_SUMMARY_SUBTITLE_OVERRIDE: Partial<Record<RuleCode, string>> = {
  CODE_8_ELIGIBILITY: "This is a genuine eligibility rule, not a records mismatch. Here's the specific fix.",
  CODE_9_WRONG_FORM: "This is a form-selection issue, not a records mismatch. Here's the specific fix.",
};

// ExplCard's "not a records mismatch" badge, keyed by code (all of a code's branches share the
// same badge — ticket 16 established this for Code 8, ticket 17 extends it for Code 9). A table
// instead of one hand-added `entry.code === "CODE_N"` boolean per code, so a future such code is
// one new entry here rather than another copy-pasted boolean + JSX block.
const CODE_BADGE_TEXT: Partial<Record<RuleCode, string>> = {
  CODE_8_ELIGIBILITY: "Eligibility, not a mismatch",
  CODE_9_WRONG_FORM: "Wrong form, not a mismatch",
};

interface SelfCheckUiItem {
  key: keyof SelfCheckAnswersState;
  question: string;
  hint: string;
  passAnswer: "yes" | "no";
}

const SELF_CHECK_UI_ITEMS: SelfCheckUiItem[] = [
  {
    key: "doe_marked",
    question: "Has your former employer marked your Date of Exit in EPFO's system?",
    hint: "Check your EPFO member passbook or UAN portal under service history.",
    passAnswer: "yes",
  },
  {
    key: "kyc_verified_not_just_approved",
    question: "Is your KYC verified — not just approved, but verified?",
    hint: 'On the UAN portal, look for "Verified" status, not just "Approved".',
    passAnswer: "yes",
  },
  {
    key: "name_dob_fathername_consistent",
    question: "Does your name, date of birth, and father's name match exactly across Aadhaar, UAN, PAN, and bank records?",
    hint: "Even a small spelling difference counts as a mismatch.",
    passAnswer: "yes",
  },
  {
    key: "eps_history_continuous",
    question: "Is your EPS contribution history continuous, with no zero or missing periods?",
    hint: "Check your EPFO passbook for any periods showing ₹0 or blank EPS entries.",
    passAnswer: "yes",
  },
  {
    key: "old_claim_pending",
    question: "Do you have an old PF claim (Form 19 / 10C / 31) that is still pending?",
    hint: "Check your claim history on the UAN portal.",
    passAnswer: "no",
  },
];

const TIER_LABELS: Partial<Record<RuleCode, string>> = {
  CODE_2_DOE: "Eligibility blocker",
  CODE_5_OLD_CLAIM: "Eligibility blocker",
  CODE_3_BANK_KYC: "Payment blocker",
  CODE_1_NAME_DOB: "Payment blocker",
};

function fmtIsoDate(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

// ─── Persistence ────────────────────────────────────────────────────────────
// The app's own copy repeatedly sends the citizen away mid-flow to check the UAN portal,
// KYC status, or EPFO passbook — exactly the moment a tab switch, back-gesture, or dropped
// connection is likely. Without this, that trip wipes every answer. Wrapped in try/catch:
// private browsing or a full storage quota can throw, and losing the save silently beats
// crashing the wizard over it.

const STORAGE_KEY = "epfo-sahayak-wizard-state-v1";

const VALID_SCREENS = new Set<Screen>([
  "landing",
  "selectCodes",
  "code1Question",
  "code3AccountTypeQuestion",
  "code3Question",
  "code8Question",
  "code9Question",
  "selfCheck",
  "filingDate",
  "kycAtFiling",
  "diagnosisSummary",
  "grievanceOutput",
  "readinessResult",
]);

function isValidScreen(v: unknown): v is Screen {
  return typeof v === "string" && VALID_SCREENS.has(v as Screen);
}

function loadSavedState(): WizardState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    // A stale save from a renamed/removed Screen (or a hand-edited devtools value) must not
    // resolve to a screen the render tree can't match — every `if (s.screen === ...)`
    // branch would miss and fall through, a blank page with no Back/Start-over to escape.
    if (
      parsed &&
      typeof parsed === "object" &&
      isValidScreen((parsed as { screen?: unknown }).screen) &&
      Array.isArray((parsed as { history?: unknown }).history) &&
      (parsed as { history: unknown[] }).history.every(isValidScreen)
    ) {
      return parsed as WizardState;
    }
    return null;
  } catch {
    return null;
  }
}

function saveState(s: WizardState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch {
    // private browsing / quota exceeded — nothing to do, just don't crash
  }
}

function clearSavedState() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

// ─── Navigation helpers ─────────────────────────────────────────────────────

function nextScreen(current: Screen, s: WizardState): Screen {
  switch (current) {
    case "landing":
      return s.path === "A" ? "selectCodes" : "selfCheck";
    case "selectCodes":
      if (s.selectedCodes.includes("CODE_7_NO_REASON")) return "selfCheck";
      if (s.selectedCodes.includes("CODE_8_ELIGIBILITY")) return "code8Question";
      if (s.selectedCodes.includes("CODE_9_WRONG_FORM")) return "code9Question";
      if (s.selectedCodes.includes("CODE_1_NAME_DOB")) return "code1Question";
      if (s.selectedCodes.includes("CODE_3_BANK_KYC")) return "code3AccountTypeQuestion";
      return "filingDate";
    case "code1Question":
      if (s.selectedCodes.includes("CODE_3_BANK_KYC")) return "code3AccountTypeQuestion";
      return "filingDate";
    // A joint account (ticket 15) is a hard rejection independent of timing — skip the
    // submission-date question entirely rather than ask for a date that won't matter.
    case "code3AccountTypeQuestion":
      return s.bankAccountType === "joint" ? "filingDate" : "code3Question";
    case "code3Question":
      return "filingDate";
    // Ticket 16: still collects filing date / KYC-complete after Code 8, even though the
    // deadline check gets suppressed downstream for this code — keeps the rest of the flow
    // unchanged rather than branching the wizard's shared steps around one code.
    case "code8Question":
      return "filingDate";
    // Ticket 17: same reasoning as Code 8 — deadline check suppressed downstream, but the
    // wizard's shared filing-date/KYC steps stay unchanged for this code too.
    case "code9Question":
      return "filingDate";
    case "selfCheck":
      return s.path === "B" ? "readinessResult" : "filingDate";
    case "filingDate":
      return "kycAtFiling";
    case "kycAtFiling":
      return "diagnosisSummary";
    case "diagnosisSummary":
      return "grievanceOutput";
    default:
      return "landing";
  }
}

function push(s: WizardState, to: Screen): WizardState {
  return { ...s, history: [...s.history, s.screen], screen: to };
}

function pop(s: WizardState): WizardState {
  if (!s.history.length) return s;
  const last = s.history[s.history.length - 1]!;
  return { ...s, screen: last, history: s.history.slice(0, -1) };
}

// A directional slide replaces a hard cut between screens — forward moves slide in from the
// right, back moves slide in from the left, matching the wizard's own sense of
// progress/regress. `direction` is tracked in state since navigation isn't only via
// advance()/back(): the landing page's two path cards and the resume button jump straight
// to a screen too.
const screenVariants = {
  enter: (dir: number) => ({ opacity: 0, x: dir >= 0 ? 16 : -16 }),
  center: { opacity: 1, x: 0 },
  exit: (dir: number) => ({ opacity: 0, x: dir >= 0 ? -16 : 16 }),
};

// Staggers a list of result cards in on mount instead of popping in together — on
// diagnosisSummary/readinessResult this reinforces the fix-priority order the API already
// computes, rather than just decorating it.
const staggerListVariants = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } };
const staggerItemVariants = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } };

// ─── UI primitives ──────────────────────────────────────────────────────────

function cn(...c: (string | false | null | undefined)[]) {
  return c.filter(Boolean).join(" ");
}

function ProgressBar({ step, total }: { step: number; total: number }) {
  const pct = Math.round((step / total) * 100);
  return (
    <div className="h-1 w-full rounded-full bg-warm-200 overflow-hidden">
      <div className="h-full rounded-full bg-accent-500 transition-all duration-500" style={{ width: `${pct}%` }} />
    </div>
  );
}

function BackBtn({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 text-sm font-medium text-warm-600 hover:text-warm-700 transition-colors py-1 -ml-0.5 group"
    >
      <ChevronLeft className="size-4 group-hover:-translate-x-0.5 transition-transform" />
      Back
    </button>
  );
}

function RadioCard({
  label,
  sublabel,
  checked,
  onChange,
}: {
  label: string;
  sublabel?: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <button
      onClick={onChange}
      role="radio"
      aria-checked={checked}
      className={cn(
        "w-full text-left rounded-2xl border-2 px-4 py-4 transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 focus-visible:ring-offset-2",
        checked ? "border-accent-500 bg-accent-50 shadow-sm" : "border-warm-200 bg-white hover:border-warm-300 hover:shadow-sm"
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "mt-0.5 size-5 shrink-0 rounded-full border-2 flex items-center justify-center transition-all",
            checked ? "border-accent-500 bg-accent-500" : "border-warm-300 bg-white"
          )}
        >
          <AnimatePresence>
            {checked && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                className="flex items-center justify-center"
              >
                <Check className="size-3 text-white stroke-[3]" />
              </motion.span>
            )}
          </AnimatePresence>
        </div>
        <div>
          <p className={cn("text-sm font-medium leading-snug", checked ? "text-accent-700" : "text-warm-900")}>{label}</p>
          {sublabel && <p className="text-xs text-warm-600 mt-0.5 leading-relaxed">{sublabel}</p>}
        </div>
      </div>
    </button>
  );
}

function CheckboxCard({
  label,
  checked,
  onChange,
  exclusive,
  disabled,
  disabledReason,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
  exclusive?: boolean;
  disabled?: boolean;
  disabledReason?: string;
}) {
  const descId = useId();
  return (
    <button
      onClick={onChange}
      disabled={disabled}
      role={exclusive ? "radio" : "checkbox"}
      aria-checked={checked}
      aria-disabled={disabled || undefined}
      aria-describedby={disabled && disabledReason ? descId : undefined}
      className={cn(
        "w-full text-left rounded-2xl border-2 px-4 py-4 transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 focus-visible:ring-offset-2",
        checked ? "border-accent-500 bg-accent-50 shadow-sm" : "border-warm-200 bg-white hover:border-warm-300 hover:shadow-sm",
        disabled && "opacity-40 cursor-not-allowed"
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "mt-0.5 size-5 shrink-0 border-2 flex items-center justify-center transition-all",
            exclusive ? "rounded-full" : "rounded-md",
            checked ? "border-accent-500 bg-accent-500" : "border-warm-300 bg-white"
          )}
        >
          <AnimatePresence>
            {checked && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                className="flex items-center justify-center"
              >
                <Check className="size-3 text-white stroke-[3]" />
              </motion.span>
            )}
          </AnimatePresence>
        </div>
        <p className={cn("text-sm font-medium leading-snug", checked ? "text-accent-700" : "text-warm-900")}>{label}</p>
      </div>
      {disabled && disabledReason && (
        <span id={descId} className="sr-only">
          {disabledReason}
        </span>
      )}
    </button>
  );
}

function PrimaryBtn({
  children,
  onClick,
  disabled,
  full,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  full?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex items-center justify-center gap-2 rounded-xl px-6 py-3.5 font-semibold text-sm",
        "bg-accent-500 text-white hover:bg-accent-600 active:scale-[0.98]",
        "transition-all duration-150 shadow-sm",
        "disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 focus-visible:ring-offset-2",
        full && "w-full"
      )}
    >
      {children}
    </button>
  );
}

function Disclaimer() {
  return (
    <div className="flex gap-2.5 rounded-xl bg-warm-100 border border-warm-200 px-3.5 py-3 text-xs text-warm-600 leading-relaxed">
      <Shield className="size-4 shrink-0 mt-0.5 text-warm-600" />
      <span>
        EPFO Sahayak is not affiliated with EPFO or the Government of India. It does not access your EPFO account or any
        live data. Everything you type stays in your browser.
      </span>
    </div>
  );
}

function TriBtn({ answer, current, onChange }: { answer: YesNoUnsure; current: YesNoUnsure | null; onChange: (v: YesNoUnsure) => void }) {
  const labels: Record<YesNoUnsure, string> = { yes: "Yes", no: "No", unsure: "Not sure" };
  const active = current === answer;
  return (
    <button
      onClick={() => onChange(answer)}
      role="radio"
      aria-checked={active}
      className={cn(
        "flex-1 rounded-xl border-2 py-3 text-sm font-medium transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500",
        active ? "border-accent-500 bg-accent-50 text-accent-700" : "border-warm-200 bg-white text-warm-700 hover:border-warm-300"
      )}
    >
      {labels[answer]}
    </button>
  );
}

function Shell({
  children,
  step,
  totalSteps,
  onBack,
  label,
}: {
  children: React.ReactNode;
  step?: number;
  totalSteps?: number;
  onBack?: () => void;
  label?: string;
}) {
  return (
    <div className="min-h-full flex flex-col bg-warm-50">
      {step !== undefined && totalSteps !== undefined && (
        <div className="sticky top-0 z-10 bg-warm-50/90 backdrop-blur-sm border-b border-warm-100">
          <div className="max-w-xl mx-auto px-5 pt-3.5 pb-3">
            <ProgressBar step={step} total={totalSteps} />
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-warm-600 font-medium">{label ?? `Step ${step} of ${totalSteps}`}</span>
              {/* Brand mark: Inter, matching the landing hero — one typographic identity
                  independent of Fraunces on the actual question headings. */}
              <span className="text-xs font-bold text-warm-400 font-sans tracking-wide">Sahayak</span>
            </div>
          </div>
        </div>
      )}
      <div className="max-w-xl mx-auto w-full px-5 py-6 flex-1 flex flex-col">
        {onBack && (
          <div className="mb-5">
            <BackBtn onClick={onBack} />
          </div>
        )}
        {children}
      </div>
    </div>
  );
}

// ─── Explanation card ───────────────────────────────────────────────────────
// Renders one DiagnosisEntry from the API response. explanation/fix arrive as final,
// fully-substituted plain-language strings (band working-day counts, portal-sync-bug
// branch text, etc. are all resolved server-side) — this component is purely presentational.

interface EntryPriority {
  tier: "tier1" | "tier2" | "unranked";
  rank: number;
  isFirst: boolean;
}

function ExplCard({ entry, priority }: { entry: DiagnosisEntry; priority?: EntryPriority }) {
  const label = CODE_DEFINITIONS[entry.code].name;
  const tierLabel = TIER_LABELS[entry.code];
  const isPortalSyncBug = hasBranch(entry, "portal_sync_bug");
  const isJointAccount = hasBranch(entry, "joint_account");
  const codeBadgeText = CODE_BADGE_TEXT[entry.code];
  const band = entry.meta && "band" in entry.meta ? entry.meta.band : undefined;

  const tierColors: Record<string, string> = { tier1: "border-l-amber-400", tier2: "border-l-blue-400", unranked: "border-l-warm-300" };
  const tierText: Record<string, string> = {
    tier1: "text-amber-700 bg-amber-100",
    tier2: "text-blue-700 bg-blue-100",
    unranked: "text-warm-600 bg-warm-200",
  };

  const bandBoxClass =
    band === 3
      ? "bg-red-50 text-red-800 border border-red-100"
      : band === 2
        ? "bg-amber-50 text-amber-800 border border-amber-100"
        : band === 1
          ? "bg-green-50 text-green-800 border border-green-100"
          : "";

  return (
    <div
      className={cn(
        "rounded-2xl border border-warm-200 bg-white overflow-hidden shadow-sm",
        priority && `border-l-4 ${tierColors[priority.tier]}`
      )}
    >
      <div className="px-5 py-4 border-b border-warm-100">
        <div className="flex items-center gap-2 flex-wrap">
          {priority && priority.tier !== "unranked" && (
            <span className={cn("text-xs font-semibold px-2 py-0.5 rounded-full", tierText[priority.tier])}>
              {priority.isFirst ? "Fix this first" : `Fix ${priority.rank === 2 ? "next" : "after"}`}
            </span>
          )}
          {priority && priority.tier !== "unranked" && tierLabel && <span className="text-xs text-warm-600">{tierLabel}</span>}
          {isPortalSyncBug && (
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">Portal sync issue</span>
          )}
          {isJointAccount && (
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">Joint account</span>
          )}
          {codeBadgeText && (
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">{codeBadgeText}</span>
          )}
        </div>
        <h3 className="font-display font-semibold text-base text-warm-900 mt-1.5">{label}</h3>
      </div>

      <div className="px-5 py-4 space-y-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-warm-600 mb-2">What happened</p>
          {band !== undefined ? (
            <div className={cn("rounded-xl px-4 py-3 text-sm leading-relaxed", bandBoxClass)}>{entry.explanation}</div>
          ) : (
            <p className="text-sm text-warm-700 leading-relaxed">{entry.explanation}</p>
          )}
        </div>

        {entry.fix && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-warm-600 mb-2">What to do</p>
            <p className="text-sm text-warm-700 leading-relaxed">{entry.fix}</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Deadline display ───────────────────────────────────────────────────────

function DeadlineCard({ deadline, filingDate, kycComplete }: { deadline: DeadlineResult; filingDate: string; kycComplete: boolean }) {
  const missed = deadline.status === "MISSED";
  return (
    <div className={cn("rounded-2xl border-2 px-5 py-4", missed ? "border-red-200 bg-red-50" : "border-green-200 bg-green-50")}>
      <div className="flex items-center gap-2 mb-3">
        {missed ? <AlertTriangle className="size-5 text-red-500 shrink-0" /> : <Clock className="size-5 text-green-600 shrink-0" />}
        <h3 className={cn("font-semibold text-sm", missed ? "text-red-800" : "text-green-800")}>
          {missed ? "EPFO missed its own deadline" : "EPFO is still within its deadline"}
        </h3>
      </div>
      <p className={cn("text-sm leading-relaxed", missed ? "text-red-700" : "text-green-700")}>
        {missed
          ? `You filed your claim on ${fmtIsoDate(filingDate)}. Because your KYC was ${kycComplete ? "complete" : "not complete"} when you filed, EPFO had to settle within ${deadline.deadlineDays} days — by ${fmtIsoDate(deadline.deadlineDate)}. EPFO has missed this deadline by ${deadline.daysLate} day(s).`
          : `You filed your claim on ${fmtIsoDate(filingDate)}. EPFO must settle within ${deadline.deadlineDays} days — by ${fmtIsoDate(deadline.deadlineDate)}. EPFO still has ${deadline.daysRemaining} day(s) left.`}
      </p>
      {missed && (
        <div className="mt-3 rounded-xl bg-red-100 border border-red-200 px-3.5 py-3 text-xs text-red-800 leading-relaxed font-medium">
          You may be owed 12% penalty interest on your claim amount for this delay. Ask for this by name when you file your grievance.
        </div>
      )}
    </div>
  );
}

// ─── Copy block ─────────────────────────────────────────────────────────────

function CopyBlock({ text, onCopy }: { text: string; onCopy?: () => void }) {
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);

  function copyText() {
    navigator.clipboard.writeText(text).then(
      () => {
        setCopyFailed(false);
        setCopied(true);
        onCopy?.();
        setTimeout(() => setCopied(false), 2500);
      },
      () => {
        // Permission denied, insecure context, or no Clipboard API at all — tell the
        // citizen instead of failing silently, since they still need this text to file.
        setCopyFailed(true);
      }
    );
  }

  return (
    <motion.div
      // The grievance text is the product's actual deliverable — copying it successfully
      // deserves more than a label swap, since a citizen's eye may already be on the text
      // itself, not the small button.
      animate={{ backgroundColor: copied ? "#ecfdf5" : "#ffffff" }}
      transition={{ duration: 0.4 }}
      className="rounded-2xl border border-warm-200 overflow-hidden shadow-sm"
    >
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-warm-100 bg-warm-50">
        <span className="text-xs font-semibold text-warm-600 uppercase tracking-wider">Ready to paste</span>
        <button
          onClick={copyText}
          className={cn(
            "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-150",
            copied ? "bg-green-100 text-green-700" : "bg-accent-100 text-accent-600 hover:bg-accent-200"
          )}
        >
          {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
          {copied ? "Copied!" : "Copy"}
        </button>
        {/* Visually silent — the visible label already changes, but that alone isn't
            reliably announced by a screen reader. */}
        <span role="status" aria-live="polite" className="sr-only">
          {copied ? "Copied to clipboard" : ""}
        </span>
      </div>
      {copyFailed && (
        <p role="alert" className="px-4 pt-3 text-xs text-red-700 leading-relaxed">
          Couldn&apos;t copy automatically. Please select the text below and copy it by hand.
        </p>
      )}
      <pre className="px-4 py-4 text-xs text-warm-700 leading-relaxed whitespace-pre-wrap font-sans overflow-auto max-h-64">
        {text}
      </pre>
    </motion.div>
  );
}

function FeedbackWidget({
  sessionId,
  context,
  submitted,
  onSubmitted,
}: {
  sessionId: string;
  context: FeedbackContext;
  submitted: boolean;
  onSubmitted: () => void;
}) {
  const [sentiment, setSentiment] = useState<FeedbackSentiment | null>(null);
  const [comment, setComment] = useState("");

  // Placed at the end of each flow (US7, spec.md) — the only point the citizen has enough
  // context to judge whether the result actually helped, and it doesn't interrupt the
  // guided one-question-per-screen Q&A itself (PRD §7a item 3).
  function send() {
    if (!sentiment) return;
    trackClientEvent(sessionId, "feedback_submitted", { ...buildFeedbackEvent(sentiment, context, comment) });
    onSubmitted();
  }

  if (submitted) {
    return (
      <div role="status" className="rounded-xl bg-accent-50 border border-accent-100 px-4 py-3 text-sm text-accent-700 text-center">
        Thanks for letting us know.
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-warm-200 bg-white px-4 py-4 space-y-3">
      <p className="text-sm font-semibold text-warm-700">Was this helpful?</p>
      <div className="flex gap-2.5">
        <button
          onClick={() => setSentiment("like")}
          aria-pressed={sentiment === "like"}
          aria-label="Yes, this helped"
          className={cn(
            "flex items-center justify-center gap-2 flex-1 rounded-xl border-2 py-2.5 text-sm font-medium transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500",
            sentiment === "like" ? "border-accent-500 bg-accent-50 text-accent-700" : "border-warm-200 bg-white text-warm-700 hover:border-warm-300"
          )}
        >
          <ThumbsUp className="size-4" /> Yes
        </button>
        <button
          onClick={() => setSentiment("dislike")}
          aria-pressed={sentiment === "dislike"}
          aria-label="No, this didn't help"
          className={cn(
            "flex items-center justify-center gap-2 flex-1 rounded-xl border-2 py-2.5 text-sm font-medium transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500",
            sentiment === "dislike" ? "border-accent-500 bg-accent-50 text-accent-700" : "border-warm-200 bg-white text-warm-700 hover:border-warm-300"
          )}
        >
          <ThumbsDown className="size-4" /> No
        </button>
      </div>
      {sentiment && (
        <div className="space-y-2">
          <label htmlFor="feedback-comment" className="block text-xs text-warm-500">
            Anything else? (optional — please don&apos;t include your UAN, claim ID, or other personal details)
          </label>
          <textarea
            id="feedback-comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={2}
            maxLength={500}
            className="w-full rounded-xl border-2 border-warm-200 bg-warm-50 px-3.5 py-2.5 text-sm text-warm-900 placeholder:text-warm-400 focus:outline-none focus:border-accent-500 transition-colors resize-none"
            placeholder="Optional comment"
          />
          <button
            onClick={send}
            className="w-full rounded-xl bg-accent-500 hover:bg-accent-600 text-white text-sm font-semibold py-2.5 transition-colors"
          >
            Send feedback
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Main Wizard ────────────────────────────────────────────────────────────

export default function Wizard() {
  const [s, setS] = useState<WizardState>(init);
  const [resumableState, setResumableState] = useState<WizardState | null>(null);
  const [direction, setDirection] = useState(1);
  // "Other situations" (no-reason-given / approved-not-credited) starts collapsed on the
  // rejection-reason screen — keeps the highest-anxiety first choice under 4 visible
  // options instead of 7.
  const [otherReasonsOpen, setOtherReasonsOpen] = useState(false);

  // One id per browser session — ties the API's server-computed analytics events together
  // and doubles as Mixpanel's client-side distinct_id. Generated lazily on first render.
  const [sessionId] = useState<string>(() => (typeof window === "undefined" ? "" : getOrCreateSessionId(localStorage)));

  const [postRejectionResult, setPostRejectionResult] = useState<PostRejectionFlowResult | null>(null);
  const [readinessApiResult, setReadinessApiResult] = useState<ReadinessResult | null>(null);
  const [apiPending, setApiPending] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // Lives on the Wizard, not inside FeedbackWidget itself, because the widget's render guard
  // (`grievance.ready`, `result`) can flip false-then-true again within the same visit (e.g.
  // editing the UAN back out and back in) — that would unmount/remount FeedbackWidget and
  // forget a submission already sent, letting the same context fire feedback_submitted twice.
  const [feedbackSubmitted, setFeedbackSubmitted] = useState<Record<FeedbackContext, boolean>>({
    grievance_output: false,
    readiness_result: false,
  });

  // Each fetch effect below tracks its own "last input actually fetched" key and a
  // monotonic request id. The key check skips re-fetching when nothing relevant changed
  // (e.g. re-entering a screen); the request id lets a response that's been superseded by
  // a newer request (the citizen kept typing) detect that and discard itself instead of
  // clobbering fresher state — no in-flight fetch is ever cancelled, but a stale one always
  // loses the race.
  const postRejectionRequestIdRef = useRef(0);
  const lastPostRejectionKeyRef = useRef<string | null>(null);
  const readinessRequestIdRef = useRef(0);
  const lastReadinessKeyRef = useRef<string | null>(null);

  // Offer to resume once, on first mount, if a prior session left off mid-flow.
  useEffect(() => {
    const saved = loadSavedState();
    if (saved && saved.screen !== "landing") {
      setResumableState(saved);
    }
    if (sessionId) trackClientEvent(sessionId, "session_started", {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Without this, "Continue" routinely lands the next (often shorter) screen at whatever
  // scroll offset the previous, longer screen was left at — an empty viewport that reads
  // as broken until the user manually scrolls up.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [s.screen]);

  // Persist every change once the citizen has actually started a path; clear once they
  // reach a finished/terminal screen, since there's nothing left to resume.
  useEffect(() => {
    if (s.screen === "landing") return;
    if (s.screen === "grievanceOutput" || s.screen === "readinessResult") {
      clearSavedState();
      return;
    }
    saveState(s);
  }, [s]);

  function buildPostRejectionInput(uan: string, claimId: string): PostRejectionInput & { session_id: string } {
    const payload: PostRejectionInput & { session_id: string } = {
      entry_point: "post_rejection" as const,
      session_id: sessionId,
      uan: uan || undefined,
      claim_id: claimId || undefined,
      rejection_codes_selected: s.selectedCodes,
      filing_date: s.filingDate!,
      kyc_complete_at_filing: s.kycCompleteAtFiling!,
      namedob_kyc_page_status: s.selectedCodes.includes("CODE_1_NAME_DOB") ? s.namedobKycPageStatus ?? undefined : undefined,
      bank_account_type: s.selectedCodes.includes("CODE_3_BANK_KYC") ? s.bankAccountType ?? undefined : undefined,
      // No submission date needed for a joint account — a hard rejection independent of timing.
      bank_kyc_submission_date:
        s.selectedCodes.includes("CODE_3_BANK_KYC") && s.bankAccountType !== "joint" ? s.bankKycSubmissionDate ?? undefined : undefined,
      eligibility_issue_type: s.selectedCodes.includes("CODE_8_ELIGIBILITY") ? s.eligibilityIssueType ?? undefined : undefined,
      withdrawal_intent: s.selectedCodes.includes("CODE_9_WRONG_FORM") ? s.withdrawalIntent ?? undefined : undefined,
      self_check_answers:
        s.selectedCodes.includes("CODE_7_NO_REASON") && isSelfCheckComplete(s.selfCheckAnswers)
          ? (s.selfCheckAnswers as SelfCheckAnswers)
          : undefined,
    };
    return payload;
  }

  // Fetches the diagnosis (entries/priority/deadline/grievance) once all required fields
  // are collected. Re-fires automatically whenever entering diagnosisSummary without a
  // result yet (a fresh forward navigation, or a resumed session that lost the in-memory
  // result on reload — the API response itself is never persisted to localStorage) and
  // whenever uan/claimId change while already on grievanceOutput, since the backend only
  // returns a ready-to-file grievance once both are filled in.
  useEffect(() => {
    if (s.path !== "A") return;
    if (s.screen !== "diagnosisSummary" && s.screen !== "grievanceOutput") return;
    if (!s.filingDate || s.kycCompleteAtFiling === null) return;

    const key = JSON.stringify([s.uan, s.claimId, s.selectedCodes, s.filingDate, s.kycCompleteAtFiling, s.namedobKycPageStatus, s.bankAccountType, s.bankKycSubmissionDate, s.eligibilityIssueType, s.withdrawalIntent, s.selfCheckAnswers]);
    if (key === lastPostRejectionKeyRef.current) return; // nothing this fetch depends on actually changed

    const myRequestId = ++postRejectionRequestIdRef.current;
    const t = setTimeout(() => {
      setApiPending(true);
      setApiError(null);
      postDiagnose(buildPostRejectionInput(s.uan, s.claimId))
        .then((result) => {
          if (postRejectionRequestIdRef.current !== myRequestId) return; // superseded by a newer keystroke
          lastPostRejectionKeyRef.current = key;
          setPostRejectionResult(result);
        })
        .catch((err) => {
          if (postRejectionRequestIdRef.current !== myRequestId) return;
          setApiError(err instanceof DiagnoseApiError ? err.message : "Something went wrong. Please try again.");
        })
        .finally(() => {
          if (postRejectionRequestIdRef.current === myRequestId) setApiPending(false);
        });
    }, s.screen === "grievanceOutput" ? 500 : 0); // debounce only the live-as-you-type refresh on grievanceOutput

    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s.screen, s.uan, s.claimId]);

  useEffect(() => {
    if (s.path !== "B") return;
    if (s.screen !== "readinessResult") return;
    if (!isSelfCheckComplete(s.selfCheckAnswers)) return;

    const key = JSON.stringify([s.uan, s.claimId, s.selfCheckAnswers]);
    if (key === lastReadinessKeyRef.current) return; // nothing this fetch depends on actually changed (e.g. re-entering the screen unchanged)

    const myRequestId = ++readinessRequestIdRef.current;
    setApiPending(true);
    setApiError(null);
    postDiagnose({
      entry_point: "pre_filing",
      session_id: sessionId,
      uan: s.uan || undefined,
      claim_id: s.claimId || undefined,
      self_check_answers: s.selfCheckAnswers as SelfCheckAnswers,
    })
      .then((result) => {
        if (readinessRequestIdRef.current !== myRequestId) return;
        lastReadinessKeyRef.current = key;
        setReadinessApiResult(result);
      })
      .catch((err) => {
        if (readinessRequestIdRef.current !== myRequestId) return;
        setApiError(err instanceof DiagnoseApiError ? err.message : "Something went wrong. Please try again.");
      })
      .finally(() => {
        if (readinessRequestIdRef.current === myRequestId) setApiPending(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s.screen, s.uan, s.claimId, s.selfCheckAnswers]);

  function advance() {
    const to = nextScreen(s.screen, s);
    setDirection(1);
    setS(push(s, to));
  }

  function back() {
    setDirection(-1);
    setS(pop(s));
  }

  function startOver() {
    clearSavedState();
    setResumableState(null);
    setDirection(-1);
    setPostRejectionResult(null);
    setReadinessApiResult(null);
    lastPostRejectionKeyRef.current = null;
    lastReadinessKeyRef.current = null;
    setFeedbackSubmitted({ grievance_output: false, readiness_result: false });
    setS(init);
  }

  let content: React.ReactNode = null;

  // ── Landing ────────────────────────────────────────────────────────────

  if (s.screen === "landing") {
    const landingBody = (
      <>
        <div className="animate-slide-up">
          <div className="inline-flex items-center gap-2 bg-accent-500 text-white px-3 py-1 rounded-full text-xs font-semibold mb-5 tracking-wide">
            <Shield className="size-3" />
            Free · No account needed
          </div>
          <h1 className="font-sans text-4xl font-extrabold text-warm-900 leading-tight tracking-tighter">
            EPFO
            <br />
            Sahayak
          </h1>
          <p className="text-warm-600 text-lg mt-3 leading-relaxed">
            Turn a confusing PF rejection into a clear, actionable plan — or check if you're ready to file.
          </p>
        </div>

        {resumableState && (
          <div className="animate-slide-up flex items-center justify-between gap-3 rounded-2xl border-2 border-accent-200 bg-accent-50 px-4 py-3.5">
            <div>
              <p className="text-sm font-semibold text-accent-700">Continue where you left off?</p>
              <p className="text-xs text-accent-600 mt-0.5">Your answers from last time are still here.</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => {
                  clearSavedState();
                  setResumableState(null);
                }}
                className="text-xs font-medium text-warm-600 hover:text-warm-700 px-2 py-1.5 transition-colors"
              >
                Start fresh
              </button>
              <button
                onClick={() => {
                  setDirection(1);
                  setS(resumableState);
                  setResumableState(null);
                }}
                className="rounded-lg bg-accent-500 text-white text-xs font-semibold px-3 py-1.5 hover:bg-accent-600 transition-colors"
              >
                Resume
              </button>
            </div>
          </div>
        )}

        <div className="space-y-3 animate-slide-up" style={{ animationDelay: "0.06s" }}>
          <button
            onClick={() => {
              trackClientEvent(sessionId, "entry_point_selected", { entry_point: "post_rejection" });
              setDirection(1);
              setS(push({ ...s, path: "A" }, "selectCodes"));
            }}
            className="w-full group rounded-2xl border-2 border-warm-200 bg-white hover:border-accent-500 hover:shadow-md transition-all duration-200 text-left px-5 py-5 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="size-8 rounded-xl bg-red-100 flex items-center justify-center">
                    <CircleAlert className="size-4 text-red-500" />
                  </span>
                </div>
                <h2 className="font-sans font-bold text-xl text-warm-900 leading-snug tracking-tight">My claim was rejected</h2>
                <p className="text-sm text-warm-600 mt-1 leading-relaxed">
                  Decode the rejection reason, find out who's at fault, check if EPFO missed its own deadline, and get grievance
                  text ready to paste.
                </p>
              </div>
              <ArrowRight className="size-5 text-warm-400 shrink-0 mt-1 group-hover:text-accent-500 transition-colors" />
            </div>
          </button>

          <button
            onClick={() => {
              trackClientEvent(sessionId, "entry_point_selected", { entry_point: "pre_filing" });
              setDirection(1);
              setS(push({ ...s, path: "B" }, "selfCheck"));
            }}
            className="w-full group rounded-2xl border-2 border-warm-200 bg-white hover:border-accent-500 hover:shadow-md transition-all duration-200 text-left px-5 py-5 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="size-8 rounded-xl bg-green-100 flex items-center justify-center">
                    <CheckCircle2 className="size-4 text-green-600" />
                  </span>
                </div>
                <h2 className="font-sans font-bold text-xl text-warm-900 leading-snug tracking-tight">I haven't filed yet</h2>
                <p className="text-sm text-warm-600 mt-1 leading-relaxed">
                  Check five common blockers before you file — so your claim doesn't come back rejected.
                </p>
              </div>
              <ArrowRight className="size-5 text-warm-400 shrink-0 mt-1 group-hover:text-accent-500 transition-colors" />
            </div>
          </button>
        </div>

        <div className="animate-slide-up" style={{ animationDelay: "0.1s" }}>
          <Disclaimer />
        </div>
      </>
    );

    content = (
      <div className="min-h-full flex flex-col bg-warm-50">
        <div className="max-w-5xl mx-auto w-full px-5 py-10 grid lg:grid-cols-2 gap-12 lg:items-center">
          <div className="max-w-xl w-full flex flex-col gap-8">{landingBody}</div>
          <div className="hidden lg:flex flex-col gap-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-warm-600">How it works</p>
            <div className="space-y-5">
              {[
                { title: "Tell us what happened", body: "Pick the rejection reason EPFO showed you — or tell us you haven't filed yet." },
                { title: "Answer a few questions", body: "About your filing date and KYC status. Takes under two minutes." },
                { title: "Get your fix", body: "A plain-language diagnosis, a deadline check, and grievance text ready to paste." },
              ].map((step, i) => (
                <div key={step.title} className="flex gap-3">
                  <span className="shrink-0 size-8 rounded-full bg-white border-2 border-accent-200 text-accent-600 font-bold text-sm flex items-center justify-center">
                    {i + 1}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-warm-900">{step.title}</p>
                    <p className="text-sm text-warm-600 mt-0.5 leading-relaxed">{step.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Select codes (Path A) ─────────────────────────────────────────────

  if (s.screen === "selectCodes") {
    const hasExclusive = s.selectedCodes.some((c) => MUTUALLY_EXCLUSIVE_CODES.includes(c));
    const hasOtherThanExclusive = s.selectedCodes.some((c) => !MUTUALLY_EXCLUSIVE_CODES.includes(c));

    function toggleCode(id: RuleCode) {
      const isExclusive = MUTUALLY_EXCLUSIVE_CODES.includes(id);
      setS((prev) => {
        const has = prev.selectedCodes.includes(id);
        if (has) return { ...prev, selectedCodes: prev.selectedCodes.filter((c) => c !== id) };
        if (isExclusive) return { ...prev, selectedCodes: [id] };
        return {
          ...prev,
          selectedCodes: [...prev.selectedCodes.filter((c) => !MUTUALLY_EXCLUSIVE_CODES.includes(c)), id],
        };
      });
    }

    const commonIds: RuleCode[] = ["CODE_1_NAME_DOB", "CODE_2_DOE", "CODE_3_BANK_KYC", "CODE_4_EPS", "CODE_5_OLD_CLAIM"];
    const otherIds: RuleCode[] = ["CODE_7_NO_REASON", "CODE_6_APPROVED_NOT_CREDITED", "CODE_8_ELIGIBILITY", "CODE_9_WRONG_FORM"];

    function renderCard(id: RuleCode) {
      const checked = s.selectedCodes.includes(id);
      const isExclusive = MUTUALLY_EXCLUSIVE_CODES.includes(id);
      const disabled = (!checked && isExclusive && hasOtherThanExclusive) || (!checked && !isExclusive && hasExclusive);
      const disabledReason = !checked && isExclusive && hasOtherThanExclusive
        ? "Not available — deselect your other reason(s) first, since this one can't be combined."
        : !checked && !isExclusive && hasExclusive
          ? "Not available — the reason you picked must be used on its own."
          : undefined;

      return (
        <CheckboxCard
          key={id}
          label={RULE_CODE_SELECTION_TEXT[id]}
          checked={checked}
          onChange={() => toggleCode(id)}
          exclusive={isExclusive}
          disabled={disabled}
          disabledReason={disabledReason}
        />
      );
    }

    content = (
      <Shell step={1} totalSteps={5} onBack={back} label="Rejection reason">
        <div className="space-y-5">
          <div>
            <h2 className="font-display font-bold text-2xl text-warm-900 leading-tight">What did EPFO's message say?</h2>
            <p className="text-warm-600 text-sm mt-2 leading-relaxed">Select all that apply. If more than one reason was shown, select each one.</p>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-warm-600 mb-2">Common reasons</p>
            <div className="space-y-2" role="group" aria-label="Common reasons">
              {commonIds.map(renderCard)}
            </div>
          </div>

          {/* Collapsed by default — keeps the first, highest-anxiety choice in this flow
              under 4 visible options instead of 7. Forced open if a reason from this group
              is already selected (e.g. via Back), so state never silently hides what's
              actually chosen. */}
          {otherReasonsOpen || hasExclusive ? (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-warm-600 mb-2">Other situations</p>
              <div className="space-y-2" role="group" aria-label="Other situations">
                {otherIds.map(renderCard)}
              </div>
            </div>
          ) : (
            <button
              onClick={() => setOtherReasonsOpen(true)}
              className="text-sm font-medium text-accent-600 hover:text-accent-700 transition-colors text-left"
            >
              Don&apos;t see your reason? Show more options
            </button>
          )}

          {s.selectedCodes.length > 0 && (
            <p className="text-xs text-warm-600">
              {hasExclusive ? "This reason cannot be combined with others." : `${s.selectedCodes.length} reason${s.selectedCodes.length > 1 ? "s" : ""} selected.`}
            </p>
          )}

          <PrimaryBtn full disabled={s.selectedCodes.length === 0} onClick={advance}>
            Continue <ArrowRight className="size-4" />
          </PrimaryBtn>
        </div>
      </Shell>
    );
  }

  // ── Code 1 branch question ─────────────────────────────────────────────

  if (s.screen === "code1Question") {
    content = (
      <Shell step={2} totalSteps={5} onBack={back} label="Name / DOB mismatch">
        <div className="space-y-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-accent-500 mb-2">Name / DOB mismatch</p>
            <h2 className="font-display font-bold text-2xl text-warm-900 leading-tight">
              Does your EPFO KYC page already show this as &quot;Approved and Verified&quot;?
            </h2>
            <p className="text-warm-600 text-sm mt-2 leading-relaxed">
              Check the KYC section on the UAN member portal. Look for the status next to your name or date of birth.
            </p>
          </div>

          <div className="space-y-2" role="radiogroup" aria-label="Does your EPFO KYC page already show this as Approved and Verified?">
            {(["approved_and_verified", "not_verified", "unsure"] as const).map((v) => (
              <RadioCard
                key={v}
                label={
                  v === "approved_and_verified"
                    ? "Yes — it says Approved and Verified"
                    : v === "not_verified"
                      ? "No — it does not show Verified"
                      : "I'm not sure / I can't find it"
                }
                checked={s.namedobKycPageStatus === v}
                onChange={() => setS({ ...s, namedobKycPageStatus: v })}
              />
            ))}
          </div>

          <PrimaryBtn full disabled={!s.namedobKycPageStatus} onClick={advance}>
            Continue <ArrowRight className="size-4" />
          </PrimaryBtn>
        </div>
      </Shell>
    );
  }

  // ── Code 3 account-type question (ticket 15) ───────────────────────────
  // Asked before the submission-date question, one decision per screen — a joint account is
  // a hard rejection independent of timing, so it needs to be ruled out first, not folded
  // into the same screen as the date question.

  if (s.screen === "code3AccountTypeQuestion") {
    content = (
      <Shell step={2} totalSteps={5} onBack={back} label="Bank KYC">
        <div className="space-y-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-accent-500 mb-2">Bank KYC not verified</p>
            <h2 className="font-display font-bold text-2xl text-warm-900 leading-tight">Is the bank account in your name only?</h2>
            <p className="text-warm-600 text-sm mt-2 leading-relaxed">
              EPFO only pays into an account held solely by you. A joint account — one with more than one holder, even if you&apos;re
              one of them — is rejected outright, regardless of KYC status.
            </p>
          </div>

          <div className="space-y-2" role="radiogroup" aria-label="Is the bank account in your name only?">
            {(["individual", "joint", "unsure"] as const).map((v) => (
              <RadioCard
                key={v}
                label={
                  v === "individual"
                    ? "Yes — it's in my name only"
                    : v === "joint"
                      ? "No — it's a joint account"
                      : "I'm not sure"
                }
                checked={s.bankAccountType === v}
                onChange={() => setS({ ...s, bankAccountType: v })}
              />
            ))}
          </div>

          <PrimaryBtn full disabled={!s.bankAccountType} onClick={advance}>
            Continue <ArrowRight className="size-4" />
          </PrimaryBtn>
        </div>
      </Shell>
    );
  }

  // ── Code 3 branch question ─────────────────────────────────────────────

  if (s.screen === "code3Question") {
    const bankKycDateError = dateInputError(s.bankKycSubmissionDate);
    content = (
      <Shell step={2} totalSteps={5} onBack={back} label="Bank KYC">
        <div className="space-y-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-accent-500 mb-2">Bank KYC not verified</p>
            <h2 className="font-display font-bold text-2xl text-warm-900 leading-tight">When did you submit your bank KYC?</h2>
            <p className="text-warm-600 text-sm mt-2 leading-relaxed">
              This is the date your bank details were submitted for verification — either by you on the UAN portal, or entered by
              your employer on your behalf. Verification itself is done by your bank and NPCI, not your employer. An approximate
              date is fine.
            </p>
          </div>

          <div>
            <label htmlFor="bank-kyc-date" className="block text-sm font-medium text-warm-700 mb-2">
              Submission date
            </label>
            <input
              id="bank-kyc-date"
              type="date"
              value={s.bankKycSubmissionDate ?? ""}
              max={new Date().toISOString().split("T")[0]}
              onChange={(e) => setS({ ...s, bankKycSubmissionDate: e.target.value || null })}
              aria-invalid={!!bankKycDateError}
              aria-describedby={bankKycDateError ? "bank-kyc-date-error" : undefined}
              className={cn(
                "w-full rounded-xl border-2 bg-white px-4 py-3 text-sm text-warm-900 focus:outline-none transition-colors",
                bankKycDateError ? "border-red-300 focus:border-red-500" : "border-warm-200 focus:border-accent-500"
              )}
            />
            {bankKycDateError && (
              <p id="bank-kyc-date-error" className="text-xs text-red-600 mt-1.5">
                {bankKycDateError}
              </p>
            )}
          </div>

          <PrimaryBtn full disabled={!s.bankKycSubmissionDate || !!bankKycDateError} onClick={advance}>
            Continue <ArrowRight className="size-4" />
          </PrimaryBtn>
        </div>
      </Shell>
    );
  }

  // ── Code 8 eligibility question (ticket 16) ────────────────────────────
  // "Unsure" deliberately gets its own honest branch downstream, rather than defaulting to
  // either threshold — the two known eligibility rules have opposite remedies (wait, vs.
  // switch claim type entirely), so guessing wrong here would send the citizen down the
  // wrong fix.

  if (s.screen === "code8Question") {
    content = (
      <Shell step={2} totalSteps={5} onBack={back} label="Eligibility">
        <div className="space-y-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-accent-500 mb-2">Not eligible yet, or eligible for pension instead</p>
            <h2 className="font-display font-bold text-2xl text-warm-900 leading-tight">What does EPFO&apos;s remark say about your service length?</h2>
            <p className="text-warm-600 text-sm mt-2 leading-relaxed">
              This determines the fix — the two rules below have different remedies. Check your service history on the UAN portal
              if you&apos;re not sure.
            </p>
          </div>

          <div className="space-y-2" role="radiogroup" aria-label="What does EPFO's remark say about your service length?">
            {(["under_six_months", "over_nine_half_years", "unsure"] as const).map((v) => (
              <RadioCard
                key={v}
                label={
                  v === "under_six_months"
                    ? "Under 6 months of service (Form 10C eligibility)"
                    : v === "over_nine_half_years"
                      ? "Over 9.5 years of service (pension instead of lump sum)"
                      : "I'm not sure which one applies"
                }
                checked={s.eligibilityIssueType === v}
                onChange={() => setS({ ...s, eligibilityIssueType: v })}
              />
            ))}
          </div>

          <PrimaryBtn full disabled={!s.eligibilityIssueType} onClick={advance}>
            Continue <ArrowRight className="size-4" />
          </PrimaryBtn>
        </div>
      </Shell>
    );
  }

  // ── Code 9 wrong-form question (ticket 17) ──────────────────────────────
  // Same "unsure gets its own honest branch" pattern as Code 8 — the three forms have
  // different remedies, and many citizens don't clearly distinguish "my PF" from "my
  // EPS/pension," so guessing wrong here would recommend the wrong form.

  if (s.screen === "code9Question") {
    content = (
      <Shell step={2} totalSteps={5} onBack={back} label="Wrong form">
        <div className="space-y-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-accent-500 mb-2">Wrong claim form filed</p>
            <h2 className="font-display font-bold text-2xl text-warm-900 leading-tight">What are you actually trying to withdraw?</h2>
            <p className="text-warm-600 text-sm mt-2 leading-relaxed">
              This determines which form actually fits your situation — Form 19, 10C, and 31 serve different purposes.
            </p>
          </div>

          <div className="space-y-2" role="radiogroup" aria-label="What are you actually trying to withdraw?">
            {(["full_settlement", "pension_only", "advance", "unsure"] as const).map((v) => (
              <RadioCard
                key={v}
                label={
                  v === "full_settlement"
                    ? "My full PF balance, since I've left this job (Form 19)"
                    : v === "pension_only"
                      ? "Only my pension (EPS) balance (Form 10C)"
                      : v === "advance"
                        ? "An advance while still employed (Form 31)"
                        : "I'm not sure which one fits"
                }
                checked={s.withdrawalIntent === v}
                onChange={() => setS({ ...s, withdrawalIntent: v })}
              />
            ))}
          </div>

          <PrimaryBtn full disabled={!s.withdrawalIntent} onClick={advance}>
            Continue <ArrowRight className="size-4" />
          </PrimaryBtn>
        </div>
      </Shell>
    );
  }

  // ── Self-check (Path B and Code 7) ────────────────────────────────────

  if (s.screen === "selfCheck") {
    const isPathB = s.path === "B";
    const allAnswered = isSelfCheckComplete(s.selfCheckAnswers);

    content = (
      <Shell step={isPathB ? 1 : 2} totalSteps={isPathB ? 2 : 5} onBack={back} label={isPathB ? "Readiness check" : "Self-check"}>
        <div className="space-y-6">
          <div>
            {!isPathB && <p className="text-xs font-semibold uppercase tracking-wider text-accent-500 mb-2">No reason given</p>}
            <h2 className="font-display font-bold text-2xl text-warm-900 leading-tight">
              {isPathB ? "Let's check five common blockers" : "EPFO didn't explain — let's check ourselves"}
            </h2>
            <p className="text-warm-600 text-sm mt-2 leading-relaxed">
              {isPathB
                ? 'Answer honestly. An "unsure" answer will flag that item for double-checking.'
                : "We'll go through the most common reasons. Answer as best you can."}
            </p>
          </div>

          <div className="space-y-5">
            {SELF_CHECK_UI_ITEMS.map((item) => {
              const current = s.selfCheckAnswers[item.key];
              return (
                <div key={item.key} className="rounded-2xl border border-warm-200 bg-white px-4 py-4 space-y-3">
                  <p className="text-sm font-medium text-warm-800 leading-snug">{item.question}</p>
                  <p className="text-xs text-warm-600 leading-relaxed">{item.hint}</p>
                  <div className="flex gap-2" role="radiogroup" aria-label={item.question}>
                    {(["yes", "no", "unsure"] as YesNoUnsure[]).map((a) => (
                      <TriBtn
                        key={a}
                        answer={a}
                        current={current}
                        onChange={(v) => setS({ ...s, selfCheckAnswers: { ...s.selfCheckAnswers, [item.key]: v } })}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          <PrimaryBtn full disabled={!allAnswered} onClick={advance}>
            {isPathB ? "See my readiness result" : "Continue"}
            <ArrowRight className="size-4" />
          </PrimaryBtn>
        </div>
      </Shell>
    );
  }

  // ── Filing date ─────────────────────────────────────────────────────────

  if (s.screen === "filingDate") {
    const filingDateError = dateInputError(s.filingDate);
    // Ticket 16 (Code 8) / ticket 17 (Code 9): the deadline/penalty check is deliberately
    // suppressed for these codes (the claim was never going to be settled regardless of the
    // clock) — the copy below must not promise a check that will silently never appear on
    // diagnosisSummary. Driven by the same shared DEADLINE_SUPPRESSED_CODES list index.ts
    // uses, so a future suppressed code doesn't need a 3rd hand-added check here.
    const suppressesDeadline = s.selectedCodes.some((c) => DEADLINE_SUPPRESSED_CODES.includes(c));
    content = (
      <Shell step={3} totalSteps={5} onBack={back} label="Filing date">
        <div className="space-y-5">
          <div>
            <h2 className="font-display font-bold text-2xl text-warm-900 leading-tight">When did you file this claim?</h2>
            <p className="text-warm-600 text-sm mt-2 leading-relaxed">
              {suppressesDeadline
                ? "EPFO's settlement deadline and penalty rule don't apply here — we still ask for your filing date to keep your case details complete."
                : "We'll check whether EPFO has already missed its own settlement deadline, and whether you may be owed a 12% penalty."}
            </p>
          </div>

          <div>
            <label htmlFor="filing-date" className="block text-sm font-medium text-warm-700 mb-2">
              Filing date
            </label>
            <input
              id="filing-date"
              type="date"
              value={s.filingDate ?? ""}
              max={new Date().toISOString().split("T")[0]}
              onChange={(e) => setS({ ...s, filingDate: e.target.value || null })}
              aria-invalid={!!filingDateError}
              aria-describedby={filingDateError ? "filing-date-error" : undefined}
              className={cn(
                "w-full rounded-xl border-2 bg-white px-4 py-3 text-sm text-warm-900 focus:outline-none transition-colors",
                filingDateError ? "border-red-300 focus:border-red-500" : "border-warm-200 focus:border-accent-500"
              )}
            />
            {filingDateError && (
              <p id="filing-date-error" className="text-xs text-red-600 mt-1.5">
                {filingDateError}
              </p>
            )}
          </div>

          {!suppressesDeadline && (
            <div className="rounded-xl bg-warm-100 border border-warm-200 px-3.5 py-3 flex gap-2.5 text-xs text-warm-600 leading-relaxed">
              <Info className="size-4 shrink-0 mt-0.5 text-warm-400" />
              <span>
                EPFO must settle your claim within 3 days (if KYC was complete when you filed) or 20 days (otherwise). Missing this
                deadline entitles you to 12% penalty interest.
              </span>
            </div>
          )}

          <PrimaryBtn full disabled={!s.filingDate || !!filingDateError} onClick={advance}>
            Continue <ArrowRight className="size-4" />
          </PrimaryBtn>
        </div>
      </Shell>
    );
  }

  // ── KYC at filing ───────────────────────────────────────────────────────

  if (s.screen === "kycAtFiling") {
    // Ticket 16 (Code 8) / ticket 17 (Code 9): same suppression as filingDate — these
    // sublabels state a deadline that doesn't apply to these codes (deliberately suppressed,
    // see index.ts), so they'd otherwise repeat the exact bug shape already fixed on the
    // filingDate and diagnosisSummary screens.
    const suppressesDeadline = s.selectedCodes.some((c) => DEADLINE_SUPPRESSED_CODES.includes(c));
    content = (
      <Shell step={3} totalSteps={5} onBack={back} label="Filing date">
        <div className="space-y-5">
          <div>
            <h2 className="font-display font-bold text-2xl text-warm-900 leading-tight">Was your KYC complete when you filed?</h2>
            <p className="text-warm-600 text-sm mt-2 leading-relaxed">
              "Complete" means your Aadhaar, PAN, and bank details were all verified on the UAN portal at the time you submitted
              this claim.
            </p>
          </div>

          <div className="space-y-2" role="radiogroup" aria-label="Was your KYC complete when you filed?">
            <RadioCard
              label="Yes — all KYC was complete and verified"
              sublabel={suppressesDeadline ? undefined : "EPFO's 3-day deadline applies"}
              checked={s.kycCompleteAtFiling === true}
              onChange={() => setS({ ...s, kycCompleteAtFiling: true })}
            />
            <RadioCard
              label="No — KYC was not fully complete"
              sublabel={suppressesDeadline ? undefined : "EPFO's 20-day deadline applies"}
              checked={s.kycCompleteAtFiling === false}
              onChange={() => setS({ ...s, kycCompleteAtFiling: false })}
            />
          </div>

          <PrimaryBtn full disabled={s.kycCompleteAtFiling === null} onClick={advance}>
            See my diagnosis <ArrowRight className="size-4" />
          </PrimaryBtn>
        </div>
      </Shell>
    );
  }

  // ── Diagnosis summary ───────────────────────────────────────────────────

  if (s.screen === "diagnosisSummary") {
    const isCode7 = s.selectedCodes.includes("CODE_7_NO_REASON");
    // See DIAGNOSIS_SUMMARY_SUBTITLE_OVERRIDE above for why Code 8/Code 9 get distinct wording
    // here instead of the shared "not your fault" default.
    const subtitleOverride = s.selectedCodes
      .map((c) => DIAGNOSIS_SUMMARY_SUBTITLE_OVERRIDE[c])
      .find((text) => text !== undefined);
    const diag = postRejectionResult?.diagnosis;
    const selfCheck = diag?.selfCheck;
    const entries = diag?.entries ?? [];
    const priority = postRejectionResult?.priority;
    const showPriorityRanking = !!priority?.needsRanking;

    function priorityFor(code: RuleCode): EntryPriority | undefined {
      if (!priority) return undefined;
      const idx1 = priority.tier1.indexOf(code as never);
      const idx2 = priority.tier2.indexOf(code as never);
      const idxU = priority.unranked.indexOf(code as never);
      const rank = priority.ranked.indexOf(code as never) + 1;
      if (idx1 >= 0) return { tier: "tier1", rank, isFirst: rank === 1 };
      if (idx2 >= 0) return { tier: "tier2", rank, isFirst: rank === 1 };
      if (idxU >= 0) return { tier: "unranked", rank, isFirst: rank === 1 };
      return undefined;
    }

    const code7AllClean = isCode7 && selfCheck?.allClean === true;
    const code7UnsuresOnly = isCode7 && !!selfCheck && selfCheck.issueEntries.length === 0 && selfCheck.unsureItems.length > 0;
    const code7Entries = isCode7 ? selfCheck?.issueEntries ?? [] : entries;

    content = (
      <Shell step={4} totalSteps={5} onBack={back} label="Diagnosis">
        <div className="space-y-5">
          {apiPending && !postRejectionResult ? (
            <p className="text-sm text-warm-600">Checking your claim…</p>
          ) : apiError ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 space-y-2">
              <p className="text-sm font-semibold text-red-800">Couldn&apos;t check your claim</p>
              <p className="text-sm text-red-700 leading-relaxed">{apiError}</p>
              <button onClick={() => setApiError(null)} className="text-sm font-medium text-red-700 underline">
                Try again
              </button>
            </div>
          ) : postRejectionResult ? (
            <>
              <div>
                <h2 className="font-display font-bold text-2xl text-warm-900 leading-tight">
                  {code7AllClean
                    ? "Your records look clean — but EPFO didn't say why"
                    : code7UnsuresOnly
                      ? "Double-check these items before your next step"
                      : isCode7
                        ? `We found ${code7Entries.length} likely reason${code7Entries.length > 1 ? "s" : ""}`
                        : showPriorityRanking
                          ? "Fix these in order"
                          : "Here's what happened"}
                </h2>
                <p className="text-warm-600 text-sm mt-1.5 leading-relaxed">
                  {code7AllClean
                    ? "None of the common causes apply to your case as far as you can tell. EPFO must state the real reason."
                    : isCode7 && code7Entries.length > 0
                      ? "Based on your answers, here are the most likely causes. Each one has a specific fix."
                      : showPriorityRanking
                        ? "Fixing in this order will unblock your claim fastest."
                        : (subtitleOverride ?? "This is not your fault. Here's the specific fix.")}
                </p>
              </div>

              {code7UnsuresOnly && selfCheck && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 space-y-3">
                  <p className="text-sm font-semibold text-amber-800">
                    You weren't sure about {selfCheck.unsureItems.length} item{selfCheck.unsureItems.length > 1 ? "s" : ""}:
                  </p>
                  <ul className="space-y-1.5">
                    {selfCheck.unsureItems.map((key) => (
                      <li key={key} className="text-sm text-amber-700 flex gap-2">
                        <span>•</span>
                        <span>{SELF_CHECK_UI_ITEMS.find((i) => i.key === key)?.question}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="text-xs text-amber-600 leading-relaxed">
                    Double-check these before filing a grievance. If any of them turns out to be an issue, restart and select the
                    relevant reason.
                  </p>
                </div>
              )}

              {code7AllClean && (
                <div className="rounded-2xl border border-warm-200 bg-white px-5 py-4 space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-warm-600">What to do</p>
                  <p className="text-sm text-warm-700 leading-relaxed">
                    File a grievance through EPFiGMS that explicitly asks EPFO to state the actual reason for the rejection. Do
                    not guess a fix — demand the reason first. The grievance text on the next screen is ready for this.
                  </p>
                </div>
              )}

              <motion.div variants={staggerListVariants} initial="hidden" animate="show" className="space-y-5">
                {code7Entries.map((entry) => (
                  <motion.div key={entry.code} variants={staggerItemVariants}>
                    <ExplCard entry={entry} priority={!isCode7 ? priorityFor(entry.code) : undefined} />
                  </motion.div>
                ))}
              </motion.div>

              {postRejectionResult.deadline && s.filingDate && s.kycCompleteAtFiling !== null && (
                <>
                  <DeadlineCard deadline={postRejectionResult.deadline} filingDate={s.filingDate} kycComplete={s.kycCompleteAtFiling} />
                  <p className="text-xs text-warm-600 leading-relaxed">
                    Note: The 3-day and 20-day deadlines are treated as calendar days in this tool, as commonly described. EPFO
                    has not formally published whether they are calendar or working days.
                  </p>
                </>
              )}

              {/* Second review pass on ticket 17 flagged that this button unconditionally
                  promised "grievance text" even for codes that will never produce one (Code
                  8, 9, Code 3's joint-account branch, wait bands 1-2) — the same "unconditional
                  promise the underlying state doesn't support" shape ticket 16 fixed for the
                  deadline check. postRejectionResult.grievance is already computed here (the
                  fetch effect above runs on this screen too), so the never-applicable case is
                  knowable before the button is even shown. */}
              <PrimaryBtn full onClick={advance}>
                {postRejectionResult.grievance && !postRejectionResult.grievance.ready && postRejectionResult.grievance.reason === "not_applicable"
                  ? "See what to do next"
                  : "Generate grievance text"}{" "}
                <ArrowRight className="size-4" />
              </PrimaryBtn>
            </>
          ) : null}
        </div>
      </Shell>
    );
  }

  // ── Grievance output ────────────────────────────────────────────────────

  if (s.screen === "grievanceOutput") {
    const grievance: GrievanceOutput | undefined = postRejectionResult?.grievance;
    // Same never-applicable check as diagnosisSummary's button above — known as soon as
    // postRejectionResult exists, independent of whether UAN/Claim ID are filled in, so the
    // header and the fields card below must not promise "grievance text" for these cases.
    const grievanceNeverApplicable = !!grievance && !grievance.ready && grievance.reason === "not_applicable";

    content = (
      <Shell step={5} totalSteps={5} onBack={back} label="Grievance">
        <div className="space-y-5">
          <div>
            <h2 className="font-display font-bold text-2xl text-warm-900 leading-tight">
              {grievanceNeverApplicable ? "Next steps" : "Your grievance text"}
            </h2>
            <p className="text-warm-600 text-sm mt-1.5 leading-relaxed">
              {grievanceNeverApplicable
                ? "There's no grievance to file for this — see why below."
                : "Paste this into the free-text box on EPFiGMS. Fill in your UAN and Claim ID below to personalise it first."}
            </p>
          </div>

          {!grievanceNeverApplicable && (
            <div className="rounded-2xl border border-warm-200 bg-white px-5 py-4 space-y-4">
              <p className="text-sm font-semibold text-warm-700">Your details</p>
              <div className="space-y-3">
                <div>
                  <label htmlFor="uan-input" className="block text-xs font-medium text-warm-600 mb-1.5">
                    UAN (12-digit Universal Account Number)
                  </label>
                  <input
                    id="uan-input"
                    type="text"
                    inputMode="numeric"
                    placeholder="e.g. 100123456789"
                    value={s.uan}
                    maxLength={16}
                    onChange={(e) => setS({ ...s, uan: e.target.value })}
                    className="w-full rounded-xl border-2 border-warm-200 bg-warm-50 px-3.5 py-2.5 text-sm text-warm-900 placeholder:text-warm-400 focus:outline-none focus:border-accent-500 transition-colors"
                  />
                </div>
                <div>
                  <label htmlFor="claim-id-input" className="block text-xs font-medium text-warm-600 mb-1.5">
                    Claim ID (shown on your rejection notice or UAN portal)
                  </label>
                  <input
                    id="claim-id-input"
                    type="text"
                    placeholder="e.g. MHBAN2401XXXXXXXXX"
                    value={s.claimId}
                    onChange={(e) => setS({ ...s, claimId: e.target.value })}
                    className="w-full rounded-xl border-2 border-warm-200 bg-warm-50 px-3.5 py-2.5 text-sm text-warm-900 placeholder:text-warm-400 focus:outline-none focus:border-accent-500 transition-colors"
                  />
                </div>
                {/* The backend won't finalize grievance text without both fields — this is a
                    real rule, not a UI-only nicety, so both are collected here even though
                    the original design treated them as fully optional. */}
                <p className="text-xs text-warm-500">Both are required to generate your grievance text.</p>
              </div>
            </div>
          )}

          {apiPending && !grievance ? (
            <p className="text-sm text-warm-600">Preparing your grievance text…</p>
          ) : apiError ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 space-y-2">
              <p className="text-sm font-semibold text-red-800">Couldn&apos;t prepare your grievance</p>
              <p className="text-sm text-red-700 leading-relaxed">{apiError}</p>
            </div>
          ) : grievance && !grievance.ready && grievance.reason === "missing_info" ? (
            <div className="rounded-2xl border border-warm-200 bg-warm-50 px-5 py-4">
              <p className="text-sm text-warm-700 leading-relaxed">Fill in your UAN and Claim ID above to generate your grievance text.</p>
            </div>
          ) : grievance && !grievance.ready && grievance.reason === "not_applicable" ? (
            <div className="rounded-2xl border border-warm-200 bg-warm-50 px-5 py-4 space-y-2">
              {/* Generic on purpose — this reason covers two different cases: "not stuck long
                  enough yet" (bands 1-2) and "not an EPFO issue to escalate at all" (a joint
                  account, ticket 15). The note below always carries the specific reason. */}
              <p className="text-sm font-semibold text-warm-700">No grievance to file right now</p>
              <p className="text-sm text-warm-600 leading-relaxed">{grievance.note}</p>
            </div>
          ) : grievance && grievance.ready ? (
            <>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-warm-600 mb-2">Subject line</p>
                <CopyBlock text={grievance.subject} onCopy={() => trackClientEvent(sessionId, "grievance_copied", { variant: grievance.variant })} />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-warm-600 mb-2">Grievance body</p>
                <CopyBlock text={grievance.body} onCopy={() => trackClientEvent(sessionId, "grievance_copied", { variant: grievance.variant })} />
              </div>
              <div className="rounded-xl bg-accent-50 border border-accent-100 px-4 py-3.5 space-y-2">
                <p className="text-xs font-semibold text-accent-700">Where to file</p>
                <p className="text-xs text-accent-600 leading-relaxed">
                  Go to <strong>EPFiGMS</strong> (epfigms.gov.in). Select your establishment, then look for a category close to{" "}
                  <strong>&ldquo;{grievance.suggestedCategory}&rdquo;</strong> and paste the text above into the description box.
                </p>
                <p className="text-xs text-accent-600/80 leading-relaxed italic">{SUGGESTED_CATEGORY_CAVEAT}</p>
                <a
                  href="https://epfigms.gov.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-accent-600 hover:text-accent-700 transition-colors"
                >
                  Open EPFiGMS <ExternalLink className="size-3" />
                </a>
              </div>
            </>
          ) : null}

          {grievance && grievance.ready && (
            <FeedbackWidget
              sessionId={sessionId}
              context="grievance_output"
              submitted={feedbackSubmitted.grievance_output}
              onSubmitted={() => setFeedbackSubmitted((prev) => ({ ...prev, grievance_output: true }))}
            />
          )}

          <Disclaimer />

          <button onClick={startOver} className="w-full text-center text-sm text-warm-600 hover:text-warm-700 transition-colors py-2">
            Start over
          </button>
        </div>
      </Shell>
    );
  }

  // ── Readiness result (Path B) ────────────────────────────────────────

  if (s.screen === "readinessResult") {
    const result = readinessApiResult;
    const status = result?.outcome === "ready" ? "ready" : result?.outcome === "mostly_ready" ? "mostly" : "issues";
    const N = result?.issues.length ?? 0;
    const M = result?.unsureItems.length ?? 0;

    content = (
      <Shell step={2} totalSteps={2} onBack={back} label="Your result">
        <div className="space-y-5">
          {apiPending && !result ? (
            <p className="text-sm text-warm-600">Checking your answers…</p>
          ) : apiError ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 space-y-2">
              <p className="text-sm font-semibold text-red-800">Couldn&apos;t check your answers</p>
              <p className="text-sm text-red-700 leading-relaxed">{apiError}</p>
            </div>
          ) : result ? (
            <>
              <div
                className={cn(
                  "rounded-2xl px-5 py-5 border-2",
                  status === "ready" ? "bg-green-50 border-green-200" : status === "mostly" ? "bg-amber-50 border-amber-200" : "bg-red-50 border-red-200"
                )}
              >
                <div className="flex items-center gap-3 mb-2">
                  {status === "ready" ? (
                    <CheckCircle2 className="size-6 text-green-600 shrink-0" />
                  ) : status === "mostly" ? (
                    <AlertTriangle className="size-6 text-amber-500 shrink-0" />
                  ) : (
                    <CircleAlert className="size-6 text-red-500 shrink-0" />
                  )}
                  <h2 className={cn("font-display font-bold text-xl", status === "ready" ? "text-green-800" : status === "mostly" ? "text-amber-800" : "text-red-800")}>
                    {status === "ready" ? "Looks ready to file" : status === "mostly" ? `Mostly ready — double-check ${M} thing${M > 1 ? "s" : ""}` : `Found ${N} issue${N > 1 ? "s" : ""} to fix first`}
                  </h2>
                </div>
                <p className={cn("text-sm leading-relaxed", status === "ready" ? "text-green-700" : status === "mostly" ? "text-amber-700" : "text-red-700")}>
                  {status === "ready"
                    ? "Based on what you told us, none of the common blockers apply to your claim. This is not a guarantee — we can't see your actual EPFO record — but you've checked the most common causes of rejection."
                    : status === "mostly"
                      ? "Your claim looks ready, but you weren't sure about a few things. Double-check them before you file."
                      : `Fix ${N === 1 ? "this issue" : "these issues"} before you file. ${M > 0 ? `Also double-check ${M} more thing${M > 1 ? "s" : ""} you were unsure about.` : ""}`}
                </p>
              </div>

              <motion.div variants={staggerListVariants} initial="hidden" animate="show" className="space-y-5">
                {result.issues.map((entry) => (
                  <motion.div key={entry.code} variants={staggerItemVariants}>
                    <ExplCard entry={entry} />
                  </motion.div>
                ))}
              </motion.div>

              {result.unsureItems.length > 0 && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 space-y-3">
                  <p className="text-sm font-semibold text-amber-800">Double-check {result.unsureItems.length === 1 ? "this" : "these"} before filing:</p>
                  <ul className="space-y-2">
                    {result.unsureItems.map((key) => (
                      <li key={key} className="text-sm text-amber-700 flex gap-2 leading-relaxed">
                        <span className="shrink-0 mt-0.5">•</span>
                        <span>{SELF_CHECK_UI_ITEMS.find((i) => i.key === key)?.question}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          ) : null}

          {result && (
            <FeedbackWidget
              sessionId={sessionId}
              context="readiness_result"
              submitted={feedbackSubmitted.readiness_result}
              onSubmitted={() => setFeedbackSubmitted((prev) => ({ ...prev, readiness_result: true }))}
            />
          )}

          <Disclaimer />

          <button onClick={startOver} className="w-full text-center text-sm text-warm-600 hover:text-warm-700 transition-colors py-2">
            Start over
          </button>
        </div>
      </Shell>
    );
  }

  return (
    <AnimatePresence mode="wait" initial={false} custom={direction}>
      <motion.div
        key={s.screen}
        custom={direction}
        variants={screenVariants}
        initial="enter"
        animate="center"
        exit="exit"
        transition={{ duration: 0.22, ease: "easeOut" }}
        className="min-h-full"
      >
        {content}
      </motion.div>
    </AnimatePresence>
  );
}
