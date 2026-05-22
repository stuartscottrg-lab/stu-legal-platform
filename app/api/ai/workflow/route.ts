import { NextRequest, NextResponse } from 'next/server';
import { sqlite } from '@/lib/db';
import { summarizeDocument, generateRedactions, translateDocument, runPlaybookItem } from '@/lib/ai';

export async function POST(req: NextRequest) {
  try {
    const { action, documentId, params } = await req.json();
    const doc = sqlite.prepare('SELECT * FROM documents WHERE id=?').get(documentId) as any;
    if (!doc) return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    const text = doc.extracted_text || '';

    if (action === 'summarize') {
      const result = await summarizeDocument(text);
      return NextResponse.json({ result });
    }
    if (action === 'redact') {
      const redactions = await generateRedactions(text);
      return NextResponse.json({ redactions });
    }
    if (action === 'translate') {
      const result = await translateDocument(text, params?.language || 'French');
      return NextResponse.json({ result });
    }
    if (action === 'playbook') {
      const pb = sqlite.prepare('SELECT * FROM playbooks WHERE id=?').get(params?.playbookId) as any;
      if (!pb) return NextResponse.json({ error: 'Playbook not found' }, { status: 404 });
      const items = JSON.parse(pb.checklist_items);
      const enc = new TextEncoder();
      const stream = new ReadableStream({
        async start(ctrl) {
          try {
            for (const item of items) {
              const r = await runPlaybookItem(text, item);
              ctrl.enqueue(enc.encode(`data: ${JSON.stringify(r)}\n\n`));
            }
            ctrl.enqueue(enc.encode('data: [DONE]\n\n'));
          } catch (e: any) {
            ctrl.enqueue(enc.encode(`data: ${JSON.stringify({ error: e?.message })}\n\n`));
          }
          ctrl.close();
        }
      });
      return new NextResponse(stream, { headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' } });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (e: any) {
    console.error('Workflow error:', e);
    return NextResponse.json({ error: e?.message || 'AI request failed' }, { status: 500 });
  }
}
