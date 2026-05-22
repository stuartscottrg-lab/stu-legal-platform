'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import { Paperclip, Sparkles, ArrowUp, RotateCcw, Search, Check, Plus } from 'lucide-react';
import Link from 'next/link';
import { useConnectors } from '@/lib/hooks/useConnectors';

interface Msg { role: string; content: string; }
interface Matter { id: string; title: string; client_name: string; }

const WORKFLOWS = [
  { label: 'Review NDA for key risks', meta: 'Review · Playbook', prompt: 'Walk me through the key legal risks I should look for when reviewing a non-disclosure agreement, including issues with confidential information definitions, obligations, term, permitted disclosures, and remedies.' },
  { label: 'Draft a client update', meta: 'Draft · Email', prompt: 'Help me draft a professional and warm client update email for a transactional matter, covering recent progress, next steps, and any items we need from the client.' },
  { label: 'TUPE transfer obligations', meta: 'Research · UK Law', prompt: 'Explain the key legal obligations that arise under TUPE (Transfer of Undertakings) regulations when a business transfers in the UK, covering employee rights, consultation requirements, and liability.' },
  { label: 'Extract key commercial terms', meta: 'Analysis · Contract', prompt: 'What are the most important commercial and legal terms to negotiate in a professional services or software development agreement? Cover IP ownership, liability caps, termination, and payment.' },
];

const PILLS = [
  { label: 'UK Law', color: '#2563eb' },
  { label: 'Contract DB', color: '#16a34a' },
  { label: 'Web search', color: '#7c3aed' },
];

function formatAI(text: string) {
  return (
    <div className="prose-content" style={{ fontSize: '14px', lineHeight: '1.8', color: 'var(--c-text)' }}>
      {text.split('\n').map((line, i) => {
        if (!line.trim()) return <br key={i} />;
        if (line.startsWith('## ')) return <h2 key={i} style={{ fontSize: '15px', fontWeight: '600', color: 'var(--c-text)', margin: '20px 0 8px' }}>{line.slice(3)}</h2>;
        if (line.startsWith('# ')) return <h1 key={i} style={{ fontSize: '17px', fontWeight: '600', color: 'var(--c-text)', margin: '20px 0 8px' }}>{line.slice(2)}</h1>;
        if (line.startsWith('**') && line.endsWith('**')) return <p key={i} style={{ fontWeight: '600', margin: '8px 0' }}>{line.slice(2, -2)}</p>;
        if (line.startsWith('- ') || line.startsWith('• ')) return <p key={i} style={{ paddingLeft: '14px', margin: '4px 0', color: 'var(--c-text)' }}>· {line.slice(2)}</p>;
        return <p key={i} style={{ margin: '6px 0', color: 'var(--c-text)' }}>{line}</p>;
      })}
    </div>
  );
}

export default function AssistantPage() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [matters, setMatters] = useState<Matter[]>([]);
  const [selectedMatter, setSelectedMatter] = useState('');
  const { connectors, connect, disconnect, ready } = useConnectors();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const messagesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/matters').then(r => r.json()).then(d => setMatters(d || [])).catch(() => {});
  }, []);

  useEffect(() => {
    if (messages.length > 0) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = useCallback(async (override?: string) => {
    const content = override || input.trim();
    if (!content || streaming) return;
    setInput('');

    const matterCtx = selectedMatter ? matters.find(m => m.id === selectedMatter) : null;
    const apiContent = matterCtx ? `[Matter: ${matterCtx.title} — ${matterCtx.client_name}]\n\n${content}` : content;

    const prev = messages.filter(m => m.role !== 'assistant' || m.content); // no empty
    const apiMessages = [...prev.map((m, i) =>
      i === prev.length - 1 && m.role === 'user'
        ? { role: 'user', content: apiContent }
        : m
    )];
    if (!apiMessages.find(m => m.content === apiContent)) {
      apiMessages.push({ role: 'user', content: apiContent });
    }

    const displayMessages: Msg[] = [...messages, { role: 'user', content }, { role: 'assistant', content: '' }];
    setMessages(displayMessages);
    setStreaming(true);

    try {
      const res = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: apiMessages }),
      });

      if (!res.body) throw new Error('No response stream');
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let aiText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const lines = dec.decode(value).split('\n');
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6).trim();
          if (data === '[DONE]') break;
          try {
            const parsed = JSON.parse(data);
            if (parsed.text) {
              aiText += parsed.text;
              setMessages(prev => {
                const updated = [...prev];
                updated[updated.length - 1] = { role: 'assistant', content: aiText };
                return updated;
              });
            }
          } catch {}
        }
      }
    } catch (e: any) {
      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = { role: 'assistant', content: 'Something went wrong. Please try again.' };
        return updated;
      });
    }
    setStreaming(false);
  }, [input, streaming, messages, selectedMatter, matters]);

  // ─── Conversation view ───────────────────────────────────────────
  if (messages.length > 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--c-bg)' }}>
        {/* Header bar */}
        <div style={{ flexShrink: 0, borderBottom: '1px solid var(--c-border)', padding: '0 24px', height: '48px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '13px', fontWeight: '500', color: 'var(--c-text-2)' }}>
            {selectedMatter ? matters.find(m => m.id === selectedMatter)?.title || 'Conversation' : 'Conversation'}
          </span>
          <div style={{ flex: 1 }} />
          <button onClick={() => { setMessages([]); setInput(''); }} style={{ display: 'flex', alignItems: 'center', gap: '5px', background: 'none', border: '1px solid var(--c-border)', borderRadius: '6px', padding: '5px 10px', fontSize: '12px', color: 'var(--c-text-2)', cursor: 'pointer' }}>
            <RotateCcw size={11} /> New
          </button>
        </div>

        {/* Messages */}
        <div ref={messagesRef} style={{ flex: 1, overflow: 'auto', padding: '40px 0' }}>
          <div style={{ maxWidth: '720px', margin: '0 auto', padding: '0 32px' }}>
            {messages.map((msg, i) => (
              <div key={i} className="fade-in" style={{ marginBottom: '36px' }}>
                <div style={{ fontSize: '11px', fontWeight: '600', color: 'var(--c-text-3)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                  {msg.role === 'user' ? 'You' : 'Stu'}
                </div>
                {msg.role === 'user' ? (
                  <div style={{ fontSize: '14px', color: 'var(--c-text)', lineHeight: '1.7' }}>{msg.content}</div>
                ) : msg.content ? (
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
            ))}
            <div ref={bottomRef} />
          </div>
        </div>

        {/* Pinned input */}
        <div style={{ flexShrink: 0, background: 'var(--c-bg)', borderTop: '1px solid var(--c-border)', padding: '12px 24px 16px' }}>
          <div style={{ maxWidth: '720px', margin: '0 auto' }}>
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
              <div style={{ display: 'flex', alignItems: 'center', padding: '6px 10px 10px', gap: '6px' }}>
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

  // ─── Landing / empty state (Harvey clone) ─────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: 'var(--c-bg)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 24px 80px', position: 'relative' }}>
      {/* Top-right utilities */}
      <div style={{ position: 'fixed', top: '12px', right: '20px', display: 'flex', gap: '6px', zIndex: 10 }}>
        <Link href="/research" style={{ fontSize: '12px', color: 'var(--c-text-2)', textDecoration: 'none', padding: '5px 12px', borderRadius: '6px', background: 'var(--c-panel)', border: '1px solid var(--c-border)' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><Search size={11} /> Research</span>
        </Link>
        <Link href="/settings" style={{ fontSize: '12px', color: 'var(--c-text-2)', textDecoration: 'none', padding: '5px 12px', borderRadius: '6px', background: 'var(--c-panel)', border: '1px solid var(--c-border)' }}>
          Tips
        </Link>
      </div>

      {/* Wordmark */}
      <div style={{ fontSize: '44px', fontWeight: '600', color: 'var(--c-text)', letterSpacing: '-1.5px', marginBottom: '22px', fontFamily: 'Georgia, "Times New Roman", serif', userSelect: 'none' }}>
        Stu
      </div>

      {/* Context selector */}
      {matters.length > 0 && (
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap', justifyContent: 'center' }}>
          <select
            value={selectedMatter}
            onChange={e => setSelectedMatter(e.target.value)}
            style={{
              background: selectedMatter ? 'var(--c-panel)' : 'var(--c-bg)',
              border: '1px solid var(--c-border)', borderRadius: '20px',
              padding: '6px 32px 6px 14px', fontSize: '12.5px',
              color: selectedMatter ? 'var(--c-text)' : 'var(--c-text-2)',
              outline: 'none', cursor: 'pointer', appearance: 'none',
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%23aaa' stroke-width='2.5'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
              backgroundRepeat: 'no-repeat', backgroundPosition: 'calc(100% - 10px) center',
              fontFamily: 'inherit',
            }}
          >
            <option value="">Set client matter</option>
            {matters.map(m => <option key={m.id} value={m.id}>{m.title}</option>)}
          </select>
        </div>
      )}

      {/* Main input */}
      <div style={{ width: '100%', maxWidth: '720px', background: 'var(--c-card)', border: '1px solid var(--c-border)', borderRadius: '18px', boxShadow: 'var(--c-shadow-md)', overflow: 'hidden', marginBottom: '14px' }}>
        <textarea
          ref={textareaRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
          placeholder="Ask Stu anything…"
          rows={4}
          style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', padding: '18px 20px 8px', fontSize: '14.5px', color: 'var(--c-text)', resize: 'none', fontFamily: 'inherit', lineHeight: '1.6' }}
          autoFocus
        />
        <div style={{ display: 'flex', alignItems: 'center', padding: '8px 12px 14px', gap: '6px', borderTop: '1px solid var(--c-border)' }}>
          <button style={{ display: 'flex', alignItems: 'center', gap: '5px', background: 'none', border: 'none', borderRadius: '6px', padding: '5px 8px', fontSize: '12px', color: 'var(--c-text-3)', cursor: 'pointer' }}>
            <Paperclip size={12} /> Files and sources
          </button>
          <button style={{ display: 'flex', alignItems: 'center', gap: '5px', background: 'none', border: 'none', borderRadius: '6px', padding: '5px 8px', fontSize: '12px', color: 'var(--c-text-3)', cursor: 'pointer' }}>
            <Sparkles size={12} /> Prompts
          </button>
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
            Ask Stu
          </button>
        </div>
      </div>

      {/* Source pills */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', marginBottom: '48px', width: '100%', maxWidth: '720px' }}>
        {/* Always-on sources */}
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
              <span style={{ color: 'var(--c-text-4)', marginLeft: '2px', cursor: 'pointer', fontSize: '14px', lineHeight: 1 }}>+</span>
            </span>
          ))}
        </div>

        {/* Connector pills — Gmail & Outlook */}
        {ready && (
          <div style={{ display: 'flex', gap: '7px', flexWrap: 'wrap', justifyContent: 'center' }}>
            {[
              { id: 'gmail' as const,   label: 'Gmail',   color: '#EA4335' },
              { id: 'outlook' as const, label: 'Outlook', color: '#0078D4' },
            ].map(c => {
              const state = connectors.find(x => x.id === c.id);
              const connected = state?.connected ?? false;
              return connected ? (
                <button key={c.id} onClick={() => disconnect(c.id)}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: `${c.color}0d`, border: `1px solid ${c.color}33`, borderRadius: '20px', padding: '4px 10px 4px 8px', fontSize: '12px', color: 'var(--c-text-2)', cursor: 'pointer' }}>
                  <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: c.color, flexShrink: 0 }} />
                  {c.label}
                  <Check size={10} style={{ color: c.color, marginLeft: '2px' }} />
                </button>
              ) : (
                <Link key={c.id} href="/connectors"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'transparent', border: '1px dashed var(--c-border)', borderRadius: '20px', padding: '4px 10px 4px 8px', fontSize: '12px', color: 'var(--c-text-4)' }}>
                  <span style={{ width: '7px', height: '7px', borderRadius: '50%', border: `1.5px solid ${c.color}55`, flexShrink: 0 }} />
                  {c.label}
                  <Plus size={10} style={{ marginLeft: '2px', color: 'var(--c-text-4)' }} />
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Recommended workflows */}
      <div style={{ width: '100%', maxWidth: '720px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <span style={{ fontSize: '12px', color: 'var(--c-text-3)' }}>Recommended workflows</span>
          <div style={{ display: 'flex', gap: '18px' }}>
            <Link href="/research" style={{ fontSize: '12px', color: 'var(--c-text-4)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Search size={10} /> Search
            </Link>
            <Link href="/playbooks" style={{ fontSize: '12px', color: 'var(--c-text-4)', textDecoration: 'none' }}>View all</Link>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '9px' }}>
          {WORKFLOWS.map(w => (
            <button
              key={w.label}
              onClick={() => send(w.prompt)}
              style={{
                textAlign: 'left', background: 'var(--c-panel)',
                border: '1px solid var(--c-border)', borderRadius: '10px',
                padding: '14px 14px 12px', cursor: 'pointer',
                transition: 'border-color 0.12s, background 0.12s',
              }}
              onMouseOver={e => (e.currentTarget.style.borderColor = 'var(--c-border-s)')}
              onMouseOut={e => (e.currentTarget.style.borderColor = 'var(--c-border)')}
            >
              <div style={{ fontSize: '12.5px', color: 'var(--c-text)', fontWeight: '500', marginBottom: '10px', lineHeight: '1.45' }}>
                {w.label}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--c-text-4)' }}>{w.meta}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
