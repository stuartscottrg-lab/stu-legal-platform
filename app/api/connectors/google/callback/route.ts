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
    return NextResponse.redirect(`${redirectTo}?error=google_denied`);
  }

  // Validate CSRF state
  const storedState = req.cookies.get('oauth_state_google')?.value;
  if (!storedState || storedState !== state) {
    return NextResponse.redirect(`${redirectTo}?error=invalid_state`);
  }

  const clientId = process.env.GOOGLE_CLIENT_ID!;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET!;
  const redirectUri = `${baseUrl}/api/connectors/google/callback`;

  try {
    // Exchange code for tokens
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
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
      console.error('Google token exchange failed:', await tokenRes.text());
      return NextResponse.redirect(`${redirectTo}?error=token_exchange`);
    }

    const tokens = await tokenRes.json();

    // Get user email from Google
    const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    const userInfo = await userRes.json();

    // Resolve user_id — optional in bypass mode
    const user = await getUser();
    const userId = user?.id ?? 'anon';

    // Upsert connector token in DB
    const [existing] = await sql`
      SELECT id FROM connector_tokens WHERE provider='google' AND (user_id=${userId} OR account=${userInfo.email})
    ` as any[];

    const expiresAt = tokens.expires_in ? Math.floor(Date.now() / 1000) + tokens.expires_in : null;
    // Stu OS — encrypt credentials at rest
    const encAccess = encryptToken(tokens.access_token);
    const encRefresh = encryptToken(tokens.refresh_token ?? null);

    if (existing) {
      await sql`
        UPDATE connector_tokens SET
          access_token=${encAccess}, refresh_token=${encRefresh},
          expires_at=${expiresAt}, scope=${tokens.scope ?? null},
          account=${userInfo.email}, updated_at=NOW()
        WHERE id=${existing.id}
      `;
    } else {
      await sql`
        INSERT INTO connector_tokens (id, user_id, provider, account, access_token, refresh_token, expires_at, scope)
        VALUES (${uuid()}, ${userId}, ${'google'}, ${userInfo.email}, ${encAccess}, ${encRefresh}, ${expiresAt}, ${tokens.scope ?? null})
      `;
    }

    const response = NextResponse.redirect(`${redirectTo}?connected=google`);
    response.cookies.delete('oauth_state_google');
    return response;

  } catch (e) {
    console.error('Google callback error:', e);
    return NextResponse.redirect(`${redirectTo}?error=server_error`);
  }
}
