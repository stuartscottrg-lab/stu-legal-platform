'use client';
import { useState, useEffect, useCallback } from 'react';
import { Mail, Copy, Check, RotateCcw, Plus, Trash2, ChevronRight, Send, Users, Sparkles } from 'lucide-react';

/* ─── Email Drafter types / data ─── */

const QUICK_BRIEFS = [
  { label: 'Chase client for signed documents', brief: 'Chase the client for the signed documents we sent over last week. We need them returned before the deadline.', tone: 'firm' },
  { label: 'Update client on matter progress', brief: 'Send a friendly progress update to the client letting them know the matter is proceeding well and summarising what has happened recently.', tone: 'friendly' },
  { label: 'Request extension from opposing counsel', brief: 'Politely request a 14-day extension to respond to the latest submission from opposing counsel, citing workload pressures.', tone: 'professional' },
  { label: 'Send redlined contract for review', brief: 'Send the redlined version of the contract to the other side and invite their comments within 5 business days.', tone: 'professional' },
  { label: 'Invoice overdue notice', brief: 'Remind the client that their invoice is overdue and request payment within 7 days to avoid further action.', tone: 'firm' },
  { label: 'Instruct counsel', brief: 'Formally instruct counsel on the matter, providing key facts and asking them to advise on prospects.', tone: 'professional' },
];

const TONES = [
  { value: 'professional', label: 'Professional' },
  { value: 'firm', label: 'Firm' },
  { value: 'friendly', label: 'Friendly' },
  { value: 'urgent', label: 'Urgent' },
];

/* ─── Lead types / data ─── */

type LeadStatus = 'draft' | 'sent' | 'replied' | 'converted' | 'not_interested';

interface Lead {
  id: string;
  name: string;
  company: string;
  email: string;
  role: string;
  industry: string;
  pain_points: string;
  notes: string;
  status: LeadStatus;
  email_draft: string;
  created_at: string;
}

const STATUS_META: Record<LeadStatus, { label: string; color: string; bg: string }> = {
  draft:          { label: 'Draft',          color: '#64748b', bg: 'rgba(100,116,139,0.1)' },
  sent:           { label: 'Sent',           color: '#0078D4', bg: 'rgba(0,120,212,0.1)'  },
  replied:        { label: 'Replied',        color: '#d97706', bg: 'rgba(217,119,6,0.1)'  },
  converted:      { label: 'Converted',      color: '#16a34a', bg: 'rgba(22,163,74,0.1)'  },
  not_interested: { label: 'Not interested', color: '#dc2626', bg: 'rgba(220,38,38,0.08)' },
};

const INDUSTRIES = ['Law firm', 'Tech', 'Finance', 'Healthcare', 'Property', 'Retail', 'Professional services', 'Other'];

/* ─── Shared styles ─── */
const s = {
  input: { width: '100%', background: 'var(--c-bg)', border: '1px solid var(--c-border)', borderRadius: '8px', padding: '9px 12px', fontSize: '13px', color: 'var(--c-text)', outline: 'none', boxSizing: 'border-box' as const, fontFamily: 'inherit' },
  textarea: { width: '100%', background: 'var(--c-bg)', border: '1px solid var(--c-border)', borderRadius: '8px', padding: '9px 12px', fontSize: '13px', color: 'var(--c-text)', outline: 'none', resize: 'vertical' as const, boxSizing: 'border-box' as const, fontFamily: 'inherit' },
  label: { display: 'block', fontSize: '11px', fontWeight: '600', color: 'var(--c-text-3)', textTransform: 'uppercase' as const, letterSpacing: '0.06em', marginBottom: '5px' },
  panel: { background: 'var(--c-panel)', border: '1px solid var(--c-border)', borderRadius: '12px', padding: '20px' } as React.CSSProperties,
  btn: { padding: '9px 18px', borderRadius: '8px', fontSize: '13px', fontWeight: '500', cursor: 'pointer', border: 'none' } as React.CSSProperties,
};

/* ─── Shared send helper ─── */
async function sendEmail(to: string, subject: string, body: string, fromName = 'Stuart'): Promise<{ ok: boolean; method?: string; error?: string }> {
  try {
    const res = await fetch('/api/email/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to, subject, body, fromName }),
    });
    const data = await res.json();
    if (!res.ok) return { ok: false, error: data.error || 'Send failed' };
    if (data.mailto) {
      // SMTP not configured — open mailto: link in email client
      window.location.href = data.mailto;
      return { ok: true, method: 'mailto' };
    }
    return { ok: true, method: 'smtp' };
  } catch (e: any) {
    return { ok: false, error: e.message || 'Send failed' };
  }
}

/* ═══════════════════════════════════════════
   TAB: EMAIL DRAFTER
═══════════════════════════════════════════ */
function EmailDrafter() {
  const [recipient, setRecipient] = useState('');
  const [subject, setSubject] = useState('');
  const [matter, setMatter] = useState('');
  const [brief, setBrief] = useState('');
  const [tone, setTone] = useState('professional');
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  async function generate() {
    if (!brief.trim()) return;
    setLoading(true); setError(''); setDraft('');
    try {
      const res = await fetch('/api/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipient, subject, brief, tone, matter, senderName: 'Stuart' }),
      });
      const text = await res.text();
      let data: any;
      try { data = JSON.parse(text); } catch { setError('Unexpected response'); setLoading(false); return; }
      if (!res.ok || data.error) { setError(data.error || 'Draft failed'); setLoading(false); return; }
      setDraft(data.draft);
    } catch (e: any) { setError(e?.message || 'Failed'); }
    setLoading(false);
  }

  async function handleSend() {
    if (!draft.trim()) return;
    setSending(true); setError('');
    const inferredSubject = subject || matter ? `Re: ${matter}` : 'Message from Stuart & Co Solicitors';
    const result = await sendEmail(recipient, inferredSubject, draft);
    setSending(false);
    if (!result.ok) { setError(result.error || 'Send failed'); }
    else { setSent(true); setTimeout(() => setSent(false), 3000); }
  }

  async function copy() {
    await navigator.clipboard.writeText(draft);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: '24px', alignItems: 'start' }}>
      {/* Left */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={s.panel}>
          <div style={{ fontSize: '11px', fontWeight: '600', color: 'var(--c-text-3)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Quick templates</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            {QUICK_BRIEFS.map(q => (
              <button key={q.label} onClick={() => { setBrief(q.brief); setTone(q.tone); }} style={{ textAlign: 'left', background: brief === q.brief ? 'var(--c-border)' : 'transparent', border: '1px solid', borderColor: brief === q.brief ? 'var(--c-border)' : 'transparent', borderRadius: '7px', padding: '7px 10px', fontSize: '12px', color: brief === q.brief ? 'var(--c-text)' : 'var(--c-text-3)', cursor: 'pointer', transition: 'all 0.1s' }}>
                {q.label}
              </button>
            ))}
          </div>
        </div>

        <div style={s.panel}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div><label style={s.label}>Recipient</label><input style={s.input} value={recipient} onChange={e => setRecipient(e.target.value)} placeholder="opposing counsel, client name…" /></div>
            <div><label style={s.label}>Subject</label><input style={s.input} value={subject} onChange={e => setSubject(e.target.value)} placeholder="optional — Stu will infer if blank" /></div>
            <div><label style={s.label}>Matter</label><input style={s.input} value={matter} onChange={e => setMatter(e.target.value)} placeholder="e.g. Meridian Capital NDA" /></div>
            <div>
              <label style={s.label}>Tone</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                {TONES.map(t => (
                  <button key={t.value} onClick={() => setTone(t.value)} style={{ padding: '7px', borderRadius: '7px', fontSize: '12px', fontWeight: tone === t.value ? '500' : '400', cursor: 'pointer', border: '1px solid', borderColor: tone === t.value ? 'var(--c-border-s)' : 'var(--c-border)', background: tone === t.value ? 'var(--c-active)' : 'transparent', color: tone === t.value ? 'var(--c-text)' : 'var(--c-text-3)', transition: 'all 0.1s' }}>
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label style={s.label}>Brief <span style={{ color: '#c0392b' }}>*</span></label>
              <textarea style={{ ...s.textarea, minHeight: '90px' }} value={brief} onChange={e => setBrief(e.target.value)} placeholder="Describe what this email needs to achieve." rows={5} />
            </div>
            <button onClick={generate} disabled={loading || !brief.trim()} style={{ ...s.btn, background: loading || !brief.trim() ? 'var(--c-card)' : 'var(--c-text)', color: loading || !brief.trim() ? 'var(--c-text-3)' : 'var(--c-bg)', width: '100%' }}>
              {loading ? 'Drafting…' : 'Draft email'}
            </button>
            {error && <div style={{ fontSize: '12px', color: '#c0392b', padding: '8px 10px', background: 'rgba(220,38,38,0.08)', borderRadius: '6px' }}>{error}</div>}
          </div>
        </div>
      </div>

      {/* Right */}
      <div style={{ ...s.panel, minHeight: '500px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
          <span style={{ fontSize: '11px', fontWeight: '600', color: 'var(--c-text-3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Draft</span>
          {draft && (
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => { setDraft(''); setSent(false); }} style={{ ...s.btn, background: 'transparent', border: '1px solid var(--c-border)', color: 'var(--c-text-2)', padding: '6px 12px', fontSize: '12px' }}>
                <RotateCcw size={12} style={{ display: 'inline', marginRight: '4px' }} />Clear
              </button>
              <button onClick={copy} style={{ ...s.btn, background: copied ? 'rgba(22,163,74,0.1)' : 'var(--c-panel)', border: '1px solid', borderColor: copied ? 'rgba(22,163,74,0.3)' : 'var(--c-border)', color: copied ? '#16a34a' : 'var(--c-text)', padding: '6px 14px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                {copied ? <Check size={12} /> : <Copy size={12} />}
                {copied ? 'Copied' : 'Copy'}
              </button>
              <button onClick={handleSend} disabled={sending || sent || !draft.trim()} style={{ ...s.btn, background: sent ? 'rgba(22,163,74,0.1)' : 'var(--c-text)', border: '1px solid', borderColor: sent ? 'rgba(22,163,74,0.3)' : 'transparent', color: sent ? '#16a34a' : 'var(--c-bg)', padding: '6px 16px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px', opacity: sending ? 0.7 : 1 }}>
                {sent ? <Check size={12} /> : <Send size={12} />}
                {sent ? 'Sent!' : sending ? 'Sending…' : 'Send'}
              </button>
            </div>
          )}
        </div>
        {loading && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
            <div style={{ width: '20px', height: '20px', border: '2px solid var(--c-border)', borderTopColor: 'var(--c-text-2)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            <span style={{ fontSize: '12px', color: 'var(--c-text-3)' }}>Drafting with Stu…</span>
            <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
          </div>
        )}
        {!loading && !draft && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '10px', color: 'var(--c-text-4)' }}>
            <Mail size={32} />
            <span style={{ fontSize: '13px' }}>Your draft will appear here</span>
          </div>
        )}
        {draft && (
          <textarea value={draft} onChange={e => setDraft(e.target.value)} style={{ flex: 1, width: '100%', minHeight: '420px', background: 'transparent', border: 'none', outline: 'none', color: 'var(--c-text)', fontSize: '13.5px', lineHeight: '1.7', resize: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }} />
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   TAB: LEAD OUTREACH
═══════════════════════════════════════════ */
function LeadOutreach() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  // Prospect form
  const [name, setName]             = useState('');
  const [company, setCompany]       = useState('');
  const [email, setEmail]           = useState('');
  const [role, setRole]             = useState('');
  const [industry, setIndustry]     = useState('');
  const [painPoints, setPainPoints] = useState('');
  const [notes, setNotes]           = useState('');

  const [generating, setGenerating] = useState(false);
  const [draft, setDraft]           = useState('');
  const [saving, setSaving]         = useState(false);
  const [sending, setSending]       = useState(false);
  const [sent, setSent]             = useState(false);
  const [error, setError]           = useState('');
  const [copied, setCopied]         = useState(false);

  const loadLeads = useCallback(async () => {
    try {
      const res = await fetch('/api/leads');
      if (res.ok) setLeads(await res.json());
    } catch {}
  }, []);

  useEffect(() => { loadLeads(); }, [loadLeads]);

  function resetForm() {
    setName(''); setCompany(''); setEmail(''); setRole('');
    setIndustry(''); setPainPoints(''); setNotes('');
    setDraft(''); setError('');
    setSelectedLead(null);
  }

  async function generate() {
    if (!name.trim()) { setError('Prospect name is required'); return; }
    setGenerating(true); setError(''); setDraft('');
    try {
      const res = await fetch('/api/leads/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, company, role, industry, painPoints, notes }),
      });
      const data = await res.json();
      if (!res.ok || data.error) { setError(data.error || 'Generation failed'); }
      else { setDraft(data.draft); }
    } catch (e: any) { setError(e.message || 'Failed'); }
    setGenerating(false);
  }

  async function saveLead() {
    if (!name.trim()) { setError('Prospect name is required'); return; }
    setSaving(true); setError('');
    try {
      const method = selectedLead ? 'PATCH' : 'POST';
      const body = selectedLead
        ? { id: selectedLead.id, name, company, email, role, industry, pain_points: painPoints, notes, email_draft: draft }
        : { name, company, email, role, industry, pain_points: painPoints, notes, email_draft: draft, status: 'draft' };
      const res = await fetch('/api/leads', { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok || data.error) { setError(data.error || 'Save failed'); }
      else { await loadLeads(); if (!selectedLead) resetForm(); }
    } catch (e: any) { setError(e.message || 'Failed'); }
    setSaving(false);
  }

  async function updateStatus(id: string, status: LeadStatus) {
    try {
      await fetch('/api/leads', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, status }) });
      await loadLeads();
      if (selectedLead?.id === id) setSelectedLead(prev => prev ? { ...prev, status } : null);
    } catch {}
  }

  async function deleteLead(id: string) {
    try {
      await fetch(`/api/leads?id=${id}`, { method: 'DELETE' });
      await loadLeads();
      if (selectedLead?.id === id) resetForm();
    } catch {}
  }

  function selectLead(lead: Lead) {
    setSelectedLead(lead);
    setName(lead.name);
    setCompany(lead.company || '');
    setEmail(lead.email || '');
    setRole(lead.role || '');
    setIndustry(lead.industry || '');
    setPainPoints(lead.pain_points || '');
    setNotes(lead.notes || '');
    setDraft(lead.email_draft || '');
    setError('');
  }

  async function handleSend() {
    if (!draft.trim()) return;
    setSending(true); setError('');
    const to = email.trim() || (selectedLead?.email ?? '');
    if (!to) { setError('Add a recipient email address first'); setSending(false); return; }
    const subjectLine = `Introduction – Stuart & Co Solicitors${company ? ` & ${company}` : ''}`;
    const result = await sendEmail(to, subjectLine, draft);
    setSending(false);
    if (!result.ok) { setError(result.error || 'Send failed'); return; }
    setSent(true);
    setTimeout(() => setSent(false), 3000);
    // Auto-mark the lead as sent
    if (selectedLead) {
      await updateStatus(selectedLead.id, 'sent');
    } else {
      // Save the lead first with status sent, then load
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, company, email: to, role, industry, pain_points: painPoints, notes, email_draft: draft, status: 'sent' }),
      });
      if (res.ok) { await loadLeads(); }
    }
  }

  async function copy() {
    await navigator.clipboard.writeText(draft);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const statusCounts = Object.keys(STATUS_META).reduce((acc, k) => {
    acc[k as LeadStatus] = leads.filter(l => l.status === k).length;
    return acc;
  }, {} as Record<LeadStatus, number>);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr 280px', gap: '20px', alignItems: 'start' }}>

      {/* ── LEFT: Pipeline list ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={s.panel}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <span style={{ fontSize: '11px', fontWeight: '600', color: 'var(--c-text-3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Pipeline</span>
            <button onClick={resetForm} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--c-text-3)', background: 'transparent', border: '1px solid var(--c-border)', borderRadius: '6px', padding: '4px 8px', cursor: 'pointer' }}>
              <Plus size={10} />New
            </button>
          </div>

          {/* Status summary */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: '14px' }}>
            {(Object.entries(STATUS_META) as [LeadStatus, typeof STATUS_META[LeadStatus]][]).map(([k, m]) => (
              <div key={k} style={{ padding: '6px 8px', borderRadius: '6px', background: m.bg }}>
                <div style={{ fontSize: '16px', fontWeight: '700', color: m.color }}>{statusCounts[k]}</div>
                <div style={{ fontSize: '10px', color: m.color, opacity: 0.8 }}>{m.label}</div>
              </div>
            ))}
          </div>

          {leads.length === 0 && (
            <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--c-text-4)', fontSize: '12px' }}>
              <Users size={24} style={{ marginBottom: '8px', opacity: 0.4 }} />
              <div>No leads yet</div>
              <div style={{ marginTop: '4px', fontSize: '11px' }}>Fill the form to add your first prospect</div>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {leads.map(lead => {
              const meta = STATUS_META[lead.status as LeadStatus] || STATUS_META.draft;
              const active = selectedLead?.id === lead.id;
              return (
                <div key={lead.id} onClick={() => selectLead(lead)} style={{ padding: '10px 12px', borderRadius: '8px', cursor: 'pointer', background: active ? 'var(--c-active)' : 'transparent', border: '1px solid', borderColor: active ? 'var(--c-border-s, var(--c-border))' : 'transparent', transition: 'all 0.1s', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: '13px', fontWeight: '500', color: 'var(--c-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{lead.name}</div>
                    {lead.company && <div style={{ fontSize: '11px', color: 'var(--c-text-3)', marginTop: '1px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{lead.company}</div>}
                  </div>
                  <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '10px', background: meta.bg, color: meta.color, whiteSpace: 'nowrap', flexShrink: 0 }}>{meta.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── CENTRE: Prospect form + draft ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={s.panel}>
          <div style={{ fontSize: '11px', fontWeight: '600', color: 'var(--c-text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '14px' }}>Prospect details</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={s.label}>Full name <span style={{ color: '#c0392b' }}>*</span></label>
              <input style={s.input} value={name} onChange={e => setName(e.target.value)} placeholder="e.g. James Whitfield" />
            </div>
            <div>
              <label style={s.label}>Company</label>
              <input style={s.input} value={company} onChange={e => setCompany(e.target.value)} placeholder="e.g. Albion Ventures" />
            </div>
            <div>
              <label style={s.label}>Email</label>
              <input style={s.input} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="j.whitfield@albion.co.uk" />
            </div>
            <div>
              <label style={s.label}>Role / title</label>
              <input style={s.input} value={role} onChange={e => setRole(e.target.value)} placeholder="e.g. Managing Director" />
            </div>
            <div>
              <label style={s.label}>Industry</label>
              <select value={industry} onChange={e => setIndustry(e.target.value)} style={{ ...s.input, appearance: 'none' }}>
                <option value="">Select industry…</option>
                {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
              </select>
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={s.label}>Pain points / context</label>
              <textarea style={{ ...s.textarea, minHeight: '70px' }} value={painPoints} onChange={e => setPainPoints(e.target.value)} placeholder="What challenges might they face? e.g. rapid expansion, contract disputes, IP concerns…" rows={3} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={s.label}>Additional notes</label>
              <textarea style={{ ...s.textarea, minHeight: '56px' }} value={notes} onChange={e => setNotes(e.target.value)} placeholder="How you know them, mutual connections, any prior contact…" rows={2} />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
            <button onClick={generate} disabled={generating || !name.trim()} style={{ ...s.btn, flex: 1, background: generating || !name.trim() ? 'var(--c-card)' : 'var(--c-text)', color: generating || !name.trim() ? 'var(--c-text-3)' : 'var(--c-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
              <Sparkles size={13} />
              {generating ? 'Generating…' : 'Generate outreach email'}
            </button>
            <button onClick={saveLead} disabled={saving || !name.trim()} style={{ ...s.btn, background: 'var(--c-panel)', border: '1px solid var(--c-border)', color: 'var(--c-text-2)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              {saving ? '…' : selectedLead ? 'Update' : 'Save lead'}
            </button>
          </div>
          {error && <div style={{ marginTop: '10px', fontSize: '12px', color: '#c0392b', padding: '8px 10px', background: 'rgba(220,38,38,0.08)', borderRadius: '6px' }}>{error}</div>}
        </div>

        {/* Draft output */}
        <div style={{ ...s.panel, minHeight: '320px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <span style={{ fontSize: '11px', fontWeight: '600', color: 'var(--c-text-3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Outreach email</span>
            {draft && (
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={copy} style={{ ...s.btn, background: copied ? 'rgba(22,163,74,0.1)' : 'var(--c-panel)', border: '1px solid', borderColor: copied ? 'rgba(22,163,74,0.3)' : 'var(--c-border)', color: copied ? '#16a34a' : 'var(--c-text)', padding: '6px 14px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {copied ? <Check size={12} /> : <Copy size={12} />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
                <button onClick={handleSend} disabled={sending || sent || !draft.trim()} style={{ ...s.btn, background: sent ? 'rgba(22,163,74,0.1)' : 'var(--c-text)', border: '1px solid', borderColor: sent ? 'rgba(22,163,74,0.3)' : 'transparent', color: sent ? '#16a34a' : 'var(--c-bg)', padding: '6px 16px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px', opacity: sending ? 0.7 : 1 }}>
                  {sent ? <Check size={12} /> : <Send size={12} />}
                  {sent ? 'Sent!' : sending ? 'Sending…' : 'Send'}
                </button>
              </div>
            )}
          </div>
          {generating && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
              <div style={{ width: '20px', height: '20px', border: '2px solid var(--c-border)', borderTopColor: 'var(--c-text-2)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              <span style={{ fontSize: '12px', color: 'var(--c-text-3)' }}>Personalising with Stu…</span>
              <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
            </div>
          )}
          {!generating && !draft && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px', color: 'var(--c-text-4)' }}>
              <Send size={28} />
              <span style={{ fontSize: '13px' }}>Personalised outreach will appear here</span>
              <span style={{ fontSize: '11px' }}>Fill in prospect details and click Generate</span>
            </div>
          )}
          {!generating && draft && (
            <textarea value={draft} onChange={e => setDraft(e.target.value)} style={{ flex: 1, width: '100%', minHeight: '260px', background: 'transparent', border: 'none', outline: 'none', color: 'var(--c-text)', fontSize: '13.5px', lineHeight: '1.7', resize: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }} />
          )}
        </div>
      </div>

      {/* ── RIGHT: Lead detail / status ── */}
      <div style={s.panel}>
        {!selectedLead ? (
          <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--c-text-4)' }}>
            <ChevronRight size={24} style={{ opacity: 0.4, marginBottom: '8px' }} />
            <div style={{ fontSize: '12px' }}>Select a lead to manage status</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <div style={{ fontSize: '15px', fontWeight: '600', color: 'var(--c-text)' }}>{selectedLead.name}</div>
              {selectedLead.company && <div style={{ fontSize: '12px', color: 'var(--c-text-3)', marginTop: '2px' }}>{selectedLead.role ? `${selectedLead.role} · ` : ''}{selectedLead.company}</div>}
              {selectedLead.email && <div style={{ fontSize: '12px', color: 'var(--c-text-3)', marginTop: '2px' }}>{selectedLead.email}</div>}
            </div>

            <div>
              <div style={{ fontSize: '11px', fontWeight: '600', color: 'var(--c-text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>Status</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                {(Object.entries(STATUS_META) as [LeadStatus, typeof STATUS_META[LeadStatus]][]).map(([k, m]) => (
                  <button key={k} onClick={() => updateStatus(selectedLead.id, k)} style={{ padding: '7px 10px', borderRadius: '7px', fontSize: '12px', cursor: 'pointer', border: '1px solid', fontWeight: selectedLead.status === k ? '500' : '400', borderColor: selectedLead.status === k ? m.color + '44' : 'var(--c-border)', background: selectedLead.status === k ? m.bg : 'transparent', color: selectedLead.status === k ? m.color : 'var(--c-text-3)', textAlign: 'left', transition: 'all 0.1s', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: m.color, flexShrink: 0, opacity: selectedLead.status === k ? 1 : 0.3 }} />
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--c-border)', paddingTop: '12px' }}>
              <div style={{ fontSize: '11px', color: 'var(--c-text-4)' }}>Added {new Date(selectedLead.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
            </div>

            <button onClick={() => deleteLead(selectedLead.id)} style={{ ...s.btn, background: 'rgba(220,38,38,0.07)', border: '1px solid rgba(220,38,38,0.2)', color: '#dc2626', fontSize: '12px', padding: '7px 12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
              <Trash2 size={12} />Remove lead
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   PAGE ROOT
═══════════════════════════════════════════ */
type Tab = 'drafter' | 'outreach';

export default function EmailPage() {
  const [tab, setTab] = useState<Tab>('drafter');

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'drafter',  label: 'Email Drafter',  icon: <Mail size={13} /> },
    { id: 'outreach', label: 'Lead Outreach',  icon: <Users size={13} /> },
  ];

  return (
    <div style={{ padding: '40px', maxWidth: tab === 'outreach' ? '1240px' : '1100px' }}>
      {/* Page header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
        <Mail size={18} color="var(--c-text-3)" />
        <h1 style={{ fontSize: '20px', fontWeight: '600', color: 'var(--c-text)', margin: 0 }}>Email</h1>
      </div>
      <p style={{ fontSize: '13px', color: 'var(--c-text-3)', marginBottom: '24px', marginTop: '4px' }}>
        {tab === 'drafter' ? 'Describe what the email needs to do — Stu writes it.' : 'Generate personalised legal outreach and track your prospects.'}
      </p>

      {/* Tab bar */}
      <div style={{ display: 'flex', gap: '2px', marginBottom: '24px', padding: '3px', background: 'var(--c-panel)', borderRadius: '10px', width: 'fit-content', border: '1px solid var(--c-border)' }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 16px', borderRadius: '7px', fontSize: '13px', fontWeight: tab === t.id ? '500' : '400', cursor: 'pointer', border: 'none', background: tab === t.id ? 'var(--c-bg)' : 'transparent', color: tab === t.id ? 'var(--c-text)' : 'var(--c-text-3)', boxShadow: tab === t.id ? '0 1px 3px rgba(0,0,0,0.08)' : 'none', transition: 'all 0.15s' }}>
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'drafter'  && <EmailDrafter />}
      {tab === 'outreach' && <LeadOutreach />}
    </div>
  );
}
