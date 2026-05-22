import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db/pg';
import { v4 as uuidv4 } from 'uuid';

export async function GET() {
  const rows = await sql`SELECT * FROM matters WHERE archived_at IS NULL ORDER BY updated_at DESC`;
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const { title, clientName, type, description } = await req.json();
  const id = uuidv4();
  await sql`INSERT INTO matters (id,title,client_name,type,description,created_by) VALUES (${id}, ${title}, ${clientName}, ${type}, ${description}, ${'user'})`;
  return NextResponse.json({ id });
}
