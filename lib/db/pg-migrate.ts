import sql from './pg';

let ran = false;

export async function runPgMigrations() {
  if (ran) return;
  ran = true;
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS matters (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        client_name TEXT NOT NULL,
        type TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'active',
        description TEXT,
        created_by TEXT,
        archived_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `;
    await sql`
      CREATE TABLE IF NOT EXISTS documents (
        id TEXT PRIMARY KEY,
        matter_id TEXT,
        filename TEXT NOT NULL,
        original_name TEXT NOT NULL,
        mime_type TEXT NOT NULL,
        size_bytes INTEGER NOT NULL,
        storage_path TEXT NOT NULL,
        extracted_text TEXT,
        status TEXT NOT NULL DEFAULT 'processing',
        uploaded_by TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `;
    await sql`
      CREATE TABLE IF NOT EXISTS annotations (
        id TEXT PRIMARY KEY,
        document_id TEXT,
        page_number INTEGER,
        start_offset INTEGER,
        end_offset INTEGER,
        annotation_type TEXT NOT NULL,
        severity TEXT NOT NULL,
        comment TEXT,
        suggestion TEXT,
        ai_generated INTEGER DEFAULT 1,
        created_by TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `;
    await sql`
      CREATE TABLE IF NOT EXISTS chat_messages (
        id TEXT PRIMARY KEY,
        document_id TEXT,
        matter_id TEXT,
        role TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `;
    await sql`
      CREATE TABLE IF NOT EXISTS playbooks (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        checklist_items TEXT NOT NULL,
        created_by TEXT,
        is_default INTEGER DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `;
    await sql`
      CREATE TABLE IF NOT EXISTS templates (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        content TEXT NOT NULL,
        variables TEXT NOT NULL,
        category TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `;
    await sql`
      CREATE TABLE IF NOT EXISTS research_notes (
        id TEXT PRIMARY KEY,
        matter_id TEXT,
        question TEXT NOT NULL,
        answer TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `;
    await sql`
      CREATE TABLE IF NOT EXISTS time_entries (
        id TEXT PRIMARY KEY,
        matter_id TEXT,
        description TEXT NOT NULL,
        minutes INTEGER NOT NULL,
        hourly_rate REAL DEFAULT 0,
        date TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `;
    await sql`
      CREATE TABLE IF NOT EXISTS tabular_reviews (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        columns TEXT NOT NULL DEFAULT '[]',
        document_ids TEXT NOT NULL DEFAULT '[]',
        results TEXT NOT NULL DEFAULT '{}',
        created_by TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `;
    await sql`
      CREATE TABLE IF NOT EXISTS connector_tokens (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        provider TEXT NOT NULL,
        account TEXT,
        access_token TEXT,
        refresh_token TEXT,
        expires_at INTEGER,
        scope TEXT,
        extra TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(user_id, provider)
      )
    `;
    await sql`
      CREATE TABLE IF NOT EXISTS law_firms (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        slug TEXT UNIQUE,
        city TEXT NOT NULL,
        postcode TEXT,
        specialties TEXT NOT NULL DEFAULT '[]',
        bio TEXT,
        email TEXT,
        phone TEXT,
        website TEXT,
        logo_url TEXT,
        featured_rank INTEGER DEFAULT 0,
        verified BOOLEAN DEFAULT FALSE,
        stripe_customer_id TEXT,
        plan TEXT DEFAULT 'free',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `;
    await sql`
      CREATE TABLE IF NOT EXISTS firm_reviews (
        id TEXT PRIMARY KEY,
        firm_id TEXT NOT NULL,
        user_id TEXT,
        rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
        comment TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `;
    await sql`
      CREATE TABLE IF NOT EXISTS stripe_subscriptions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        stripe_customer_id TEXT,
        stripe_subscription_id TEXT,
        plan TEXT NOT NULL DEFAULT 'free',
        status TEXT NOT NULL DEFAULT 'active',
        current_period_end TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `;
    console.log('✅ Postgres migrations complete');
  } catch (e) {
    console.error('Postgres migration error:', e);
  }
}

export async function seedLawFirms() {
  const existing = await sql`SELECT id FROM law_firms LIMIT 1`;
  if (existing.length > 0) return;

  const { v4: uuid } = await import('uuid');

  const firms = [
    {
      name: 'Thornton & Blake Solicitors',
      slug: 'thornton-blake',
      city: 'London',
      postcode: 'EC2A 4PH',
      specialties: ['Corporate', 'M&A', 'Private Equity'],
      bio: 'A boutique City firm specialising in high-value M&A and private equity transactions. Over 30 years advising FTSE 350 companies and PE houses.',
      email: 'enquiries@thorntonblake.co.uk',
      phone: '020 7946 0821',
      website: 'https://thorntonblake.co.uk',
      featured_rank: 3,
      verified: true,
      plan: 'featured',
    },
    {
      name: 'Meridian Family Law',
      slug: 'meridian-family',
      city: 'Manchester',
      postcode: 'M2 4WU',
      specialties: ['Family', 'Divorce', 'Child Arrangements'],
      bio: 'Compassionate, no-nonsense family law from Manchester city centre. Resolution accredited specialists in complex financial remedy and international children cases.',
      email: 'hello@meridianfamilylaw.co.uk',
      phone: '0161 834 5529',
      website: 'https://meridianfamilylaw.co.uk',
      featured_rank: 2,
      verified: true,
      plan: 'featured',
    },
    {
      name: 'Apex Employment Law',
      slug: 'apex-employment',
      city: 'Birmingham',
      postcode: 'B3 2RH',
      specialties: ['Employment', 'Discrimination', 'Redundancy'],
      bio: 'Employment specialists acting for both employees and businesses. Tribunal veterans with a track record in discrimination and whistleblowing claims.',
      email: 'advice@apexemploymentlaw.co.uk',
      phone: '0121 200 7441',
      website: 'https://apexemploymentlaw.co.uk',
      featured_rank: 2,
      verified: true,
      plan: 'featured',
    },
    {
      name: 'Castle Property Solicitors',
      slug: 'castle-property',
      city: 'Bristol',
      postcode: 'BS1 4QA',
      specialties: ['Residential Property', 'Conveyancing', 'Landlord & Tenant'],
      bio: 'Fixed-fee residential and commercial property from Bristol. Straightforward conveyancing with no hidden charges — most transactions completed in 8 weeks.',
      email: 'property@castlesolicitors.co.uk',
      phone: '0117 922 8843',
      website: 'https://castlesolicitors.co.uk',
      featured_rank: 1,
      verified: true,
      plan: 'standard',
    },
    {
      name: 'Kestrel Criminal Defence',
      slug: 'kestrel-criminal',
      city: 'Leeds',
      postcode: 'LS1 5RR',
      specialties: ['Criminal Defence', 'Regulatory', 'Fraud'],
      bio: 'Legal aid and private criminal defence from West Yorkshire. 24/7 police station representation. Serious crime and fraud panel accredited.',
      email: 'urgent@kestreldefence.co.uk',
      phone: '0113 244 6671',
      website: 'https://kestreldefence.co.uk',
      featured_rank: 0,
      verified: true,
      plan: 'standard',
    },
    {
      name: 'Harrington Immigration Law',
      slug: 'harrington-immigration',
      city: 'London',
      postcode: 'WC1A 1DD',
      specialties: ['Immigration', 'Visa Applications', 'Asylum'],
      bio: 'OISC Level 3 regulated immigration specialists. Global Business Mobility, skilled worker visas, and complex asylum appeals.',
      email: 'visas@harringtonimlaw.co.uk',
      phone: '020 7831 4299',
      website: 'https://harringtonimlaw.co.uk',
      featured_rank: 1,
      verified: false,
      plan: 'standard',
    },
  ];

  for (const firm of firms) {
    await sql`
      INSERT INTO law_firms (id, name, slug, city, postcode, specialties, bio, email, phone, website, featured_rank, verified, plan)
      VALUES (
        ${uuid()}, ${firm.name}, ${firm.slug}, ${firm.city}, ${firm.postcode},
        ${JSON.stringify(firm.specialties)}, ${firm.bio}, ${firm.email}, ${firm.phone},
        ${firm.website}, ${firm.featured_rank}, ${firm.verified}, ${firm.plan}
      )
    `;
  }
  console.log('✅ Law firms seeded');
}
