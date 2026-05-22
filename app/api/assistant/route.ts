import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const API_KEY = process.env.ANTHROPIC_API_KEY || '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';
const anthropic = new Anthropic({ apiKey: API_KEY });

const SYSTEM = `You are Stu, an expert AI legal assistant with deep knowledge of contract law, corporate law, employment law, and legal drafting across common law jurisdictions — primarily England & Wales.

You assist qualified lawyers and legal professionals. Your analysis is precise, practical, and grounded in legal reasoning. You write clearly without unnecessary jargon, in a tone that feels like a trusted senior colleague.

Guidelines:
- When asked to research, cite key principles and cases but note they should be independently verified
- When drafting, produce clean, precise legal language
- When reviewing, flag specific risks with reference to clause language
- Always be direct and substantive — avoid hedging with excessive caveats
- Use plain paragraphs for conversational answers; use structured headings for detailed analysis
- If context about a specific matter is provided, tailor your response to it`;

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();
    if (!messages?.length) {
      return NextResponse.json({ error: 'No messages provided' }, { status: 400 });
    }

    const enc = new TextEncoder();
    const stream = new ReadableStream({
      async start(ctrl) {
        try {
          const s = await anthropic.messages.stream({
            model: 'claude-sonnet-4-5',
            max_tokens: 2048,
            system: SYSTEM,
            messages: messages.map((m: any) => ({ role: m.role, content: m.content })),
          });

          for await (const chunk of s) {
            if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
              ctrl.enqueue(enc.encode(`data: ${JSON.stringify({ text: chunk.delta.text })}\n\n`));
            }
          }
        } catch (e: any) {
          ctrl.enqueue(enc.encode(`data: ${JSON.stringify({ error: e?.message || 'AI error' })}\n\n`));
        }
        ctrl.enqueue(enc.encode('data: [DONE]\n\n'));
        ctrl.close();
      },
    });

    return new NextResponse(stream, {
      headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'X-Accel-Buffering': 'no' },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed' }, { status: 500 });
  }
}
