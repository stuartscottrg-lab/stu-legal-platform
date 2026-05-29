import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/supabase/server';
import sql from '@/lib/db/pg';
import { generateAnnotations } from '@/lib/ai';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';
import Anthropic from '@anthropic-ai/sdk';
import { storeMemory, storeDocumentChunks, chunkText } from '@/lib/memory/embeddings';

const UPLOAD_DIR = process.env.DATA_DIR
  ? path.join(process.env.DATA_DIR, 'uploads')
  : path.join(process.cwd(), 'uploads');

async function extractTextFromPDFWithClaude(buf: Buffer): Promise<string> {
  try {
    const client = new Anthropic();
    const base64 = buf.toString('base64');
    const response = await client.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 4096,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'document',
            source: {
              type: 'base64',
              media_type: 'application/pdf',
              data: base64,
            },
          } as any,
          {
            type: 'text',
            text: 'Extract all the text content from this PDF document. Return only the extracted text, preserving paragraphs and structure. Do not add any commentary or preamble.',
          },
        ],
      }],
    });
    const block = response.content[0];
    return block.type === 'text' ? block.text.trim() : '';
  } catch (e) {
    console.error('Claude PDF extraction error:', e);
    return '';
  }
}

async function extractText(buf: Buffer, mime: string, name: string): Promise<string> {
  const lname = name.toLowerCase();

  if (mime === 'application/pdf' || lname.endsWith('.pdf')) {
    // Try fast text extraction first
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const pdfParse = require('pdf-parse');
      const data = await pdfParse(buf);
      const text = data.text?.trim();
      if (text && text.length > 50) return text;
    } catch (e) {
      console.error('pdf-parse error:', e);
    }
    // Fall back to Claude vision for image-based / scanned PDFs
    console.log('pdf-parse returned insufficient text, trying Claude vision...');
    return extractTextFromPDFWithClaude(buf);
  }

  if (lname.endsWith('.docx') || mime.includes('wordprocessingml')) {
    try {
      const mammoth = await import('mammoth');
      const result = await mammoth.extractRawText({ buffer: buf });
      return result.value?.trim() || '';
    } catch (e) {
      console.error('mammoth error:', e);
    }
    return '';
  }

  if (lname.endsWith('.txt') || mime.startsWith('text/')) {
    return buf.toString('utf8');
  }

  // Handle image files — use Claude vision for OCR
  if (mime.startsWith('image/') || /\.(png|jpg|jpeg|tiff|tif|webp|gif|bmp)$/.test(lname)) {
    const imageMediaTypes: Record<string, string> = {
      'image/png': 'image/png', 'image/jpeg': 'image/jpeg', 'image/jpg': 'image/jpeg',
      'image/webp': 'image/webp', 'image/gif': 'image/gif',
    };
    const mediaType = imageMediaTypes[mime] || 'image/jpeg';
    try {
      const client = new Anthropic();
      const base64 = buf.toString('base64');
      const response = await client.messages.create({
        model: 'claude-haiku-3-5',
        max_tokens: 4096,
        messages: [{
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: mediaType as any, data: base64 } },
            { type: 'text', text: 'Extract all text from this image. Return only the extracted text, preserving structure. If there is no text, describe what you see briefly.' },
          ],
        }],
      });
      const block = response.content[0];
      return block.type === 'text' ? block.text.trim() : '';
    } catch (e) {
      console.error('Image OCR error:', e);
    }
  }

  return '';
}

export async function POST(req: NextRequest) {
  try {
    const user = await getUser();
    const fd = await req.formData();
    const file = fd.get('file') as File;
    const matterId = (fd.get('matterId') as string) || null;
    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });

    // ── Stu OS — server-side file validation ──
    const MAX_BYTES = 25 * 1024 * 1024; // 25 MB
    const ALLOWED_EXTS = ['pdf', 'docx', 'doc', 'txt', 'rtf', 'png', 'jpg', 'jpeg', 'webp', 'gif', 'tiff', 'tif', 'bmp'];
    const lname = file.name.toLowerCase();
    const fileExt = lname.split('.').pop() || '';
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: 'File exceeds the 25 MB limit' }, { status: 413 });
    }
    if (file.size === 0) {
      return NextResponse.json({ error: 'File is empty' }, { status: 400 });
    }
    const mimeOk = file.type === '' ||
      file.type === 'application/pdf' ||
      file.type.includes('wordprocessingml') ||
      file.type === 'application/msword' ||
      file.type.startsWith('text/') ||
      file.type.startsWith('image/');
    if (!ALLOWED_EXTS.includes(fileExt) || !mimeOk) {
      return NextResponse.json({ error: `Unsupported file type: .${fileExt}. Allowed: PDF, DOCX, TXT, RTF, images.` }, { status: 415 });
    }

    const docId = uuidv4();
    const ext = file.name.split('.').pop()?.toLowerCase() || 'txt';
    const buf = Buffer.from(await file.arrayBuffer());

    // Try to write to disk (optional — used for local dev; not required on Railway)
    let storagePath = `_memory/${docId}.${ext}`;
    try {
      const dir = path.join(UPLOAD_DIR, matterId || '_library');
      fs.mkdirSync(dir, { recursive: true });
      const diskPath = path.join(dir, `${docId}.${ext}`);
      fs.writeFileSync(diskPath, buf);
      storagePath = diskPath;
    } catch {
      // Filesystem not writable (e.g. Railway) — text extracted from memory buffer below
    }

    await sql`INSERT INTO documents (id,matter_id,filename,original_name,mime_type,size_bytes,storage_path,status,uploaded_by) VALUES (${docId}, ${matterId}, ${`${docId}.${ext}`}, ${file.name}, ${file.type}, ${buf.length}, ${storagePath}, ${'processing'}, ${user?.id ?? 'anon'})`;

    // Background processing
    (async () => {
      try {
        const text = await extractText(buf, file.type, file.name);
        await sql`UPDATE documents SET extracted_text=${text || null}, status=${'ready'} WHERE id=${docId}`;

        if (text && text.length > 200) {
          const anns = await generateAnnotations(text);
          for (const a of anns) {
            const idx = text.indexOf(a.text.slice(0, 60));
            if (idx >= 0) {
              await sql`INSERT INTO annotations (id,document_id,annotation_type,severity,comment,suggestion,start_offset,end_offset) VALUES (${uuidv4()}, ${docId}, ${'risk'}, ${a.severity}, ${a.issue}, ${a.suggestion}, ${idx}, ${idx + a.text.length})`;
            }
          }

          // Embed document chunks into RAG store
          const chunks = chunkText(text);
          await storeDocumentChunks({
            userId: user?.id ?? 'anon',
            documentId: docId,
            matterId: matterId ?? null,
            chunks,
          });
          // Also store a summary in user memories for chat recall
          if (user?.id) {
            await storeMemory({
              userId: user.id,
              content: `From document "${file.name}": ${text.slice(0, 600)}`,
              sourceType: 'document',
              sourceId: docId,
              matterId: matterId ?? undefined,
            });
          }
        }
      } catch (e) {
        console.error('Background processing error:', e);
        await sql`UPDATE documents SET status=${'ready'} WHERE id=${docId}`;
      }
    })();

    return NextResponse.json({ id: docId });
  } catch (e: any) {
    console.error('Upload error:', e);
    return NextResponse.json({ error: e?.message || 'Upload failed' }, { status: 500 });
  }
}
