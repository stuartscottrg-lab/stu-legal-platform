'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';

/* ─── Tiny helpers ─────────────────────────────────────── */
function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } }, { threshold });
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, visible };
}

/* ─── App window mockup ─────────────────────────────────── */
function AppMockup() {
  return (
    <div style={{
      background: '#111117',
      borderRadius: '12px',
      border: '1px solid rgba(255,255,255,0.08)',
      boxShadow: '0 40px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)',
      overflow: 'hidden',
      width: '100%',
      maxWidth: '620px',
    }}>
      {/* Title bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', background: '#0e0e14' }}>
        <span style={{ width: 11, height: 11, borderRadius: '50%', background: '#ff5f57' }} />
        <span style={{ width: 11, height: 11, borderRadius: '50%', background: '#febc2e' }} />
        <span style={{ width: 11, height: 11, borderRadius: '50%', background: '#28c840' }} />
        <span style={{ marginLeft: '10px', fontSize: '11px', color: '#444', fontFamily: 'system-ui' }}>Stu — Legal Assistant</span>
      </div>
      {/* Sidebar + content */}
      <div style={{ display: 'flex', height: '340px' }}>
        {/* Sidebar */}
        <div style={{ width: '160px', borderRight: '1px solid rgba(255,255,255,0.05)', padding: '12px 8px', flexShrink: 0 }}>
          {['Assistant', 'Matters', 'Workflows', 'Extract', 'Research', 'Library'].map((item, i) => (
            <div key={item} style={{
              padding: '6px 10px', borderRadius: '6px', fontSize: '12px', marginBottom: '2px',
              background: i === 0 ? 'rgba(255,255,255,0.07)' : 'transparent',
              color: i === 0 ? '#e0e0e0' : '#555',
            }}>{item}</div>
          ))}
        </div>
        {/* Chat area */}
        <div style={{ flex: 1, padding: '16px', overflowY: 'hidden', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* AI message */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
            <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#1d3a6b', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', color: '#60a5fa', fontWeight: 700 }}>S</div>
            <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '8px', padding: '8px 10px', fontSize: '11px', color: '#ccc', lineHeight: 1.5, border: '1px solid rgba(255,255,255,0.06)' }}>
              I've reviewed the NDA. The limitation of liability clause is missing — this is a <span style={{ color: '#f87171' }}>RED flag</span>. The IP assignment on clause 7.2 also needs attention.
            </div>
          </div>
          {/* User message */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', justifyContent: 'flex-end' }}>
            <div style={{ background: 'rgba(37,99,235,0.15)', borderRadius: '8px', padding: '8px 10px', fontSize: '11px', color: '#93c5fd', lineHeight: 1.5, border: '1px solid rgba(37,99,235,0.2)' }}>
              Can you draft a redline for clause 7.2?
            </div>
          </div>
          {/* AI message 2 */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
            <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#1d3a6b', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', color: '#60a5fa', fontWeight: 700 }}>S</div>
            <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '8px', padding: '8px 10px', fontSize: '11px', color: '#ccc', lineHeight: 1.5, border: '1px solid rgba(255,255,255,0.06)' }}>
              Here's the proposed redline for clause 7.2. Pre-existing IP is now expressly carved out...
              <div style={{ marginTop: '6px', height: '3px', borderRadius: '2px', background: 'linear-gradient(90deg, #2563eb 60%, rgba(37,99,235,0.1) 100%)', animation: 'shimmer 1.8s ease-in-out infinite' }} />
            </div>
          </div>
        </div>
      </div>
      {/* Input bar */}
      <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.05)', background: '#0e0e14', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '7px 12px', fontSize: '11px', color: '#444' }}>Ask Stu anything about your matter…</div>
        <div style={{ width: 28, height: 28, borderRadius: '6px', background: 'rgba(37,99,235,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M12 19V5M5 12l7-7 7 7" /></svg>
        </div>
      </div>
    </div>
  );
}

/* ─── Feature card ─────────────────────────────────────── */
function FeatureCard({ title, desc, tag, wide }: { title: string; desc: string; tag: string; wide?: boolean }) {
  const { ref, visible } = useInView();
  return (
    <div ref={ref} style={{
      background: 'rgba(255,255,255,0.025)',
      border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: '16px',
      padding: '28px 28px 24px',
      gridColumn: wide ? 'span 2' : 'span 1',
      transition: 'opacity 0.6s ease, transform 0.6s ease',
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(20px)',
    }}>
      <div style={{ fontSize: '10px', fontWeight: '600', color: '#2563eb', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '12px' }}>{tag}</div>
      <div style={{ fontSize: '17px', fontWeight: '600', color: '#e8e8e8', marginBottom: '8px', letterSpacing: '-0.3px' }}>{title}</div>
      <div style={{ fontSize: '13px', color: '#555', lineHeight: '1.65' }}>{desc}</div>
    </div>
  );
}

/* ─── Marquee strip ────────────────────────────────────── */
function MarqueeStrip() {
  const items = [
    'NDA Review', 'Matter Management', 'Legal Research', 'Employment Law',
    'Document Analysis', 'Time Recording', 'Contract Redlines', 'SRA Compliance',
    'IP Ownership', 'Due Diligence', 'Lease Review', 'M&A Documents',
  ];
  const doubled = [...items, ...items];
  return (
    <div style={{ overflow: 'hidden', borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '14px 0', position: 'relative' }}>
      <div style={{ display: 'flex', gap: '40px', animation: 'marquee 32s linear infinite', width: 'max-content' }}>
        {doubled.map((item, i) => (
          <span key={i} style={{ fontSize: '12px', color: '#3a3a3a', fontWeight: '500', letterSpacing: '0.05em', textTransform: 'uppercase', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ width: 4, height: 4, borderRadius: '50%', background: '#2563eb', opacity: 0.6, display: 'inline-block' }} />
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ─── Demo modal + button ───────────────────────────────── */
type FormState = 'idle' | 'loading' | 'success' | 'error';

function DemoModal({ onClose }: { onClose: () => void }) {
  const [name,  setName]  = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [firm,  setFirm]  = useState('');
  const [state, setState] = useState<FormState>('idle');
  const [err,   setErr]   = useState('');

  // Close on Escape
  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [onClose]);

  // Prevent body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;
    setState('loading');
    setErr('');
    try {
      const res = await fetch('/api/demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone, firm }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Something went wrong');
      setState('success');
    } catch (e: unknown) {
      setState('error');
      setErr(e instanceof Error ? e.message : 'Something went wrong. Please try again.');
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 14px', borderRadius: '9px',
    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
    color: '#f0f0f0', fontSize: '14px', outline: 'none',
    fontFamily: 'inherit', boxSizing: 'border-box', transition: 'border-color 0.15s',
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '24px', animation: 'fadeUp 0.2s ease both',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#111113', border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '18px', padding: '36px', width: '100%', maxWidth: '420px',
          position: 'relative', boxShadow: '0 24px 80px rgba(0,0,0,0.8)',
        }}
      >
        {/* Close */}
        <button onClick={onClose} style={{
          position: 'absolute', top: '16px', right: '16px',
          background: 'none', border: 'none', cursor: 'pointer',
          color: '#555', padding: '4px', borderRadius: '6px',
          display: 'flex', transition: 'color 0.15s',
        }}
          onMouseEnter={e => (e.currentTarget.style.color = '#999')}
          onMouseLeave={e => (e.currentTarget.style.color = '#555')}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>

        {state === 'success' ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{
              width: '52px', height: '52px', borderRadius: '14px',
              background: 'rgba(22,163,74,0.15)', border: '1px solid rgba(22,163,74,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px',
            }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <div style={{ fontSize: '18px', fontWeight: '700', color: '#f4f4f5', marginBottom: '10px' }}>Request received</div>
            <p style={{ fontSize: '14px', color: '#52525b', lineHeight: '1.7', margin: '0 0 24px' }}>
              Thanks {name.split(' ')[0]}! We'll be in touch shortly to arrange your demo.
            </p>
            <button onClick={onClose} style={{
              padding: '10px 24px', borderRadius: '9px', border: 'none',
              background: 'rgba(255,255,255,0.08)', color: '#a1a1aa',
              fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit',
            }}>Close</button>
          </div>
        ) : (
          <>
            <div style={{ marginBottom: '24px' }}>
              <div style={{ fontSize: '18px', fontWeight: '700', color: '#f4f4f5', marginBottom: '6px' }}>Book a demo</div>
              <div style={{ fontSize: '13px', color: '#52525b' }}>30 minutes · We'll reach out to confirm a time.</div>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#71717a', marginBottom: '6px', fontWeight: '500' }}>
                  Full name <span style={{ color: '#3f3f46' }}>*</span>
                </label>
                <input
                  type="text" value={name} onChange={e => setName(e.target.value)}
                  required placeholder="Jane Smith" style={inputStyle}
                  onFocus={e => (e.target.style.borderColor = 'rgba(37,99,235,0.5)')}
                  onBlur={e =>  (e.target.style.borderColor = 'rgba(255,255,255,0.1)')}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#71717a', marginBottom: '6px', fontWeight: '500' }}>
                  Email <span style={{ color: '#3f3f46' }}>*</span>
                </label>
                <input
                  type="email" value={email} onChange={e => setEmail(e.target.value)}
                  required placeholder="jane@chambers.co.uk" style={inputStyle}
                  onFocus={e => (e.target.style.borderColor = 'rgba(37,99,235,0.5)')}
                  onBlur={e =>  (e.target.style.borderColor = 'rgba(255,255,255,0.1)')}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#71717a', marginBottom: '6px', fontWeight: '500' }}>
                  Contact number
                </label>
                <input
                  type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                  placeholder="+44 7700 900000" style={inputStyle}
                  onFocus={e => (e.target.style.borderColor = 'rgba(37,99,235,0.5)')}
                  onBlur={e =>  (e.target.style.borderColor = 'rgba(255,255,255,0.1)')}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#71717a', marginBottom: '6px', fontWeight: '500' }}>
                  Firm name
                </label>
                <input
                  type="text" value={firm} onChange={e => setFirm(e.target.value)}
                  placeholder="Smith & Partners LLP" style={inputStyle}
                  onFocus={e => (e.target.style.borderColor = 'rgba(37,99,235,0.5)')}
                  onBlur={e =>  (e.target.style.borderColor = 'rgba(255,255,255,0.1)')}
                />
              </div>

              {state === 'error' && (
                <div style={{ padding: '10px 14px', background: 'rgba(220,38,38,0.1)', border: '1px solid rgba(220,38,38,0.2)', borderRadius: '8px', fontSize: '13px', color: '#f87171' }}>
                  {err}
                </div>
              )}

              <button
                type="submit"
                disabled={state === 'loading'}
                style={{
                  marginTop: '4px', padding: '12px', borderRadius: '10px', border: 'none',
                  background: state === 'loading' ? 'rgba(255,255,255,0.08)' : '#fff',
                  color: state === 'loading' ? '#555' : '#09090b',
                  fontSize: '14px', fontWeight: '600', cursor: state === 'loading' ? 'default' : 'pointer',
                  fontFamily: 'inherit', transition: 'all 0.15s',
                }}
              >
                {state === 'loading' ? 'Sending…' : 'Request a demo'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

function DemoButton({ large, onOpen }: { large?: boolean; onOpen: () => void }) {
  const [hover, setHover] = useState(false);
  return (
    <button
      onClick={onOpen}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: '9px',
        background: hover ? '#e5e5e5' : '#fff',
        color: '#09090b',
        padding: large ? '14px 28px' : '10px 20px',
        borderRadius: '10px',
        fontSize: large ? '15px' : '13px',
        fontWeight: '600',
        border: 'none', cursor: 'pointer',
        fontFamily: 'inherit',
        transition: 'all 0.2s',
        boxShadow: hover ? '0 6px 20px rgba(0,0,0,0.4)' : '0 1px 4px rgba(0,0,0,0.3)',
        transform: hover ? 'translateY(-1px)' : 'none',
      }}>
      <svg width={large ? 16 : 14} height={large ? 16 : 14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
      </svg>
      Book a demo
    </button>
  );
}

/* ─── Page ─────────────────────────────────────────────── */
export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const [demoOpen, setDemoOpen] = useState(false);
  const { ref: featRef, visible: featVisible } = useInView();
  const { ref: dlRef, visible: dlVisible } = useInView();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div style={{ background: '#09090b', minHeight: '100dvh', color: '#f0f0f0', fontFamily: 'system-ui, -apple-system, sans-serif', overflowX: 'hidden' }}>
      {demoOpen && <DemoModal onClose={() => setDemoOpen(false)} />}
      <style>{`
        @keyframes marquee { from { transform: translateX(0) } to { transform: translateX(-50%) } }
        @keyframes shimmer { 0%,100% { opacity:0.4 } 50% { opacity:1 } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(24px) } to { opacity:1; transform:translateY(0) } }
        @keyframes glow { 0%,100% { opacity:0.5 } 50% { opacity:0.8 } }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::selection { background: rgba(37,99,235,0.3); }
        a { color: inherit; }
      `}</style>

      {/* ── Nav ── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        padding: '16px 32px',
        backdropFilter: scrolled ? 'blur(12px)' : 'none',
        background: scrolled ? 'rgba(9,9,11,0.85)' : 'transparent',
        borderBottom: scrolled ? '1px solid rgba(255,255,255,0.05)' : 'none',
        transition: 'all 0.3s',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ fontSize: '20px', fontWeight: '700', letterSpacing: '-0.5px', fontFamily: 'Georgia, serif' }}>Stu</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <a href="#features" style={{ fontSize: '13px', color: '#555', textDecoration: 'none', transition: 'color 0.15s' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#ccc')} onMouseLeave={e => (e.currentTarget.style.color = '#555')}>Features</a>
          <DemoButton onOpen={() => setDemoOpen(true)} />
        </div>
      </nav>

      {/* ── Radial glow ── */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
        background: 'radial-gradient(ellipse 70% 50% at 20% -5%, rgba(37,99,235,0.10) 0%, transparent 70%)',
        animation: 'glow 6s ease-in-out infinite',
      }} />

      {/* ── Hero ── */}
      <section style={{ position: 'relative', zIndex: 1, minHeight: '100dvh', display: 'flex', alignItems: 'center', padding: '120px 64px 80px' }}>
        <div style={{ maxWidth: '1280px', width: '100%', margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '80px', alignItems: 'center' }}>

          {/* Left */}
          <div style={{ animation: 'fadeUp 0.8s ease both' }}>
            <div style={{ fontSize: '11px', fontWeight: '600', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#2563eb', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: 20, height: 1, background: '#2563eb', display: 'inline-block' }} />
              Invitation only
            </div>
            <h1 style={{ fontSize: 'clamp(2.4rem, 4vw, 3.6rem)', fontWeight: '700', letterSpacing: '-1.5px', lineHeight: 1.08, color: '#f4f4f5', marginBottom: '24px' }}>
              AI legal assistant.<br />
              <span style={{ color: '#3f3f46' }}>Built for UK firms.</span>
            </h1>
            <p style={{ fontSize: '16px', color: '#52525b', lineHeight: '1.7', maxWidth: '440px', marginBottom: '40px' }}>
              Stu handles drafting, research, and document review — so your solicitors can focus on clients. Available as a native desktop app for macOS and Windows.
            </p>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
              <DemoButton large onOpen={() => setDemoOpen(true)} />
            </div>

            <div style={{ marginTop: '48px', display: 'flex', gap: '32px' }}>
              {[['UK law', 'Specialised'], ['SRA', 'Compliant'], ['UK GDPR', 'Certified']].map(([label, sub]) => (
                <div key={label}>
                  <div style={{ fontSize: '15px', fontWeight: '700', color: '#e4e4e7', letterSpacing: '-0.3px' }}>{label}</div>
                  <div style={{ fontSize: '11px', color: '#3f3f46', marginTop: '2px' }}>{sub}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right — app mockup */}
          <div style={{ animation: 'fadeUp 0.8s 0.15s ease both', position: 'relative' }}>
            <div style={{
              position: 'absolute', inset: '-40px', borderRadius: '20px',
              background: 'radial-gradient(ellipse at 50% 50%, rgba(37,99,235,0.08) 0%, transparent 70%)',
              pointerEvents: 'none',
            }} />
            <AppMockup />
          </div>
        </div>
      </section>

      {/* ── Marquee ── */}
      <MarqueeStrip />

      {/* ── Features ── */}
      <section id="features" style={{ position: 'relative', zIndex: 1, padding: '100px 64px' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <div ref={featRef} style={{ marginBottom: '56px', transition: 'opacity 0.7s, transform 0.7s', opacity: featVisible ? 1 : 0, transform: featVisible ? 'translateY(0)' : 'translateY(20px)' }}>
            <div style={{ fontSize: '11px', fontWeight: '600', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#2563eb', marginBottom: '16px' }}>What Stu does</div>
            <h2 style={{ fontSize: 'clamp(1.8rem, 3vw, 2.6rem)', fontWeight: '700', letterSpacing: '-1px', color: '#f4f4f5', maxWidth: '520px', lineHeight: 1.15 }}>
              Every tool a fee earner needs. Nothing they don't.
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
            <FeatureCard wide tag="AI Assistant" title="Drafts, researches, and reviews" desc="Ask Stu anything about UK law. Get structured research notes, risk flags, and redline suggestions — grounded in English and Welsh jurisdiction." />
            <FeatureCard tag="Matters" title="Matter management" desc="Create, organise, and archive matters. Every document, note, and conversation tied to the right client file." />
            <FeatureCard tag="Documents" title="Document analysis" desc="Upload a PDF or DOCX. Stu extracts the text, flags risky clauses, and lets you ask questions directly about the document." />
            <FeatureCard tag="Workflows" title="13 pre-built legal workflows" desc="NDA review, credit agreement summary, M&A due diligence, SRA compliance checks and more — output in under 60 seconds." />
            <FeatureCard tag="Extract" title="Multi-document extraction" desc="Extract structured data from up to 20 contracts simultaneously into a table. Export as CSV for reporting." />
            <FeatureCard tag="Time" title="Time recording" desc="Log time against matters with a built-in timer. AI-assisted time descriptions so you never miss a billable minute." />
          </div>
        </div>
      </section>

      {/* ── Built as an app ── */}
      <section style={{ position: 'relative', zIndex: 1, padding: '80px 64px', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '80px', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '11px', fontWeight: '600', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#2563eb', marginBottom: '16px' }}>Desktop-first</div>
            <h2 style={{ fontSize: 'clamp(1.8rem, 3vw, 2.6rem)', fontWeight: '700', letterSpacing: '-1px', color: '#f4f4f5', lineHeight: 1.15, marginBottom: '20px' }}>
              An app, not<br />a browser tab.
            </h2>
            <p style={{ fontSize: '15px', color: '#52525b', lineHeight: '1.7', marginBottom: '28px' }}>
              Stu is a native desktop application for macOS and Windows. Your session persists between launches. No browser, no tab management, no lost context.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                ['Persistent login', 'Stay signed in across launches — no re-authentication every session'],
                ['Native window', 'Dock, taskbar, fullscreen, and system tray — it behaves like a real app'],
                ['Auto-updates', 'Updates ship silently in the background. You\'re always on the latest version'],
              ].map(([title, desc]) => (
                <div key={title} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#2563eb', marginTop: '6px', flexShrink: 0 }} />
                  <div>
                    <span style={{ fontSize: '13px', fontWeight: '600', color: '#a1a1aa' }}>{title}</span>
                    <span style={{ fontSize: '13px', color: '#3f3f46' }}> — {desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Platform badges */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            {[
              ['macOS', 'Apple Silicon + Intel', '12 Monterey +'],
              ['Windows', '64-bit', 'Windows 10 +'],
              ['Secure', 'Code signed', 'Verified publisher'],
              ['Updates', 'Auto-update', 'Always current'],
            ].map(([title, sub, badge]) => (
              <div key={title} style={{
                background: 'rgba(255,255,255,0.025)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: '12px',
                padding: '20px',
              }}>
                <div style={{ fontSize: '14px', fontWeight: '600', color: '#e4e4e7', marginBottom: '4px' }}>{title}</div>
                <div style={{ fontSize: '12px', color: '#52525b' }}>{sub}</div>
                <div style={{ fontSize: '10px', color: '#2563eb', marginTop: '8px', fontWeight: '600', letterSpacing: '0.05em' }}>{badge}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Book a Demo ── */}
      <section id="demo" style={{ position: 'relative', zIndex: 1, padding: '120px 64px', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
        {/* Subtle glow behind the card */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'radial-gradient(ellipse 60% 60% at 50% 50%, rgba(37,99,235,0.06) 0%, transparent 70%)',
        }} />
        <div ref={dlRef} style={{
          maxWidth: '680px', margin: '0 auto', textAlign: 'center',
          transition: 'opacity 0.7s, transform 0.7s',
          opacity: dlVisible ? 1 : 0, transform: dlVisible ? 'translateY(0)' : 'translateY(20px)',
        }}>
          {/* Icon */}
          <div style={{
            width: '52px', height: '52px', borderRadius: '14px',
            background: 'rgba(37,99,235,0.12)', border: '1px solid rgba(37,99,235,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 28px',
          }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
          </div>

          <h2 style={{ fontSize: 'clamp(1.8rem, 3vw, 2.6rem)', fontWeight: '700', letterSpacing: '-0.8px', color: '#f4f4f5', marginBottom: '16px', lineHeight: 1.1 }}>
            See Stu in action
          </h2>
          <p style={{ fontSize: '15px', color: '#52525b', lineHeight: '1.75', maxWidth: '480px', margin: '0 auto 40px' }}>
            We work with UK law firms on an invitation basis. Book a 30-minute demo and we'll show you exactly how Stu fits into your existing workflows.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
            <DemoButton large onOpen={() => setDemoOpen(true)} />
            <p style={{ fontSize: '12px', color: '#3f3f46', margin: 0 }}>
              30 minutes · No commitment · Already invited?{' '}
              <Link href="/sign-in" style={{ color: '#52525b', textDecoration: 'underline', textUnderlineOffset: '3px' }}>Sign in here</Link>
            </p>
          </div>

          {/* Trust row */}
          <div style={{ marginTop: '56px', display: 'flex', justifyContent: 'center', gap: '40px', flexWrap: 'wrap' }}>
            {[
              ['SRA compliant', ''], ['UK GDPR', ''], ['SOC 2 aligned', ''],
            ].map(([label]) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                <span style={{ fontSize: '12px', color: '#3f3f46', fontWeight: '500' }}>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.04)', padding: '32px 64px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 1 }}>
        <div style={{ fontSize: '13px', fontWeight: '700', fontFamily: 'Georgia, serif', letterSpacing: '-0.3px' }}>Stu</div>
        <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
          {[['Terms', '/terms'], ['Privacy', '/privacy'], ['Security', '/security']].map(([label, href]) => (
            <a key={label} href={href} style={{ fontSize: '12px', color: '#27272a', textDecoration: 'none', transition: 'color 0.15s' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#71717a')}
              onMouseLeave={e => (e.currentTarget.style.color = '#27272a')}>{label}</a>
          ))}
          <span style={{ fontSize: '12px', color: '#1c1c1f' }}>© 2026 Stu Legal Ltd</span>
        </div>
      </footer>
    </div>
  );
}
