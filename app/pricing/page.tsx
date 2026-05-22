'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Check, Zap, Building2, Briefcase, ArrowRight, Star } from 'lucide-react';

const PLANS = [
  {
    id: 'solo',
    name: 'Solo',
    price: { monthly: 29, annual: 24 },
    description: 'For individual solicitors and barristers',
    icon: <Briefcase size={20} />,
    color: '#2563eb',
    features: [
      'Unlimited AI conversations',
      'Document review & annotation',
      '5 active matters',
      'Voice input & responses',
      'Email drafting',
      'UK law knowledge base',
      'PDF & DOCX support',
      'Standard support',
    ],
    cta: 'Start free trial',
    priceId: process.env.NEXT_PUBLIC_STRIPE_SOLO_PRICE_ID,
    popular: false,
  },
  {
    id: 'firm',
    name: 'Firm',
    price: { monthly: 79, annual: 65 },
    description: 'For small firms and chambers up to 10 users',
    icon: <Building2 size={20} />,
    color: '#0a0a0a',
    features: [
      'Everything in Solo',
      'Up to 10 team members',
      'Unlimited active matters',
      'Custom playbooks',
      'Tabular document reviews',
      'Gmail & Outlook integration',
      'Time tracking & billing',
      'Law firm directory listing',
      'Priority support',
    ],
    cta: 'Start free trial',
    priceId: process.env.NEXT_PUBLIC_STRIPE_FIRM_PRICE_ID,
    popular: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: { monthly: null, annual: null },
    description: 'For large firms, barristers\' chambers & legal teams',
    icon: <Zap size={20} />,
    color: '#7c3aed',
    features: [
      'Everything in Firm',
      'Unlimited users',
      'Custom AI training on your precedents',
      'iManage / NetDocuments integration',
      'SSO & advanced security',
      'SLA & dedicated account manager',
      'On-premise deployment option',
      'Custom contract & billing',
    ],
    cta: 'Talk to us',
    priceId: null,
    popular: false,
  },
];

export default function PricingPage() {
  const [annual, setAnnual] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);

  async function handleCheckout(plan: typeof PLANS[0]) {
    if (plan.id === 'enterprise') {
      window.location.href = 'mailto:hello@stu-legal.com?subject=Enterprise enquiry';
      return;
    }
    setLoading(plan.id);
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId: plan.id, annual }),
      });
      const { url, error } = await res.json();
      if (error) throw new Error(error);
      window.location.href = url;
    } catch (e) {
      console.error(e);
      setLoading(null);
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--c-bg)', padding: '60px 24px 100px' }}>
      {/* Nav */}
      <div style={{ maxWidth: '1100px', margin: '0 auto 60px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link href="/" style={{ fontSize: '18px', fontWeight: '700', color: 'var(--c-text)', textDecoration: 'none', letterSpacing: '-0.4px', fontFamily: 'Georgia, serif' }}>Stu</Link>
        <Link href="/sign-in" style={{ fontSize: '13px', color: 'var(--c-text-2)', textDecoration: 'none', padding: '7px 16px', border: '1px solid var(--c-border)', borderRadius: '8px' }}>Sign in</Link>
      </div>

      {/* Header */}
      <div style={{ maxWidth: '600px', margin: '0 auto 48px', textAlign: 'center' }}>
        <h1 style={{ fontSize: '36px', fontWeight: '700', color: 'var(--c-text)', letterSpacing: '-0.8px', marginBottom: '12px', lineHeight: '1.2' }}>
          Simple, transparent pricing
        </h1>
        <p style={{ fontSize: '16px', color: 'var(--c-text-2)', lineHeight: '1.65' }}>
          14-day free trial. No credit card required. Cancel anytime.
        </p>

        {/* Billing toggle */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', marginTop: '24px', background: 'var(--c-panel)', border: '1px solid var(--c-border)', borderRadius: '30px', padding: '4px' }}>
          <button
            onClick={() => setAnnual(false)}
            style={{ padding: '6px 16px', borderRadius: '24px', border: 'none', background: !annual ? 'var(--c-card)' : 'transparent', fontSize: '13px', fontWeight: !annual ? '600' : '400', color: 'var(--c-text)', cursor: 'pointer', fontFamily: 'inherit', boxShadow: !annual ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', transition: 'all 0.15s' }}
          >Monthly</button>
          <button
            onClick={() => setAnnual(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 16px', borderRadius: '24px', border: 'none', background: annual ? 'var(--c-card)' : 'transparent', fontSize: '13px', fontWeight: annual ? '600' : '400', color: 'var(--c-text)', cursor: 'pointer', fontFamily: 'inherit', boxShadow: annual ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', transition: 'all 0.15s' }}
          >
            Annual
            <span style={{ fontSize: '10px', background: '#16a34a', color: '#fff', borderRadius: '10px', padding: '1px 7px', fontWeight: '600' }}>–17%</span>
          </button>
        </div>
      </div>

      {/* Plans */}
      <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '16px', alignItems: 'stretch' }}>
        {PLANS.map(plan => (
          <div
            key={plan.id}
            style={{
              background: plan.popular ? plan.color : 'var(--c-card)',
              border: plan.popular ? 'none' : '1px solid var(--c-border)',
              borderRadius: '20px', padding: '32px',
              display: 'flex', flexDirection: 'column',
              position: 'relative', overflow: 'hidden',
            }}
          >
            {plan.popular && (
              <div style={{ position: 'absolute', top: '20px', right: '20px', display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(255,255,255,0.15)', borderRadius: '20px', padding: '4px 10px', fontSize: '11px', color: '#fff', fontWeight: '600' }}>
                <Star size={10} fill="currentColor" /> Most popular
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <span style={{ color: plan.popular ? 'rgba(255,255,255,0.7)' : plan.color }}>{plan.icon}</span>
              <span style={{ fontSize: '16px', fontWeight: '700', color: plan.popular ? '#fff' : 'var(--c-text)' }}>{plan.name}</span>
            </div>

            <div style={{ marginBottom: '8px' }}>
              {plan.price.monthly !== null ? (
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                  <span style={{ fontSize: '38px', fontWeight: '700', color: plan.popular ? '#fff' : 'var(--c-text)', letterSpacing: '-1px' }}>
                    £{annual ? plan.price.annual : plan.price.monthly}
                  </span>
                  <span style={{ fontSize: '14px', color: plan.popular ? 'rgba(255,255,255,0.6)' : 'var(--c-text-3)' }}>/mo</span>
                </div>
              ) : (
                <div style={{ fontSize: '28px', fontWeight: '700', color: plan.popular ? '#fff' : 'var(--c-text)', letterSpacing: '-0.5px' }}>Custom</div>
              )}
            </div>

            <p style={{ fontSize: '13px', color: plan.popular ? 'rgba(255,255,255,0.65)' : 'var(--c-text-3)', marginBottom: '28px', lineHeight: '1.5' }}>
              {plan.description}
            </p>

            <button
              onClick={() => handleCheckout(plan)}
              disabled={loading === plan.id}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                width: '100%', padding: '12px',
                borderRadius: '12px', border: 'none',
                background: plan.popular ? '#fff' : 'var(--c-accent-bg)',
                color: plan.popular ? plan.color : 'var(--c-accent-text)',
                fontSize: '14px', fontWeight: '600',
                cursor: loading === plan.id ? 'default' : 'pointer',
                opacity: loading === plan.id ? 0.7 : 1,
                transition: 'all 0.15s', fontFamily: 'inherit',
                marginBottom: '24px',
              }}
            >
              {loading === plan.id ? 'Redirecting…' : plan.cta}
              {loading !== plan.id && <ArrowRight size={14} />}
            </button>

            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
              {plan.features.map(f => (
                <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: '9px', fontSize: '13px', color: plan.popular ? 'rgba(255,255,255,0.85)' : 'var(--c-text-2)' }}>
                  <Check size={14} style={{ flexShrink: 0, marginTop: '1px', color: plan.popular ? 'rgba(255,255,255,0.6)' : '#16a34a' }} />
                  {f}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Trust row */}
      <div style={{ maxWidth: '700px', margin: '60px auto 0', textAlign: 'center' }}>
        <p style={{ fontSize: '13px', color: 'var(--c-text-4)', marginBottom: '20px' }}>Trusted by solicitors across England & Wales</p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '32px', flexWrap: 'wrap' }}>
          {['SRA regulated', 'GDPR compliant', 'EU data residency', 'No training on your data'].map(t => (
            <span key={t} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--c-text-3)' }}>
              <Check size={12} color="#16a34a" /> {t}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
