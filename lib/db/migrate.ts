import { sqlite } from './index';
import bcrypt from 'bcryptjs';

let seeded = false;

export function runMigrations() {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY, email TEXT NOT NULL UNIQUE,
      password_hash TEXT, name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'member', created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
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
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, provider)
    );
    CREATE TABLE IF NOT EXISTS matters (
      id TEXT PRIMARY KEY, title TEXT NOT NULL, client_name TEXT NOT NULL,
      type TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'active', description TEXT,
      created_by TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);
  // Safe add-column migrations (ignored if column already exists)
  try { sqlite.exec(`ALTER TABLE matters ADD COLUMN archived_at TEXT`); } catch {}
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS documents (
      id TEXT PRIMARY KEY, matter_id TEXT, filename TEXT NOT NULL,
      original_name TEXT NOT NULL, mime_type TEXT NOT NULL, size_bytes INTEGER NOT NULL,
      storage_path TEXT NOT NULL, extracted_text TEXT,
      status TEXT NOT NULL DEFAULT 'processing', uploaded_by TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS annotations (
      id TEXT PRIMARY KEY, document_id TEXT, page_number INTEGER,
      start_offset INTEGER, end_offset INTEGER,
      annotation_type TEXT NOT NULL, severity TEXT NOT NULL,
      comment TEXT, suggestion TEXT, ai_generated INTEGER DEFAULT 1,
      created_by TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS chat_messages (
      id TEXT PRIMARY KEY, document_id TEXT, matter_id TEXT,
      role TEXT NOT NULL, content TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS playbooks (
      id TEXT PRIMARY KEY, name TEXT NOT NULL, description TEXT,
      checklist_items TEXT NOT NULL, created_by TEXT,
      is_default INTEGER DEFAULT 0, created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS templates (
      id TEXT PRIMARY KEY, name TEXT NOT NULL, description TEXT,
      content TEXT NOT NULL, variables TEXT NOT NULL, category TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS research_notes (
      id TEXT PRIMARY KEY, matter_id TEXT, question TEXT NOT NULL,
      answer TEXT NOT NULL, created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS time_entries (
      id TEXT PRIMARY KEY, matter_id TEXT, description TEXT NOT NULL,
      minutes INTEGER NOT NULL, hourly_rate REAL DEFAULT 0,
      date TEXT NOT NULL, created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS leads (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      company TEXT,
      email TEXT,
      role TEXT,
      industry TEXT,
      pain_points TEXT,
      notes TEXT,
      status TEXT NOT NULL DEFAULT 'draft',
      email_draft TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS tabular_reviews (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      columns TEXT NOT NULL DEFAULT '[]',
      document_ids TEXT NOT NULL DEFAULT '[]',
      results TEXT NOT NULL DEFAULT '{}',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

export async function seedDatabase() {
  if (seeded) return;
  const existing = sqlite.prepare('SELECT id FROM users WHERE email = ?').get('demo@firm.com');
  if (existing) { seeded = true; return; }

  const { v4: uuidv4 } = await import('uuid');
  const passwordHash = await bcrypt.hash('password123', 10);
  const userId = uuidv4();

  sqlite.prepare('INSERT INTO users (id,email,password_hash,name,role) VALUES (?,?,?,?,?)').run(
    userId, 'demo@firm.com', passwordHash, 'Stuart', 'admin'
  );

  // Playbooks
  const playbooks = [
    { name: 'NDA Review', desc: 'Standard NDA review checklist', items: [
      { label: 'Definition of Confidential Information', prompt: 'Is the definition of Confidential Information appropriately scoped?', severity: 'high' },
      { label: 'Obligations of Receiving Party', prompt: 'Are receiving party obligations clearly defined?', severity: 'high' },
      { label: 'Term and Termination', prompt: 'What is the NDA duration and survival period?', severity: 'medium' },
      { label: 'Governing Law', prompt: 'Is the governing law clause appropriate?', severity: 'medium' },
      { label: 'Permitted Disclosures', prompt: 'Are permitted disclosure exceptions properly defined?', severity: 'medium' },
      { label: 'Remedies', prompt: 'Does the NDA include adequate remedies including injunctive relief?', severity: 'high' },
    ]},
    { name: 'Service Agreement Review', desc: 'Professional services agreement checklist', items: [
      { label: 'Scope of Services', prompt: 'Is the scope of services clearly and specifically defined?', severity: 'high' },
      { label: 'Payment Terms', prompt: 'Are payment terms, invoicing, and late payment provisions clear?', severity: 'high' },
      { label: 'IP Ownership', prompt: 'Who owns IP created during the engagement?', severity: 'high' },
      { label: 'Limitation of Liability', prompt: 'Is there a liability cap and are exclusions reasonable?', severity: 'high' },
      { label: 'Indemnification', prompt: 'Are indemnification provisions balanced between parties?', severity: 'medium' },
      { label: 'Termination Rights', prompt: 'What are the termination rights and notice periods?', severity: 'medium' },
    ]},
    { name: 'Employment Contract Review', desc: 'Employment agreement checklist', items: [
      { label: 'Compensation & Benefits', prompt: 'Are salary, bonus, and benefits clearly defined?', severity: 'high' },
      { label: 'Non-Compete', prompt: 'Is the non-compete clause reasonable in scope, geography, and duration?', severity: 'high' },
      { label: 'Termination Provisions', prompt: 'Are termination grounds, notice, and severance adequate?', severity: 'high' },
      { label: 'IP Assignment', prompt: 'Are IP assignment clauses appropriately scoped?', severity: 'medium' },
    ]},
  ];

  for (const p of playbooks) {
    sqlite.prepare('INSERT INTO playbooks (id,name,description,checklist_items,is_default) VALUES (?,?,?,?,1)').run(
      uuidv4(), p.name, p.desc, JSON.stringify(p.items)
    );
  }

  // Template
  sqlite.prepare('INSERT INTO templates (id,name,description,content,variables,category) VALUES (?,?,?,?,?,?)').run(
    uuidv4(), 'Non-Disclosure Agreement', 'Standard mutual NDA',
    `NON-DISCLOSURE AGREEMENT

This Non-Disclosure Agreement ("Agreement") is entered into as of {{effective_date}} by and between {{party_a_name}} ("Party A") and {{party_b_name}} ("Party B").

1. CONFIDENTIAL INFORMATION
"Confidential Information" means any non-public information disclosed by one Party to the other that is designated as confidential or reasonably should be understood to be confidential.

2. OBLIGATIONS
The Receiving Party shall: (a) hold Confidential Information in strict confidence; (b) not disclose it to third parties without prior written consent; (c) use it solely to evaluate a potential business relationship.

3. TERM
This Agreement shall remain in effect for {{term_years}} years. Confidentiality obligations shall survive for {{survival_years}} years after termination.

4. GOVERNING LAW
This Agreement shall be governed by the laws of {{governing_law}}.

5. REMEDIES
The Receiving Party acknowledges breach may cause irreparable harm. The Disclosing Party may seek equitable relief in addition to all other remedies.

{{party_a_name}}                    {{party_b_name}}
By: ___________________            By: ___________________`,
    JSON.stringify(['party_a_name','party_b_name','effective_date','governing_law','term_years','survival_years']),
    'confidentiality'
  );

  // Sample matters
  const m1 = uuidv4(), m2 = uuidv4();
  sqlite.prepare('INSERT INTO matters (id,title,client_name,type,status,description,created_by) VALUES (?,?,?,?,?,?,?)').run(
    m1, 'Meridian Capital NDA', 'Meridian Capital Partners', 'transactional', 'active',
    'NDA review for potential Series B investment discussion', userId
  );
  sqlite.prepare('INSERT INTO matters (id,title,client_name,type,status,description,created_by) VALUES (?,?,?,?,?,?,?)').run(
    m2, 'Apex Tech Services Agreement', 'Apex Technology Ltd', 'transactional', 'active',
    'Software development services agreement review', userId
  );

  seeded = true;
  console.log('✅ Database seeded');
}
