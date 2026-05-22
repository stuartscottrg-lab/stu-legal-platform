import { NextRequest, NextResponse } from 'next/server';
import { sqlite } from '@/lib/db';

export async function GET(_: NextRequest, { params }: { params: Promise<{ docId: string }> }) {
  const { docId } = await params;
  const doc = sqlite.prepare('SELECT * FROM documents WHERE id=?').get(docId) as any;
  if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const annotations = sqlite.prepare('SELECT * FROM annotations WHERE document_id=?').all(docId);
  return NextResponse.json({ ...doc, annotations });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ docId: string }> }) {
  const { docId } = await params;
  const { extracted_text } = await req.json();
  if (typeof extracted_text !== 'string') return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
  sqlite.prepare('UPDATE documents SET extracted_text=? WHERE id=?').run(extracted_text, docId);
  return NextResponse.json({ ok: true });
}
