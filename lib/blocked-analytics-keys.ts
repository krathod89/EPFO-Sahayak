// Shared between lib/analytics.ts (server tracker) and lib/ui/mixpanel-client.ts (client
// tracker) so both enforce the identical no-PII list without one importing the other's
// module — lib/analytics.ts pulls in the Node-only `mixpanel` package (needs Node's `net`
// module via https-proxy-agent), which breaks the browser bundle if a client component
// imports it transitively just to reuse this constant. This file has zero other imports on
// purpose — keep it that way.

// Same PII rule as Engineering/ADR/0002-stateless-mvp-no-auth.md: never track a
// citizen-entered field. Server-computed properties are built from trusted code, not raw
// user input, so this is defense-in-depth rather than the primary guard — but it's cheap
// insurance against a future regression that starts passing a whole request body through.
export const BLOCKED_PROPERTY_KEYS = [
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
