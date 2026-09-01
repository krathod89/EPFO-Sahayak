# 18 — Turn Code 8 selections into a recurring new-code review signal

**Status:** Partially done (2026-09-01) — blocked on the product owner's Mixpanel access for the one remaining step (see Closeout)

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

## Closeout

Built as `CODE_10_UNLISTED_REASON` (ticket 10's actual name, not the speculative `CODE_8_UNLISTED_REASON` this ticket's text used before ticket 10 shipped).

**Scope item 2 (documented threshold) and item 3 (no free-text capture) are done** — see the new "Watching for a new/unmatched rejection code" section in `Engineering/analytics.md`: the 10%-of-`codes_selected` threshold, and the "open a new ticket, run a broader research pass" process, both written down. Item 3 needed no new work — ticket 10 already made that call.

**Scope item 1 (the Mixpanel saved view) is not done** — this is the one piece of this ticket that genuinely can't be built from here: it needs the product owner's own Mixpanel account, same as `feedback_submitted`'s already-existing saved view (and the same handoff shape as `Engineering/tickets/08-infra-deploy-setup.md`'s Vercel/Supabase provisioning). `analytics.md` documents the exact filter to set (Events → `codes_selected` where `codes` contains `CODE_10_UNLISTED_REASON`, columns `Time`/`codes`) with a placeholder noting the URL goes there once created — mirroring the `feedback_submitted` row's own format exactly, so filling it in later is a one-line edit, not a rebuild.
