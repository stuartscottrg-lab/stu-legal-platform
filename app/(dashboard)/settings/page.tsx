'use client';
import { useState, useEffect } from 'react';
import { PERSONAS, getPersona, DEFAULT_PERSONA_ID, type Persona } from '@/lib/personas';
import { Check, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useTheme } from '@/components/ThemeProvider';

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
    <div style={{
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

  useEffect(() => {
    const saved = localStorage.getItem('stu_persona');
    if (saved) setPersona(getPersona(saved));
  }, []);

  const handlePersona = (p: Persona) => {
    setPersona(p);
    localStorage.setItem('stu_persona', p.id);
  };

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
          <SettingRow label="Email" value="stuart@firm.com" />
          <SettingRow label="Plan" value={<span style={{ color: '#16a34a', fontWeight: '600' }}>Internal · Personal</span>} />
          <SettingRow label="AI Model" value="Claude Sonnet 4.5" />
          <SettingRow label="Jurisdiction" value="England & Wales" />
          <SettingRow label="Storage" value="Railway · /data volume" last />
        </div>
      </section>

      {/* Integrations shortcut */}
      <section style={{ marginBottom: '28px' }}>
        <div style={{ fontSize: '11px', fontWeight: '600', color: 'var(--c-text-4)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '10px' }}>Integrations</div>
        <div style={{ background: 'var(--c-card)', border: '1px solid var(--c-border)', borderRadius: '12px', overflow: 'hidden' }}>
          <SettingRow label="Connected services" value="Manage email, calendar & document connectors" href="/connectors" />
        </div>
      </section>

      {/* Keyboard shortcuts */}
      <section style={{ marginBottom: '28px' }}>
        <div style={{ fontSize: '11px', fontWeight: '600', color: 'var(--c-text-4)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '10px' }}>Keyboard Shortcuts</div>
        <div style={{ background: 'var(--c-card)', border: '1px solid var(--c-border)', borderRadius: '12px', overflow: 'hidden' }}>
          {[
            ['New conversation', '⌘ K'],
            ['Send message', '↵ Enter'],
            ['New line', '⇧ Shift + Enter'],
            ['Toggle theme', '⌘ ⇧ D'],
          ].map(([action, shortcut], i, arr) => (
            <div key={action} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '11px 20px', borderBottom: i < arr.length - 1 ? '1px solid var(--c-border)' : 'none' }}>
              <span style={{ fontSize: '13px', color: 'var(--c-text-2)' }}>{action}</span>
              <code style={{ fontSize: '11px', color: 'var(--c-text-3)', background: 'var(--c-panel)', border: '1px solid var(--c-border)', borderRadius: '5px', padding: '2px 8px', fontFamily: 'monospace' }}>{shortcut}</code>
            </div>
          ))}
        </div>
      </section>

      {/* About */}
      <section>
        <div style={{ fontSize: '11px', fontWeight: '600', color: 'var(--c-text-4)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '10px' }}>About</div>
        <div style={{ background: 'var(--c-card)', border: '1px solid var(--c-border)', borderRadius: '12px', overflow: 'hidden' }}>
          <SettingRow label="Version" value="1.0.0-beta" />
          <SettingRow label="AI Provider" value="Anthropic" />
          <SettingRow label="Data residency" value="EU (Railway — AWS eu-west-1)" last />
        </div>
        <p style={{ fontSize: '11px', color: 'var(--c-text-4)', marginTop: '10px', lineHeight: '1.65' }}>
          Stu is an internal AI legal assistant. All conversations and documents remain private to your account. No data is used to train AI models.
        </p>
      </section>
    </div>
  );
}
