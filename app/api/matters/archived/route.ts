import { NextResponse } from 'next/server';
import { sqlite } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const matters = sqlite.prepare(`
    SELECT m.*, (SELECT COUNT(*) FROM documents d WHERE d.matter_id = m.id) as doc_count
    FROM matters m
    WHERE m.archived_at IS NOT NULL
    ORDER BY m.archived_at DESC
  `).all();
  return NextResponse.json(matters);
}
