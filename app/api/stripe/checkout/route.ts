import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

export const dynamic = 'force-dynamic';

const PRICE_IDS: Record<string, { monthly: string; annual: string }> = {
  solo: {
    monthly: process.env.STRIPE_SOLO_MONTHLY_PRICE_ID ?? '',
    annual: process.env.STRIPE_SOLO_ANNUAL_PRICE_ID ?? '',
  },
  firm: {
    monthly: process.env.STRIPE_FIRM_MONTHLY_PRICE_ID ?? '',
    annual: process.env.STRIPE_FIRM_ANNUAL_PRICE_ID ?? '',
  },
};

export async function POST(req: NextRequest) {
  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 501 });
  }

  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { planId, annual } = await req.json();
  const prices = PRICE_IDS[planId];
  if (!prices) return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });

  const priceId = annual ? prices.annual : prices.monthly;
  if (!priceId) return NextResponse.json({ error: 'Price ID not configured for this plan' }, { status: 501 });

  const Stripe = (await import('stripe')).default;
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

  const baseUrl = process.env.NEXTAUTH_URL || `https://${req.headers.get('host')}`;

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${baseUrl}/?checkout=success`,
    cancel_url: `${baseUrl}/pricing?checkout=cancelled`,
    metadata: { userId, planId },
    subscription_data: { metadata: { userId, planId } },
    allow_promotion_codes: true,
    billing_address_collection: 'auto',
  });

  return NextResponse.json({ url: session.url });
}
