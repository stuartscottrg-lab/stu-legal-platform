import { sqlite } from '@/lib/db';
import { notFound } from 'next/navigation';
import DocumentReviewClient from '@/components/document/DocumentReviewClient';

export default async function DocumentPage({ params }: { params: Promise<{ matterId: string; docId: string }> }) {
  const { matterId, docId } = await params;
  const doc = sqlite.prepare('SELECT * FROM documents WHERE id=? AND matter_id=?').get(docId, matterId) as any;
  if (!doc) notFound();
  const matter = sqlite.prepare('SELECT * FROM matters WHERE id=?').get(matterId) as any;
  const annotations = sqlite.prepare('SELECT * FROM annotations WHERE document_id=? ORDER BY start_offset ASC').all(docId) as any[];
  const messages = sqlite.prepare('SELECT * FROM chat_messages WHERE document_id=? ORDER BY created_at ASC').all(docId) as any[];
  const playbooks = sqlite.prepare('SELECT id,name FROM playbooks ORDER BY is_default DESC, name ASC').all() as any[];
  return <DocumentReviewClient doc={doc} matter={matter} annotations={annotations} initialMessages={messages} playbooks={playbooks} />;
}
