'use client';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function SignInPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') ?? '/';

  const [mode, setMode] = useState<'signin' | 'forgot'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resetSent, setResetSent] = useState(false);

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
