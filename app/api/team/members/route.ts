import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getUser } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const { data: { users }, error } = await supabase.auth.admin.listUsers({ perPage: 200 });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(
    users.map(u => ({
      id: u.id,
      email: u.email ?? '',
      name: u.user_metadata?.full_name ?? u.user_metadata?.name ?? null,
      created_at: u.created_at,
      last_sign_in: u.last_sign_in_at ?? null,
      invited_by: u.user_metadata?.invited_by ?? null,
      confirmed: !!u.email_confirmed_at,
    })),
  );
}
