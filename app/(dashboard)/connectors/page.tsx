'use client';
import { useState, useEffect } from 'react';
import { Check, Unplug, Plug, AlertCircle, ChevronRight, Mail, Calendar, Cloud, Shield, ExternalLink } from 'lucide-react';

interface ConnectorDef {
  id: string;
  label: string;
  description: string;
  color: string;
  capabilities: string[];
  authType: 'oauth' | 'imap';
  authLabel: string;
  icon: React.ReactNode;
  comingSoon?: boolean;
}

interface ConnectedState {
  id: string;
  account: string;
  connectedAt: string;
}

const GOOGLE_ICON = (
  <svg width="22" height="22" viewBox="0 0 24 24">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

const OUTLOOK_ICON = (
  <svg width="22" height="22" viewBox="0 0 24 24">
    <rect x="1" y="4" width="14" height="16" rx="2" fill="#0078D4" opacity="0.9"/>
    <rect x="9" y="8" width="14" height="12" rx="2" fill="#28A8E8"/>
    <path d="M9 8v12h14V8H9z" fill="#28A8E8" opacity="0.6"/>
    <path d="M9 8l7 5.5L23 8" stroke="white" strokeWidth="1.2" fill="none" strokeLinecap="round"/>
    <circle cx="5.5" cy="12" r="3" fill="white" opacity="0.9"/>
    <text x="5.5" y="13.2" textAnchor="middle" fontSize="4.5" fontWeight="bold" fill="#0078D4">O</text>
  </svg>
);

const ICLOUD_ICON = (
  <svg width="22" height="22" viewBox="0 0 24 24">
    <path d="M17.5 8.5C17 5.46 14.36 3 11 3c-2.72 0-5.06 1.54-6.28 3.82C2.56 7.15 1 9.1 1 11.5c0 2.76 2.24 5 5 5h11c2.21 0 4-1.79 4-4a4 4 0 00-3.5-3.99" fill="#1a73e8" opacity="0.15" stroke="#1a73e8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12 21v-6m0 0l-2 2m2-2l2 2" stroke="#1a73e8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const APPLE_ICON = (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11"/>
  </svg>
);

const CONNECTORS: ConnectorDef[] = [
  {
    id: 'google',
    label: 'Google — Gmail & Calendar',
    description: 'Connect your Google account to surface email threads in timekeeping, draft replies from within Stu, import calendar events as matter deadlines, and give the AI context from your correspondence.',
    color: '#4285F4',
    capabilities: ['Email thread context', 'Draft replies', 'Calendar deadlines', 'Contact lookup', 'Matter matching'],
    authType: 'oauth',
    authLabel: 'Connect with Google',
    icon: GOOGLE_ICON,
  },
  {
    id: 'outlook',
    label: 'Outlook / Microsoft 365',
    description: 'Connect your Microsoft 365 or Outlook account to pull in email threads, surface client conversations in timekeeping, sync Teams calendar events as matter deadlines, and let the AI reference your recent correspondence.',
    color: '#0078D4',
    capabilities: ['Email context', 'Calendar sync', 'Teams integration', 'Contact lookup', 'Draft assistance'],
    authType: 'oauth',
    authLabel: 'Connect with Microsoft',
    icon: OUTLOOK_ICON,
  },
  {
    id: 'icloud',
    label: 'iCloud Mail',
    description: 'Connect your iCloud Mail account using an app-specific password. Stu can surface relevant email threads and client correspondence directly in your matter view.',
    color: '#1a73e8',
    capabilities: ['Email context', 'Thread surfacing', 'Client correspondence', 'Matter matching'],
    authType: 'imap',
    authLabel: 'Connect with App Password',
    icon: ICLOUD_ICON,
  },
];

const COMING_SOON = [
  'iManage', 'NetDocuments', 'Dropbox', 'OneDrive', 'Clio', 'Microsoft Teams', 'Slack', 'DocuSign', 'Companies House',
];

function useConnectorStore() {
  const [connected, setConnected] = useState<Record<string, ConnectedState>>({});
  const [providers, setProviders] = useState<Record<string, boolean>>({});
  const [loaded, setLoaded] = useState(false);

  const refresh = () => {
    fetch('/api/connectors/status')
      .then(r => r.json())
      .then(d => {
        setConnected(d.connected ?? {});
        setProviders(d.providers ?? {});
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  };

  useEffect(() => { refresh(); }, []);

  const disconnect = async (id: string) => {
    await fetch('/api/connectors/status', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider: id }),
    });
    refresh();
  };

  const getState = (id: string) => connected[id] ? { id, account: connected[id].account, connectedAt: connected[id].connectedAt } : undefined;
  const isProviderEnabled = (id: string) => providers[id] ?? false;

  return { disconnect, getState, isProviderEnabled, loaded, refresh };
}

function OAuthButton({ label, icon, color, onClick, loading }: {
  label: string; icon: React.ReactNode; color: string;
  onClick: () => void; loading: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
        width: '100%', padding: '11px 16px',
        background: 'var(--c-card)', border: `1px solid var(--c-border)`,
        borderRadius: '10px', fontSize: '13px', fontWeight: '600',
        color: 'var(--c-text)', cursor: loading ? 'default' : 'pointer',
        transition: 'all 0.15s', opacity: loading ? 0.6 : 1,
      }}
      onMouseOver={e => !loading && ((e.currentTarget as HTMLButtonElement).style.borderColor = color)}
      onMouseOut={e => ((e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--c-border)')}
    >
      {loading ? (
        <span style={{ width: 18, height: 18, border: `2px solid ${color}`, borderTopColor: 'transparent', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />
      ) : icon}
      {loading ? 'Connecting…' : label}
    </button>
  );
}

function ConnectorCard({ def, onRefresh }: { def: ConnectorDef; onRefresh: () => void }) {
  const { disconnect, getState, isProviderEnabled } = useConnectorStore();
  const state = getState(def.id);
  const connected = !!state;
  const enabled = def.authType === 'imap' || isProviderEnabled(def.id);
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [appleId, setAppleId] = useState('');
  const [appPassword, setAppPassword] = useState('');
  const [err, setErr] = useState('');

  function handleOAuth() {
    // Redirect to our OAuth connect route — it handles the full flow
    window.location.href = `/api/connectors/${def.id}/connect`;
  }

  async function handleImap() {
    if (!appleId.includes('@') || !appPassword.trim()) {
      setErr('Enter a valid Apple ID and app-specific password');
      return;
    }
    setLoading(true);
    setErr('');
    const res = await fetch('/api/connectors/icloud', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ appleId: appleId.trim(), appPassword: appPassword.trim() }),
    });
    const data = await res.json();
    if (!res.ok) {
      setErr(data.error || 'Connection failed');
      setLoading(false);
      return;
    }
    setLoading(false);
    setExpanded(false);
    setAppleId('');
    setAppPassword('');
    onRefresh();
  }

  return (
    <div style={{
      background: 'var(--c-card)', border: `1px solid ${connected ? def.color + '33' : 'var(--c-border)'}`,
      borderRadius: '16px', overflow: 'hidden',
      transition: 'border-color 0.2s',
    }}>
      {/* Top bar */}
      <div style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div style={{
          width: 46, height: 46, borderRadius: '12px',
          background: `${def.color}12`, border: `1px solid ${def.color}22`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          {def.icon}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--c-text)' }}>{def.label}</div>
          <div style={{ fontSize: '12px', color: connected ? '#16a34a' : 'var(--c-text-3)', marginTop: '2px' }}>
            {connected ? `Connected as ${state.account}` : 'Not connected'}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {connected && (
            <span style={{
              display: 'flex', alignItems: 'center', gap: '4px',
              fontSize: '11px', fontWeight: '500', color: '#16a34a',
              background: 'rgba(22,163,74,0.08)', border: '1px solid rgba(22,163,74,0.2)',
              borderRadius: '20px', padding: '3px 10px',
            }}>
              <Check size={10} /> Connected
            </span>
          )}
          {connected ? (
            <button
              onClick={() => disconnect(def.id)}
              style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', color: 'var(--c-text-3)', background: 'var(--c-panel)', border: '1px solid var(--c-border)', cursor: 'pointer' }}
            >
              <Unplug size={11} /> Disconnect
            </button>
          ) : enabled ? (
            <button
              onClick={() => setExpanded(e => !e)}
              style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: '600', color: 'var(--c-accent-text)', background: 'var(--c-accent-bg)', border: 'none', cursor: 'pointer' }}
            >
              <Plug size={11} /> Connect
            </button>
          ) : (
            <span style={{ fontSize: '11px', color: 'var(--c-text-4)', background: 'var(--c-panel)', border: '1px solid var(--c-border)', borderRadius: '20px', padding: '4px 10px' }}>
              Needs credentials
            </span>
          )}
        </div>
      </div>

      {/* Description + capabilities */}
      <div style={{ padding: '0 24px 20px', borderTop: '1px solid var(--c-border)' }}>
        <p style={{ fontSize: '13px', color: 'var(--c-text-2)', lineHeight: '1.65', margin: '16px 0 12px' }}>{def.description}</p>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {def.capabilities.map(cap => (
            <span key={cap} style={{ fontSize: '11px', color: 'var(--c-text-3)', background: 'var(--c-panel)', border: '1px solid var(--c-border)', borderRadius: '20px', padding: '3px 10px' }}>
              {cap}
            </span>
          ))}
        </div>
      </div>

      {/* Auth panel */}
      {expanded && !connected && (
        <div style={{ padding: '20px 24px', borderTop: '1px solid var(--c-border)', background: 'var(--c-panel)' }}>
          {def.authType === 'oauth' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <p style={{ fontSize: '12px', color: 'var(--c-text-2)', lineHeight: '1.6' }}>
                You'll be redirected to {def.id === 'google' ? 'Google' : 'Microsoft'} to authorise access. Stu only requests read permissions for mail and calendar.
              </p>
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center', padding: '8px 12px', background: 'rgba(22,163,74,0.06)', border: '1px solid rgba(22,163,74,0.2)', borderRadius: '8px' }}>
                <Shield size={12} color="#16a34a" />
                <span style={{ fontSize: '11px', color: '#16a34a' }}>OAuth 2.0 — your password is never shared with Stu</span>
              </div>
              <OAuthButton
                label={def.authLabel}
                icon={def.icon}
                color={def.color}
                onClick={handleOAuth}
                loading={loading}
              />
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <p style={{ fontSize: '12px', color: 'var(--c-text-2)', lineHeight: '1.6' }}>
                Apple doesn't support OAuth for third-party mail apps. Use an <strong>app-specific password</strong> — generate one at <a href="https://appleid.apple.com" target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb' }}>appleid.apple.com</a> → Sign-In &amp; Security → App-Specific Passwords.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <input
                  type="email"
                  value={appleId}
                  onChange={e => { setAppleId(e.target.value); setErr(''); }}
                  placeholder="your@icloud.com"
                  style={{ background: 'var(--c-card)', border: '1px solid var(--c-border)', borderRadius: '8px', padding: '9px 12px', fontSize: '13px', color: 'var(--c-text)', outline: 'none', fontFamily: 'inherit' }}
                />
                <input
                  type="password"
                  value={appPassword}
                  onChange={e => { setAppPassword(e.target.value); setErr(''); }}
                  placeholder="xxxx-xxxx-xxxx-xxxx (app-specific password)"
                  style={{ background: 'var(--c-card)', border: '1px solid var(--c-border)', borderRadius: '8px', padding: '9px 12px', fontSize: '13px', color: 'var(--c-text)', outline: 'none', fontFamily: 'inherit' }}
                />
              </div>
              {err && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#dc2626' }}>
                  <AlertCircle size={12} /> {err}
                </div>
              )}
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => setExpanded(false)} style={{ flex: 1, padding: '9px', borderRadius: '8px', background: 'none', border: '1px solid var(--c-border)', fontSize: '13px', color: 'var(--c-text-2)', cursor: 'pointer' }}>Cancel</button>
                <button
                  onClick={handleImap}
                  disabled={loading}
                  style={{ flex: 2, padding: '9px', borderRadius: '8px', background: 'var(--c-accent-bg)', color: 'var(--c-accent-text)', border: 'none', fontSize: '13px', fontWeight: '600', cursor: loading ? 'default' : 'pointer', opacity: loading ? 0.6 : 1 }}
                >
                  {loading ? 'Connecting…' : 'Connect iCloud Mail'}
                </button>
              </div>
              <p style={{ fontSize: '11px', color: 'var(--c-text-4)' }}>Credentials stored locally in your browser. Never sent to third parties.</p>
            </div>
          )}
        </div>
      )}

      {/* Connected footer */}
      {connected && state?.connectedAt && (
        <div style={{ padding: '10px 24px', borderTop: '1px solid var(--c-border)', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '11px', color: 'var(--c-text-4)' }}>
            Connected {new Date(state.connectedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
          </span>
        </div>
      )}
    </div>
  );
}

// Sign-in providers section
function SignInProviders() {
  return (
    <div style={{ background: 'var(--c-card)', border: '1px solid var(--c-border)', borderRadius: '16px', padding: '24px' }}>
      <div style={{ marginBottom: '16px' }}>
        <h2 style={{ fontSize: '14px', fontWeight: '600', color: 'var(--c-text)', marginBottom: '4px' }}>Sign-in Methods</h2>
        <p style={{ fontSize: '12px', color: 'var(--c-text-3)', lineHeight: '1.6' }}>
          Allow team members to sign in with their existing Google or Apple accounts. Requires authentication to be enabled first.
        </p>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {[
          { name: 'Google', icon: GOOGLE_ICON, color: '#4285F4', desc: 'Sign in with Google Workspace or personal Gmail' },
          { name: 'Apple', icon: APPLE_ICON, color: '#000000', desc: 'Sign in with Apple ID — private email relay supported' },
        ].map(p => (
          <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px', background: 'var(--c-panel)', border: '1px solid var(--c-border)', borderRadius: '10px' }}>
            <div style={{ width: 36, height: 36, borderRadius: '8px', background: `${p.color}12`, border: `1px solid ${p.color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {p.icon}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--c-text)' }}>Sign in with {p.name}</div>
              <div style={{ fontSize: '11px', color: 'var(--c-text-3)', marginTop: '2px' }}>{p.desc}</div>
            </div>
            <span style={{ fontSize: '11px', background: 'var(--c-panel)', border: '1px solid var(--c-border)', borderRadius: '20px', padding: '3px 10px', color: 'var(--c-text-4)', flexShrink: 0 }}>
              Requires auth setup
            </span>
          </div>
        ))}
      </div>
      <div style={{ marginTop: '14px', padding: '10px 14px', background: 'rgba(37,99,235,0.05)', border: '1px solid rgba(37,99,235,0.15)', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <ExternalLink size={12} color="#2563eb" />
        <span style={{ fontSize: '11px', color: '#2563eb' }}>
          To enable, add <code style={{ fontFamily: 'monospace', background: 'rgba(37,99,235,0.1)', padding: '1px 4px', borderRadius: '3px' }}>GOOGLE_CLIENT_ID</code>, <code style={{ fontFamily: 'monospace', background: 'rgba(37,99,235,0.1)', padding: '1px 4px', borderRadius: '3px' }}>GOOGLE_CLIENT_SECRET</code>, and <code style={{ fontFamily: 'monospace', background: 'rgba(37,99,235,0.1)', padding: '1px 4px', borderRadius: '3px' }}>APPLE_ID</code> to your .env.local — see the setup guide.
        </span>
      </div>
    </div>
  );
}

export default function ConnectorsPage() {
  const { refresh, loaded } = useConnectorStore();

  // Re-read status after OAuth redirect
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('connected') || params.get('error')) {
      refresh();
      // Clean URL
      window.history.replaceState({}, '', '/connectors');
    }
  }, []);

  return (
    <div style={{ padding: '32px 40px 60px', maxWidth: '800px' }}>
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '20px', fontWeight: '600', color: 'var(--c-text)', marginBottom: '6px' }}>Connectors</h1>
        <p style={{ fontSize: '13px', color: 'var(--c-text-2)', lineHeight: '1.65' }}>
          Connect your email and calendar so the AI can surface client correspondence, suggest time entries, and give context-aware legal advice based on your actual communications.
        </p>
      </div>

      {/* Email & calendar connectors */}
      <div style={{ marginBottom: '10px' }}>
        <div style={{ fontSize: '11px', fontWeight: '600', color: 'var(--c-text-4)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '12px' }}>Email &amp; Calendar</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {CONNECTORS.map(c => <ConnectorCard key={c.id} def={c} onRefresh={refresh} />)}
        </div>
      </div>

      {/* Sign-in providers */}
      <div style={{ margin: '28px 0' }}>
        <div style={{ fontSize: '11px', fontWeight: '600', color: 'var(--c-text-4)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '12px' }}>Sign-in Providers</div>
        <SignInProviders />
      </div>

      {/* Coming soon */}
      <div>
        <div style={{ fontSize: '11px', fontWeight: '600', color: 'var(--c-text-4)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '12px' }}>Coming Soon</div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {COMING_SOON.map(name => (
            <span key={name} style={{ fontSize: '12px', color: 'var(--c-text-4)', background: 'var(--c-panel)', border: '1px solid var(--c-border)', borderRadius: '20px', padding: '5px 12px' }}>
              {name}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
