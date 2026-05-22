'use client';
import { useState, useEffect } from 'react';
import { Plus, Table2, ChevronRight, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

type Doc = { id: string; original_name: string; matter_title: string };
type Review = { id: string; name: string; columns: string; document_ids: string; created_at: string };

const PRESET_COLUMNS = [
  { id: 'parties', label: 'Parties', description: 'Who are the contracting parties?' },
  { id: 'governing_law', label: 'Governing Law', description: 'What law governs the agreement?' },
  { id: 'term', label: 'Term / Duration', description: 'How long does the agreement last?' },
  { id: 'termination', label: 'Termination', description: 'How can it be terminated and with what notice?' },
  { id: 'liability_cap', label: 'Liability Cap', description: 'Is there a cap on liability? What is it?' },
  { id: 'change_of_control', label: 'Change of Control', description: 'Is there a change of control clause?' },
  { id: 'assignment', label: 'Assignment', description: 'Can the agreement be assigned?' },
  { id: 'dispute_resolution', label: 'Dispute Resolution', description: 'How are disputes resolved?' },
  { id: 'key_dates', label: 'Key Dates', description: 'What are the key dates and milestones?' },
  { id: 'payment_terms', label: 'Payment Terms', description: 'What are the payment terms and amounts?' },
];

export default function TabularReviewsPage() {
  const router = useRouter();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [docs, setDocs] = useState<Doc[]>([]);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [selectedDocs, setSelectedDocs] = useState<string[]>([]);
  const [selectedCols, setSelectedCols] = useState<string[]>(['parties', 'governing_law', 'term', 'termination', 'liability_cap']);
  const [customCol, setCustomCol] = useState('');
  const [customCols, setCustomCols] = useState<{ id: string; label: string }[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/tabular-reviews').then(r => r.json()).then(setReviews).catch(() => {});
    fetch('/api/documents').then(r => r.json()).then(setDocs).catch(() => {});
  }, []);

  const toggleDoc = (id: string) => setSelectedDocs(d => d.includes(id) ? d.filter(x => x !== id) : [...d, id]);
  const toggleCol = (id: string) => setSelectedCols(c => c.includes(id) ? c.filter(x => x !== id) : [...c, id]);

  const addCustomCol = () => {
    if (!customCol.trim()) return;
    const id = `custom_${Date.now()}`;
    setCustomCols(c => [...c, { id, label: customCol.trim() }]);
    setSelectedCols(c => [...c, id]);
    setCustomCol('');
  };

  const create = async () => {
    if (!name || selectedDocs.length === 0 || (selectedCols.length === 0 && customCols.length === 0)) return;
    setSaving(true);
    const allCols = [
      ...PRESET_COLUMNS.filter(c => selectedCols.includes(c.id)),
      ...customCols.filter(c => selectedCols.includes(c.id)),
    ];
    try {
      const res = await fetch('/api/tabular-reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, columns: allCols, document_ids: selectedDocs }),
      });
      const data = await res.json();
      if (data.id) router.push(`/tabular-reviews/${data.id}`);
    } finally {
      setSaving(false);
    }
  };

  const deleteReview = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    await fetch(`/api/tabular-reviews/${id}`, { method: 'DELETE' });
    setReviews(r => r.filter(x => x.id !== id));
  };

  if (creating) {
    return (
      <div style={{ padding: '40px', maxWidth: '700px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px' }}>
          <button onClick={() => setCreating(false)} style={{ background: 'none', border: 'none', color: 'var(--c-text-2)', cursor: 'pointer', fontSize: '20px', lineHeight: 1, padding: '2px 4px' }}>←</button>
          <h1 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--c-text)' }}>New Tabular Review</h1>
        </div>

        {/* Name */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--c-text-2)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Review name</label>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Portfolio Contract Review" style={{ width: '100%', background: 'var(--c-card)', border: '1px solid var(--c-border)', borderRadius: '8px', padding: '10px 12px', color: 'var(--c-text)', fontSize: '13px', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }} />
        </div>

        {/* Documents */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--c-text-2)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Documents ({selectedDocs.length} selected)
          </label>
          {docs.length === 0 ? (
            <p style={{ fontSize: '13px', color: 'var(--c-text-3)' }}>No documents available. Upload documents to a matter first.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '240px', overflowY: 'auto' }}>
              {docs.map(d => (
                <label key={d.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', background: selectedDocs.includes(d.id) ? 'rgba(59,130,246,0.08)' : 'var(--c-card)', border: `1px solid ${selectedDocs.includes(d.id) ? 'rgba(59,130,246,0.3)' : 'var(--c-border)'}`, borderRadius: '8px', cursor: 'pointer' }}>
                  <input type="checkbox" checked={selectedDocs.includes(d.id)} onChange={() => toggleDoc(d.id)} style={{ accentColor: '#3b82f6' }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '13px', color: 'var(--c-text)', fontWeight: '500' }}>{d.original_name}</div>
                    <div style={{ fontSize: '11px', color: 'var(--c-text-3)', marginTop: '1px' }}>{d.matter_title}</div>
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Columns */}
        <div style={{ marginBottom: '28px' }}>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--c-text-2)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Data columns ({selectedCols.length} selected)
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '10px' }}>
            {[...PRESET_COLUMNS, ...customCols].map(c => (
              <button key={c.id} onClick={() => toggleCol(c.id)} style={{ padding: '5px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '500', cursor: 'pointer', border: `1px solid ${selectedCols.includes(c.id) ? '#3b82f6' : 'var(--c-border)'}`, background: selectedCols.includes(c.id) ? 'rgba(59,130,246,0.1)' : 'var(--c-card)', color: selectedCols.includes(c.id) ? '#3b82f6' : 'var(--c-text-2)' }}>
                {c.label}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input value={customCol} onChange={e => setCustomCol(e.target.value)} onKeyDown={e => e.key === 'Enter' && addCustomCol()} placeholder="Add custom column…" style={{ flex: 1, background: 'var(--c-card)', border: '1px solid var(--c-border)', borderRadius: '8px', padding: '8px 12px', color: 'var(--c-text)', fontSize: '13px', outline: 'none', fontFamily: 'inherit' }} />
            <button onClick={addCustomCol} style={{ padding: '8px 14px', background: 'var(--c-card)', border: '1px solid var(--c-border)', borderRadius: '8px', fontSize: '13px', color: 'var(--c-text-2)', cursor: 'pointer' }}>Add</button>
          </div>
        </div>

        <button onClick={create} disabled={saving || !name || selectedDocs.length === 0 || selectedCols.length === 0} style={{ width: '100%', padding: '12px', background: 'var(--c-accent-bg)', color: 'var(--c-accent-text)', border: 'none', borderRadius: '9px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', opacity: saving || !name || selectedDocs.length === 0 || selectedCols.length === 0 ? 0.5 : 1 }}>
          {saving ? 'Creating…' : 'Create Review'}
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: '40px', maxWidth: '800px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: '600', color: 'var(--c-text)', marginBottom: '4px' }}>Tabular Reviews</h1>
          <p style={{ fontSize: '13px', color: 'var(--c-text-2)' }}>Extract structured data from multiple documents into a comparison table.</p>
        </div>
        <button onClick={() => setCreating(true)} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--c-accent-bg)', color: 'var(--c-accent-text)', border: 'none', borderRadius: '8px', padding: '9px 16px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
          <Plus size={13} /> New Review
        </button>
      </div>

      {reviews.length === 0 ? (
        <div style={{ border: '1px dashed var(--c-border)', borderRadius: '12px', padding: '60px', textAlign: 'center' }}>
          <Table2 size={28} color="var(--c-text-3)" style={{ margin: '0 auto 12px' }} />
          <p style={{ fontSize: '14px', fontWeight: '500', color: 'var(--c-text-2)', marginBottom: '6px' }}>No tabular reviews yet</p>
          <p style={{ fontSize: '13px', color: 'var(--c-text-3)', marginBottom: '20px' }}>Create a review to extract and compare data across multiple documents.</p>
          <button onClick={() => setCreating(true)} style={{ padding: '9px 20px', background: 'var(--c-accent-bg)', color: 'var(--c-accent-text)', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
            Create your first review
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {reviews.map(r => {
            const cols = JSON.parse(r.columns || '[]');
            const docIds = JSON.parse(r.document_ids || '[]');
            return (
              <Link key={r.id} href={`/tabular-reviews/${r.id}`} style={{ display: 'flex', alignItems: 'center', gap: '14px', background: 'var(--c-card)', border: '1px solid var(--c-border)', borderRadius: '10px', padding: '16px 18px', textDecoration: 'none' }}>
                <Table2 size={16} color="var(--c-text-3)" style={{ flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--c-text)', marginBottom: '3px' }}>{r.name}</div>
                  <div style={{ fontSize: '12px', color: 'var(--c-text-3)' }}>{docIds.length} documents · {cols.length} columns</div>
                </div>
                <button onClick={e => deleteReview(r.id, e)} style={{ background: 'none', border: 'none', color: 'var(--c-text-4)', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center' }}>
                  <Trash2 size={13} />
                </button>
                <ChevronRight size={13} color="var(--c-text-3)" />
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
