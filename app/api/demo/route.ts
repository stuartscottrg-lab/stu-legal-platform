import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

// Public endpoint — no auth required (landing page form)
export async function POST(req: NextRequest) {
  try {
    const { name, email, phone, firm } = await req.json();

    // Basic validation
    if (!name?.trim()) return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    if (!email?.trim() || !email.includes('@')) return NextResponse.json({ error: 'Valid email is required' }, { status: 400 });

    // ── Save to Supabase (service role, bypasses RLS) ──────────────
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (supabaseUrl && serviceKey) {
      const sb = createSupabaseClient(supabaseUrl, serviceKey);
      await sb.from('demo_requests').insert({ name, email, phone, firm, created_at: new Date().toISOString() });
    }

    // ── Send notification email to Stuart ─────────────────────────
    const smtpUser = process.env.STU_SMTP_USER;
    const smtpPass = process.env.STU_SMTP_PASS;
    const notifyTo = process.env.DEMO_NOTIFY_EMAIL ?? 'stuart@stu.ink';

    if (smtpUser && smtpPass) {
      const transporter = nodemailer.createTransport({
        host:   process.env.STU_SMTP_HOST   ?? 'smtp.gmail.com',
        port:   parseInt(process.env.STU_SMTP_PORT ?? '587', 10),
        secure: process.env.STU_SMTP_SECURE === 'true',
        auth: { user: smtpUser, pass: smtpPass },
        connectionTimeout: 10_000,
        greetingTimeout:   8_000,
        socketTimeout:     12_000,
      });

      await transporter.sendMail({
        from:    `"Stu Legal" <${smtpUser}>`,
        to:      notifyTo,
        subject: `New demo request — ${name}${firm ? ` · ${firm}` : ''}`,
        html: `
          <div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;color:#1a1a1a">
            <div style="font-size:22px;font-weight:700;margin-bottom:24px;font-family:Georgia,serif">Stu</div>
            <h2 style="font-size:18px;font-weight:600;margin:0 0 20px">New demo request</h2>
            <table style="width:100%;border-collapse:collapse">
              <tr><td style="padding:10px 0;border-bottom:1px solid #eee;color:#666;width:120px">Name</td><td style="padding:10px 0;border-bottom:1px solid #eee;font-weight:500">${name}</td></tr>
              <tr><td style="padding:10px 0;border-bottom:1px solid #eee;color:#666">Email</td><td style="padding:10px 0;border-bottom:1px solid #eee"><a href="mailto:${email}" style="color:#2563eb">${email}</a></td></tr>
              ${phone ? `<tr><td style="padding:10px 0;border-bottom:1px solid #eee;color:#666">Phone</td><td style="padding:10px 0;border-bottom:1px solid #eee">${phone}</td></tr>` : ''}
              ${firm  ? `<tr><td style="padding:10px 0;border-bottom:1px solid #eee;color:#666">Firm</td><td style="padding:10px 0;border-bottom:1px solid #eee">${firm}</td></tr>`  : ''}
            </table>
            <p style="margin-top:24px;font-size:13px;color:#999">Submitted via stu.ink</p>
          </div>
        `,
      });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[demo] error:', err);
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
}
