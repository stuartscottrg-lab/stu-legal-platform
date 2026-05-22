import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import sql from '@/lib/db/pg';
import { v4 as uuidv4 } from 'uuid';

export const dynamic = 'force-dynamic';

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const rows = await sql`
    SELECT * FROM matters
    WHERE archived_at IS NULL AND created_by = ${userId}
    ORDER BY updated_at DESC
  `;
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { title, clientName, type, description } = await req.json();
  const id = uuidv4();
  await sql`
    INSERT INTO matters (id, title, client_name, type, description, created_by)
    VALUES (${id}, ${title}, ${clientName}, ${type}, ${description}, ${userId})
  `;
  return NextResponse.json({ id });
}
