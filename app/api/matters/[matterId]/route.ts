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

  // Soft-archive: just stamp archived_at, keep all data intact
  sqlite.prepare(`UPDATE matters SET archived_at = datetime('now'), updated_at = datetime('now') WHERE id = ?`).run(matterId);

  return NextResponse.json({ ok: true });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ matterId: string }> }) {
  const { matterId } = await params;
  const { restore } = await req.json();
  if (restore) {
    sqlite.prepare(`UPDATE matters SET archived_at = NULL, updated_at = datetime('now') WHERE id = ?`).run(matterId);
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}
