import { NextResponse } from 'next/server';
import { sqlite } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const docs = sqlite.prepare(`
    SELECT d.id, d.original_name, d.status, d.size_bytes, d.created_at,
           m.title as matter_title, m.id as matter_id
    FROM documents d
    LEFT JOIN matters m ON m.id = d.matter_id
    WHERE d.status = 'ready'
    ORDER BY d.created_at DESC
  `).all();
  return NextResponse.json(docs);
}
