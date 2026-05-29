'use client';
import { useState, useEffect } from 'react';
import { Check, Unplug, Plug, AlertCircle, Shield, Clock } from 'lucide-react';

interface ConnectorDef {
  id: string;
  label: string;
  subtitle?: string;
  description: string;
  color: string;
  capabilities: string[];
  authType: 'oauth' | 'imap' | 'apikey' | 'soon';
  authLabel: string;
  icon: React.ReactNode;
  eta?: string;
}

/* ─── Icons ─────────────────────────────────────────────────── */
const GOOGLE_ICON = (
  <svg width="20" height="20" viewBox="0 0 24 24">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

const OUTLOOK_ICON = (
  <svg width="20" height="20" viewBox="0 0 24 24">
    <rect x="1" y="4" width="14" height="16" rx="2" fill="#0078D4" opacity="0.9"/>
    <rect x="9" y="8" width="14" height="12" rx="2" fill="#28A8E8"/>
    <path d="M9 8l7 5.5L23 8" stroke="white" strokeWidth="1.2" fill="none" strokeLinecap="round"/>
    <circle cx="5.5" cy="12" r="3" fill="white" opacity="0.9"/>
    <text x="5.5" y="13.2" textAnchor="middle" fontSize="4.5" fontWeight="bold" fill="#0078D4">O</text>
  </svg>
);

const APPLE_ICON = (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="#1d1d1f">
    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11"/>
  </svg>
);

const CLIO_ICON = (
  <svg width="20" height="20" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="10" fill="#16A34A" opacity="0.12"/>
    <path d="M16.5 9.5A5 5 0 1 0 16.5 14.5" stroke="#16A34A" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
  </svg>
);

const IMANAGE_ICON = (
  <svg width="20" height="20" viewBox="0 0 24 24">
    <rect x="3" y="3" width="8" height="8" rx="2" fill="#1e3a5f"/>
    <rect x="13" y="3" width="8" height="8" rx="2" fill="#1e3a5f" opacity="0.6"/>
    <rect x="3" y="13" width="8" height="8" rx="2" fill="#1e3a5f" opacity="0.6"/>
    <rect x="13" y="13" width="8" height="8" rx="2" fill="#1e3a5f" opacity="0.3"/>
  </svg>
);

const NETDOCS_ICON = (
  <svg width="20" height="20" viewBox="0 0 24 24">
    <rect x="2" y="4" width="20" height="16" rx="2" fill="#0055A4" opacity="0.12" stroke="#0055A4" strokeWidth="1.5"/>
    <path d="M6 9h12M6 12h8M6 15h10" stroke="#0055A4" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

const DROPBOX_ICON = (
  <svg width="20" height="20" viewBox="0 0 24 24">
    <path d="M6 2L12 6.5 6 11 0 6.5z" fill="#0061FF" transform="translate(0,1)"/>
    <path d="M18 2L24 6.5 18 11 12 6.5z" fill="#0061FF" transform="translate(0,1)" opacity="0.7"/>
    <path d="M0 13.5L6 9l6 4.5L6 18z" fill="#0061FF" transform="translate(0,1)"/>
    <path d="M12 13.5L18 9l6 4.5L18 18z" fill="#0061FF" transform="translate(0,1)" opacity="0.7"/>
    <path d="M6 19l6-4.5 6 4.5-6 3z" fill="#0061FF" transform="translate(0,1)" opacity="0.5"/>
  </svg>
);

const ONEDRIVE_ICON = (
  <svg width="20" height="20" viewBox="0 0 24 24">
    <path d="M21.5 14a2.5 2.5 0 0 0-2.5-2.5c-.08 0-.16 0-.24.01A5 5 0 0 0 9.1 9.5 3.5 3.5 0 0 0 5.5 13a3.5 3.5 0 0 0 0 7h15a3 3 0 0 0 1-5.81A2.49 2.49 0 0 0 21.5 14z" fill="#0078D4" opacity="0.15" stroke="#0078D4" strokeWidth="1.2"/>
    <path d="M10 16h7" stroke="#0078D4" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const TEAMS_ICON = (
  <svg width="20" height="20" viewBox="0 0 24 24">
    <rect x="2" y="6" width="20" height="14" rx="3" fill="#4B53BC" opacity="0.15" stroke="#4B53BC" strokeWidth="1.2"/>
    <circle cx="9" cy="11" r="2.5" fill="#4B53BC"/>
    <circle cx="15" cy="9" r="2" fill="#4B53BC" opacity="0.6"/>
    <path d="M5 18c0-2.21 1.79-4 4-4s4 1.79 4 4" stroke="#4B53BC" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
    <path d="M15 18c0-1.66.9-3 2-3" stroke="#4B53BC" strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.6"/>
  </svg>
);

const SLACK_ICON = (
  <svg width="20" height="20" viewBox="0 0 24 24">
    <path d="M5.5 14.5a2 2 0 0 1-2-2 2 2 0 0 1 2-2H7v2a2 2 0 0 1-2 2h.5z" fill="#E01E5A"/>
    <path d="M9.5 18.5a2 2 0 0 1-2-2V15h2a2 2 0 0 1 0 4z" fill="#E01E5A" opacity="0.7"/>
    <path d="M18.5 9.5a2 2 0 0 1 2 2 2 2 0 0 1-2 2H17v-2a2 2 0 0 1 2-2h-.5z" fill="#2EB67D"/>
    <path d="M14.5 5.5a2 2 0 0 1 2 2V9h-2a2 2 0 0 1 0-4z" fill="#2EB67D" opacity="0.7"/>
    <path d="M9.5 5.5a2 2 0 0 1 2 2V9h-2a2 2 0 0 1 0-4z" fill="#ECB22E"/>
    <path d="M5.5 9.5a2 2 0 0 1-2-2 2 2 0 0 1 2-2H7v2a2 2 0 0 1-2 2h.5z" fill="#ECB22E" opacity="0.7"/>
    <path d="M14.5 18.5a2 2 0 0 1-2-2V15h2a2 2 0 0 1 0 4z" fill="#36C5F0"/>
    <path d="M18.5 14.5a2 2 0 0 1 2 2 2 2 0 0 1-2 2H17v-2a2 2 0 0 1 2-2h-.5z" fill="#36C5F0" opacity="0.7"/>
  </svg>
);

const DOCUSIGN_ICON = (
  <svg width="20" height="20" viewBox="0 0 24 24">
    <rect x="4" y="2" width="16" height="20" rx="2" fill="#FFCA00" opacity="0.2" stroke="#FFCA00" strokeWidth="1.5"/>
    <path d="M8 8h8M8 12h8M8 16h5" stroke="#9A6F00" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M14 15.5l2.5 2.5 3-4" stroke="#16A34A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const COMPANIES_HOUSE_ICON = (
  <svg width="20" height="20" viewBox="0 0 24 24">
    <rect x="2" y="10" width="20" height="12" rx="1" fill="#004B88" opacity="0.12" stroke="#004B88" strokeWidth="1.2"/>
    <path d="M12 2L22 10H2L12 2z" fill="#004B88" opacity="0.8"/>
    <rect x="5" y="14" width="3" height="5" rx="0.5" fill="#004B88" opacity="0.6"/>
    <rect x="10.5" y="14" width="3" height="5" rx="0.5" fill="#004B88" opacity="0.6"/>
    <rect x="16" y="14" width="3" height="5" rx="0.5" fill="#004B88" opacity="0.6"/>
  </svg>
);

/* ─── Connector definitions ──────────────────────────────────── */
const SECTIONS: { label: string; connectors: ConnectorDef[] }[] = [
  {
    label: 'Email & Calendar',
    connectors: [
      {
        id: 'google',
        label: 'Google Workspace',
        subtitle: 'Gmail · Google Calendar · Google Drive',
        description: 'Connect your Google account to read client email threads, draft replies from within Stu, import calendar events as matter deadlines, and surface correspondence as AI context.',
        color: '#4285F4',
        capabilities: ['Email threads', 'Draft replies', 'Calendar sync', 'Contact lookup', 'Matter matching'],
        authType: 'oauth',
        authLabel: 'Continue with Google',
        icon: GOOGLE_ICON,
      },
      {
        id: 'outlook',
        label: 'Microsoft 365',
        subtitle: 'Outlook · Exchange · Teams Calendar',
        description: 'Connect your Microsoft 365 account to pull in email threads, surface client conversations, sync Teams calendar events as deadlines, and reference recent correspondence in the AI.',
        color: '#0078D4',
        capabilities: ['Email & Exchange', 'Calendar sync', 'Contact lookup', 'Draft assistance', 'Teams events'],
        authType: 'oauth',
        authLabel: 'Continue with Microsoft',
        icon: OUTLOOK_ICON,
      },
      {
        id: 'icloud',
        label: 'Apple Mail',
        subtitle: 'iCloud Mail · iCloud Calendar',
        description: 'Connect your Apple Mail account using an app-specific password. Stu surfaces relevant email threads and client correspondence directly in your matter view.',
        color: '#1d1d1f',
        capabilities: ['Email threads', 'Thread surfacing', 'Client correspondence', 'Matter matching'],
        authType: 'imap',
        authLabel: 'Connect with App Password',
        icon: APPLE_ICON,
      },
    ],
  },
  {
    label: 'Practice Management',
    connectors: [
      {
        id: 'clio',
        label: 'Clio',
        subtitle: 'Matters · Time · Billing',
        description: 'Sync matters, contacts, and time entries with Clio. Stu can log time automatically from conversations, import open matters as context, and push drafted documents to Clio files.',
        color: '#16A34A',
        capabilities: ['Matter sync', 'Auto time entries', 'Contact import', 'Document push', 'Billing context'],
        authType: 'soon',
        authLabel: 'Coming soon',
        icon: CLIO_ICON,
        eta: 'Q3 2026',
      },
      {
        id: 'imanage',
        label: 'iManage',
        subtitle: 'Work 10 · Cloud',
        description: 'Connect iManage Work to search and retrieve documents directly from Stu. File AI-drafted documents back to the matter workspace with a single click.',
        color: '#1e3a5f',
        capabilities: ['Document search', 'File to matter', 'Version history', 'Access control', 'DMS context'],
        authType: 'soon',
        authLabel: 'Coming soon',
        icon: IMANAGE_ICON,
        eta: 'Q3 2026',
      },
      {
        id: 'netdocuments',
        label: 'NetDocuments',
        subtitle: 'ndMail · ndOffice',
        description: 'Search your NetDocuments workspace and file AI-generated documents directly to matter cabinets, with ndMail integration for email filing.',
        color: '#0055A4',
        capabilities: ['Document search', 'Cabinet filing', 'Email filing', 'Collaboration', 'Matter workspace'],
        authType: 'soon',
        authLabel: 'Coming soon',
        icon: NETDOCS_ICON,
        eta: 'Q4 2026',
      },
    ],
  },
  {
    label: 'Document Storage',
    connectors: [
      {
        id: 'dropbox',
        label: 'Dropbox',
        subtitle: 'Dropbox Business · Dropbox Sign',
        description: 'Access and attach Dropbox files as context for Stu, and push AI-generated documents directly to your Dropbox folders. Includes Dropbox Sign for e-signatures.',
        color: '#0061FF',
        capabilities: ['File access', 'Document push', 'Folder sync', 'Dropbox Sign', 'Team folders'],
        authType: 'soon',
        authLabel: 'Coming soon',
        icon: DROPBOX_ICON,
        eta: 'Q3 2026',
      },
      {
        id: 'onedrive',
        label: 'OneDrive / SharePoint',
        subtitle: 'Microsoft OneDrive · SharePoint Online',
        description: 'Search and retrieve documents from OneDrive or SharePoint. File AI-generated drafts back to SharePoint document libraries and matter folders.',
        color: '#0078D4',
        capabilities: ['File search', 'SharePoint libraries', 'Document filing', 'Version control', 'Teams files'],
        authType: 'soon',
        authLabel: 'Coming soon',
        icon: ONEDRIVE_ICON,
        eta: 'Q3 2026',
      },
    ],
  },
  {
    label: 'Communication',
    connectors: [
      {
        id: 'teams',
        label: 'Microsoft Teams',
        subtitle: 'Chat · Channels · Meetings',
        description: 'Receive Stu briefings as Teams messages, share AI-generated documents to channels, and surface relevant Teams conversations as matter context.',
        color: '#4B53BC',
        capabilities: ['Briefing messages', 'Channel sharing', 'Meeting summaries', 'Chat context', 'Notifications'],
        authType: 'soon',
        authLabel: 'Coming soon',
        icon: TEAMS_ICON,
        eta: 'Q4 2026',
      },
      {
        id: 'slack',
        label: 'Slack',
        subtitle: 'Workspaces · Channels · DMs',
        description: 'Ask Stu questions directly from Slack via the Stu app. Receive matter updates, time-entry reminders, and deadline alerts in your workspace channels.',
        color: '#4A154B',
        capabilities: ['Slack app', 'Matter alerts', 'Deadline reminders', 'Channel summaries', 'DM queries'],
        authType: 'soon',
        authLabel: 'Coming soon',
        icon: SLACK_ICON,
        eta: 'Q4 2026',
      },
    ],
  },
  {
    label: 'Signing & Filing',
    connectors: [
      {
        id: 'docusign',
        label: 'DocuSign',
        subtitle: 'eSignature · CLM',
        description: 'Send AI-generated contracts for signature via DocuSign directly from Stu. Track signature status and surface signed documents back to the matter file.',
        color: '#FFCA00',
        capabilities: ['Send for signature', 'Status tracking', 'Template library', 'CLM integration', 'Audit trail'],
        authType: 'soon',
        authLabel: 'Coming soon',
        icon: DOCUSIGN_ICON,
        eta: 'Q3 2026',
      },
      {
        id: 'companies_house',
        label: 'Companies House',
        subtitle: 'UK Company Register',
        description: "Search the UK Companies House register directly from Stu. Pull company details, director information, filing history, and confirmation statements into any matter.",
        color: '#004B88',
        capabilities: ['Company search', 'Director lookup', 'Filing history', 'Charges register', 'PSC register'],
        authType: 'apikey',
        authLabel: 'Connect with API Key',
        icon: COMPANIES_HOUSE_ICON,
      },
    ],
  },
];

/* ─── State hook ─────────────────────────────────────────────── */
function useConnectorStore() {
  const [connected, setConnected] = useState<Record<string, { account: string; connectedAt: string }>>({});
  const [providers, setProviders] = useState<Record<string, boolean>>({});
  const [loaded, setLoaded] = useState(false);

  const refresh = () => {
    fetch('/api/connectors/status')
      .then(r => r.json())
      .then(d => { setConnected(d.connected ?? {}); setProviders(d.providers ?? {}); setLoaded(true); })
      .catch(() => setLoaded(true));
  };

  useEffect(() => { refresh(); }, []);

  const disconnect = async (id: string) => {
    await fetch('/api/connectors/status', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ provider: id }) });
    refresh();
  };

  return { connected, providers, disconnect, loaded, refresh };
}

/* ─── Connector row ──────────────────────────────────────────── */
function ConnectorRow({ def, connected, onConnect, onDisconnect, providerEnabled }: {
  def: ConnectorDef;
  connected?: { account: string; connectedAt: string };
  onConnect: () => void;
  onDisconnect: () => void;
  providerEnabled: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [appleId, setAppleId] = useState('');
  const [appPassword, setAppPassword] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [err, setErr] = useState('');

  const isConnected = !!connected;
  const canConnect = def.authType !== 'soon' && (def.authType === 'imap' || def.authType === 'apikey' || providerEnabled);

  async function handleImap() {
    if (!appleId.includes('@') || !appPassword.trim()) { setErr('Enter a valid Apple ID and app-specific password'); return; }
    setLoading(true); setErr('');
    const res = await fetch('/api/connectors/icloud', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ appleId: appleId.trim(), appPassword: appPassword.trim() }) });
    const data = await res.json();
    if (!res.ok) { setErr(data.error || 'Connection failed'); setLoading(false); return; }
    setLoading(false); setExpanded(false); setAppleId(''); setAppPassword('');
    onConnect();
  }

  async function handleApiKey() {
    if (!apiKey.trim()) { setErr('Enter your API key'); return; }
    setLoading(true); setErr('');
    const res = await fetch(`/api/connectors/${def.id}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ apiKey: apiKey.trim() }) });
    const data = await res.json();
    if (!res.ok) { setErr(data.error || 'Connection failed'); setLoading(false); return; }
    setLoading(false); setExpanded(false); setApiKey('');
    onConnect();
  }

  return (
    <div style={{
      border: `1px solid ${isConnected ? def.color + '33' : 'var(--c-border)'}`,
      borderRadius: '12px', overflow: 'hidden', background: 'var(--c-card)',
      transition: 'border-color 0.15s',
    }}>
      {/* Main row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '16px 20px' }}>
        <div style={{
          width: 40, height: 40, borderRadius: '10px', flexShrink: 0,
          background: `${def.color}10`, border: `1px solid ${def.color}20`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {def.icon}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--c-text)' }}>{def.label}</span>
            {def.subtitle && <span style={{ fontSize: '11px', color: 'var(--c-text-4)' }}>{def.subtitle}</span>}
          </div>
          <div style={{ fontSize: '11px', color: isConnected ? '#16a34a' : 'var(--c-text-3)', marginTop: '2px' }}>
            {isConnected ? `Connected · ${connected!.account}` : def.description.slice(0, 80) + '…'}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          {isConnected ? (
            <>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: '500', color: '#16a34a', background: 'rgba(22,163,74,0.08)', border: '1px solid rgba(22,163,74,0.2)', borderRadius: '20px', padding: '3px 10px' }}>
                <Check size={9} /> Connected
              </span>
              <button onClick={onDisconnect} style={{ padding: '5px 12px', borderRadius: '7px', fontSize: '12px', color: 'var(--c-text-3)', background: 'var(--c-panel)', border: '1px solid var(--c-border)', cursor: 'pointer', fontFamily: 'inherit' }}>
                Disconnect
              </button>
            </>
          ) : def.authType === 'soon' ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: 'var(--c-text-4)', background: 'var(--c-panel)', border: '1px solid var(--c-border)', borderRadius: '20px', padding: '4px 10px' }}>
              <Clock size={10} /> {def.eta ?? 'Coming soon'}
            </span>
          ) : canConnect ? (
            <button
              onClick={() => { if (def.authType === 'oauth') { window.location.href = `/api/connectors/${def.id}/connect`; } else { setExpanded(e => !e); } }}
              style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: '600', color: 'var(--c-accent-text)', background: 'var(--c-accent-bg)', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
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

      {/* Capabilities */}
      <div style={{ padding: '0 20px 14px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
        {def.capabilities.map(cap => (
          <span key={cap} style={{ fontSize: '10px', color: isConnected ? def.color : 'var(--c-text-4)', background: isConnected ? `${def.color}10` : 'var(--c-panel)', border: `1px solid ${isConnected ? def.color + '22' : 'var(--c-border)'}`, borderRadius: '20px', padding: '2px 8px' }}>
            {cap}
          </span>
        ))}
      </div>

      {/* Auth panel */}
      {expanded && !isConnected && (
        <div style={{ padding: '16px 20px', borderTop: '1px solid var(--c-border)', background: 'var(--c-panel)' }}>
          {def.authType === 'imap' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <p style={{ fontSize: '12px', color: 'var(--c-text-2)', lineHeight: '1.6', margin: 0 }}>
                Generate an app-specific password at <a href="https://appleid.apple.com" target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb' }}>appleid.apple.com</a> → Sign-In &amp; Security → App-Specific Passwords.
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 10px', background: 'rgba(22,163,74,0.06)', border: '1px solid rgba(22,163,74,0.2)', borderRadius: '8px' }}>
                <Shield size={11} color="#16a34a" />
                <span style={{ fontSize: '11px', color: '#16a34a' }}>Encrypted at rest by Stu OS — never shared with third parties</span>
              </div>
              <input type="email" value={appleId} onChange={e => { setAppleId(e.target.value); setErr(''); }} placeholder="your@icloud.com" style={{ background: 'var(--c-card)', border: '1px solid var(--c-border)', borderRadius: '8px', padding: '9px 12px', fontSize: '13px', color: 'var(--c-text)', outline: 'none', fontFamily: 'inherit' }} />
              <input type="password" value={appPassword} onChange={e => { setAppPassword(e.target.value); setErr(''); }} placeholder="xxxx-xxxx-xxxx-xxxx" style={{ background: 'var(--c-card)', border: '1px solid var(--c-border)', borderRadius: '8px', padding: '9px 12px', fontSize: '13px', color: 'var(--c-text)', outline: 'none', fontFamily: 'inherit' }} />
              {err && <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#dc2626' }}><AlertCircle size={12} /> {err}</div>}
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => setExpanded(false)} style={{ flex: 1, padding: '9px', borderRadius: '8px', background: 'none', border: '1px solid var(--c-border)', fontSize: '13px', color: 'var(--c-text-2)', cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
                <button onClick={handleImap} disabled={loading} style={{ flex: 2, padding: '9px', borderRadius: '8px', background: 'var(--c-accent-bg)', color: 'var(--c-accent-text)', border: 'none', fontSize: '13px', fontWeight: '600', cursor: loading ? 'default' : 'pointer', opacity: loading ? 0.6 : 1, fontFamily: 'inherit' }}>
                  {loading ? 'Connecting…' : 'Connect Apple Mail'}
                </button>
              </div>
            </div>
          )}
          {def.authType === 'apikey' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <p style={{ fontSize: '12px', color: 'var(--c-text-2)', lineHeight: '1.6', margin: 0 }}>
                Get your free API key from the <a href="https://developer.company-information.service.gov.uk" target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb' }}>Companies House Developer Hub</a>. The API is free with a rate limit.
              </p>
              <input type="text" value={apiKey} onChange={e => { setApiKey(e.target.value); setErr(''); }} placeholder="Companies House API key" style={{ background: 'var(--c-card)', border: '1px solid var(--c-border)', borderRadius: '8px', padding: '9px 12px', fontSize: '13px', color: 'var(--c-text)', outline: 'none', fontFamily: 'inherit' }} />
              {err && <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#dc2626' }}><AlertCircle size={12} /> {err}</div>}
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => setExpanded(false)} style={{ flex: 1, padding: '9px', borderRadius: '8px', background: 'none', border: '1px solid var(--c-border)', fontSize: '13px', color: 'var(--c-text-2)', cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
                <button onClick={handleApiKey} disabled={loading} style={{ flex: 2, padding: '9px', borderRadius: '8px', background: 'var(--c-accent-bg)', color: 'var(--c-accent-text)', border: 'none', fontSize: '13px', fontWeight: '600', cursor: loading ? 'default' : 'pointer', opacity: loading ? 0.6 : 1, fontFamily: 'inherit' }}>
                  {loading ? 'Connecting…' : 'Save API Key'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── Page ───────────────────────────────────────────────────── */
export default function ConnectorsPage() {
  const { connected, providers, disconnect, loaded, refresh } = useConnectorStore();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('connected') || params.get('error')) {
      refresh();
      window.history.replaceState({}, '', '/connectors');
    }
  }, []);

  const totalConnected = Object.keys(connected).length;

  return (
    <div style={{ padding: '32px 40px 80px', maxWidth: '820px' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '20px', fontWeight: '600', color: 'var(--c-text)', marginBottom: '6px', letterSpacing: '-0.3px' }}>Connectors</h1>
        <p style={{ fontSize: '13px', color: 'var(--c-text-2)', lineHeight: '1.65', maxWidth: '540px' }}>
          Connect your existing tools so Stu can pull in context, automate time entries, file documents, and give advice grounded in your actual work.
        </p>
        {totalConnected > 0 && (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginTop: '10px', fontSize: '12px', color: '#16a34a', background: 'rgba(22,163,74,0.08)', border: '1px solid rgba(22,163,74,0.2)', borderRadius: '20px', padding: '4px 12px' }}>
            <Check size={11} /> {totalConnected} service{totalConnected > 1 ? 's' : ''} connected
          </div>
        )}
      </div>

      {/* Sections */}
      {SECTIONS.map(section => (
        <div key={section.label} style={{ marginBottom: '32px' }}>
          <div style={{ fontSize: '11px', fontWeight: '600', color: 'var(--c-text-4)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '10px' }}>
            {section.label}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {section.connectors.map(def => (
              <ConnectorRow
                key={def.id}
                def={def}
                connected={connected[def.id]}
                providerEnabled={providers[def.id] ?? false}
                onConnect={refresh}
                onDisconnect={() => disconnect(def.id)}
              />
            ))}
          </div>
        </div>
      ))}

      {/* Stu OS security panel */}
      <div style={{ padding: '18px 20px', background: 'var(--c-panel)', border: '1px solid var(--c-border)', borderRadius: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
          <Shield size={15} color="#16a34a" />
          <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--c-text)' }}>Secured by Stu OS</span>
        </div>
        <p style={{ fontSize: '12px', color: 'var(--c-text-3)', lineHeight: '1.65', margin: '0 0 12px' }}>
          Stu OS is the security layer that governs how Stu connects to your tools and handles your files. Every connection is locked down before any data moves.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          {[
            ['Encrypted at rest', 'Access tokens & credentials are AES-256-GCM encrypted in the database.'],
            ['No passwords stored', 'OAuth (Google, Microsoft) means we never see or store your account password.'],
            ['Per-user isolation', 'Connections and documents are scoped to your account — never shared across firms.'],
            ['Revoke anytime', 'Disconnect instantly removes stored credentials. You stay in control.'],
          ].map(([title, body]) => (
            <div key={title} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', padding: '10px 12px', background: 'var(--c-card)', border: '1px solid var(--c-border)', borderRadius: '8px' }}>
              <Check size={12} color="#16a34a" style={{ marginTop: '2px', flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--c-text)', marginBottom: '2px' }}>{title}</div>
                <div style={{ fontSize: '11px', color: 'var(--c-text-3)', lineHeight: '1.55' }}>{body}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
