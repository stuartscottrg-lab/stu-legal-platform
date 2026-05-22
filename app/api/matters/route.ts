import { NextRequest, NextResponse } from 'next/server';
import { sqlite } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export async function GET() {
  return NextResponse.json(sqlite.prepare('SELECT * FROM matters WHERE archived_at IS NULL ORDER BY updated_at DESC').all());
}

export async function POST(req: NextRequest) {
  const { title, clientName, type, description } = await req.json();
  const id = uuidv4();
  sqlite.prepare('INSERT INTO matters (id,title,client_name,type,description,created_by) VALUES (?,?,?,?,?,?)').run(id, title, clientName, type, description, 'user');
  return NextResponse.json({ id });
}
