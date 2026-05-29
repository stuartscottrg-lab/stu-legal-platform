import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/supabase/server';
import sql from '@/lib/db/pg';
import { encryptToken, decryptToken } from '@/lib/security/tokenCrypto';

export const dynamic = 'force-dynamic';

// Refresh a Microsoft access token. `token.refresh_token` must already be decrypted.
async function refreshMicrosoftToken(token: any): Promise<string | null> {
  if (!token.refresh_token) return null;
  if (!process.env.MICROSOFT_CLIENT_ID || !process.env.MICROSOFT_CLIENT_SECRET) return null;
  try {
    const res = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.MICROSOFT_CLIENT_ID,
        client_secret: process.env.MICROSOFT_CLIENT_SECRET,
        refresh_token: token.refresh_token,
        grant_type: 'refresh_token',
        scope: 'openid email profile offline_access Mail.Read Calendars.Read',
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const newExpiry = Math.floor(Date.now() / 1000) + (data.expires_in ?? 3600);
    // Microsoft may rotate the refresh token — persist the new one if returned.
    const newRefresh = data.refresh_token ? encryptToken(data.refresh_token) : token.refresh_token_enc;
    await sql`
      UPDATE connector_tokens
      SET access_token=${encryptToken(data.access_token)},
          refresh_token=${newRefresh},
          expires_at=${newExpiry}, updated_at=NOW()
      WHERE id=${token.id}
    `;
    return data.access_token;
  } catch {
    return null;
  }
}

async function getToken(userId: string | undefined) {
  const rows = await sql`
    SELECT * FROM connector_tokens
    WHERE provider='outlook'
    AND (user_id=${userId ?? ''} OR user_id IS NULL OR user_id='anon')
    ORDER BY updated_at DESC LIMIT 1
  ` as any[];
  if (!rows.length) return null;
  const token = rows[0];
  token.refresh_token_enc = token.refresh_token; // keep encrypted form for re-store on refresh
  token.refresh_token = decryptToken(token.refresh_token);
  let accessToken: string = decryptToken(token.access_token) ?? token.access_token;
  const now = Math.floor(Date.now() / 1000);
  if (token.expires_at && token.expires_at < now + 60) {
    const refreshed = await refreshMicrosoftToken(token);
    if (refreshed) accessToken = refreshed;
  }
  return { token, accessToken };
}

// List recent inbox messages (metadata).
export async function GET(req: NextRequest) {
  const user = await getUser();
  const result = await getToken(user?.id);
  if (!result) return NextResponse.json({ connected: false, emails: [] });

  const limit = Math.min(parseInt(req.nextUrl.searchParams.get('limit') ?? '15'), 30);
  try {
    const res = await fetch(
      `https://graph.microsoft.com/v1.0/me/mailFolders/inbox/messages?$top=${limit}` +
      `&$select=id,conversationId,subject,from,toRecipients,receivedDateTime,bodyPreview,isRead`,
      { headers: { Authorization: `Bearer ${result.accessToken}` } }
    );
    if (!res.ok) {
      if (res.status === 401) return NextResponse.json({ connected: false, emails: [], error: 'Token expired' });
      return NextResponse.json({ connected: true, emails: [], error: 'Graph API error' });
    }
    const data = await res.json();
    const emails = (data.value ?? []).map((m: any) => ({
      id: m.id,
      threadId: m.conversationId,
      subject: m.subject || '(no subject)',
      from: m.from?.emailAddress ? `${m.from.emailAddress.name ?? ''} <${m.from.emailAddress.address ?? ''}>`.trim() : '',
      to: (m.toRecipients ?? []).map((r: any) => r.emailAddress?.address).filter(Boolean).join(', '),
      date: m.receivedDateTime ?? '',
      snippet: m.bodyPreview ?? '',
      labelIds: m.isRead ? [] : ['UNREAD'],
    }));
    return NextResponse.json({ connected: true, account: result.token.account, emails });
  } catch (e: any) {
    return NextResponse.json({ connected: true, emails: [], error: e.message });
  }
}

// Fetch the full body of a single message.
export async function POST(req: NextRequest) {
  const user = await getUser();
  const { messageId } = await req.json();
  if (!messageId) return NextResponse.json({ error: 'messageId required' }, { status: 400 });

  const result = await getToken(user?.id);
  if (!result) return NextResponse.json({ error: 'Not connected' }, { status: 401 });

  const res = await fetch(
    `https://graph.microsoft.com/v1.0/me/messages/${messageId}` +
    `?$select=id,subject,from,toRecipients,receivedDateTime,body,bodyPreview`,
    { headers: { Authorization: `Bearer ${result.accessToken}` } }
  );
  if (!res.ok) return NextResponse.json({ error: 'Failed to fetch message' }, { status: 502 });

  const m = await res.json();
  // body.content may be HTML — strip tags for plain-text context.
  const raw = m.body?.content ?? m.bodyPreview ?? '';
  const body = m.body?.contentType === 'html' ? raw.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() : raw;
  return NextResponse.json({
    id: m.id,
    subject: m.subject,
    from: m.from?.emailAddress ? `${m.from.emailAddress.name ?? ''} <${m.from.emailAddress.address ?? ''}>`.trim() : '',
    to: (m.toRecipients ?? []).map((r: any) => r.emailAddress?.address).filter(Boolean).join(', '),
    date: m.receivedDateTime,
    body: body.slice(0, 8000),
    snippet: m.bodyPreview,
  });
}
