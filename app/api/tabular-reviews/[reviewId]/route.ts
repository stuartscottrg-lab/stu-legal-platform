import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db/pg';

export const dynamic = 'force-dynamic';

export async function GET(_: NextRequest, { params }: { params: Promise<{ reviewId: string }> }) {
  const { reviewId } = await params;
  const [review] = await sql`SELECT * FROM tabular_reviews WHERE id=${reviewId}`;
  return review ? NextResponse.json(review) : NextResponse.json({ error: 'Not found' }, { status: 404 });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ reviewId: string }> }) {
  const { reviewId } = await params;
  const { results, columns, document_ids, name } = await req.json();
  const updates: Record<string, any> = {};
  if (results !== undefined) updates.results = JSON.stringify(results);
  if (columns !== undefined) updates.columns = JSON.stringify(columns);
  if (document_ids !== undefined) updates.document_ids = JSON.stringify(document_ids);
  if (name !== undefined) updates.name = name;
  if (!Object.keys(updates).length) return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });
  await sql`UPDATE tabular_reviews SET ${sql(updates, ...Object.keys(updates) as any)}, updated_at=CURRENT_TIMESTAMP WHERE id=${reviewId}`;
  return NextResponse.json({ ok: true });
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ reviewId: string }> }) {
  const { reviewId } = await params;
  await sql`DELETE FROM tabular_reviews WHERE id=${reviewId}`;
  return NextResponse.json({ ok: true });
}
