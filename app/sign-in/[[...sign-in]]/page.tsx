'use client';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M17.64 9.20455C17.64 8.56636 17.5827 7.95273 17.4764 7.36364H9V10.845H13.8436C13.635 11.97 13.0009 12.9232 12.0477 13.5614V15.8195H14.9564C16.6582 14.2527 17.64 11.9455 17.64 9.20455Z" fill="#4285F4"/>
    <path d="M9 18C11.43 18 13.4673 17.1941 14.9564 15.8195L12.0477 13.5614C11.2418 14.1014 10.2109 14.4204 9 14.4204C6.65591 14.4204 4.67182 12.8373 3.96409 10.71H0.957275V13.0418C2.43818 15.9832 5.48182 18 9 18Z" fill="#34A853"/>
    <path d="M3.96409 10.71C3.78409 10.17 3.68182 9.59318 3.68182 9C3.68182 8.40682 3.78409 7.83 3.96409 7.29V4.95818H0.957275C0.347727 6.17318 0 7.54773 0 9C0 10.4523 0.347727 11.8268 0.957275 13.0418L3.96409 10.71Z" fill="#FBBC05"/>
    <path d="M9 3.57955C10.3214 3.57955 11.5077 4.03364 12.4405 4.92545L15.0218 2.34409C13.4632 0.891818 11.4259 0 9 0C5.48182 0 2.43818 2.01682 0.957275 4.95818L3.96409 7.29C4.67182 5.16273 6.65591 3.57955 9 3.57955Z" fill="#EA4335"/>
  </svg>
);

export default function SignInPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') ?? '/assistant';

  const [mode, setMode] = useState<'signin' | 'forgot'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resetSent, setResetSent] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // If already signed in, go straight to dashboard
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) router.replace(redirect);
    });
  }, [redirect, router]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(
        error.message.includes('Invalid login')
          ? 'Incorrect email or password.'
          : error.message
      );
      setLoading(false);
    } else {
      router.replace(redirect);
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setError('');
    const supabase = createClient();
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirect)}`,
        skipBrowserRedirect: true,
      },
    });
    if (error) {
      setError(error.message);
      setGoogleLoading(false);
      return;
    }
    if (data?.url) {
      // Detect Electron via user agent
      const isElectron = typeof navigator !== 'undefined' &&
        navigator.userAgent.toLowerCase().includes('electron');

      if (isElectron) {
        // In Electron: open in system browser, then poll for session
        // @ts-ignore — window.open with _blank opens in system browser via setWindowOpenHandler
        window.open(data.url, '_blank');
        // Poll every 2s for up to 3 minutes waiting for the user to complete auth
        let attempts = 0;
        const poll = setInterval(async () => {
          attempts++;
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            clearInterval(poll);
            window.location.href = redirect;
          } else if (attempts > 90) {
            clearInterval(poll);
            setError('Sign-in timed out. Please try again.');
            setGoogleLoading(false);
          }
        }, 2000);
      } else {
        // In browser: navigate directly
        window.location.href = data.url;
      }
    } else {
      setError('Could not generate sign-in URL. Please try again.');
      setGoogleLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/set-password`,
    });
    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setResetSent(true);
      setLoading(false);
    }
  };

  const inputStyle = {
    width: '100%', padding: '10px 12px', borderRadius: '9px',
    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
    color: '#f0f0f0', fontSize: '13.5px', outline: 'none',
    fontFamily: 'inherit', boxSizing: 'border-box' as const,
    transition: 'border-color 0.15s',
  };

  return (
    <div style={{
      minHeight: '100dvh',
      background: '#0a0a0a',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
    }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div style={{ position: 'fixed', inset: 0, background: 'radial-gradient(ellipse 70% 40% at 50% -10%, rgba(37,99,235,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />

      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: '380px' }}>
        {/* Wordmark */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{ fontSize: '28px', fontWeight: '700', color: '#f0f0f0', fontFamily: 'Georgia, serif', letterSpacing: '-0.5px', marginBottom: '6px' }}>Stu</div>
          <div style={{ fontSize: '13px', color: '#555' }}>AI-powered legal platform</div>
        </div>

        {/* Card */}
        <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '28px' }}>

          {/* ── Reset sent confirmation ── */}
          {resetSent ? (
            <div style={{ textAlign: 'center', padding: '8px 0' }}>
              <div style={{ fontSize: '32px', marginBottom: '16px' }}>📬</div>
              <div style={{ fontSize: '15px', fontWeight: '600', color: '#f0f0f0', marginBottom: '8px' }}>Check your inbox</div>
              <div style={{ fontSize: '13px', color: '#666', lineHeight: '1.65' }}>
                We've sent a password reset link to <strong style={{ color: '#999' }}>{email}</strong>.
                Click it to set a new password.
              </div>
              <button
                onClick={() => { setResetSent(false); setMode('signin'); }}
                style={{ marginTop: '20px', background: 'none', border: 'none', color: '#555', fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit' }}
              >
                Back to sign in
              </button>
            </div>

          ) : mode === 'forgot' ? (
            /* ── Forgot password ── */
            <>
              <div style={{ marginBottom: '20px' }}>
                <div style={{ fontSize: '15px', fontWeight: '600', color: '#e0e0e0', marginBottom: '4px' }}>Reset your password</div>
                <div style={{ fontSize: '12px', color: '#555' }}>We'll send a reset link to your email.</div>
              </div>
              <form onSubmit={handleForgotPassword} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '6px' }}>Email</label>
                  <input
                    type="email" value={email} onChange={e => setEmail(e.target.value)}
                    required autoFocus placeholder="you@firm.com" style={inputStyle}
                    onFocus={e => (e.target.style.borderColor = 'rgba(255,255,255,0.25)')}
                    onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')}
                  />
                </div>
                {error && <div style={{ padding: '10px 12px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '8px', fontSize: '12.5px', color: '#f87171' }}>{error}</div>}
                <button
                  type="submit" disabled={loading}
                  style={{ width: '100%', padding: '11px', borderRadius: '10px', background: loading ? 'rgba(255,255,255,0.08)' : '#fff', color: loading ? '#555' : '#000', border: 'none', fontSize: '13.5px', fontWeight: '600', cursor: loading ? 'default' : 'pointer', fontFamily: 'inherit', transition: 'all 0.15s', marginTop: '4px' }}
                >
                  {loading ? 'Sending…' : 'Send reset link'}
                </button>
                <button
                  type="button" onClick={() => { setMode('signin'); setError(''); }}
                  style={{ background: 'none', border: 'none', color: '#444', fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit', padding: 0 }}
                >
                  ← Back to sign in
                </button>
              </form>
            </>

          ) : (
            /* ── Sign in ── */
            <>
              <div style={{ marginBottom: '20px' }}>
                <div style={{ fontSize: '15px', fontWeight: '600', color: '#e0e0e0', marginBottom: '4px' }}>Sign in to your account</div>
                <div style={{ fontSize: '12px', color: '#555' }}>Access is by invitation only.</div>
              </div>

              {/* Google OAuth button */}
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={googleLoading}
                style={{
                  width: '100%', padding: '11px 16px', borderRadius: '10px',
                  background: googleLoading ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: googleLoading ? '#444' : '#d0d0d0',
                  fontSize: '13.5px', fontWeight: '500', cursor: googleLoading ? 'default' : 'pointer',
                  fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  gap: '10px', transition: 'all 0.15s', marginBottom: '16px',
                }}
                onMouseEnter={e => { if (!googleLoading) (e.currentTarget.style.background = 'rgba(255,255,255,0.1)'); }}
                onMouseLeave={e => { if (!googleLoading) (e.currentTarget.style.background = 'rgba(255,255,255,0.06)'); }}
              >
                {googleLoading ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ width: '16px', height: '16px', border: '2px solid #333', borderTopColor: '#666', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />
                    Connecting…
                  </span>
                ) : (
                  <>
                    <GoogleIcon />
                    Continue with Google
                  </>
                )}
              </button>

              {/* Divider */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.07)' }} />
                <span style={{ fontSize: '11px', color: '#3a3a3a' }}>or</span>
                <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.07)' }} />
              </div>

              <form onSubmit={handleSignIn} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '6px' }}>Email</label>
                  <input
                    type="email" value={email} onChange={e => setEmail(e.target.value)}
                    required autoFocus placeholder="you@firm.com" style={inputStyle}
                    onFocus={e => (e.target.style.borderColor = 'rgba(255,255,255,0.25)')}
                    onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '6px' }}>Password</label>
                  <input
                    type="password" value={password} onChange={e => setPassword(e.target.value)}
                    required placeholder="••••••••" style={inputStyle}
                    onFocus={e => (e.target.style.borderColor = 'rgba(255,255,255,0.25)')}
                    onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')}
                  />
                  <button
                    type="button" onClick={() => { setMode('forgot'); setError(''); }}
                    style={{ marginTop: '6px', background: 'none', border: 'none', color: '#444', fontSize: '11px', cursor: 'pointer', fontFamily: 'inherit', padding: 0 }}
                  >
                    Forgot password?
                  </button>
                </div>
                {error && <div style={{ padding: '10px 12px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '8px', fontSize: '12.5px', color: '#f87171' }}>{error}</div>}
                <button
                  type="submit" disabled={loading}
                  style={{ width: '100%', padding: '11px', borderRadius: '10px', background: loading ? 'rgba(255,255,255,0.08)' : '#fff', color: loading ? '#555' : '#000', border: 'none', fontSize: '13.5px', fontWeight: '600', cursor: loading ? 'default' : 'pointer', fontFamily: 'inherit', transition: 'all 0.15s', marginTop: '4px' }}
                >
                  {loading ? 'Signing in…' : 'Sign in'}
                </button>
              </form>
            </>
          )}
        </div>

        <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '12px', color: '#333', lineHeight: '1.6' }}>
          By signing in you agree to our{' '}
          <a href="/terms" style={{ color: '#444', textDecoration: 'underline' }}>Terms</a>
          {' '}and{' '}
          <a href="/privacy" style={{ color: '#444', textDecoration: 'underline' }}>Privacy Policy</a>.
        </p>
      </div>
    </div>
  );
}
