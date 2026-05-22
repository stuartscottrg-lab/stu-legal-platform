import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db/pg';

export const dynamic = 'force-dynamic';

async function checkDatabase() {
  try {
    const start = Date.now();
    await sql`SELECT 1`;
    return { ok: true, latencyMs: Date.now() - start };
  } catch (e: any) {
    return { ok: false, error: e.message };
  }
}

async function checkAI() {
  try {
    if (!process.env.ANTHROPIC_API_KEY) return { ok: false, error: 'API key not set' };
    const start = Date.now();
    const res = await fetch('https://api.anthropic.com/v1/models', {
      headers: { 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
    });
    return { ok: res.ok, latencyMs: Date.now() - start, status: res.status };
  } catch (e: any) {
    return { ok: false, error: e.message };
  }
}

async function checkStripe() {
  try {
    if (!process.env.STRIPE_SECRET_KEY) return { ok: false, error: 'Not configured' };
    const start = Date.now();
    const res = await fetch('https://api.stripe.com/v1/charges?limit=1', {
      headers: { Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}` },
    });
    return { ok: res.ok, latencyMs: Date.now() - start };
  } catch (e: any) {
    return { ok: false, error: e.message };
  }
}

async function checkVoyage() {
  try {
    if (!process.env.VOYAGE_API_KEY) return { ok: false, error: 'Not configured' };
    const start = Date.now();
    const res = await fetch('https://api.voyageai.com/v1/embeddings', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${process.env.VOYAGE_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'voyage-law-2', input: ['health check'] }),
    });
    return { ok: res.ok, latencyMs: Date.now() - start };
  } catch (e: any) {
    return { ok: false, error: e.message };
  }
}

async function checkMemoryTable() {
  try {
    await sql`SELECT COUNT(*) FROM user_memories LIMIT 1`;
    return { ok: true };
  } catch {
    return { ok: false, error: 'user_memories table missing' };
  }
}

export async function GET(req: NextRequest) {
  // Allow internal cron calls, block external without secret
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  const isInternal = !cronSecret || authHeader === `Bearer ${cronSecret}`;

  const [db, ai, stripe, voyage, memory] = await Promise.all([
    checkDatabase(),
    checkAI(),
    checkStripe(),
    checkVoyage(),
    checkMemoryTable(),
  ]);

  const allOk = db.ok && ai.ok && stripe.ok;
  const status = allOk ? 200 : 503;

  const report = {
    status: allOk ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    services: isInternal
      ? { database: db, ai, stripe, voyage, memory }
      : { database: { ok: db.ok }, ai: { ok: ai.ok }, stripe: { ok: stripe.ok } },
    version: process.env.RAILWAY_GIT_COMMIT_SHA?.slice(0, 7) ?? 'unknown',
    environment: process.env.NODE_ENV,
  };

  return NextResponse.json(report, { status });
}
