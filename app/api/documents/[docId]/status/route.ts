import { NextRequest, NextResponse } from 'next/server';
import { sqlite } from '@/lib/db';

export async function GET(_: NextRequest, { params }: { params: Promise<{ docId: string }> }) {
  const { docId } = await params;
  const doc = sqlite.prepare('SELECT status FROM documents WHERE id=?').get(docId) as any;
  return doc ? NextResponse.json({ status: doc.status }) : NextResponse.json({ error: 'Not found' }, { status: 404 });
}
