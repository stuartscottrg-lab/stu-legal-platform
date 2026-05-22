import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import fs from 'fs';
import path from 'path';
import { getPersona, DEFAULT_PERSONA_ID } from '@/lib/personas';

export const dynamic = 'force-dynamic';

function getApiKey(): string {
  if (process.env.ANTHROPIC_API_KEY) return process.env.ANTHROPIC_API_KEY;
  try {
    const content = fs.readFileSync(path.join(process.cwd(), '.env.local'), 'utf8');
    const match = content.match(/^ANTHROPIC_API_KEY=(.+)$/m);
    if (match?.[1]) return match[1].trim();
  } catch {}
  throw new Error('ANTHROPIC_API_KEY not set');
}

function getAnthropic() {
  return new Anthropic({ apiKey: getApiKey() });
}

export async function POST(req: NextRequest) {
  try {
    const { messages, personaId } = await req.json();
    if (!messages?.length) {
      return NextResponse.json({ error: 'No messages provided' }, { status: 400 });
    }

    const persona = getPersona(personaId ?? DEFAULT_PERSONA_ID);

    const enc = new TextEncoder();
    const stream = new ReadableStream({
      async start(ctrl) {
        const send = (obj: object) =>
          ctrl.enqueue(enc.encode(`data: ${JSON.stringify(obj)}\n\n`));

        try {
          const s = getAnthropic().messages.stream({
            model: 'claude-sonnet-4-5',
            max_tokens: 16000,
            thinking: { type: 'enabled', budget_tokens: 8000 },
            system: persona.systemPrompt,
            messages: messages.map((m: any) => ({ role: m.role, content: m.content })),
          });

          for await (const chunk of s) {
            if (chunk.type === 'content_block_start') {
              const cb = (chunk as any).content_block;
              if (cb?.type === 'thinking') send({ type: 'thinking_start' });
            }
            if (chunk.type === 'content_block_delta') {
              const d = (chunk as any).delta;
              if (d?.type === 'thinking_delta') {
                send({ type: 'thinking', text: d.thinking ?? '' });
              } else if (d?.type === 'text_delta') {
                send({ type: 'text', text: d.text ?? '' });
              }
            }
          }
        } catch (e: any) {
          const msg = e?.message || 'AI error';
          const isAuthErr = msg.includes('authentication') || msg.includes('api_key') || msg.includes('401');
          send({
            type: 'error',
            text: isAuthErr
              ? 'AI service temporarily unavailable. Please try again in a moment.'
              : `Error: ${msg}`,
          });
        }

        send({ type: 'done' });
        ctrl.enqueue(enc.encode('data: [DONE]\n\n'));
        ctrl.close();
      },
    });

    return new NextResponse(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'X-Accel-Buffering': 'no',
      },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed' }, { status: 500 });
  }
}
