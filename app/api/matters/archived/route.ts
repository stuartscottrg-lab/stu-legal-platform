import { NextResponse } from 'next/server';
import { getUser } from '@/lib/supabase/server';
import sql from '@/lib/db/pg';

export const dynamic = 'force-dynamic';

export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const userId = user.id;

  const matters = await sql`
    SELECT m.*, (SELECT COUNT(*) FROM documents d WHERE d.matter_id = m.id) as doc_count
    FROM matters m
    WHERE m.archived_at IS NOT NULL AND m.created_by = ${userId}
    ORDER BY m.archived_at DESC
  `;
  return NextResponse.json(matters);
}
