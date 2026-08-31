// Builds the `feedback_submitted` client analytics event (analytics.md, US7 in spec.md).
// A pure function so the "what actually gets sent" logic is unit-testable without mounting
// the widget or mocking Mixpanel — same pattern as date-validation.ts and session.ts.

export type FeedbackSentiment = "like" | "dislike";
export type FeedbackContext = "grievance_output" | "readiness_result";

export interface FeedbackEventProperties {
  sentiment: FeedbackSentiment;
  context: FeedbackContext;
  comment?: string;
}

const MAX_COMMENT_LENGTH = 500;

// The comment textarea nudges the citizen not to type their UAN/claim ID (Wizard.tsx), but
// that's only a hint — nothing stops them pasting one anyway, and lib/blocked-analytics-keys.ts's
// no-PII invariant only blocks known property *names*, not values buried inside free text.
// Defense-in-depth, same spirit as that file: scrub the shapes PII in this domain actually
// takes (a UAN/Aadhaar/phone number is a 6+ digit run; an email is an email) before the
// comment ever reaches Mixpanel, rather than trusting the UI hint alone.
const DIGIT_RUN = /\d{6,}/g;
const EMAIL = /[\w.+-]+@[\w-]+\.[\w.-]+/g;

function redactLikelyPii(text: string): string {
  return text.replace(EMAIL, "[redacted]").replace(DIGIT_RUN, "[redacted]");
}

/** Trims `rawComment`, redacts likely PII, and drops it entirely if there's nothing left
 * after trimming — the event never carries an empty-string `comment` key, keeping the
 * Mixpanel payload clean for the (expected-common) case of a citizen who picks a sentiment
 * and sends without typing anything. Caps an overlong comment rather than rejecting it
 * outright, since this is best-effort feedback, not a form field with validation the citizen
 * has to fix. */
export function buildFeedbackEvent(
  sentiment: FeedbackSentiment,
  context: FeedbackContext,
  rawComment: string
): FeedbackEventProperties {
  const trimmed = rawComment.trim();
  if (trimmed.length === 0) return { sentiment, context };
  return { sentiment, context, comment: redactLikelyPii(trimmed).slice(0, MAX_COMMENT_LENGTH) };
}
