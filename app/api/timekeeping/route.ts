import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db/pg';
import { v4 as uuidv4 } from 'uuid';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const range = searchParams.get('range') || 'week';

    let entries;
    if (range === 'today') {
      entries = await sql`
        SELECT t.*, m.title as matter_title, m.client_name
        FROM time_entries t
        LEFT JOIN matters m ON t.matter_id = m.id
        WHERE t.date::date = CURRENT_DATE
        ORDER BY t.date DESC, t.created_at DESC
      `;
    } else if (range === 'week') {
      entries = await sql`
        SELECT t.*, m.title as matter_title, m.client_name
        FROM time_entries t
        LEFT JOIN matters m ON t.matter_id = m.id
        WHERE t.date::date >= CURRENT_DATE - INTERVAL '7 days'
        ORDER BY t.date DESC, t.created_at DESC
      `;
    } else if (range === 'month') {
      entries = await sql`
        SELECT t.*, m.title as matter_title, m.client_name
        FROM time_entries t
        LEFT JOIN matters m ON t.matter_id = m.id
        WHERE t.date::date >= CURRENT_DATE - INTERVAL '30 days'
        ORDER BY t.date DESC, t.created_at DESC
      `;
    } else {
      entries = await sql`
        SELECT t.*, m.title as matter_title, m.client_name
        FROM time_entries t
        LEFT JOIN matters m ON t.matter_id = m.id
        ORDER BY t.date DESC, t.created_at DESC
      `;
    }

    const matters = await sql`SELECT id, title, client_name FROM matters WHERE status = ${'active'} ORDER BY title`;

    const totalMinutes = (entries as any[]).reduce((s: number, e: any) => s + e.minutes, 0);
    const totalValue = (entries as any[]).reduce((s: number, e: any) => s + (e.minutes / 60) * e.hourly_rate, 0);

    return NextResponse.json({ entries, matters, totalMinutes, totalValue });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { matterId, description, minutes, hourlyRate, date } = await req.json();
    if (!description?.trim()) return NextResponse.json({ error: 'Description required' }, { status: 400 });
    if (!minutes || minutes < 1) return NextResponse.json({ error: 'Minutes required' }, { status: 400 });

    const id = uuidv4();
    await sql`INSERT INTO time_entries (id, matter_id, description, minutes, hourly_rate, date) VALUES (${id}, ${matterId || null}, ${description.trim()}, ${Math.round(minutes)}, ${hourlyRate || 0}, ${date || new Date().toISOString().split('T')[0]})`;

    return NextResponse.json({ id });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json();
    await sql`DELETE FROM time_entries WHERE id = ${id}`;
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message }, { status: 500 });
  }
}
