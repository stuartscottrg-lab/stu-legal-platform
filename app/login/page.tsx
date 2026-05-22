'use client';
import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('demo@firm.com');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const result = await signIn('credentials', { email, password, redirect: false });
    if (result?.error) { setError('Invalid email or password'); setLoading(false); }
    else router.push('/');
  };

  const inp: React.CSSProperties = { width: '100%', background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '8px', padding: '12px 16px', color: '#f0f0f0', fontSize: '14px', outline: 'none', fontFamily: 'inherit' };

  return (
    <div style={{ minHeight: '100vh', background: '#0f0f0f', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: '380px', padding: '0 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <h1 style={{ fontSize: '26px', fontWeight: '700', color: '#f0f0f0', letterSpacing: '-0.5px' }}>Stu</h1>
          <p style={{ color: '#555', marginTop: '6px', fontSize: '13px' }}>AI-powered legal platform</p>
        </div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {error && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', padding: '10px 14px', color: '#ef4444', fontSize: '13px' }}>{error}</div>}
          <div>
            <label style={{ display: 'block', fontSize: '12px', color: '#888', marginBottom: '8px' }}>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required style={inp} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '12px', color: '#888', marginBottom: '8px' }}>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required style={inp} />
          </div>
          <button type="submit" disabled={loading} style={{ background: '#fff', color: '#000', border: 'none', borderRadius: '8px', padding: '13px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', marginTop: '8px', opacity: loading ? 0.7 : 1 }}>
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
        <p style={{ textAlign: 'center', color: '#444', fontSize: '12px', marginTop: '32px' }}>demo@firm.com · password123</p>
      </div>
    </div>
  );
}
