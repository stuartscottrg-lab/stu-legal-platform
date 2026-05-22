import sql from '@/lib/db/pg';
import Link from 'next/link';
import { Plus, Archive } from 'lucide-react';

const typeColor: Record<string, string> = {
  litigation: '#ef4444', transactional: '#3b82f6', advisory: '#8b5cf6',
  due_diligence: '#f59e0b', fund_formation: '#10b981', employment: '#f97316',
};

export default async function MattersPage() {
  const matters = await sql`
    SELECT m.*, (SELECT COUNT(*) FROM documents d WHERE d.matter_id = m.id) as doc_count
    FROM matters m WHERE m.archived_at IS NULL ORDER BY m.updated_at DESC
  `;

  return (
    <div style={{ padding: '40px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <h1 style={{ fontSize: '20px', fontWeight: '600', color: 'var(--c-text)' }}>Matters</h1>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Link href="/matters/archived" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'var(--c-card)', color: 'var(--c-text-2)', border: '1px solid var(--c-border)', borderRadius: '8px', padding: '8px 14px', fontSize: '13px', fontWeight: '500', textDecoration: 'none' }}>
            <Archive size={13} /> Archives
          </Link>
          <Link href="/matters/new" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'var(--c-accent-bg)', color: 'var(--c-accent-text)', borderRadius: '8px', padding: '8px 16px', fontSize: '13px', fontWeight: '600', textDecoration: 'none' }}>
            <Plus size={13} /> New Matter
          </Link>
        </div>
      </div>
      {matters.length === 0
        ? <div style={{ border: '1px dashed var(--c-border)', borderRadius: '12px', padding: '60px', textAlign: 'center', color: 'var(--c-text-3)', fontSize: '13px' }}>No matters yet</div>
        : <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: '14px' }}>
            {matters.map((m: any) => (
              <Link key={m.id} href={`/matters/${m.id}`} style={{ display: 'block', background: 'var(--c-card)', border: '1px solid var(--c-border)', borderRadius: '12px', padding: '20px', textDecoration: 'none' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <h3 style={{ fontSize: '13px', fontWeight: '600', color: 'var(--c-text)', lineHeight: '1.4' }}>{m.title}</h3>
                  <span style={{ fontSize: '10px', color: typeColor[m.type] || '#888', background: `${typeColor[m.type] || '#888'}18`, padding: '2px 8px', borderRadius: '20px', marginLeft: '8px', whiteSpace: 'nowrap', flexShrink: 0 }}>{m.type.replace('_',' ')}</span>
                </div>
                <p style={{ fontSize: '12px', color: 'var(--c-text-2)', marginBottom: '14px' }}>{m.client_name}</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--c-text-3)' }}>
                  <span>{m.doc_count} docs</span>
                  <span style={{ color: m.status === 'active' ? '#22c55e' : '#666' }}>{m.status}</span>
                </div>
              </Link>
            ))}
          </div>
      }
    </div>
  );
}
