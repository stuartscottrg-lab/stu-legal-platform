import { NextRequest, NextResponse } from 'next/server';

// ── Resend (works from cloud servers, recommended for Railway) ──────────────
async function sendViaResend(to: string, subject: string, body: string, fromName: string) {
  const { Resend } = await import('resend');
  const resend = new Resend(process.env.RESEND_API_KEY!);
  const from = `${fromName} <onboarding@resend.dev>`; // use verified domain if you have one
  const { error } = await resend.emails.send({ from, to, subject, text: body });
  if (error) throw new Error(error.message);
}

// ── Nodemailer SMTP (works locally, may be blocked by Gmail on cloud) ───────
async function sendViaSMTP(to: string, subject: string, body: string, fromName: string) {
  const nodemailer = (await import('nodemailer')).default;
  const transport = nodemailer.createTransport({
    host:   process.env.STU_SMTP_HOST || 'smtp.gmail.com',
    port:   parseInt(process.env.STU_SMTP_PORT || '587', 10),
    secure: process.env.STU_SMTP_SECURE === 'true',
    auth: {
      user: process.env.STU_SMTP_USER!,
      pass: process.env.STU_SMTP_PASS!,
    },
    connectionTimeout: 8000,
    greetingTimeout:   8000,
    socketTimeout:     10000,
  });
  const from = `"${fromName}" <${process.env.STU_SMTP_USER}>`;
  await transport.sendMail({ from, to, subject: subject || '(no subject)', text: body });
}

export async function POST(req: NextRequest) {
  try {
    const { to, subject, body, fromName = 'Stuart' } = await req.json();

    if (!to?.trim())   return NextResponse.json({ error: 'Recipient email is required' }, { status: 400 });
    if (!body?.trim()) return NextResponse.json({ error: 'Email body is required' },      { status: 400 });

    // Try Resend first (cloud-friendly), fall back to SMTP, then mailto
    if (process.env.RESEND_API_KEY) {
      await sendViaResend(to, subject || '(no subject)', body, fromName);
      return NextResponse.json({ ok: true, method: 'resend' });
    }

    if (process.env.STU_SMTP_USER && process.env.STU_SMTP_PASS) {
      try {
        await sendViaSMTP(to, subject || '(no subject)', body, fromName);
        return NextResponse.json({ ok: true, method: 'smtp' });
      } catch (smtpErr: any) {
        console.error('SMTP failed, falling back to mailto:', smtpErr.message);
        // fall through to mailto
      }
    }

    // Final fallback — open email client (encode spaces as %20, not +)
    const mailto = `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject || '')}&body=${encodeURIComponent(body)}`;
    return NextResponse.json({ mailto, method: 'mailto' });

  } catch (e: any) {
    console.error('Email send error:', e);
    return NextResponse.json({ error: e.message || 'Send failed' }, { status: 500 });
  }
}
