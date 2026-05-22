'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import { Paperclip, Sparkles, ArrowUp, RotateCcw, Search, ChevronDown, ChevronRight, FileText, X, Brain } from 'lucide-react';
import Link from 'next/link';
import { PERSONAS, getPersona, DEFAULT_PERSONA_ID, type Persona } from '@/lib/personas';

interface Msg { role: string; content: string; thinking?: string; thinkingOpen?: boolean; }
interface Matter { id: string; title: string; client_name: string; }
interface Doc { id: string; original_name: string; matter_title: string; }

/* ── Persona switcher ── */
function PersonaSwitcher({ current, onChange }: { current: Persona; onChange: (p: Persona) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          background: current.bgColor, border: `1px solid ${current.color}33`,
          borderRadius: '20px', padding: '5px 12px 5px 6px',
          cursor: 'pointer', transition: 'all 0.15s',
        }}
      >
        <span style={{
          width: 22, height: 22, borderRadius: '50%',
          background: current.color, color: '#fff',
          fontSize: '10px', fontWeight: '700',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>{current.initials}</span>
        <span style={{ fontSize: '12px', fontWeight: '600', color: current.color }}>{current.name}</span>
        <ChevronDown size={11} color={current.color} />
      </button>
      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 50 }} />
          <div style={{
            position: 'absolute', top: 'calc(100% + 8px)', left: 0,
            background: 'var(--c-card)', border: '1px solid var(--c-border)',
            borderRadius: '14px', padding: '8px', zIndex: 51,
            width: '280px', boxShadow: '0 12px 40px rgba(0,0,0,0.2)',
          }}>
            <p style={{ fontSize: '10px', fontWeight: '600', color: 'var(--c-text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', padding: '4px 8px 8px' }}>Choose your lawyer</p>
            {PERSONAS.map(p => (
              <button
                key={p.id}
                onClick={() => { onChange(p); setOpen(false); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: '12px', width: '100%',
                  textAlign: 'left', background: p.id === current.id ? p.bgColor : 'none',
                  border: p.id === current.id ? `1px solid ${p.color}33` : '1px solid transparent',
                  borderRadius: '10px', padding: '10px 10px', cursor: 'pointer',
                  transition: 'all 0.1s', marginBottom: '2px',
                }}
              >
                <span style={{
                  width: 34, height: 34, borderRadius: '50%', background: p.color,
                  color: '#fff', fontSize: '13px', fontWeight: '700', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>{p.initials}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--c-text)', marginBottom: '2px' }}>{p.name} <span style={{ fontSize: '11px', color: p.color, fontWeight: '500' }}>· {p.title}</span></div>
                  <div style={{ fontSize: '11px', color: 'var(--c-text-3)' }}>{p.style}</div>
                </div>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

const PROMPT_TEMPLATES = [
  { label: 'Review NDA for key risks', meta: 'Review · Playbook', prompt: 'Walk me through the key legal risks I should look for when reviewing a non-disclosure agreement, including issues with confidential information definitions, obligations, term, permitted disclosures, and remedies.' },
  { label: 'Draft a client update', meta: 'Draft · Email', prompt: 'Help me draft a professional and warm client update email for a transactional matter, covering recent progress, next steps, and any items we need from the client.' },
  { label: 'TUPE transfer obligations', meta: 'Research · UK Law', prompt: 'Explain the key legal obligations that arise under TUPE (Transfer of Undertakings) regulations when a business transfers in the UK, covering employee rights, consultation requirements, and liability.' },
  { label: 'Extract key commercial terms', meta: 'Analysis · Contract', prompt: 'What are the most important commercial and legal terms to negotiate in a professional services or software development agreement? Cover IP ownership, liability caps, termination, and payment.' },
  { label: 'Explain repudiatory breach', meta: 'Research · UK Law', prompt: 'Explain what constitutes repudiatory breach under English contract law — the legal test, key cases, the innocent party\'s options, and what can go wrong if they delay accepting the breach.' },
  { label: 'Shareholder deadlock risks', meta: 'Analysis · Corporate', prompt: 'What are the main risks and resolution mechanisms for shareholder deadlock in a private company? Cover common deadlock provisions, Russian roulette clauses, buy-out options, and practical considerations.' },
  { label: 'Employment termination risks', meta: 'Risk · Employment', prompt: 'What are the key legal risks when terminating a senior employee in England & Wales? Cover wrongful dismissal, unfair dismissal, discrimination, garden leave, post-termination restrictions, and settlement agreements.' },
  { label: 'Force majeure analysis', meta: 'Analysis · Contract', prompt: 'Analyse the key elements of an effective force majeure clause: what events should be covered, notice requirements, consequences, relationship with MAC clauses, and lessons from COVID-19 disputes.' },
];

const PILLS = [
  { label: 'UK Law', color: '#2563eb' },
  { label: 'Contract DB', color: '#16a34a' },
];

function ThinkingBlock({ thinking, open, onToggle }: { thinking: string; open: boolean; onToggle: () => void }) {
  return (
    <div style={{ marginBottom: '14px' }}>
      <button
        onClick={onToggle}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: '6px',
          background: 'none', border: '1px solid var(--c-border)',
          borderRadius: '20px', padding: '4px 10px',
          fontSize: '11px', color: 'var(--c-text-3)', cursor: 'pointer',
          fontFamily: 'inherit',
        }}
      >
        <Brain size={11} color="#8b5cf6" />
        <span style={{ color: '#8b5cf6', fontWeight: '500' }}>See the thought process</span>
        {open ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
      </button>
      {open && (
        <div style={{
          marginTop: '10px', padding: '14px 16px',
          background: 'rgba(139,92,246,0.04)',
          border: '1px solid rgba(139,92,246,0.15)',
          borderLeft: '3px solid rgba(139,92,246,0.4)',
          borderRadius: '0 8px 8px 0',
          fontSize: '12.5px', color: 'var(--c-text-3)',
          lineHeight: '1.75', whiteSpace: 'pre-wrap',
          fontStyle: 'italic', maxHeight: '400px', overflowY: 'auto',
        }}>
          {thinking}
        </div>
      )}
    </div>
  );
}

function formatAI(text: string) {
  return (
    <div style={{ fontSize: '14px', lineHeight: '1.8', color: 'var(--c-text)' }}>
      {text.split('\n').map((line, i) => {
        if (!line.trim()) return <br key={i} />;
        if (line.startsWith('### ')) return <h3 key={i} style={{ fontSize: '13px', fontWeight: '700', color: 'var(--c-text)', margin: '16px 0 6px', textTransform: 'uppercase', letterSpacing: '0.05em', opacity: 0.7 }}>{line.slice(4)}</h3>;
        if (line.startsWith('## ')) return <h2 key={i} style={{ fontSize: '15px', fontWeight: '600', color: 'var(--c-text)', margin: '20px 0 8px' }}>{line.slice(3)}</h2>;
        if (line.startsWith('# ')) return <h1 key={i} style={{ fontSize: '17px', fontWeight: '600', color: 'var(--c-text)', margin: '20px 0 8px' }}>{line.slice(2)}</h1>;
        if (line.startsWith('**') && line.endsWith('**')) return <p key={i} style={{ fontWeight: '600', margin: '8px 0' }}>{line.slice(2, -2)}</p>;
        if (line.startsWith('- ') || line.startsWith('• ')) {
          const content = line.slice(2);
          // handle inline bold
          const parts = content.split(/\*\*(.+?)\*\*/g);
          return (
            <p key={i} style={{ paddingLeft: '14px', margin: '4px 0', color: 'var(--c-text)' }}>
              · {parts.map((p, j) => j % 2 === 1 ? <strong key={j}>{p}</strong> : p)}
            </p>
          );
        }
        // handle inline bold in regular paragraphs
        const parts = line.split(/\*\*(.+?)\*\*/g);
        return (
          <p key={i} style={{ margin: '6px 0', color: 'var(--c-text)' }}>
            {parts.map((p, j) => j % 2 === 1 ? <strong key={j}>{p}</strong> : p)}
          </p>
        );
      })}
    </div>
  );
}

/* ── Files & Sources modal ── */
function FilesModal({ onClose, onAttach }: { onClose: () => void; onAttach: (docs: Doc[]) => void }) {
  const [docs, setDocs] = useState<Doc[]>([]);
  const [selected, setSelected] = useState<string[]>([]);

  useEffect(() => {
    fetch('/api/documents').then(r => r.json()).then(setDocs).catch(() => {});
  }, []);

  const toggle = (id: string) => setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100 }} />
      <div style={{
        position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
        zIndex: 101, background: 'var(--c-card)', border: '1px solid var(--c-border)',
        borderRadius: '14px', padding: '24px', width: '480px', maxWidth: '95vw',
        maxHeight: '70vh', display: 'flex', flexDirection: 'column',
        boxShadow: '0 24px 64px rgba(0,0,0,0.4)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '14px', fontWeight: '600', color: 'var(--c-text)' }}>Files & Sources</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--c-text-3)', display: 'flex' }}><X size={16} /></button>
        </div>
        <p style={{ fontSize: '12px', color: 'var(--c-text-3)', marginBottom: '14px' }}>
          Select documents to include as context in your message. Their extracted text will be sent to Stu.
        </p>
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {docs.length === 0 && (
            <p style={{ fontSize: '13px', color: 'var(--c-text-3)', textAlign: 'center', padding: '24px' }}>
              No documents available. Upload documents to a matter first.
            </p>
          )}
          {docs.map(d => (
            <label key={d.id} style={{
              display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px',
              background: selected.includes(d.id) ? 'rgba(59,130,246,0.08)' : 'var(--c-panel)',
              border: `1px solid ${selected.includes(d.id) ? 'rgba(59,130,246,0.3)' : 'var(--c-border)'}`,
              borderRadius: '8px', cursor: 'pointer',
            }}>
              <input type="checkbox" checked={selected.includes(d.id)} onChange={() => toggle(d.id)} style={{ accentColor: '#3b82f6', flexShrink: 0 }} />
              <FileText size={13} color="var(--c-text-3)" style={{ flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '13px', color: 'var(--c-text)', fontWeight: '500', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.original_name}</div>
                <div style={{ fontSize: '11px', color: 'var(--c-text-3)' }}>{d.matter_title}</div>
              </div>
            </label>
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px', paddingTop: '14px', borderTop: '1px solid var(--c-border)' }}>
          <button onClick={onClose} style={{ padding: '8px 14px', background: 'none', border: '1px solid var(--c-border)', borderRadius: '7px', fontSize: '13px', color: 'var(--c-text-2)', cursor: 'pointer' }}>Cancel</button>
          <button
            onClick={() => { onAttach(docs.filter(d => selected.includes(d.id))); onClose(); }}
            disabled={selected.length === 0}
            style={{ padding: '8px 16px', background: 'var(--c-accent-bg)', color: 'var(--c-accent-text)', border: 'none', borderRadius: '7px', fontSize: '13px', fontWeight: '600', cursor: selected.length ? 'pointer' : 'not-allowed', opacity: selected.length ? 1 : 0.5 }}
          >
            Attach {selected.length > 0 ? `${selected.length} file${selected.length > 1 ? 's' : ''}` : 'files'}
          </button>
        </div>
      </div>
    </>
  );
}

/* ── Prompts dropdown ── */
function PromptsDropdown({ onSelect, onClose }: { onSelect: (p: string) => void; onClose: () => void }) {
  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 50 }} />
      <div className="prompts-dropdown" style={{
        position: 'absolute', bottom: '100%', left: 0, marginBottom: '8px',
        background: 'var(--c-card)', border: '1px solid var(--c-border)',
        borderRadius: '12px', padding: '6px', zIndex: 51,
        width: '340px', maxHeight: '380px', overflowY: 'auto',
        boxShadow: '0 12px 40px rgba(0,0,0,0.3)',
      }}>
        <p style={{ fontSize: '10px', fontWeight: '600', color: 'var(--c-text-3)', textTransform: 'uppercase', letterSpacing: '0.5px', padding: '6px 10px 4px' }}>Prompt templates</p>
        {PROMPT_TEMPLATES.map(p => (
          <button
            key={p.label}
            onClick={() => { onSelect(p.prompt); onClose(); }}
            style={{
              display: 'flex', flexDirection: 'column', width: '100%', textAlign: 'left',
              background: 'none', border: 'none', borderRadius: '8px',
              padding: '9px 10px', cursor: 'pointer', transition: 'background 0.1s',
            }}
            onMouseOver={e => (e.currentTarget.style.background = 'var(--c-panel)')}
            onMouseOut={e => (e.currentTarget.style.background = 'none')}
          >
            <span style={{ fontSize: '12.5px', fontWeight: '500', color: 'var(--c-text)', marginBottom: '2px' }}>{p.label}</span>
            <span style={{ fontSize: '11px', color: 'var(--c-text-4)' }}>{p.meta}</span>
          </button>
        ))}
      </div>
    </>
  );
}

export default function AssistantPage() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [matters, setMatters] = useState<Matter[]>([]);
  const [selectedMatter, setSelectedMatter] = useState('');
  const [attachedDocs, setAttachedDocs] = useState<Doc[]>([]);
  const [showFiles, setShowFiles] = useState(false);
  const [showPrompts, setShowPrompts] = useState(false);
  const [persona, setPersona] = useState<Persona>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('stu_persona');
      if (saved) return getPersona(saved);
    }
    return getPersona(DEFAULT_PERSONA_ID);
  });
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const handlePersonaChange = (p: Persona) => {
    setPersona(p);
    if (typeof window !== 'undefined') localStorage.setItem('stu_persona', p.id);
  };

  useEffect(() => {
    fetch('/api/matters').then(r => r.json()).then(d => setMatters(d || [])).catch(() => {});
  }, []);

  useEffect(() => {
    if (messages.length > 0) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const toggleThinking = (idx: number) => {
    setMessages(prev => prev.map((m, i) => i === idx ? { ...m, thinkingOpen: !m.thinkingOpen } : m));
  };

  const send = useCallback(async (override?: string) => {
    const content = override || input.trim();
    if (!content || streaming) return;
    setInput('');
    setShowPrompts(false);

    // Build context string
    const matterCtx = selectedMatter ? matters.find(m => m.id === selectedMatter) : null;
    let ctx = '';
    if (matterCtx) ctx += `[Matter: ${matterCtx.title} — ${matterCtx.client_name}]\n\n`;
    if (attachedDocs.length > 0) {
      ctx += `[Attached documents for context: ${attachedDocs.map(d => d.original_name).join(', ')}]\n`;
    }
    const apiContent = ctx ? `${ctx}${content}` : content;

    const apiMessages = [
      ...messages
        .filter(m => m.content)
        .map(m => ({ role: m.role, content: m.content })),
      { role: 'user', content: apiContent },
    ];

    setMessages(prev => [...prev, { role: 'user', content }, { role: 'assistant', content: '', thinking: '', thinkingOpen: false }]);
    setStreaming(true);

    try {
      const res = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: apiMessages, personaId: persona.id }),
      });

      if (!res.body) throw new Error('No response stream');
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let aiText = '';
      let aiThinking = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        for (const line of dec.decode(value).split('\n')) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6).trim();
          if (data === '[DONE]') break;
          try {
            const parsed = JSON.parse(data);
            if (parsed.type === 'text') {
              aiText += parsed.text;
              setMessages(prev => {
                const updated = [...prev];
                updated[updated.length - 1] = { ...updated[updated.length - 1], content: aiText };
                return updated;
              });
            } else if (parsed.type === 'thinking') {
              aiThinking += parsed.text;
              setMessages(prev => {
                const updated = [...prev];
                updated[updated.length - 1] = { ...updated[updated.length - 1], thinking: aiThinking };
                return updated;
              });
            } else if (parsed.type === 'error') {
              aiText = parsed.text;
              setMessages(prev => {
                const updated = [...prev];
                updated[updated.length - 1] = { ...updated[updated.length - 1], content: aiText };
                return updated;
              });
            }
          } catch {}
        }
      }
    } catch (e: any) {
      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = { ...updated[updated.length - 1], content: `Error: ${e?.message || 'Something went wrong. Please try again.'}` };
        return updated;
      });
    }
    setStreaming(false);
    setAttachedDocs([]);
  }, [input, streaming, messages, selectedMatter, matters, attachedDocs]);

  // ─── Conversation view ─────────────────────────────────────────────────
  if (messages.length > 0) {
    return (
      <div className="chat-page" style={{ display: 'flex', flexDirection: 'column', height: '100dvh', background: 'var(--c-bg)' }}>
        {showFiles && <FilesModal onClose={() => setShowFiles(false)} onAttach={docs => setAttachedDocs(docs)} />}

        {/* Header */}
        <div style={{ flexShrink: 0, borderBottom: '1px solid var(--c-border)', padding: '0 16px', height: '52px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <PersonaSwitcher current={persona} onChange={handlePersonaChange} />
          <div style={{ flex: 1 }} />
          <span style={{ fontSize: '12px', color: 'var(--c-text-3)' }}>
            {selectedMatter ? matters.find(m => m.id === selectedMatter)?.title : ''}
          </span>
          <button onClick={() => { setMessages([]); setInput(''); setAttachedDocs([]); }} style={{ display: 'flex', alignItems: 'center', gap: '5px', background: 'none', border: '1px solid var(--c-border)', borderRadius: '6px', padding: '5px 10px', fontSize: '12px', color: 'var(--c-text-2)', cursor: 'pointer' }}>
            <RotateCcw size={11} /> New
          </button>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflow: 'auto', padding: '40px 0' }}>
          <div className="chat-messages-inner" style={{ maxWidth: '720px', margin: '0 auto', padding: '0 32px' }}>
            {messages.map((msg, i) => (
              <div key={i} style={{ marginBottom: '36px' }}>
                <div style={{ fontSize: '11px', fontWeight: '600', color: 'var(--c-text-3)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                  {msg.role === 'user' ? 'You' : 'Stu'}
                </div>
                {msg.role === 'user' ? (
                  <div style={{ fontSize: '14px', color: 'var(--c-text)', lineHeight: '1.7' }}>{msg.content}</div>
                ) : (
                  <div>
                    {/* Thinking block */}
                    {msg.thinking && (
                      <ThinkingBlock
                        thinking={msg.thinking}
                        open={!!msg.thinkingOpen}
                        onToggle={() => toggleThinking(i)}
                      />
                    )}
                    {/* Response */}
                    {msg.content ? (
                      formatAI(msg.content)
                    ) : streaming && i === messages.length - 1 ? (
                      <div style={{ display: 'flex', gap: '4px', alignItems: 'center', paddingTop: '4px' }}>
                        {[0, 0.15, 0.3].map((d, j) => (
                          <div key={j} style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--c-text-3)', animation: `pulse 1s ease-in-out ${d}s infinite` }} />
                        ))}
                        <style>{`@keyframes pulse { 0%,100%{opacity:0.3} 50%{opacity:1} }`}</style>
                      </div>
                    ) : null}
                  </div>
                )}
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
        </div>

        {/* Pinned input */}
        <div className="chat-input-bar" style={{ flexShrink: 0, background: 'var(--c-bg)', borderTop: '1px solid var(--c-border)', padding: '12px 24px 16px' }}>
          <div style={{ maxWidth: '720px', margin: '0 auto' }}>
            {attachedDocs.length > 0 && (
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '8px' }}>
                {attachedDocs.map(d => (
                  <span key={d.id} style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: '20px', padding: '3px 8px', fontSize: '11px', color: '#3b82f6' }}>
                    <FileText size={10} /> {d.original_name}
                    <button onClick={() => setAttachedDocs(p => p.filter(x => x.id !== d.id))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#3b82f6', padding: 0, display: 'flex' }}><X size={10} /></button>
                  </span>
                ))}
              </div>
            )}
            <div style={{ background: 'var(--c-card)', border: '1px solid var(--c-border)', borderRadius: '14px', boxShadow: 'var(--c-shadow-md)', overflow: 'hidden' }}>
              <textarea
                ref={textareaRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
                placeholder="Ask a follow-up…"
                rows={2}
                style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', padding: '14px 16px 6px', fontSize: '13.5px', color: 'var(--c-text)', resize: 'none', fontFamily: 'inherit', lineHeight: '1.6' }}
              />
              <div style={{ display: 'flex', alignItems: 'center', padding: '6px 10px 10px', gap: '6px', position: 'relative' }}>
                <button onClick={() => setShowFiles(true)} style={{ display: 'flex', alignItems: 'center', gap: '5px', background: 'none', border: 'none', borderRadius: '6px', padding: '5px 8px', fontSize: '12px', color: attachedDocs.length ? '#3b82f6' : 'var(--c-text-3)', cursor: 'pointer' }}>
                  <Paperclip size={12} /> {attachedDocs.length ? `${attachedDocs.length} file${attachedDocs.length > 1 ? 's' : ''}` : 'Files'}
                </button>
                <div style={{ flex: 1 }} />
                <button
                  onClick={() => send()}
                  disabled={!input.trim() || streaming}
                  style={{ background: input.trim() && !streaming ? 'var(--c-accent-bg)' : 'var(--c-panel)', color: input.trim() && !streaming ? 'var(--c-accent-text)' : 'var(--c-text-4)', border: 'none', borderRadius: '8px', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: input.trim() && !streaming ? 'pointer' : 'default', transition: 'all 0.15s', flexShrink: 0 }}
                >
                  <ArrowUp size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── Landing / empty state ──────────────────────────────────────────────
  return (
    <div className="assistant-landing" style={{ minHeight: '100dvh', background: 'var(--c-bg)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 24px 80px', position: 'relative' }}>
      {showFiles && <FilesModal onClose={() => setShowFiles(false)} onAttach={docs => setAttachedDocs(docs)} />}

      {/* Top-right utilities */}
      <div className="landing-top-right" style={{ position: 'fixed', top: '12px', right: '20px', display: 'flex', gap: '6px', zIndex: 10 }}>
        <Link href="/research" style={{ fontSize: '12px', color: 'var(--c-text-2)', textDecoration: 'none', padding: '5px 12px', borderRadius: '6px', background: 'var(--c-panel)', border: '1px solid var(--c-border)' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><Search size={11} /> Research</span>
        </Link>
      </div>

      {/* Persona avatar + wordmark */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '20px', gap: '12px' }}>
        <div style={{
          width: 64, height: 64, borderRadius: '50%',
          background: persona.color, color: '#fff',
          fontSize: '22px', fontWeight: '700',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: `0 8px 24px ${persona.color}44`,
          transition: 'all 0.3s',
        }}>{persona.initials}</div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '20px', fontWeight: '700', color: 'var(--c-text)', letterSpacing: '-0.5px' }}>{persona.name}</div>
          <div style={{ fontSize: '12px', color: 'var(--c-text-3)', marginTop: '2px' }}>{persona.title}</div>
        </div>
        <PersonaSwitcher current={persona} onChange={handlePersonaChange} />
      </div>

      {/* Context selector */}
      {matters.length > 0 && (
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap', justifyContent: 'center' }}>
          <select
            value={selectedMatter}
            onChange={e => setSelectedMatter(e.target.value)}
            style={{
              backgroundColor: selectedMatter ? 'var(--c-panel)' : 'transparent',
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%23aaa' stroke-width='2.5'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'calc(100% - 10px) center',
              border: '1px solid var(--c-border)', borderRadius: '20px',
              padding: '6px 32px 6px 14px', fontSize: '12.5px',
              color: selectedMatter ? 'var(--c-text)' : 'var(--c-text-2)',
              outline: 'none', cursor: 'pointer', appearance: 'none',
              fontFamily: 'inherit',
            }}
          >
            <option value="">Set client matter</option>
            {matters.map(m => <option key={m.id} value={m.id}>{m.title}</option>)}
          </select>
        </div>
      )}

      {/* Attached docs chips */}
      {attachedDocs.length > 0 && (
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '10px' }}>
          {attachedDocs.map(d => (
            <span key={d.id} style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: '20px', padding: '3px 8px', fontSize: '11px', color: '#3b82f6' }}>
              <FileText size={10} /> {d.original_name}
              <button onClick={() => setAttachedDocs(p => p.filter(x => x.id !== d.id))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#3b82f6', padding: 0, display: 'flex' }}><X size={10} /></button>
            </span>
          ))}
        </div>
      )}

      {/* Main input */}
      <div style={{ width: '100%', maxWidth: '720px', background: 'var(--c-card)', border: '1px solid var(--c-border)', borderRadius: '18px', boxShadow: 'var(--c-shadow-md)', overflow: 'hidden', marginBottom: '14px' }}>
        <textarea
          ref={textareaRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
          placeholder={`Ask ${persona.name} anything…`}
          rows={4}
          style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', padding: '18px 20px 8px', fontSize: '14.5px', color: 'var(--c-text)', resize: 'none', fontFamily: 'inherit', lineHeight: '1.6' }}
          autoFocus
        />
        <div style={{ display: 'flex', alignItems: 'center', padding: '8px 12px 14px', gap: '6px', borderTop: '1px solid var(--c-border)', position: 'relative' }}>
          <button
            onClick={() => setShowFiles(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '5px', background: 'none', border: 'none', borderRadius: '6px', padding: '5px 8px', fontSize: '12px', color: attachedDocs.length ? '#3b82f6' : 'var(--c-text-3)', cursor: 'pointer' }}
          >
            <Paperclip size={12} /> {attachedDocs.length ? `${attachedDocs.length} file${attachedDocs.length > 1 ? 's' : ''} attached` : 'Files and sources'}
          </button>
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowPrompts(p => !p)}
              style={{ display: 'flex', alignItems: 'center', gap: '5px', background: showPrompts ? 'var(--c-panel)' : 'none', border: 'none', borderRadius: '6px', padding: '5px 8px', fontSize: '12px', color: 'var(--c-text-3)', cursor: 'pointer' }}
            >
              <Sparkles size={12} /> Prompts
            </button>
            {showPrompts && (
              <PromptsDropdown
                onSelect={p => setInput(p)}
                onClose={() => setShowPrompts(false)}
              />
            )}
          </div>
          <div style={{ flex: 1 }} />
          <button
            onClick={() => send()}
            disabled={!input.trim()}
            style={{
              background: input.trim() ? 'var(--c-accent-bg)' : 'var(--c-panel)',
              color: input.trim() ? 'var(--c-accent-text)' : 'var(--c-text-4)',
              border: 'none', borderRadius: '9px', padding: '7px 18px',
              fontSize: '13px', fontWeight: '600',
              cursor: input.trim() ? 'pointer' : 'default',
              display: 'flex', alignItems: 'center', gap: '6px',
              transition: 'all 0.15s',
            }}
          >
            Ask {persona.name}
          </button>
        </div>
      </div>

      {/* Source pills */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', marginBottom: '40px', width: '100%', maxWidth: '720px' }}>
        <div style={{ display: 'flex', gap: '7px', flexWrap: 'wrap', justifyContent: 'center' }}>
          {[
            ...PILLS,
            ...(selectedMatter && matters.find(m => m.id === selectedMatter)
              ? [{ label: matters.find(m => m.id === selectedMatter)!.title, color: '#ea580c' }]
              : []),
          ].map(p => (
            <span key={p.label} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'var(--c-panel)', border: '1px solid var(--c-border)', borderRadius: '20px', padding: '4px 10px 4px 8px', fontSize: '12px', color: 'var(--c-text-2)' }}>
              <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: p.color, flexShrink: 0 }} />
              {p.label}
            </span>
          ))}

          <Link href="/connectors" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'transparent', border: '1px dashed var(--c-border)', borderRadius: '20px', padding: '4px 10px 4px 8px', fontSize: '12px', color: 'var(--c-text-4)', textDecoration: 'none' }}>
            + Connect email
          </Link>
        </div>
      </div>

      {/* Recommended workflows */}
      <div style={{ width: '100%', maxWidth: '720px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <span style={{ fontSize: '12px', color: 'var(--c-text-3)' }}>Recommended workflows</span>
          <Link href="/playbooks" style={{ fontSize: '12px', color: 'var(--c-text-4)', textDecoration: 'none' }}>View all</Link>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '9px' }}>
          {PROMPT_TEMPLATES.slice(0, 4).map(w => (
            <button
              key={w.label}
              onClick={() => send(w.prompt)}
              style={{ textAlign: 'left', background: 'var(--c-panel)', border: '1px solid var(--c-border)', borderRadius: '10px', padding: '14px 14px 12px', cursor: 'pointer', transition: 'border-color 0.12s' }}
              onMouseOver={e => (e.currentTarget.style.borderColor = 'var(--c-border-s)')}
              onMouseOut={e => (e.currentTarget.style.borderColor = 'var(--c-border)')}
            >
              <div style={{ fontSize: '12.5px', color: 'var(--c-text)', fontWeight: '500', marginBottom: '10px', lineHeight: '1.45' }}>{w.label}</div>
              <div style={{ fontSize: '11px', color: 'var(--c-text-4)' }}>{w.meta}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
