import { SignUp } from '@clerk/nextjs';

export default function SignUpPage() {
  return (
    <div style={{
      minHeight: '100dvh',
      background: '#0a0a0a',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
    }}>
      <div style={{ position: 'fixed', inset: 0, background: 'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(37,99,235,0.15) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ fontSize: '28px', fontWeight: '700', color: '#f0f0f0', fontFamily: 'Georgia, serif', letterSpacing: '-0.5px' }}>Stu</div>
          <div style={{ fontSize: '13px', color: '#555', marginTop: '4px' }}>AI-powered legal platform</div>
        </div>
        <SignUp
          appearance={{
            variables: {
              colorPrimary: '#2563eb',
              colorBackground: '#111111',
              colorInputBackground: '#1a1a1a',
              colorInputText: '#f0f0f0',
              colorText: '#f0f0f0',
              colorTextSecondary: '#888888',
              borderRadius: '12px',
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
            },
            elements: {
              card: { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', boxShadow: 'none' },
              socialButtonsBlockButton: { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#f0f0f0' },
              socialButtonsBlockButtonText: { color: '#f0f0f0' },
              dividerLine: { background: 'rgba(255,255,255,0.08)' },
              dividerText: { color: '#555' },
              formFieldLabel: { color: '#888' },
              formFieldInput: { background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)', color: '#f0f0f0', borderRadius: '10px' },
              formButtonPrimary: { background: '#fff', color: '#000', fontWeight: '600' },
              footerActionLink: { color: '#2563eb' },
            },
          }}
          forceRedirectUrl="/"
        />
      </div>
    </div>
  );
}
