# Rule Engine Design References

Additional design/architecture references for the EPFO claim-rejection decoder (Section 7a of the PRD), gathered specifically to fill gaps the existing reference list (GOV.UK, Haqdarshak, MeitY UX4G, TurboTax, Estonia X-Road, CPGRAMS) doesn't cover: a named government pattern for exactly this Q&A-to-outcome mechanic, a live tax-specific guided-diagnosis tool, a benefits-eligibility guided questionnaire, a clinical symptom-checker as a UX/logic analog, and an open-source architecture reference for the rule-matching engine itself. Every URL below was fetched and confirmed live before inclusion.

## 1. GOV.UK Smart Answers

**URL:** https://docs.publishing.service.gov.uk/apps/smart-answers.html (architecture) and https://gds.blog.gov.uk/2012/02/16/smart-answers-are-smart/ (design rationale)

This is the specific GOV.UK pattern — not the general GOV.UK brand already on the reference list — for exactly the mechanic this product needs: a Flow made of Question pages and Outcome pages, where content designers and developers jointly encode "if this then that, except when that" policy logic into a decision tree that hides the underlying complexity from the citizen. The maternity-pay example is the closest published analog to the EPFO decoder: a citizen enters a few facts (due date, employment status, income) and the tool silently applies statutory rules to produce a plain-language result, instead of making them read the rule text themselves. Directly useful as an information-architecture template for the diagnosis flow (landing page -> question pages -> outcome page) and as a case for how to encode legal deadline/eligibility logic without exposing the underlying statute.

## 2. IRS Interactive Tax Assistant (ITA)

**URL:** https://www.irs.gov/help/ita

A live, government-run guided-diagnosis tool with a bounded rule set per topic (filing status, dependents, credits, deductions) — structurally the closest real analog to "citizen picks a topic, answers a short branching Q&A, gets a personalized plain-language determination" that the EPFO decoder needs to replicate for rejection codes. It's also a useful boundary case to study: it answers questions and states eligibility, but (like the EPFO decoder should not overreach into legal advice) explicitly does not file anything on the citizen's behalf — worth studying where ITA draws that line versus where the EPFO tool intentionally goes further (auto-generating the grievance text).

## 3. USA.gov Benefit Finder

**URL:** https://www.usa.gov/benefit-finder

A guided-questionnaire benefits-eligibility matcher run by a national government, organized around life events (disability, bereavement, retirement) rather than program names — the same "meet the citizen where their situation is, not where the bureaucracy's taxonomy is" framing the EPFO decoder should use (matching on the rejection remark the citizen actually sees, not the internal EPFO code). Useful as a reference for the entry-point design ("Check before you file" vs. "decode a rejection") and for how to present a short list of matched outcomes rather than a single forced answer when more than one condition could apply — directly relevant to the H10 priority-confusion problem (multiple rejection reasons shown at once).

## 4. NHS 111 Online (symptom checker)

**URL:** https://111.nhs.uk/

The canonical symptom-checker UX pattern: a rule-based, clinically-reviewed branching flow that explicitly does not diagnose but instead routes the person to the right next action ("111 online will not give you a diagnosis, but we will direct you to the best place to get help for your symptoms"). This is the strongest cross-domain analog for the EPFO tool's own honest framing — it diagnoses a system remark, not a legal case, and its job is to route the citizen to the correct next step (self-check, refile, or grievance), not to adjudicate their claim. The self-imposed scope boundary (no diagnosis, only triage/routing) is a useful model for how the EPFO decoder should word its own outcome pages, especially the "I don't see a reason" fallback and the "approved but not credited" path where the tool genuinely cannot know what's wrong.

## 5. json-rules-engine (open-source architecture reference)

**URL:** https://github.com/CacheControl/json-rules-engine

A lightweight, widely-used JavaScript rules engine where rules are plain JSON (conditions + facts + events), not hard-coded if/else — directly relevant as a build-architecture reference for the EPFO decoder's 6-code (soon 7-with-fallback) rule library. Two things make it a genuinely useful build reference rather than a generic tool citation: (1) it models exactly the "multiple conditions can match, and results need priority resolution" shape the decoder needs for H10 (ranking which of two shown rejection reasons blocks payment first), via its "all"/"any" nested condition composition; and (2) keeping rules in data (JSON) instead of code means the 9-day MVP's rule library — and future additions like the deferred CPGRAMS escalation tier — can be edited and extended without touching the Q&A flow logic, which matters given the PRD's own open item to re-verify wait-time thresholds once EPFO's Citizen Charter is reachable again.
