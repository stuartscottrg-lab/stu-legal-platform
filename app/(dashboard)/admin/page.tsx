'use client';
import { useState, useEffect } from 'react';
import { Users, FileText, FolderOpen, Clock, BarChart3 } from 'lucide-react';

interface UserStat {
  id: string;
  email: string;
  name: string | null;
  last_sign_in: string | null;
  confirmed: boolean;
  matters: number;
  documents: number;
}

interface Totals {
  users: number;
  matters: number;
  documents: number;
  messages: number;
  timeMinutes: number;
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
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

function StatCard({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string | number; sub?: string }) {
  return (
    <div style={{ background: 'var(--c-card)', border: '1px solid var(--c-border)', borderRadius: '12px', padding: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
        <span style={{ opacity: 0.5 }}>{icon}</span>
        <span style={{ fontSize: '11px', fontWeight: '600', color: 'var(--c-text-3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
      </div>
      <div style={{ fontSize: '26px', fontWeight: '700', color: 'var(--c-text)', letterSpacing: '-0.5px', lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: '11px', color: 'var(--c-text-3)', marginTop: '6px' }}>{sub}</div>}
    </div>
  );
}

export default function AdminPage() {
  const [stats, setStats] = useState<{ users: UserStat[]; totals: Totals } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/usage')
      .then(r => r.json())
      .then(d => { setStats(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const totals = stats?.totals;
  const users = stats?.users ?? [];

  return (
    <div style={{ padding: '32px 40px 80px', maxWidth: '900px' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '20px', fontWeight: '600', color: 'var(--c-text)', marginBottom: '6px', letterSpacing: '-0.3px' }}>
          Team & Dashboard
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--c-text-2)', lineHeight: '1.65' }}>
          Monitor your team's activity and usage across Stu.
        </p>
      </div>

      {/* Your firm stats */}
      <div style={{ marginBottom: '10px' }}>
        <div style={{ fontSize: '11px', fontWeight: '600', color: 'var(--c-text-4)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '12px' }}>
          Your firm
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '24px' }}>
          <StatCard icon={<Users size={14} />} label="Team members" value={loading ? '—' : totals?.users ?? 0} />
          <StatCard icon={<FolderOpen size={14} />} label="Matters" value={loading ? '—' : totals?.matters ?? 0} />
          <StatCard icon={<FileText size={14} />} label="Documents" value={loading ? '—' : totals?.documents ?? 0} />
          <StatCard icon={<Clock size={14} />} label="Time logged" value={loading ? '—' : `${Math.round((totals?.timeMinutes ?? 0) / 60)}h`} sub="across all matters" />
        </div>
      </div>

      {/* Per-user table */}
      <div style={{ background: 'var(--c-card)', border: '1px solid var(--c-border)', borderRadius: '14px', overflow: 'hidden', marginBottom: '40px' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--c-border)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <BarChart3 size={14} color="var(--c-text-2)" />
          <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--c-text)' }}>Usage by team member</span>
        </div>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--c-text-3)', fontSize: '13px' }}>Loading…</div>
        ) : users.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--c-text-3)', fontSize: '13px' }}>No data yet.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--c-panel)' }}>
                {['User', 'Matters', 'Documents', 'Last active', 'Status'].map(h => (
                  <th key={h} style={{ padding: '10px 20px', textAlign: 'left', fontSize: '11px', fontWeight: '600', color: 'var(--c-text-3)', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((u, i) => (
                <tr key={u.id} style={{ borderTop: i > 0 ? '1px solid var(--c-border)' : 'none' }}>
                  <td style={{ padding: '13px 20px' }}>
                    <div style={{ fontSize: '13px', fontWeight: '500', color: 'var(--c-text)' }}>{u.name ?? u.email}</div>
                    {u.name && <div style={{ fontSize: '11px', color: 'var(--c-text-3)', marginTop: '1px' }}>{u.email}</div>}
                  </td>
                  <td style={{ padding: '13px 20px', fontSize: '13px', color: 'var(--c-text)', fontVariantNumeric: 'tabular-nums' }}>{u.matters}</td>
                  <td style={{ padding: '13px 20px', fontSize: '13px', color: 'var(--c-text)', fontVariantNumeric: 'tabular-nums' }}>{u.documents}</td>
                  <td style={{ padding: '13px 20px', fontSize: '12px', color: 'var(--c-text-3)' }}>{timeAgo(u.last_sign_in)}</td>
                  <td style={{ padding: '13px 20px' }}>
                    <span style={{
                      fontSize: '11px', fontWeight: '500',
                      color: u.confirmed ? '#16a34a' : 'var(--c-text-3)',
                      background: u.confirmed ? 'rgba(22,163,74,0.08)' : 'var(--c-panel)',
                      border: `1px solid ${u.confirmed ? 'rgba(22,163,74,0.2)' : 'var(--c-border)'}`,
                      borderRadius: '20px', padding: '2px 8px',
                    }}>
                      {u.confirmed ? 'Active' : 'Pending'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

    </div>
  );
}
