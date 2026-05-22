import { NextRequest, NextResponse } from 'next/server';
import { sqlite } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export const dynamic = 'force-dynamic';

export async function GET() {
  const reviews = sqlite.prepare('SELECT * FROM tabular_reviews ORDER BY created_at DESC').all();
  return NextResponse.json(reviews);
}

export async function POST(req: NextRequest) {
  const { name, columns, document_ids } = await req.json();
  if (!name || !columns?.length || !document_ids?.length) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }
  const id = uuidv4();
  sqlite.prepare('INSERT INTO tabular_reviews (id,name,columns,document_ids,results) VALUES (?,?,?,?,?)').run(
    id, name, JSON.stringify(columns), JSON.stringify(document_ids), '{}'
  );
  return NextResponse.json({ id });
}
