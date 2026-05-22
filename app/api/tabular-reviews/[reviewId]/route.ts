import { NextRequest, NextResponse } from 'next/server';
import { sqlite } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(_: NextRequest, { params }: { params: Promise<{ reviewId: string }> }) {
  const { reviewId } = await params;
  const review = sqlite.prepare('SELECT * FROM tabular_reviews WHERE id=?').get(reviewId);
  return review ? NextResponse.json(review) : NextResponse.json({ error: 'Not found' }, { status: 404 });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ reviewId: string }> }) {
  const { reviewId } = await params;
  const { results, columns, document_ids, name } = await req.json();
  const updates: string[] = [];
  const vals: any[] = [];
  if (results !== undefined) { updates.push('results=?'); vals.push(JSON.stringify(results)); }
  if (columns !== undefined) { updates.push('columns=?'); vals.push(JSON.stringify(columns)); }
  if (document_ids !== undefined) { updates.push('document_ids=?'); vals.push(JSON.stringify(document_ids)); }
  if (name !== undefined) { updates.push('name=?'); vals.push(name); }
  if (!updates.length) return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });
  updates.push('updated_at=CURRENT_TIMESTAMP');
  sqlite.prepare(`UPDATE tabular_reviews SET ${updates.join(',')} WHERE id=?`).run(...vals, reviewId);
  return NextResponse.json({ ok: true });
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ reviewId: string }> }) {
  const { reviewId } = await params;
  sqlite.prepare('DELETE FROM tabular_reviews WHERE id=?').run(reviewId);
  return NextResponse.json({ ok: true });
}
