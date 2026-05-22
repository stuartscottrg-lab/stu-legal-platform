import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db/pg';

export async function GET(_: NextRequest, { params }: { params: Promise<{ matterId: string }> }) {
  const { matterId } = await params;
  const [m] = await sql`SELECT * FROM matters WHERE id=${matterId}`;
  return m ? NextResponse.json(m) : NextResponse.json({ error: 'Not found' }, { status: 404 });
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ matterId: string }> }) {
  const { matterId } = await params;
  const [m] = await sql`SELECT id FROM matters WHERE id=${matterId}`;
  if (!m) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // Soft-archive: just stamp archived_at, keep all data intact
  await sql`UPDATE matters SET archived_at = NOW(), updated_at = NOW() WHERE id = ${matterId}`;

  return NextResponse.json({ ok: true });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ matterId: string }> }) {
  const { matterId } = await params;
  const { restore } = await req.json();
  if (restore) {
    await sql`UPDATE matters SET archived_at = NULL, updated_at = NOW() WHERE id = ${matterId}`;
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}
