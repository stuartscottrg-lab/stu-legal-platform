import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/supabase/server';
import sql from '@/lib/db/pg';
import { v4 as uuid } from 'uuid';
import { encryptToken } from '@/lib/security/tokenCrypto';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  
  const baseUrl = process.env.NEXTAUTH_URL || `https://${req.headers.get('host')}`;
  const redirectTo = `${baseUrl}/connectors`;

  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  if (error || !code) {
    return NextResponse.redirect(`${redirectTo}?error=microsoft_denied`);
  }

  const storedState = req.cookies.get('oauth_state_microsoft')?.value;
  if (!storedState || storedState !== state) {
    return NextResponse.redirect(`${redirectTo}?error=invalid_state`);
  }

  const clientId = process.env.MICROSOFT_CLIENT_ID!;
  const clientSecret = process.env.MICROSOFT_CLIENT_SECRET!;
  const redirectUri = `${baseUrl}/api/connectors/microsoft/callback`;

  try {
    const tokenRes = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenRes.ok) {
      console.error('Microsoft token exchange failed:', await tokenRes.text());
      return NextResponse.redirect(`${redirectTo}?error=token_exchange`);
    }

    const tokens = await tokenRes.json();

    // Get user info from Microsoft Graph
    const userRes = await fetch('https://graph.microsoft.com/v1.0/me', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    const userInfo = await userRes.json();
    const account = userInfo.mail || userInfo.userPrincipalName;

    const user = await getUser();
    if (!user) return NextResponse.redirect(`${redirectTo}?error=unauthorized`);

    const [existing] = await sql`
      SELECT id FROM connector_tokens WHERE provider=${'microsoft'} AND (user_id=${user.id} OR account=${account})
    ` as any[];

    // Stu OS — encrypt credentials at rest
    const encAccess = encryptToken(tokens.access_token);
    const encRefresh = encryptToken(tokens.refresh_token ?? null);
    const msExpiresAt = tokens.expires_in ? Math.floor(Date.now() / 1000) + tokens.expires_in : null;

    if (existing) {
      await sql`
        UPDATE connector_tokens SET
          access_token=${encAccess}, refresh_token=${encRefresh}, expires_at=${msExpiresAt}, account=${account}, updated_at=CURRENT_TIMESTAMP
        WHERE id=${existing.id}
      `;
    } else {
      await sql`
        INSERT INTO connector_tokens (id, user_id, provider, account, access_token, refresh_token, expires_at)
        VALUES (${uuid()}, ${user.id}, ${'microsoft'}, ${account}, ${encAccess}, ${encRefresh}, ${msExpiresAt})
      `;
    }

    const response = NextResponse.redirect(`${redirectTo}?connected=microsoft`);
    response.cookies.delete('oauth_state_microsoft');
    return response;

  } catch (e) {
    console.error('Microsoft callback error:', e);
    return NextResponse.redirect(`${redirectTo}?error=server_error`);
  }
}
