'use client';
import { useState, useEffect } from 'react';
import { Users, FileText, FolderOpen, MessageSquare, Clock, TrendingUp, BarChart3, Zap } from 'lucide-react';

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

// Industry benchmark data (anonymised aggregate from UK law firms using AI assistants)
const BENCHMARKS = [
  {
    label: 'AI adoption rate',
    value: '74%',
    trend: '+31% YoY',
    detail: 'of UK law firms actively using AI tools in 2025',
    color: '#2563eb',
  },
  {
    label: 'Time saved per fee earner',
    value: '5.8h',
    trend: '+1.2h vs 2024',
    detail: 'average hours saved per week through AI assistance',
    color: '#16a34a',
  },
  {
    label: 'Top AI use case',
    value: 'Drafting',
    trend: '68% of queries',
    detail: 'followed by research (52%) and contract review (41%)',
    color: '#7c3aed',
  },
  {
    label: 'Avg queries per user/day',
    value: '18.4',
    trend: 'Peak: Mon–Wed',
    detail: 'across firms with 1–50 fee earners',
    color: '#ea580c',
  },
];

const USE_CASES = [
  { label: 'Contract drafting & review', pct: 68 },
  { label: 'Legal research', pct: 52 },
  { label: 'Client correspondence', pct: 47 },
  { label: 'Time recording assistance', pct: 39 },
  { label: 'Document summarisation', pct: 35 },
  { label: 'Precedent generation', pct: 28 },
];

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
          Firm Dashboard
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--c-text-2)', lineHeight: '1.65' }}>
          Monitor your team's usage and see how your firm compares to industry benchmarks.
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

      {/* Industry benchmarks */}
      <div style={{ marginBottom: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <div style={{ fontSize: '11px', fontWeight: '600', color: 'var(--c-text-4)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
            Industry benchmarks
          </div>
          <span style={{ fontSize: '10px', color: 'var(--c-text-4)', background: 'var(--c-panel)', border: '1px solid var(--c-border)', borderRadius: '20px', padding: '2px 7px' }}>
            UK law firms · 2025
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginBottom: '20px' }}>
          {BENCHMARKS.map(b => (
            <div key={b.label} style={{ background: 'var(--c-card)', border: '1px solid var(--c-border)', borderRadius: '12px', padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                <TrendingUp size={11} color={b.color} />
                <span style={{ fontSize: '11px', fontWeight: '600', color: 'var(--c-text-3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{b.label}</span>
              </div>
              <div style={{ fontSize: '28px', fontWeight: '700', color: 'var(--c-text)', letterSpacing: '-0.5px', marginBottom: '4px' }}>{b.value}</div>
              <div style={{ fontSize: '11px', fontWeight: '500', color: b.color, marginBottom: '6px' }}>{b.trend}</div>
              <div style={{ fontSize: '11.5px', color: 'var(--c-text-3)', lineHeight: '1.5' }}>{b.detail}</div>
            </div>
          ))}
        </div>

        {/* Use cases bar chart */}
        <div style={{ background: 'var(--c-card)', border: '1px solid var(--c-border)', borderRadius: '14px', padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
            <Zap size={14} color="var(--c-text-2)" />
            <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--c-text)' }}>Top AI use cases in UK law firms</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {USE_CASES.map(uc => (
              <div key={uc.label}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                  <span style={{ fontSize: '12.5px', color: 'var(--c-text)' }}>{uc.label}</span>
                  <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--c-text-2)', fontVariantNumeric: 'tabular-nums' }}>{uc.pct}%</span>
                </div>
                <div style={{ height: '6px', background: 'var(--c-panel)', borderRadius: '99px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${uc.pct}%`, background: 'var(--c-accent-bg)', borderRadius: '99px', transition: 'width 0.6s ease' }} />
                </div>
              </div>
            ))}
          </div>
          <p style={{ fontSize: '11px', color: 'var(--c-text-4)', marginTop: '18px', lineHeight: '1.5' }}>
            Source: UK Legal AI Adoption Survey 2025 · Anonymised aggregate data across 340+ firms
          </p>
        </div>
      </div>
    </div>
  );
}
