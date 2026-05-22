import { NextRequest, NextResponse } from 'next/server';
import { sqlite } from '@/lib/db';
import Anthropic from '@anthropic-ai/sdk';
import { v4 as uuidv4 } from 'uuid';

import fs from 'fs';
import pathMod from 'path';
function getApiKey(){if(process.env.ANTHROPIC_API_KEY)return process.env.ANTHROPIC_API_KEY;try{const c=fs.readFileSync(pathMod.join(process.cwd(),'.env.local'),'utf8');const m=c.match(/^ANTHROPIC_API_KEY=(.+)$/m);if(m?.[1])return m[1].trim();}catch{}throw new Error('ANTHROPIC_API_KEY not set');}
function getAnthropic(){return new Anthropic({apiKey:getApiKey()});}

export async function POST(req: NextRequest, { params }: { params: Promise<{ reviewId: string }> }) {
  const { reviewId } = await params;
  const { documentId, column } = await req.json();

  const review = sqlite.prepare('SELECT * FROM tabular_reviews WHERE id=?').get(reviewId) as any;
  if (!review) return NextResponse.json({ error: 'Review not found' }, { status: 404 });

  const doc = sqlite.prepare('SELECT original_name, extracted_text FROM documents WHERE id=?').get(documentId) as any;
  if (!doc) return NextResponse.json({ error: 'Document not found' }, { status: 404 });
  if (!doc.extracted_text) return NextResponse.json({ error: 'No text extracted from this document' }, { status: 400 });

  const enc = new TextEncoder();
  const stream = new ReadableStream({
    async start(ctrl) {
      try {
        const prompt = `You are a legal expert extracting specific information from a document for a tabular review.

Document: ${doc.original_name}

Column/Question to answer: ${column.label}
${column.description ? `Additional context: ${column.description}` : ''}

Instructions:
- Answer ONLY the specific question above
- Be concise and precise (1-3 sentences maximum unless a list is required)
- If the information is not present in the document, say "Not found"
- Quote the relevant clause reference if applicable
- Do not add preamble or explanation

Document content:
${doc.extracted_text.slice(0, 40000)}`;

        const llmStream = getAnthropic().messages.stream({
          model: 'claude-sonnet-4-5',
          max_tokens: 512,
          messages: [{ role: 'user', content: prompt }],
        });

        let text = '';
        for await (const chunk of llmStream) {
          if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
            text += chunk.delta.text;
            ctrl.enqueue(enc.encode(`data: ${JSON.stringify({ text: chunk.delta.text })}\n\n`));
          }
        }

        // Save result
        const existing = JSON.parse(review.results || '{}');
        if (!existing[documentId]) existing[documentId] = {};
        existing[documentId][column.id] = text;
        sqlite.prepare('UPDATE tabular_reviews SET results=?, updated_at=CURRENT_TIMESTAMP WHERE id=?').run(
          JSON.stringify(existing), reviewId
        );

        ctrl.enqueue(enc.encode('data: [DONE]\n\n'));
      } catch (e: any) {
        ctrl.enqueue(enc.encode(`data: ${JSON.stringify({ error: e?.message || 'Error' })}\n\n`));
        ctrl.enqueue(enc.encode('data: [DONE]\n\n'));
      }
      ctrl.close();
    }
  });

  return new NextResponse(stream, {
    headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' }
  });
}
