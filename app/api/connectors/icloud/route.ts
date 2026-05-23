import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/supabase/server';
import sql from '@/lib/db/pg';
import { v4 as uuid } from 'uuid';
import nodemailer from 'nodemailer';
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const ENC_KEY = Buffer.from(
  (process.env.CREDENTIAL_ENCRYPTION_KEY ?? '').padEnd(64, '0').slice(0, 64),
  'hex',
); // 32 bytes from 64-char hex env var

function encrypt(text: string): string {
  const iv = randomBytes(16);
  const cipher = createCipheriv('aes-256-cbc', ENC_KEY, iv);
  return iv.toString('hex') + ':' + cipher.update(text, 'utf8', 'hex') + cipher.final('hex');
}

export function decrypt(encrypted: string): string {
  const [ivHex, data] = encrypted.split(':');
  const decipher = createDecipheriv('aes-256-cbc', ENC_KEY, Buffer.from(ivHex, 'hex'));
  return decipher.update(data, 'hex', 'utf8') + decipher.final('utf8');
}

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  // Auth check FIRST — before reading any credentials from the request
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = user.id;

  const { appleId, appPassword } = await req.json();
  if (!appleId || !appPassword) {
    return NextResponse.json({ error: 'Apple ID and app password required' }, { status: 400 });
  }

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

    const extra = JSON.stringify({ appPassword: encrypt(appPassword) });

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
