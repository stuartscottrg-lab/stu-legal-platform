import sql from '@/lib/db/pg';
import { notFound } from 'next/navigation';
import DocumentViewer from '@/components/document/DocumentViewer';

export default async function DocumentViewerPage({ params }: { params: Promise<{ docId: string }> }) {
  const { docId } = await params;
  const [doc] = await sql`SELECT * FROM documents WHERE id=${docId}`;
  if (!doc) notFound();

  const [matter] = doc.matter_id
    ? await sql`SELECT * FROM matters WHERE id=${doc.matter_id}`
    : [null];

  const annotations = await sql`SELECT * FROM annotations WHERE document_id=${docId} ORDER BY start_offset ASC`;
  const messages = await sql`SELECT * FROM chat_messages WHERE document_id=${docId} ORDER BY created_at ASC`;

  return <DocumentViewer doc={doc} matter={matter ?? null} annotations={annotations} initialMessages={messages} />;
}
