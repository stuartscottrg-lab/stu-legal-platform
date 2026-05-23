import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/supabase/server';
import sql from '@/lib/db/pg';
import { v4 as uuid } from 'uuid';
import nodemailer from 'nodemailer';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  
  

  const { appleId, appPassword } = await req.json();
  if (!appleId || !appPassword) {
    return NextResponse.json({ error: 'Apple ID and app password required' }, { status: 400 });
  }

  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const userId = user.id;

  // Verify credentials by attempting SMTP connection to iCloud
  try {
    const transporter = nodemailer.createTransport({
      host: 'smtp.mail.me.com',
      port: 587,
      secure: false,
      auth: { user: appleId, pass: appPassword },
      connectionTimeout: 8000,
      socketTimeout: 8000,
    });

    await transporter.verify();

    // Credentials valid — store in DB

    const [existing] = await sql`
      SELECT id FROM connector_tokens WHERE provider=${'icloud'} AND (user_id=${userId} OR account=${appleId})
    ` as any[];

    // Store encrypted in production — for now store as-is (local dev only)
    const extra = JSON.stringify({ appPassword });

    if (existing) {
      await sql`UPDATE connector_tokens SET account=${appleId}, extra=${extra}, updated_at=CURRENT_TIMESTAMP WHERE id=${existing.id}`;
    } else {
      await sql`INSERT INTO connector_tokens (id, user_id, provider, account, extra) VALUES (${uuid()}, ${userId}, ${'icloud'}, ${appleId}, ${extra})`;
    }

    return NextResponse.json({ ok: true, account: appleId });

  } catch (e: any) {
    const msg = e?.message || 'Connection failed';
    const isAuth = msg.toLowerCase().includes('auth') || msg.toLowerCase().includes('invalid') || msg.includes('535');
    return NextResponse.json({
      error: isAuth
        ? 'Incorrect Apple ID or app-specific password. Make sure you\'re using an app-specific password, not your Apple ID password.'
        : 'Could not connect to iCloud Mail. Check your Apple ID and try again.',
    }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const userId = user.id;

  const { provider } = await req.json();

  await sql`DELETE FROM connector_tokens WHERE provider=${provider} AND user_id=${userId}`;
  return NextResponse.json({ ok: true });
}
