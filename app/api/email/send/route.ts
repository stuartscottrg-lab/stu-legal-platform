import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

function getTransport() {
  const host   = process.env.STU_SMTP_HOST || 'smtp.gmail.com';
  const port   = parseInt(process.env.STU_SMTP_PORT || '587', 10);
  const user   = process.env.STU_SMTP_USER || '';
  const pass   = process.env.STU_SMTP_PASS || '';
  // port 587 uses STARTTLS (secure: false); port 465 uses SSL (secure: true)
  const secure = process.env.STU_SMTP_SECURE === 'true' || port === 465;

  if (!user || !pass) return null;

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  });
}

export async function POST(req: NextRequest) {
  try {
    const { to, subject, body, fromName } = await req.json();

    if (!to?.trim())   return NextResponse.json({ error: 'Recipient email is required' }, { status: 400 });
    if (!body?.trim()) return NextResponse.json({ error: 'Email body is required' },      { status: 400 });

    const transport = getTransport();

    if (!transport) {
      // SMTP not configured — fall back to mailto: link
      const params = new URLSearchParams({ subject: subject || '', body });
      const mailto = `mailto:${encodeURIComponent(to)}?${params.toString()}`;
      return NextResponse.json({ mailto, method: 'mailto' });
    }

    const senderUser = process.env.STU_SMTP_USER!;
    const senderName = fromName || process.env.STU_SMTP_FROM_NAME || 'Stuart';
    const from = `"${senderName}" <${senderUser}>`;

    await transport.sendMail({
      from,
      to,
      subject: subject || '(no subject)',
      text: body,
    });

    return NextResponse.json({ ok: true, method: 'smtp' });
  } catch (e: any) {
    console.error('Email send error:', e);
    return NextResponse.json({ error: e.message || 'Send failed' }, { status: 500 });
  }
}
