// Server-side Mixpanel tracking (Engineering/ADR/0004-analytics-via-mixpanel.md).
//
// Client-side events (session_started, entry_point_selected, grievance_copied,
// feedback_submitted, and the pre-submit interaction events) are sent directly from the
// browser via Mixpanel's client SDK, using the same session_id as distinct_id — no backend
// proxy needed for those (Mixpanel's standard architecture; project tokens are meant to be
// public/client-safe). This module only tracks the events computed server-side, inside
// app/api/diagnose/route.ts.

import Mixpanel from "mixpanel";

// Same PII rule as Engineering/ADR/0002-stateless-mvp-no-auth.md: never track a
// citizen-entered field. Server-computed properties are built from trusted code, not raw
// user input, so this is defense-in-depth rather than the primary guard — but it's cheap
// insurance against a future regression that starts passing a whole request body through.
const BLOCKED_PROPERTY_KEYS = [
  "uan",
  "claim_id",
  "claimId",
  "filing_date",
  "filingDate",
  "bank_kyc_submission_date",
  "bankKycSubmissionDate",
  "self_check_answers",
  "selfCheckAnswers",
];

const token = process.env.MIXPANEL_TOKEN;

// A no-op stand-in when no token is configured (e.g. local dev without Mixpanel wired up
// yet), so the diagnose flow never breaks because analytics isn't set up.
const noopClient = { track: () => undefined } as unknown as Mixpanel.Mixpanel;

const client: Mixpanel.Mixpanel = token ? Mixpanel.init(token) : noopClient;

export function trackServerEvent(
  sessionId: string | undefined,
  eventType: string,
  properties: Record<string, unknown>
): void {
  if (!sessionId) return; // analytics is best-effort; never block the diagnose response on it

  const blocked = Object.keys(properties).filter((key) => BLOCKED_PROPERTY_KEYS.includes(key));
  if (blocked.length > 0) {
    console.warn(`trackServerEvent: dropped event "${eventType}" — blocked keys: ${blocked.join(", ")}`);
    return;
  }

  try {
    client.track(eventType, { distinct_id: sessionId, ...properties });
  } catch {
    // Analytics must never break the core flow. A logging failure is not the citizen's problem.
  }
}
