'use client';
import { useState, useEffect, useRef } from 'react';
import { ChevronRight, Loader2, Copy, Check, FileText, X, ArrowLeft } from 'lucide-react';

/* ── Mike OSS workflow templates ── */
const WORKFLOWS = [
  {
    id: 'credit-summary',
    title: 'Credit Agreement Summary',
    category: 'Finance',
    description: 'Comprehensive legal summary covering lenders, borrowers, facilities, covenants, events of default and more.',
    color: '#3b82f6',
    prompt: `Review the uploaded credit agreement and produce a comprehensive legal summary covering the following topics. For each section, identify the key provisions, quote the relevant clause or schedule references, and flag any unusual, onerous, or non-market terms.

1. **Lenders** — All lenders or members of the lender syndicate, including their full legal name and role
2. **Borrowers** — All borrowers, including their full legal name and jurisdiction of incorporation
3. **Guarantors** — All guarantors, including their full legal name and scope of guarantee
4. **Date of Agreement** — Date of the credit agreement
5. **Facilities** — Each facility available (type, tranche name, key features)
6. **Amount** — Total committed amount, currency, breakdown by tranche
7. **Purpose** — Stated purpose and any restrictions on use of proceeds
8. **Interest** — Reference rate, margin, ratchet mechanism, interest periods
9. **Commitment Fee** — Fee, applicable rate, calculation basis
10. **Repayment Schedule** — Profile for each facility, dates and amounts
11. **Maturity** — Final maturity date for each facility
12. **Security** — Each class of security granted (share pledges, charges, mortgages, pledges)
13. **Guarantees** — Guarantee obligations, scope, and limitations
14. **Financial Covenants** — Each covenant, metric, testing frequency, equity cure rights
15. **Events of Default** — Each event of default, grace periods, cross-default provisions
16. **Assignment** — Restrictions or permissions on assignment or transfer
17. **Change of Control** — Definition, obligations triggered, cure period
18. **Prepayment Fee** — Fees, make-whole premiums, soft-call protections, exceptions
19. **Governing Law** — Governing law of the agreement
20. **Dispute Resolution** — Litigation or arbitration, chosen forum`,
  },
  {
    id: 'sha-summary',
    title: 'Shareholder Agreement Summary',
    category: 'Corporate',
    description: 'Full review of share classes, board composition, reserved matters, transfer restrictions, drag/tag rights and exit provisions.',
    color: '#8b5cf6',
    prompt: `Review the uploaded shareholder agreement and produce a comprehensive legal summary covering the following topics. For each section, identify the key provisions, quote the relevant clause references, and flag any unusual, onerous, or market-standard deviations.

1. **Parties & Shareholdings** — Full legal names, roles, share classes held, percentage interests
2. **Share Classes & Rights** — Voting rights, dividend rights, liquidation preference, conversion/redemption features
3. **Board Composition & Governance** — Board size, director appointment rights, quorum, casting vote
4. **Reserved Matters** — Decisions requiring special majority, unanimity, or specific shareholder consent
5. **Pre-emption on New Shares** — Who holds rights, procedure, timeline, carve-outs
6. **Transfer Restrictions** — Lock-up periods, prohibited transfers, permitted transfers, approval requirements
7. **Right of First Refusal** — Trigger, procedure, pricing mechanics, exceptions
8. **Drag-Along Rights** — Who holds the right, threshold, conditions, minority protections
9. **Tag-Along Rights** — Who holds the right, triggering threshold, exercise procedure, price terms
10. **Anti-Dilution Protections** — Type, trigger events, calculation mechanics, exceptions
11. **Dividend Policy** — Obligation or target to pay dividends, preferential rights, restrictions
12. **Exit & Liquidity** — Agreed exit routes, timelines, liquidation preferences on exit
13. **Deadlock** — Definition, escalation mechanisms, consequences if unresolved
14. **Non-Compete & Non-Solicitation** — Who is bound, scope, geography, duration, carve-outs
15. **Governing Law & Dispute Resolution** — Applicable law, forum, arbitration or litigation`,
  },
  {
    id: 'cp-checklist',
    title: 'Conditions Precedent Checklist',
    category: 'Finance',
    description: 'Generate a structured CP checklist from a credit agreement covering corporate, financial, legal and security conditions.',
    color: '#10b981',
    prompt: `Review the uploaded credit agreement or financing document and generate a comprehensive Conditions Precedent (CP) checklist.

Structure the checklist as follows, with each category on its own section:
- For each category of conditions (e.g. Corporate, Financial, Legal, Security, Other), add a heading
- Under each category, list each condition with: (1) Index number, (2) Clause reference, (3) Description of condition, (4) Status [leave blank]

Format clearly with markdown headers and tables. Be exhaustive — capture every CP mentioned in the document.`,
  },
  {
    id: 'nda-review',
    title: 'NDA Risk Review',
    category: 'Contract',
    description: 'Identify non-standard clauses, missing protections, and key risks in a non-disclosure agreement.',
    color: '#f59e0b',
    prompt: `Review the uploaded NDA and produce a legal risk assessment covering:

1. **Parties** — Disclosing and receiving parties, whether mutual or one-way
2. **Scope of Confidential Information** — Definition, what is included/excluded
3. **Obligations on Recipient** — Standard of care, permitted disclosures, need-to-know restrictions
4. **Permitted Disclosures** — Exceptions (public domain, prior knowledge, compelled disclosure)
5. **Term & Survival** — Duration of obligations, post-termination survival period
6. **Return/Destruction** — Obligation to return or destroy information, verification
7. **Residuals Clause** — Whether present and its scope (significant risk if broad)
8. **Injunctive Relief** — Whether explicitly preserved
9. **Governing Law & Jurisdiction** — Applicable law, chosen courts
10. **Missing Protections** — Key clauses typically present but absent here
11. **Non-Standard Clauses** — Any unusual or onerous provisions
12. **Overall Risk Rating** — Low/Medium/High with brief rationale

Flag any clauses that are unusual, missing, or particularly onerous.`,
  },
  {
    id: 'employment-review',
    title: 'Employment Agreement Review',
    category: 'Employment',
    description: 'Review employment terms, restrictive covenants, IP assignment, and compliance risks.',
    color: '#f97316',
    prompt: `Review the uploaded employment agreement and produce a legal summary covering:

1. **Parties** — Employer and employee full names, role/position
2. **Term** — Fixed term or at-will, start date, probation period
3. **Compensation** — Base salary, bonus structure, equity, benefits, expense reimbursement
4. **Working Hours & Location** — Standard hours, remote work, travel requirements
5. **Duties & Responsibilities** — Role definition, reporting structure, exclusivity
6. **Intellectual Property Assignment** — Scope of IP assigned, carve-outs for personal projects
7. **Confidentiality** — Scope, duration, what is excluded
8. **Non-Compete** — Duration, geography, scope of restricted activities; enforceability risk
9. **Non-Solicitation** — Employees, clients, suppliers; duration and scope
10. **Termination** — Notice periods (employer and employee), payment in lieu of notice
11. **Garden Leave** — Whether present and its terms
12. **Grounds for Summary Dismissal** — Listed causes for immediate termination
13. **Post-Termination Obligations** — Duration and enforceability risks
14. **Dispute Resolution** — Arbitration, litigation, mediation
15. **Governing Law** — Applicable jurisdiction
16. **Risk Flags** — Non-market terms, enforceability concerns, missing protections`,
  },
  {
    id: 'due-diligence',
    title: 'Contract Due Diligence',
    category: 'M&A',
    description: 'Flag change of control provisions, assignment restrictions, termination rights, and material obligations.',
    color: '#ef4444',
    prompt: `Conduct a due diligence review of the uploaded contract from a buyer/acquirer perspective. Identify and summarise:

1. **Change of Control** — Is there a change of control clause? What does it trigger (termination right, consent requirement, payment)?
2. **Assignment** — Can the contract be assigned without consent? What consent is required?
3. **Termination Rights** — Material grounds for termination, notice periods, cure periods
4. **Key Obligations** — Material obligations on both parties, milestones, SLAs
5. **Liability Caps & Exclusions** — Cap on liability, excluded losses, indemnities
6. **Intellectual Property** — Ownership, licensing, restrictions on use
7. **Exclusivity / Non-Compete** — Any market or customer restrictions
8. **Auto-Renewal** — Whether the contract auto-renews, notice required to terminate
9. **Pricing & Payment** — Fees, payment terms, price adjustment mechanisms, most-favoured nation clauses
10. **Governing Law & Dispute Resolution** — Applicable law, forum selection
11. **Red Flags** — Any provisions that would create material risk, liability, or operational disruption for a buyer
12. **Overall Assessment** — Summary of key risks with High/Medium/Low rating`,
  },
  {
    id: 'loan-note',
    title: 'Loan Note Summary',
    category: 'Finance',
    description: 'Summarise principal, interest, conversion features, security and default provisions of a loan note or convertible.',
    color: '#06b6d4',
    prompt: `Review the uploaded loan note or convertible note instrument and produce a legal summary covering:

1. **Parties** — Issuer and noteholder(s), full legal names and roles
2. **Principal Amount** — Face value, currency, issue price (if at discount)
3. **Interest Rate** — Rate (fixed or variable), basis, payment frequency, PIK option
4. **Maturity** — Maturity date, any extension options
5. **Conversion Features** — Conversion right, conversion price/mechanism, triggers, valuation cap, discount
6. **Redemption** — Voluntary redemption rights, mandatory redemption triggers, redemption premium
7. **Security** — Any security granted over assets of the issuer
8. **Representations & Warranties** — Key representations at issue and ongoing
9. **Covenants** — Positive and negative covenants during the term
10. **Events of Default** — Key defaults, acceleration provisions, cross-default
11. **Transfer Restrictions** — Conditions on transfer of the note
12. **Governing Law** — Applicable law and jurisdiction
13. **Key Risks** — Non-market terms, missing protections, enforceability concerns`,
  },

  // ── New workflows from law skills integration ─────────────────────────
  {
    id: 'contract-redline',
    title: 'Contract Redline Review',
    category: 'Contract',
    description: 'Full RED / YELLOW / GREEN clause analysis with specific redline suggestions and negotiation strategy — based on UK law standards.',
    color: '#dc2626',
    prompt: `You are reviewing this contract as a senior UK solicitor. Conduct a thorough clause-by-clause analysis under English & Welsh law.

For each material clause, classify as:
- 🟢 **GREEN** — Acceptable / market standard
- 🟡 **YELLOW** — Negotiate — outside preferred position but within range
- 🔴 **RED** — Escalate — material risk, requires senior review

**Structure your output as follows:**

## Contract Review Summary
- Parties and roles
- Contract type
- Governing law
- Overall risk rating: Low / Medium / High

## Clause-by-Clause Analysis
For each clause category (Limitation of Liability, Indemnification, IP Ownership, Data Protection / UK GDPR, Confidentiality, Term & Termination, Governing Law, Force Majeure, Payment Terms, Assignment, Change of Control):

**[Clause name] — [🟢/🟡/🔴]**
- **What it says:** [summary]
- **UK law position:** [what English law requires or implies]
- **Risk:** [specific exposure]
- **Redline:** [exact alternative drafting where needed]

## Top 3 Issues to Address
## Negotiation Strategy
## Recommended Next Steps

*This review is AI-assisted and should be reviewed by a qualified solicitor before reliance.*`,
  },
  {
    id: 'nda-triage',
    title: 'NDA Triage',
    category: 'Contract',
    description: 'Fast triage of any NDA — mutual or one-way — flagging the key risks, missing clauses, and whether it is safe to sign.',
    color: '#f59e0b',
    prompt: `Triage this NDA as a UK solicitor. Give a fast, structured assessment covering:

**1. Basic Structure**
- Mutual or one-way?
- Who is Disclosing Party / Receiving Party?
- What is the stated purpose?

**2. Red Flags** (anything that would prevent signing without amendment)
- Scope of confidential information (too broad / too narrow?)
- Residuals clause present? (high risk if yes — flag explicitly)
- IP assignment or licence buried in the NDA?
- Injunctive relief clause — is it appropriate?
- Governing law — England & Wales? If not, flag.

**3. Missing Protections** (clauses typically required but absent)
- Return/destruction of information
- Permitted disclosures (legal obligation carve-out, group companies)
- Survival period after termination
- No oral disclosure / marking requirements

**4. Term Analysis**
- Duration of obligations — is it proportionate?
- Post-termination survival — reasonable?

**5. Verdict**
- 🟢 Safe to sign as-is
- 🟡 Sign with minor amendments (list them)
- 🔴 Do not sign without material revision (list issues)

Be direct. A triage should be usable in 2 minutes.

*AI-assisted — review with qualified solicitor before execution.*`,
  },
  {
    id: 'legal-risk-assessment',
    title: 'Legal Risk Assessment',
    category: 'Contract',
    description: 'Structured risk assessment of any document — identifies HIGH, MEDIUM and LOW risks with UK law references and recommended mitigations.',
    color: '#7c3aed',
    prompt: `Conduct a structured legal risk assessment of this document under English & Welsh law.

**Output format:**

## Executive Risk Summary
- Overall risk level: HIGH / MEDIUM / LOW
- Top 3 risks in one sentence each

## Detailed Risk Register

For each risk identified, complete:

| Risk | Severity | Applicable UK Law | Likelihood | Mitigation |
|------|----------|-------------------|------------|------------|
| [description] | HIGH/MED/LOW | [statute/case] | High/Med/Low | [specific action] |

Cover these risk categories as applicable:
- **Contractual exposure** — uncapped liability, onerous obligations, penalty clauses
- **Regulatory / compliance** — UK GDPR, Consumer Rights Act 2015, FCA if applicable, SRA rules
- **Employment law risk** — ERA 1996, Equality Act 2010, TUPE
- **Property risk** — LPA 1925, land registration issues, covenant exposure
- **IP risk** — copyright, trade mark, confidentiality exposure
- **Insolvency risk** — director duties under CA 2006, wrongful trading
- **Data protection** — UK GDPR / DPA 2018 obligations and breach exposure
- **Litigation risk** — limitation periods (Limitation Act 1980), pre-action protocol compliance

## Priority Actions
Numbered list of actions required, in order of urgency.

*AI-assisted risk assessment. Should be reviewed by a qualified solicitor before reliance.*`,
  },
  {
    id: 'sra-compliance-check',
    title: 'SRA Compliance Check',
    category: 'Compliance',
    description: 'Check a document, engagement letter or firm process against SRA Standards and Regulations 2019 — conflicts, client care, AML obligations.',
    color: '#0891b2',
    prompt: `Review this document for compliance with SRA Standards and Regulations 2019 (England & Wales).

Check against the following SRA requirements:

**1. Client Care (SRA Code of Conduct 2019)**
- Is there a clear client care letter / engagement letter?
- Does it include: costs estimate, complaints procedure, Legal Ombudsman signposting, who has conduct?
- Is the scope of retainer clearly defined?

**2. Conflicts of Interest (Para 6.1 SRA Code)**
- Does the document reveal any actual or potential conflict between clients?
- Is there any conflict between client interest and firm interest?
- If acting for multiple parties — is this permissible under the SRA exceptions?

**3. Confidentiality and Disclosure**
- Is there any risk of breaching client confidentiality?
- Does the document contain information that may trigger a duty to disclose?

**4. AML / KYC Obligations (MLR 2017)**
- Does the matter type trigger AML obligations?
- Has client due diligence been documented?
- Are there any suspicious activity indicators requiring a SAR?

**5. Costs Transparency (SRA Transparency Rules)**
- Are costs clearly communicated?
- Is the basis of charging clear?

**6. AI Use Compliance**
- Has any AI-generated content been clearly identified as requiring professional review?
- Is the solicitor maintaining appropriate oversight of AI-assisted work?

## Compliance Assessment
- ✅ Compliant areas
- ⚠️ Areas requiring attention (with specific SRA rule reference)
- ❌ Non-compliant areas (with remediation required)

## Recommended Actions
Specific steps to achieve full SRA compliance.

*This assessment is AI-assisted and should be reviewed by the firm's COLP / COFA before reliance.*`,
  },
  {
    id: 'legal-brief',
    title: 'Legal Brief / Advice Note',
    category: 'Research',
    description: 'Generate a structured legal advice note from a document or set of facts — issue, law, application, conclusion format.',
    color: '#065f46',
    prompt: `Using the uploaded document(s) as your factual base, produce a structured legal advice note in the format used by English & Welsh solicitors.

**Structure:**

## Legal Advice Note

**Client:** [identify from document or leave blank]
**Matter:** [identify from document]
**Date:** [today]
**Prepared by:** Stu AI (for review by qualified solicitor)
**Status:** DRAFT — requires professional review

---

## 1. Instructions / Issues
What legal questions need to be answered based on the document?

## 2. Relevant Facts
Key facts from the document material to the legal analysis.

## 3. Applicable Law
For each issue:
- Relevant statutes (with correct section references)
- Key case law (*Case Name [year] citation*)
- SRA obligations if relevant
- Always caveat: "citations should be verified before formal advice"

## 4. Analysis
Apply the law to the facts for each issue. Structure as:
- Issue 1: [legal question]
  - Legal position: [what the law says]
  - Application to facts: [how it applies here]
  - Conclusion: [clear answer]
- Repeat for each issue

## 5. Advice / Recommendations
Clear, numbered recommendations in priority order.

## 6. Next Steps
Specific actions with suggested timeframes.

---
*This advice note is AI-assisted. It must be reviewed and approved by a qualified solicitor before being sent to or relied upon by a client. All statutory references and case citations should be independently verified.*`,
  },
  {
    id: 'lease-review',
    title: 'Commercial Lease Review',
    category: 'Property',
    description: 'Review a commercial lease under English law — LTA 1954 protections, break clauses, service charges, alienation, dilapidations exposure.',
    color: '#92400e',
    prompt: `Review this commercial lease as a UK property solicitor acting for the tenant (unless document indicates otherwise). Analyse under English property law.

**Cover the following:**

1. **Parties & Demise** — Landlord, Tenant, guarantor, extent of demised premises, common parts
2. **LTA 1954 Security of Tenure** — Is it contracted out? (s.38A procedure) If not, tenant has statutory right to renew. Flag clearly.
3. **Term & Rent Commencement** — Start date, contractual term, rent-free period
4. **Rent & Reviews** — Initial rent, review mechanism (open market / RPI / fixed uplift), review dates, upward-only? (flag if so)
5. **Service Charge** — Scope, cap, what's excluded, reconciliation procedure
6. **Repair & Dilapidations** — Standard of repair (full repairing?), decorating obligations, terminal dilapidations exposure, Schedule of Condition
7. **Alterations** — Structural vs. non-structural, consent requirements, reinstatement obligation
8. **Alienation (Assignment & Subletting)** — Conditions for assignment (AGA required?), subletting rights, sharing occupation
9. **Break Clause** — Who holds it (landlord / tenant / both), break date(s), conditions for exercise (must be strictly complied with), vacant possession requirement
10. **Use** — Permitted use, flexibility for change of use, planning considerations
11. **Insurance** — Who insures, what is insured, rent cesser if premises unusable
12. **Forfeiture** — Grounds, notice requirements (s.146 LPA 1925), relief from forfeiture
13. **SDLT** — Estimated SDLT on grant (flag if over thresholds)
14. **Key Risks for Tenant** — Non-market terms, onerous obligations, missing protections

## Lease Summary Table
| Item | Position in This Lease | Market Standard | Risk |
|------|----------------------|-----------------|------|

## Top Issues to Negotiate
## Recommended Tenant Protections to Add

*AI-assisted review. Should be reviewed by a qualified property solicitor before exchange.*`,
  },
];


type Doc = { id: string; original_name: string; matter_title: string; matter_id: string };
type WorkflowState = 'idle' | 'running' | 'done' | 'error';

export default function WorkflowsPage() {
  const [docs, setDocs] = useState<Doc[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<string>('');
  const [activeWorkflow, setActiveWorkflow] = useState<typeof WORKFLOWS[0] | null>(null);
  const [state, setState] = useState<WorkflowState>('idle');
  const [output, setOutput] = useState('');
  const [copied, setCopied] = useState(false);
  const outputRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/documents').then(r => r.json()).then(setDocs).catch(() => {});
  }, []);

  const run = async (wf: typeof WORKFLOWS[0]) => {
    if (!selectedDoc) return;
    setActiveWorkflow(wf);
    setState('running');
    setOutput('');

    try {
      const res = await fetch('/api/workflows/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workflowPrompt: wf.prompt, documentId: selectedDoc }),
      });
      if (!res.ok || !res.body) { setState('error'); setOutput('Failed to start workflow.'); return; }

      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let text = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        for (const line of dec.decode(value).split('\n').filter(l => l.startsWith('data: '))) {
          const d = line.slice(6);
          if (d === '[DONE]') break;
          try {
            const parsed = JSON.parse(d);
            if (parsed.error) { text += `\n\nError: ${parsed.error}`; }
            else if (parsed.text) { text += parsed.text; }
            setOutput(text);
            setTimeout(() => outputRef.current?.scrollTo({ top: outputRef.current.scrollHeight, behavior: 'smooth' }), 10);
          } catch {}
        }
      }
      setState('done');
    } catch (e: any) {
      setState('error');
      setOutput(`Error: ${e?.message || 'Request failed'}`);
    }
  };

  const copy = () => {
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const reset = () => {
    setActiveWorkflow(null);
    setState('idle');
    setOutput('');
  };

  const groupedWorkflows = WORKFLOWS.reduce<Record<string, typeof WORKFLOWS>>((acc, wf) => {
    (acc[wf.category] = acc[wf.category] || []).push(wf);
    return acc;
  }, {});

  /* ── Output view ── */
  if (activeWorkflow && state !== 'idle') {
    return (
      <div style={{ padding: '40px', maxWidth: '860px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px' }}>
          <button onClick={reset} style={{ display: 'flex', alignItems: 'center', gap: '5px', background: 'none', border: '1px solid var(--c-border)', borderRadius: '7px', padding: '6px 11px', fontSize: '12px', color: 'var(--c-text-2)', cursor: 'pointer' }}>
            <ArrowLeft size={12} /> Back
          </button>
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--c-text)' }}>{activeWorkflow.title}</h1>
            <p style={{ fontSize: '12px', color: 'var(--c-text-3)', marginTop: '2px' }}>{docs.find(d => d.id === selectedDoc)?.original_name}</p>
          </div>
          {state === 'done' && (
            <button onClick={copy} style={{ display: 'flex', alignItems: 'center', gap: '5px', background: 'none', border: '1px solid var(--c-border)', borderRadius: '7px', padding: '6px 11px', fontSize: '12px', color: 'var(--c-text-2)', cursor: 'pointer' }}>
              {copied ? <><Check size={11} /> Copied</> : <><Copy size={11} /> Copy</>}
            </button>
          )}
        </div>

        {state === 'running' && !output && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--c-text-2)', fontSize: '13px', padding: '32px 0' }}>
            <Loader2 size={15} className="animate-spin" />
            Analysing document with Claude…
          </div>
        )}

        {output && (
          <div
            ref={outputRef}
            style={{
              background: 'var(--c-card)',
              border: '1px solid var(--c-border)',
              borderRadius: '12px',
              padding: '32px',
              fontSize: '14px',
              color: 'var(--c-text)',
              lineHeight: '1.8',
              whiteSpace: 'pre-wrap',
              maxHeight: 'calc(100vh - 200px)',
              overflowY: 'auto',
              fontFamily: 'Georgia, "Times New Roman", serif',
            }}
          >
            {output}
            {state === 'running' && <span style={{ display: 'inline-block', width: '2px', height: '14px', background: 'var(--c-text-2)', marginLeft: '2px', verticalAlign: 'text-bottom', animation: 'blink 1s infinite' }} />}
          </div>
        )}
      </div>
    );
  }

  /* ── Workflow picker ── */
  return (
    <div style={{ padding: '40px', maxWidth: '900px' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '20px', fontWeight: '600', color: 'var(--c-text)', marginBottom: '6px' }}>Legal Workflows</h1>
        <p style={{ fontSize: '13px', color: 'var(--c-text-2)' }}>Select a document and run a workflow to get AI-powered legal analysis.</p>
      </div>

      {/* Document picker */}
      <div style={{ marginBottom: '32px', background: 'var(--c-card)', border: '1px solid var(--c-border)', borderRadius: '12px', padding: '20px' }}>
        <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--c-text-2)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Document to analyse
        </label>
        {docs.length === 0 ? (
          <p style={{ fontSize: '13px', color: 'var(--c-text-3)' }}>No documents with extracted text yet. Upload a document to a matter first.</p>
        ) : (
          <select
            value={selectedDoc}
            onChange={e => setSelectedDoc(e.target.value)}
            style={{
              width: '100%', background: 'var(--c-panel)', border: '1px solid var(--c-border)',
              borderRadius: '8px', padding: '10px 12px', color: selectedDoc ? 'var(--c-text)' : 'var(--c-text-3)',
              fontSize: '13px', outline: 'none', fontFamily: 'inherit',
            }}
          >
            <option value="">— Choose a document —</option>
            {docs.map(d => (
              <option key={d.id} value={d.id}>{d.original_name} ({d.matter_title})</option>
            ))}
          </select>
        )}
      </div>

      {/* Workflow cards */}
      {Object.entries(groupedWorkflows).map(([category, wfs]) => (
        <div key={category} style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '11px', fontWeight: '600', color: 'var(--c-text-3)', textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: '10px' }}>{category}</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {wfs.map(wf => (
              <button
                key={wf.id}
                onClick={() => run(wf)}
                disabled={!selectedDoc}
                style={{
                  display: 'flex', alignItems: 'center', gap: '14px',
                  background: 'var(--c-card)', border: '1px solid var(--c-border)',
                  borderRadius: '10px', padding: '16px 18px', cursor: selectedDoc ? 'pointer' : 'not-allowed',
                  textAlign: 'left', transition: 'border-color 0.15s',
                  opacity: selectedDoc ? 1 : 0.5, width: '100%',
                }}
              >
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: wf.color, flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--c-text)', marginBottom: '2px' }}>{wf.title}</div>
                  <div style={{ fontSize: '12px', color: 'var(--c-text-2)' }}>{wf.description}</div>
                </div>
                <ChevronRight size={13} color="var(--c-text-3)" />
              </button>
            ))}
          </div>
        </div>
      ))}

      <style>{`@keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }`}</style>
    </div>
  );
}
