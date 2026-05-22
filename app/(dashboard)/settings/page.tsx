'use client';
import { useState, useEffect } from 'react';
import { PERSONAS, getPersona, DEFAULT_PERSONA_ID, type Persona } from '@/lib/personas';
import { Check } from 'lucide-react';

export default function SettingsPage() {
  const [persona, setPersona] = useState<Persona>(getPersona(DEFAULT_PERSONA_ID));

  useEffect(() => {
    const saved = localStorage.getItem('stu_persona');
    if (saved) setPersona(getPersona(saved));
  }, []);

  const handlePersona = (p: Persona) => {
    setPersona(p);
    localStorage.setItem('stu_persona', p.id);
  };

  return (
    <div style={{ padding: '32px 40px 60px', maxWidth: '640px' }}>
      <h1 style={{ fontSize: '20px', fontWeight: '600', color: 'var(--c-text)', marginBottom: '28px' }}>Settings</h1>

      {/* AI Persona */}
      <section style={{ marginBottom: '28px' }}>
        <div style={{ fontSize: '11px', fontWeight: '600', color: 'var(--c-text-4)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '12px' }}>AI Persona</div>
        <div style={{ background: 'var(--c-card)', border: '1px solid var(--c-border)', borderRadius: '16px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <p style={{ fontSize: '12px', color: 'var(--c-text-3)', marginBottom: '4px', lineHeight: '1.6' }}>
            Choose the lawyer personality the AI adopts in every conversation. You can also switch persona mid-conversation from the assistant page.
          </p>
          {PERSONAS.map(p => (
            <button
              key={p.id}
              onClick={() => handlePersona(p)}
              style={{
                display: 'flex', alignItems: 'center', gap: '14px', width: '100%',
                textAlign: 'left', padding: '14px 16px', borderRadius: '12px',
                border: p.id === persona.id ? `1.5px solid ${p.color}` : '1px solid var(--c-border)',
                background: p.id === persona.id ? p.bgColor : 'var(--c-panel)',
                cursor: 'pointer', transition: 'all 0.15s',
              }}
            >
              <div style={{
                width: 42, height: 42, borderRadius: '50%',
                background: p.color, color: '#fff',
                fontSize: '15px', fontWeight: '700', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: p.id === persona.id ? `0 4px 12px ${p.color}44` : 'none',
                transition: 'box-shadow 0.2s',
              }}>{p.initials}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                  <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--c-text)' }}>{p.name}</span>
                  <span style={{ fontSize: '11px', color: p.color, fontWeight: '500' }}>{p.title}</span>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--c-text-3)' }}>{p.style}</div>
                {p.id === persona.id && (
                  <div style={{ fontSize: '11px', color: p.color, marginTop: '4px', fontWeight: '500' }}>Currently active</div>
                )}
              </div>
              {p.id === persona.id && (
                <Check size={16} color={p.color} style={{ flexShrink: 0 }} />
              )}
            </button>
          ))}
        </div>
      </section>

      {/* Account */}
      <section style={{ marginBottom: '28px' }}>
        <div style={{ fontSize: '11px', fontWeight: '600', color: 'var(--c-text-4)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '12px' }}>Account</div>
        <div style={{ background: 'var(--c-card)', border: '1px solid var(--c-border)', borderRadius: '16px', overflow: 'hidden' }}>
          {[
            ['Email', 'stuart@firm.com'],
            ['Plan', 'Internal (Personal)'],
            ['AI Model', 'Claude Sonnet 4.5'],
            ['Storage', 'Railway — /data volume'],
            ['Jurisdiction', 'England & Wales'],
          ].map(([k, v], i, arr) => (
            <div key={k} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '14px 20px', fontSize: '13px',
              borderBottom: i < arr.length - 1 ? '1px solid var(--c-border)' : 'none',
            }}>
              <span style={{ color: 'var(--c-text-2)' }}>{k}</span>
              <span style={{ color: k === 'Plan' ? '#16a34a' : 'var(--c-text)', fontWeight: k === 'Plan' ? '600' : '400' }}>{v}</span>
            </div>
          ))}
        </div>
      </section>

      {/* OAuth setup guide */}
      <section>
        <div style={{ fontSize: '11px', fontWeight: '600', color: 'var(--c-text-4)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '12px' }}>OAuth Setup (for Google &amp; Apple sign-in)</div>
        <div style={{ background: 'var(--c-card)', border: '1px solid var(--c-border)', borderRadius: '16px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--c-text)', marginBottom: '6px' }}>Google</div>
            <ol style={{ paddingLeft: '16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {[
                'Go to console.cloud.google.com → Create project → Enable Gmail API + Calendar API',
                'APIs & Services → Credentials → Create OAuth 2.0 Client ID (Web application)',
                'Add authorised redirect URI: https://yourdomain.com/api/auth/callback/google',
                'Copy Client ID + Secret into .env.local as GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET',
              ].map((step, i) => (
                <li key={i} style={{ fontSize: '12px', color: 'var(--c-text-2)', lineHeight: '1.6' }}>{step}</li>
              ))}
            </ol>
          </div>
          <div style={{ height: 1, background: 'var(--c-border)' }} />
          <div>
            <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--c-text)', marginBottom: '6px' }}>Apple</div>
            <ol style={{ paddingLeft: '16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {[
                'Go to developer.apple.com → Certificates, IDs & Profiles → Identifiers → Register App ID with Sign In with Apple',
                'Create a Service ID (this becomes APPLE_ID) and configure the domain + redirect URL',
                'Create a private key with Sign In with Apple capability — download the .p8 file',
                'Add APPLE_ID, APPLE_TEAM_ID, APPLE_KEY_ID, and APPLE_SECRET (p8 key content) to .env.local',
              ].map((step, i) => (
                <li key={i} style={{ fontSize: '12px', color: 'var(--c-text-2)', lineHeight: '1.6' }}>{step}</li>
              ))}
            </ol>
          </div>
          <div style={{ padding: '10px 12px', background: 'rgba(37,99,235,0.05)', border: '1px solid rgba(37,99,235,0.15)', borderRadius: '8px', fontSize: '11px', color: '#2563eb', lineHeight: '1.6' }}>
            Both providers are optional — the platform falls back to email/password if keys are not set.
          </div>
        </div>
      </section>
    </div>
  );
}
