# EPFO Sahayak — Design Direction (Retroactive Record)

*Closes the `/new-product-route` gap-check finding on step 3: the direction wasn't chosen from multiple options with sign-off before build — it was generated once, then critiqued and fixed twice. This document is that record, written after the fact, so the actual decision gets an explicit sign-off now instead of staying implicit.*

**Source brief:** `Design/UI-UX Design Prompt.md` — one direction brief (not several options), pasted into a Figma Make prototype (Vite/React). References named in the brief: GOV.UK Smart Answers, NHS 111 Online, USA.gov Benefit Finder, Haqdarshak, TurboTax's guided wizard.

---

## What actually happened, in order

**1. First pass — the Figma Make prototype.** One direction, not several: warm cream background, Fraunces (serif) as the display face throughout, generated directly from the brief above. Built standalone, outside this repo.

**2. First Impeccable critique — scored 28/40.** Found the warm-cream background read closer to a lifestyle/editorial site than the "credible, careful, government-adjacent" trust register every reference product (GOV.UK, NHS-111, MeitY's UX4G, Haqdarshak) actually uses — all of them sit on a cool-neutral or near-white ground, not warm cream. Also flagged real contrast gaps and missing ARIA roles, and a P0 bug: a conditional React hook crashed the grievance screen.

**3. Fixes applied, then ported into the real repo as `app/page.tsx`:**
- Background/neutral ramp moved from warm cream to a cool-neutral scale (`--color-warm-50` … `--color-warm-900`, `app/globals.css`) — matches the reference products' actual ground color, not a stylistic preference.
- Landing-page headings moved from Fraunces to Inter, matching how GOV.UK/NHS-111/UX4G/Figma's own marketing pages set large display type — Fraunces is kept as `--font-display` for in-flow moments where a warmer, more human voice fits (the brief's "trust, immediately" + "actually modern" objectives pulling in different directions depending on context).
- One confident accent added: a teal-green ramp (`--color-accent-500: #0a6e52`) — the brief's explicit instruction to avoid "a flat, colorless, safe greyscale system."
- Fixed the P0 conditional-hook crash on the grievance screen.
- Added a desktop-only "How it works" panel to the landing page.
- Added screen-transition motion between wizard steps — a state-change signal (which screen the citizen just reached), not decoration; matches the route's animation filter (guide/explain, not ornament).
- Fixed real accessibility gaps: contrast ratios, missing ARIA roles.
- Added `localStorage` resume-on-reload, so a citizen mid-flow doesn't lose progress on an accidental refresh.
- Fixed a real correctness bug found during this pass, not a cosmetic one: the native date input silently accepted mistyped future/invalid dates with no warning.

**4. Second Impeccable critique — scored 32/40**, after the fixes above.

**5. Integrated with the real backend** — the prototype's duplicate client-side rule engine was removed entirely; the UI now calls the real, tested `lib/rule-engine` via `POST /api/diagnose`.

## Where this diverges from the route's normal step-3 process

The route asks for 2–3 references *and multiple different direction options* compared side by side, with sign-off on the chosen look **before** any build starts. What happened here was one direction generated once, then hardened through two critique-and-fix passes after the build already existed — closer to "ship and refine" than "choose then build." The references were used (five named products, actually checked against for tone), but never as competing options — only as a bar the single generated direction was measured against after the fact.

This wasn't a wrong call under a 9-day case-study clock — it's a real tradeoff (speed vs. a compared-options paper trail), named here so it's a conscious choice on record rather than a silently skipped step.

## What's live today (for sign-off)

- **Ground:** cool-neutral ramp, `--color-warm-50` (`#f1f4f7`) background, `--color-warm-900` (`#101316`) text.
- **Accent:** teal-green, `--color-accent-500` (`#0a6e52`).
- **Type:** Inter for landing headings and all body text; Fraunces reserved for `--font-display` moments elsewhere in the flow.
- **Motion:** screen-transition animation between wizard steps only — no decorative/scroll-triggered motion, per the route's animation filter.
- **Accessibility:** WCAG-AA contrast and ARIA roles fixed per the first critique's findings; not independently re-audited since.

**Sign-off needed:** does this look — as currently live at `epfo-sahayak-pi.vercel.app` — count as the approved direction, closing this gap? Or is there a specific element (the Fraunces/Inter split, the accent color, the motion) worth revisiting before calling it final?

---

## 2026-09-01 — Design review round 2: closes the sign-off above

**Answer to the open question:** revisit, specifically the type. User feedback: "the designs and fonts are AI Slopy."

**Diagnosis.** The Fraunces+Inter serif-display/sans-body pairing itself is the tell now — it's become one of the defaults a model reaches for on any "trust-first" product brief, independent of how it's applied. Compounding it: uniform `rounded-2xl` on every card, pastel icon-in-rounded-square badges, and a solid-color pill eyebrow badge — the "undifferentiated card grid + emoji-adjacent icon chip" pattern.

**Process.** Three rounds of local, unpublished HTML comparisons (same landing copy restyled, viewed side by side in-browser, no code touched until a direction was picked):
1. Two original directions — *Civic Flat* (`IBM Plex Sans` + `Source Serif 4` italic accent, indigo/terracotta, hard-edged flat cards) and *Ledger Serif* (`Source Serif 4` + `Work Sans`, receipt-stub cards) — against the current baseline.
2. Live reference capture of `datadoghq.com` and `linear.app` (computed styles pulled from the actual pages, not guessed) for outside calibration: Datadog uses one grotesk typeface for everything with 0px-radius hard-bordered buttons; Linear uses **the same Inter this app already had**, but at a fractional variable weight (510) with tight negative tracking — the gap there was craft/default-usage, not the font file.
3. A synthesis direction — current's shapes/colors/icon-chips kept as-is, civic flat's type substituted in — compared side by side against the unchanged baseline. Approved as-is.

**Decision: keep the shape/color language, replace the type only.**
- `Fraunces` → `Source Serif 4` for `--font-display` (unchanged role: in-flow question headings, the one accent moment).
- `Inter` → `IBM Plex Sans` for `--font-sans` (unchanged role: body/UI text).
- New: the landing hero's "Sahayak" word set in italic `--font-display`, `text-accent-600` — the one typographic accent moment on the page that didn't exist before.
- Explicitly **not** touched this round: the `rounded-2xl` card shape, the pastel icon-in-square badges, the pill eyebrow badge, the accent-green ramp. Flagged to the user as still part of what reads as generic even after the font swap; kept on the user's explicit call to ship the type change alone first.

**What's live now:**
- **Type:** `IBM Plex Sans` for landing headings and all body text; `Source Serif 4` reserved for `--font-display` moments (in-flow question headings, and the landing hero's italic "Sahayak" accent).
- Ground, accent color, motion, and card shape: unchanged from the round above.

**Open for a future pass, not this one:** the icon-chip/pill-badge/uniform-radius shape language, if it keeps reading as generic once the type change is live.
