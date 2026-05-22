import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  name: text('name').notNull(),
  role: text('role').notNull().default('user'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

export const matters = sqliteTable('matters', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  clientName: text('client_name').notNull(),
  type: text('type').notNull(),
  status: text('status').notNull().default('active'),
  description: text('description'),
  createdBy: text('created_by'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
});

export const documents = sqliteTable('documents', {
  id: text('id').primaryKey(),
  matterId: text('matter_id'),
  filename: text('filename').notNull(),
  originalName: text('original_name').notNull(),
  mimeType: text('mime_type').notNull(),
  sizeBytes: integer('size_bytes').notNull(),
  storagePath: text('storage_path').notNull(),
  extractedText: text('extracted_text'),
  status: text('status').notNull().default('processing'),
  uploadedBy: text('uploaded_by'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

export const annotations = sqliteTable('annotations', {
  id: text('id').primaryKey(),
  documentId: text('document_id'),
  pageNumber: integer('page_number'),
  startOffset: integer('start_offset'),
  endOffset: integer('end_offset'),
  annotationType: text('annotation_type').notNull(),
  severity: text('severity').notNull(),
  comment: text('comment'),
  suggestion: text('suggestion'),
  aiGenerated: integer('ai_generated').default(1),
  createdBy: text('created_by'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

export const chatMessages = sqliteTable('chat_messages', {
  id: text('id').primaryKey(),
  documentId: text('document_id'),
  matterId: text('matter_id'),
  role: text('role').notNull(),
  content: text('content').notNull(),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

export const playbooks = sqliteTable('playbooks', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  checklistItems: text('checklist_items').notNull(),
  createdBy: text('created_by'),
  isDefault: integer('is_default').default(0),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

export const templates = sqliteTable('templates', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  content: text('content').notNull(),
  variables: text('variables').notNull(),
  category: text('category'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

export const researchNotes = sqliteTable('research_notes', {
  id: text('id').primaryKey(),
  matterId: text('matter_id'),
  question: text('question').notNull(),
  answer: text('answer').notNull(),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});
