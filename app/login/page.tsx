'use client';
import { useState, useEffect, Suspense } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';

const GOOGLE_ICON = (
  <svg width="18" height="18" viewBox="0 0 24 24">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

const APPLE_ICON = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11"/>
  </svg>
);

function LoginInner() {
  const [mode, setMode] = useState('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState('');
  const [googleEnabled, setGoogleEnabled] = useState(false);
  const [appleEnabled, setAppleEnabled] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    fetch('/api/connectors/status')
      .then(r => r.json())
      .then(d => {
        setGoogleEnabled(d.providers?.google ?? false);
        setAppleEnabled(d.providers?.apple ?? false);
      })
      .catch(() => {});
    const err = searchParams.get('error');
    if (err) setError('Sign-in was cancelled or failed. Please try again.');
  }, [searchParams]);

  const handleCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading('credentials');
    setError('');
    if (mode === 'signup') {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setError(d.error || 'Registration failed. Try again.');
        setLoading('');
        return;
      }
    }
    const result = await signIn('credentials', { email, password, redirect: false });
    if (result?.error) {
      setError(mode === 'signup' ? 'Account created — sign in failed. Please try signing in.' : 'Incorrect email or password.');
      setLoading('');
    } else {
      router.push('/');
    }
  };

  const handleOAuth = async (provider: string) => {
    setLoading(provider);
    setError('');
    await signIn(provider, { callbackUrl: '/' });
  };

  const inp = { width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '12px 16px', color: '#f0f0f0', fontSize: '14px', outline: 'none', fontFamily: 'inherit' };

  return (
    <div style={{ minHeight: '100dvh', background: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, background: 'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(37,99,235,0.15) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ width: '100%', maxWidth: '400px', position: 'relative', zIndex: 1 }}>

        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 52, height: 52, borderRadius: '14px', background: '#111', border: '1px solid rgba(255,255,255,0.1)', marginBottom: '14px' }}>
            <span style={{ fontSize: '22px', fontWeight: '700', color: '#f0f0f0', fontFamily: 'Georgia, serif' }}>S</span>
          </div>
          <div style={{ fontSize: '22px', fontWeight: '700', color: '#f0f0f0', letterSpacing: '-0.5px' }}>Stu Legal</div>
          <div style={{ fontSize: '13px', color: '#555', marginTop: '4px' }}>AI-powered legal platform</div>
        </div>

        <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '20px', padding: '32px' }}>

          <div style={{ display: 'flex', background: 'rgba(255,255,255,0.04)', borderRadius: '10px', padding: '3px', marginBottom: '24px' }}>
            {['signin', 'signup'].map(m => (
              <button key={m} onClick={() => { setMode(m); setError(''); }} style={{ flex: 1, padding: '8px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: '500', background: mode === m ? 'rgba(255,255,255,0.1)' : 'transparent', color: mode === m ? '#f0f0f0' : '#666', transition: 'all 0.15s' }}>
                {m === 'signin' ? 'Sign in' : 'Create account'}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
            <button onClick={() => handleOAuth('google')} disabled={!googleEnabled || !!loading}
              title={!googleEnabled ? 'Add GOOGLE_CLIENT_ID + GOOGLE_CLIENT_SECRET to .env.local to enable' : ''}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', width: '100%', padding: '11px 16px', background: googleEnabled ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', fontSize: '13px', fontWeight: '500', color: googleEnabled ? '#f0f0f0' : '#444', cursor: googleEnabled && !loading ? 'pointer' : 'default', opacity: loading === 'google' ? 0.6 : 1 }}>
              {loading === 'google' ? <span style={{ width: 18, height: 18, border: '2px solid #4285F4', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} /> : GOOGLE_ICON}
              {googleEnabled ? 'Continue with Google' : 'Google (add credentials to enable)'}
            </button>
            <button onClick={() => handleOAuth('apple')} disabled={!appleEnabled || !!loading}
              title={!appleEnabled ? 'Add APPLE_ID + APPLE_SECRET to .env.local to enable' : ''}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', width: '100%', padding: '11px 16px', background: appleEnabled ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', fontSize: '13px', fontWeight: '500', color: appleEnabled ? '#f0f0f0' : '#444', cursor: appleEnabled && !loading ? 'pointer' : 'default', opacity: loading === 'apple' ? 0.6 : 1 }}>
              {loading === 'apple' ? <span style={{ width: 18, height: 18, border: '2px solid #f0f0f0', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} /> : APPLE_ICON}
              {appleEnabled ? 'Continue with Apple' : 'Apple (add credentials to enable)'}
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
            <span style={{ fontSize: '12px', color: '#444' }}>or continue with email</span>
            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
          </div>

          <form onSubmit={handleCredentials} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {error && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '8px', padding: '10px 14px', color: '#f87171', fontSize: '13px' }}>
                <AlertCircle size={14} style={{ flexShrink: 0 }} /> {error}
              </div>
            )}
            {mode === 'signup' && (
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#888', marginBottom: '7px' }}>Full name</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Stuart Scott" required style={inp} />
              </div>
            )}
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: '#888', marginBottom: '7px' }}>Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@firm.com" required style={inp} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: '#888', marginBottom: '7px' }}>Password</label>
              <div style={{ position: 'relative' }}>
                <input type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required style={{ ...inp, paddingRight: '44px' }} />
                <button type="button" onClick={() => setShowPass(s => !s)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#555', display: 'flex', padding: 0 }}>
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={!!loading} style={{ background: loading ? 'rgba(255,255,255,0.1)' : '#fff', color: loading ? '#666' : '#000', border: 'none', borderRadius: '10px', padding: '13px', fontSize: '14px', fontWeight: '600', cursor: loading ? 'default' : 'pointer', marginTop: '4px' }}>
              {loading === 'credentials' ? (mode === 'signup' ? 'Creating…' : 'Signing in…') : (mode === 'signup' ? 'Create account' : 'Sign in')}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', color: '#333', fontSize: '12px', marginTop: '20px' }}>
          Demo: <span style={{ color: '#555' }}>demo@firm.com</span> / <span style={{ color: '#555' }}>password123</span>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return <Suspense><LoginInner /></Suspense>;
}
