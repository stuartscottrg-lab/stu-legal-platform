'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { Clock, Play, Square, Plus, Trash2, Mail, ExternalLink, Zap } from 'lucide-react';
import { useConnectors } from '@/lib/hooks/useConnectors';
import Link from 'next/link';

interface Matter { id: string; title: string; client_name: string; }
interface Entry { id: string; matter_id: string | null; matter_title: string | null; client_name: string | null; description: string; minutes: number; hourly_rate: number; date: string; }

const RATES = [0, 150, 200, 250, 300, 350, 400, 500];
const RANGES = [{ value: 'today', label: 'Today' }, { value: 'week', label: 'Last 7 days' }, { value: 'month', label: 'Last 30 days' }];

function fmt(mins: number) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}h ${m > 0 ? m + 'm' : ''}`.trim() : `${m}m`;
}
function fmtTimer(secs: number) {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}
function fmtGBP(n: number) {
  return n === 0 ? '—' : `£${n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
}

const s = {
  page: { padding: '40px', maxWidth: '1100px' } as React.CSSProperties,
  panel: { background: 'var(--c-panel)', border: '1px solid var(--c-border)', borderRadius: '12px', padding: '20px' } as React.CSSProperties,
  label: { display: 'block', fontSize: '11px', fontWeight: '600', color: 'var(--c-text-3)', textTransform: 'uppercase' as const, letterSpacing: '0.06em', marginBottom: '6px' },
  input: { width: '100%', background: 'var(--c-bg)', border: '1px solid var(--c-border)', borderRadius: '8px', padding: '8px 12px', fontSize: '13px', color: 'var(--c-text)', outline: 'none', boxSizing: 'border-box' as const },
  select: { width: '100%', background: 'var(--c-bg)', border: '1px solid var(--c-border)', borderRadius: '8px', padding: '8px 12px', fontSize: '13px', color: 'var(--c-text)', outline: 'none', boxSizing: 'border-box' as const, appearance: 'none' as const },
  btn: { padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: '500', cursor: 'pointer', border: 'none' } as React.CSSProperties,
};

// Simulated email threads based on connected account
function generateEmails(matters: Matter[], account: string, source: string) {
  const subjects = [
    { subj: 'RE: Draft NDA — please review', mins: 12, matterIdx: 0 },
    { subj: 'Following up on contract redlines', mins: 8, matterIdx: 1 },
    { subj: 'Fwd: Signature page — urgent', mins: 5, matterIdx: 0 },
    { subj: 'Call notes from yesterday', mins: 20, matterIdx: 1 },
    { subj: 'RE: Updated heads of terms', mins: 15, matterIdx: 0 },
    { subj: 'Question re: indemnity clause', mins: 10, matterIdx: 1 },
  ];
  return subjects.map((s, i) => ({
    id: `${source}-${i}`,
    subject: s.subj,
    from: i % 2 === 0 ? `partner@${account.split('@')[1]}` : `client@example.com`,
    matter: matters[s.matterIdx % Math.max(matters.length, 1)] || null,
    suggestedMins: s.mins,
    receivedAt: new Date(Date.now() - i * 3.6e6 * 4).toISOString(),
    source,
  }));
}

export default function TimekeepingPage() {
  const [matters, setMatters] = useState<Matter[]>([]);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [totalMinutes, setTotalMinutes] = useState(0);
  const [totalValue, setTotalValue] = useState(0);
  const [range, setRange] = useState('week');
  const [loading, setLoading] = useState(true);
  const { connectors, ready: connectorsReady } = useConnectors();
  const [loggedEmails, setLoggedEmails] = useState<Set<string>>(new Set());

  // Timer state — persisted in localStorage so navigation doesn't reset it
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerSecs, setTimerSecs] = useState(0);
  const [timerDesc, setTimerDesc] = useState('');
  const [timerMatter, setTimerMatter] = useState('');
  const [timerRate, setTimerRate] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number | null>(null);

  // Restore timer from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('stu-timer');
      if (stored) {
        const t = JSON.parse(stored);
        setTimerDesc(t.desc || '');
        setTimerMatter(t.matter || '');
        setTimerRate(t.rate || 0);
        if (t.running && t.startedAt) {
          const elapsed = Math.floor((Date.now() - t.startedAt) / 1000);
          setTimerSecs(elapsed);
          startTimeRef.current = t.startedAt;
          setTimerRunning(true);
        } else {
          setTimerSecs(t.secs || 0);
        }
      }
    } catch {}
  }, []);

  // Manual entry
  const [desc, setDesc] = useState('');
  const [matterId, setMatterId] = useState('');
  const [hours, setHours] = useState('');
  const [mins, setMins] = useState('');
  const [rate, setRate] = useState(0);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/timekeeping?range=${range}`);
      const data = await res.json();
      setMatters(data.matters || []);
      setEntries(data.entries || []);
      setTotalMinutes(data.totalMinutes || 0);
      setTotalValue(data.totalValue || 0);
    } catch {}
    setLoading(false);
  }, [range]);

  useEffect(() => { load(); }, [load]);

  // Timer tick — uses wall-clock diff so accuracy survives navigation
  useEffect(() => {
    if (timerRunning) {
      if (!startTimeRef.current) startTimeRef.current = Date.now() - timerSecs * 1000;
      intervalRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTimeRef.current!) / 1000);
        setTimerSecs(elapsed);
        // Persist so navigation doesn't reset
        try {
          localStorage.setItem('stu-timer', JSON.stringify({
            running: true, startedAt: startTimeRef.current,
            desc: timerDesc, matter: timerMatter, rate: timerRate,
          }));
        } catch {}
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
      startTimeRef.current = null;
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timerRunning]);

  async function stopAndLog() {
    setTimerRunning(false);
    try { localStorage.removeItem('stu-timer'); } catch {}
    const totalMins = Math.max(1, Math.round(timerSecs / 60));
    if (!timerDesc.trim()) { setTimerSecs(0); return; }
    await saveEntry({ matterId: timerMatter, description: timerDesc, minutes: totalMins, hourlyRate: timerRate, date: new Date().toISOString().split('T')[0] });
    setTimerSecs(0);
    setTimerDesc('');
  }

  async function saveEntry(payload: { matterId: string; description: string; minutes: number; hourlyRate: number; date: string }) {
    const res = await fetch('/api/timekeeping', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (res.ok) load();
    return res.ok;
  }

  async function submitManual() {
    if (!desc.trim()) { setFormError('Description required'); return; }
    const totalMins = (parseInt(hours || '0') * 60) + parseInt(mins || '0');
    if (totalMins < 1) { setFormError('Enter at least 1 minute'); return; }
    setFormError('');
    setSaving(true);
    const ok = await saveEntry({ matterId, description: desc, minutes: totalMins, hourlyRate: rate, date });
    if (ok) { setDesc(''); setHours(''); setMins(''); setMatterId(''); setRate(0); }
    setSaving(false);
  }

  async function deleteEntry(id: string) {
    await fetch('/api/timekeeping', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
    load();
  }

  // Group entries by date
  const grouped: Record<string, Entry[]> = {};
  for (const e of entries) {
    if (!grouped[e.date]) grouped[e.date] = [];
    grouped[e.date].push(e);
  }

  return (
    <div style={s.page}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
        <Clock size={18} color="#555" />
        <h1 style={{ fontSize: '20px', fontWeight: '600', color: 'var(--c-text)' }}>Time Keeping</h1>
      </div>
      <p style={{ fontSize: '13px', color: 'var(--c-text-3)', marginBottom: '32px' }}>Track billable time against matters.</p>

      <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: '24px', alignItems: 'start' }}>
        {/* Left column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Live timer */}
          <div style={{ ...s.panel, border: timerRunning ? '1px solid #2a2a2a' : '1px solid #1e1e1e' }}>
            <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--c-text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '16px' }}>Live timer</div>
            <div style={{ fontSize: '38px', fontWeight: '300', color: timerRunning ? 'var(--c-text)' : '#444', fontVariantNumeric: 'tabular-nums', letterSpacing: '0.02em', marginBottom: '16px', fontFamily: 'monospace' }}>
              {fmtTimer(timerSecs)}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '14px' }}>
              <input style={s.input} value={timerDesc} onChange={e => setTimerDesc(e.target.value)} placeholder="What are you working on?" disabled={timerRunning} />
              <select style={s.select} value={timerMatter} onChange={e => setTimerMatter(e.target.value)} disabled={timerRunning}>
                <option value="">No matter</option>
                {matters.map(m => <option key={m.id} value={m.id}>{m.title}</option>)}
              </select>
              <select style={s.select} value={timerRate} onChange={e => setTimerRate(Number(e.target.value))} disabled={timerRunning}>
                <option value={0}>No rate</option>
                {RATES.filter(r => r > 0).map(r => <option key={r} value={r}>£{r}/hr</option>)}
              </select>
            </div>
            {!timerRunning ? (
              <button onClick={() => { if (timerDesc.trim()) setTimerRunning(true); }} style={{ ...s.btn, background: timerDesc.trim() ? 'var(--c-text)' : 'var(--c-card)', color: timerDesc.trim() ? 'var(--c-bg)' : '#444', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                <Play size={13} fill="currentColor" /> Start timer
              </button>
            ) : (
              <button onClick={stopAndLog} style={{ ...s.btn, background: 'var(--c-card)', color: 'var(--c-text)', border: '1px solid var(--c-border)', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                <Square size={13} fill="currentColor" /> Stop & log
              </button>
            )}
          </div>

          {/* Manual entry */}
          <div style={s.panel}>
            <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--c-text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '16px' }}>Log time manually</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={s.label}>Description</label>
                <input style={s.input} value={desc} onChange={e => setDesc(e.target.value)} placeholder="e.g. Drafting NDA review memo" />
              </div>
              <div>
                <label style={s.label}>Matter</label>
                <select style={s.select} value={matterId} onChange={e => setMatterId(e.target.value)}>
                  <option value="">No matter</option>
                  {matters.map(m => <option key={m.id} value={m.id}>{m.title}</option>)}
                </select>
              </div>
              <div>
                <label style={s.label}>Time</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <input style={s.input} value={hours} onChange={e => setHours(e.target.value.replace(/\D/g, ''))} placeholder="hrs" />
                  <input style={s.input} value={mins} onChange={e => setMins(e.target.value.replace(/\D/g, ''))} placeholder="mins" />
                </div>
              </div>
              <div>
                <label style={s.label}>Rate</label>
                <select style={s.select} value={rate} onChange={e => setRate(Number(e.target.value))}>
                  <option value={0}>No rate</option>
                  {RATES.filter(r => r > 0).map(r => <option key={r} value={r}>£{r}/hr</option>)}
                </select>
              </div>
              <div>
                <label style={s.label}>Date</label>
                <input type="date" style={s.input} value={date} onChange={e => setDate(e.target.value)} />
              </div>
              {formError && <div style={{ fontSize: '12px', color: '#c0392b' }}>{formError}</div>}
              <button onClick={submitManual} disabled={saving} style={{ ...s.btn, background: saving ? 'var(--c-card)' : 'var(--c-text)', color: saving ? '#444' : 'var(--c-bg)', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                <Plus size={13} /> {saving ? 'Saving…' : 'Log entry'}
              </button>
            </div>
          </div>
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Summary stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '12px' }}>
            {[
              { label: 'Total time', value: loading ? '—' : fmt(totalMinutes) },
              { label: 'Billable value', value: loading ? '—' : fmtGBP(totalValue) },
              { label: 'Entries', value: loading ? '—' : String(entries.length) },
            ].map(({ label, value }) => (
              <div key={label} style={{ ...s.panel, padding: '16px 20px' }}>
                <div style={{ fontSize: '11px', color: 'var(--c-text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>{label}</div>
                <div style={{ fontSize: '24px', fontWeight: '600', color: 'var(--c-text)' }}>{value}</div>
              </div>
            ))}
          </div>

          {/* Email activity from connectors */}
          {connectorsReady && (() => {
            const activeConnectors = connectors.filter(c => c.connected);
            if (activeConnectors.length === 0) return (
              <div style={{ ...s.panel, display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 18px' }}>
                <Mail size={14} color="var(--c-text-4)" />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '12px', color: 'var(--c-text-3)', marginBottom: '2px' }}>No email connectors active</div>
                  <div style={{ fontSize: '11px', color: 'var(--c-text-4)' }}>Connect Gmail or Outlook to surface email threads here</div>
                </div>
                <Link href="/connectors" style={{ fontSize: '11px', fontWeight: '500', color: 'var(--c-text-2)', background: 'var(--c-panel)', border: '1px solid var(--c-border)', borderRadius: '6px', padding: '4px 10px', textDecoration: 'none', whiteSpace: 'nowrap' }}>
                  Connect →
                </Link>
              </div>
            );

            const allEmails = activeConnectors.flatMap(c =>
              generateEmails(matters, c.account || 'unknown@firm.com', c.name)
            );

            return (
              <div style={s.panel}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                  <Zap size={13} color="var(--c-text-3)" />
                  <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--c-text-2)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Email activity</span>
                  <span style={{ fontSize: '11px', color: 'var(--c-text-4)', marginLeft: '4px' }}>
                    {activeConnectors.map(c => c.account).join(', ')}
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {allEmails.map(email => {
                    const alreadyLogged = loggedEmails.has(email.id);
                    return (
                      <div key={email.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', background: alreadyLogged ? 'transparent' : 'var(--c-bg)', border: '1px solid', borderColor: alreadyLogged ? 'transparent' : 'var(--c-border)', borderRadius: '8px', opacity: alreadyLogged ? 0.4 : 1, transition: 'all 0.15s' }}>
                        <Mail size={12} color={email.source === 'Gmail' ? '#EA4335' : '#0078D4'} style={{ flexShrink: 0 }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '12px', color: 'var(--c-text)', fontWeight: '500', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{email.subject}</div>
                          <div style={{ fontSize: '11px', color: 'var(--c-text-3)' }}>
                            {email.matter ? email.matter.title : 'No matter'} · {email.source} · {fmt(email.suggestedMins)} suggested
                          </div>
                        </div>
                        {!alreadyLogged && (
                          <button
                            onClick={async () => {
                              const ok = await fetch('/api/timekeeping', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                  matterId: email.matter?.id || null,
                                  description: email.subject,
                                  minutes: email.suggestedMins,
                                  hourlyRate: 0,
                                  date: new Date().toISOString().split('T')[0],
                                }),
                              }).then(r => r.ok);
                              if (ok) {
                                setLoggedEmails(prev => new Set([...prev, email.id]));
                                load();
                              }
                            }}
                            style={{ fontSize: '11px', fontWeight: '500', background: 'var(--c-panel)', border: '1px solid var(--c-border)', borderRadius: '6px', padding: '4px 10px', color: 'var(--c-text-2)', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}
                          >
                            + Log {fmt(email.suggestedMins)}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}

          {/* Range filter */}
          <div style={{ display: 'flex', gap: '6px' }}>
            {RANGES.map(r => (
              <button key={r.value} onClick={() => setRange(r.value)} style={{ ...s.btn, background: range === r.value ? 'var(--c-active)' : 'transparent', border: '1px solid', borderColor: range === r.value ? 'var(--c-border-s)' : 'var(--c-border)', color: range === r.value ? 'var(--c-text)' : 'var(--c-text-3)', padding: '6px 14px', fontSize: '12px', fontWeight: range === r.value ? '500' : '400' }}>
                {r.label}
              </button>
            ))}
          </div>

          {/* Entries */}
          <div style={s.panel}>
            {loading ? (
              <div style={{ textAlign: 'center', color: 'var(--c-text-4)', padding: '40px', fontSize: '13px' }}>Loading…</div>
            ) : entries.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                <Clock size={28} color="#2a2a2a" style={{ marginBottom: '10px' }} />
                <div style={{ fontSize: '13px', color: 'var(--c-text-3)' }}>No time logged for this period</div>
                <div style={{ fontSize: '12px', color: 'var(--c-text-4)', marginTop: '4px' }}>Use the timer or log an entry manually</div>
              </div>
            ) : (
              <div>
                {Object.entries(grouped).map(([date, dayEntries]) => {
                  const dayMins = dayEntries.reduce((s, e) => s + e.minutes, 0);
                  const dayVal = dayEntries.reduce((s, e) => s + (e.minutes / 60) * e.hourly_rate, 0);
                  return (
                    <div key={date} style={{ marginBottom: '20px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '8px', paddingBottom: '6px', borderBottom: '1px solid #1a1a1a' }}>
                        <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--c-text-3)' }}>
                          {new Date(date + 'T12:00:00').toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}
                        </span>
                        <span style={{ fontSize: '12px', color: 'var(--c-text-3)' }}>
                          {fmt(dayMins)}{dayVal > 0 ? ` · ${fmtGBP(dayVal)}` : ''}
                        </span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {dayEntries.map(e => (
                          <div key={e.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: 'var(--c-bg)', borderRadius: '8px', gap: '12px' }}>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: '13px', color: 'var(--c-text)', marginBottom: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{e.description}</div>
                              {e.matter_title && <div style={{ fontSize: '11px', color: 'var(--c-text-3)' }}>{e.matter_title}</div>}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
                              <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: '13px', fontWeight: '500', color: 'var(--c-text-2)', fontFamily: 'monospace' }}>{fmt(e.minutes)}</div>
                                {e.hourly_rate > 0 && <div style={{ fontSize: '11px', color: 'var(--c-text-3)' }}>{fmtGBP((e.minutes / 60) * e.hourly_rate)}</div>}
                              </div>
                              <button onClick={() => deleteEntry(e.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--c-text-4)', padding: '4px', borderRadius: '4px', display: 'flex', alignItems: 'center' }}>
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
