'use client';
import { useState, useEffect } from 'react';
import { UserPlus, Mail, CheckCircle, Clock, AlertCircle, Users, Copy, Check } from 'lucide-react';

interface Member {
  id: string;
  email: string;
  name: string | null;
  created_at: string;
  last_sign_in: string | null;
  invited_by: string | null;
  confirmed: boolean;
}

function timeAgo(iso: string | null): string {
  if (!iso) return 'Never';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 2) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function Avatar({ name, email }: { name: string | null; email: string }) {
  const initials = name
    ? name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : email[0].toUpperCase();
  const hue = [...email].reduce((a, c) => a + c.charCodeAt(0), 0) % 360;
  return (
    <div style={{
      width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
      background: `hsl(${hue},40%,85%)`, color: `hsl(${hue},40%,35%)`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: '12px', fontWeight: '700', letterSpacing: '0.02em',
    }}>
      {initials}
    </div>
  );
}

export default function TeamPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviting, setInviting] = useState(false);
  const [inviteStatus, setInviteStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [inviteError, setInviteError] = useState('');
  const [copied, setCopied] = useState(false);

  const fetchMembers = () => {
    setLoading(true);
    fetch('/api/team/members')
      .then(r => r.json())
      .then(d => { setMembers(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { fetchMembers(); }, []);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    setInviting(true);
    setInviteStatus('idle');
    setInviteError('');
    try {
      const res = await fetch('/api/team/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { setInviteError(data.error || 'Failed to send invite'); setInviteStatus('error'); }
      else { setInviteStatus('success'); setInviteEmail(''); fetchMembers(); }
    } catch {
      setInviteError('Something went wrong'); setInviteStatus('error');
    }
    setInviting(false);
    setTimeout(() => setInviteStatus('idle'), 5000);
  };

  const copyLink = () => {
    navigator.clipboard.writeText('https://stu.ink/sign-in');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const confirmed = members.filter(m => m.confirmed);
  const pending = members.filter(m => !m.confirmed);

  return (
    <div style={{ padding: '32px 40px 80px', maxWidth: '780px' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '20px', fontWeight: '600', color: 'var(--c-text)', marginBottom: '6px', letterSpacing: '-0.3px' }}>
          Team &amp; Workspace
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--c-text-2)', lineHeight: '1.65', maxWidth: '520px' }}>
          Invite colleagues to collaborate on matters, share documents, and work alongside Stu together.
        </p>
      </div>

      {/* Invite box */}
      <div style={{ background: 'var(--c-card)', border: '1px solid var(--c-border)', borderRadius: '14px', padding: '24px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <UserPlus size={15} color="var(--c-text-2)" />
          <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--c-text)' }}>Invite a team member</span>
        </div>
        <form onSubmit={handleInvite} style={{ display: 'flex', gap: '8px' }}>
          <input
            type="email"
            value={inviteEmail}
            onChange={e => { setInviteEmail(e.target.value); setInviteStatus('idle'); }}
            placeholder="colleague@firm.co.uk"
            required
            style={{
              flex: 1, padding: '10px 14px', borderRadius: '9px',
              background: 'var(--c-panel)', border: '1px solid var(--c-border)',
              color: 'var(--c-text)', fontSize: '13.5px', outline: 'none',
              fontFamily: 'inherit',
            }}
            onFocus={e => (e.target.style.borderColor = 'var(--c-border-s)')}
            onBlur={e => (e.target.style.borderColor = 'var(--c-border)')}
          />
          <button
            type="submit"
            disabled={inviting || !inviteEmail.trim()}
            style={{
              padding: '10px 20px', borderRadius: '9px', border: 'none',
              background: 'var(--c-accent-bg)', color: 'var(--c-accent-text)',
              fontSize: '13px', fontWeight: '600', cursor: inviting ? 'default' : 'pointer',
              opacity: inviting ? 0.7 : 1, fontFamily: 'inherit', whiteSpace: 'nowrap',
              display: 'flex', alignItems: 'center', gap: '6px',
            }}
          >
            <Mail size={13} />
            {inviting ? 'Sending…' : 'Send invite'}
          </button>
        </form>

        {inviteStatus === 'success' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginTop: '12px', fontSize: '12.5px', color: '#16a34a' }}>
            <CheckCircle size={13} /> Invite sent — they'll receive an email to join the workspace.
          </div>
        )}
        {inviteStatus === 'error' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginTop: '12px', fontSize: '12.5px', color: '#dc2626' }}>
            <AlertCircle size={13} /> {inviteError}
          </div>
        )}

        <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--c-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '12px', color: 'var(--c-text-3)' }}>Or share the workspace link</span>
          <button
            onClick={copyLink}
            style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '5px 12px', borderRadius: '7px', background: 'var(--c-panel)', border: '1px solid var(--c-border)', fontSize: '12px', color: 'var(--c-text-2)', cursor: 'pointer', fontFamily: 'inherit' }}
          >
            {copied ? <><Check size={11} color="#16a34a" /> Copied</> : <><Copy size={11} /> stu.ink/sign-in</>}
          </button>
        </div>
      </div>

      {/* Members */}
      <div style={{ background: 'var(--c-card)', border: '1px solid var(--c-border)', borderRadius: '14px', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--c-border)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Users size={14} color="var(--c-text-2)" />
          <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--c-text)' }}>
            Workspace members
          </span>
          <span style={{ marginLeft: 'auto', fontSize: '12px', color: 'var(--c-text-3)' }}>
            {confirmed.length} active{pending.length > 0 ? ` · ${pending.length} pending` : ''}
          </span>
        </div>

        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--c-text-3)', fontSize: '13px' }}>Loading…</div>
        ) : members.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--c-text-3)', fontSize: '13px' }}>
            No team members yet — send your first invite above.
          </div>
        ) : (
          <div>
            {[...confirmed, ...pending].map((m, i) => (
              <div key={m.id} style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                padding: '14px 20px',
                borderBottom: i < members.length - 1 ? '1px solid var(--c-border)' : 'none',
              }}>
                <Avatar name={m.name} email={m.email} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '13px', fontWeight: '500', color: 'var(--c-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {m.name ?? m.email}
                  </div>
                  {m.name && (
                    <div style={{ fontSize: '11px', color: 'var(--c-text-3)', marginTop: '1px' }}>{m.email}</div>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                  {!m.confirmed ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--c-text-3)', background: 'var(--c-panel)', border: '1px solid var(--c-border)', borderRadius: '20px', padding: '3px 8px' }}>
                      <Clock size={9} /> Pending
                    </span>
                  ) : (
                    <span style={{ fontSize: '11px', color: 'var(--c-text-3)' }}>
                      Active {timeAgo(m.last_sign_in)}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
