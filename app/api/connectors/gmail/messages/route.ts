import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/supabase/server';
import sql from '@/lib/db/pg';

export const dynamic = 'force-dynamic';

// Refresh Google access token if expired
async function refreshGoogleToken(token: any): Promise<string | null> {
  if (!token.refresh_token) return null;
  try {
    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        refresh_token: token.refresh_token,
        grant_type: 'refresh_token',
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const newExpiry = Math.floor(Date.now() / 1000) + (data.expires_in ?? 3600);
    await sql`
      UPDATE connector_tokens
      SET access_token=${data.access_token}, expires_at=${newExpiry}, updated_at=NOW()
      WHERE id=${token.id}
    `;
    return data.access_token;
  } catch {
    return null;
  }
}

// Decode base64url Gmail body
function decodeBody(data?: string): string {
  if (!data) return '';
  try {
    return Buffer.from(data.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8');
  } catch {
    return '';
  }
}

// Extract plain text from Gmail message parts
function extractText(payload: any): string {
  if (!payload) return '';
  if (payload.mimeType === 'text/plain' && payload.body?.data) {
    return decodeBody(payload.body.data);
  }
  if (payload.parts) {
    for (const part of payload.parts) {
      const text = extractText(part);
      if (text) return text;
    }
  }
  return '';
}

export async function GET(req: NextRequest) {
  const user = await getUser();
  const userId = user?.id;

  // Find Google token (user-specific or anonymous)
  const rows = await sql`
    SELECT * FROM connector_tokens
    WHERE provider='google'
    AND (user_id=${userId ?? ''} OR user_id IS NULL OR user_id='anon')
    ORDER BY updated_at DESC LIMIT 1
  ` as any[];

  if (!rows.length) {
    return NextResponse.json({ connected: false, emails: [] });
  }

  let token = rows[0];
  let accessToken: string = token.access_token;

  // Refresh if expired
  const now = Math.floor(Date.now() / 1000);
  if (token.expires_at && token.expires_at < now + 60) {
    const refreshed = await refreshGoogleToken(token);
    if (refreshed) accessToken = refreshed;
  }

  const limit = Math.min(parseInt(req.nextUrl.searchParams.get('limit') ?? '15'), 30);

  try {
    // List recent messages
    const listRes = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=${limit}&labelIds=INBOX`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    if (!listRes.ok) {
      const err = await listRes.json();
      if (err.error?.code === 401) {
        return NextResponse.json({ connected: false, emails: [], error: 'Token expired' });
      }
      return NextResponse.json({ connected: true, emails: [], error: 'Gmail API error' });
    }

    const list = await listRes.json();
    const messages = list.messages ?? [];

    // Fetch each message (metadata only for speed)
    const emails = await Promise.all(
      messages.map(async (msg: { id: string }) => {
        const res = await fetch(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=metadata&metadataHeaders=From&metadataHeaders=To&metadataHeaders=Subject&metadataHeaders=Date`,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        if (!res.ok) return null;
        const data = await res.json();
        const headers = data.payload?.headers ?? [];
        const get = (name: string) => headers.find((h: any) => h.name.toLowerCase() === name.toLowerCase())?.value ?? '';
        return {
          id: data.id,
          threadId: data.threadId,
          subject: get('Subject') || '(no subject)',
          from: get('From'),
          to: get('To'),
          date: get('Date'),
          snippet: data.snippet ?? '',
          labelIds: data.labelIds ?? [],
        };
      })
    );

    return NextResponse.json({
      connected: true,
      account: token.account,
      emails: emails.filter(Boolean),
    });
  } catch (e: any) {
    return NextResponse.json({ connected: true, emails: [], error: e.message });
  }
}

// Fetch full body of a single email (called when user asks Stu to read specific email)
export async function POST(req: NextRequest) {
  const user = await getUser();
  const userId = user?.id;
  const { messageId } = await req.json();
  if (!messageId) return NextResponse.json({ error: 'messageId required' }, { status: 400 });

  const rows = await sql`
    SELECT * FROM connector_tokens
    WHERE provider='google'
    AND (user_id=${userId ?? ''} OR user_id IS NULL OR user_id='anon')
    ORDER BY updated_at DESC LIMIT 1
  ` as any[];

  if (!rows.length) return NextResponse.json({ error: 'Not connected' }, { status: 401 });

  const token = rows[0];
  let accessToken = token.access_token;
  const now = Math.floor(Date.now() / 1000);
  if (token.expires_at && token.expires_at < now + 60) {
    const refreshed = await refreshGoogleToken(token);
    if (refreshed) accessToken = refreshed;
  }

  const res = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}?format=full`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!res.ok) return NextResponse.json({ error: 'Failed to fetch message' }, { status: 502 });

  const data = await res.json();
  const headers = data.payload?.headers ?? [];
  const get = (name: string) => headers.find((h: any) => h.name.toLowerCase() === name.toLowerCase())?.value ?? '';
  const body = extractText(data.payload);

  return NextResponse.json({
    id: data.id,
    subject: get('Subject'),
    from: get('From'),
    to: get('To'),
    date: get('Date'),
    body: body.slice(0, 8000), // cap at 8k chars
    snippet: data.snippet,
  });
}
