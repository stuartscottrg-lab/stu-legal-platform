import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getUser } from '@/lib/supabase/server';
import sql from '@/lib/db/pg';

export const dynamic = 'force-dynamic';

export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const [{ data: { users } }, matters, documents, messages, timeEntries] = await Promise.all([
    supabase.auth.admin.listUsers({ perPage: 200 }),
    sql`SELECT created_by, COUNT(*) as count FROM matters GROUP BY created_by` as Promise<{ created_by: string; count: string }[]>,
    sql`SELECT uploaded_by, COUNT(*) as count FROM documents GROUP BY uploaded_by` as Promise<{ uploaded_by: string; count: string }[]>,
    sql`SELECT COUNT(*) as count FROM chat_messages` as Promise<{ count: string }[]>,
    sql`SELECT SUM(minutes) as total FROM time_entries` as Promise<{ total: string | null }[]>,
  ]);

  const mattersMap: Record<string, number> = Object.fromEntries(
    matters.map(r => [r.created_by, Number(r.count)]),
  );
  const docsMap: Record<string, number> = Object.fromEntries(
    documents.map(r => [r.uploaded_by, Number(r.count)]),
  );

  const usageByUser = users.map(u => ({
    id: u.id,
    email: u.email ?? '',
    name: u.user_metadata?.full_name ?? u.user_metadata?.name ?? null,
    last_sign_in: u.last_sign_in_at ?? null,
    confirmed: !!u.email_confirmed_at,
    matters: mattersMap[u.id] ?? 0,
    documents: docsMap[u.id] ?? 0,
  }));

  return NextResponse.json({
    users: usageByUser,
    totals: {
      users: users.length,
      matters: matters.reduce((a, r) => a + Number(r.count), 0),
      documents: documents.reduce((a, r) => a + Number(r.count), 0),
      messages: Number(messages[0]?.count ?? 0),
      timeMinutes: Number(timeEntries[0]?.total ?? 0),
    },
  });
}
