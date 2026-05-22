import { NextRequest, NextResponse } from 'next/server';
import { sqlite } from '@/lib/db';
import Anthropic from '@anthropic-ai/sdk';

const API_KEY = process.env.ANTHROPIC_API_KEY || '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';
const anthropic = new Anthropic({ apiKey: API_KEY });

const SYSTEM = `You are an expert legal AI assistant with deep knowledge of contract law, corporate law, and legal drafting conventions across common law and civil law jurisdictions. You assist qualified lawyers and legal professionals. Your analysis is precise, thorough, and grounded in legal reasoning.`;

export async function POST(req: NextRequest) {
  try {
    const { workflowPrompt, documentId, documentIds } = await req.json();
    if (!workflowPrompt) return NextResponse.json({ error: 'Missing workflowPrompt' }, { status: 400 });

    // Build document context
    let docContext = '';
    const ids: string[] = documentIds || (documentId ? [documentId] : []);
    for (const id of ids) {
      const doc = sqlite.prepare('SELECT original_name, extracted_text FROM documents WHERE id=?').get(id) as any;
      if (doc?.extracted_text) {
        docContext += `\n\n--- Document: ${doc.original_name} ---\n${doc.extracted_text.slice(0, 40000)}`;
      }
    }

    if (!docContext) {
      return NextResponse.json({ error: 'No extractable text found in the selected document(s).' }, { status: 400 });
    }

    const userMessage = `${workflowPrompt}\n\n${docContext}`;
    const enc = new TextEncoder();

    const stream = new ReadableStream({
      async start(ctrl) {
        try {
          const llmStream = anthropic.messages.stream({
            model: 'claude-sonnet-4-5',
            max_tokens: 4096,
            system: SYSTEM,
            messages: [{ role: 'user', content: userMessage }],
          });
          for await (const chunk of llmStream) {
            if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
              ctrl.enqueue(enc.encode(`data: ${JSON.stringify({ text: chunk.delta.text })}\n\n`));
            }
          }
          ctrl.enqueue(enc.encode('data: [DONE]\n\n'));
        } catch (e: any) {
          ctrl.enqueue(enc.encode(`data: ${JSON.stringify({ error: e?.message || 'Stream error' })}\n\n`));
          ctrl.enqueue(enc.encode('data: [DONE]\n\n'));
        }
        ctrl.close();
      }
    });

    return new NextResponse(stream, {
      headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' }
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed' }, { status: 500 });
  }
}
