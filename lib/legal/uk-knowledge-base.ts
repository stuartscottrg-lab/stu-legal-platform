/**
 * UK Legal Knowledge Base
 * ─────────────────────────────────────────────────────────────
 * Structured knowledge of UK law, SRA rules, court procedure,
 * and key statutes. Injected into AI calls based on topic
 * detection — giving Claude precise UK legal grounding on
 * every query without a vector store.
 *
 * As Claude's underlying model improves, this system
 * automatically improves with it.
 */

// ─── Topic detection ────────────────────────────────────────

const TOPIC_KEYWORDS: Record<string, string[]> = {
  employment: ['employment', 'employee', 'employer', 'redundancy', 'unfair dismissal', 'wrongful dismissal', 'tupe', 'settlement agreement', 'compromise agreement', 'discrimination', 'equal pay', 'maternity', 'paternity', 'grievance', 'disciplinary', 'notice period', 'garden leave', 'restrictive covenant', 'tribunal', 'acas', 'zero hours'],
  property: ['property', 'conveyancing', 'freehold', 'leasehold', 'landlord', 'tenant', 'lease', 'licence', 'mortgage', 'stamp duty', 'sdlt', 'land registry', 'title', 'easement', 'covenant', 'section 21', 'section 8', 'eviction', 'possession', 'dilapidations', 'rent', 'forfeiture', 'service charge'],
  company: ['company', 'director', 'shareholder', 'share', 'dividend', 'articles', 'memorandum', 'companies house', 'winding up', 'insolvency', 'administration', 'liquidation', 'receivership', 'partnership', 'llp', 'fiduciary', 'board', 'governance', 'constitution', 'minority shareholder'],
  contract: ['contract', 'agreement', 'clause', 'breach', 'damages', 'consideration', 'offer', 'acceptance', 'terms', 'conditions', 'exclusion', 'limitation', 'indemnity', 'warranty', 'representation', 'misrepresentation', 'frustration', 'force majeure', 'penalty', 'liquidated damages', 'entire agreement'],
  litigation: ['litigation', 'claim', 'claimant', 'defendant', 'proceedings', 'court', 'judgment', 'order', 'injunction', 'without prejudice', 'costs', 'cpr', 'pre-action', 'disclosure', 'witness', 'expert', 'mediation', 'arbitration', 'limitation period', 'stay', 'strike out', 'summary judgment'],
  data: ['data protection', 'gdpr', 'dpa', 'ico', 'personal data', 'data subject', 'controller', 'processor', 'lawful basis', 'consent', 'legitimate interests', 'data breach', 'subject access', 'right to erasure', 'privacy', 'cookies'],
  ip: ['intellectual property', 'copyright', 'trademark', 'trade mark', 'patent', 'design right', 'trade secret', 'confidential information', 'passing off', 'infringement', 'licence', 'assignment', 'moral rights'],
  sra: ['sra', 'solicitor', 'professional conduct', 'conflict of interest', 'client care', 'complaints', 'legal professional privilege', 'lpp', 'money laundering', 'aml', 'know your client', 'kyc', 'accounts rules', 'client account', 'undertaking'],
};

export function detectTopics(text: string): string[] {
  const lower = text.toLowerCase();
  return Object.entries(TOPIC_KEYWORDS)
    .filter(([, keywords]) => keywords.some(kw => lower.includes(kw)))
    .map(([topic]) => topic);
}

// ─── Knowledge blocks ────────────────────────────────────────

const KB: Record<string, string> = {

sra: `## SRA Regulatory Framework (England & Wales)

**SRA Standards and Regulations 2019** govern all solicitors and SRA-authorised firms.

**Code of Conduct for Solicitors (2019) — Core Principles:**
- Act in the best interests of each client (Principle 7)
- Act with independence (Principle 3)
- Act with honesty (Principle 4)
- Behave in a way that maintains public trust (Principle 2)
- Uphold the rule of law and administration of justice (Principle 1)

**Conflicts of Interest:** Must not act when there is a conflict, or significant risk of conflict, between clients (Para 6.1). Narrow "substantially common interest" and "competing for the same objective" exceptions exist but are strictly construed.

**Legal Professional Privilege (LPP):**
- *Legal advice privilege*: communications between lawyer and client for purpose of giving/receiving legal advice.
- *Litigation privilege*: communications with third parties where litigation is reasonably anticipated, dominant purpose test.
- LPP is absolute — cannot be overridden by court order (save crime/fraud exception: *R v Derby Magistrates' Court ex p B [1996] AC 487*).

**Client Care:** Letter/email required at outset — costs estimate, complaints procedure, right to complain to Legal Ombudsman, who has conduct of matter.

**SRA Accounts Rules 2019:** Client money must be held in a separate client account. Cannot use client money for firm's purposes. Monthly reconciliations required.

**AML / KYC:** Solicitors are subject to the Money Laundering, Terrorist Financing and Transfer of Funds Regulations 2017. Risk assessment, due diligence (standard and enhanced), and suspicious activity reports (SARs) to NCA required. Tipping off is a criminal offence.

**AI Use Guidance (SRA, 2024):** Firms using AI must maintain appropriate oversight; solicitors remain responsible for any AI-generated work; AI output must be verified before reliance; client confidentiality applies to data inputted to AI tools.`,

employment: `## UK Employment Law — Key Framework

**Jurisdiction:** Employment Rights Act 1996 (ERA 1996), Equality Act 2010, TUPE Regulations 2006 (SI 2006/246), Working Time Regulations 1998.

**Unfair Dismissal:**
- Qualifying period: **2 years' continuous employment** (from 6 April 2012).
- Potentially fair reasons (s.98 ERA 1996): capability, conduct, redundancy, statutory illegality, some other substantial reason (SOSR).
- Test: was dismissal within range of reasonable responses? (*Iceland Frozen Foods v Jones [1983]*)
- Procedural fairness: must follow a fair procedure (Acas Code of Practice on Disciplinary and Grievance Procedures). Failure to follow can increase/decrease award by up to 25%.
- Maximum compensatory award: **£115,115** (from April 2024) or 52 weeks' pay, whichever is lower. Basic award separately calculated.

**Wrongful Dismissal:** Breach of contract (notice). Not dependent on qualifying period. Damages = notice pay lost.

**Redundancy:** Genuine redundancy situation required. Fair selection pool and criteria. Consultation required (collective: 30+ dismissals → 45 days; 20–99 → 30 days). Statutory redundancy pay = 1.5 weeks' pay per year over 41, 1 week per year 22–40, 0.5 week under 22. Week's pay capped at **£643** (2024/25).

**Settlement Agreements:** Must meet s.203 ERA requirements to be valid: in writing, relate to particular complaint, employee had independent legal advice from a qualified adviser who is insured. ACAS Code does not apply to agreed departures.

**TUPE:** Employees transfer automatically on a relevant transfer (business transfer or service provision change). Terms preserved. 13-week ETO defence for dismissal/variation.

**Discrimination (Equality Act 2010):** Nine protected characteristics. Direct discrimination, indirect discrimination, harassment, victimisation. No qualifying period. Burden of proof shifts to employer once prima facie case established.

**Restrictive Covenants:** Only enforceable if protecting legitimate business interest (trade connections, trade secrets, workforce stability) and reasonable in scope, duration, and geography (*Tillman v Egon Zehnder [2019] UKSC 32*). Courts will sever but not rewrite blue-pencil test only).`,

property: `## UK Property Law — Key Framework

**Jurisdiction:** Law of Property Act 1925 (LPA 1925), Land Registration Act 2002 (LRA 2002), Landlord and Tenant Act 1954, Landlord and Tenant Act 1985, Leasehold Reform Act 1967.

**Land Registration:** All titles must be registered at HM Land Registry. Registered title is conclusive (*LRA 2002 s.58*). Overriding interests bind registered proprietor without entry on register.

**Freehold vs Leasehold:**
- Freehold = estate in fee simple absolute in possession — perpetual ownership.
- Leasehold = term of years absolute — time-limited, subject to rent and covenants.
- Leasehold Reform (Ground Rent) Act 2022: ground rents in new long residential leases must be zero ("peppercorn").

**Stamp Duty Land Tax (SDLT):**
- Residential: 0% up to £250k (£425k for first-time buyers), 5% £250k–£925k, 10% £925k–£1.5m, 12% above £1.5m. Additional 3% surcharge for additional dwellings.
- Non-residential: 0% up to £150k, 2% £150k–£250k, 5% above £250k.

**Landlord and Tenant Act 1954 (Commercial Leases):** Business tenants have statutory right to renewal (*security of tenure*) unless contracted out (s.38A procedure). Grounds for opposition: ground (f) redevelopment, ground (g) own occupation.

**Residential Tenancies:**
- Section 21 (no-fault eviction): requires two months' notice; compliance with deposit protection, gas safety, EPC, How to Rent requirements.
- Section 8 (fault-based): grounds in Schedule 2 HA 1988. Ground 8 (rent arrears) is mandatory if ≥2 months in arrears at notice and hearing.
- Renters' Rights Bill (2025): abolishes s.21, introduces new grounds-based system.

**Covenants:** Run with the land if touching and concerning the land. Restrictive covenants bind successors if they have notice; positive covenants generally do not (*Rhone v Stephens [1994]*).`,

company: `## UK Company Law — Key Framework

**Jurisdiction:** Companies Act 2006 (CA 2006), Insolvency Act 1986, Company Directors Disqualification Act 1986.

**Director Duties (CA 2006 ss.171–177):**
- s.171: Act within powers (constitution + proper purposes)
- s.172: Promote success of company for benefit of members as a whole (or, if insolvent, creditors)
- s.173: Exercise independent judgment
- s.174: Exercise reasonable care, skill and diligence (objective + subjective test)
- s.175: Avoid conflicts of interest
- s.176: Not accept benefits from third parties
- s.177: Declare interest in proposed transaction

**Share Capital:** Ordinary shares carry votes and residual economic interest. Preference shares may carry preferential dividend and capital rights but often no votes. CA 2006 requires at least one issued share.

**Shareholder Remedies:**
- Unfair prejudice petition (s.994 CA 2006): where company affairs conducted in manner unfairly prejudicial to member. Most common remedy: buy-out order.
- Just and equitable winding up (Insolvency Act 1986 s.122(1)(g)): deadlock, loss of substratum, quasi-partnership breakdown.
- Derivative claim (Part 11 CA 2006): member sues on company's behalf for wrong done to company.

**Insolvency Hierarchy:** Secured creditors → preferential creditors (HMRC, employee wages ≤£800) → unsecured creditors → shareholders.

**Companies House:** Confirmation statement (annual), accounts (small companies: 9 months from year end; public: 6 months), PSC register.`,

contract: `## UK Contract Law — Key Principles

**Formation:** Offer + acceptance + consideration + intention to create legal relations + certainty of terms.

**Consideration:** Must be sufficient but need not be adequate. Must not be past (*Roscorla v Thomas [1842]*). Performance of existing duty is not good consideration (*Stilk v Myrick [1809]*) unless practical benefit conferred (*Williams v Roffey [1991]*).

**Exclusion and Limitation Clauses:**
- Unfair Contract Terms Act 1977 (UCTA 1977): applies to business-to-business. Negligence liability for death/PI cannot be excluded. Other negligence liability subject to reasonableness test. Standard terms subject to reasonableness.
- Consumer Rights Act 2015: applies to B2C. Unfair terms not binding. Core terms exempt if transparent and prominent.
- Incorporation: clause must be incorporated before or at time of contract (*Olley v Marlborough Court [1949]*).

**Misrepresentation:** False statement of fact inducing contract. Fraudulent (Derry v Peek), negligent (s.2(1) Misrepresentation Act 1967 — reversed burden of proof), innocent. Remedy: rescission + damages under s.2(1).

**Damages:** Hadley v Baxendale (*[1854]*) — (1) arising naturally from breach; (2) within reasonable contemplation of parties at time of contract. Duty to mitigate. No damages for pure economic loss in tort (Caparo).

**Force Majeure:** No general doctrine in English law — must be expressly included in contract. Interpret strictly; must be beyond reasonable control; notice provisions are typically conditions precedent.

**Frustration:** Contract automatically discharged if supervening event makes performance impossible or radically different (*Davis Contractors v Fareham UDC [1956]*). High threshold — not mere hardship or commercial inconvenience.`,

litigation: `## Civil Litigation — Key Procedure (England & Wales)

**Civil Procedure Rules (CPR):** Overriding objective: just disposal at proportionate cost (CPR 1.1).

**Limitation Periods (Limitation Act 1980):**
- Contract: 6 years from breach
- Tort: 6 years from damage (personal injury: 3 years)
- Specialty (deed): 12 years
- Latent damage: 3 years from knowledge, 15-year longstop
- S.33 discretion to disapply in personal injury

**Pre-Action Protocols:** Must comply before issuing. Non-compliance → costs sanctions. 30-day response period standard. Letter of claim must be detailed and specific.

**Court Structure:**
- Small claims: up to £10,000 (PI: £1,500)
- Fast track: £10,000–£100,000
- Multi-track: £100,000+ (and complex cases below)
- Business and Property Courts: Commercial Court, Chancery, TCC

**Costs:** General rule — loser pays winner's costs. Qualified one-way costs shifting (QOCS) in PI. Costs budgeting (Precedent H) required in multi-track.

**Without Prejudice:** Genuine attempt to settle; cannot be produced in evidence (*Rush & Tompkins v GLC [1989]*). "Without prejudice save as to costs" (Calderbank) — admissible only on costs.

**Injunctions:** American Cyanamid test: (1) serious question to be tried; (2) damages inadequate remedy; (3) balance of convenience. Cross-undertaking in damages required.

**Summary Judgment (CPR 24):** No real prospect of success; no compelling reason to proceed to trial.`,

data: `## Data Protection — UK GDPR and DPA 2018

**Post-Brexit:** UK GDPR (retained EU GDPR as amended) + Data Protection Act 2018. ICO is supervisory authority.

**Lawful Basis (Art.6 UK GDPR):** Must identify one: consent, contract, legal obligation, vital interests, public task, legitimate interests (LIA required — must not override data subject rights).

**Special Category Data (Art.9):** Higher bar — explicit consent or specific statutory condition required. Includes health, biometric, racial/ethnic origin, political opinion, religion, trade union, sex life/orientation.

**Key Rights:**
- Right of access (Subject Access Request — SAR): 1 month to respond (extendable by 2 months for complex/numerous).
- Right to erasure ("right to be forgotten"): applies where no compelling legitimate grounds override.
- Right to portability: structured, commonly used, machine-readable format.
- Right to object to processing for direct marketing: absolute right.

**Data Breach:** Notifiable breach → report to ICO within **72 hours** of becoming aware. High risk to individuals → notify individuals without undue delay.

**Fines (ICO):** Up to £17.5m or 4% of global annual turnover for most serious infringements; up to £8.7m or 2% for less serious.

**DPA (Data Processing Agreement):** Required when controller engages processor. Must cover subject matter, duration, nature, purpose, type of data, obligations and rights per Art.28 UK GDPR.`,

ip: `## Intellectual Property — UK Law

**Copyright (Copyright, Designs and Patents Act 1988):**
- Arises automatically on creation — no registration required.
- Duration: life of author + 70 years (literary, dramatic, musical, artistic). Sound recordings/broadcasts: 50 years. Published editions: 25 years.
- First ownership: author (employer if created in course of employment).
- Fair dealing defences: research/private study, criticism/review, news reporting, caricature/parody.

**Trade Marks (Trade Marks Act 1994 + EU TM Regulation via retained law):**
- Registration at UKIPO gives 10-year rights (renewable indefinitely).
- Infringement: identical mark + identical goods/services; identical/similar mark + identical/similar goods + likelihood of confusion; identical/similar mark + dissimilar goods + reputation (dilution/tarnishment).
- Non-use revocation after 5 years of non-use.

**Patents (Patents Act 1977):**
- Must be new, involve inventive step, be capable of industrial application, not excluded (software as such, business methods, mental acts — though implementation often patentable).
- UK application at UKIPO; 20-year protection from filing.

**Confidential Information:** No statute — equity-based. Duty of confidence arises where: information has quality of confidence; communicated in circumstances importing confidence; unauthorised use to detriment of disclosing party (*Coco v AN Clark [1969]*).`,
};

// ─── Main export ─────────────────────────────────────────────

/**
 * Returns relevant UK law knowledge blocks for the given query text.
 * Injects topic-specific context for every AI call.
 */
export function getRelevantKnowledge(queryText: string): string {
  const topics = detectTopics(queryText);

  // Always include SRA context for professional conduct baseline
  const sections = new Set<string>(['sra', ...topics]);

  const blocks = [...sections]
    .filter(t => KB[t])
    .map(t => KB[t])
    .join('\n\n');

  return blocks
    ? `\n\n---\n## Applicable UK Law Reference\n\n${blocks}\n---`
    : '';
}

/**
 * Returns all topic areas detected in the query.
 */
export { detectTopics as detectLegalTopics };
