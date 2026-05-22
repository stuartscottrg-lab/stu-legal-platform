'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ChevronRight, Send, Copy, Check, Loader2, AlignLeft, Scissors, Languages, GitCompare, PlayCircle, X } from 'lucide-react';

interface Props {
  doc: any; matter: any; annotations: any[];
  initialMessages: any[]; playbooks: any[];
}

/* ── Annotated text renderer ── */
function AnnotatedText({ text, annotations }: { text: string; annotations: any[] }) {
  const [tooltip, setTooltip] = useState<any>(null);
  if (!text) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '300px', color: 'var(--c-text-3)', fontSize: '13px', gap: '8px' }}>
      <Loader2 size={20} className="animate-spin" />
      Extracting document text…
    </div>
  );

  const sorted = [...annotations].filter(a => a.start_offset >= 0 && a.end_offset > a.start_offset).sort((a,b) => a.start_offset - b.start_offset);
  const parts: React.ReactNode[] = [];
  let cursor = 0;
  for (const ann of sorted) {
    if (ann.start_offset > cursor) parts.push(<span key={`t${cursor}`}>{text.slice(cursor, ann.start_offset)}</span>);
    const cls = ann.severity === 'high' ? 'annotation-high' : ann.severity === 'medium' ? 'annotation-medium' : 'annotation-low';
    parts.push(<span key={ann.id} className={cls} onClick={() => setTooltip(ann)}>{text.slice(ann.start_offset, ann.end_offset)}</span>);
    cursor = ann.end_offset;
  }
  if (cursor < text.length) parts.push(<span key="tail">{text.slice(cursor)}</span>);

  return (
    <div>
      <div style={{ fontFamily: 'Georgia, "Times New Roman", serif', fontSize: '14px', lineHeight: '1.85', color: 'var(--c-text)', whiteSpace: 'pre-wrap', padding: '40px 48px', maxWidth: '720px' }}>
        {parts}
      </div>
      {tooltip && <>
        <div onClick={() => setTooltip(null)} style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.6)' }} />
        <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 51, background: 'var(--c-panel)', border: '1px solid #333', borderRadius: '12px', padding: '22px', maxWidth: '420px', width: '90vw', boxShadow: '0 24px 64px rgba(0,0,0,0.9)' }}>
          <button onClick={() => setTooltip(null)} style={{ position: 'absolute', top: '12px', right: '12px', background: 'none', border: 'none', color: 'var(--c-text-3)', cursor: 'pointer' }}><X size={15} /></button>
          <span style={{ fontSize: '10px', letterSpacing: '0.6px', textTransform: 'uppercase', color: tooltip.severity==='high' ? '#ef4444' : tooltip.severity==='medium' ? '#f59e0b' : '#22c55e', background: tooltip.severity==='high' ? 'rgba(239,68,68,0.12)' : tooltip.severity==='medium' ? 'rgba(245,158,11,0.12)' : 'rgba(34,197,94,0.12)', padding: '3px 9px', borderRadius: '20px', display: 'inline-block', marginBottom: '12px' }}>{tooltip.severity} risk</span>
          <p style={{ fontSize: '13px', color: 'var(--c-text)', lineHeight: '1.6', marginBottom: tooltip.suggestion ? '14px' : 0 }}>{tooltip.comment}</p>
          {tooltip.suggestion && <><div style={{ fontSize: '11px', color: 'var(--c-text-3)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Suggested fix</div><p style={{ fontSize: '13px', color: 'var(--c-text-2)', fontStyle: 'italic', lineHeight: '1.6' }}>{tooltip.suggestion}</p></>}
        </div>
      </>}
    </div>
  );
}

/* ── Workflow panel ── */
function WorkflowPanel({ doc, playbooks }: { doc: any; playbooks: any[] }) {
  const [active, setActive] = useState<string|null>(null);
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [playbookId, setPlaybookId] = useState(playbooks[0]?.id || '');
  const [pbResults, setPbResults] = useState<any[]>([]);
  const [language, setLanguage] = useState('French');
  const [copied, setCopied] = useState(false);

  const workflows = [
    { id: 'playbook', label: 'Run Playbook', icon: PlayCircle, desc: 'Review against a checklist' },
    { id: 'summarize', label: 'Summarise', icon: AlignLeft, desc: 'Executive summary' },
    { id: 'redact', label: 'Redact', icon: Scissors, desc: 'Identify PII & sensitive data' },
    { id: 'translate', label: 'Translate', icon: Languages, desc: 'Translate to another language' },
    { id: 'compare', label: 'Compare', icon: GitCompare, desc: 'Compare with another document' },
  ];

  const run = async (action: string) => {
    setLoading(true); setResult(''); setPbResults([]);
    try {
      if (action === 'playbook') {
        const res = await fetch('/api/ai/workflow', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ action: 'playbook', documentId: doc.id, params: { playbookId } }) });
        if (!res.ok) { setResult('Error running playbook. Please try again.'); setLoading(false); return; }
        const reader = res.body!.getReader(); const dec = new TextDecoder();
        while (true) {
          const { done, value } = await reader.read(); if (done) break;
          for (const line of dec.decode(value).split('\n').filter(l => l.startsWith('data: '))) {
            const d = line.slice(6); if (d === '[DONE]') break;
            try { const parsed = JSON.parse(d); if (!parsed.error) setPbResults(p => [...p, parsed]); } catch {}
          }
        }
      } else {
        const res = await fetch('/api/ai/workflow', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ action, documentId: doc.id, params: { language } }) });
        const text = await res.text();
        let data: any = {};
        try { data = JSON.parse(text); } catch { setResult('Server error. Please try again.'); setLoading(false); return; }
        if (data.error) { setResult(`Error: ${data.error}`); setLoading(false); return; }
        setResult(data.result || (data.redactions ? `${data.redactions.length} redactions identified:\n\n` + data.redactions.map((r: any) => `• "${r.text}" — ${r.reason}`).join('\n') : '') || 'No result returned.');
      }
    } catch (e: any) {
      setResult(`Error: ${e?.message || 'Request failed. Please try again.'}`);
    }
    setLoading(false);
  };

  const copy = () => { navigator.clipboard.writeText(result); setCopied(true); setTimeout(() => setCopied(false), 2000); };

  const cardStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '12px', background: 'var(--c-panel)', border: '1px solid var(--c-border)', borderRadius: '10px', padding: '14px 16px', cursor: 'pointer', width: '100%', textAlign: 'left', transition: 'border-color 0.15s' };

  if (!active) return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {workflows.map(w => (
        <button key={w.id} onClick={() => { setActive(w.id); if (w.id === 'summarize') { setActive(w.id); run(w.id); } }} style={cardStyle}>
          <w.icon size={18} color="#777" style={{ flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--c-text)', marginBottom: '2px' }}>{w.label}</div>
            <div style={{ fontSize: '12px', color: 'var(--c-text-2)' }}>{w.desc}</div>
          </div>
          <ChevronRight size={13} color="#444" />
        </button>
      ))}
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '18px' }}>
        <button onClick={() => { setActive(null); setResult(''); setPbResults([]); }} style={{ background: 'none', border: 'none', color: 'var(--c-text-2)', cursor: 'pointer', fontSize: '18px', lineHeight: 1, padding: '2px 4px' }}>←</button>
        <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--c-text)' }}>{workflows.find(w => w.id === active)?.label}</span>
      </div>

      {active === 'playbook' && !pbResults.length && (
        <div style={{ marginBottom: '14px' }}>
          <select value={playbookId} onChange={e => setPlaybookId(e.target.value)} style={{ width: '100%', background: 'var(--c-panel)', border: '1px solid var(--c-border)', borderRadius: '7px', padding: '9px 12px', color: 'var(--c-text)', fontSize: '13px', outline: 'none', marginBottom: '10px', fontFamily: 'inherit' }}>
            {playbooks.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <button onClick={() => run('playbook')} disabled={loading} style={{ background: 'var(--c-accent-bg)', color: 'var(--c-accent-text)', border: 'none', borderRadius: '7px', padding: '10px 16px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', width: '100%' }}>
            {loading ? 'Starting…' : 'Run Playbook'}
          </button>
        </div>
      )}

      {active === 'translate' && !result && !loading && (
        <div style={{ marginBottom: '14px' }}>
          <select value={language} onChange={e => setLanguage(e.target.value)} style={{ width: '100%', background: 'var(--c-panel)', border: '1px solid var(--c-border)', borderRadius: '7px', padding: '9px 12px', color: 'var(--c-text)', fontSize: '13px', outline: 'none', marginBottom: '10px', fontFamily: 'inherit' }}>
            {['French','German','Spanish','Italian','Portuguese','Dutch','Chinese','Japanese','Arabic','Russian'].map(l => <option key={l}>{l}</option>)}
          </select>
          <button onClick={() => run('translate')} style={{ background: 'var(--c-accent-bg)', color: 'var(--c-accent-text)', border: 'none', borderRadius: '7px', padding: '10px 16px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', width: '100%' }}>Translate</button>
        </div>
      )}

      {active === 'redact' && !result && !loading && (
        <button onClick={() => run('redact')} style={{ background: 'var(--c-accent-bg)', color: 'var(--c-accent-text)', border: 'none', borderRadius: '7px', padding: '10px 16px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', width: '100%', marginBottom: '14px' }}>Identify Redactions</button>
      )}

      {active === 'compare' && !result && !loading && (
        <div style={{ padding: '20px', background: 'var(--c-panel)', borderRadius: '8px', color: 'var(--c-text-2)', fontSize: '13px', textAlign: 'center' }}>Upload a second document to compare against this one — coming soon.</div>
      )}

      {loading && !pbResults.length && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--c-text-2)', fontSize: '13px', padding: '24px 0' }}>
          <Loader2 size={14} className="animate-spin" /> Analysing with Claude…
        </div>
      )}

      {pbResults.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, overflowY: 'auto' }}>
          {pbResults.map((r, i) => (
            <div key={i} style={{ background: 'var(--c-panel)', border: '1px solid var(--c-border)', borderRadius: '8px', padding: '12px 14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <span style={{ fontSize: '13px' }}>{r.status==='pass'?'✅':r.status==='issue'?'⚠️':'❌'}</span>
                <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--c-text)' }}>{r.label}</span>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--c-text-2)', lineHeight: '1.55' }}>{r.explanation}</p>
            </div>
          ))}
          {loading && <div style={{ color: 'var(--c-text-3)', fontSize: '12px', textAlign: 'center', padding: '8px' }}>Checking more items…</div>}
        </div>
      )}

      {result && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8px' }}>
            <button onClick={copy} style={{ display: 'flex', alignItems: 'center', gap: '5px', background: 'none', border: '1px solid var(--c-border)', borderRadius: '6px', padding: '5px 10px', color: 'var(--c-text-2)', fontSize: '12px', cursor: 'pointer' }}>
              {copied ? <><Check size={11} /> Copied</> : <><Copy size={11} /> Copy</>}
            </button>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', background: 'var(--c-panel)', borderRadius: '8px', padding: '16px', fontSize: '13px', color: 'var(--c-text)', lineHeight: '1.75', whiteSpace: 'pre-wrap' }}>{result}</div>
        </div>
      )}
    </div>
  );
}

/* ── Chat panel ── */
function ChatPanel({ doc, initialMessages }: { doc: any; initialMessages: any[] }) {
  const [messages, setMessages] = useState<{role:string,content:string}[]>(initialMessages.map(m => ({role:m.role,content:m.content})));
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const starters = ['What are the key risks in this agreement?','Summarise the indemnification clause','Is the governing law clause standard?','List all party obligations'];

  const send = useCallback(async (text?: string) => {
    const q = text || input;
    if (!q.trim() || loading) return;
    const newMsgs = [...messages, { role: 'user', content: q }];
    setMessages(newMsgs);
    setInput('');
    setLoading(true);
    setMessages(m => [...m, { role: 'assistant', content: '' }]);

    try {
      const res = await fetch('/api/ai/chat', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ documentId: doc.id, messages: newMsgs }) });
      if (!res.ok || !res.body) {
        setMessages(m => [...m.slice(0,-1), { role: 'assistant', content: 'Sorry, something went wrong. Please try again.' }]);
        setLoading(false); return;
      }
      const reader = res.body.getReader(); const dec = new TextDecoder();
      let resp = '';
      while (true) {
        const { done, value } = await reader.read(); if (done) break;
        for (const line of dec.decode(value).split('\n').filter(l => l.startsWith('data: '))) {
          const d = line.slice(6); if (d === '[DONE]') break;
          try {
            const parsed = JSON.parse(d);
            if (parsed.error) { resp = `Error: ${parsed.error}`; }
            else if (parsed.text) { resp += parsed.text; }
            setMessages(m => [...m.slice(0,-1), { role: 'assistant', content: resp }]);
          } catch {}
        }
      }
    } catch (e: any) {
      setMessages(m => [...m.slice(0,-1), { role: 'assistant', content: `Error: ${e?.message || 'Request failed. Please try again.'}` }]);
    } finally { setLoading(false); }
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
  }, [messages, input, loading, doc.id]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ flex: 1, overflowY: 'auto', marginBottom: '14px' }}>
        {messages.length === 0
          ? <div>
              <p style={{ fontSize: '12px', color: 'var(--c-text-3)', marginBottom: '10px' }}>Ask Stu anything about this document</p>
              {starters.map(s => (
                <button key={s} onClick={() => send(s)} style={{ display: 'block', width: '100%', background: 'var(--c-panel)', border: '1px solid var(--c-border)', borderRadius: '8px', padding: '10px 12px', fontSize: '12px', color: 'var(--c-text-2)', cursor: 'pointer', textAlign: 'left', marginBottom: '6px', fontFamily: 'inherit' }}>{s}</button>
              ))}
            </div>
          : <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              {messages.map((m, i) => (
                <div key={i}>
                  <div style={{ fontSize: '10px', color: 'var(--c-text-3)', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.6px' }}>{m.role === 'user' ? 'You' : 'Stu'}</div>
                  <div style={{ fontSize: '13px', color: m.role==='user' ? '#f0f0f0' : '#bbb', lineHeight: '1.65', whiteSpace: 'pre-wrap' }}>{m.content || (loading && i === messages.length-1 ? <span style={{color:'#555'}}>Thinking…</span> : '')}</div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>
        }
      </div>
      <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end', borderTop: '1px solid #222', paddingTop: '14px' }}>
        <textarea value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();send();} }} rows={2} placeholder="Ask Stu anything about this document…" style={{ flex: 1, background: 'var(--c-panel)', border: '1px solid var(--c-border)', borderRadius: '8px', padding: '10px 12px', color: 'var(--c-text)', fontSize: '13px', outline: 'none', resize: 'none', fontFamily: 'inherit' }} />
        <button onClick={() => send()} disabled={loading || !input.trim()} style={{ background: 'var(--c-accent-bg)', color: 'var(--c-accent-text)', border: 'none', borderRadius: '8px', padding: '10px 13px', cursor: 'pointer', opacity: loading||!input.trim() ? 0.4 : 1, flexShrink: 0 }}>
          <Send size={13} />
        </button>
      </div>
    </div>
  );
}

/* ── Main 3-column layout ── */
export default function DocumentReviewClient({ doc, matter, annotations, initialMessages, playbooks }: Props) {
  const [panel, setPanel] = useState<'workflows'|'chat'>('workflows');
  const [docStatus, setDocStatus] = useState(doc.status);
  const [liveAnnotations, setLiveAnnotations] = useState(annotations);

  useEffect(() => {
    if (docStatus !== 'processing') return;
    const id = setInterval(async () => {
      const res = await fetch(`/api/documents/${doc.id}/status`);
      const data = await res.json();
      if (data.status === 'ready') {
        setDocStatus('ready');
        // Re-fetch doc with annotations
        const full = await fetch(`/api/documents/${doc.id}`).then(r => r.json());
        if (full.annotations) setLiveAnnotations(full.annotations);
        clearInterval(id);
      }
    }, 3000);
    return () => clearInterval(id);
  }, [docStatus, doc.id]);

  const tabStyle = (active: boolean): React.CSSProperties => ({
    flex: 1, padding: '11px', fontSize: '12px', fontWeight: '500', background: 'none', border: 'none', cursor: 'pointer',
    color: active ? '#f0f0f0' : '#555', borderBottom: `1px solid ${active ? '#f0f0f0' : 'transparent'}`, transition: 'color 0.15s',
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      {/* Topbar */}
      <div style={{ height: '46px', flexShrink: 0, borderBottom: '1px solid var(--c-border)', display: 'flex', alignItems: 'center', padding: '0 20px', gap: '6px', background: 'var(--c-bg)' }}>
        <Link href="/matters" style={{ color: 'var(--c-text-3)', fontSize: '13px', textDecoration: 'none' }}>Matters</Link>
        <ChevronRight size={11} color="#444" />
        <Link href={`/matters/${matter.id}`} style={{ color: 'var(--c-text-3)', fontSize: '13px', textDecoration: 'none' }}>{matter.title}</Link>
        <ChevronRight size={11} color="#444" />
        <span style={{ color: 'var(--c-text)', fontSize: '13px' }}>{doc.original_name}</span>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '10px' }}>
          {liveAnnotations.length > 0 && <span style={{ fontSize: '11px', color: 'var(--c-text-2)' }}>{liveAnnotations.length} annotations</span>}
          {docStatus === 'processing' && <span style={{ fontSize: '11px', color: '#f59e0b', background: 'rgba(245,158,11,0.1)', padding: '3px 9px', borderRadius: '20px' }}>Processing…</span>}
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Document viewer */}
        <div style={{ flex: 1, overflowY: 'auto', background: 'var(--c-card)' }}>
          {docStatus === 'processing'
            ? <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: '14px' }}>
                <Loader2 size={22} color="#555" className="animate-spin" />
                <p style={{ color: 'var(--c-text-2)', fontSize: '13px' }}>Extracting text and analysing document…</p>
              </div>
            : <AnnotatedText text={doc.extracted_text} annotations={liveAnnotations} />
          }
        </div>

        {/* Right panel */}
        <div style={{ width: '380px', flexShrink: 0, borderLeft: '1px solid var(--c-border)', background: 'var(--c-panel)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', borderBottom: '1px solid var(--c-border)', flexShrink: 0 }}>
            <button style={tabStyle(panel==='workflows')} onClick={() => setPanel('workflows')}>Workflows</button>
            <button style={tabStyle(panel==='chat')} onClick={() => setPanel('chat')}>Ask Anything</button>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
            {panel === 'workflows'
              ? <WorkflowPanel doc={doc} playbooks={playbooks} />
              : <ChatPanel doc={doc} initialMessages={initialMessages} />
            }
          </div>
        </div>
      </div>
    </div>
  );
}
