import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db/pg';
import { v4 as uuid } from 'uuid';
import { getUser } from '@/lib/supabase/server';
import { rateLimit } from '@/lib/rateLimit';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  // Rate limit public search: 30 req/min per IP
  const ip = req.headers.get('x-forwarded-for') ?? 'unknown';
  if (!rateLimit(`firms:${ip}`, 30, 60 * 1000)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  const { searchParams } = new URL(req.url);
  const city = searchParams.get('city')?.trim();
  const specialty = searchParams.get('specialty')?.trim();
  const q = searchParams.get('q')?.trim();

  let firms;
  if (q) {
    firms = await sql`
      SELECT * FROM law_firms
      WHERE name ILIKE ${'%' + q + '%'} OR city ILIKE ${'%' + q + '%'} OR specialties ILIKE ${'%' + q + '%'} OR postcode ILIKE ${'%' + q + '%'}
      ORDER BY featured_rank DESC, verified DESC, name ASC
    `;
  } else if (city && specialty) {
    firms = await sql`
      SELECT * FROM law_firms
      WHERE city ILIKE ${'%' + city + '%'} AND specialties ILIKE ${'%' + specialty + '%'}
      ORDER BY featured_rank DESC, verified DESC, name ASC
    `;
  } else if (city) {
    firms = await sql`
      SELECT * FROM law_firms WHERE city ILIKE ${'%' + city + '%'}
      ORDER BY featured_rank DESC, verified DESC, name ASC
    `;
  } else if (specialty) {
    firms = await sql`
      SELECT * FROM law_firms WHERE specialties ILIKE ${'%' + specialty + '%'}
      ORDER BY featured_rank DESC, verified DESC, name ASC
    `;
  } else {
    firms = await sql`
      SELECT * FROM law_firms ORDER BY featured_rank DESC, verified DESC, name ASC
    `;
  }

  return NextResponse.json(firms);
}

export async function POST(req: NextRequest) {
  // Require auth to submit a firm listing
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const userId = user.id;

  // Rate limit: 5 firm submissions per user per day
  if (!rateLimit(`firms:post:${userId}`, 5, 24 * 60 * 60 * 1000)) {
    return NextResponse.json({ error: 'Too many submissions' }, { status: 429 });
  }

  const body = await req.json();
  const { name, city, postcode, specialties, bio, email, phone, website } = body;
  if (!name || !city || !email) {
    return NextResponse.json({ error: 'name, city, and email are required' }, { status: 400 });
  }
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  await sql`
    INSERT INTO law_firms (id, name, slug, city, postcode, specialties, bio, email, phone, website, featured_rank, verified, plan)
    VALUES (${uuid()}, ${name}, ${slug + '-' + uuid().slice(0,6)}, ${city}, ${postcode ?? ''}, ${JSON.stringify(specialties ?? [])}, ${bio ?? ''}, ${email}, ${phone ?? ''}, ${website ?? ''}, 0, false, 'free')
  `;
  return NextResponse.json({ ok: true });
}
