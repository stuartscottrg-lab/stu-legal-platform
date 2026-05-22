'use client';
import { useState } from 'react';
import { Search, Loader2, AlertCircle } from 'lucide-react';

export default function ResearchPage() {
  const [q, setQ] = useState('');
  const [result, setResult] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const research = async () => {
    if (!q.trim()) return;
    setLoading(true); setResult(''); setError('');
    try {
      const res = await fetch('/api/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: q }),
      });
      const text = await res.text();
      let data: any = {};
      try { data = JSON.parse(text); } catch { setError('Server returned an unexpected response. Please try again.'); setLoading(false); return; }
      if (!res.ok || data.error) {
        const raw = data.error || 'Something went wrong. Please try again.';
        const isAuth = raw.includes('authentication') || raw.includes('api_key') || raw.includes('401');
        setError(isAuth
          ? 'API key error — please check your ANTHROPIC_API_KEY in .env.local and restart the dev server.'
          : raw.startsWith('{') ? 'AI request failed. Please try again.' : raw);
        setLoading(false); return;
      }
      setResult(data.answer || '');
    } catch (e: any) {
      setError(e?.message || 'Network error. Please try again.');
    }
    setLoading(false);
  };

  const starters = [
    'What constitutes repudiatory breach under English law?',
    'What are the elements of negligent misrepresentation?',
    'How does TUPE apply to business transfers?',
    'What is the penalty clause rule in English contract law?',
  ];

  return (
    <div style={{ padding: '40px', maxWidth: '860px' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '20px', fontWeight: '600', color: 'var(--c-text)', marginBottom: '4px' }}>Legal Research</h1>
        <p style={{ color: 'var(--c-text-2)', fontSize: '13px' }}>AI-generated. Always verify citations independently.</p>
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <input
          value={q}
          onChange={e => setQ(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && research()}
          placeholder="e.g. What constitutes repudiatory breach under English law?"
          style={{ flex: 1, background: 'var(--c-card)', border: '1px solid var(--c-border)', borderRadius: '8px', padding: '11px 14px', color: 'var(--c-text)', fontSize: '13px', outline: 'none', fontFamily: 'inherit' }}
        />
        <button
          onClick={research}
          disabled={loading || !q.trim()}
          style={{ background: 'var(--c-accent-bg)', color: 'var(--c-accent-text)', border: 'none', borderRadius: '8px', padding: '11px 18px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '7px', opacity: loading || !q.trim() ? 0.6 : 1 }}
        >
          {loading ? <Loader2 size={13} className="animate-spin" /> : <Search size={13} />}
          Research
        </button>
      </div>

      {!result && !loading && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '24px' }}>
          {starters.map(s => (
            <button key={s} onClick={() => { setQ(s); }} style={{ background: 'var(--c-card)', border: '1px solid var(--c-border)', borderRadius: '8px', padding: '8px 12px', fontSize: '12px', color: 'var(--c-text-2)', cursor: 'pointer', fontFamily: 'inherit' }}>
              {s}
            </button>
          ))}
        </div>
      )}

      {error && (
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '10px', padding: '14px 16px', marginBottom: '16px' }}>
          <AlertCircle size={15} color="#ef4444" style={{ flexShrink: 0, marginTop: '1px' }} />
          <p style={{ fontSize: '13px', color: '#ef4444' }}>{error}</p>
        </div>
      )}

      {loading && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--c-text-2)', fontSize: '13px', padding: '24px 0' }}>
          <Loader2 size={16} className="animate-spin" /> Researching with Stu…
        </div>
      )}

      {result && (
        <div style={{ background: 'var(--c-card)', border: '1px solid var(--c-border)', borderRadius: '12px', padding: '24px' }}>
          <div style={{ fontSize: '11px', color: '#f59e0b', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.15)', padding: '5px 10px', borderRadius: '6px', marginBottom: '18px', display: 'inline-block' }}>
            AI-generated — verify all citations independently
          </div>
          <p style={{ fontSize: '13px', color: 'var(--c-text)', lineHeight: '1.85', whiteSpace: 'pre-wrap' }}>{result}</p>
        </div>
      )}
    </div>
  );
}
