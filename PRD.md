# Entitlement Reconciliation & Status — PRD (Living Draft)

*Written in Simplified Technical English (short sentences, one idea per sentence, plain words). This helps everyone read it fast, including future readers who did not join the research sessions.*

**Status:** Living document. It grows every day. Do not treat any section as final until Day 9.

**Project:** CS-Product, Week 5, individual case study. Sector: Government / Public Sector, India.

**Assignment brief:** `Research/FINAL CASE STUDY C8.docx`. It is a 9-day build. Day 1 asks you to "pick your battlefield." Submission is due Sunday, 6 September.

---

## Changelog

| Date | What changed |
|---|---|
| 2026-08-28 | First draft. Added case summary, research summary, hypotheses, hypothesis validation status, problem statement, current-state journey, existing-solutions map, open questions. |
| 2026-08-28 | Split hypotheses (Section 5) and their validation table (Section 6) into Primary (1A/4A) vs. Backup (3A/1B) groups. Tagged every hypothesis as [Problem] or [Solution] — Problem hypotheses test whether the pain is real; Solution hypotheses already assume one specific fix and test whether that fix works. Made explicit that a failed Solution hypothesis does not kill the problem, only the current fix idea. |
| 2026-08-29 | Saved this working draft into the Obsidian vault for the first time. No content changes. |
| 2026-08-29 | Added Round 2 X/Twitter findings: a Telangana ration-card case with a 5-to-6-out-of-10 name-error rate; a verified anti-corruption arrest for a certificate bribe; a ₹40-vs-₹10,000 SAKALA bribe case; and CSC's official ₹50-per-complaint paid CPGRAMS filing service, which upgrades H4 and gives H5 its first real (if indirect) signal. Confirmed again, in Hindi this time too, that MGNREGA workers are not reachable through social media research. |
| 2026-08-29 | Added first real (in-person, general-public, not-yet-target-population) findings: people discover name mismatches across documents (birth certificate, passport) only at the moment they need the document, and respond by going to an agent rather than self-fixing. Gives H2 its first real signal, and H3 its first (negative-leaning) signal. Also noted a broader "no clear path to routine government offices" gap that reinforces Section 4's core insight, and an out-of-scope finding (no dedicated government job listings site). |
| 2026-08-29 | **Locked Candidate 1A/4A** as the final candidate. Tightened Section 7's problem statement to reflect the wider document scope (passports, birth certificates, not just welfare) and the self-fixability finding. Added Section 7a, a first-draft solution direction: a guided escalation generator built for proxy/assisted use, not solo self-service, centered on the strongest evidence found (H4, correctly-routed escalation). Deferred proactive "before you go" navigation to phase 2, out of the 9-day MVP scope. Checked off "finalize the candidate" and "scope the design surface" in Section 10. |
| 2026-08-29 | Added a short list of design references to Section 7a for the build phase: GOV.UK, Haqdarshak, MeitY's UX4G Design System, TurboTax's guided wizard flow, Estonia's e-Estonia/X-Road, and CPGRAMS itself as the "before" baseline. |
| 2026-08-29 | **Pivoted the locked candidate to a new Candidate 5A: an EPFO (Provident Fund) claim-rejection decoder.** Found while stress-testing 1A/4A's real-world usage risk: a proxy-first design fixed the tech-literacy problem for ration/wages, but a believable distribution path stayed unresolved. Researched EPFO instead — a claim-rejection rate risen from 13% to 34%, a brand-new "EPFO 3.0" rule (3-day settlement, 12% delay penalty), three active and reachable Reddit communities, and a real paid consultancy business (FinRight) already validating demand. Confirmed no existing tool decodes a rejection remark into a plain-language fix. Wrote new hypotheses H10–H13, locked EPFO as the new Section 7/7a, added a two-track test plan (Section 7c), and moved the full 1A/4A exploration to Appendix A for the record, rather than deleting it. New research file: `Research/EPFO Findings.md`. |
| 2026-08-29 | **Ran test-plan step 1** (Section 7b): checked the 5-code rule library against 15 real r/EPFOQueries cases. All 7 clean-match cases diagnosed correctly. Found 4 real gaps — no-reason-given cases, a portal-bug case masquerading as a data mismatch, a 3-times-repeated "approved but not credited" pattern, and a normal-wait-time case wrongly readable as broken. Grew the rule library to 6 codes (added "approved but not credited," decision confirmed with the user) and folded the other 3 gaps into existing codes as copy/logic refinements. Checked off the corresponding item in Section 10. Full detail added to `Research/EPFO Findings.md`. |
| 2026-08-29 | **Added a second entry point to the MVP: "Check before you file."** A proactive readiness check, run before the citizen files a claim rather than after a rejection. Reuses the entire existing rule library and the self-check checklist already built for the "no reason given" fallback — no new mechanism, unlike the similar proactive idea deferred for Candidate 1A/4A (which would have needed live government data access). Added **H14 — pre-filing blindness**, backed by a direct quote from FinRight's own "Myth Busting Monday" post confirming people check their PF status only once they need it, not before. |
| 2026-08-29 | **Designed the three testing refinements** found in test-plan step 1: a 7th "no reason given" option with a self-check fallback and a "demand the real reason" grievance output; a branching question that catches the portal sync-bug pattern before misdiagnosing it as a name mismatch; and a three-band wait-time check for the bank-KYC code. Researched the wait-time thresholds directly — found EPFO's own Citizen Charter PDF unreachable (404 on both domains, mid-EPFO-3.0-migration), so built the thresholds from converging secondary sources instead and flagged a primary-source recheck in Section 10, rather than presenting an unconfirmed number as settled. |
| 2026-08-29 | **Wrote the detailed rule-engine spec**, turning Section 7a's solution direction into a buildable decision-table spec: full input/state list, a rule table for all 7 diagnosis options with drafted plain-language copy, the H10 priority-ranking logic, H11 deadline/penalty pseudocode, H13's 5 grievance-text templates, the H14 pre-filing flow, and two Mermaid workflow diagrams. Also researched 5 reference products for this specific "plain-language rule engine" pattern (GOV.UK Smart Answers, IRS Interactive Tax Assistant, USA.gov Benefit Finder, NHS 111 Online, json-rules-engine), distinct from the general design references already in Section 7a. Both saved as new files under `Rule Engine/` and added to Section 11. Surfaced a few new open gaps while writing the spec (EPS discrepancy has no assigned priority tier; the EPFiGMS dropdown taxonomy was never actually captured) — added to Section 10. Project repo created at `github.com/krathod89/EPFO-Sahayak`; pushed as the initial commit. |
| 2026-08-29 | **Drafted volunteer-recruiting copy** for test-plan step 2 (Section 7b): a Reddit post (r/EPFOQueries, r/epfoindiahelp), a LinkedIn post, and a DM template for reaching out to authors of existing detailed rejection posts — all honest that no working app exists yet, framed as "share your case, get a free personal walkthrough now." Saved under `Volunteer Recruitment/`, referenced in Section 11. Not yet posted. **Also wrote a portable UI/UX design-generation prompt** for the build phase, covering the full decoder flow (both entry points), explicit anti-generic-template constraints, and the design references already gathered in Section 7a. Saved under `Design/`, referenced in Section 11. |
| 2026-08-29 | **Decided the MVP stays stateless — no login/signup.** Usage, events, and feedback are tracked anonymously by session ID instead, which needs no account. For the real revisit-after-a-day-or-two need this raised, added a **reference-code case-retrieval mechanism** (a tracking-number pattern, not a login) as a new named v2 item in Section 7a, alongside the already-deferred CPGRAMS escalation template — deliberately not folded into the MVP, since it turns the tool from stateless into one that retains PF-adjacent PII and needs an explicit retention policy first. Full login/signup was considered and rejected even for v2. |
| 2026-08-29 | **Built the backend + database groundwork.** Used the `new-product-route` skill, scoped to backend/DB only (design stays with the product owner). Stack decided: Next.js (App Router, TypeScript) + Prisma + Supabase Postgres + Vercel, chosen with the product owner. Added an `Engineering/` folder (spec, analytics plan, ADRs, one ticket per backend slice) alongside the existing `Rule Engine/` and `Research/` folders. Implemented the full rule engine from `Rule Engine/Rule Engine Spec.md` as pure, unit-tested TypeScript (all 7 codes, H10 priority ranking, H11 deadline/penalty, H13's 5 grievance variants, H14 readiness check), the `POST /api/diagnose` and `POST /api/events` endpoints, and the single `AnalyticsEvent` table — 81 tests passing, clean build and typecheck. A code-review pass caught and fixed 2 real logic bugs (a mutual-exclusivity check that missed Code 6 + Code 7 selected together with nothing else; duplicate codes in a selection not being rejected) and one real inconsistency in the Code 7 "issue found" path, now resolved and folded back into `Rule Engine/Rule Engine Spec.md` §9. Not yet deployed — provisioning Supabase/Vercel needs the product owner's own accounts (`Engineering/tickets/08-infra-deploy-setup.md`). |
| 2026-08-29 | **Moved analytics from a custom Postgres table to Mixpanel**, after the product owner created a Mixpanel project alongside the already-created Supabase one. Removed Prisma, `lib/db.ts`, and `POST /api/events` entirely — the MVP now has no database at all. Server-computed events fire from `POST /api/diagnose` via a new `lib/analytics.ts`; client-fired events will go straight to Mixpanel from the browser once the UI exists, using the same `session_id` as Mixpanel's `distinct_id`. The Supabase project is kept, unused, reserved for the v2 reference-code case-retrieval feature. Recorded as ADR 0004; ADRs 0001/0002 updated to point to it instead of describing the removed Postgres path. |
| 2026-08-30 | **Deployed the backend to Vercel and verified it live.** Pushed `backend-scaffold` and opened PR #1. Created the Vercel project (`rv-n/epfo-sahayak`), connected to the GitHub repo, with `MIXPANEL_TOKEN`/`NEXT_PUBLIC_MIXPANEL_TOKEN` set for Production and Preview. First production deploy succeeded; both entry points confirmed working against the live URL (`https://epfo-sahayak-pi.vercel.app`) — a pre-filing readiness check and a full post-rejection diagnosis-through-grievance flow, including a correctly flagged missed deadline and penalty citation. Closes `Engineering/tickets/08-infra-deploy-setup.md`. One open follow-up: unverified whether PR #1 itself gets an automatic preview build, since Git was connected after the branch was already pushed — needs a follow-up push to confirm. |
| 2026-08-30 | **Added an X/Twitter post** to the volunteer-recruiting set (Section 7b test-plan step 2): a 2-tweet thread, plus a note on replying into existing EPFO/PF complaint threads rather than only posting cold. Saved as `Volunteer Recruitment/Twitter Post.md`. Checked it against the live deploy first — the deployed site is still a backend-only placeholder page (no citizen-facing UI yet), so the post's framing ("no app yet, share your case for a free manual walkthrough") stays accurate. |
| 2026-08-30 | **Split test-plan step 2 (Section 7b) into two phases** and rewrote all four `Volunteer Recruitment/` drafts to match: Phase 1 (now) is a plain interest-gauge — no case details requested, just a yes/no on whether people would use the tool, tracked as a demand signal — instead of collecting real rejection remarks by hand before the app exists. Phase 2 (once the app ships) hands it to the Phase-1 list to test on their own real case themselves. Also dropped the specific "12% penalty" figure from all recruiting copy, since H11's exact eligibility conditions for the 3-day rule are still unverified (Section 10) and the rule itself is under two months old — kept the deadline-check claim generic instead of citing an unconfirmed number in public posts. |
| 2026-08-30 | **Designed and reviewed a full citizen-facing UI** in a standalone Figma Make prototype (Vite/React), then ported it into the real repo as the actual `app/page.tsx`, closing the "UI is being designed separately" placeholder. Along the way: fixed a P0 crash on the grievance screen (a conditional hook), moved the palette from warm cream to a cool-neutral ramp and the landing headings from Fraunces to Inter (matching GOV.UK/NHS-111/UX4G/Figma's own approach — full reasoning in two Impeccable critique passes, scored 28/40 then 32/40 after fixes), added a desktop-only "How it works" panel to the landing page, added screen-transition motion, fixed real accessibility gaps (contrast, missing ARIA roles), added localStorage resume-on-reload, and added client-side date validation (the native date input silently accepted mistyped future dates with no warning — a real correctness bug, not cosmetic). **Then integrated the reviewed UI with the actual backend**: removed the prototype's duplicate client-side rule engine entirely, wired the wizard to the real, tested `lib/rule-engine` via `POST /api/diagnose` (verified live against the real API, not mocked), wired client-side Mixpanel events (`session_started`, `entry_point_selected`, `grievance_copied`) via `lib/ui/mixpanel-client.ts`, using a per-browser `session_id` as both the API's session key and Mixpanel's `distinct_id`. Added Vitest tests for the two new pure UI helpers (date validation, session-id). One real behavior difference surfaced by wiring to the real API: the backend won't finalize grievance text until both UAN and Claim ID are filled in (`GrievanceOutput.ready === false` otherwise) — the grievance screen now asks for both up front instead of treating them as fully optional placeholders. 90 tests passing, clean typecheck and production build. Work done on a new `citizen-ui` branch (off `backend-scaffold`, not yet merged or pushed). |
| 2026-08-30 | **Merged both open PRs and deployed the citizen UI to production**, closing the new-product-route close-out (steps 7–10). A `code-review` pass on the `citizen-ui` diff (route step 7's gate) found and fixed 5 real issues before merging: a stale pre-filing readiness result shown after going back and editing a self-check answer, a fetch race condition where an older in-flight request could resolve after a newer one and overwrite it, a debounced grievance-text refetch that silently dropped a keystroke landing mid-request, a clipboard-copy failure that failed with no feedback to the citizen, and a date-validation gap where JS's Date parser silently rolled an out-of-range month/day into a different valid date (e.g. "2026-13-05" → 2027-01-05) instead of rejecting it. 92 tests passing after the fixes. Merged PR #1 (`backend-scaffold` → `main`) and PR #2 (`citizen-ui` → `main`). **Vercel's auto-deploy-on-merge did not trigger for the PR #2 merge** (it had fired correctly for PR #1, seconds after merging) — no deployment of any kind was created for that commit; deployed manually instead via `vercel --prod` from a tree confirmed identical to `origin/main`. Verified live: homepage serves the real UI (not the placeholder), both API entry points respond correctly including a correctly-computed missed-deadline case (87 days late) with the grievance withheld pending UAN/Claim ID, and the client bundle carries the Mixpanel SDK with `NEXT_PUBLIC_MIXPANEL_TOKEN` confirmed set in Production — though actual event delivery wasn't checked against Mixpanel's own dashboard this session (no dashboard/API access from here), worth a spot-check. Fixed `README.md`'s stale "Status" section and backend-only framing (PR #3), merged the same way. **Open follow-up, not yet resolved:** the Vercel auto-deploy gap is unexplained and could recur on the next merge — worth checking the project's Git integration settings (Production Branch, GitHub App permissions) in the Vercel dashboard. |

---

## 1. Case Summary

This case study asks for one citizen-facing product idea. The idea must come from a real government or public-sector problem in India. The idea must be small enough to design in 9 days. It must be deep enough to show real thinking.

We did secondary research first. We looked at four sectors: Identity & Documents, Municipal Services, Education, and Jobs/Employment. We found eight candidate problems. We picked one top candidate, locked it, and started designing a solution for it.

While stress-testing that solution, we found a real usage risk we could not design around cheaply. We researched a fifth candidate to test against the same risk, found it held up better, and pivoted. This PRD explains the current locked candidate (Section 7 onward) and keeps the earlier candidate's full research as Appendix A, since the work and the reasoning behind moving away from it are both worth keeping.

## 2. The Story

Meet Sukhdev. He is 64 years old. He works as a farm laborer in Barabanki, Uttar Pradesh. He depends on the public food ration system, called PDS, for rice and wheat every month.

One day, his fingerprint did not match at the ration shop. The machine rejected him three times. The shop owner could not give him his ration. Nobody told Sukhdev why the machine rejected him. Nobody told him what to do next.

Sukhdev did nothing wrong. His identity number, called Aadhaar, is real. His ration card is real. But the two records do not match each other well enough for the machine. This is not his fault. It is a data problem. But he pays the price for it.

Sukhdev lost three months of ration. That is 75 kg of grain. He found a fix only by accident, through a chain of lucky steps: retry the machine, ask for a face-scan instead of a fingerprint, write a complaint to the district office, attach a printout of his failed attempts, pay ₹125 to update his fingerprints, then wait for approval.

Nobody told Sukhdev this path existed. He had to find it himself.

This story is not rare. It repeats across food rations, wages, scholarships, and other benefits. It is also, we later found, not limited to rural and informal-sector citizens — it repeats in a different shape for salaried, formal-sector workers too. See Priya's story in Section 7.

## 3. Secondary Research Summary

We researched four sectors first. Full detail is in `Research/Initial Research.md`.

| Sector | Top candidate problem | Why it matters |
|---|---|---|
| Identity & Documents | Welfare exclusion from Aadhaar-seeding and biometric-authentication mismatches | Best-evidenced problem. A national study found 1.5 to 2 million people lost benefit access during one state's reform. |
| Jobs / Employment | MGNREGA wage-payment exclusion and delay | Best-sized problem. About 27.5% of all registered rural workers cannot use the required payment system (as of April 2025). |
| Education | Scholarship disbursement failure on the National Scholarship Portal (NSP) | Very recent. A December 2025 government audit found students lost scholarship money to fake institutions. Real students also wait years for payment. |
| Municipal Services | Grievance systems that close a complaint without fixing the problem | Real problem, but hard to reduce to one citizen product. Better suited to a government-employee-facing tool. |

**Our original top pick:** the Identity & Documents problem, tied with the MGNREGA wage problem — Candidate 1A/4A. We locked this candidate on 2026-08-29 (see Appendix A for the full record).

**A fifth candidate, found later:** while stress-testing 1A/4A's solution design, we ran a targeted research pass looking specifically for a problem with the same root cause but a more self-service-friendly population. This surfaced **Candidate 5A — EPFO PF claim rejection**, now the locked candidate (Section 7). Full detail is in `Research/EPFO Findings.md`.

**Backup picks, unchanged:** the NSP scholarship tracker (Candidate 3A) and the certificate delay problem (Candidate 1B). Kept as backups — see Appendix A.

## 4. The Key Insight: One Root Cause, Many Symptoms

Every government scheme keeps its own record of a person: Aadhaar, a bank account, a ration card, a job card, a UAN (Provident Fund) record, a school record. These records live in separate computer systems. The systems do not always agree with each other.

A small difference — a misspelled name, an old address, a worn fingerprint, an unmarked leaving date — breaks the match between two records. When the match breaks, the system denies or delays the person. It does not ask a human to check first.

No government tool tells the citizen, before the denial happens: "Your Aadhaar and your bank record do not match. Here is how to fix it." The person only learns about the mismatch at the moment of denial — at the ration shop, at the exam center, on payday, or when a Provident Fund claim comes back rejected.

This same root cause appears in welfare, wages, scholarships, exams, passports, private insurance, and — as EPFO research confirmed — Provident Fund claims for salaried workers. It is not limited to one kind of citizen. It hits a 64-year-old farm laborer and a salaried IT employee the same way, through the same broken mechanism. We give full detail in `Research/Initial Research.md`, `Research/Qualitative Research & Hypotheses.md`, `Research/Reddit Findings.md`, `Research/LinkedIn & Twitter Findings.md`, and `Research/EPFO Findings.md`.

The gap is not only reactive. In-person conversations (2026-08-29, general public) surfaced the same gap from a proactive angle: people also have no clear path for *routine* government tasks they start themselves, such as updating an Aadhaar record. This is the same underlying gap — an invisible process made visible only through luck or an agent — showing up before a denial, not just after one. (This proactive angle stayed out of scope for the current candidate too — see Section 7a.)

## 5. Hypotheses

**Candidate 5A (EPFO) is now locked** (see Section 7). Candidate 1A/4A was locked earlier, explored in depth, and moved to Appendix A after this pivot. Candidates 3A and 1B stay as backups.

Each hypothesis is tagged as one of two kinds. This tag matters — the two kinds fail differently.
- **[Problem]** — a claim about whether the pain is real, and shaped the way we think it is. If a Problem hypothesis fails, the problem itself is wrong or different than we thought.
- **[Solution]** — a claim that already assumes one specific fix, and tests whether that fix would work. If a Solution hypothesis fails, the problem can still be 100% real — we just have to design a different fix for it.

### Locked — Candidate 5A, EPFO PF claim rejection (testing now)

- **H10 — Priority-confusion gap. [Problem]** When EPFO shows more than one rejection reason at once, most citizens do not know which one actually blocks their claim, and fix the wrong one first, wasting a refiling attempt.
- **H11 — Deadline-awareness gap. [Problem]** Citizens do not know EPFO has a legal settlement deadline (3 days for a complete-KYC claim, 20 days otherwise), or that a missed deadline entitles them to a 12% penalty.
- **H12 — Self-service viability. [Solution]** This assumes the affected citizen — a salaried, literate, formal-sector worker — can use a self-service, plain-language decoder directly, without needing a proxy.
- **H13 — Auto-generated grievance value. [Solution]** This assumes a pre-filled, correctly-worded EPFiGMS grievance gets a better or faster result than a citizen's own free-text description.
- **H14 — Pre-filing blindness. [Problem]** Citizens do not check their own KYC, Date of Exit, or EPS status before filing a claim, even though they could — they file "blind" and discover problems only after rejection.

### Backup — Candidate 3A, NSP scholarships (only if we switch again)
- **H6 — Status misread. [Problem]** Students read "payment sent" as "money is in my account." This is often false. The two events are separate steps.
- **H7 — Self-diagnosable majority. [Problem]** Many "stuck" scholarship cases are simple mismatches. A smaller group are real fraud cases that need police-level action.

### Backup — Candidate 1B, certificate delay (only if we switch again)
- **H8 — Deadline-right awareness. [Problem]** Applicants do not know their state sets a legal deadline for issuing a certificate. They do not know they can escalate a late certificate.
- **H9 — Bribe as information, not just corruption. [Solution]** This assumes the fix is giving away the same information a tout sells. It asks: do people pay a tout for speed alone, or partly just to learn who to call and what to say?

*(H1–H5, written for Candidate 1A/4A, are kept in Appendix A along with their validation record.)*

## 6. Hypothesis Validation Status

We have not yet run real interviews with EPFO-affected citizens. That step comes next (Section 7c). Until then, we treat the findings below as **supporting signal**, not proof.

### Locked hypotheses (Candidate 5A — EPFO)

| Hypothesis | Kind | Status | Evidence so far | Source |
|---|---|---|---|---|
| H10 (priority-confusion gap) | Problem | **Strong signal** | A PF consultancy (FinRight) runs a recurring public post specifically teaching people to "fix the primary blocker first" when EPFO shows two rejection reasons — a post that would not need to exist if this confusion were rare. A real citizen also reported "EPFO claim got rejected with wrong reason," showing the stated reason itself is not always trustworthy at face value. | Reddit (r/EPFOQueries) |
| H11 (deadline-awareness gap) | Problem | **Supporting signal, inferred** | EPFO's 3-day/12%-penalty rule is barely two months old (live since 3 July 2026); multiple explainer sites had to publish guides just to cover the new deadline, and no citizen post found references anyone actually claiming the 12% penalty. This suggests the entitlement exists but is unclaimed — inferred, not yet a direct citizen quote saying "I didn't know." Needs direct confirmation in live testing. | News coverage, absence of claims in Reddit search |
| H12 (self-service viability) | Solution | **Supporting signal** | The affected population is demonstrably literate and online: three active, detailed, technical subreddits, including NRI members managing PF remotely. This is behavioral evidence of digital competence, not yet a direct test of whether they would use our specific tool. | Reddit (r/EPFOQueries, r/epfoindiahelp, r/EPFO) |
| H13 (auto-generated grievance value) | Solution | **Not yet tested** | No existing tool does this today (see Section 9), so no natural comparison exists yet. This is exactly what the two-track test plan (Section 7c) is designed to check. | — |
| H14 (pre-filing blindness) | Problem | **Strong signal** | FinRight's own "Myth Busting Monday" post states the pattern directly: *"Most people check their KYC only when they actually need their PF. That is usually when a small mismatch becomes a big headache."* A business built around fixing this problem is telling its own audience they check too late. | Reddit (r/EPFOQueries) |

**Read this table plainly:** all three Problem hypotheses now have real signal — H10 and H14 are directly quoted from real sources, H11 is inferred rather than directly quoted and is worth a direct question in live testing. Both Solution hypotheses about *who* the user is (H12) and *whether the proxy population even exists* look supportable from behavior already observed. The one hypothesis that decides whether this product actually helps anyone (H13) is completely untested — this is the load-bearing one, and Section 7c exists specifically to test it before we build further.

### Backup hypotheses (Candidates 3A and 1B — unchanged)

| Hypothesis | Kind | Status | Evidence so far | Source |
|---|---|---|---|---|
| H8 (deadline-right awareness, Candidate 1B) | Problem | **Strong signal** | A Karnataka student's income certificate was calculated wrong by a local official. The student asked, in public, "what rule can I quote to fix this?" This is the exact information gap H8 predicts. | Reddit |
| H6 (status misread, Candidate 3A) | Problem | **Strong signal** | A state minister had to publicly explain that "payment sent" does not mean "payment received," after being flooded with public questions. Students had no other way to learn this. | X (Twitter) |
| H9 (bribe as information, Candidate 1B) | Solution | **Supporting signal** | RTI-India's own social media account gives out free ready-made complaint templates. This shows real, unmet demand for "the right words to say," which is what H9 claims people sometimes pay for. | X (Twitter) |
| H7 (self-diagnosable majority, Candidate 3A) | Problem | **Not yet directly tested** | Needs a sample of real "stuck" scholarship cases sorted by cause. | — |

*(The full 1A/4A validation record — H1 through H5 — is kept in Appendix A.)*

## 7. Problem Statement (Locked, 2026-08-29 — Candidate 5A, EPFO)

Meet Priya. She is a salaried IT employee who left one employer to join another. She filed Form 19 to withdraw her Provident Fund balance from the old employer. EPFO rejected it.

The rejection remark said her "Date of Exit" was not marked. Priya did not do anything wrong — her old employer simply never recorded her last working day in EPFO's system. EPFO also had, by law, only 3 days to settle her claim if her KYC was complete. It missed that deadline. Priya did not know this deadline existed, or that EPFO owed her a 12% penalty for missing it. She also did not know whether to chase her old employer, correct her own record, or file a grievance — or in what order.

**Candidate 5A is now the locked candidate.** Reason: it shares 1A/4A's exact root cause (records that disagree with each other), but resolves the biggest open risk we found while designing 1A/4A's solution — a believable direct-usage path. EPFO's affected population is salaried, literate, and already online in large numbers (Section 6, H12). The rule set is bounded (a known, short list of rejection codes, not an open document-matching problem across many schemes and states). No existing tool solves this today (Section 9). Residual risk: H13, the hypothesis that decides whether an auto-generated grievance actually helps, is still fully untested — the test plan in Section 7c exists to close this gap before further build investment.

> A salaried citizen who is legally owed their own Provident Fund money can have their withdrawal claim rejected or delayed by EPFO. The stated cause is usually a small, real mismatch or missing detail — a name spelled differently across records, an unmarked exit date, an unverified bank account — but EPFO's own remark is often jargon, sometimes shows two reasons at once with no priority order, and occasionally states the wrong reason outright. EPFO also owes the citizen a fast, legally set settlement time and a real penalty when it misses that time, but almost nobody knows this. Left to figure it out alone, the citizen either refiles the wrong fix, waits without acting, or pays a consultant to do what should be a simple, free lookup.

This is not a policy problem. The 3-day deadline, the 12% penalty, and every rejection code already exist in EPFO's own rules. This is a **design problem**: translating a jargon-heavy, sometimes-confusing system remark into plain language, telling the citizen exactly what to fix first, and generating the correctly worded next step.

## 7a. Solution Direction (Locked — EPFO Decoder)

A **self-service PF-claim tool with two entry points**: decode a rejection that already happened, or check readiness before filing at all. Unlike Candidate 1A/4A's design, this one is built for the citizen to use directly — no proxy needed, because the affected population can realistically self-serve (H12).

1. **Plain-language diagnosis, covering 6 common rejection/failure codes.** The citizen selects the remark closest to what their EPFO claim status shows: name/DOB/father's-name mismatch, Date of Exit not marked, bank KYC/mismatch, EPS (pension) discrepancy, an old claim still pending, or **approved but the money never arrived** (added after test-plan step 1 — see below). The tool explains, in plain words, what it means and why it is not the citizen's fault. Also handles three refinements found in testing:
   - **A 7th selectable option, "I don't see a reason,"** for when EPFO shows no remark at all. This walks the citizen through checking the other 6 codes by hand against their own portal pages. If every check comes back clean, the tool generates a grievance that explicitly asks EPFO to state the actual rejection reason — an honest output, not a guessed diagnosis.
   - **A branching question on the name/DOB-mismatch code**: "Does your KYC page already show this detail as Approved and Verified?" If yes, this is very likely the portal sync-bug pattern (KYC page correct, claim screen still disagrees), not a real mismatch — the tool tells the citizen not to file a Joint Declaration for data that is already correct, and instead wait 24–48 hours or raise a grievance with screenshots of both screens.
   - **A three-band wait-time check on the bank-KYC code**, since "pending" is not always "stuck": 0–7 working days since submission reads as normal, 8–15 as worth checking on but not yet stuck, and beyond 15 as genuinely stuck — the 15-day cutoff comes from an actual EPFO rule (Field Offices can seed KYC directly if an employer hasn't within 15 days), not just an average. **This threshold is built from secondary sources only — EPFO's own Citizen Charter PDF 404'd on both domains during this research, mid-migration. Needs a recheck against the primary document once EPFO's site stabilizes**, before this ships in the final build.
2. **A priority check when more than one reason shows (answers H10).** If EPFO lists two rejection reasons, the tool ranks them by which one actually blocks payment first (bank KYC and mismatches block payment outright; a pending old claim or missing exit date blocks eligibility first) and tells the citizen which to fix first.
3. **A deadline and penalty check (answers H11).** The citizen enters the date they filed. The tool checks this against EPFO's own 3-day (complete KYC) or 20-day rule, and tells the citizen if EPFO has already missed its own deadline — and that a 12% penalty applies when it has.
4. **An auto-generated, ready-to-paste EPFiGMS grievance (answers H13 — untested, being validated now).** Pre-filled with the citizen's UAN, claim ID, the selected rejection code, and — where the deadline was missed — a citation of the missed deadline and the interest owed. Delivered as text the citizen copies straight into the EPFiGMS form, since this population self-files rather than needing a printable/shareable format.
5. **A second entry point: "Check before you file" (answers H14 — new).** Runs the same 5 checks that power the rejection decoder — Date of Exit marked? KYC verified, not just approved? Name/DOB/father's-name consistent across records? EPS history continuous? Any old claim still pending? — but *before* the citizen files, using the exact same explanations and fix steps already written for each code. ("Approved but not credited" is excluded here, since it can only happen after filing.) This is not a new build: it reuses the entire rule library and the self-check checklist already designed for the "no reason given" fallback (item 1) — just moved to the front of the flow as its own path, instead of only appearing after a rejection. If everything checks out, the tool says so plainly, framed as a readiness check based on what the citizen reports, not a guarantee — the tool has no live access to actually inspect their EPFO record.
6. **Only the first-level EPFiGMS grievance is in the 9-day MVP.** A second-level CPGRAMS escalation template (used when EPFiGMS itself is unresolved past 30 days) reuses the same generator and is a fast, obvious v2 addition — not required to prove the core idea.
7. **The MVP stays stateless — no login, no saved cases.** Each visit is a fresh session: no password, nothing stored once the tab closes, no account needed to use the tool — matching every reference product in Section 7a's own design-reference list, none of which require login for a single session. Usage and feedback are still tracked, but anonymously: a per-session ID (no identity attached) tags events — which code was selected, the deadline-check result, whether the grievance text was copied — and an in-flow "was this helpful?" prompt is tied to that same anonymous session, not to an account.
8. **Explicitly deferred to v2 — named, not silently dropped** (same treatment as item 6's CPGRAMS template):
   - **The CPGRAMS escalation template** above.
   - **A reference-code case-retrieval mechanism**, so a citizen can revisit their diagnosis after a day or two without re-entering everything. On completion, the tool would show a short code — the same trust pattern as an EPFiGMS/CPGRAMS tracking number (Section 9), not a login — and store the case (rejection remark, filing date, and any UAN/claim ID entered) keyed to that code. Kept out of the MVP on purpose: it turns the tool from fully stateless into one that retains PF-adjacent PII, which needs an explicit retention/deletion policy decided before it ships, not folded in silently. Full login/signup was considered and rejected even for v2 — a reference code gets the same revisit benefit without the added weight of accounts (password/OAuth, recovery flows, more PII surface than the tool otherwise touches).

This is a genuine gap in the market, confirmed by direct research (Section 9) — no static article, balance-checking app, or government portal does this personalization today. The closest existing service is a paid human consultant.

## 7b. Test Plan

Two separate things need testing, and they do not need the same method.

1. **Does the decoder give the right answer? — Done, 2026-08-29.** Sampled 15 real cases from r/EPFOQueries against the rule library. All 7 cases that matched one of the 5 original codes got the correct diagnosis — no wrong or harmful output. Found 4 real gaps: a "no reason given at all" case, a portal-bug case that looks like a data mismatch but isn't, an "approved but never credited" pattern that showed up 3 separate times, and a "still within normal wait time" case wrongly readable as broken. The first, second, and fourth are folded into the existing codes as refinements. The third is common and structurally cheap to add, so it became a 6th code (Section 7a). Full detail in `Research/EPFO Findings.md`.
2. **Do real affected people find the output clear and useful?** This needs live volunteers, but recruiting is realistic here, unlike MGNREGA. Split into two phases rather than collecting case details by hand before the app exists:
   - **Phase 1 (now) — gauge interest, build a list.** Post in r/EPFOQueries, r/epfoindiahelp, LinkedIn, and X asking a plain yes/no: would this be useful? No case details requested — just who wants to be notified when it's ready. Track replies/DMs as a demand signal. Copy in `Volunteer Recruitment/`.
   - **Phase 2 (once the app is ready) — real usage test.** Hand the finished app to the people who said yes in Phase 1, and let them run their own real case through it themselves — this matches how the community already engages with FinRight's content, and produces real usage feedback, not just stated opinions, without the builder ever handling anyone's claim details by hand.

Run test 1 before test 2 — no reason to show a real citizen a decoder that has not yet been checked against real historical cases.

## 8. Current State — What Happens Today (EPFO)

1. The citizen files a Provident Fund claim (Form 19, 10C, or 31) on the EPFO portal after leaving a job.
2. EPFO's system checks the claim against Aadhaar, UAN, bank, and employer records.
3. A mismatch, a missing detail, or an unmet condition causes a rejection or a delay.
4. EPFO shows a remark in the "Track Claim Status" tab — but it is often jargon, sometimes shows two reasons at once, and occasionally states the wrong reason outright.
5. The citizen does not know EPFO had a legal deadline to settle the claim (3 or 20 days), or that a missed deadline earns a 12% penalty.
6. The citizen refiles, often fixing the wrong problem first if two reasons were shown, wasting another filing cycle.
7. If the first-level grievance (EPFiGMS) does not resolve it, the citizen must know to escalate to CPGRAMS — a second, separate portal — and few know this ladder exists.
8. Some citizens give up. Some pay a PF consultant to do what is, in most cases, a simple lookup and a correctly worded grievance.

## 9. How It Is Solved Today (EPFO)

Checked directly against real pages, not assumed:

| Type | Examples | What it does | What it lacks |
|---|---|---|---|
| Static explainer articles | epfo.app, CitizenNest, Kustodian, ClearTax, Kotak Life, RTI Wiki | Lists common rejection reasons and generic fixes | No personalization — the reader must self-match their case to the list |
| Balance/passbook utility apps | Several Play Store apps | Balance check, passbook download, claim-status tracking | Never interprets *why* a claim was rejected |
| Government filing portals | EPFiGMS, UMANG, CPGRAMS | Category dropdown, free-text description box, routing, a tracking number | No diagnosis, no plain-language explanation, no pre-written text |
| Paid human consultants | FinRight (17,500+ cases handled) | A real person reviews the specific case and advises, for a fee | Not self-service, not a scaled product |

**The gap, stated simply:** no existing tool takes a citizen's exact rejection remark and filing date, and returns a personalized plain-language diagnosis, a fix-priority order, a deadline/penalty check, and ready-to-paste grievance text. Full detail, including the exact pages checked, is in `Research/EPFO Findings.md`.

## 10. Open Questions and Next Steps

- [x] **Finalize the candidate.** Locked as Candidate 5A (EPFO) on 2026-08-29, after exploring and moving away from Candidate 1A/4A. See Section 7 and Appendix A.
- [x] **Run test-plan step 1.** Done 2026-08-29 — 7/7 clean matches correct, 4 real gaps found, rule library grown from 5 codes to 6. See Section 7b and `Research/EPFO Findings.md`.
- [ ] **Run test-plan step 2, Phase 1:** post the interest-gauge copy (no case details requested) to start a waitlist, now that step 1 has passed. Copy is drafted and ready to post — see `Volunteer Recruitment/`.
- [ ] **Run test-plan step 2, Phase 2:** once the app is ready, hand it to the Phase-1 waitlist and let them test their own real case themselves.
- [x] **Merge and deploy `citizen-ui`, and fix `README.md`'s stale "Status" section.** Done 2026-08-30 — see the changelog entry above. Live at `https://epfo-sahayak-pi.vercel.app`. Phase 2 (below) can now start.
- [ ] **Diagnose why Vercel's auto-deploy-on-merge didn't trigger for the PR #2 merge**, found while shipping the item above — check the Production Branch and GitHub App permission settings in the Vercel dashboard, so the next merge doesn't need a manual `vercel --prod` workaround.
- [ ] **Spot-check Mixpanel's own dashboard/Live View** to confirm the client-fired events (`session_started`, `entry_point_selected`, `grievance_copied`) are actually landing in production, not just that the SDK is present in the deployed bundle with a token set.
- [ ] **Write the user stories and analytics plan** for the Section 7a solution direction.
- [ ] **Verify before final citation:** the 34% (2022-23) EPF rejection-rate figure against EPFO's own annual report or a parliamentary reply; the exact eligibility conditions for the new 3-day settlement rule, once EPFO publishes a formal circular (the rule is under two months old and details may still be settling).
- [ ] **Re-check the bank-KYC wait-time thresholds (0–7 / 8–15 / 15+ working days) against EPFO's own Citizen Charter once reachable** — it 404'd on both `epfindia.gov.in` and `epfo.gov.in` during this research, mid-EPFO-3.0-migration. Currently built from secondary sources only.
- [ ] **Decide, once test-plan results are in:** whether to also build the second-level CPGRAMS escalation template in the 9-day window, or keep it as a named v2 addition.
- [ ] **Assign a priority tier to the EPS-discrepancy code**, found while writing `Rule Engine/Rule Engine Spec.md` — the source material doesn't place it in the H10 priority ranking the way it does the other 5 codes.
- [ ] **Capture the actual EPFiGMS category/subcategory dropdown taxonomy** before building the grievance generator — the H13 templates in `Rule Engine/Rule Engine Spec.md` assume free-text fields; if EPFiGMS requires picking from fixed dropdown categories, the generator needs to map each code to the right dropdown value, not just draft prose.
- [ ] **Provision Supabase + Vercel and deploy the backend** — code is built and tested locally (`Engineering/tickets/08-infra-deploy-setup.md`), but needs the product owner's own accounts to actually go live and be verified in production.

**Out-of-scope finding, logged for awareness only:** in-person conversations (2026-08-29) surfaced a wish for a dedicated government job listings site. Not pursued — it is a job-*discovery* problem, distinct from every shortlisted candidate.

## 11. Source Documents

This PRD is a summary. Full backing detail lives in these files, in the same project folder:

- `Research/Initial Research.md` — the four-sector desk research.
- `Research/Qualitative Research & Hypotheses.md` — the first-hand-evidence pass and the original nine hypotheses.
- `Research/Reddit Findings.md` — two rounds of real citizen stories found on Reddit (Candidate 1A/4A).
- `Research/LinkedIn & Twitter Findings.md` — real cases and expert commentary found on LinkedIn and X (Candidate 1A/4A).
- `Research/EPFO Findings.md` — the EPFO research backing Candidate 5A: scale, rejection codes, the escalation ladder, the EPFO 3.0 deadline/penalty rule, real citizen threads, and the competitive-landscape check.
- `Rule Engine/Rule Engine Spec.md` — the buildable decision-table spec for the rule engine described in Section 7a: full rule table, priority/deadline/grievance/pre-filing logic, and two Mermaid workflow diagrams.
- `Rule Engine/Rule Engine Design References.md` — 5 reference products for this specific rule-driven, plain-language decision-engine pattern (GOV.UK Smart Answers, IRS Interactive Tax Assistant, USA.gov Benefit Finder, NHS 111 Online, json-rules-engine), separate from the general design references already listed in Section 7a.
- `Volunteer Recruitment/` — Reddit post, LinkedIn post, X/Twitter post, and a DM template for recruiting the 5–8 live volunteers needed for test-plan step 2 (Section 7b).
- `Design/UI-UX Design Prompt.md` — a portable prompt for generating high-fidelity UI/UX screens for the build phase, covering both entry points' full flow and explicit constraints against a generic/templated look.
- `Engineering/spec.md`, `Engineering/analytics.md` — the backend/DB user stories and event-tracking plan, both scoped from Section 7a.
- `Engineering/ADR/` — architecture decisions for the backend build: stack/hosting choice, the stateless-MVP database shape, and why rule content lives in code rather than a database.
- `Engineering/tickets/` — the backend/DB build broken into one ticket per slice (rule engine, priority/deadline/grievance/readiness logic, the two API endpoints, infra provisioning).
- `README.md` — how to run the backend locally, its API surface, and current build status.

---

## Appendix A — Candidate 1A/4A: Explored in Depth, Not Selected

Kept in full for the record. This candidate was locked on 2026-08-29, designed in detail, and moved away from the same day after stress-testing surfaced a usage risk we could not resolve as cheaply as the EPFO alternative. The research and reasoning below are real work, not a discarded draft — Section 7's EPFO pivot exists *because* of what this exploration found.

**Why we moved away from it:** the locked solution (a guided escalation generator for ration/wage denials) required a proxy — a family member, or ideally a Common Service Centre operator — because the affected population (rural, older, lower digital access) could not realistically self-serve. A proxy-first design fixed the tech-literacy problem in principle, but left a harder, unresolved question: a believable path for that proxy population to actually discover and adopt the tool. EPFO's population does not have this problem — it can self-serve directly. Candidate 1A/4A is not disproven as a real problem; it remains a strong, well-evidenced candidate if a distribution path (e.g., a partnership with the CSC network) becomes available later.

### Hypotheses (H1–H5)

- **H1 — Awareness gap. [Problem]** Most affected people do not know the exact reason for their denial. They think it is random.
- **H2 — Timing gap. [Problem]** People find out about the mismatch only at the moment of denial. They never check their record status before that moment.
- **H3 — Self-fixability. [Solution]** This assumes the fix is a self-service guided correction. It asks: can a citizen, or a literate helper, actually fix the mismatch alone, if we give them clear steps?
- **H4 — Escalation-script value. [Solution]** This assumes the fix is an auto-generated, correctly-worded complaint. It asks: does a citizen who gets one actually get a faster result than a citizen who writes their own?
- **H5 — Real user is a proxy. [Solution]** This assumes we must pick one specific person to design for. It asks: is that person the affected citizen, or is it a family member, a local helper, or a community worker acting for them?

### Hypothesis validation status

| Hypothesis | Kind | Status | Evidence so far | Source |
|---|---|---|---|---|
| H1 (awareness gap) | Problem | **Strong signal** | Many Reddit posts show people confused about *why* their document, exam entry, or payment failed. Most did not know the exact cause until they dug deep. | Reddit (r/LegalAdviceIndia) |
| H4 (escalation-script value) | Solution | **Strong signal** | One citizen's Aadhaar-unlock request was closed as "fixed" twice by normal channels, with nothing actually fixed. It was solved in days once filed through the correct channel (CPGRAMS), worded correctly. Common Service Centres now formally charge ₹50 to file a CPGRAMS complaint correctly on a citizen's behalf. | Reddit, X |
| H2 (timing gap) | Problem | **First real signal** | In-person conversations: people only discover a name mismatch between documents (e.g. birth certificate vs. passport) at the moment they are filling out or submitting one of those documents — not before. From general public, not yet target population. | In-person (general public) |
| H3 (self-fixability) | Solution | **First signal, negative-leaning** | Same conversations: on discovering the mismatch, people did not attempt a self-service fix. They went straight to an agent. | In-person (general public) |
| H5 (real user is a proxy) | Solution | **Supporting signal, upgraded** | A second, direct example (beyond the CSC's official ₹50/complaint service) of people routing a document-mismatch problem through an agent rather than fixing it themselves. | In-person (general public), X |

**New finding, not in the original hypotheses:** the same root problem also blocks people outside welfare — in competitive exams, passports, job background checks, private health insurance claims, and even voter rolls. Full detail in `Research/Reddit Findings.md` and `Research/LinkedIn & Twitter Findings.md`.

**New scale data point:** a documented Telangana case found that in some areas, new ration cards had wrong details on **5 to 6 out of every 10 names issued** — caused by staff copying Aadhaar addresses straight into the ration record without checking them.

### Problem Statement (as locked, 2026-08-29)

> A citizen who is legally owed a government benefit or document — a ration, a wage, a scholarship, entry to an exam, or a corrected identity document like a passport or birth certificate — can be silently denied it. The cause is a small mismatch between two government records that describe the same person, such as a name spelled two different ways. The citizen almost never learns about the mismatch until the moment they need it — at the ration shop, on payday, or while filling out a new form. A rule or process to fix the mismatch usually already exists. But the citizen does not know the rule exists, does not know the steps, and front-line staff often do not apply the rule correctly. Left to fix it alone, most citizens cannot — they pay an agent, or they give up. The result: an eligible person loses money, time, or an opportunity, for a mistake that is not theirs.

### Solution Direction (as drafted)

A guided escalation generator, built for a proxy (family member, CSC operator, local helper) as often as for the citizen directly:

1. **Plain-language mismatch diagnosis (answers H1).** Citizen or helper enters what they see on two documents/records. The tool names the exact mismatch.
2. **Correctly-routed, correctly-worded complaint (answers H4).** Auto-generates a CPGRAMS-formatted complaint under the right category, citing the exception rule that excuses the situation.
3. **Built for assisted use, not solo use (answers H3, H5).** Output is printable and shareable (e.g. over WhatsApp).
4. **Proactive "before you go" checks deferred to phase 2**, out of the 9-day scope.

Design references gathered for the build phase: GOV.UK (tone, form patterns), Haqdarshak (closest real-world analog — assisted-entitlement access via field agents), MeitY's UX4G Design System (component/token trust cues), TurboTax's guided wizard flow (the Q&A-to-document mechanic), Estonia's e-Estonia/X-Road (conceptual only), CPGRAMS itself (the honest "before" baseline).

### Current State — What Happens Today

1. The citizen applies for, or shows up to collect, a benefit they are legally owed.
2. A machine or a clerk checks their identity against a second record.
3. The two records do not match closely enough. The system rejects the citizen.
4. Nobody explains the exact reason. The citizen sees a vague message, or none at all.
5. The citizen does not know an official exception rule may already excuse this exact situation.
6. The citizen tries the normal complaint channel. It often closes the complaint as "resolved" without fixing anything.
7. Only a persistent, well-connected, or lucky citizen finds the correct escalation path. This can take weeks or months.
8. Most citizens give up, or pay a tout or agent to solve it for them.

### How It Is Solved Today

- **Government tools:** NPCI's BASE (Aadhaar-bank seeding), UIDAI's myAadhaar/mAadhaar, DigiLocker, CPGRAMS.
- **Manual rules that exist but are not well known:** a citizen cannot legally be denied ration only for a failed fingerprint scan; NTA's "Non-Aadhaar Candidate" exam fallback form, often ignored by invigilators.
- **Civil-society workarounds:** Lib Tech India's data trackers, RTI Wiki's escalation guides, RTI-India's free complaint templates.
- **A paid government-run workaround:** Common Service Centres charge ₹50 to file a CPGRAMS grievance correctly on a citizen's behalf.
- **International reference:** Estonia's X-Road — no Indian equivalent exists.
- **The gap:** every fix exists somewhere. No single tool puts them in front of the citizen at the moment they need it, before the denial happens.

### Remaining open items for this candidate, if revisited later

- The 5–8 target-population interviews (MGNREGA/PDS-affected citizens) were never run.
- Unverified figures needing a primary-source check before any future use: the Policy Circle figure (20.3 million Aadhaar failures/month), the AISHE figure ("1 in 4 EWS applicants miss a deadline"), the West Bengal Annapurna Yojana figure ("17 lakh rejections"), and the Telangana "5 to 6 out of 10 names wrong" figure.
- MGNREGA-dependent workers remain unreachable via Reddit, LinkedIn, or X (confirmed across three passes, English and Hindi) — field interviews or Lib Tech-style networks would be the only path left, if this candidate is revisited.
