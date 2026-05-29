'use client';
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Paperclip, Sparkles, ArrowUp, RotateCcw, Search, ChevronRight, FileText, X, Upload, Mail, Inbox, Volume2, VolumeX, Wand2, FileSignature } from 'lucide-react';
import Link from 'next/link';
import { getPersona, DEFAULT_PERSONA_ID, type Persona } from '@/lib/personas';
import { VoiceInput, speakText, stopSpeech } from '@/components/voice/VoiceInput';
import dynamic from 'next/dynamic';
const VoiceChat = dynamic(() => import('@/components/voice/VoiceChat'), { ssr: false });

/* ── Email briefing strip ── */
function EmailBriefingStrip({ onBrief }: { onBrief: (prompt: string) => void }) {
  const [emailStatus, setEmailStatus] = useState<{ provider: string; account: string } | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    fetch('/api/connectors/status')
      .then(r => r.json())
      .then(d => {
        const c = d.connected ?? {};
        if (c.google) setEmailStatus({ provider: 'Gmail', account: c.google.account });
        else if (c.outlook) setEmailStatus({ provider: 'Outlook', account: c.outlook.account });
        else if (c.icloud) setEmailStatus({ provider: 'Apple Mail', account: c.icloud.account });
        setChecked(true);
      })
      .catch(() => setChecked(true));
  }, []);

  if (!checked) return null;

  if (!emailStatus) {
    return (
      <Link href="/connectors" style={{
        display: 'inline-flex', alignItems: 'center', gap: '7px',
        padding: '6px 14px', borderRadius: '20px',
        border: '1px dashed var(--c-border)', background: 'transparent',
        fontSize: '12px', color: 'var(--c-text-4)', textDecoration: 'none',
        transition: 'all 0.15s',
      }}>
        <Mail size={12} /> Connect email for daily briefing
      </Link>
    );
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <button
        onClick={() => onBrief(`Give me a morning briefing. My ${emailStatus.provider} account (${emailStatus.account}) is connected. Summarise what I should focus on today as a solicitor: any urgent client matters, deadlines, or follow-ups I should be aware of. Structure it as a quick daily brief I can scan in 60 seconds.`)}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: '7px',
          padding: '6px 14px', borderRadius: '20px',
          border: '1px solid var(--c-border)', background: 'var(--c-card)',
          fontSize: '12px', color: 'var(--c-text-2)',
          cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
        }}
        onMouseOver={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--c-border-s)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--c-text)'; }}
        onMouseOut={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--c-border)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--c-text-2)'; }}
      >
        <Inbox size={12} /> Morning briefing
      </button>
      <span style={{ fontSize: '11px', color: 'var(--c-text-4)' }}>{emailStatus.provider} · {emailStatus.account}</span>
    </div>
  );
}

interface Msg { role: string; content: string; thinking?: string; thinkingOpen?: boolean; }
interface Matter { id: string; title: string; client_name: string; }
interface Doc { id: string; original_name: string; matter_title?: string; extracted_text?: string; }


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

const SUPPORTED_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
];
const SUPPORTED_EXTS = ['.pdf', '.docx', '.txt'];

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
        <Sparkles size={11} color="#8b5cf6" />
        <span style={{ color: '#8b5cf6', fontWeight: '500' }}>See the thought process</span>
        {open ? <span style={{ fontSize: '10px', color: 'var(--c-text-3)' }}>▲</span> : <ChevronRight size={10} />}
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

/* ── Rich inline formatter: bold, italic, inline code ── */
function formatInline(text: string): React.ReactNode[] {
  // Process: **bold**, *italic*, `code`, ***bold+italic***, _italic_
  const parts: React.ReactNode[] = [];
  const re = /(`[^`]+`|\*\*\*[^*]+\*\*\*|\*\*[^*]+\*\*|\*[^*]+\*|_[^_]+_)/g;
  let last = 0;
  let match: RegExpExecArray | null;
  let idx = 0;
  while ((match = re.exec(text)) !== null) {
    if (match.index > last) parts.push(text.slice(last, match.index));
    const raw = match[0];
    if (raw.startsWith('`')) {
      parts.push(<code key={idx++} style={{ fontFamily: 'monospace', fontSize: '12.5px', background: 'var(--c-panel)', border: '1px solid var(--c-border)', borderRadius: '4px', padding: '1px 5px', color: 'var(--c-text)' }}>{raw.slice(1, -1)}</code>);
    } else if (raw.startsWith('***')) {
      parts.push(<strong key={idx++}><em>{raw.slice(3, -3)}</em></strong>);
    } else if (raw.startsWith('**')) {
      parts.push(<strong key={idx++}>{raw.slice(2, -2)}</strong>);
    } else if (raw.startsWith('*') || raw.startsWith('_')) {
      parts.push(<em key={idx++}>{raw.slice(1, -1)}</em>);
    }
    last = match.index + raw.length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

/* ── Table parser ── */
function parseTable(lines: string[]): React.ReactNode {
  const rows = lines.map(l => l.replace(/^\||\|$/g, '').split('|').map(c => c.trim()));
  const header = rows[0];
  const body = rows.slice(2); // skip separator row
  return (
    <div style={{ overflowX: 'auto', margin: '14px 0' }}>
      <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: '13px' }}>
        <thead>
          <tr>
            {header.map((cell, i) => (
              <th key={i} style={{ padding: '8px 12px', textAlign: 'left', fontWeight: '600', color: 'var(--c-text)', borderBottom: '2px solid var(--c-border)', whiteSpace: 'nowrap', background: 'var(--c-panel)' }}>{formatInline(cell)}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {body.map((row, ri) => (
            <tr key={ri} style={{ borderBottom: '1px solid var(--c-border)' }}>
              {row.map((cell, ci) => (
                <td key={ci} style={{ padding: '8px 12px', color: 'var(--c-text)', verticalAlign: 'top' }}>{formatInline(cell)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function formatAI(text: string) {
  const lines = text.split('\n');
  const nodes: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Code block
    if (line.startsWith('```')) {
      const lang = line.slice(3).trim();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      nodes.push(
        <div key={i} style={{ margin: '14px 0', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--c-border)' }}>
          {lang && <div style={{ fontSize: '11px', fontWeight: '600', color: 'var(--c-text-4)', padding: '6px 14px', background: 'var(--c-panel)', borderBottom: '1px solid var(--c-border)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{lang}</div>}
          <pre style={{ margin: 0, padding: '14px 16px', fontSize: '12.5px', lineHeight: '1.65', background: 'var(--c-panel)', overflowX: 'auto', color: 'var(--c-text)', fontFamily: 'monospace' }}><code>{codeLines.join('\n')}</code></pre>
        </div>
      );
      i++;
      continue;
    }

    // Table (detect by pipe pattern)
    if (line.startsWith('|') && i + 1 < lines.length && lines[i + 1].match(/^\|[\s\-:|]+\|/)) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].startsWith('|')) {
        tableLines.push(lines[i]);
        i++;
      }
      nodes.push(<div key={i}>{parseTable(tableLines)}</div>);
      continue;
    }

    // Headings
    if (line.startsWith('### ')) {
      nodes.push(<h3 key={i} style={{ fontSize: '11.5px', fontWeight: '700', color: 'var(--c-text)', margin: '22px 0 6px', textTransform: 'uppercase', letterSpacing: '0.08em', opacity: 0.6 }}>{formatInline(line.slice(4))}</h3>);
      i++; continue;
    }
    if (line.startsWith('## ')) {
      nodes.push(<h2 key={i} style={{ fontSize: '15px', fontWeight: '600', color: 'var(--c-text)', margin: '24px 0 8px', letterSpacing: '-0.2px' }}>{formatInline(line.slice(3))}</h2>);
      i++; continue;
    }
    if (line.startsWith('# ')) {
      nodes.push(<h1 key={i} style={{ fontSize: '18px', fontWeight: '700', color: 'var(--c-text)', margin: '24px 0 10px', letterSpacing: '-0.3px' }}>{formatInline(line.slice(2))}</h1>);
      i++; continue;
    }

    // Horizontal rule
    if (line.match(/^[-*_]{3,}$/)) {
      nodes.push(<hr key={i} style={{ border: 'none', borderTop: '1px solid var(--c-border)', margin: '20px 0' }} />);
      i++; continue;
    }

    // Unordered list — collect consecutive items
    if (line.startsWith('- ') || line.startsWith('• ') || line.startsWith('* ')) {
      const items: string[] = [];
      while (i < lines.length && (lines[i].startsWith('- ') || lines[i].startsWith('• ') || lines[i].startsWith('* '))) {
        items.push(lines[i].slice(2));
        i++;
      }
      nodes.push(
        <ul key={i} style={{ margin: '8px 0', paddingLeft: 0, listStyle: 'none' }}>
          {items.map((item, j) => (
            <li key={j} style={{ display: 'flex', gap: '8px', marginBottom: '5px', fontSize: '14px', lineHeight: '1.75', color: 'var(--c-text)', alignItems: 'flex-start' }}>
              <span style={{ color: 'var(--c-text-3)', flexShrink: 0, marginTop: '1px', fontWeight: '600' }}>·</span>
              <span>{formatInline(item)}</span>
            </li>
          ))}
        </ul>
      );
      continue;
    }

    // Ordered list — collect consecutive items
    if (/^\d+\.\s/.test(line)) {
      const items: string[] = [];
      let startNum = parseInt(line.match(/^(\d+)\./)?.[1] ?? '1', 10);
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\.\s/, ''));
        i++;
      }
      nodes.push(
        <ol key={i} start={startNum} style={{ margin: '8px 0', paddingLeft: 0, listStyle: 'none' }}>
          {items.map((item, j) => (
            <li key={j} style={{ display: 'flex', gap: '10px', marginBottom: '6px', fontSize: '14px', lineHeight: '1.75', color: 'var(--c-text)', alignItems: 'flex-start' }}>
              <span style={{ color: 'var(--c-text-4)', flexShrink: 0, fontWeight: '600', minWidth: '18px', fontVariantNumeric: 'tabular-nums', marginTop: '1px' }}>{startNum + j}.</span>
              <span>{formatInline(item)}</span>
            </li>
          ))}
        </ol>
      );
      continue;
    }

    // Blockquote
    if (line.startsWith('> ')) {
      const quoteLines: string[] = [];
      while (i < lines.length && lines[i].startsWith('> ')) {
        quoteLines.push(lines[i].slice(2));
        i++;
      }
      nodes.push(
        <blockquote key={i} style={{ margin: '12px 0', padding: '10px 16px', borderLeft: '3px solid var(--c-border-s)', background: 'var(--c-panel)', borderRadius: '0 6px 6px 0', color: 'var(--c-text-2)', fontStyle: 'italic', fontSize: '13.5px', lineHeight: '1.7' }}>
          {quoteLines.map((l, j) => <p key={j} style={{ margin: j > 0 ? '6px 0 0' : 0 }}>{formatInline(l)}</p>)}
        </blockquote>
      );
      continue;
    }

    // Blank line
    if (!line.trim()) {
      nodes.push(<div key={i} style={{ height: '10px' }} />);
      i++; continue;
    }

    // Normal paragraph
    nodes.push(
      <p key={i} style={{ margin: '4px 0', fontSize: '14px', lineHeight: '1.8', color: 'var(--c-text)' }}>
        {formatInline(line)}
      </p>
    );
    i++;
  }

  return <div style={{ color: 'var(--c-text)' }}>{nodes}</div>;
}

/* ── Files & Sources modal ── */
function FilesModal({ onClose, onAttach }: { onClose: () => void; onAttach: (docs: Doc[]) => void }) {
  const [docs, setDocs] = useState<Doc[]>([]);
  const [selected, setSelected] = useState<string[]>([]);

  useEffect(() => {
    fetch('/api/documents').then(r => r.json()).then(setDocs).catch(() => {});
  }, []);

  const toggle = (id: string) => setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);

  const handleAttach = async () => {
    const selectedDocs = docs.filter(d => selected.includes(d.id));
    // Fetch full text for each doc that doesn't already have it
    const withText = await Promise.all(
      selectedDocs.map(async (doc) => {
        if (doc.extracted_text) return doc;
        try {
          const full = await fetch(`/api/documents/${doc.id}`).then(r => r.json());
          return { ...doc, extracted_text: full.extracted_text || '' };
        } catch {
          return doc;
        }
      })
    );
    onAttach(withText);
    onClose();
  };

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
          Select documents to include as context in your message.
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
                {d.matter_title && <div style={{ fontSize: '11px', color: 'var(--c-text-3)' }}>{d.matter_title}</div>}
              </div>
            </label>
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px', paddingTop: '14px', borderTop: '1px solid var(--c-border)' }}>
          <button onClick={onClose} style={{ padding: '8px 14px', background: 'none', border: '1px solid var(--c-border)', borderRadius: '7px', fontSize: '13px', color: 'var(--c-text-2)', cursor: 'pointer' }}>Cancel</button>
          <button
            onClick={handleAttach}
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
  const [persona, setPersona] = useState<Persona>(getPersona(DEFAULT_PERSONA_ID));
  const [mounted, setMounted] = useState(false);
  // Drag-drop state
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [voiceMode, setVoiceMode] = useState(false);
  const [showVoiceChat, setShowVoiceChat] = useState(false);
  const [dropError, setDropError] = useState<string | null>(null);
  const [improving, setImproving] = useState(false);
  const selectedModel = 'claude-sonnet-4-5';
  // Email / connector state
  const [emailConnected, setEmailConnected] = useState<{ account: string; provider: string } | null>(null);
  const [emailActive, setEmailActive] = useState(false);
  const [emailEmails, setEmailEmails] = useState<any[]>([]);
  const dragCounter = useRef(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Hydration-safe: read localStorage only after mount
  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem('stu_persona');
    if (saved) setPersona(getPersona(saved));
  }, []);

  const handlePersonaChange = (p: Persona) => {
    setPersona(p);
    localStorage.setItem('stu_persona', p.id);
  };

  useEffect(() => {
    fetch('/api/matters').then(r => r.json()).then(d => setMatters(d || [])).catch(() => {});
    // Check email connector status
    fetch('/api/connectors/status').then(r => r.json()).then(d => {
      const c = d.connected ?? {};
      if (c.google) setEmailConnected({ account: c.google.account, provider: 'Gmail' });
      else if (c.outlook) setEmailConnected({ account: c.outlook.account, provider: 'Outlook' });
      else if (c.icloud) setEmailConnected({ account: c.icloud.account, provider: 'Apple Mail' });
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (messages.length > 0) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── Global drag-drop handlers ──────────────────────────────────────────
  const uploadDroppedFile = useCallback(async (file: File) => {
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!SUPPORTED_TYPES.includes(file.type) && !SUPPORTED_EXTS.includes(ext)) {
      setDropError(`"${file.name}" isn't supported. Drop a PDF, DOCX or TXT file.`);
      setTimeout(() => setDropError(null), 4000);
      return;
    }
    setDropError(null);
    setUploading(file.name);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/documents/upload', { method: 'POST', body: fd });
      const { id, error } = await res.json();
      if (error || !id) throw new Error(error || 'Upload failed');

      // Poll for text extraction (up to 30s)
      let text = '';
      for (let i = 0; i < 20; i++) {
        await new Promise(r => setTimeout(r, 1500));
        const doc = await fetch(`/api/documents/${id}`).then(r => r.json());
        if (doc.status === 'ready') {
          text = doc.extracted_text || '';
          break;
        }
      }

      setAttachedDocs(prev => [...prev, {
        id,
        original_name: file.name,
        extracted_text: text,
      }]);
    } catch (e: any) {
      console.error('Drop upload failed:', e);
    } finally {
      setUploading(null);
    }
  }, []);

  useEffect(() => {
    const onDragEnter = (e: DragEvent) => {
      e.preventDefault();
      dragCounter.current++;
      if (dragCounter.current === 1) setIsDragging(true);
    };
    const onDragLeave = (e: DragEvent) => {
      e.preventDefault();
      dragCounter.current--;
      if (dragCounter.current === 0) setIsDragging(false);
    };
    const onDragOver = (e: DragEvent) => { e.preventDefault(); };
    const onDrop = (e: DragEvent) => {
      e.preventDefault();
      dragCounter.current = 0;
      setIsDragging(false);
      const files = Array.from(e.dataTransfer?.files || []);
      files.forEach(uploadDroppedFile);
    };

    document.addEventListener('dragenter', onDragEnter);
    document.addEventListener('dragleave', onDragLeave);
    document.addEventListener('dragover', onDragOver);
    document.addEventListener('drop', onDrop);
    return () => {
      document.removeEventListener('dragenter', onDragEnter);
      document.removeEventListener('dragleave', onDragLeave);
      document.removeEventListener('dragover', onDragOver);
      document.removeEventListener('drop', onDrop);
    };
  }, [uploadDroppedFile]);

  const toggleThinking = (idx: number) => {
    setMessages(prev => prev.map((m, i) => i === idx ? { ...m, thinkingOpen: !m.thinkingOpen } : m));
  };

  const send = useCallback(async (override?: string) => {
    const content = override || input.trim();
    if (!content || streaming) return;
    setInput('');
    setShowPrompts(false);

    const matterCtx = selectedMatter ? matters.find(m => m.id === selectedMatter) : null;
    let ctx = '';
    if (matterCtx) ctx += `[Matter: ${matterCtx.title} — ${matterCtx.client_name}]\n\n`;
    if (attachedDocs.length > 0) {
      for (const doc of attachedDocs) {
        if (doc.extracted_text) {
          ctx += `[Document: ${doc.original_name}]\n${doc.extracted_text}\n\n`;
        } else {
          ctx += `[Attached: ${doc.original_name}]\n`;
        }
      }
    }
    // Inject email context if email source is active
    if (emailActive && emailEmails.length > 0) {
      ctx += `[Email Inbox — ${emailConnected?.provider ?? 'Email'} · ${emailConnected?.account ?? ''}]\n`;
      ctx += `Here are the ${emailEmails.length} most recent emails:\n`;
      emailEmails.slice(0, 10).forEach((e, i) => {
        ctx += `\n${i + 1}. From: ${e.from}\n   Subject: ${e.subject}\n   Date: ${e.date}\n   Preview: ${e.snippet}\n`;
      });
      ctx += '\n';
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
        body: JSON.stringify({ messages: apiMessages, personaId: persona.id, model: selectedModel }),
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
    // Auto-read response aloud if voice mode is on
    setMessages(prev => {
      if (voiceMode && prev.length > 0) {
        const last = prev[prev.length - 1];
        if (last.role === 'assistant' && last.content) {
          speakText(last.content);
        }
      }
      return prev;
    });
  }, [input, streaming, messages, selectedMatter, matters, attachedDocs, persona, voiceMode]);

  /* ── Improve prompt ── */
  async function handleImprove() {
    const draft = input.trim();
    if (!draft || improving || streaming) return;
    setImproving(true);
    try {
      const res = await fetch('/api/ai/improve-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: draft }),
      });
      const data = await res.json();
      if (res.ok && data.improved) {
        setInput(data.improved);
        requestAnimationFrame(() => {
          const ta = textareaRef.current;
          if (ta) { ta.focus(); ta.setSelectionRange(ta.value.length, ta.value.length); }
        });
      } else {
        setDropError(data.error || 'Could not improve that prompt');
        setTimeout(() => setDropError(null), 3000);
      }
    } catch {
      setDropError('Could not reach the improve service');
      setTimeout(() => setDropError(null), 3000);
    } finally {
      setImproving(false);
    }
  }

  /* ── Improve button (shared) ── */
  const ImproveButton = ({ compact }: { compact?: boolean }) => (
    <button
      onClick={handleImprove}
      disabled={!input.trim() || improving || streaming}
      title="Rewrite my prompt to a higher standard"
      style={{
        display: 'flex', alignItems: 'center', gap: '5px',
        background: improving ? 'rgba(139,92,246,0.1)' : 'none',
        border: 'none', borderRadius: '7px',
        padding: compact ? '5px 8px' : '6px 10px',
        fontSize: compact ? '12px' : '12.5px',
        color: input.trim() && !streaming ? '#8b5cf6' : 'var(--c-text-4)',
        cursor: input.trim() && !improving && !streaming ? 'pointer' : 'default',
        fontFamily: 'inherit', fontWeight: 500, whiteSpace: 'nowrap',
      }}
    >
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <Wand2 size={compact ? 12 : 13} style={improving ? { animation: 'spin 1s linear infinite' } : undefined} />
      {improving ? 'Improving…' : 'Improve'}
    </button>
  );

  /* ── Draft full version of an attached document ── */
  const DRAFT_FULL_INSTRUCTION = `Read and analyse the attached document(s) in full. Then produce a complete, fully-worded, professionally drafted version suitable for use by a UK law firm (English & Welsh law unless the document clearly states another jurisdiction).

Requirements:
- Expand any abbreviated, bullet-point or placeholder clauses into full, properly drafted wording.
- Complete obviously missing standard sections for this type of document (e.g. definitions, governing law, execution block) where appropriate.
- Ensure internal consistency: consistent defined terms, cross-references and numbering.
- Use clear, professional British English.
- Do NOT invent specific facts, names, figures or dates. Where a detail is missing, insert a clearly marked placeholder such as [CLIENT NAME] or [DATE].

Output the complete drafted document first. Then add a short "Drafting notes" section listing the assumptions you made and any details I still need to confirm or fill in.`;

  const DraftFullButton = ({ compact }: { compact?: boolean }) => {
    if (!attachedDocs.length) return null;
    return (
      <button
        onClick={() => send(DRAFT_FULL_INSTRUCTION)}
        disabled={streaming || improving}
        title="Turn the attached document into a complete, fully-worded draft"
        style={{
          display: 'flex', alignItems: 'center', gap: '5px',
          background: 'none', border: 'none', borderRadius: '7px',
          padding: compact ? '5px 8px' : '6px 10px',
          fontSize: compact ? '12px' : '12.5px',
          color: streaming ? 'var(--c-text-4)' : '#0ea5e9',
          cursor: streaming ? 'default' : 'pointer',
          fontFamily: 'inherit', fontWeight: 500, whiteSpace: 'nowrap',
        }}
      >
        <FileSignature size={compact ? 12 : 13} /> Draft full version
      </button>
    );
  };

  /* ── Shared input toolbar rows ── */
  const AttachedChips = () => (
    <>
      {(uploading || attachedDocs.length > 0) && (
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', padding: '8px 14px 0' }}>
          {uploading && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: 'rgba(100,100,100,0.1)', border: '1px solid var(--c-border)', borderRadius: '20px', padding: '3px 8px', fontSize: '11px', color: 'var(--c-text-3)' }}>
              <Upload size={10} style={{ animation: 'spin 1s linear infinite' }} />
              <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
              Uploading {uploading}…
            </span>
          )}
          {attachedDocs.map(d => (
            <span key={d.id} style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: '20px', padding: '3px 8px', fontSize: '11px', color: '#3b82f6' }}>
              <FileText size={10} /> {d.original_name}
              <button onClick={() => setAttachedDocs(p => p.filter(x => x.id !== d.id))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#3b82f6', padding: 0, display: 'flex' }}><X size={10} /></button>
            </span>
          ))}
        </div>
      )}
    </>
  );

  // ─── Conversation view ─────────────────────────────────────────────────
  if (messages.length > 0) {
    return (
      <div className="chat-page" style={{ display: 'flex', flexDirection: 'column', height: '100dvh', background: 'var(--c-bg)' }}>
        {/* Drag overlay */}
        {isDragging && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(34,197,94,0.12)', border: '3px dashed #22c55e', display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
            <div style={{ textAlign: 'center', color: '#16a34a' }}>
              <Upload size={32} style={{ marginBottom: '10px' }} />
              <div style={{ fontSize: '16px', fontWeight: '600' }}>Drop to attach</div>
              <div style={{ fontSize: '13px', opacity: 0.7, marginTop: '4px' }}>PDF, DOCX or TXT</div>
            </div>
          </div>
        )}

        {showFiles && <FilesModal onClose={() => setShowFiles(false)} onAttach={docs => setAttachedDocs(docs)} />}

        {/* Drop error toast */}
        {dropError && (
          <div style={{ position: 'fixed', bottom: '24px', left: '50%', transform: 'translateX(-50%)', background: 'rgba(239,68,68,0.95)', color: '#fff', padding: '10px 18px', borderRadius: '10px', fontSize: '13px', fontWeight: '500', zIndex: 300, boxShadow: '0 8px 24px rgba(0,0,0,0.3)' }}>
            {dropError}
          </div>
        )}

        {/* Header */}
        <div style={{ flexShrink: 0, borderBottom: '1px solid var(--c-border)', padding: '0 16px', height: '52px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--c-text)' }}>Stu</span>
          <div style={{ flex: 1 }} />
          <span style={{ fontSize: '12px', color: 'var(--c-text-3)' }}>
            {selectedMatter ? matters.find(m => m.id === selectedMatter)?.title : ''}
          </span>
          <button onClick={() => { setMessages([]); setInput(''); setAttachedDocs([]); }} style={{ display: 'flex', alignItems: 'center', gap: '5px', background: 'none', border: '1px solid var(--c-border)', borderRadius: '6px', padding: '5px 10px', fontSize: '12px', color: 'var(--c-text-2)', cursor: 'pointer', fontFamily: 'inherit' }}>
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
            <div style={{ background: 'var(--c-card)', border: '1px solid var(--c-border)', borderRadius: '14px', boxShadow: 'var(--c-shadow-md)', overflow: 'hidden' }}>
              <AttachedChips />
              <textarea
                ref={textareaRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
                placeholder="Ask a follow-up…"
                rows={2}
                style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', padding: '14px 16px 6px', fontSize: '13.5px', color: 'var(--c-text)', resize: 'none', fontFamily: 'inherit', lineHeight: '1.6' }}
              />
              {/* Mode + actions row */}
              <div style={{ display: 'flex', alignItems: 'center', padding: '6px 10px 10px', gap: '6px', position: 'relative' }}>
                <button onClick={() => setShowFiles(true)} style={{ display: 'flex', alignItems: 'center', gap: '5px', background: 'none', border: 'none', borderRadius: '6px', padding: '5px 8px', fontSize: '12px', color: attachedDocs.length ? '#3b82f6' : 'var(--c-text-3)', cursor: 'pointer', fontFamily: 'inherit' }}>
                  <Paperclip size={12} /> {attachedDocs.length ? `${attachedDocs.length} file${attachedDocs.length > 1 ? 's' : ''}` : 'Files'}
                </button>
                <ImproveButton compact />
                <DraftFullButton compact />
                <button
                  onClick={() => setShowVoiceChat(true)}
                  title="Voice conversation with Stu"
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                    border: '1px solid var(--c-border)',
                    background: 'none', cursor: 'pointer', transition: 'all 0.2s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#60a5fa'; e.currentTarget.style.background = 'rgba(96,165,250,0.08)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--c-border)'; e.currentTarget.style.background = 'none'; }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--c-text-3)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2a3 3 0 0 1 3 3v7a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3z"/>
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                    <line x1="12" y1="19" x2="12" y2="22"/>
                  </svg>
                </button>
                <button
                  onClick={() => { setVoiceMode(v => !v); if (voiceMode) stopSpeech(); }}
                  title={voiceMode ? 'Voice responses on — click to mute' : 'Muted — click to hear Stu speak'}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, borderRadius: '50%', border: `1px solid ${voiceMode ? '#22c55e55' : 'var(--c-border)'}`, background: voiceMode ? 'rgba(34,197,94,0.07)' : 'none', cursor: 'pointer', flexShrink: 0 }}
                >
                  {voiceMode ? <Volume2 size={13} color="#22c55e" /> : <VolumeX size={13} color="var(--c-text-4)" />}
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
  const matterLabel = selectedMatter ? matters.find(m => m.id === selectedMatter)?.title : null;

  return (
    <div className="assistant-landing" style={{ minHeight: '100dvh', background: 'var(--c-bg)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 24px 80px', position: 'relative' }}>

      {/* Drag overlay */}
      {isDragging && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(34,197,94,0.08)', border: '2px dashed #22c55e', display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', backdropFilter: 'blur(2px)' }}>
          <div style={{ textAlign: 'center', color: '#16a34a' }}>
            <Upload size={28} style={{ marginBottom: '8px' }} />
            <div style={{ fontSize: '15px', fontWeight: '600' }}>Drop to attach</div>
            <div style={{ fontSize: '12px', opacity: 0.7, marginTop: '3px' }}>PDF, DOCX, TXT or images</div>
          </div>
        </div>
      )}

      {showFiles && <FilesModal onClose={() => setShowFiles(false)} onAttach={docs => setAttachedDocs(docs)} />}

      {/* Drop error */}
      {dropError && (
        <div style={{ position: 'fixed', bottom: '24px', left: '50%', transform: 'translateX(-50%)', background: 'rgba(239,68,68,0.95)', color: '#fff', padding: '10px 18px', borderRadius: '10px', fontSize: '13px', fontWeight: '500', zIndex: 300, boxShadow: '0 8px 24px rgba(0,0,0,0.3)' }}>
          {dropError}
        </div>
      )}

      {/* ── Wordmark ── */}
      <div style={{ textAlign: 'center', marginBottom: '36px' }}>
        <div style={{ fontSize: '32px', fontWeight: '700', color: 'var(--c-text)', letterSpacing: '-0.8px', marginBottom: '6px' }}>Stu</div>
        <div style={{ fontSize: '13.5px', color: 'var(--c-text-3)' }}>Your UK legal AI — ask anything about English &amp; Welsh law</div>
      </div>

      {/* ── Context row (matter + client) ── */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '18px', flexWrap: 'wrap', justifyContent: 'center' }}>
        <select
          value={selectedMatter}
          onChange={e => setSelectedMatter(e.target.value)}
          style={{
            background: selectedMatter ? 'var(--c-panel)' : 'transparent',
            border: '1px solid var(--c-border)', borderRadius: '22px',
            padding: '7px 32px 7px 14px', fontSize: '12.5px',
            color: selectedMatter ? 'var(--c-text)' : 'var(--c-text-3)',
            outline: 'none', cursor: 'pointer', appearance: 'none',
            fontFamily: 'inherit',
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2.5'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'calc(100% - 10px) center',
          }}
        >
          <option value="">Choose matter</option>
          {matters.map(m => <option key={m.id} value={m.id}>{m.title} · {m.client_name}</option>)}
        </select>
        {!matters.length && (
          <Link href="/matters/new" style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '7px 14px', borderRadius: '22px', border: '1px solid var(--c-border)', fontSize: '12.5px', color: 'var(--c-text-3)', textDecoration: 'none', background: 'transparent' }}>
            + New matter
          </Link>
        )}
      </div>

      {/* ── Main input box ── */}
      <div style={{ width: '100%', maxWidth: '740px', background: 'var(--c-card)', border: '1px solid var(--c-border)', borderRadius: '16px', boxShadow: '0 4px 24px rgba(0,0,0,0.08)', overflow: 'hidden', marginBottom: '0' }}>
        <AttachedChips />
        <textarea
          ref={textareaRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
          placeholder="Ask Stu anything about UK law…"
          rows={4}
          style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', padding: '20px 20px 8px', fontSize: '15px', color: 'var(--c-text)', resize: 'none', fontFamily: 'inherit', lineHeight: '1.65', boxSizing: 'border-box' }}
          autoFocus
        />

        {/* Toolbar */}
        <div style={{ display: 'flex', alignItems: 'center', padding: '8px 12px 12px', gap: '2px', borderTop: '1px solid var(--c-border)' }}>
          {/* Files & sources */}
          <button
            onClick={() => setShowFiles(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '5px', background: 'none', border: 'none', borderRadius: '7px', padding: '6px 10px', fontSize: '12.5px', color: attachedDocs.length ? 'var(--c-accent-text)' : 'var(--c-text-3)', cursor: 'pointer', fontFamily: 'inherit', fontWeight: attachedDocs.length ? 500 : 400 }}
          >
            <Paperclip size={13} />
            {attachedDocs.length ? `${attachedDocs.length} file${attachedDocs.length > 1 ? 's' : ''}` : 'Files & sources'}
          </button>

          <div style={{ width: '1px', height: '16px', background: 'var(--c-border)', margin: '0 2px' }} />

          {/* Prompts */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowPrompts(p => !p)}
              style={{ display: 'flex', alignItems: 'center', gap: '5px', background: showPrompts ? 'var(--c-panel)' : 'none', border: 'none', borderRadius: '7px', padding: '6px 10px', fontSize: '12.5px', color: 'var(--c-text-3)', cursor: 'pointer', fontFamily: 'inherit' }}
            >
              <Sparkles size={13} /> Prompts
            </button>
            {showPrompts && <PromptsDropdown onSelect={p => { setInput(p); setShowPrompts(false); }} onClose={() => setShowPrompts(false)} />}
          </div>

          <ImproveButton />
          <DraftFullButton />

          <div style={{ flex: 1 }} />

          {/* Voice — opens full voice chat overlay */}
          <button
            onClick={() => setShowVoiceChat(true)}
            title="Voice conversation with Stu"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
              border: '1px solid var(--c-border)',
              background: 'none', cursor: 'pointer', transition: 'all 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#60a5fa'; e.currentTarget.style.background = 'rgba(96,165,250,0.08)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--c-border)'; e.currentTarget.style.background = 'none'; }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--c-text-3)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2a3 3 0 0 1 3 3v7a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3z"/>
              <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
              <line x1="12" y1="19" x2="12" y2="22"/>
            </svg>
          </button>

          {/* Ask Stu button */}
          <button
            onClick={() => send()}
            disabled={!input.trim() || streaming}
            style={{
              background: (input.trim() && !streaming) ? 'var(--c-accent-bg)' : 'var(--c-panel)',
              color: (input.trim() && !streaming) ? 'var(--c-accent-text)' : 'var(--c-text-4)',
              border: 'none', borderRadius: '9px', padding: '7px 20px',
              fontSize: '13px', fontWeight: '600',
              cursor: (input.trim() && !streaming) ? 'pointer' : 'default',
              display: 'flex', alignItems: 'center', gap: '6px',
              transition: 'all 0.15s', fontFamily: 'inherit', marginLeft: '4px',
            }}
          >
            Ask Stu <ArrowUp size={12} />
          </button>
        </div>
      </div>

      {/* ── Source chips ── */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '14px', justifyContent: 'center', width: '100%', maxWidth: '740px' }}>

        {/* UK Law — always active */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '20px', border: '1px solid rgba(34,197,94,0.3)', background: 'rgba(34,197,94,0.06)', fontSize: '12px', color: '#16a34a', fontWeight: 500 }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20M12 2a14.5 14.5 0 0 1 0 20M2 12h20"/></svg>
          UK Law
          <span style={{ fontSize: '10px', background: 'rgba(34,197,94,0.15)', borderRadius: '4px', padding: '1px 5px', color: '#15803d' }}>built-in</span>
        </div>

        {/* Your documents */}
        <button
          onClick={() => setShowFiles(true)}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '20px', border: `1px solid ${attachedDocs.length ? 'rgba(59,130,246,0.4)' : 'var(--c-border)'}`, background: attachedDocs.length ? 'rgba(59,130,246,0.06)' : 'transparent', fontSize: '12px', color: attachedDocs.length ? '#2563eb' : 'var(--c-text-3)', cursor: 'pointer', fontFamily: 'inherit', fontWeight: attachedDocs.length ? 500 : 400 }}
        >
          <FileText size={12} />
          {attachedDocs.length ? `${attachedDocs.length} document${attachedDocs.length > 1 ? 's' : ''}` : 'Your documents'}
          {!attachedDocs.length && <span style={{ fontSize: '11px', color: 'var(--c-text-4)' }}>+</span>}
        </button>

        {/* Email inbox */}
        {emailConnected ? (
          <button
            onClick={async () => {
              if (!emailActive) {
                // Activate + fetch emails
                try {
                  const data = await fetch('/api/connectors/gmail/messages?limit=15').then(r => r.json());
                  setEmailEmails(data.emails ?? []);
                  setEmailActive(true);
                } catch {
                  setEmailActive(true);
                }
              } else {
                setEmailActive(false);
                setEmailEmails([]);
              }
            }}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '20px', border: `1px solid ${emailActive ? 'rgba(234,179,8,0.4)' : 'var(--c-border)'}`, background: emailActive ? 'rgba(234,179,8,0.06)' : 'transparent', fontSize: '12px', color: emailActive ? '#a16207' : 'var(--c-text-3)', cursor: 'pointer', fontFamily: 'inherit', fontWeight: emailActive ? 500 : 400 }}
          >
            <Mail size={12} />
            {emailActive ? `${emailConnected.provider} active` : emailConnected.provider}
            <span style={{ fontSize: '10.5px', color: emailActive ? '#a16207' : 'var(--c-text-4)', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{emailConnected.account}</span>
          </button>
        ) : (
          <Link href="/connectors" style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '20px', border: '1px dashed var(--c-border)', background: 'transparent', fontSize: '12px', color: 'var(--c-text-4)', textDecoration: 'none', fontFamily: 'inherit' }}>
            <Mail size={12} />
            Email inbox
            <span style={{ fontSize: '11px' }}>Connect →</span>
          </Link>
        )}

        {/* Matter context chip */}
        {matterLabel && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '20px', border: '1px solid rgba(139,92,246,0.3)', background: 'rgba(139,92,246,0.06)', fontSize: '12px', color: '#7c3aed', fontWeight: 500 }}>
            <FileText size={12} />
            {matterLabel}
          </div>
        )}

        {/* Web search — coming soon */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '20px', border: '1px solid var(--c-border)', background: 'transparent', fontSize: '12px', color: 'var(--c-text-4)', opacity: 0.6 }}>
          <Search size={12} />
          Web search
          <span style={{ fontSize: '10px', background: 'var(--c-panel)', borderRadius: '4px', padding: '1px 5px' }}>soon</span>
        </div>
      </div>

      {/* ── Suggested queries ── */}
      <div style={{ width: '100%', maxWidth: '740px', marginTop: '40px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <span style={{ fontSize: '12px', color: 'var(--c-text-4)', fontWeight: 500, letterSpacing: '0.02em' }}>Suggested queries</span>
          <Link href="/playbooks" style={{ fontSize: '12px', color: 'var(--c-text-4)', textDecoration: 'none' }}>View all workflows →</Link>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '8px' }}>
          {PROMPT_TEMPLATES.slice(0, 4).map(w => (
            <button
              key={w.label}
              onClick={() => send(w.prompt)}
              style={{ textAlign: 'left', background: 'var(--c-card)', border: '1px solid var(--c-border)', borderRadius: '12px', padding: '14px 16px', cursor: 'pointer', transition: 'all 0.12s', fontFamily: 'inherit' }}
              onMouseOver={e => { e.currentTarget.style.borderColor = 'var(--c-border-s)'; e.currentTarget.style.background = 'var(--c-panel)'; }}
              onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--c-border)'; e.currentTarget.style.background = 'var(--c-card)'; }}
            >
              <div style={{ fontSize: '12.5px', color: 'var(--c-text)', fontWeight: '500', marginBottom: '8px', lineHeight: '1.4' }}>{w.label}</div>
              <div style={{ fontSize: '11px', color: 'var(--c-text-4)' }}>{w.meta}</div>
            </button>
          ))}
        </div>
      </div>

      {/* ── Voice Chat Overlay ── */}
      {showVoiceChat && (
        <VoiceChat onClose={() => setShowVoiceChat(false)} />
      )}
    </div>
  );
}
