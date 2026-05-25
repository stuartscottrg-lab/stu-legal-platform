import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/supabase/server';
import sql from '@/lib/db/pg';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const user = await getUser();
  const userId = user?.id ?? '';

  const tokens = await sql`
    SELECT provider, account, created_at, updated_at
    FROM connector_tokens
    WHERE user_id=${userId} OR user_id IS NULL OR user_id='anon'
    ORDER BY updated_at DESC
  ` as any[];

  const connected: Record<string, { account: string; connectedAt: string }> = {};
  for (const t of tokens) {
    if (!connected[t.provider]) {
      connected[t.provider] = { account: t.account, connectedAt: t.updated_at };
    }
  }

  // Also report which OAuth providers are configured in env
  const providers = {
    google: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
    microsoft: !!(process.env.MICROSOFT_CLIENT_ID && process.env.MICROSOFT_CLIENT_SECRET),
    apple: !!(process.env.APPLE_ID && process.env.APPLE_SECRET),
  };

  return NextResponse.json({ connected, providers });
}

export async function DELETE(req: NextRequest) {
  const user = await getUser();
  const userId = user?.id ?? '';
  const { provider } = await req.json();
  await sql`DELETE FROM connector_tokens WHERE provider=${provider} AND (user_id=${userId} OR user_id IS NULL OR user_id='anon')`;
  return NextResponse.json({ ok: true });
}
