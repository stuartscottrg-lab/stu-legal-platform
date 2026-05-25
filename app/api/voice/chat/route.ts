import { NextRequest } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

export const dynamic = 'force-dynamic';

const VOICE_SYSTEM = `You are Stu, a senior UK legal AI assistant speaking in a live voice conversation.

STRICT RULES — you are being read aloud, not displayed on screen:
- Maximum 3 sentences per response. Never more.
- Speak in natural, complete sentences. No bullet points, no headers, no lists, no markdown.
- Tone: authoritative, precise, and calm — like a senior solicitor at a Magic Circle firm.
- Give concrete, useful answers. Never say "it depends" without immediately explaining what it depends on.
- When citing cases or statutes, say them naturally as you would in speech.
- End every response with a complete thought. Never trail off.
- If asked something outside UK law, acknowledge briefly and redirect.`;

export async function POST(req: NextRequest) {
  const { messages } = await req.json();

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

  const stream = anthropic.messages.stream({
    model: 'claude-sonnet-4-5',
    max_tokens: 280,
    system: VOICE_SYSTEM,
    messages: messages.map((m: { role: string; content: string }) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    })),
  });

  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        if (
          chunk.type === 'content_block_delta' &&
          chunk.delta.type === 'text_delta'
        ) {
          controller.enqueue(encoder.encode(chunk.delta.text));
        }
      }
      controller.close();
    },
  });

  return new Response(readable, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
