'use client';
import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Loader2, Play, Download, ArrowLeft, RefreshCw } from 'lucide-react';

type Col = { id: string; label: string; description?: string };
type Doc = { id: string; original_name: string; matter_title: string };
type Review = {
  id: string; name: string;
  columns: string; document_ids: string; results: string;
};

export default function TabularReviewPage() {
  const { reviewId } = useParams<{ reviewId: string }>();
  const router = useRouter();
  const [review, setReview] = useState<Review | null>(null);
  const [docs, setDocs] = useState<Doc[]>([]);
  const [results, setResults] = useState<Record<string, Record<string, string>>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [runningAll, setRunningAll] = useState(false);

  useEffect(() => {
    fetch(`/api/tabular-reviews/${reviewId}`).then(r => r.json()).then(data => {
      setReview(data);
      setResults(JSON.parse(data.results || '{}'));
    });
    fetch('/api/documents').then(r => r.json()).then(setDocs);
  }, [reviewId]);

  const cols: Col[] = review ? JSON.parse(review.columns || '[]') : [];
  const docIds: string[] = review ? JSON.parse(review.document_ids || '[]') : [];
  const reviewDocs = docIds.map(id => docs.find(d => d.id === id)).filter(Boolean) as Doc[];

  const runCell = useCallback(async (docId: string, col: Col) => {
    const key = `${docId}:${col.id}`;
    setLoading(l => ({ ...l, [key]: true }));
    try {
      const res = await fetch(`/api/tabular-reviews/${reviewId}/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentId: docId, column: col }),
      });
      if (!res.body) return;
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
            if (parsed.text) { text += parsed.text; setResults(r => ({ ...r, [docId]: { ...(r[docId] || {}), [col.id]: text } })); }
          } catch {}
        }
      }
    } finally {
      setLoading(l => ({ ...l, [key]: false }));
    }
  }, [reviewId]);

  const runAll = async () => {
    setRunningAll(true);
    for (const doc of reviewDocs) {
      for (const col of cols) {
        await runCell(doc.id, col);
      }
    }
    setRunningAll(false);
  };

  const exportCSV = () => {
    const header = ['Document', ...cols.map(c => c.label)].join(',');
    const rows = reviewDocs.map(d =>
      [`"${d.original_name}"`, ...cols.map(c => `"${(results[d.id]?.[c.id] || '').replace(/"/g, '""')}"`)].join(',')
    );
    const csv = [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${review?.name || 'review'}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const cellsFilled = reviewDocs.reduce((n, d) => n + cols.filter(c => results[d.id]?.[c.id]).length, 0);
  const totalCells = reviewDocs.length * cols.length;

  if (!review) return (
    <div style={{ padding: '40px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--c-text-2)', fontSize: '13px' }}>
      <Loader2 size={14} className="animate-spin" /> Loading…
    </div>
  );

  return (
    <div style={{ padding: '32px', height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', flexShrink: 0 }}>
        <button onClick={() => router.push('/tabular-reviews')} style={{ display: 'flex', alignItems: 'center', gap: '5px', background: 'none', border: '1px solid var(--c-border)', borderRadius: '7px', padding: '6px 11px', fontSize: '12px', color: 'var(--c-text-2)', cursor: 'pointer' }}>
          <ArrowLeft size={12} /> Back
        </button>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--c-text)' }}>{review.name}</h1>
          <p style={{ fontSize: '12px', color: 'var(--c-text-3)', marginTop: '1px' }}>{reviewDocs.length} documents · {cols.length} columns · {cellsFilled}/{totalCells} cells filled</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {cellsFilled > 0 && (
            <button onClick={exportCSV} style={{ display: 'flex', alignItems: 'center', gap: '5px', background: 'none', border: '1px solid var(--c-border)', borderRadius: '7px', padding: '7px 12px', fontSize: '12px', color: 'var(--c-text-2)', cursor: 'pointer' }}>
              <Download size={12} /> Export CSV
            </button>
          )}
          <button onClick={runAll} disabled={runningAll || reviewDocs.length === 0} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--c-accent-bg)', color: 'var(--c-accent-text)', border: 'none', borderRadius: '7px', padding: '7px 14px', fontSize: '12px', fontWeight: '600', cursor: runningAll ? 'not-allowed' : 'pointer', opacity: runningAll ? 0.7 : 1 }}>
            {runningAll ? <><Loader2 size={12} className="animate-spin" /> Running…</> : <><Play size={12} /> Run All</>}
          </button>
        </div>
      </div>

      {/* Table */}
      <div style={{ flex: 1, overflowX: 'auto', overflowY: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
          <thead>
            <tr style={{ background: 'var(--c-card)', position: 'sticky', top: 0, zIndex: 1 }}>
              <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: '600', color: 'var(--c-text-2)', borderBottom: '1px solid var(--c-border)', whiteSpace: 'nowrap', minWidth: '180px', position: 'sticky', left: 0, background: 'var(--c-card)', zIndex: 2 }}>Document</th>
              {cols.map(col => (
                <th key={col.id} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: '600', color: 'var(--c-text-2)', borderBottom: '1px solid var(--c-border)', minWidth: '200px', whiteSpace: 'nowrap' }}>
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {reviewDocs.map((doc, i) => (
              <tr key={doc.id} style={{ borderBottom: '1px solid var(--c-border)', background: i % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.02)' }}>
                <td style={{ padding: '12px 14px', fontWeight: '500', color: 'var(--c-text)', verticalAlign: 'top', position: 'sticky', left: 0, background: i % 2 === 0 ? 'var(--c-bg)' : 'var(--c-card)', zIndex: 1, whiteSpace: 'nowrap', maxWidth: '220px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--c-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{doc.original_name}</div>
                  <div style={{ fontSize: '11px', color: 'var(--c-text-3)', marginTop: '2px' }}>{doc.matter_title}</div>
                </td>
                {cols.map(col => {
                  const key = `${doc.id}:${col.id}`;
                  const isLoading = loading[key];
                  const value = results[doc.id]?.[col.id];
                  return (
                    <td key={col.id} style={{ padding: '10px 14px', verticalAlign: 'top', minWidth: '200px' }}>
                      {isLoading ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--c-text-3)', fontSize: '11px' }}>
                          <Loader2 size={11} className="animate-spin" /> Analysing…
                        </div>
                      ) : value ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <p style={{ fontSize: '12px', color: 'var(--c-text)', lineHeight: '1.6', margin: 0 }}>{value}</p>
                          <button onClick={() => runCell(doc.id, col)} style={{ alignSelf: 'flex-start', background: 'none', border: 'none', color: 'var(--c-text-4)', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center', gap: '3px', fontSize: '10px' }}>
                            <RefreshCw size={9} /> Re-run
                          </button>
                        </div>
                      ) : (
                        <button onClick={() => runCell(doc.id, col)} style={{ background: 'none', border: '1px dashed var(--c-border)', borderRadius: '6px', padding: '6px 10px', fontSize: '11px', color: 'var(--c-text-3)', cursor: 'pointer', width: '100%', textAlign: 'left' }}>
                          + Run
                        </button>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
