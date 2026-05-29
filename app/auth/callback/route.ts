import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import sql from '@/lib/db/pg';
import { v4 as uuid } from 'uuid';
import { encryptToken } from '@/lib/security/tokenCrypto';

// When a Google OAuth login also granted connector scopes (gmail/calendar),
// Supabase hands back a provider_refresh_token. Persist it as a connector
// token so Stu can read the inbox — reusing the login flow, no separate
// Google redirect URI required.
async function persistGoogleConnector(session: any, user: any) {
  const refresh = session?.provider_refresh_token;
  const access = session?.provider_token;
  // Only a connector consent (access_type=offline) yields a refresh token.
  if (!refresh || !access) return;
  const account = user?.email ?? user?.user_metadata?.email ?? null;
  const userId = user?.id ?? 'anon';
  const expiresAt = Math.floor(Date.now() / 1000) + 3600; // Google access tokens last ~1h
  const encAccess = encryptToken(access);
  const encRefresh = encryptToken(refresh);
  try {
    const [existing] = await sql`
      SELECT id FROM connector_tokens WHERE provider='google' AND (user_id=${userId} OR account=${account})
    ` as any[];
    if (existing) {
      await sql`
        UPDATE connector_tokens SET
          access_token=${encAccess}, refresh_token=${encRefresh},
          expires_at=${expiresAt}, account=${account}, updated_at=NOW()
        WHERE id=${existing.id}
      `;
    } else {
      await sql`
        INSERT INTO connector_tokens (id, user_id, provider, account, access_token, refresh_token, expires_at)
        VALUES (${uuid()}, ${userId}, ${'google'}, ${account}, ${encAccess}, ${encRefresh}, ${expiresAt})
      `;
    }
  } catch (e) {
    console.error('persistGoogleConnector error:', e);
  }
}

export async function GET(req: NextRequest) {
  const { searchParams, origin } = req.nextUrl;
  const code = searchParams.get('code');
  const type = searchParams.get('type'); // 'invite' | 'recovery' | null
  // Support both `redirect` (email links) and `next` (OAuth flows)
  const redirect = searchParams.get('next') ?? searchParams.get('redirect') ?? '/assistant';

  if (code) {
    const supabase = await createClient();
    const { data } = await supabase.auth.exchangeCodeForSession(code);
    // If Google returned connector scopes, store the token (Stu OS encrypted).
    if (data?.session) {
      await persistGoogleConnector(data.session, data.user);
    }
  }

  // Invited users and password-reset users both need to set a password
  if (type === 'invite' || type === 'recovery') {
    return NextResponse.redirect(`${origin}/auth/set-password`);
  }

  return NextResponse.redirect(`${origin}${redirect}`);
}
