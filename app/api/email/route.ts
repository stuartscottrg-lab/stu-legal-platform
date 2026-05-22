import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const API_KEY = process.env.ANTHROPIC_API_KEY || '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';
const anthropic = new Anthropic({ apiKey: API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { recipient, subject, brief, tone, senderName, matter } = await req.json();
    if (!brief?.trim()) return NextResponse.json({ error: 'Brief is required' }, { status: 400 });

    const toneGuide: Record<string, string> = {
      professional: 'formal, precise, and professional — appropriate for court filings or senior partner correspondence',
      firm: 'direct and firm — asserting a legal position clearly without being aggressive',
      friendly: 'warm and approachable — appropriate for trusted client updates',
      urgent: 'urgent but professional — conveying time-sensitivity without alarm',
    };

    const prompt = `Draft a legal email with the following brief:

Recipient: ${recipient || 'the recipient'}
Subject: ${subject || '(to be determined)'}
Matter: ${matter || 'general legal matter'}
Sender: ${senderName || 'Stuart'}
Tone: ${toneGuide[tone] || toneGuide.professional}

Brief / what the email needs to achieve:
${brief}

Output ONLY the email body (no subject line header, no meta commentary). Start with the salutation. End with a professional sign-off including the sender name. Use plain paragraphs — no bullet points or markdown formatting. Keep it concise and purposeful.`;

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 1024,
      system: 'You are a senior legal professional drafting emails on behalf of a law firm. You write clearly, precisely, and appropriately for the legal context. Never use bullet points or markdown in email body text.',
      messages: [{ role: 'user', content: prompt }],
    });

    const draft = response.content[0].type === 'text' ? response.content[0].text : '';
    return NextResponse.json({ draft });
  } catch (e: any) {
    console.error('Email draft error:', e);
    return NextResponse.json({ error: e?.message || 'Draft failed' }, { status: 500 });
  }
}
