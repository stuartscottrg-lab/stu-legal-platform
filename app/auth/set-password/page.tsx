'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function SetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    if (password !== confirm) { setError('Passwords do not match.'); return; }

    setLoading(true);
    const supabase = createClient();
    const { error: err } = await supabase.auth.updateUser({ password });
    if (err) {
      setError(err.message);
      setLoading(false);
    } else {
      router.replace('/');
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
    <div style={{ minHeight: '100dvh', background: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ position: 'fixed', inset: 0, background: 'radial-gradient(ellipse 70% 40% at 50% -10%, rgba(37,99,235,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />

      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: '380px' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{ fontSize: '28px', fontWeight: '700', color: '#f0f0f0', fontFamily: 'Georgia, serif', letterSpacing: '-0.5px', marginBottom: '6px' }}>Stu</div>
          <div style={{ fontSize: '13px', color: '#555' }}>AI-powered legal platform</div>
        </div>

        <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '28px' }}>
          <div style={{ marginBottom: '20px' }}>
            <div style={{ fontSize: '15px', fontWeight: '600', color: '#e0e0e0', marginBottom: '4px' }}>Set your password</div>
            <div style={{ fontSize: '12px', color: '#555', lineHeight: '1.55' }}>
              Choose a password to access Stu. You'll use this to sign in from now on.
            </div>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '6px' }}>Password</label>
              <input
                type="password" value={password} onChange={e => setPassword(e.target.value)}
                required autoFocus placeholder="Min 8 characters" style={inputStyle}
                onFocus={e => (e.target.style.borderColor = 'rgba(255,255,255,0.25)')}
                onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '6px' }}>Confirm password</label>
              <input
                type="password" value={confirm} onChange={e => setConfirm(e.target.value)}
                required placeholder="••••••••" style={inputStyle}
                onFocus={e => (e.target.style.borderColor = 'rgba(255,255,255,0.25)')}
                onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')}
              />
            </div>

            {error && (
              <div style={{ padding: '10px 12px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '8px', fontSize: '12.5px', color: '#f87171' }}>
                {error}
              </div>
            )}

            <button
              type="submit" disabled={loading}
              style={{ width: '100%', padding: '11px', borderRadius: '10px', background: loading ? 'rgba(255,255,255,0.08)' : '#fff', color: loading ? '#555' : '#000', border: 'none', fontSize: '13.5px', fontWeight: '600', cursor: loading ? 'default' : 'pointer', fontFamily: 'inherit', transition: 'all 0.15s', marginTop: '4px' }}
            >
              {loading ? 'Saving…' : 'Set password & continue'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
