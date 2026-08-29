# Government/Public Sector Product-UX Case Study: Problem Landscape Across Four Sectors (India)

## TL;DR
- The single strongest, most build-ready problem is **welfare/document exclusion caused by Aadhaar-seeding and biometric-authentication mismatches** — it is heavily evidenced (a randomized study found 1.5–2 million legitimate beneficiaries lost access during Andhra Pradesh's reforms; MGNREGA account deletions; PDS denials; scholarship drop-offs), structural, and directly addressable by a citizen-facing "verification/reconciliation" product rather than a policy change.
- Across all four sectors the recurring root cause is the same **offline-to-online, cross-database reconciliation gap**: the same person appears as "different" across Aadhaar, bank/NPCI, job cards, ration cards, land records and school records, and no citizen-facing tool exists to detect and fix those mismatches *before* they cause a denial.
- The three next-strongest candidates are (2) the **caste/income/domicile certificate last-mile** (touts, delays, verification bottlenecks), (3) **scholarship disbursement failure on the National Scholarship Portal** (fake institutions, multi-year delays, Aadhaar drop-offs), and (4) **MGNREGA wage-payment exclusion** (the best-quantified single problem in this report).

## Key Findings
1. **Identity & Documents** is the richest, best-evidenced sector, with three candidates: Aadhaar lifecycle/mismatch exclusion (strongest), the certificate last-mile, and death-record/deactivation lag (weaker).
2. **Jobs/Employment's** MGNREGA wage-payment exclusion is one of the best-documented problems in Indian public administration, backed by peer-reviewed and civil-society datasets, and shares the exact root cause as the identity problem.
3. **Education** has two strong candidates: scholarship disbursement failure (heavily audited by CAG in Dec 2025) and the high-stakes centralized-exam reliability problem (CUET/NTA). Foundational learning is well-measured but is a pedagogy, not a product-UX, problem.
4. **Municipal Services** has a genuine structural problem (ULB fiscal weakness + property-tax under-collection + weak grievance closure) but is harder to reduce to a single citizen-facing product; its best variants are government-employee-facing (B2G).
5. The common structural gap everywhere is **data siloing + last-mile digital access + verification rent-seeking**, not the absence of a portal. Most sectors already have a portal; the failure is in reconciliation, closure loops, and the offline verification back-end.

## Details

### SECTOR 1 — IDENTITY & DOCUMENTS

#### Candidate 1A: Welfare exclusion from Aadhaar-seeding / biometric-authentication mismatches  *(top pick)*
**Problem.** A genuine beneficiary is denied a ration, pension, wage or scholarship at the moment of delivery because their Aadhaar details don't perfectly match the corresponding record (bank account, ration card, job card, school record), or because their fingerprints fail biometric authentication. The person did nothing wrong — a database or a sensor did.

**Evidence — WHY (structural/academic).** The definitive study is Muralidharan, Niehaus and Sukhtankar, *"Identity Verification Standards in Welfare Programs: Experimental Evidence from India"* (NBER Working Paper No. 26744, February 2020). Its central finding: when Andhra Pradesh mandated Aadhaar-Based Biometric Authentication for PDS, "corruption fell but with substantial costs to legitimate beneficiaries, 1.5–2 million of whom lost access to benefits at some point during the reforms." The paper isolates the mechanism: for "the 23% of households who did not have at least one member's Aadhaar number seeded to their PDS account at baseline … the mean value of rice and wheat received fell by Rs. 49, or 10.6%." Separate ethnographic fieldwork on PDS in Andhra Pradesh and Karnataka frames the systemic point directly — its stated objective was "to understand how seemingly neutral technology may in fact become exclusionary in practice." The structural cause is that Aadhaar, the NPCI bank mapper, and the scheme database are separate systems with no citizen-facing reconciliation tool, so a minor spelling or middle-name variation cascades into denial.

**Evidence — HOW MANY (survey/government data).** In MGNREGA, Lib Tech India's tracker found that as of 7 April 2025, "27.5% among all workers and 1.5% among active workers are still ineligible" for the Aadhaar-Based Payment System — on the order of 6.7 crore of all registered workers. In PDS, activists' RTI findings plus an IIT-Delhi/Ranchi University field study showed that as of July 2017, 33% of Aadhaar-seeded NFSA ration-card holders in Rajasthan could not procure rations owing to repeated biometric-authentication failures and connectivity problems at Point-of-Sale machines. The June 2024 mandate of 100% e-KYC for ration cards led Odisha to temporarily suspend distribution for over 20 lakh eligible individuals.

**Evidence — NEWS (recent).** The DigiLocker "mismatch" problem (Counterview, 2026) shows even the flagship document wallet rejects minor name mismatches despite the government's own guideline to ignore them. The e-KYC exclusion issue stayed live through 2024–2025, with the Right to Food Campaign urging suspension. In November 2025, UIDAI deactivated over 2 crore Aadhaar numbers of deceased individuals; experts flagged risk of *wrongful* deactivation of the living due to inconsistent death-record data.

**Existing solutions (grouped by approach).**
- *Government reconciliation tools:* NPCI's Bharat Aadhaar Seeding Enabler (BASE) for self-service seeding/de-seeding; UIDAI's myAadhaar update portal; DigiLocker.
- *Manual-override/policy backstops:* Union food ministry directives that no one be denied ration for lack of Aadhaar; exception logbooks at ration shops; OTP/face-auth fallbacks.
- *Civil-society workarounds:* Lib Tech India dashboards; RTI-based escalation guides that coach citizens to force action.
- *International reference:* Estonia's X-Road uses a "once-only" principle and a data-exchange layer where the citizen can see and control which records are linked — there is no equivalent citizen-facing "identity reconciliation" dashboard in India.

**Gap.** No single citizen-facing tool tells a person, *before* denial, "your name on Aadhaar and your bank record differ; here's how to fix it." Reconciliation happens invisibly inside siloed government/NPCI systems, and the burden of failure falls entirely on the citizen. Manual overrides exist on paper but are inaccessible to those without phones/OTP. This is a textbook offline-online mismatch + data-siloing + last-mile gap — an unusually strong product-design opportunity.

**Scale sizing.** MGNREGA: 27.5% of all registered workers ABPS-ineligible (April 2025, Lib Tech). Andhra Pradesh PDS: 1.5–2 million legitimate beneficiaries lost access at some point (NBER WP 26744). Rajasthan PDS: 33% of seeded cardholders denied (2017). These are real, published numbers, but they are point-in-time and state/scheme-specific; there is **no single reliable national annual count of "citizens denied due to mismatch"** — flag as partially sized.

#### Candidate 1B: The caste/income/domicile certificate last-mile  *(third pick)*
**Problem.** A student or applicant needs a caste, income, or domicile/residence certificate against a hard deadline (scholarship, EWS quota seat, college admission, job application) and is trapped between slow revenue offices and rent-seeking touts.

**Evidence — WHY.** These certificates require field verification by village accountants, revenue inspectors and tahsildars, creating discretion and bottlenecks. Karnataka's own project data found that these officials "spend half their time in the verification process involved in issuing these three certificates." That discretion is the entry point for touts — Deccan Herald has repeatedly documented touts colluding with staff, with certificates issued "within hours" through a middleman but delayed for weeks otherwise, and demanded bribes of ₹2,000–₹5,000 for a caste certificate.

**Evidence — HOW MANY.** In Karnataka alone, "around 1.5 crore caste, income and residence certificates are issued every year, making it four-fifths of all documents issued by the state government." In Hyderabad (2025), certificates earlier issued within a week began taking more than two weeks after revenue staff were diverted to the Special Intensive Revision of electoral rolls.

**Evidence — NEWS.** The 2025 Telangana SIR-diversion delays (Telangana Today) are recent and concrete. RTI-help sites report a steady stream of citizens using RTI to break logjams before deadlines (e.g., a JEE-Main qualifier needing an income certificate for JoSAA EWS counselling).

**Existing solutions.** *Government counters/portals:* Karnataka's Atalji Janasnehi Kendras / former Nemmadi centres; Maharashtra's SETU; state e-District portals; and the standout "over-the-counter" model where Karnataka pre-created certificates from the ration-card database and now issues them in under 10 minutes for ~60% of applicants. *Private workarounds:* Common Service Centres, cyber cafés, touts/agents. *Civic-tech:* RTI-drafting services.

**Gap.** The **verification step is the true bottleneck and the rent-seeking layer**; portals digitise the front-end but not the field-verification back-end. Karnataka's pre-verified-database model is the most promising existing fix but is not nationally generalised and explicitly excludes big cities like Bengaluru. Incentive misalignment (discretion = bribe opportunity) is the structural blocker.

**Scale sizing.** ~1.5 crore/year in Karnataka for three certificate types; **no reliable all-India annual figure found** — flag as partially sized.

#### Candidate 1C: Death-record lag / Aadhaar deactivation  *(weaker candidate — context)*
**Problem.** Aadhaar numbers of the deceased stay active for years (enabling benefit fraud) while families face a cumbersome deactivation process; conversely, aggressive clean-up risks wrongly deactivating the living.
**Evidence.** An India Today RTI found UIDAI had deactivated ~1.15 crore Aadhaar numbers in 14 years against an average ~83.5 lakh deaths/year (Civil Registration System); UIDAI reached over 2 crore deactivations by November 2025. Structural cause: providing an Aadhaar number is not mandatory for death registration, and CRS data is scattered and inconsistent. This is real but is more a backend data-quality problem than a citizen-facing product — weaker as a UX case study.

### SECTOR 2 — MUNICIPAL SERVICES

#### Candidate 2A: Grievance redressal that doesn't close the loop
**Problem.** A citizen reports a civic problem (garbage, water, streetlight, drainage) and either can't get a trackable acknowledgement or the complaint is marked "resolved" without the problem actually being fixed.
**Evidence — WHY.** Grievance mechanisms often fail because the receiving officer lacks authority over the departments that must act. CAG performance audits repeatedly find weak mechanisms — e.g., the MGNREGS Punjab audit found corrective measures were taken on only 7,472 of 27,287 social-audit observations (2016–2021).
**Evidence — HOW MANY.** CPGRAMS received 29,23,445 grievances in 2024 and reported redressing 26,45,869 (90.5%), with average redressal time down from 28 days (2019) to 13 days (2024). But "redressed" typically means "closed/replied," not "problem fixed," and CPGRAMS is central-government-focused rather than municipal.
**Evidence — NEWS.** RBI's November 2024 municipal-finance report and ongoing civic commentary keep municipal service quality live.
**Existing solutions.** CPGRAMS (web/app/UMANG); municipal apps and state 311-style systems; the Swachhata app; NGO/civic-tech complaint trackers.
**Gap.** No enforced closure/verification loop and no citizen-side proof of resolution; incentive misalignment (closing tickets vs. fixing problems). Strong product angle but hard to isolate from local-governance politics.

#### Candidate 2B: Property-tax under-collection & opaque assessment  *(B2G)*
**Problem.** Cities can't fund services because property tax is massively under-collected, and citizens face opaque, inconsistent assessments.
**Evidence.** The RBI *Report on Municipal Finances* (released 13 November 2024; theme "Own Sources of Revenue Generation in Municipal Corporations") found property-tax revenue of 232 municipal corporations was ₹32,450 crore, just 0.12–0.15% of GDP — versus ~1.7% in advanced economies. 54% of ULBs had negative operating balances by 2024, up from 32% in 2015. Satellite-based assessments found Bengaluru and Jaipur collect only 16% and 5% of potential (Economic Survey 2017). Bengaluru's digital "e-Swathu"/property systems reduced arrears.
**Gap.** Weak billing systems, incomplete property registers, political resistance to enforcement. More a government-employee-facing tooling problem (assessment/enforcement) than a citizen product — viable but B2G.

#### Candidate 2C: Building-permit delays  *(business-facing)*
**Problem.** Getting a building permit requires dozens of approvals across agencies.
**Evidence.** A real-estate project needs around 40 approvals (Union Urban Development Ministry). Construction-permit time in Mumbai fell from 128.5 to 98 days and in Delhi from 157.5 to 113.5 days between the World Bank *Doing Business* 2018 and 2020 reports. Single-window systems and deemed-approval provisions exist, but CII (2025) still calls for unified state-level authorities and joint site inspections. More SME/business-facing than citizen-facing.

### SECTOR 3 — EDUCATION

#### Candidate 3A: Scholarship disbursement failure on the National Scholarship Portal (NSP)  *(second pick)*
**Problem.** Eligible students (disproportionately SC/ST/OBC/minority and poor) either never receive their scholarship, receive it years late, or lose funds to fake institutions siphoning money — at the exact life-moment when they need fees paid to stay enrolled.
**Evidence — WHY.** A CAG performance audit of pre-/post-matric minority scholarships (report published the week of 19 December 2025, covering 2020-21 to 2022-23) found that "sole reliance" on the NSP portal for monitoring led to disbursal irregularities, calling it "a weak control mechanism … at the level of beneficiary verification." Aadhaar-linkage requirements independently cause approval failures.
**Evidence — HOW MANY.** That CAG audit found "at least Rs 9 crore have been disbursed to over 11,000 beneficiaries who could not be traced at the schools mentioned or whose schools were 'non-operational'"; 8,669 applicants' names could not be found in school records (₹681.71 lakh disbursed). The minority-scholarship scam: of 1,572 institutes flagged on NSP, 830 across 21 states were found non-operational, fake or partially fake, with an estimated ₹144.33 crore loss (Ministry of Minority Affairs complaint → CBI FIR, 2023). A Parliamentary Standing Committee report (March 2026) reported 6,055 suspicious institutes flagged, of which 609 have been confirmed fake or partially fake so far. On delays, a separate CAG audit found disbursement delays of one to six years affecting 18.58 lakh SC students in Maharashtra, Punjab, Tamil Nadu and UP; a 2017-21 CAG audit found 10-12% of SC and 4-20% of ST students did not receive pre-matric scholarships. Roughly 89 lakh fewer SC/ST/OBC recipients in recent years have been linked to Aadhaar authentication failures.
**Evidence — NEWS.** The minority-scholarship schemes have had no disbursement since 2022-23 pending the fraud probe (ThePrint, March 2026); the CAG audit is December 2025 — both very recent.
**Existing solutions.** NSP itself (One-Time Registration, DBT via PFMS, Aadhaar face-authentication, a three-tier institute→district→state verification chain); state scholarship portals; NGO aggregators such as Buddy4Study.
**Gap.** Verification is institution-mediated and gameable — ghost institutions certify ghost students — while genuine students are excluded by Aadhaar/bank mismatches and multi-year reimbursement lags. No student-facing tool shows *why* a payment is stuck or provides an independent audit trail. Verification bottleneck + fraud layer + offline-online mismatch are all present.
**Scale sizing.** Scheme-specific beneficiary counts are large (e.g., the Post-Matric Scholarship for SC students reached 48,04,208 beneficiaries in FY2024-25 with ₹5,562.24 crore released), but there is **no single official portal-wide "X apply, Y receive, Z rejected" figure** — flag as partially sized.

#### Candidate 3B: High-stakes centralized exam/admission reliability (CUET/NTA)
**Problem.** Lakhs of students face cancelled/delayed exams and result chaos in the centralized university-admission test, throwing admissions, hostels and scholarship timelines into uncertainty.
**Evidence.** CUET UG 2025 saw pan-India server issues on 26 May 2025 delaying exams across centres (Ayodhya, Delhi, Patna, Kanpur, Faridabad); Srinagar centres were cancelled for two consecutive days; registration suffered payment/OTP failures; results were delayed amid public fury at the NTA (Business Standard, Careers360). This is a live, recurring reliability + UX problem. The product-design angle is strong (resilience, communication, rescheduling UX), but the core failures are operational/infrastructural and partly outside a pure product redesign.

#### Candidate 3C: Foundational learning outcomes  *(context, not a product candidate)*
ASER 2024 (Pratham) found only 23.4% of Std III children in government schools can read a Std II-level text (up from 16.3% in 2022; pre-Covid was 20.9% in 2018); nationally ~30% of children still cannot read a Class II textbook. Well-measured and severe, but this is a pedagogy/teacher-capacity problem, not a product-UX problem — include as context, not a candidate.

### SECTOR 4 — JOBS / EMPLOYMENT

#### Candidate 4A: MGNREGA wage-payment exclusion & delay  *(strongest in this sector; tied to 1A)*
**Problem.** Rural workers do guaranteed work but aren't paid on time — or are deleted from the system entirely — because of Aadhaar-Based Payment System (ABPS) eligibility failures.
**Evidence — WHY.** A peer-reviewed study in the *Indian Journal of Labour Economics* (Springer, 2024) analysed 31.36 million wage transactions across 10 states in FY2021-22 and found "no statistically significant difference either in timely payment of wages or in payment rejections between the Aadhaar-Based Payment System (ABPS) and the standard account-based methods" — the first large-scale evidence debunking official claims that ABPS speeds payments. ABPS requires Aadhaar linked to the job card *and* an NPCI-mapped bank account; minor mismatches cause deletion.
**Evidence — HOW MANY.** Lib Tech India's report (*MGNREGA Implementation in India: Insights and Trends, April–Sept 2024*) found ~85 lakh workers deleted and ~45 lakh added (net −39 lakh) from April to 10 October 2024, and about 8.2 crore active workers deleted over Oct 2023–Oct 2024. As of April 2025, ~27.5% of all workers were still ABPS-ineligible. A Parliamentary Standing Committee (March 2025) recommended making ABPS optional and flagged ₹23,446.27 crore in pending wage/material dues (27.26% of budget).
**Evidence — NEWS.** The Committee recommendation and the West Bengal fund freeze (stalled since 9 March 2022) keep this live through 2025.
**Existing solutions.** ABPS/NEFMS; NPCI BASE for seeding; the (recommended but not adopted) optional-ABPS route; Lib Tech dashboards.
**Gap.** The same reconciliation/mismatch root cause as 1A, applied to wages — the citizen has no tool to see or fix *why* they were deleted. Incentive misalignment (deletion improves "clean" active-worker metrics) compounds it.
**Scale sizing.** Strong, recent, published numbers (net −39 lakh accounts April–Oct 2024; 27.5% ineligible; ₹23,446 crore pending) — **one of the best-sized problems in this report.**

#### Candidate 4B: Gig/informal-worker registration & benefit portability (e-Shram)
**Problem.** Gig and informal workers register on e-Shram but registration doesn't reliably convert into usable, portable social-security benefits.
**Evidence.** NITI Aayog (*India's Booming Gig and Platform Economy*, June 2022) estimated 7.7 million gig workers in 2020-21, rising to a projected 23.5 million by 2029-30. e-Shram has over 30.58 crore unorganised-worker registrations (as of 27 January 2025), but only around 11.5 lakh gig/platform workers registered, and the effectiveness gap (registration ≠ benefit) is officially acknowledged. The Code on Social Security, 2020 came into force on 21 November 2025.
**Existing solutions.** e-Shram plus an aggregator module (12 aggregators onboarded, including Zomato, Blinkit, Uber, Ola, Swiggy, Zepto); PM-JAY health integration; nascent state gig-worker welfare boards.
**Gap.** Portability and benefit-conversion are unproven; data accuracy/updating is weak. A good emerging problem, but sizing on "benefits actually received" is thin — flag.

#### Candidate 4C: Skilling-to-employment translation (PMKVY)  *(policy/program problem)*
**Problem.** Youth complete government skill training but don't get jobs.
**Evidence.** A CAG performance audit (tabled 18 December 2025) found only 41% placement (23 lakh of 56 lakh candidates certified under short-term training/special projects); 94.53% of beneficiary bank-account fields were entered as zero, blank or "N/A" (90,66,264 of 95,90,801 participants); only 18.44% of candidates received successful DBT under PMKVY 2.0/3.0; and PMKVY 4.0 was delinked from placement tracking entirely. Structural cause: training not aligned to micro-level skill-gap/market demand. Well-evidenced, but largely a program-design/policy problem; the product-UX angle (a demand-matched skilling/placement marketplace) is possible but indirect.

**Macro context for the sector.** PLFS 2024-25 (MoSPI) shows overall unemployment at 3.1% but graduate unemployment at 11.2% (more than three times the national average) and youth (15–29) unemployment at 9.9% — a structural "educated unemployment" mismatch that underlies both 4A and 4C.

## Recommendations

**Stage 1 — Pick the lane now (this week).** Choose based on how *buildable* the problem is as a product, not only how severe it is:
- **Top pick — Candidate 1A / 4A: an "Entitlement Reconciliation & Status" product.** A citizen-facing tool that detects Aadhaar/bank/scheme-record mismatches, explains them in plain, low-literacy-friendly language, and guides the fix *before* denial. Rationale: it sits at the shared root cause of exclusion across MGNREGA wages, PDS rations and NSP scholarships; the evidence is peer-reviewed (NBER WP 26744; IJLE), civil-society (Lib Tech), and governmental (CAG); and it is a genuine UX/design problem — surfacing invisible backend state to a vulnerable user — not a policy ask.
- **Second — Candidate 3A: an NSP scholarship "why is my money stuck" tracker + independent audit trail.** Rationale: extremely recent CAG (Dec 2025) and Standing Committee (March 2026) evidence, a sympathetic and clearly affected user (poor students), and a concrete design surface.
- **Third — Candidate 1B: a certificate last-mile "deadline mode" service.** Rationale: a crisp user moment (deadline + tout), a proven reference fix to design against (Karnataka's pre-verified over-the-counter model), and strong scale.

**Stage 2 — Validate (next 2–3 weeks).** For the chosen problem, run 5–8 user interviews (e.g., MGNREGA workers/labour activists via Lib Tech-type networks, or students who lost a scholarship) and map the exact failure moment. Benchmark against the best existing fix — Karnataka's Atalji Janasnehi over-the-counter model and Estonia's X-Road once-only principle — to define what "solved" concretely looks like.

**Stage 3 — Scope the design.** Frame it as either (a) a redesign of an existing broken flow (e.g., the NSP status page, or the ABPS-ineligibility notice) or (b) a new reconciliation layer. Prefer redesigning an existing flow — it makes the case study concrete, testable, and easy to critique.

**Benchmarks / thresholds that would change the recommendation:**
- If you want maximum data-sizing confidence → choose **4A (MGNREGA)**: cleanest, most recent published numbers.
- If you want a sympathetic, portfolio-friendly user story → choose **3A (scholarships)**.
- If you want a self-contained flow you can prototype end-to-end with no cross-department dependencies → choose **1B (certificates)**.
- Avoid **2B (property tax)** and **4C (PMKVY)** as primary picks unless you specifically want a government-employee-facing (B2G) tool, since their fixes are more policy/program-design than citizen UX.
- If, during validation, you find users' pain is dominated by *infrastructure downtime* rather than *information/reconciliation*, pivot toward **3B (CUET reliability)**, whose core issue is operational resilience.

## Caveats
- **Sizing is uneven.** MGNREGA (4A), NSP fraud/delay (3A), and municipal finance (2B) have strong recent published numbers. The certificate last-mile (1B) and gig-benefit conversion (4B) lack reliable national annual figures — several cited numbers are state-specific (Karnataka) or point-in-time (Rajasthan 2017) and should not be generalised.
- **Some widely repeated figures are contested.** The MGNREGA account-deletion and "no ABPS benefit" findings come from Lib Tech India (civil society) and one IJLE paper; the government disputes the exclusion framing, maintaining that ABPS ensures timely payment and reduces leakage. Present both sides in the case study.
- **Aggregator vs. primary sources.** Several data points surfaced first via UPSC-coaching sites and news aggregators; where possible I have named the underlying primary source (CAG, RBI, PLFS/MoSPI, NITI Aayog, NFHS, NBER, IJLE, PIB, Lib Tech). Verify exact figures against the primary report before publishing.
- **Learning outcomes (3C) and death-record lag (1C)** are real and well-measured but are weaker product-UX candidates (pedagogy and backend data-quality, respectively) — included as context.
- **No fabrication.** Where a single official portal-wide figure does not exist (e.g., total NSP applications vs. receipts, or a national annual count of mismatch-based denials), I have flagged the absence rather than estimated. A frequently cited "125 lakh apply / 105 lakh verified" NSP figure comes only from a non-authoritative third-party site and should not be used as official.
- **International examples** (Estonia X-Road, Singapore SingPass/LifeSG, UK GOV.UK) are used only as reference points for how others solved reconciliation/service design — not as evidence of the Indian problem's scale.