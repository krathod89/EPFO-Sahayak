# 09 — Feedback widget (like/dislike + optional comment)

**Status:** Done (this session)

Traces to: `spec.md` US7. Analytics: `analytics.md`'s `feedback_submitted` event (this ticket is what makes that row real — it was documented ahead of the UI, flagged as a gap in the `/new-product-route` check, closed here).

## Scope
- `lib/ui/feedback.ts` — pure helper `buildFeedbackEvent(sentiment, context, rawComment)`: trims the comment, drops it if empty, caps it at 500 chars, and never includes a `comment` key at all when there's nothing to say (keeps the Mixpanel payload clean rather than sending `comment: ""`).
- `FeedbackWidget` — a local component in `components/Wizard.tsx` (matching the file's existing convention: `Disclaimer`, `CopyBlock`, `Shell`, etc. all live there too, not in separate files). Like/dislike buttons (lucide `ThumbsUp`/`ThumbsDown`, not emoji — matches the design brief's constraint), an optional comment textarea that appears once a sentiment is picked, and a "Send feedback" action. Fires `feedback_submitted` via `trackClientEvent` only on that action — picking a sentiment alone doesn't fire anything, so a citizen who changes their mind before sending never double-fires.
- Used on both terminal screens (`grievanceOutput`, `readinessResult`), placed after the result content and before `<Disclaimer />`/"Start over" — the true end of each flow, matching US7's placement reasoning. Gated on the result actually existing (`grievance.ready`, `result`) so it never shows before there's anything to react to.
- Comment textarea carries a one-line privacy nudge ("Don't include your UAN, claim ID, or other personal details") — the comment is free text the citizen chooses to type, unlike the structured fields `lib/blocked-analytics-keys.ts` already blocks outright.

## Not in scope
- No server-side storage of feedback beyond what Mixpanel itself retains — matches the MVP's stateless decision (PRD §7a item 7).
- No edit/undo after sending — a citizen can submit once per screen visit; refreshing or going back resets it (matches the screen's own transient state, no persistence needed).

## Analytics
Fires `feedback_submitted` (client, direct to Mixpanel) — see `analytics.md` for the property shape.

## Code review pass (before merge)
Found and fixed 2 real issues:
- **PII could leak through the free-text comment.** The textarea's privacy nudge is only a hint — nothing stopped a citizen pasting their UAN or an email address anyway, and `lib/blocked-analytics-keys.ts`'s no-PII guard only blocks known property *names*, not values inside `comment`. Added `redactLikelyPii` in `lib/ui/feedback.ts` (6+ digit runs, email addresses → `[redacted]`) as defense-in-depth before the comment reaches Mixpanel.
- **Double-submission on grievance screens that re-verify.** `FeedbackWidget` owned its own `submitted` state, but its render guard (`grievance.ready`) can flip false→true again within one visit (e.g. clearing then re-filling the UAN), unmounting and remounting the widget and forgetting an earlier submission. Lifted `submitted` to `Wizard`'s own state (`feedbackSubmitted`, keyed per context, reset on `startOver`) so it survives the remount.

99 tests passing after the fixes (up from 96).
