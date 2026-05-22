export default function SettingsPage() {
  return (
    <div style={{ padding: '40px', maxWidth: '560px' }}>
      <h1 style={{ fontSize: '20px', fontWeight: '600', color: 'var(--c-text)', marginBottom: '32px' }}>Settings</h1>
      <div style={{ background: 'var(--c-card)', border: '1px solid var(--c-border)', borderRadius: '12px', padding: '24px' }}>
        <h2 style={{ fontSize: '13px', fontWeight: '600', color: 'var(--c-text)', marginBottom: '18px' }}>Account</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {[['Email','demo@firm.com'],['Plan','Professional'],['AI Model','Claude Sonnet 4.5'],['Storage','Local filesystem']].map(([k,v]) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', paddingBottom: '14px', borderBottom: '1px solid #2a2a2a' }}>
              <span style={{ color: 'var(--c-text-2)' }}>{k}</span>
              <span style={{ color: k==='Plan' ? '#22c55e' : 'var(--c-text)' }}>{v}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
