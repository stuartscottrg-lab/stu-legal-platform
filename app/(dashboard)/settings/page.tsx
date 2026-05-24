'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';
import { PERSONAS, getPersona, DEFAULT_PERSONA_ID, type Persona } from '@/lib/personas';
import { Check, ChevronRight, KeyRound, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import { useTheme } from '@/components/ThemeProvider';

function SetPasswordForm() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [show, setShow] = useState(false);
  const [status, setStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (newPassword.length < 8) { setError('Password must be at least 8 characters.'); return; }
    if (newPassword !== confirmPassword) { setError('Passwords do not match.'); return; }
    setStatus('saving');
    const supabase = createClient();
    const { error: err } = await supabase.auth.updateUser({ password: newPassword });
    if (err) { setError(err.message); setStatus('error'); return; }
    setStatus('success');
    setNewPassword('');
    setConfirmPassword('');
    setTimeout(() => { setStatus('idle'); setOpen(false); }, 2500);
  };

  return (
    <div style={{ borderTop: '1px solid var(--c-border)' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          width: '100%', padding: '13px 20px', fontSize: '13px',
          background: 'transparent', border: 'none', cursor: 'pointer',
          fontFamily: 'inherit', color: 'var(--c-text-2)', textAlign: 'left',
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <KeyRound size={13} style={{ opacity: 0.5 }} />
          Set password
        </span>
        <ChevronRight size={13} color="var(--c-text-4)" style={{ transform: open ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s' }} />
      </button>

      {open && (
        <form onSubmit={handleSubmit} style={{ padding: '0 20px 16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <p style={{ fontSize: '12px', color: 'var(--c-text-3)', marginBottom: '4px', lineHeight: '1.5' }}>
            Set a password so you can log in directly — useful for the desktop app.
          </p>
          <div style={{ position: 'relative' }}>
            <input
              type={show ? 'text' : 'password'}
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              placeholder="New password (min 8 characters)"
              required
              style={{
                width: '100%', padding: '9px 36px 9px 12px', borderRadius: '8px',
                background: 'var(--c-panel)', border: '1px solid var(--c-border)',
                color: 'var(--c-text)', fontSize: '13px', fontFamily: 'inherit',
                outline: 'none', boxSizing: 'border-box',
              }}
            />
            <button type="button" onClick={() => setShow(s => !s)} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--c-text-3)', padding: 0, display: 'flex' }}>
              {show ? <EyeOff size={13} /> : <Eye size={13} />}
            </button>
          </div>
          <input
            type={show ? 'text' : 'password'}
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            placeholder="Confirm password"
            required
            style={{
              width: '100%', padding: '9px 12px', borderRadius: '8px',
              background: 'var(--c-panel)', border: '1px solid var(--c-border)',
              color: 'var(--c-text)', fontSize: '13px', fontFamily: 'inherit',
              outline: 'none', boxSizing: 'border-box',
            }}
          />
          {error && <p style={{ fontSize: '12px', color: '#dc2626', margin: 0 }}>{error}</p>}
          {status === 'success' && <p style={{ fontSize: '12px', color: '#16a34a', margin: 0 }}>Password set — you can now log in with it.</p>}
          <button
            type="submit"
            disabled={status === 'saving'}
            style={{
              padding: '9px 16px', borderRadius: '8px', border: 'none',
              background: 'var(--c-accent-bg)', color: 'var(--c-accent-text)',
              fontSize: '13px', fontWeight: '600', cursor: status === 'saving' ? 'default' : 'pointer',
              opacity: status === 'saving' ? 0.7 : 1, fontFamily: 'inherit',
            }}
          >
            {status === 'saving' ? 'Saving…' : 'Set password'}
          </button>
        </form>
      )}
    </div>
  );
}

const modeLabels: Record<string, { label: string; description: string }> = {
  alpha: { label: 'Simple', description: 'Plain English, empathetic, explains everything clearly' },
  sigma: { label: 'Strategic', description: 'Concise, commercial, leads with the answer' },
  omega: { label: 'Creative', description: 'Lateral thinking, bold arguments, finds the overlooked angle' },
};

function SettingRow({ label, value, href, onClick, last }: {
  label: string;
  value?: React.ReactNode;
  href?: string;
  onClick?: () => void;
  last?: boolean;
}) {
  const content = (
    <div
      style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '13px 20px', fontSize: '13px',
        borderBottom: last ? 'none' : '1px solid var(--c-border)',
        cursor: href || onClick ? 'pointer' : 'default',
        transition: 'background 0.1s',
      }}
      onMouseOver={e => { if (href || onClick) (e.currentTarget as HTMLDivElement).style.background = 'var(--c-panel)'; }}
      onMouseOut={e => { (e.currentTarget as HTMLDivElement).style.background = 'transparent'; }}
      onClick={onClick}
    >
      <span style={{ color: 'var(--c-text-2)' }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ color: 'var(--c-text)', textAlign: 'right' }}>{value}</span>
        {(href || onClick) && <ChevronRight size={13} color="var(--c-text-4)" />}
      </div>
    </div>
  );
  if (href) return <Link href={href} style={{ textDecoration: 'none', display: 'block' }}>{content}</Link>;
  return content;
}

export default function SettingsPage() {
  const [persona, setPersona] = useState<Persona>(getPersona(DEFAULT_PERSONA_ID));
  const { theme, toggle } = useTheme();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('stu_persona');
    if (saved) setPersona(getPersona(saved));
    // Fetch Supabase user
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, []);

  const handlePersona = (p: Persona) => {
    setPersona(p);
    localStorage.setItem('stu_persona', p.id);
  };

  const email = user?.email ?? '—';
  const name = user?.user_metadata?.full_name ?? user?.user_metadata?.name ?? null;

  return (
    <div style={{ padding: '32px 40px 80px', maxWidth: '600px' }}>
      <h1 style={{ fontSize: '20px', fontWeight: '600', color: 'var(--c-text)', marginBottom: '32px', letterSpacing: '-0.3px' }}>Settings</h1>

      {/* Response Mode */}
      <section style={{ marginBottom: '28px' }}>
        <div style={{ fontSize: '11px', fontWeight: '600', color: 'var(--c-text-4)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '10px' }}>Response Mode</div>
        <div style={{ background: 'var(--c-card)', border: '1px solid var(--c-border)', borderRadius: '12px', overflow: 'hidden' }}>
          {PERSONAS.map((p, i) => {
            const mode = modeLabels[p.id];
            const active = p.id === persona.id;
            return (
              <button
                key={p.id}
                onClick={() => handlePersona(p)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '14px', width: '100%',
                  textAlign: 'left', padding: '14px 18px',
                  border: 'none',
                  borderBottom: i < PERSONAS.length - 1 ? '1px solid var(--c-border)' : 'none',
                  background: active ? `${p.color}06` : 'transparent',
                  cursor: 'pointer', transition: 'background 0.1s', fontFamily: 'inherit',
                }}
              >
                <div style={{
                  width: 36, height: 36, borderRadius: '50%',
                  background: active ? p.color : 'var(--c-panel)',
                  color: active ? '#fff' : 'var(--c-text-3)',
                  fontSize: '13px', fontWeight: '700', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: `1px solid ${active ? p.color : 'var(--c-border)'}`,
                  transition: 'all 0.15s',
                }}>{p.initials}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                    <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--c-text)' }}>{mode?.label ?? p.name}</span>
                    <span style={{ fontSize: '11px', color: 'var(--c-text-4)', fontWeight: '400' }}>{p.title}</span>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--c-text-3)' }}>{mode?.description ?? p.style}</div>
                </div>
                {active && <Check size={15} color={p.color} style={{ flexShrink: 0 }} />}
              </button>
            );
          })}
        </div>
        <p style={{ fontSize: '11px', color: 'var(--c-text-4)', marginTop: '8px' }}>
          You can also switch mode mid-conversation from the input bar.
        </p>
      </section>

      {/* Appearance */}
      <section style={{ marginBottom: '28px' }}>
        <div style={{ fontSize: '11px', fontWeight: '600', color: 'var(--c-text-4)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '10px' }}>Appearance</div>
        <div style={{ background: 'var(--c-card)', border: '1px solid var(--c-border)', borderRadius: '12px', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '13px 20px' }}>
            <span style={{ fontSize: '13px', color: 'var(--c-text-2)' }}>Theme</span>
            <button
              onClick={toggle}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '6px 14px', borderRadius: '20px', fontSize: '12px',
                fontWeight: '500', color: 'var(--c-text)',
                background: 'var(--c-panel)', border: '1px solid var(--c-border)',
                cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
              }}
            >
              {theme === 'dark' ? (
                <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg> Light</>
              ) : (
                <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg> Dark</>
              )}
            </button>
          </div>
        </div>
      </section>

      {/* Account */}
      <section style={{ marginBottom: '28px' }}>
        <div style={{ fontSize: '11px', fontWeight: '600', color: 'var(--c-text-4)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '10px' }}>Account</div>
        <div style={{ background: 'var(--c-card)', border: '1px solid var(--c-border)', borderRadius: '12px', overflow: 'hidden' }}>
          {name && <SettingRow label="Name" value={name} />}
          <SettingRow label="Email" value={
            <span style={{ fontFamily: 'monospace', fontSize: '12px', letterSpacing: '-0.2px' }}>{email}</span>
          } />
          <SetPasswordForm />
        </div>
      </section>

      {/* Plan */}
      <section style={{ marginBottom: '28px' }}>
        <div style={{ fontSize: '11px', fontWeight: '600', color: 'var(--c-text-4)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '10px' }}>Plan</div>
        <div style={{ background: 'var(--c-card)', border: '1px solid var(--c-border)', borderRadius: '12px', overflow: 'hidden' }}>
          <SettingRow label="Access" value={<span style={{ color: '#16a34a', fontWeight: '600' }}>Early access — invitation only</span>} last />
        </div>
      </section>

      {/* Integrations */}
      <section style={{ marginBottom: '28px' }}>
        <div style={{ fontSize: '11px', fontWeight: '600', color: 'var(--c-text-4)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '10px' }}>Integrations</div>
        <div style={{ background: 'var(--c-card)', border: '1px solid var(--c-border)', borderRadius: '12px', overflow: 'hidden' }}>
          <SettingRow label="Connected services" value="Email, calendar & documents" href="/connectors" last />
        </div>
      </section>

      {/* About */}
      <section>
        <div style={{ fontSize: '11px', fontWeight: '600', color: 'var(--c-text-4)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '10px' }}>About</div>
        <div style={{ background: 'var(--c-card)', border: '1px solid var(--c-border)', borderRadius: '12px', overflow: 'hidden' }}>
          <SettingRow label="Version" value="1.0.0-beta" last />
        </div>
        <p style={{ fontSize: '11px', color: 'var(--c-text-4)', marginTop: '10px', lineHeight: '1.65' }}>
          All conversations and documents are private to your account. Your data is never used to train AI models.
        </p>
      </section>
    </div>
  );
}
