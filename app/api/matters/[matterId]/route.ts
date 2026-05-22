import { NextRequest, NextResponse } from 'next/server';
import { sqlite } from '@/lib/db';

export async function GET(_: NextRequest, { params }: { params: Promise<{ matterId: string }> }) {
  const { matterId } = await params;
  const m = sqlite.prepare('SELECT * FROM matters WHERE id=?').get(matterId);
  return m ? NextResponse.json(m) : NextResponse.json({ error: 'Not found' }, { status: 404 });
}
