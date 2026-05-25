import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import { recallMemories, storeMemory } from '@/lib/memory/embeddings';
import { getUser } from '@/lib/supabase/server';
import { rateLimit } from '@/lib/rateLimit';
import { STU_SYSTEM_PROMPT } from '@/lib/legal/uk-system-prompt';
import { getRelevantKnowledge } from '@/lib/legal/uk-knowledge-base';

export const dynamic = 'force-dynamic';

// ── Model catalogue ──────────────────────────────────────────
export type ModelId =
  | 'claude-sonnet-4-5'
  | 'claude-opus-4-5'
  | 'claude-haiku-3-5'
  | 'gpt-4o'
  | 'gpt-4o-mini'
  | 'o3'
  | 'o4-mini';

export const MODELS: { id: ModelId; label: string; provider: 'anthropic' | 'openai'; description: string }[] = [
  { id: 'claude-sonnet-4-5',  label: 'Claude Sonnet',  provider: 'anthropic', description: 'Best balance of speed & depth' },
  { id: 'claude-opus-4-5',    label: 'Claude Opus',    provider: 'anthropic', description: 'Deepest reasoning, complex matters' },
  { id: 'claude-haiku-3-5',   label: 'Claude Haiku',   provider: 'anthropic', description: 'Fastest, simple queries' },
  { id: 'gpt-4o',             label: 'GPT-4o',         provider: 'openai',    description: 'OpenAI flagship model' },
  { id: 'gpt-4o-mini',        label: 'GPT-4o mini',    provider: 'openai',    description: 'Fast & cost-efficient' },
  { id: 'o3',                 label: 'o3',              provider: 'openai',    description: 'Deep multi-step reasoning' },
  { id: 'o4-mini',            label: 'o4-mini',         provider: 'openai',    description: 'Fast reasoning model' },
];

// ── Key helpers ──────────────────────────────────────────────
function getEnvKey(name: string): string {
  if (process.env[name]) return process.env[name]!;
  try {
    const content = fs.readFileSync(path.join(process.cwd(), '.env.local'), 'utf8');
    const match = content.match(new RegExp(`^${name}=(.+)$`, 'm'));
    if (match?.[1]) return match[1].trim();
  } catch {}
  throw new Error(`${name} not set`);
}

function getAnthropic() {
  return new Anthropic({ apiKey: getEnvKey('ANTHROPIC_API_KEY') });
}

function getOpenAI() {
  return new OpenAI({ apiKey: getEnvKey('OPENAI_API_KEY') });
}

// ── Anthropic stream ─────────────────────────────────────────
async function streamAnthropic(
  model: ModelId,
  systemPrompt: string,
  messages: { role: string; content: string }[],
  send: (obj: object) => void,
): Promise<string> {
  const useThinking = model === 'claude-sonnet-4-5' || model === 'claude-opus-4-5';
  let fullResponse = '';

  const s = getAnthropic().messages.stream({
    model,
    max_tokens: 16000,
    ...(useThinking ? { thinking: { type: 'enabled', budget_tokens: 8000 } } : {}),
    system: systemPrompt,
    messages: messages.map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
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
        fullResponse += d.text ?? '';
        send({ type: 'text', text: d.text ?? '' });
      }
    }
  }

  return fullResponse;
}

// ── OpenAI stream ────────────────────────────────────────────
async function streamOpenAI(
  model: ModelId,
  systemPrompt: string,
  messages: { role: string; content: string }[],
  send: (obj: object) => void,
): Promise<string> {
  let fullResponse = '';
  const isReasoning = model === 'o3' || model === 'o4-mini';

  const openaiMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: 'system', content: systemPrompt },
    ...messages.map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    })),
  ];

  const stream = await getOpenAI().chat.completions.create({
    model,
    messages: openaiMessages,
    stream: true,
    ...(isReasoning ? { max_completion_tokens: 16000 } : { max_tokens: 4096 }),
  });

  for await (const chunk of stream) {
    const delta = chunk.choices[0]?.delta?.content ?? '';
    if (delta) {
      fullResponse += delta;
      send({ type: 'text', text: delta });
    }
  }

  return fullResponse;
}

// ── Main handler ─────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const { messages, matterId, model: modelId } = await req.json();
    if (!messages?.length) {
      return NextResponse.json({ error: 'No messages provided' }, { status: 400 });
    }

    const model: ModelId = MODELS.find((m) => m.id === modelId)?.id ?? 'claude-sonnet-4-5';
    const modelMeta = MODELS.find((m) => m.id === model)!;

    // Auth bypassed for demo — use session user if available, else fall back to demo user
    const user = await getUser();
    const userId = user?.id ?? 'demo-user';

    // Rate limit: 60 AI requests per user per hour
    if (!rateLimit(`assistant:${userId}`, 60, 60 * 60 * 1000)) {
      return NextResponse.json({ error: 'Too many requests. Please wait a moment.' }, { status: 429 });
    }

    // Extract the last user message for memory recall + knowledge injection
    const lastUserMsg = [...messages].reverse().find((m: any) => m.role === 'user')?.content ?? '';

    // Recall relevant memories (stubbed — no-op until embeddings configured)
    const memories = await recallMemories(userId, lastUserMsg);
    const memoryContext = memories.length > 0
      ? `\n\n--- Context from previous conversations ---\n${memories.map((m, i) => `${i + 1}. ${m}`).join('\n')}\n---`
      : '';

    // Inject relevant UK law knowledge based on query topic
    const ukKnowledge = getRelevantKnowledge(lastUserMsg);

    // Build the full system prompt: UK legal AI + topic knowledge + memory
    const systemPrompt = STU_SYSTEM_PROMPT + ukKnowledge + memoryContext;

    const enc = new TextEncoder();
    let fullResponse = '';

    const stream = new ReadableStream({
      async start(ctrl) {
        const send = (obj: object) =>
          ctrl.enqueue(enc.encode(`data: ${JSON.stringify(obj)}\n\n`));

        try {
          if (modelMeta.provider === 'anthropic') {
            fullResponse = await streamAnthropic(model, systemPrompt, messages, send);
          } else {
            fullResponse = await streamOpenAI(model, systemPrompt, messages, send);
          }

          // Store conversation in memory (non-blocking)
          if (userId && lastUserMsg && fullResponse) {
            const memoryContent = `User asked: ${lastUserMsg.slice(0, 400)}\nStu replied: ${fullResponse.slice(0, 400)}`;
            storeMemory({ userId, content: memoryContent, sourceType: 'chat', matterId }).catch(() => {});
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
