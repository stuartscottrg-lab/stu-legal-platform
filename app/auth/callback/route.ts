import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import sql from '@/lib/db/pg';
import { v4 as uuid } from 'uuid';
import { encryptToken } from '@/lib/security/tokenCrypto';

// When an OAuth login also granted connector scopes (mail/calendar),
// Supabase hands back a provider_refresh_token. Persist it as a connector
// token so Stu can read the inbox — reusing the login flow, so no separate
// Google/Microsoft redirect URI needs registering.
//
// Supabase's provider name → our internal connector id:
//   google → 'google' (Gmail/Calendar)
//   azure  → 'outlook' (Microsoft 365 / Graph)
function connectorIdFor(provider?: string): string | null {
  if (provider === 'google') return 'google';
  if (provider === 'azure') return 'outlook';
  return null;
}

async function persistConnector(session: any, user: any) {
  const refresh = session?.provider_refresh_token;
  const access = session?.provider_token;
  // Only a connector consent (offline access) yields a refresh token.
  if (!refresh || !access) return;
  const provider = connectorIdFor(user?.app_metadata?.provider);
  if (!provider) return;
  const account = user?.email ?? user?.user_metadata?.email ?? null;
  const userId = user?.id ?? 'anon';
  const expiresAt = Math.floor(Date.now() / 1000) + 3600; // access tokens last ~1h
  const encAccess = encryptToken(access);
  const encRefresh = encryptToken(refresh);
  try {
    const [existing] = await sql`
      SELECT id FROM connector_tokens WHERE provider=${provider} AND (user_id=${userId} OR account=${account})
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
        VALUES (${uuid()}, ${userId}, ${provider}, ${account}, ${encAccess}, ${encRefresh}, ${expiresAt})
      `;
    }
  } catch (e) {
    console.error('persistConnector error:', e);
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
    // If the provider returned connector scopes, store the token (Stu OS encrypted).
    if (data?.session) {
      await persistConnector(data.session, data.user);
    }
  }

  // Invited users and password-reset users both need to set a password
  if (type === 'invite' || type === 'recovery') {
    return NextResponse.redirect(`${origin}/auth/set-password`);
  }

  return NextResponse.redirect(`${origin}${redirect}`);
}
