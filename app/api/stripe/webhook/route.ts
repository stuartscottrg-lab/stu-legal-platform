import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db/pg';
import { v4 as uuid } from 'uuid';

export const dynamic = 'force-dynamic';

// Must read raw body for Stripe signature verification
export async function POST(req: NextRequest) {
  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 501 });
  }

  const Stripe = (await import('stripe')).default;
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

  const sig = req.headers.get('stripe-signature');
  const body = await req.text();

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, sig!, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (e: any) {
    console.error('Stripe webhook signature failed:', e.message);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as any;
        const userId = session.metadata?.userId;
        const planId = session.metadata?.planId;
        if (!userId || !planId) break;

        const existing = await sql`SELECT id FROM stripe_subscriptions WHERE user_id = ${userId}` as any[];
        if (existing.length > 0) {
          await sql`
            UPDATE stripe_subscriptions
            SET stripe_customer_id = ${session.customer}, stripe_subscription_id = ${session.subscription},
                plan = ${planId}, status = 'active', updated_at = NOW()
            WHERE user_id = ${userId}
          `;
        } else {
          await sql`
            INSERT INTO stripe_subscriptions (id, user_id, stripe_customer_id, stripe_subscription_id, plan, status)
            VALUES (${uuid()}, ${userId}, ${session.customer}, ${session.subscription}, ${planId}, 'active')
          `;
        }
        break;
      }

      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const sub = event.data.object as any;
        await sql`
          UPDATE stripe_subscriptions
          SET status = ${sub.status}, current_period_end = ${new Date(sub.current_period_end * 1000).toISOString()}, updated_at = NOW()
          WHERE stripe_subscription_id = ${sub.id}
        `;
        break;
      }
    }
  } catch (e) {
    console.error('Webhook handler error:', e);
  }

  return NextResponse.json({ received: true });
}
