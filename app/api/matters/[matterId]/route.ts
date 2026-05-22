import { NextRequest, NextResponse } from 'next/server';
import { sqlite } from '@/lib/db';

export async function GET(_: NextRequest, { params }: { params: Promise<{ matterId: string }> }) {
  const { matterId } = await params;
  const m = sqlite.prepare('SELECT * FROM matters WHERE id=?').get(matterId);
  return m ? NextResponse.json(m) : NextResponse.json({ error: 'Not found' }, { status: 404 });
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ matterId: string }> }) {
  const { matterId } = await params;
  const m = sqlite.prepare('SELECT id FROM matters WHERE id=?').get(matterId);
  if (!m) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // Cascade delete: annotations → documents → time_entries → matter
  const docs = sqlite.prepare('SELECT id FROM documents WHERE matter_id=?').all(matterId) as { id: string }[];
  for (const doc of docs) {
    sqlite.prepare('DELETE FROM annotations WHERE document_id=?').run(doc.id);
  }
  sqlite.prepare('DELETE FROM documents WHERE matter_id=?').run(matterId);
  sqlite.prepare('DELETE FROM time_entries WHERE matter_id=?').run(matterId);
  sqlite.prepare('DELETE FROM matters WHERE id=?').run(matterId);

  return NextResponse.json({ ok: true });
}
