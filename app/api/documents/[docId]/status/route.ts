import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db/pg';

export async function GET(_: NextRequest, { params }: { params: Promise<{ docId: string }> }) {
  const { docId } = await params;
  const [doc] = await sql`SELECT status FROM documents WHERE id=${docId}`;
  return doc ? NextResponse.json({ status: doc.status }) : NextResponse.json({ error: 'Not found' }, { status: 404 });
}
