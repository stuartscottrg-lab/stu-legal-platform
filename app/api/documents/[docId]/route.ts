import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db/pg';

export async function GET(_: NextRequest, { params }: { params: Promise<{ docId: string }> }) {
  const { docId } = await params;
  const [doc] = await sql`SELECT * FROM documents WHERE id=${docId}`;
  if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const annotations = await sql`SELECT * FROM annotations WHERE document_id=${docId}`;
  return NextResponse.json({ ...doc, annotations });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ docId: string }> }) {
  const { docId } = await params;
  const { extracted_text } = await req.json();
  if (typeof extracted_text !== 'string') return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
  await sql`UPDATE documents SET extracted_text=${extracted_text} WHERE id=${docId}`;
  return NextResponse.json({ ok: true });
}
