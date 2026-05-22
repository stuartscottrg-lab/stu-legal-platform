import { sqlite } from '@/lib/db';
import { notFound } from 'next/navigation';
import DocumentViewer from '@/components/document/DocumentViewer';

export default async function DocumentViewerPage({ params }: { params: Promise<{ docId: string }> }) {
  const { docId } = await params;
  const doc = sqlite.prepare('SELECT * FROM documents WHERE id=?').get(docId) as any;
  if (!doc) notFound();

  const matter = doc.matter_id
    ? sqlite.prepare('SELECT * FROM matters WHERE id=?').get(doc.matter_id) as any
    : null;

  const annotations = sqlite.prepare(
    'SELECT * FROM annotations WHERE document_id=? ORDER BY start_offset ASC'
  ).all(docId) as any[];

  const messages = sqlite.prepare(
    'SELECT * FROM chat_messages WHERE document_id=? ORDER BY created_at ASC'
  ).all(docId) as any[];

  return <DocumentViewer doc={doc} matter={matter} annotations={annotations} initialMessages={messages} />;
}
