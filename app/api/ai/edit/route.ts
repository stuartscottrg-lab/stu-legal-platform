import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { sqlite } from '@/lib/db';

export const dynamic = 'force-dynamic';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { docId, instruction, selectedText } = await req.json();
    const doc = sqlite.prepare('SELECT * FROM documents WHERE id=?').get(docId) as any;
    if (!doc?.extracted_text) return NextResponse.json({ error: 'Document not found or not processed' }, { status: 404 });

    const systemPrompt = `You are a precise legal document editor. The user will give you an instruction to edit a legal document.

Your response must be in two parts, separated by the exact marker "---REVISED---":
1. A brief explanation (2-3 sentences) of what you changed and why.
2. The complete revised document text (or the revised section if they selected specific text).

Example format:
I have strengthened the indemnification clause to provide better protection for your client and clarified the liability cap.

---REVISED---
[The complete revised text here]

CRITICAL: After ---REVISED--- output ONLY the revised text. No commentary, no explanation, no markdown. Just the clean document text.`;

    const userMessage = selectedText
      ? `Instruction: ${instruction}\n\nSelected text to edit:\n${selectedText}\n\nFull document for context:\n${doc.extracted_text.slice(0, 8000)}`
      : `Instruction: ${instruction}\n\nFull document:\n${doc.extracted_text.slice(0, 12000)}`;

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const send = (data: object) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        };

        try {
          const response = await client.messages.create({
            model: 'claude-opus-4-5',
            max_tokens: 8000,
            system: systemPrompt,
            messages: [{ role: 'user', content: userMessage }],
            stream: true,
          });

          let fullText = '';
          let phase: 'explanation' | 'revised' = 'explanation';
          let explanationBuffer = '';
          let revisedBuffer = '';

          for await (const event of response) {
            if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
              const chunk = event.delta.text;
              fullText += chunk;

              // Detect phase transition
              if (phase === 'explanation' && fullText.includes('---REVISED---')) {
                const parts = fullText.split('---REVISED---');
                explanationBuffer = parts[0].trim();
                revisedBuffer = parts[1] || '';
                phase = 'revised';
                send({ type: 'explanation', text: explanationBuffer });
                if (revisedBuffer) send({ type: 'revised_chunk', text: revisedBuffer });
              } else if (phase === 'explanation') {
                // Still accumulating explanation
              } else {
                // Streaming revised text
                revisedBuffer += chunk;
                send({ type: 'revised_chunk', text: chunk });
              }
            }
          }

          // If we never found the marker, send the whole thing as explanation
          if (phase === 'explanation') {
            send({ type: 'explanation', text: fullText.trim() });
          }

          send({ type: 'done', fullRevised: revisedBuffer.trim() });
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        } catch (e: any) {
          send({ type: 'error', text: e?.message || 'Edit failed' });
        }
        controller.close();
      },
    });

    return new NextResponse(stream, {
      headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'X-Accel-Buffering': 'no' },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message }, { status: 500 });
  }
}
