import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

export const dynamic = 'force-dynamic';

const SYSTEM = `You are a prompt engineer for a UK legal AI assistant called Stu. The user will give you a rough, short, or vague request. Your job is to rewrite it into a single, clear, well-structured prompt that will get a far better answer from a legal AI.

Rules:
- Keep the user's original intent and subject matter exactly. Never invent facts, names, figures, or jurisdictions they did not mention.
- Make it specific and well-scoped: state the task, the desired output format, and any context that is clearly implied.
- Assume English & Welsh law unless the user clearly indicates another UK jurisdiction.
- Write in clear professional British English.
- Output ONLY the improved prompt text. No preamble, no quotation marks, no commentary, no markdown headers. Just the rewritten prompt the user can send.
- Keep it concise — usually 1 to 4 sentences. Do not pad it.`;

export async function POST(req: NextRequest) {
  try {
    const { prompt } = await req.json();
    const text = (prompt || '').trim();
    if (!text) {
      return NextResponse.json({ error: 'No prompt provided' }, { status: 400 });
    }
    if (text.length > 4000) {
      return NextResponse.json({ improved: text });
    }

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const response = await client.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 700,
      system: SYSTEM,
      messages: [{ role: 'user', content: text }],
    });

    const block = response.content[0];
    const improved = block?.type === 'text' ? block.text.trim() : text;
    return NextResponse.json({ improved: improved || text });
  } catch (e: any) {
    console.error('improve-prompt error:', e);
    return NextResponse.json({ error: e?.message || 'Improve failed' }, { status: 500 });
  }
}
