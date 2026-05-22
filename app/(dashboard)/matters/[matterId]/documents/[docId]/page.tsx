import sql from '@/lib/db/pg';
import { notFound } from 'next/navigation';
import DocumentReviewClient from '@/components/document/DocumentReviewClient';

export default async function DocumentPage({ params }: { params: Promise<{ matterId: string; docId: string }> }) {
  const { matterId, docId } = await params;
  const [doc] = await sql`SELECT * FROM documents WHERE id=${docId} AND matter_id=${matterId}`;
  if (!doc) notFound();
  const [matter] = await sql`SELECT * FROM matters WHERE id=${matterId}`;
  const annotations = await sql`SELECT * FROM annotations WHERE document_id=${docId} ORDER BY start_offset ASC`;
  const messages = await sql`SELECT * FROM chat_messages WHERE document_id=${docId} ORDER BY created_at ASC`;
  const playbooks = await sql`SELECT id,name FROM playbooks ORDER BY is_default DESC, name ASC`;
  return <DocumentReviewClient doc={doc} matter={matter} annotations={annotations} initialMessages={messages} playbooks={playbooks} />;
}
