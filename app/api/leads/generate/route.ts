import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

export async function POST(req: NextRequest) {
  try {
    const { name, company, role, industry, painPoints, notes } = await req.json();

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Prospect name required' }, { status: 400 });
    }

    const context = [
      company   && `Company: ${company}`,
      role      && `Role: ${role}`,
      industry  && `Industry: ${industry}`,
      painPoints && `Likely pain points / context: ${painPoints}`,
      notes     && `Additional notes: ${notes}`,
    ].filter(Boolean).join('\n');

    const prompt = `You are a senior UK solicitor writing a concise, personalised cold outreach email to a business prospect to introduce your legal services.

Prospect details:
Name: ${name}
${context}

Write a short, warm but professional cold outreach email (under 220 words).

Guidelines:
- Open with a specific, relevant observation about their business or industry — not a generic compliment
- Briefly introduce yourself as a solicitor who works with businesses like theirs
- Reference one or two specific legal pain points they are likely experiencing (based on their industry/role/context)
- Offer a free 20-minute call to discuss their needs, no obligation
- Close with a clear, low-pressure CTA
- Tone: confident, human, no jargon, no fluff
- Sign off as "Stuart" from "Stuart & Co Solicitors"
- Do NOT use subject lines, headers, or markdown — plain email body text only
- Do NOT use phrases like "I hope this email finds you well", "I wanted to reach out", or any other clichéd openers`;

    const message = await client.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 600,
      messages: [{ role: 'user', content: prompt }],
    });

    const draft = (message.content[0] as { type: string; text: string }).text.trim();
    return NextResponse.json({ draft });
  } catch (e: any) {
    console.error('Lead generate error:', e);
    return NextResponse.json({ error: e.message || 'Generation failed' }, { status: 500 });
  }
}
