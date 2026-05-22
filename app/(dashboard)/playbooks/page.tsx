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
