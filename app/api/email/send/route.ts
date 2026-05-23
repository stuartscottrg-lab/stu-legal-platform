import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { getUser } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

function createTransport() {
  return nodemailer.createTransport({
    host:   process.env.STU_SMTP_HOST   ?? 'smtp.gmail.com',
    port:   parseInt(process.env.STU_SMTP_PORT ?? '587', 10),
    secure: process.env.STU_SMTP_SECURE === 'true',
    auth: {
      user: process.env.STU_SMTP_USER!,
      pass: process.env.STU_SMTP_PASS!,
    },
    connectionTimeout: 10_000,
    greetingTimeout:   8_000,
    socketTimeout:     12_000,
  });
}

export async function POST(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { to, subject, body, fromName } = await req.json();

    if (!to?.trim())   return NextResponse.json({ error: 'Recipient email is required' }, { status: 400 });
    if (!body?.trim()) return NextResponse.json({ error: 'Email body is required' },      { status: 400 });

    const smtpUser = process.env.STU_SMTP_USER;
    const smtpPass = process.env.STU_SMTP_PASS;

    if (!smtpUser || !smtpPass) {
      // No SMTP configured — return a mailto: link as fallback
      const mailto = `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject ?? '')}&body=${encodeURIComponent(body)}`;
      return NextResponse.json({ mailto, method: 'mailto' });
    }

    const displayName = fromName ?? process.env.STU_SMTP_FROM_NAME ?? 'Stu';
    const from = `"${displayName}" <${smtpUser}>`;

    const transport = createTransport();
    await transport.sendMail({
      from,
      to: to.trim(),
      subject: subject?.trim() || '(no subject)',
      text: body.trim(),
    });

    return NextResponse.json({ ok: true, method: 'smtp', from });
  } catch (e: any) {
    console.error('Email send error:', e);
    return NextResponse.json({ error: e.message || 'Send failed' }, { status: 500 });
  }
}
