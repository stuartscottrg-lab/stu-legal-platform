import { NextRequest, NextResponse } from 'next/server';
import { sqlite } from '@/lib/db';

export async function GET() {
  try {
    const leads = sqlite.prepare(
      'SELECT * FROM leads ORDER BY created_at DESC'
    ).all();
    return NextResponse.json(leads);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { v4: uuidv4 } = await import('uuid');
    const id = uuidv4();
    const now = new Date().toISOString();
    sqlite.prepare(
      `INSERT INTO leads (id, name, company, email, role, industry, pain_points, notes, status, email_draft, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      id,
      body.name || '',
      body.company || null,
      body.email || null,
      body.role || null,
      body.industry || null,
      body.pain_points || null,
      body.notes || null,
      body.status || 'draft',
      body.email_draft || null,
      now,
      now,
    );
    const lead = sqlite.prepare('SELECT * FROM leads WHERE id = ?').get(id);
    return NextResponse.json(lead, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, ...fields } = body;
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
    const now = new Date().toISOString();
    const allowed = ['name','company','email','role','industry','pain_points','notes','status','email_draft'];
    const updates = Object.entries(fields).filter(([k]) => allowed.includes(k));
    if (updates.length === 0) return NextResponse.json({ error: 'nothing to update' }, { status: 400 });
    const setClauses = [...updates.map(([k]) => `${k} = ?`), 'updated_at = ?'].join(', ');
    const values = [...updates.map(([, v]) => v), now, id];
    sqlite.prepare(`UPDATE leads SET ${setClauses} WHERE id = ?`).run(...values);
    const lead = sqlite.prepare('SELECT * FROM leads WHERE id = ?').get(id);
    return NextResponse.json(lead);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
    sqlite.prepare('DELETE FROM leads WHERE id = ?').run(id);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
