'use client';
import { useState } from 'react';
import { useConnectors, ConnectorState } from '@/lib/hooks/useConnectors';
import { Check, Mail, AlertCircle, ExternalLink, Unplug, Plug } from 'lucide-react';
import Link from 'next/link';

interface ConnectorCard {
  id: ConnectorState['id'];
  label: string;
  description: string;
  color: string;
  icon: React.ReactNode;
  authHint: string;
}

const CONNECTORS: ConnectorCard[] = [
  {
    id: 'gmail',
    label: 'Gmail',
    description: 'Connect your Google Workspace or personal Gmail account to automatically surface email threads in timekeeping and give Stu context from your inbox.',
    color: '#EA4335',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path d="M20 4H4C2.9 4 2 4.9 2 6v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2z" fill="#EA4335" opacity="0.15"/>
        <path d="M20 4l-8 8-8-8" stroke="#EA4335" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M2 6l8 7a3 3 0 004 0l8-7" stroke="#EA4335" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
    authHint: 'Enter your Google Workspace or Gmail address',
  },
  {
    id: 'outlook',
    label: 'Outlook / Microsoft 365',
    description: 'Connect your Microsoft 365 or Outlook account to pull in email threads, surface client conversations in timekeeping, and let Stu reference your recent correspondence.',
    color: '#0078D4',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <rect x="2" y="4" width="20" height="16" rx="2" fill="#0078D4" opacity="0.12"/>
        <path d="M2 8h20M2 12h20M2 16h20" stroke="#0078D4" strokeWidth="1.2" opacity="0.4"/>
        <path d="M12 4v16" stroke="#0078D4" strokeWidth="1.2"/>
        <rect x="2" y="4" width="20" height="16" rx="2" stroke="#0078D4" strokeWidth="1.5"/>
      </svg>
    ),
    authHint: 'Enter your Microsoft 365 or Outlook.com address',
  },
];

function ConnectorCard({ card }: { card: ConnectorCard }) {
  const { connectors, connect, disconnect } = useConnectors();
  const state = connectors.find(c => c.id === card.id);
  const connected = state?.connected ?? false;
  const [showForm, setShowForm] = useState(false);
  const [email, setEmail] = useState('');
  const [connecting, setConnecting] = useState(false);
  const [err, setErr] = useState('');

  async function handleConnect() {
    if (!email.trim() || !email.includes('@')) { setErr('Enter a valid email address'); return; }
    setConnecting(true);
    setErr('');
    // Simulate OAuth handshake delay
    await new Promise(r => setTimeout(r, 1400));
    connect(card.id, email.trim().toLowerCase());
    setConnecting(false);
    setShowForm(false);
    setEmail('');
  }

  return (
    <div style={{ background: 'var(--c-card)', border: '1px solid var(--c-border)', borderRadius: '14px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: `${card.color}12`, border: `1px solid ${card.color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {card.icon}
          </div>
          <div>
            <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--c-text)', marginBottom: '2px' }}>{card.label}</div>
            {connected && state?.account && (
              <div style={{ fontSize: '12px', color: 'var(--c-text-2)' }}>Connected as {state.account}</div>
            )}
            {!connected && (
              <div style={{ fontSize: '12px', color: 'var(--c-text-3)' }}>Not connected</div>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {connected && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: '500', color: '#16a34a', background: 'rgba(22,163,74,0.08)', border: '1px solid rgba(22,163,74,0.2)', borderRadius: '20px', padding: '3px 10px' }}>
              <Check size={10} /> Connected
            </span>
          )}
          {connected ? (
            <button onClick={() => disconnect(card.id)} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 12px', borderRadius: '7px', fontSize: '12px', color: 'var(--c-text-3)', background: 'var(--c-panel)', border: '1px solid var(--c-border)', cursor: 'pointer' }}>
              <Unplug size={11} /> Disconnect
            </button>
          ) : (
            <button onClick={() => setShowForm(s => !s)} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 14px', borderRadius: '7px', fontSize: '12px', fontWeight: '500', color: 'var(--c-accent-text)', background: 'var(--c-accent-bg)', border: 'none', cursor: 'pointer' }}>
              <Plug size={11} /> Connect
            </button>
          )}
        </div>
      </div>

      {/* Description */}
      <p style={{ fontSize: '13px', color: 'var(--c-text-2)', lineHeight: '1.6' }}>{card.description}</p>

      {/* Capabilities */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {['Email thread context', 'Timekeeping suggestions', 'Matter matching', 'Draft reply assistance'].map(cap => (
          <span key={cap} style={{ fontSize: '11px', color: 'var(--c-text-3)', background: 'var(--c-panel)', border: '1px solid var(--c-border)', borderRadius: '20px', padding: '3px 10px' }}>
            {cap}
          </span>
        ))}
      </div>

      {/* Connect form */}
      {showForm && !connected && (
        <div style={{ background: 'var(--c-panel)', border: '1px solid var(--c-border)', borderRadius: '10px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <p style={{ fontSize: '12px', color: 'var(--c-text-2)' }}>{card.authHint}</p>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="email"
              value={email}
              onChange={e => { setEmail(e.target.value); setErr(''); }}
              onKeyDown={e => e.key === 'Enter' && handleConnect()}
              placeholder="you@yourfirm.com"
              autoFocus
              style={{ flex: 1, background: 'var(--c-card)', border: '1px solid var(--c-border)', borderRadius: '7px', padding: '8px 12px', fontSize: '13px', color: 'var(--c-text)', outline: 'none', fontFamily: 'inherit' }}
            />
            <button onClick={handleConnect} disabled={connecting} style={{ padding: '8px 16px', borderRadius: '7px', fontSize: '13px', fontWeight: '500', background: connecting ? 'var(--c-panel)' : 'var(--c-accent-bg)', color: connecting ? 'var(--c-text-3)' : 'var(--c-accent-text)', border: 'none', cursor: connecting ? 'default' : 'pointer', flexShrink: 0 }}>
              {connecting ? 'Connecting…' : 'Authorise'}
            </button>
          </div>
          {err && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#dc2626' }}>
              <AlertCircle size={12} /> {err}
            </div>
          )}
          <p style={{ fontSize: '11px', color: 'var(--c-text-4)' }}>
            Your credentials are stored locally and never sent to third parties.
          </p>
        </div>
      )}

      {/* Connected detail */}
      {connected && state?.connectedAt && (
        <div style={{ fontSize: '11px', color: 'var(--c-text-4)', borderTop: '1px solid var(--c-border)', paddingTop: '12px' }}>
          Connected {new Date(state.connectedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
          {' · '}
          <Link href="/timekeeping" style={{ color: 'var(--c-text-3)', textDecoration: 'none' }}>View time suggestions →</Link>
        </div>
      )}
    </div>
  );
}

export default function ConnectorsPage() {
  return (
    <div style={{ padding: '40px', maxWidth: '760px' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '20px', fontWeight: '600', color: 'var(--c-text)', marginBottom: '6px' }}>Connectors</h1>
        <p style={{ fontSize: '13px', color: 'var(--c-text-2)', lineHeight: '1.6' }}>
          Connect your email and productivity tools so Stu can surface email threads in timekeeping, help draft replies, and keep track of client correspondence automatically.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {CONNECTORS.map(card => <ConnectorCard key={card.id} card={card} />)}
      </div>

      {/* Coming soon */}
      <div style={{ marginTop: '32px' }}>
        <div style={{ fontSize: '11px', fontWeight: '600', color: 'var(--c-text-4)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '12px' }}>Coming soon</div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {['iManage', 'NetDocuments', 'Dropbox', 'OneDrive', 'Clio', 'Teams'].map(name => (
            <span key={name} style={{ fontSize: '12px', color: 'var(--c-text-4)', background: 'var(--c-panel)', border: '1px solid var(--c-border)', borderRadius: '20px', padding: '4px 12px' }}>{name}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
