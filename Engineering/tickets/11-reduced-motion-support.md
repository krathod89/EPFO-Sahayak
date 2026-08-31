# 11 — Respect `prefers-reduced-motion`

**Status:** Open

Traces to: `Design/design.md` "What's live today" (motion section) and the `/new-product-route` animation filter's accessibility floor — *"respect `prefers-reduced-motion`, non-negotiable."*

## Why

`app/globals.css:56` (`.animate-slide-up` → `slideUp` keyframe) fires unconditionally on every landing element and wizard-screen transition (`components/Wizard.tsx`, multiple `animate-slide-up` usages with staggered `animationDelay`). There is no `@media (prefers-reduced-motion: reduce)` rule anywhere in the codebase — confirmed by search, zero matches. The direction document justifies this motion as legitimate state-change feedback, which the route's animation filter agrees with (rule 1) — but the same filter's rule 5 is a hard floor this build doesn't currently meet.

## Scope

- **`app/globals.css`** — add a `prefers-reduced-motion: reduce` media query that neutralizes the slide/motion, following the standard robust pattern (near-zero duration + single iteration) rather than special-casing one class, so it also covers any transition/animation added later without a repeat gap:
  ```css
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
      scroll-behavior: auto !important;
    }
  }
  ```
- No JS/component changes expected — `animate-slide-up` and the inline `animationDelay` staggering in `components/Wizard.tsx` both key off the same CSS animation, so the media query alone should neutralize them.

## Not in scope

- The 150ms hover/focus micro-transitions (buttons, cards) are not the target here — they're fast, non-repeating-per-view, and not what `prefers-reduced-motion` users report as harmful. Leave them; the route's own filter (rule 4) already treats those as acceptable at that duration.

## Done means

- Manual check: enable "reduce motion" in OS/browser settings, reload the live site, confirm screen transitions and landing entrance animation no longer play (content still appears, just without the slide/fade).
- No new automated test required — this is a CSS-only, environment-conditional behavior; note the manual verification step in the PR instead.
