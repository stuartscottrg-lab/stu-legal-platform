'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Archive, RotateCcw, ChevronLeft } from 'lucide-react';

type Matter = {
  id: string; title: string; client_name: string; type: string;
  status: string; archived_at: string; doc_count: number;
};

const typeColor: Record<string, string> = {
  litigation: '#ef4444', transactional: '#3b82f6', advisory: '#8b5cf6',
  due_diligence: '#f59e0b', fund_formation: '#10b981', employment: '#f97316',
};

export default function ArchivedMattersPage() {
  const [matters, setMatters] = useState<Matter[]>([]);
  const [loading, setLoading] = useState(true);
  const [restoring, setRestoring] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/matters/archived')
      .then(r => r.json())
      .then(setMatters)
      .finally(() => setLoading(false));
  }, []);

  const restore = async (id: string) => {
    setRestoring(id);
    await fetch(`/api/matters/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ restore: true }),
    });
    setMatters(m => m.filter(x => x.id !== id));
    setRestoring(null);
  };

  const fmt = (iso: string) =>
    new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <div style={{ padding: '40px', maxWidth: '860px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
        <Link href="/matters" style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--c-text-3)', textDecoration: 'none', fontSize: '13px' }}>
          <ChevronLeft size={14} /> Matters
        </Link>
        <span style={{ color: 'var(--c-text-4)' }}>/</span>
        <h1 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--c-text)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Archive size={16} color="var(--c-text-3)" /> Archives
        </h1>
      </div>

      {loading && (
        <p style={{ fontSize: '13px', color: 'var(--c-text-3)' }}>Loading…</p>
      )}

      {!loading && matters.length === 0 && (
        <div style={{ border: '1px dashed var(--c-border)', borderRadius: '12px', padding: '60px', textAlign: 'center' }}>
          <Archive size={28} color="var(--c-text-3)" style={{ margin: '0 auto 12px' }} />
          <p style={{ fontSize: '14px', fontWeight: '500', color: 'var(--c-text-2)', marginBottom: '4px' }}>No archived matters</p>
          <p style={{ fontSize: '13px', color: 'var(--c-text-3)' }}>Archived matters will appear here. Nothing is permanently deleted.</p>
        </div>
      )}

      {matters.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {matters.map(m => (
            <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: '14px', background: 'var(--c-card)', border: '1px solid var(--c-border)', borderRadius: '12px', padding: '16px 18px', opacity: 0.8 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                  <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--c-text)' }}>{m.title}</span>
                  <span style={{ fontSize: '10px', color: typeColor[m.type] || '#888', background: `${typeColor[m.type] || '#888'}18`, padding: '2px 8px', borderRadius: '20px', whiteSpace: 'nowrap' }}>
                    {m.type.replace('_', ' ')}
                  </span>
                </div>
                <p style={{ fontSize: '12px', color: 'var(--c-text-2)', marginBottom: '2px' }}>{m.client_name}</p>
                <p style={{ fontSize: '11px', color: 'var(--c-text-4)' }}>
                  Archived {fmt(m.archived_at)} · {m.doc_count} document{m.doc_count !== 1 ? 's' : ''}
                </p>
              </div>
              <button
                onClick={() => restore(m.id)}
                disabled={restoring === m.id}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 14px', borderRadius: '7px', background: 'var(--c-card)', border: '1px solid var(--c-border)', color: 'var(--c-text-2)', fontSize: '12px', fontWeight: '500', cursor: restoring === m.id ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}
              >
                <RotateCcw size={12} />
                {restoring === m.id ? 'Restoring…' : 'Restore'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
