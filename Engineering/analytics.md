# EPFO Decoder — Analytics Plan

*Backs US6 in `spec.md` and the stateless-analytics decision in PRD §7a item 7. Every event ties to one `session_id` — an opaque UUID the frontend generates client-side and holds only for the tab's lifetime. No identity, no PII, nothing that survives the session.*

Events are tracked in Mixpanel, using `session_id` as `distinct_id` (`Engineering/ADR/0004-analytics-via-mixpanel.md`). There is no database table involved — a client-fired event goes straight to Mixpanel from the browser via its client SDK; a server-computed event is tracked from `app/api/diagnose/route.ts` via `lib/analytics.ts`'s `trackServerEvent()`.

| Event | Fires when | Properties | Fired by |
|---|---|---|---|
| `session_started` | The app generates a new session ID (first load, no existing one in the tab). | `entry_point_hint` (how they landed, if known) | Client (direct to Mixpanel) |
| `entry_point_selected` | The citizen picks a flow. | `entry_point`: `post_rejection` \| `pre_filing` | Client (direct to Mixpanel) |
| `codes_selected` | The request to `/api/diagnose` carries the citizen's rejection-code selection (post-rejection flow). | `codes`: array of `RuleCode` | Server (`app/api/diagnose/route.ts`) |
| `self_check_submitted` | The request to `/api/diagnose` carries the 5-item self-check (Code 7 or Code 10 (ticket 10) fallback, or pre-filing flow). Fixed on ticket 10's second review pass — this event never fired for `post_rejection` at all before, a pre-existing gap. | `answers`: the 5 yes/no/unsure values | Server (`app/api/diagnose/route.ts`) |
| `diagnosis_shown` | `/api/diagnose` returns a result for `post_rejection`. | `codes`, `priority_ranked` (bool), `tier1`, `tier2`, `unranked` | Server (`app/api/diagnose/route.ts`) |
| `deadline_check_shown` | The deadline/penalty result is computed. | `status`: `NOT_YET_DUE` \| `MISSED`, `deadline_days`: `3`\|`20` | Server (`app/api/diagnose/route.ts`) |
| `grievance_generated` | Grievance text is produced. | `variant`: `A`–`F`, `deadline_cited`: bool | Server (`app/api/diagnose/route.ts`) |
| `grievance_copied` | The citizen copies the grievance text to their clipboard. | `variant` | Client (direct to Mixpanel) — this is the one event that only the client can observe. Still fired, but deliberately not chased for prod verification (2026-08-30, see `PRD.md` changelog) — `grievance_generated` is the event that actually signals H13, this one is a UX nicety. |
| `readiness_result_shown` | The pre-filing flow returns a result. | `result`: `ready` \| `mostly_ready` \| `issues_found`, `issue_count`, `unsure_count` | Server (`app/api/diagnose/route.ts`) |
| `feedback_submitted` | The citizen submits a like/dislike (+ optional comment) on the grievance-output or readiness-result screen. | `sentiment`: `like` \| `dislike`, `context`: `grievance_output` \| `readiness_result`, `comment`?: string (only present if non-empty, trimmed, capped at 500 chars) | Client (direct to Mixpanel) — see `lib/ui/feedback.ts`. Built 2026-08-30 (US7 in `spec.md`); until then this row described a planned event with no UI behind it. |

**Rules for every ticket that fires one of these:** instrument the event in the same ticket that builds the feature, not as a follow-up (per the route's standing rule — an event added later tends to just not happen). Verify it actually lands in the Mixpanel dashboard in the deployed environment before calling the ticket done, not just that the code calls `trackServerEvent()` or the client SDK.

**Not tracked, on purpose:** UAN, claim ID, filing date, or any other field the citizen types into the diagnose form. Those are used in-memory to produce the response and are never sent to Mixpanel. `lib/analytics.ts`'s `trackServerEvent()` enforces this with a blocked-key check, not just a code comment. The one field that *is* free text — `feedback_submitted`'s `comment` — gets its own scrub instead (`lib/ui/feedback.ts`'s `redactLikelyPii`), since a citizen could still type a UAN into it by hand. If a future ticket needs to log one of these for debugging, that's a real scope change (PII enters a third-party analytics tool) — flag it, don't fold it in silently.

## Reading `feedback_submitted` comments

No new build for this — it's Mixpanel's own raw Events explorer (Data → Events), filtered to `feedback_submitted`, with columns narrowed to `Time` / `sentiment` / `context` / `comment`. That filtered+column state is durable and bookmarkable: reloading the same URL restores it exactly.

- **Saved view:** `https://mixpanel.com/project/4058729/view/4555102/app/events#TiQkKEaF4bsn`
- Matches the MVP's stateless decision (PRD §7a item 7) — no new storage, no admin page, just Mixpanel's own UI. Free-tier blocks the Query/Export *API* (`402`), but this UI table itself isn't blocked.
- Not a saved Board/Report (no such option found on the free plan for a raw event table) — it's a URL-encoded view state. It'll keep working as long as the URL isn't lost; re-derive it the same way (filter Events to `feedback_submitted`, set columns) if it ever is.
- Revisit if comment volume grows past what a flat table is comfortable to scan — the small in-app admin page option (Supabase, already provisioned for v2) is the next step up, but is real new scope (a write path, a read path, an access decision) not worth building until the free Mixpanel view actually falls short.

## Product Overview board (2026-09-01)

A saved Mixpanel Board — `EPFO-Sahayak: Product Overview` (`https://mixpanel.com/project/4058729/view/4555102/app/boards#id=11496712`) — with two saved reports, both unlike the raw-event-table view above (Insights and Funnels reports *are* saveable to a Board on the free plan; a raw Events-explorer table, per the note above, is not):

- **Core Funnel Trends** — an Insights report, one line per core event (`session_started`, `entry_point_selected`, `grievance_generated`, `feedback_submitted`), monthly granularity, uniques.
- **Core Conversion Funnel** — a Funnels report, the same four events in sequence, showing step-by-step conversion/drop-off.

General usage-health overview, not tied to one ticket — separate from the ticket-18 Code-10 tracking view below, which is still not yet created. Counts against the free plan's 5-saved-reports-per-project cap (2 of 5 used as of this entry).

## Watching for a new/unmatched rejection code (ticket 18)

EPFO publishes no public master list of its own rejection remarks, so there's no document to check the rule library against once and be done. `CODE_10_UNLISTED_REASON` ("I see a reason, but it's not listed here," ticket 10) is the ongoing coverage signal instead: every citizen who selects it means the library is missing something. This section turns that signal into an actual, documented process — deliberately lightweight, not a monitoring pipeline (ticket 18's own scope note: no automated detection, no free-text capture of the citizen's actual remark, just a volume signal).

- **Saved view:** same pattern as `feedback_submitted` above — Mixpanel's raw Events explorer (Data → Events), filtered to `codes_selected` where `codes` contains `CODE_10_UNLISTED_REASON`, columns narrowed to `Time` / `codes`. **Not yet created** — this needs the product owner's own Mixpanel access (same as the `feedback_submitted` view above, and the same handoff pattern as the infra tickets: `Engineering/tickets/08-infra-deploy-setup.md`). Once created, the resulting URL goes on this line, matching the row above.
- **Threshold:** if `CODE_10_UNLISTED_REASON` selections cross roughly **10% of total `codes_selected` events** in a rolling window, that's the trigger to run a fresh research pass — the same kind done for tickets 15–17 — and ship whatever new code(s) it finds through the normal ticket process. The 10% figure is a starting guess, not a measured threshold (no real production volume exists yet to calibrate against) — revisit once Phase 2 has real traffic.
- **What crossing it means, concretely:** open a new ticket (next available number), following the same pattern as tickets 15–17 — a broader unbiased research pass, not just re-checking the original 15-case sample, since that sample's own search terms already missed 3 real categories once (see PRD.md's 2026-08-31 changelog entry).
- This stays a **volume** signal (something's missing), not a **content** signal (what's missing) — finding the "what" is still a manual research pass. No free-text capture of the citizen's actual EPFO remark was added for this (ticket 10's own scope decision, carried forward here), to avoid a new PII surface.
