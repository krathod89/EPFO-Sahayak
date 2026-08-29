# UI/UX Design Generation Prompt — EPFO Sahayak

This is a ready-to-paste prompt for generating high-fidelity UI/UX designs for the EPFO Sahayak decoder (the product spec'd in `PRD.md` and `Rule Engine/Rule Engine Spec.md`). Paste the section below the divider into an LLM or AI design tool (Claude, v0, Lovable, or similar). It's written to be self-contained — the tool doesn't need this repo's other files, though sharing `Rule Engine/Rule Engine Spec.md` alongside it will get more accurate screens.

---

## Prompt

You are designing the UI/UX for **EPFO Sahayak**, a free, citizen-facing web tool. It takes a confusing EPFO (Provident Fund) claim-rejection remark and turns it into a plain-language diagnosis, a fix-priority order, a deadline/penalty check, and ready-to-paste grievance text — or, in a second mode, checks a citizen's claim readiness *before* they file at all.

### Who uses this

Salaried, formal-sector Indian workers — literate, online, but not necessarily technical. They arrive stressed, confused, or annoyed (a claim just got rejected, or money they're legally owed is stuck). They are not government employees and have no patience for a form that looks like a government form. Assume mobile-first: most will open this on a phone.

### Objectives, in priority order

1. **Trust, immediately.** This deals with someone's money and a government process. The design must read as credible and careful, not like a scraped template or a scammy claim-your-refund site — the population this serves is already primed to be suspicious of anything PF-related that isn't the official portal.
2. **Plain language, always.** Every screen's copy should follow Simplified Technical English: short sentences, one idea per sentence, no jargon left unexplained. The design should give copy room to breathe — no cramming explanation text into tooltips or truncated cards.
3. **Guided, not overwhelming.** This is a branching Q&A wizard (see flow below), not a form with every field visible at once. One decision per screen. Always show progress and always allow going back.
4. **Actually modern.** Current-generation web design: real typographic hierarchy, intentional whitespace, a coherent color system, subtle depth (soft shadows/elevation, not flat everything), and light motion on state changes (a diagnosis appearing, a step advancing) — not a static, dated government-portal look, and not a generic SaaS-template look either.
5. **Accessible.** WCAG AA minimum: real contrast ratios, keyboard-navigable, legible at default and larger text sizes, obvious focus states. This population may be reading on a poor mid-range Android screen in daylight — accessibility here is not a checkbox, it's a usability requirement.

### Explicit design constraints — avoid these "looks like a template" tells

- No emoji used as functional icons. Use a real icon set if icons are needed.
- No evenly-spaced stat-tile grids for the sake of it. Every visual element should earn its place.
- No monospace-uppercase labels applied to everything — reserve emphasis for what actually needs it.
- No undifferentiated card grids. If content differs in importance, the layout should show that.
- Pick **one confident accent color** tied to the brand (not a generic blue), plus a considered neutral ramp — not a flat, colorless, "safe" greyscale system. Reserve semantic colors (success/warning/error) strictly for status, not decoration.
- Use a real, loaded web font with an intentional pairing (a distinct display/heading face plus a clean body face) — not a system-font fallback that never actually renders.
- The result should look like a real, funded product a citizen would trust with a government process — not a hackathon prototype, and not a sterile "disciplined but bland" system that is correct on every rubric but forgettable to look at.

### Design references (study these for tone and interaction, not for literal visual copying)

- **GOV.UK Smart Answers** — the exact pattern for this product's core mechanic: one question per screen, hidden branching logic, a plain-language outcome at the end.
- **NHS 111 Online** — a symptom-checker UX that routes/triages rather than diagnoses; matches this product's own "we route you, we're not legal advice" framing.
- **USA.gov Benefit Finder** — surfaces multiple matched outcomes clearly when more than one applies, relevant to the priority-check screen (see flow, step 3).
- **Haqdarshak** — an Indian product actually solving an adjacent entitlement-access problem; useful for what "trustworthy but modern" looks like specifically in an Indian govt-adjacent context.
- **TurboTax's guided wizard flow** — the Q&A-to-generated-document mechanic this product's grievance generator directly mirrors.

### Screens and flow to design

**Entry point**
- Landing screen: two clear paths — "My claim was rejected" (post-rejection decoder) vs. "I haven't filed yet" (pre-filing readiness check). Plain explanation of what the tool does and does not do (it is not affiliated with EPFO; it does not access live EPFO data; everything the citizen types stays with them).

**Path A — Post-rejection decoder**
1. Remark selection: 7 options (6 rejection codes + "I don't see a reason"), each in plain language, not EPFO's own jargon term. See the rule table in `Rule Engine/Rule Engine Spec.md` for exact wording to adapt.
2. Branching sub-questions where applicable (the name/DOB portal-sync-bug check; the bank-KYC wait-time question).
3. If multiple reasons apply: a priority screen showing which to fix first and why (Tier 1 eligibility blockers before Tier 2 payment blockers).
4. Deadline/penalty check: filing date input → clear pass/fail state ("EPFO is still within its deadline" vs. "EPFO missed its own deadline — you may be owed a 12% penalty").
5. Diagnosis summary screen: what happened, why it's not the citizen's fault, what to do next.
6. Grievance output: the ready-to-paste EPFiGMS text in a clearly copyable block (obvious copy action, confirmation on copy), with the fields that were filled in shown as editable before copying.

**Path B — Pre-filing readiness check**
1. The same 5 applicable checks as a checklist flow (Date of Exit, KYC verified, name/DOB/father's-name consistency, EPS continuity, old claim pending) — same plain-language explanations as Path A, framed proactively.
2. Result screen: three states — "Looks ready," "Mostly ready, double-check one thing," or "Found N issues" — each with clear next steps, not just a pass/fail badge.

### Deliverable

Generate high-fidelity screens (not low-fidelity wireframes) for: the entry screen, one representative Q&A step, the priority screen, the deadline/penalty result, the grievance-output screen, and the pre-filing result screen. Show both a mobile viewport and a desktop viewport for at least the entry screen and one Q&A step. State the type pairing, the accent color (with a hex value), and the spacing/elevation system you chose, briefly, before showing the screens — commit to a direction rather than hedging with a generic default.

---

## Notes on using this prompt

- If the tool you're pasting this into supports file attachments, attach `Rule Engine/Rule Engine Spec.md` too — it has the exact copy drafted for each of the 7 diagnosis options, the grievance templates, and the two Mermaid flow diagrams, which will make the generated screens far more accurate than this prompt alone.
- Ask for a direction/mood check first on a couple of screens before requesting the full set — committing to one aesthetic direction early and getting a quick "does this feel right" pass avoids redoing a full screen set in the wrong direction.
- If the generated result reads as safe-but-forgettable (correct spacing and contrast, but nothing memorable), that's the "disciplined but bland" failure mode — push back and ask specifically for a stronger accent color and more typographic personality, rather than accepting the first pass.
