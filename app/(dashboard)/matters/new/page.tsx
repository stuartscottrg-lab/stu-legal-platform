'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

const types = ['transactional','litigation','advisory','due_diligence','fund_formation','employment'];
const inp: React.CSSProperties = { width: '100%', background: 'var(--c-card)', border: '1px solid #2a2a2a', borderRadius: '8px', padding: '11px 14px', color: 'var(--c-text)', fontSize: '13px', outline: 'none', fontFamily: 'inherit' };

export default function NewMatterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ title: '', clientName: '', type: 'transactional', description: '' });
  const [loading, setLoading] = useState(false);
  const set = (k: string) => (e: React.ChangeEvent<any>) => setForm(f => ({...f, [k]: e.target.value}));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await fetch('/api/matters', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(form) });
    const data = await res.json();
    if (data.id) router.push(`/matters/${data.id}`);
    setLoading(false);
  };

  return (
    <div style={{ padding: '40px', maxWidth: '560px' }}>
      <h1 style={{ fontSize: '20px', fontWeight: '600', color: 'var(--c-text)', marginBottom: '32px' }}>New Matter</h1>
      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
        <div><label style={{ display: 'block', fontSize: '12px', color: 'var(--c-text-2)', marginBottom: '7px' }}>Matter Title</label>
          <input value={form.title} onChange={set('title')} required placeholder="e.g. Acme Corp NDA Review" style={inp} /></div>
        <div><label style={{ display: 'block', fontSize: '12px', color: 'var(--c-text-2)', marginBottom: '7px' }}>Client Name</label>
          <input value={form.clientName} onChange={set('clientName')} required placeholder="e.g. Acme Corporation" style={inp} /></div>
        <div><label style={{ display: 'block', fontSize: '12px', color: 'var(--c-text-2)', marginBottom: '7px' }}>Matter Type</label>
          <select value={form.type} onChange={set('type')} style={inp}>
            {types.map(t => <option key={t} value={t}>{t.replace('_',' ')}</option>)}
          </select></div>
        <div><label style={{ display: 'block', fontSize: '12px', color: 'var(--c-text-2)', marginBottom: '7px' }}>Description</label>
          <textarea value={form.description} onChange={set('description')} rows={3} style={{...inp, resize: 'vertical'}} /></div>
        <button type="submit" disabled={loading} style={{ background: 'var(--c-accent-bg)', color: 'var(--c-accent-text)', border: 'none', borderRadius: '8px', padding: '12px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', opacity: loading ? 0.7 : 1 }}>
          {loading ? 'Creating…' : 'Create Matter'}
        </button>
      </form>
    </div>
  );
}
