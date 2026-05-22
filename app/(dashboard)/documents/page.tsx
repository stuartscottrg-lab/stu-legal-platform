import { sqlite } from '@/lib/db';
import Link from 'next/link';
import { FileText } from 'lucide-react';

export default function DocumentsPage() {
  const docs = sqlite.prepare('SELECT d.*, m.title as matter_title FROM documents d JOIN matters m ON d.matter_id = m.id ORDER BY d.created_at DESC').all() as any[];
  return (
    <div style={{ padding: '40px' }}>
      <h1 style={{ fontSize: '20px', fontWeight: '600', color: 'var(--c-text)', marginBottom: '32px' }}>Documents</h1>
      {docs.length === 0
        ? <div style={{ border: '1px dashed var(--c-border)', borderRadius: '12px', padding: '60px', textAlign: 'center', color: 'var(--c-text-3)', fontSize: '13px' }}>No documents. <Link href="/matters" style={{ color: 'var(--c-text-2)' }}>Upload via a matter →</Link></div>
        : <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {docs.map((d: any) => (
              <Link key={d.id} href={`/matters/${d.matter_id}/documents/${d.id}`} style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'var(--c-card)', border: '1px solid var(--c-border)', borderRadius: '10px', padding: '14px 16px', textDecoration: 'none' }}>
                <FileText size={14} color="var(--c-text-3)" />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '13px', fontWeight: '500', color: 'var(--c-text)', marginBottom: '2px' }}>{d.original_name}</div>
                  <div style={{ fontSize: '12px', color: 'var(--c-text-2)' }}>{d.matter_title} · {Math.round(d.size_bytes/1024)}KB</div>
                </div>
                <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '20px', background: d.status==='ready'?'rgba(34,197,94,0.1)':'rgba(245,158,11,0.1)', color: d.status==='ready'?'#22c55e':'#f59e0b' }}>{d.status}</span>
              </Link>
            ))}
          </div>
      }
    </div>
  );
}
