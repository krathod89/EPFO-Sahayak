# 12 — Re-audit accessibility + verify mobile against the live site

**Status:** Open

Traces to: `Design/design.md` ("fixed per the first critique's findings; not independently re-audited since") and the mobile-support decision confirmed during the design-coverage grill (2026-08-31) — support for both desktop and mobile was decided, but never checked against the actual live build.

## Why

`design.md`'s accessibility fixes (contrast, ARIA) date to the first Impeccable critique, before the feedback widget, resume-on-reload banner, and date-validation error states existed. Those newer pieces weren't spot-checked here and turned out fine (`FeedbackWidget` already carries `aria-pressed`/`aria-label`/`role="status"`) — but "fine on inspection" isn't the same as an actual audit pass, and nothing since the first critique has been recorded as checked. Separately, `design.md` never mentions mobile at all beyond a "desktop-only How it works panel" — there's no record that the responsive behavior Tailwind's classes imply has actually been verified on a real narrow viewport, matching the CLAUDE.md lesson that a declared/assumed behavior isn't confirmed until it's seen rendered.

## Scope

This is a verification pass, not a build ticket — no code changes are pre-decided here. Any concrete issue it finds becomes its own follow-up ticket, the same way the first critique's findings became the fixes listed in `design.md`.

1. **Accessibility re-check** (via the `impeccable` skill or an equivalent manual pass) against the current live site (`epfo-sahayak-pi.vercel.app`), covering everything added since the first critique: `FeedbackWidget` (like/dislike + comment), the "Continue where you left off?" resume banner, date-validation error states (`aria-invalid`/`aria-describedby` usage already present — confirm it actually reads correctly with a screen reader, not just that the attributes exist), and the `Disclaimer` component's contrast against its `bg-warm-100` background.
2. **Mobile verification** — real narrow-viewport check (browser DevTools device emulation at minimum; a real phone if available) of both flows end to end: landing → post-rejection diagnosis → grievance output, and landing → pre-filing self-check → readiness result. Confirm no horizontal scroll, no clipped/overlapping content, tap targets stay usable, and the resume banner / feedback widget both render sensibly at narrow widths.
3. **Record the result** in `Design/design.md`, mirroring how the first critique's score and findings were recorded — pass/fail per item, and file references for anything that needs a follow-up ticket.

## Done means

- `Design/design.md` updated with a dated "second re-audit" entry: what was checked, what passed, what didn't.
- Any real issue found gets its own ticket (numbered after this one) rather than being fixed inline here — keeps this ticket a clean verification record.
