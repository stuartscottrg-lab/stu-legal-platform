import { sqlite } from '@/lib/db';
import { LayoutTemplate } from 'lucide-react';

export default function TemplatesPage() {
  const templates = sqlite.prepare('SELECT * FROM templates ORDER BY name ASC').all() as any[];
  return (
    <div style={{ padding: '40px' }}>
      <h1 style={{ fontSize: '20px', fontWeight: '600', color: 'var(--c-text)', marginBottom: '32px' }}>Templates</h1>
      {templates.length === 0
        ? <div style={{ border: '1px dashed #2a2a2a', borderRadius: '12px', padding: '60px', textAlign: 'center', color: 'var(--c-text-3)', fontSize: '13px' }}>No templates yet</div>
        : <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: '14px' }}>
            {templates.map((t: any) => {
              const vars = JSON.parse(t.variables || '[]');
              return (
                <div key={t.id} style={{ background: 'var(--c-card)', border: '1px solid #2a2a2a', borderRadius: '12px', padding: '20px' }}>
                  <div style={{ display: 'flex', gap: '12px', marginBottom: '10px' }}>
                    <LayoutTemplate size={15} color="#777" style={{ marginTop: '2px', flexShrink: 0 }} />
                    <div>
                      <h3 style={{ fontSize: '13px', fontWeight: '600', color: 'var(--c-text)', marginBottom: '3px' }}>{t.name}</h3>
                      <p style={{ fontSize: '12px', color: 'var(--c-text-2)' }}>{t.description}</p>
                    </div>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--c-text-3)' }}>{vars.length} variables · {t.category}</div>
                </div>
              );
            })}
          </div>
      }
    </div>
  );
}
