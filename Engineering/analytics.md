# EPFO Decoder — Analytics Plan

*Backs US6 in `spec.md` and the stateless-analytics decision in PRD §7a item 7. Every event ties to one `session_id` — an opaque UUID the frontend generates client-side and holds only for the tab's lifetime. No identity, no PII, nothing that survives the session.*

All events write one row to the `AnalyticsEvent` table (`Engineering/ADR/0002-stateless-mvp-no-auth.md` covers why this is a session-scoped table, not a user table) via `POST /api/events`.

| Event | Fires when | Properties | Fired by |
|---|---|---|---|
| `session_started` | The app generates a new session ID (first load, no existing one in the tab). | `entry_point_hint` (how they landed, if known) | Frontend |
| `entry_point_selected` | The citizen picks a flow. | `entry_point`: `post_rejection` \| `pre_filing` | Frontend |
| `codes_selected` | The citizen submits their rejection-code selection (post-rejection flow). | `codes`: array of `RuleCode` | Frontend, on submit |
| `self_check_submitted` | The citizen submits the 5-item self-check (Code 7 fallback or pre-filing flow). | `answers`: the 5 yes/no/unsure values | Frontend, on submit |
| `diagnosis_shown` | `/api/diagnose` returns a result for `post_rejection`. | `codes`, `priority_ranked` (bool), `tier1`, `tier2`, `unranked` | Frontend, on response |
| `deadline_check_shown` | The deadline/penalty result is shown. | `status`: `NOT_YET_DUE` \| `MISSED`, `deadline_days`: `3`\|`20` | Frontend, on response |
| `grievance_generated` | Grievance text is produced. | `variant`: `A`–`E`, `deadline_cited`: bool | Frontend, on response |
| `grievance_copied` | The citizen copies the grievance text to their clipboard. | `variant` | Frontend, on copy action — this is the one event that only the client can observe |
| `readiness_result_shown` | The pre-filing flow returns a result. | `result`: `ready` \| `mostly_ready` \| `issues_found`, `issue_count`, `unsure_count` | Frontend, on response |
| `feedback_submitted` | The citizen answers "was this helpful?" | `helpful`: bool, `context`: which screen/flow it followed | Frontend, on submit |

**Rules for every ticket that fires one of these:** instrument the event in the same ticket that builds the feature, not as a follow-up (per the route's standing rule — an event added later tends to just not happen). Verify it actually lands in the `AnalyticsEvent` table in the deployed environment before calling the ticket done, not just that the code calls `/api/events`.

**Not tracked, on purpose:** UAN, claim ID, filing date, or any other field the citizen types into the diagnose form. Those are used in-memory to produce the response and are never written to `properties` or logged anywhere server-side. If a future ticket needs to log one of these for debugging, that's a real scope change (PII enters the DB) — flag it, don't fold it in silently.
