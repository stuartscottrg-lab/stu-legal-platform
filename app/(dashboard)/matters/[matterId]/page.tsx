import { sqlite } from '@/lib/db';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { FileText } from 'lucide-react';
import UploadZone from '@/components/document/UploadZone';

export default async function MatterPage({ params }: { params: Promise<{ matterId: string }> }) {
  const { matterId } = await params;
  const matter = sqlite.prepare('SELECT * FROM matters WHERE id=?').get(matterId) as any;
  if (!matter) notFound();
  const docs = sqlite.prepare('SELECT * FROM documents WHERE matter_id=? ORDER BY created_at DESC').all(matterId) as any[];

  return (
    <div style={{ padding: '40px', maxWidth: '900px' }}>
      <div style={{ marginBottom: '32px' }}>
        <div style={{ fontSize: '12px', color: 'var(--c-text-3)', marginBottom: '10px' }}>
          <Link href="/matters" style={{ color: 'var(--c-text-3)', textDecoration: 'none' }}>Matters</Link> / {matter.title}
        </div>
        <h1 style={{ fontSize: '20px', fontWeight: '600', color: 'var(--c-text)', marginBottom: '4px' }}>{matter.title}</h1>
        <p style={{ color: 'var(--c-text-2)', fontSize: '13px' }}>{matter.client_name} · {matter.type}</p>
      </div>

      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '13px', fontWeight: '600', color: 'var(--c-text)', marginBottom: '14px' }}>Upload Document</h2>
        <UploadZone matterId={matterId} />
      </div>

      {docs.length > 0 && <>
        <h2 style={{ fontSize: '13px', fontWeight: '600', color: 'var(--c-text)', marginBottom: '14px' }}>Documents ({docs.length})</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {docs.map((d: any) => (
            <Link key={d.id} href={`/matters/${matterId}/documents/${d.id}`}
              style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'var(--c-card)', border: '1px solid var(--c-border)', borderRadius: '10px', padding: '14px 16px', textDecoration: 'none' }}>
              <FileText size={15} color="#555" />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '13px', fontWeight: '500', color: 'var(--c-text)' }}>{d.original_name}</div>
                <div style={{ fontSize: '12px', color: 'var(--c-text-2)', marginTop: '2px' }}>{Math.round(d.size_bytes/1024)}KB</div>
              </div>
              <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '20px', background: d.status==='ready' ? 'rgba(34,197,94,0.1)' : 'rgba(245,158,11,0.1)', color: d.status==='ready' ? '#22c55e' : '#f59e0b' }}>{d.status}</span>
            </Link>
          ))}
        </div>
      </>}
    </div>
  );
}
