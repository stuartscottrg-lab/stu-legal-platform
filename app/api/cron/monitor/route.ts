import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const OWNER_EMAIL = process.env.OWNER_EMAIL ?? 'stuart@stu.ink';
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://stu.ink';

async function fetchHealthReport() {
  const secret = process.env.CRON_SECRET;
  const res = await fetch(`${BASE_URL}/api/health`, {
    headers: secret ? { authorization: `Bearer ${secret}` } : {},
    cache: 'no-store',
  });
  return { ok: res.ok, status: res.status, data: await res.json() };
}

async function sendEmail(subject: string, body: string) {
  const res = await fetch(`${BASE_URL}/api/email/send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      to: OWNER_EMAIL,
      subject,
      body,
      fromName: 'Stu Monitor',
    }),
  });
  return res.ok;
}

function formatHealth(data: any): string {
  const s = data.services ?? {};
  const rows: string[] = [];

  const icon = (ok: boolean) => (ok ? '✅' : '❌');

  if (s.database) rows.push(`  ${icon(s.database.ok)} Database${s.database.latencyMs !== undefined ? ` (${s.database.latencyMs}ms)` : ''}${s.database.error ? ` — ${s.database.error}` : ''}`);
  if (s.ai)       rows.push(`  ${icon(s.ai.ok)} Anthropic AI${s.ai.latencyMs !== undefined ? ` (${s.ai.latencyMs}ms)` : ''}${s.ai.error ? ` — ${s.ai.error}` : ''}`);
  if (s.stripe)   rows.push(`  ${icon(s.stripe.ok)} Stripe${s.stripe.latencyMs !== undefined ? ` (${s.stripe.latencyMs}ms)` : ''}${s.stripe.error ? ` — ${s.stripe.error}` : ''}`);
  if (s.voyage)   rows.push(`  ${icon(s.voyage.ok)} Voyage AI${s.voyage.latencyMs !== undefined ? ` (${s.voyage.latencyMs}ms)` : ''}${s.voyage.error ? ` — ${s.voyage.error}` : ''}`);
  if (s.memory)   rows.push(`  ${icon(s.memory.ok)} Memory table${s.memory.error ? ` — ${s.memory.error}` : ''}`);

  return rows.join('\n');
}

export async function GET(req: NextRequest) {
  // Verify cron secret
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // 1. Fetch health
    const health = await fetchHealthReport();
    const allOk = health.ok && health.data?.status === 'healthy';
    const timestamp = new Date().toISOString();
    const version = health.data?.version ?? 'unknown';
    const env = health.data?.environment ?? 'unknown';

    // 2. Build a plain-text status block for Claude to analyse
    const serviceLines = formatHealth(health.data);
    const statusBlock = `
Timestamp: ${timestamp}
Environment: ${env}
Version: ${version}
Overall status: ${health.data?.status ?? (health.ok ? 'healthy' : 'down')} (HTTP ${health.status})

Services:
${serviceLines || '  (no service data returned)'}
`.trim();

    // 3. Ask Claude for a concise plain-English analysis
    let aiSummary = '';
    try {
      const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
      const msg = await anthropic.messages.create({
        model: 'claude-haiku-4-5',
        max_tokens: 400,
        messages: [{
          role: 'user',
          content: `You are a monitoring assistant for Stu, a legal AI platform at stu.ink.
Analyse the health check below and write a SHORT (3–5 sentence) plain-English daily summary for the owner.
Be direct. If everything is fine say so briefly. If something needs attention, lead with that and suggest a fix.
Do not use bullet points or markdown — plain text only.

${statusBlock}`,
        }],
      });
      aiSummary = msg.content.find((b) => b.type === 'text')?.text?.trim() ?? '';
    } catch {
      aiSummary = allOk
        ? 'All services are running normally.'
        : 'One or more services are degraded — check the details above.';
    }

    // 4. Compose and send the email
    const emoji = allOk ? '✅' : '🚨';
    const subject = `${emoji} stu.ink daily health — ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`;

    const body = `${aiSummary}

━━━━━━━━━━━━━━━━━━━━━━━
RAW STATUS
━━━━━━━━━━━━━━━━━━━━━━━
${statusBlock}

━━━━━━━━━━━━━━━━━━━━━━━
View full health check: ${BASE_URL}/api/health
`.trim();

    const sent = await sendEmail(subject, body);

    return NextResponse.json({
      ok: true,
      healthStatus: health.data?.status,
      emailSent: sent,
      summary: aiSummary,
      timestamp,
    });

  } catch (e: any) {
    // If monitoring itself crashes, try to email the error
    const errorMsg = e?.message ?? 'Unknown error in monitor cron';
    await sendEmail('🚨 stu.ink monitor error', `The monitoring cron job itself encountered an error:\n\n${errorMsg}\n\nCheck Railway logs for details.`).catch(() => {});
    return NextResponse.json({ ok: false, error: errorMsg }, { status: 500 });
  }
}
