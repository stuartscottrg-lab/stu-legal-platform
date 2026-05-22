'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  ChevronRight, Send, Loader2, X, Check, Copy, Pencil, RotateCcw,
  FileText, AlertTriangle, CheckCircle, ChevronDown, ArrowLeft,
} from 'lucide-react';

interface Props {
  doc: any;
  matter: any | null;
  annotations: any[];
  initialMessages: any[];
}

type Msg = { role: 'user' | 'assistant'; content: string };
type EditProposal = { explanation: string; revised: string; isStreaming: boolean };

/* ── Risk badge ── */
function RiskBadge({ severity }: { severity: string }) {
  const map: Record<string, { color: string; bg: string }> = {
    high: { color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
    medium: { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
    low: { color: '#22c55e', bg: 'rgba(34,197,94,0.1)' },
  };
  const s = map[severity] || map.low;
  return (
    <span style={{ fontSize: '10px', fontWeight: '600', padding: '2px 8px', borderRadius: '20px', color: s.color, background: s.bg, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
      {severity}
    </span>
  );
}

/* ── Annotated document renderer ── */
function DocContent({
  text,
  annotations,
  editProposal,
  selectedText,
  onSelect,
}: {
  text: string;
  annotations: any[];
  editProposal: EditProposal | null;
  selectedText: string;
  onSelect: (t: string) => void;
}) {
  const [tooltip, setTooltip] = useState<any>(null);
  const ref = useRef<HTMLDivElement>(null);

  const handleMouseUp = () => {
    const sel = window.getSelection();
    const t = sel?.toString().trim() || '';
    onSelect(t);
  };

  // If there's a streaming edit, show the revised version with highlight
  if (editProposal) {
    const { revised, isStreaming } = editProposal;
    return (
      <div style={{ fontFamily: 'Georgia, "Times New Roman", serif', fontSize: '14px', lineHeight: '1.9', color: 'var(--c-text)', whiteSpace: 'pre-wrap', padding: '40px 48px', maxWidth: '740px' }}>
        {isStreaming && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', color: '#22c55e', fontSize: '12px', fontFamily: 'system-ui' }}>
            <Loader2 size={12} className="animate-spin" />
            Generating edit…
          </div>
        )}
        <div style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: '6px', padding: '2px 6px', display: 'inline' }}>
          {revised || <span style={{ opacity: 0.4 }}>Generating…</span>}
        </div>
      </div>
    );
  }

  if (!text) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '50vh', gap: '10px', color: 'var(--c-text-3)' }}>
      <Loader2 size={20} className="animate-spin" />
      <span style={{ fontSize: '13px' }}>Extracting text…</span>
    </div>
  );

  // Render with annotation highlights
  const sorted = [...annotations]
    .filter(a => a.start_offset >= 0 && a.end_offset > a.start_offset)
    .sort((a, b) => a.start_offset - b.start_offset);

  const parts: React.ReactNode[] = [];
  let cursor = 0;
  for (const ann of sorted) {
    if (ann.start_offset > cursor) parts.push(<span key={`t${cursor}`}>{text.slice(cursor, ann.start_offset)}</span>);
    const cls = ann.severity === 'high' ? 'annotation-high' : ann.severity === 'medium' ? 'annotation-medium' : 'annotation-low';
    parts.push(
      <span key={ann.id} className={cls} onClick={() => setTooltip(ann)}>
        {text.slice(ann.start_offset, ann.end_offset)}
      </span>
    );
    cursor = ann.end_offset;
  }
  if (cursor < text.length) parts.push(<span key="tail">{text.slice(cursor)}</span>);

  return (
    <>
      <div
        ref={ref}
        onMouseUp={handleMouseUp}
        style={{ fontFamily: 'Georgia, "Times New Roman", serif', fontSize: '14px', lineHeight: '1.9', color: 'var(--c-text)', whiteSpace: 'pre-wrap', padding: '40px 48px', maxWidth: '740px', userSelect: 'text' }}
      >
        {parts}
      </div>
      {tooltip && (
        <>
          <div onClick={() => setTooltip(null)} style={{ position: 'fixed', inset: 0, zIndex: 50 }} />
          <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 51, background: 'var(--c-panel)', border: '1px solid var(--c-border)', borderRadius: '14px', padding: '22px', maxWidth: '400px', width: '90vw', boxShadow: '0 20px 60px rgba(0,0,0,0.4)' }}>
            <button onClick={() => setTooltip(null)} style={{ position: 'absolute', top: '12px', right: '12px', background: 'none', border: 'none', color: 'var(--c-text-3)', cursor: 'pointer' }}>
              <X size={14} />
            </button>
            <RiskBadge severity={tooltip.severity} />
            <p style={{ fontSize: '13px', color: 'var(--c-text)', lineHeight: '1.65', margin: '12px 0 0' }}>{tooltip.comment}</p>
            {tooltip.suggestion && (
              <div style={{ marginTop: '12px', padding: '10px 12px', background: 'rgba(34,197,94,0.06)', borderRadius: '8px', border: '1px solid rgba(34,197,94,0.15)' }}>
                <p style={{ fontSize: '11px', color: '#22c55e', marginBottom: '4px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Suggestion</p>
                <p style={{ fontSize: '12px', color: 'var(--c-text-2)', lineHeight: '1.6', fontStyle: 'italic' }}>{tooltip.suggestion}</p>
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
}

/* ── Suggested edit message bubble ── */
function EditBubble({
  explanation,
  revised,
  isStreaming,
  onAccept,
  onDismiss,
}: {
  explanation: string;
  revised: string;
  isStreaming: boolean;
  onAccept: () => void;
  onDismiss: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const copy = () => { navigator.clipboard.writeText(revised); setCopied(true); setTimeout(() => setCopied(false), 2000); };

  return (
    <div style={{ background: 'rgba(34,197,94,0.05)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: '10px', padding: '14px', marginTop: '8px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
        {isStreaming
          ? <Loader2 size={12} color="#22c55e" className="animate-spin" />
          : <CheckCircle size={12} color="#22c55e" />}
        <span style={{ fontSize: '11px', fontWeight: '600', color: '#22c55e', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          {isStreaming ? 'Generating edit…' : 'Edit ready'}
        </span>
      </div>
      {explanation && (
        <p style={{ fontSize: '13px', color: 'var(--c-text-2)', lineHeight: '1.6', marginBottom: '10px' }}>{explanation}</p>
      )}
      {!isStreaming && revised && (
        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            onClick={onAccept}
            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', background: '#22c55e', color: '#fff', border: 'none', borderRadius: '7px', padding: '9px 12px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}
          >
            <Check size={12} /> Accept
          </button>
          <button
            onClick={copy}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', background: 'var(--c-panel)', color: 'var(--c-text-2)', border: '1px solid var(--c-border)', borderRadius: '7px', padding: '9px 12px', fontSize: '12px', cursor: 'pointer' }}
          >
            {copied ? <Check size={12} /> : <Copy size={12} />}
          </button>
          <button
            onClick={onDismiss}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', background: 'var(--c-panel)', color: 'var(--c-text-3)', border: '1px solid var(--c-border)', borderRadius: '7px', padding: '9px 12px', fontSize: '12px', cursor: 'pointer' }}
          >
            <X size={12} />
          </button>
        </div>
      )}
    </div>
  );
}

/* ── Main viewer ── */
export default function DocumentViewer({ doc, matter, annotations, initialMessages }: Props) {
  const [docText, setDocText] = useState<string>(doc.extracted_text || '');
  const [docStatus, setDocStatus] = useState(doc.status);
  const [liveAnnotations, setLiveAnnotations] = useState(annotations);
  const [messages, setMessages] = useState<Msg[]>(initialMessages.map(m => ({ role: m.role, content: m.content })));
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editProposal, setEditProposal] = useState<EditProposal | null>(null);
  const [selectedText, setSelectedText] = useState('');
  const [saved, setSaved] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Poll while processing
  useEffect(() => {
    if (docStatus !== 'processing') return;
    let cancelled = false;
    const poll = async () => {
      try {
        const d = await fetch(`/api/documents/${doc.id}`).then(r => r.json());
        if (d.status === 'ready') {
          if (!cancelled) { setDocStatus('ready'); setDocText(d.extracted_text || ''); setLiveAnnotations(d.annotations || []); }
          return;
        }
      } catch {}
      if (!cancelled) setTimeout(poll, 2000);
    };
    poll();
    return () => { cancelled = true; };
  }, [docStatus, doc.id]);

  const scrollBottom = () => setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);

  // Send chat message
  const sendChat = useCallback(async (text?: string) => {
    const q = (text || input).trim();
    if (!q || loading) return;
    setInput('');
    setLoading(true);
    const newMsgs: Msg[] = [...messages, { role: 'user', content: q }];
    setMessages([...newMsgs, { role: 'assistant', content: '' }]);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentId: doc.id, messages: newMsgs }),
      });
      const reader = res.body!.getReader();
      const dec = new TextDecoder();
      let resp = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        for (const line of dec.decode(value).split('\n').filter(l => l.startsWith('data: '))) {
          const d = line.slice(6);
          if (d === '[DONE]') break;
          try {
            const p = JSON.parse(d);
            if (p.text) { resp += p.text; setMessages(m => [...m.slice(0, -1), { role: 'assistant', content: resp }]); }
          } catch {}
        }
      }
    } catch {
      setMessages(m => [...m.slice(0, -1), { role: 'assistant', content: 'Something went wrong. Please try again.' }]);
    }
    setLoading(false);
    scrollBottom();
  }, [messages, input, loading, doc.id]);

  // Send edit instruction
  const sendEdit = useCallback(async (instruction?: string) => {
    const q = (instruction || input).trim();
    if (!q || loading) return;
    setInput('');
    setLoading(true);
    const userMsg: Msg = { role: 'user', content: selectedText ? `Edit selected text: "${selectedText.slice(0, 80)}…"\n\n${q}` : q };
    setMessages(m => [...m, userMsg]);
    setEditProposal({ explanation: '', revised: '', isStreaming: true });
    scrollBottom();

    try {
      const res = await fetch('/api/ai/edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ docId: doc.id, instruction: q, selectedText: selectedText || undefined }),
      });
      const reader = res.body!.getReader();
      const dec = new TextDecoder();
      let explanation = '';
      let revised = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        for (const line of dec.decode(value).split('\n').filter(l => l.startsWith('data: '))) {
          const d = line.slice(6);
          if (d === '[DONE]') break;
          try {
            const p = JSON.parse(d);
            if (p.type === 'explanation') { explanation = p.text; setEditProposal(ep => ep ? { ...ep, explanation } : null); }
            if (p.type === 'revised_chunk') { revised += p.text; setEditProposal(ep => ep ? { ...ep, revised } : null); }
            if (p.type === 'done') { revised = p.fullRevised || revised; setEditProposal({ explanation, revised, isStreaming: false }); }
          } catch {}
        }
      }
    } catch {
      setEditProposal(null);
      setMessages(m => [...m, { role: 'assistant', content: 'Edit failed. Please try again.' }]);
    }
    setLoading(false);
  }, [input, loading, doc.id, selectedText]);

  const acceptEdit = async () => {
    if (!editProposal?.revised) return;
    const newText = selectedText
      ? docText.replace(selectedText, editProposal.revised)
      : editProposal.revised;
    setDocText(newText);
    setEditProposal(null);
    setSaved(false);
    await fetch(`/api/documents/${doc.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ extracted_text: newText }) });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    setMessages(m => [...m, { role: 'assistant', content: '✓ Edit applied to document.' }]);
  };

  const starters = [
    'What are the key risks in this agreement?',
    'Summarise the main obligations of each party',
    'Is the limitation of liability clause standard?',
    'Identify any unusual or one-sided clauses',
  ];

  const editStarters = [
    'Rewrite the indemnity clause to be more balanced',
    'Make the termination clause more favourable to the client',
    'Simplify the governing law section',
    'Add a force majeure clause',
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', overflow: 'hidden' }}>

      {/* Top bar */}
      <div style={{ height: '48px', flexShrink: 0, borderBottom: '1px solid var(--c-border)', display: 'flex', alignItems: 'center', padding: '0 16px', gap: '8px', background: 'var(--c-bg)' }}>
        <Link href="/documents" style={{ display: 'flex', alignItems: 'center', color: 'var(--c-text-3)', textDecoration: 'none' }}>
          <ArrowLeft size={14} />
        </Link>
        <span style={{ color: 'var(--c-border)', margin: '0 4px' }}>|</span>
        {matter && (
          <>
            <Link href={`/matters/${matter.id}`} style={{ fontSize: '12px', color: 'var(--c-text-3)', textDecoration: 'none' }}>{matter.title}</Link>
            <ChevronRight size={11} color="var(--c-text-3)" />
          </>
        )}
        <FileText size={13} color="var(--c-text-3)" />
        <span style={{ fontSize: '13px', fontWeight: '500', color: 'var(--c-text)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.original_name}</span>

        {/* Edit mode toggle */}
        <button
          onClick={() => { setEditMode(!editMode); setEditProposal(null); }}
          style={{ display: 'flex', alignItems: 'center', gap: '5px', background: editMode ? 'rgba(34,197,94,0.1)' : 'var(--c-panel)', color: editMode ? '#22c55e' : 'var(--c-text-2)', border: `1px solid ${editMode ? 'rgba(34,197,94,0.3)' : 'var(--c-border)'}`, borderRadius: '7px', padding: '5px 11px', fontSize: '12px', fontWeight: '500', cursor: 'pointer', transition: 'all 0.15s' }}
        >
          <Pencil size={11} />
          {editMode ? 'Editing' : 'Edit'}
        </button>

        {saved && (
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#22c55e' }}>
            <Check size={11} /> Saved
          </span>
        )}

        {liveAnnotations.length > 0 && (
          <span style={{ fontSize: '11px', color: 'var(--c-text-3)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <AlertTriangle size={11} /> {liveAnnotations.filter(a => a.severity === 'high').length} high risk
          </span>
        )}

        {docStatus === 'processing' && (
          <span style={{ fontSize: '11px', color: '#f59e0b', background: 'rgba(245,158,11,0.1)', padding: '3px 9px', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Loader2 size={10} className="animate-spin" /> Processing
          </span>
        )}
      </div>

      {/* Body: chat left + document right */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* LEFT: Chat / Edit panel */}
        <div style={{ width: '400px', flexShrink: 0, borderRight: '1px solid var(--c-border)', display: 'flex', flexDirection: 'column', background: 'var(--c-bg)' }}>

          {/* Mode header */}
          <div style={{ padding: '12px 16px 0', flexShrink: 0 }}>
            <div style={{ display: 'flex', gap: '4px', background: 'var(--c-panel)', borderRadius: '8px', padding: '3px' }}>
              <button
                onClick={() => { setEditMode(false); setEditProposal(null); }}
                style={{ flex: 1, padding: '6px', fontSize: '12px', fontWeight: '500', background: !editMode ? 'var(--c-card)' : 'none', border: !editMode ? '1px solid var(--c-border)' : '1px solid transparent', borderRadius: '6px', color: !editMode ? 'var(--c-text)' : 'var(--c-text-3)', cursor: 'pointer', transition: 'all 0.15s' }}
              >
                Ask
              </button>
              <button
                onClick={() => setEditMode(true)}
                style={{ flex: 1, padding: '6px', fontSize: '12px', fontWeight: '500', background: editMode ? 'rgba(34,197,94,0.12)' : 'none', border: editMode ? '1px solid rgba(34,197,94,0.25)' : '1px solid transparent', borderRadius: '6px', color: editMode ? '#22c55e' : 'var(--c-text-3)', cursor: 'pointer', transition: 'all 0.15s' }}
              >
                Edit
              </button>
            </div>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
            {messages.length === 0 && !editProposal ? (
              <div>
                <p style={{ fontSize: '12px', color: 'var(--c-text-3)', marginBottom: '12px' }}>
                  {editMode
                    ? selectedText ? `Selected: "${selectedText.slice(0, 50)}…" — give an instruction` : 'Select text in the document or give a global instruction'
                    : 'Ask Stu anything about this document'}
                </p>
                {(editMode ? editStarters : starters).map(s => (
                  <button
                    key={s}
                    onClick={() => editMode ? sendEdit(s) : sendChat(s)}
                    style={{ display: 'block', width: '100%', background: 'var(--c-panel)', border: '1px solid var(--c-border)', borderRadius: '8px', padding: '10px 12px', fontSize: '12px', color: 'var(--c-text-2)', cursor: 'pointer', textAlign: 'left', marginBottom: '6px', fontFamily: 'inherit', transition: 'border-color 0.1s' }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {messages.map((m, i) => (
                  <div key={i}>
                    <div style={{ fontSize: '10px', color: 'var(--c-text-3)', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                      {m.role === 'user' ? 'You' : 'Stu'}
                    </div>
                    <div style={{ fontSize: '13px', color: m.role === 'user' ? 'var(--c-text)' : 'var(--c-text-2)', lineHeight: '1.65', whiteSpace: 'pre-wrap' }}>
                      {m.content || (loading && i === messages.length - 1
                        ? <span style={{ color: 'var(--c-text-3)' }}>Thinking…</span>
                        : null)}
                    </div>
                  </div>
                ))}
                {editProposal && (
                  <EditBubble
                    explanation={editProposal.explanation}
                    revised={editProposal.revised}
                    isStreaming={editProposal.isStreaming}
                    onAccept={acceptEdit}
                    onDismiss={() => setEditProposal(null)}
                  />
                )}
                <div ref={bottomRef} />
              </div>
            )}
          </div>

          {/* Input */}
          <div style={{ padding: '12px 16px', borderTop: '1px solid var(--c-border)', flexShrink: 0 }}>
            {selectedText && editMode && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: '7px', padding: '6px 10px', marginBottom: '8px', fontSize: '11px', color: '#22c55e' }}>
                <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  Selected: "{selectedText.slice(0, 40)}{selectedText.length > 40 ? '…' : ''}"
                </span>
                <button onClick={() => setSelectedText('')} style={{ background: 'none', border: 'none', color: '#22c55e', cursor: 'pointer', padding: 0 }}>
                  <X size={11} />
                </button>
              </div>
            )}
            <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
              <textarea
                ref={textareaRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    editMode ? sendEdit() : sendChat();
                  }
                }}
                rows={2}
                placeholder={editMode
                  ? selectedText ? 'Instruction for selected text…' : 'Describe the edit you want…'
                  : 'Ask anything about this document…'}
                style={{ flex: 1, background: 'var(--c-panel)', border: '1px solid var(--c-border)', borderRadius: '10px', padding: '10px 12px', color: 'var(--c-text)', fontSize: '13px', outline: 'none', resize: 'none', fontFamily: 'inherit', lineHeight: '1.5' }}
              />
              <button
                onClick={() => editMode ? sendEdit() : sendChat()}
                disabled={loading || !input.trim()}
                style={{ background: editMode ? '#22c55e' : 'var(--c-accent-bg)', color: editMode ? '#fff' : 'var(--c-accent-text)', border: 'none', borderRadius: '10px', padding: '11px 13px', cursor: loading || !input.trim() ? 'default' : 'pointer', opacity: loading || !input.trim() ? 0.4 : 1, flexShrink: 0, transition: 'opacity 0.15s' }}
              >
                {loading ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT: Document content */}
        <div style={{ flex: 1, overflowY: 'auto', background: 'var(--c-card)' }}>
          {docStatus === 'processing' ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: '14px' }}>
              <Loader2 size={22} color="#555" className="animate-spin" />
              <p style={{ color: 'var(--c-text-2)', fontSize: '13px' }}>Extracting text and analysing…</p>
            </div>
          ) : (
            <DocContent
              text={docText}
              annotations={liveAnnotations}
              editProposal={editProposal}
              selectedText={selectedText}
              onSelect={setSelectedText}
            />
          )}
        </div>
      </div>
    </div>
  );
}
