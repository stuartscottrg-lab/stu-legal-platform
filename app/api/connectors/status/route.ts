import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { sqlite } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const tokens = sqlite.prepare(`
    SELECT provider, account, created_at, updated_at
    FROM connector_tokens
    WHERE user_id=? OR user_id IS NULL
    ORDER BY updated_at DESC
  `).all(userId) as any[];

  const connected: Record<string, { account: string; connectedAt: string }> = {};
  for (const t of tokens) {
    if (!connected[t.provider]) {
      connected[t.provider] = { account: t.account, connectedAt: t.updated_at };
    }
  }

  // Also report which OAuth providers are configured
  const providers = {
    google: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
    microsoft: !!(process.env.MICROSOFT_CLIENT_ID && process.env.MICROSOFT_CLIENT_SECRET),
    apple: !!(process.env.APPLE_ID && process.env.APPLE_SECRET),
  };

  return NextResponse.json({ connected, providers });
}

export async function DELETE(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { provider } = await req.json();

  sqlite.prepare('DELETE FROM connector_tokens WHERE provider=? AND (user_id=? OR user_id IS NULL)').run(provider, userId);
  return NextResponse.json({ ok: true });
}
