import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db/pg';
import { v4 as uuidv4 } from 'uuid';

export const dynamic = 'force-dynamic';

export async function GET() {
  const reviews = await sql`SELECT * FROM tabular_reviews ORDER BY created_at DESC`;
  return NextResponse.json(reviews);
}

export async function POST(req: NextRequest) {
  const { name, columns, document_ids } = await req.json();
  if (!name || !columns?.length || !document_ids?.length) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }
  const id = uuidv4();
  await sql`INSERT INTO tabular_reviews (id,name,columns,document_ids,results) VALUES (${id}, ${name}, ${JSON.stringify(columns)}, ${JSON.stringify(document_ids)}, ${'{}'})`;
  return NextResponse.json({ id });
}
