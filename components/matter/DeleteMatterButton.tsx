'use client';
import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function DeleteMatterButton({ matterId }: { matterId: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    setLoading(true);
    try {
      await fetch(`/api/matters/${matterId}`, { method: 'DELETE' });
      router.push('/matters');
      router.refresh();
    } catch {
      setLoading(false);
      setConfirming(false);
    }
  }

  if (confirming) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: '12px', color: 'var(--c-text-2)' }}>Delete matter and all documents?</span>
        <button
          onClick={handleDelete}
          disabled={loading}
          style={{ padding: '6px 12px', borderRadius: '7px', background: '#ef4444', color: '#fff', border: 'none', fontSize: '12px', fontWeight: '600', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}
        >
          {loading ? 'Deleting…' : 'Yes, delete'}
        </button>
        <button
          onClick={() => setConfirming(false)}
          style={{ padding: '6px 12px', borderRadius: '7px', background: 'var(--c-card)', color: 'var(--c-text-2)', border: '1px solid var(--c-border)', fontSize: '12px', cursor: 'pointer' }}
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '7px 14px', borderRadius: '7px', background: 'rgba(239,68,68,0.08)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)', fontSize: '12px', fontWeight: '500', cursor: 'pointer' }}
    >
      <Trash2 size={13} />
      Delete matter
    </button>
  );
}
