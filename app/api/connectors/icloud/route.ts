import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { sqlite } from '@/lib/db';
import { v4 as uuid } from 'uuid';
import nodemailer from 'nodemailer';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  
  

  const { appleId, appPassword } = await req.json();
  if (!appleId || !appPassword) {
    return NextResponse.json({ error: 'Apple ID and app password required' }, { status: 400 });
  }

  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

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

    const existing = sqlite.prepare(
      'SELECT id FROM connector_tokens WHERE provider=? AND (user_id=? OR account=?)'
    ).get('icloud', userId, appleId) as any;

    // Store encrypted in production — for now store as-is (local dev only)
    const extra = JSON.stringify({ appPassword });

    if (existing) {
      sqlite.prepare(`
        UPDATE connector_tokens SET account=?, extra=?, updated_at=CURRENT_TIMESTAMP WHERE id=?
      `).run(appleId, extra, existing.id);
    } else {
      sqlite.prepare(`
        INSERT INTO connector_tokens (id, user_id, provider, account, extra) VALUES (?, ?, 'icloud', ?, ?)
      `).run(uuid(), userId, appleId, extra);
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
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { provider } = await req.json();

  sqlite.prepare('DELETE FROM connector_tokens WHERE provider=? AND user_id=?').run(provider, userId);
  return NextResponse.json({ ok: true });
}
