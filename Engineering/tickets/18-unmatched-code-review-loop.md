# 18 — Turn Code 8 selections into a recurring new-code review signal

**Status:** Open

Traces to: ticket 10 (Code 8, "I see a reason, but it's not listed here"). Depends on ticket 10 shipping first.

## Why

Confirmed this session: EPFO publishes no public master list of its own rejection remarks, so there's no document to check the rule library against once and be done. The only honest, ongoing coverage signal is **how often real citizens hit Code 8** — every selection means the library is missing something. Right now nothing turns that signal into action; it would just accumulate silently in Mixpanel.

## Scope — deliberately lightweight, not a new system

1. **Mixpanel view.** Add a saved Mixpanel view/report filtered to `codes_selected` events where `codes` contains `CODE_8_UNLISTED_REASON`, same pattern already used for `feedback_submitted` comments (`Engineering/analytics.md`'s existing saved-view entry) — a bookmarkable URL, no new build.
2. **A documented threshold, not a monitoring pipeline.** Record in `analytics.md`: if Code 8 selections cross roughly 10% of total `codes_selected` events in a rolling window (number is a starting guess — revisit once Phase 2 has real volume), that's the trigger to run a fresh research pass — the same kind done in tickets 15–17 this session — and ship whatever new code(s) it finds through the normal ticket process.
3. **No free-text capture added.** Ticket 10 already deliberately excluded capturing the citizen's actual raw remark, to avoid a new PII surface. This stays a *volume* signal (something's missing) rather than a *content* signal (what's missing) — finding the "what" is still a research pass, same as today's, not an automated pipeline reading citizen input.

## Not in scope

- No automated code-generation or dropdown-editing tooling. Right-sized for this product's actual volume — a manual research-and-ticket pass, triggered by a documented threshold, is enough; building automation for this would be solving a problem this MVP doesn't have yet.

## Done means

- Saved Mixpanel view exists and its URL is recorded in `analytics.md`, next to the existing `feedback_submitted` view.
- The threshold and the "what happens when it's crossed" process are written down in `analytics.md`, so this doesn't rely on someone remembering to check.
