import { NextRequest, NextResponse } from 'next/server';
import { sqlite } from '@/lib/db';
import { chatWithDocument } from '@/lib/ai';
import { v4 as uuidv4 } from 'uuid';

export async function POST(req: NextRequest) {
  try {
    const { documentId, messages } = await req.json();
    const doc = sqlite.prepare('SELECT extracted_text FROM documents WHERE id=?').get(documentId) as any;
    const docText = doc?.extracted_text || '';

    const enc = new TextEncoder();
    let fullResp = '';

    const stream = new ReadableStream({
      async start(ctrl) {
        try {
          for await (const chunk of chatWithDocument(docText, messages)) {
            fullResp += chunk;
            ctrl.enqueue(enc.encode(`data: ${JSON.stringify({ text: chunk })}\n\n`));
          }
          try {
            sqlite.prepare('INSERT INTO chat_messages (id,document_id,role,content) VALUES (?,?,?,?)').run(uuidv4(), documentId, 'assistant', fullResp);
          } catch {}
          ctrl.enqueue(enc.encode('data: [DONE]\n\n'));
        } catch (e: any) {
          ctrl.enqueue(enc.encode(`data: ${JSON.stringify({ error: e?.message || 'Stream error' })}\n\n`));
          ctrl.enqueue(enc.encode('data: [DONE]\n\n'));
        }
        ctrl.close();
      }
    });

    return new NextResponse(stream, { headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' } });
  } catch (e: any) {
    console.error('Chat error:', e);
    return NextResponse.json({ error: e?.message || 'Chat failed' }, { status: 500 });
  }
}
