'use client';
import { useState, useEffect, useCallback } from 'react';
import { Search, MapPin, Star, ExternalLink, Phone, Mail, Shield, ChevronRight, Briefcase, Plus, X } from 'lucide-react';

interface Firm {
  id: string;
  name: string;
  city: string;
  postcode: string;
  specialties: string;
  bio: string;
  email: string;
  phone: string;
  website: string;
  featured_rank: number;
  verified: boolean;
  plan: string;
}

const ALL_SPECIALTIES = [
  'Corporate', 'M&A', 'Private Equity', 'Family', 'Divorce', 'Child Arrangements',
  'Employment', 'Discrimination', 'Residential Property', 'Conveyancing', 'Commercial Property',
  'Criminal Defence', 'Fraud', 'Immigration', 'Asylum', 'Wills & Probate', 'Tax',
  'Litigation', 'Arbitration', 'Intellectual Property', 'Data Protection', 'Planning',
];

const ALL_CITIES = ['London', 'Manchester', 'Birmingham', 'Leeds', 'Bristol', 'Edinburgh', 'Cardiff', 'Liverpool', 'Sheffield', 'Nottingham'];

function StarRating({ n }: { n: number }) {
  return (
    <div style={{ display: 'flex', gap: '2px' }}>
      {[1, 2, 3, 4, 5].map(i => (
        <Star key={i} size={11} fill={i <= n ? '#f59e0b' : 'none'} color={i <= n ? '#f59e0b' : 'var(--c-border)'} />
      ))}
    </div>
  );
}

function FirmCard({ firm }: { firm: Firm }) {
  const specialties: string[] = typeof firm.specialties === 'string' ? JSON.parse(firm.specialties) : firm.specialties;
  const isFeatured = firm.featured_rank >= 2;

  return (
    <div style={{
      background: 'var(--c-card)',
      border: `1px solid ${isFeatured ? '#0a0a0a22' : 'var(--c-border)'}`,
      borderRadius: '14px', padding: '20px',
      position: 'relative', overflow: 'hidden',
      transition: 'border-color 0.15s, box-shadow 0.15s',
    }}
    onMouseOver={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 20px rgba(0,0,0,0.08)'; }}
    onMouseOut={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = 'none'; }}
    >
      {isFeatured && (
        <div style={{ position: 'absolute', top: 0, right: 0, background: '#0a0a0a', color: '#fff', fontSize: '10px', fontWeight: '600', padding: '4px 10px', borderBottomLeftRadius: '8px', letterSpacing: '0.05em' }}>
          FEATURED
        </div>
      )}

      <div style={{ display: 'flex', gap: '14px', marginBottom: '14px' }}>
        {/* Avatar */}
        <div style={{
          width: 48, height: 48, borderRadius: '12px', flexShrink: 0,
          background: `hsl(${firm.name.charCodeAt(0) * 7 % 360}, 25%, 90%)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '18px', fontWeight: '700', color: `hsl(${firm.name.charCodeAt(0) * 7 % 360}, 40%, 35%)`,
        }}>
          {firm.name[0]}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
            <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--c-text)' }}>{firm.name}</span>
            {firm.verified && (
              <span title="Verified firm">
                <Shield size={13} color="#2563eb" fill="rgba(37,99,235,0.15)" />
              </span>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: 'var(--c-text-3)' }}>
            <MapPin size={11} /> {firm.city}{firm.postcode ? `, ${firm.postcode}` : ''}
          </div>
        </div>
      </div>

      <p style={{ fontSize: '13px', color: 'var(--c-text-2)', lineHeight: '1.6', marginBottom: '14px' }}>
        {firm.bio?.slice(0, 160)}{(firm.bio?.length ?? 0) > 160 ? '…' : ''}
      </p>

      {/* Specialties */}
      <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', marginBottom: '16px' }}>
        {specialties.slice(0, 4).map(s => (
          <span key={s} style={{ fontSize: '11px', color: 'var(--c-text-3)', background: 'var(--c-panel)', border: '1px solid var(--c-border)', borderRadius: '20px', padding: '2px 8px' }}>
            {s}
          </span>
        ))}
        {specialties.length > 4 && (
          <span style={{ fontSize: '11px', color: 'var(--c-text-4)', padding: '2px 4px' }}>+{specialties.length - 4} more</span>
        )}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid var(--c-border)', paddingTop: '14px' }}>
        {firm.email && (
          <a href={`mailto:${firm.email}`} style={{ display: 'flex', alignItems: 'center', gap: '5px', flex: 1, justifyContent: 'center', padding: '8px', borderRadius: '8px', background: 'var(--c-accent-bg)', color: 'var(--c-accent-text)', fontSize: '12px', fontWeight: '600', textDecoration: 'none' }}>
            <Mail size={12} /> Contact
          </a>
        )}
        {firm.phone && (
          <a href={`tel:${firm.phone}`} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '8px 12px', borderRadius: '8px', background: 'var(--c-panel)', border: '1px solid var(--c-border)', color: 'var(--c-text-2)', fontSize: '12px', textDecoration: 'none' }}>
            <Phone size={12} />
          </a>
        )}
        {firm.website && (
          <a href={firm.website} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '8px 12px', borderRadius: '8px', background: 'var(--c-panel)', border: '1px solid var(--c-border)', color: 'var(--c-text-2)', fontSize: '12px', textDecoration: 'none' }}>
            <ExternalLink size={12} />
          </a>
        )}
      </div>
    </div>
  );
}

function ApplyModal({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState({ name: '', city: '', postcode: '', email: '', phone: '', website: '', bio: '', specialties: [] as string[] });
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const toggleSpecialty = (s: string) => {
    setForm(f => ({ ...f, specialties: f.specialties.includes(s) ? f.specialties.filter(x => x !== s) : [...f.specialties, s] }));
  };

  async function submit() {
    if (!form.name || !form.city || !form.email) return;
    setLoading(true);
    await fetch('/api/firms', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    setLoading(false);
    setDone(true);
  }

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100 }} />
      <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 101, background: 'var(--c-card)', border: '1px solid var(--c-border)', borderRadius: '16px', padding: '28px', width: '520px', maxWidth: '95vw', maxHeight: '85vh', overflowY: 'auto', boxShadow: '0 24px 64px rgba(0,0,0,0.3)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--c-text)' }}>List your firm</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--c-text-3)', display: 'flex' }}><X size={16} /></button>
        </div>

        {done ? (
          <div style={{ textAlign: 'center', padding: '32px' }}>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>✓</div>
            <div style={{ fontSize: '15px', fontWeight: '600', color: 'var(--c-text)', marginBottom: '6px' }}>Application received</div>
            <div style={{ fontSize: '13px', color: 'var(--c-text-3)', lineHeight: '1.6' }}>We'll review your listing and be in touch at {form.email} within 24 hours.</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[
              { key: 'name', label: 'Firm name', placeholder: 'Thornton & Blake Solicitors', required: true },
              { key: 'city', label: 'City', placeholder: 'London', required: true },
              { key: 'postcode', label: 'Postcode', placeholder: 'EC2A 4PH' },
              { key: 'email', label: 'Contact email', placeholder: 'enquiries@yourfirm.co.uk', required: true },
              { key: 'phone', label: 'Phone number', placeholder: '020 7946 0821' },
              { key: 'website', label: 'Website', placeholder: 'https://yourfirm.co.uk' },
            ].map(field => (
              <div key={field.key}>
                <label style={{ fontSize: '12px', fontWeight: '500', color: 'var(--c-text-2)', display: 'block', marginBottom: '5px' }}>
                  {field.label} {field.required && <span style={{ color: '#ef4444' }}>*</span>}
                </label>
                <input
                  type="text"
                  value={(form as any)[field.key]}
                  onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))}
                  placeholder={field.placeholder}
                  style={{ width: '100%', background: 'var(--c-panel)', border: '1px solid var(--c-border)', borderRadius: '8px', padding: '9px 12px', fontSize: '13px', color: 'var(--c-text)', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
                />
              </div>
            ))}
            <div>
              <label style={{ fontSize: '12px', fontWeight: '500', color: 'var(--c-text-2)', display: 'block', marginBottom: '5px' }}>About the firm</label>
              <textarea
                value={form.bio}
                onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
                placeholder="Brief description of your firm and what you do best…"
                rows={3}
                style={{ width: '100%', background: 'var(--c-panel)', border: '1px solid var(--c-border)', borderRadius: '8px', padding: '9px 12px', fontSize: '13px', color: 'var(--c-text)', outline: 'none', fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: '500', color: 'var(--c-text-2)', display: 'block', marginBottom: '8px' }}>Practice areas</label>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {ALL_SPECIALTIES.map(s => (
                  <button
                    key={s}
                    onClick={() => toggleSpecialty(s)}
                    style={{ fontSize: '11px', padding: '4px 10px', borderRadius: '20px', border: `1px solid ${form.specialties.includes(s) ? '#0a0a0a' : 'var(--c-border)'}`, background: form.specialties.includes(s) ? '#0a0a0a' : 'transparent', color: form.specialties.includes(s) ? '#fff' : 'var(--c-text-3)', cursor: 'pointer', fontFamily: 'inherit' }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ paddingTop: '8px', borderTop: '1px solid var(--c-border)', display: 'flex', gap: '8px' }}>
              <button onClick={onClose} style={{ flex: 1, padding: '10px', borderRadius: '8px', background: 'none', border: '1px solid var(--c-border)', fontSize: '13px', color: 'var(--c-text-2)', cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
              <button onClick={submit} disabled={loading || !form.name || !form.city || !form.email} style={{ flex: 2, padding: '10px', borderRadius: '8px', background: 'var(--c-accent-bg)', color: 'var(--c-accent-text)', border: 'none', fontSize: '13px', fontWeight: '600', cursor: loading ? 'default' : 'pointer', opacity: (loading || !form.name || !form.city || !form.email) ? 0.6 : 1, fontFamily: 'inherit' }}>
                {loading ? 'Submitting…' : 'Submit application'}
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default function FindFirmsPage() {
  const [firms, setFirms] = useState<Firm[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [city, setCity] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [showApply, setShowApply] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    else { if (city) params.set('city', city); if (specialty) params.set('specialty', specialty); }
    const data = await fetch(`/api/firms?${params}`).then(r => r.json()).catch(() => []);
    setFirms(Array.isArray(data) ? data : []);
    setLoading(false);
  }, [query, city, specialty]);

  useEffect(() => { load(); }, [load]);

  const featured = firms.filter(f => f.featured_rank >= 2);
  const standard = firms.filter(f => f.featured_rank < 2);

  return (
    <div style={{ padding: '32px 40px 80px', maxWidth: '1000px' }}>
      {showApply && <ApplyModal onClose={() => { setShowApply(false); load(); }} />}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: '600', color: 'var(--c-text)', marginBottom: '6px', letterSpacing: '-0.3px' }}>Find a Firm</h1>
          <p style={{ fontSize: '13px', color: 'var(--c-text-2)' }}>Connect with specialist solicitors across England & Wales.</p>
        </div>
        <button
          onClick={() => setShowApply(true)}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 16px', borderRadius: '9px', background: 'var(--c-accent-bg)', color: 'var(--c-accent-text)', border: 'none', fontSize: '13px', fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit' }}
        >
          <Plus size={13} /> List your firm
        </button>
      </div>

      {/* Search */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '200px', position: 'relative' }}>
          <Search size={14} color="var(--c-text-4)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search by name, city, or specialism…"
            style={{ width: '100%', background: 'var(--c-card)', border: '1px solid var(--c-border)', borderRadius: '10px', padding: '10px 12px 10px 36px', fontSize: '13px', color: 'var(--c-text)', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
          />
        </div>
        {!query && (
          <>
            <select value={city} onChange={e => setCity(e.target.value)} style={{ background: 'var(--c-card)', border: '1px solid var(--c-border)', borderRadius: '10px', padding: '10px 32px 10px 12px', fontSize: '13px', color: city ? 'var(--c-text)' : 'var(--c-text-3)', outline: 'none', cursor: 'pointer', fontFamily: 'inherit', appearance: 'none', backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%23999' stroke-width='2.5'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'calc(100% - 10px) center' }}>
              <option value="">All cities</option>
              {ALL_CITIES.map(c => <option key={c}>{c}</option>)}
            </select>
            <select value={specialty} onChange={e => setSpecialty(e.target.value)} style={{ background: 'var(--c-card)', border: '1px solid var(--c-border)', borderRadius: '10px', padding: '10px 32px 10px 12px', fontSize: '13px', color: specialty ? 'var(--c-text)' : 'var(--c-text-3)', outline: 'none', cursor: 'pointer', fontFamily: 'inherit', appearance: 'none', backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%23999' stroke-width='2.5'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'calc(100% - 10px) center' }}>
              <option value="">All practice areas</option>
              {ALL_SPECIALTIES.map(s => <option key={s}>{s}</option>)}
            </select>
          </>
        )}
      </div>

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: '14px' }}>
          {[1, 2, 3, 4].map(i => (
            <div key={i} style={{ background: 'var(--c-card)', border: '1px solid var(--c-border)', borderRadius: '14px', padding: '20px', height: '220px', animation: 'pulse 1.5s ease-in-out infinite' }}>
              <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}`}</style>
            </div>
          ))}
        </div>
      ) : firms.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px', border: '1px dashed var(--c-border)', borderRadius: '14px' }}>
          <Briefcase size={32} color="var(--c-text-4)" style={{ marginBottom: '12px' }} />
          <div style={{ fontSize: '14px', color: 'var(--c-text-2)', marginBottom: '6px' }}>No firms found</div>
          <div style={{ fontSize: '12px', color: 'var(--c-text-4)' }}>Try different search terms or browse all firms.</div>
        </div>
      ) : (
        <>
          {/* Featured */}
          {featured.length > 0 && !query && !city && !specialty && (
            <div style={{ marginBottom: '28px' }}>
              <div style={{ fontSize: '11px', fontWeight: '600', color: 'var(--c-text-4)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Star size={11} fill="currentColor" color="#f59e0b" /> Featured firms
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: '12px' }}>
                {featured.map(f => <FirmCard key={f.id} firm={f} />)}
              </div>
            </div>
          )}

          {/* All / Standard */}
          {(standard.length > 0 || query || city || specialty) && (
            <div>
              {featured.length > 0 && !query && !city && !specialty && (
                <div style={{ fontSize: '11px', fontWeight: '600', color: 'var(--c-text-4)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '12px' }}>
                  All firms · {standard.length} result{standard.length !== 1 ? 's' : ''}
                </div>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: '12px' }}>
                {(query || city || specialty ? firms : standard).map(f => <FirmCard key={f.id} firm={f} />)}
              </div>
            </div>
          )}

          {/* Advertise CTA */}
          <div style={{ marginTop: '32px', padding: '24px', background: 'var(--c-panel)', border: '1px solid var(--c-border)', borderRadius: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--c-text)', marginBottom: '4px' }}>Get your firm featured</div>
              <div style={{ fontSize: '13px', color: 'var(--c-text-3)' }}>Appear at the top of searches and reach clients using Stu across the UK.</div>
            </div>
            <button onClick={() => setShowApply(true)} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 18px', borderRadius: '9px', background: '#0a0a0a', color: '#fff', border: 'none', fontSize: '13px', fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0 }}>
              Get listed <ChevronRight size={13} />
            </button>
          </div>
        </>
      )}
    </div>
  );
}
