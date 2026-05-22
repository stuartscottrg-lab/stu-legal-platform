import { sqlite } from '@/lib/db';
import { BookOpen } from 'lucide-react';

export default function PlaybooksPage() {
  const playbooks = sqlite.prepare('SELECT * FROM playbooks ORDER BY is_default DESC, name ASC').all() as any[];
  return (
    <div style={{ padding: '40px' }}>
      <h1 style={{ fontSize: '20px', fontWeight: '600', color: 'var(--c-text)', marginBottom: '32px' }}>Playbooks</h1>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: '14px' }}>
        {playbooks.map((p: any) => {
          const items = JSON.parse(p.checklist_items || '[]');
          return (
            <div key={p.id} style={{ background: 'var(--c-card)', border: '1px solid #2a2a2a', borderRadius: '12px', padding: '20px' }}>
              <div style={{ display: 'flex', gap: '12px', marginBottom: '10px' }}>
                <BookOpen size={15} color="#777" style={{ marginTop: '2px', flexShrink: 0 }} />
                <div>
                  <h3 style={{ fontSize: '13px', fontWeight: '600', color: 'var(--c-text)', marginBottom: '3px' }}>{p.name}</h3>
                  <p style={{ fontSize: '12px', color: 'var(--c-text-2)' }}>{p.description}</p>
                </div>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--c-text-3)' }}>{items.length} items</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
