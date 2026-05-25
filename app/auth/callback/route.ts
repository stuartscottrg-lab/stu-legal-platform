import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  const { searchParams, origin } = req.nextUrl;
  const code = searchParams.get('code');
  const type = searchParams.get('type'); // 'invite' | 'recovery' | null
  // Support both `redirect` (email links) and `next` (OAuth flows)
  const redirect = searchParams.get('next') ?? searchParams.get('redirect') ?? '/assistant';

  if (code) {
    const supabase = await createClient();
    await supabase.auth.exchangeCodeForSession(code);
  }

  // Invited users and password-reset users both need to set a password
  if (type === 'invite' || type === 'recovery') {
    return NextResponse.redirect(`${origin}/auth/set-password`);
  }

  return NextResponse.redirect(`${origin}${redirect}`);
}
