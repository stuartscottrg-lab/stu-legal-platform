import { NextResponse } from 'next/server';
import { getUser } from '@/lib/supabase/server';
import sql from '@/lib/db/pg';

export const dynamic = 'force-dynamic';

export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const userId = user.id;

  const docs = await sql`
    SELECT d.id, d.original_name, d.status, d.size_bytes, d.created_at, d.mime_type,
           m.title as matter_title, m.id as matter_id
    FROM documents d
    LEFT JOIN matters m ON m.id = d.matter_id
    WHERE d.uploaded_by = ${userId}
    ORDER BY d.created_at DESC
  `;
  return NextResponse.json(docs);
}
