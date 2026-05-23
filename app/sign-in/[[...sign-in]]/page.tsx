'use client';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function SignInPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') ?? '/';

  const [mode, setMode] = useState<'signin' | 'magic'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [magicSent, setMagicSent] = useState(false);

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
      setError(error.message);
      setLoading(false);
    } else {
      router.replace(redirect);
    }
  };

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback?redirect=${redirect}` },
    });
    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setMagicSent(true);
      setLoading(false);
    }
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
      {/* Subtle background glow */}
      <div style={{ position: 'fixed', inset: 0, background: 'radial-gradient(ellipse 70% 40% at 50% -10%, rgba(37,99,235,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />

      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: '380px' }}>
        {/* Wordmark */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{ fontSize: '28px', fontWeight: '700', color: '#f0f0f0', fontFamily: 'Georgia, serif', letterSpacing: '-0.5px', marginBottom: '6px' }}>Stu</div>
          <div style={{ fontSize: '13px', color: '#555' }}>AI-powered legal platform</div>
        </div>

        {/* Card */}
        <div style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '16px',
          padding: '28px',
        }}>
          {magicSent ? (
            <div style={{ textAlign: 'center', padding: '12px 0' }}>
              <div style={{ fontSize: '28px', marginBottom: '16px' }}>✉️</div>
              <div style={{ fontSize: '15px', fontWeight: '600', color: '#f0f0f0', marginBottom: '8px' }}>Check your email</div>
              <div style={{ fontSize: '13px', color: '#777', lineHeight: '1.6' }}>
                We sent a sign-in link to <strong style={{ color: '#aaa' }}>{email}</strong>. Click it to access your account — no password needed.
              </div>
              <button
                onClick={() => { setMagicSent(false); setMode('signin'); }}
                style={{ marginTop: '20px', background: 'none', border: 'none', color: '#555', fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit' }}
              >
                Back to sign in
              </button>
            </div>
          ) : (
            <>
              {/* Mode tabs */}
              <div style={{ display: 'flex', background: 'rgba(255,255,255,0.04)', borderRadius: '8px', padding: '3px', marginBottom: '20px' }}>
                {([['signin', 'Password'], ['magic', 'Magic link']] as const).map(([m, label]) => (
                  <button
                    key={m}
                    onClick={() => { setMode(m); setError(''); }}
                    style={{
                      flex: 1, padding: '6px', borderRadius: '6px', border: 'none',
                      background: mode === m ? 'rgba(255,255,255,0.08)' : 'transparent',
                      color: mode === m ? '#e0e0e0' : '#555',
                      fontSize: '12px', fontWeight: mode === m ? '500' : '400',
                      cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.12s',
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* Form */}
              <form onSubmit={mode === 'signin' ? handleSignIn : handleMagicLink} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '6px' }}>Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    autoFocus
                    placeholder="you@firm.com"
                    style={{
                      width: '100%', padding: '10px 12px', borderRadius: '9px',
                      background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                      color: '#f0f0f0', fontSize: '13.5px', outline: 'none',
                      fontFamily: 'inherit', boxSizing: 'border-box',
                      transition: 'border-color 0.15s',
                    }}
                    onFocus={e => (e.target.style.borderColor = 'rgba(255,255,255,0.25)')}
                    onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')}
                  />
                </div>

                {mode === 'signin' && (
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '6px' }}>Password</label>
                    <input
                      type="password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      required
                      placeholder="••••••••"
                      style={{
                        width: '100%', padding: '10px 12px', borderRadius: '9px',
                        background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                        color: '#f0f0f0', fontSize: '13.5px', outline: 'none',
                        fontFamily: 'inherit', boxSizing: 'border-box',
                        transition: 'border-color 0.15s',
                      }}
                      onFocus={e => (e.target.style.borderColor = 'rgba(255,255,255,0.25)')}
                      onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')}
                    />
                    <button
                      type="button"
                      onClick={() => setMode('magic')}
                      style={{ marginTop: '6px', background: 'none', border: 'none', color: '#444', fontSize: '11px', cursor: 'pointer', fontFamily: 'inherit', padding: 0 }}
                    >
                      Forgot password? Use a magic link instead.
                    </button>
                  </div>
                )}

                {error && (
                  <div style={{ padding: '10px 12px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '8px', fontSize: '12.5px', color: '#f87171' }}>
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    width: '100%', padding: '11px', borderRadius: '10px',
                    background: loading ? 'rgba(255,255,255,0.08)' : '#fff',
                    color: loading ? '#555' : '#000',
                    border: 'none', fontSize: '13.5px', fontWeight: '600',
                    cursor: loading ? 'default' : 'pointer',
                    fontFamily: 'inherit', transition: 'all 0.15s',
                    marginTop: '4px',
                  }}
                >
                  {loading ? 'Signing in…' : mode === 'magic' ? 'Send magic link' : 'Sign in'}
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
