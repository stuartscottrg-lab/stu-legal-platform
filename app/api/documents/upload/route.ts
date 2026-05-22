import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db/pg';
import { generateAnnotations } from '@/lib/ai';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';

const UPLOAD_DIR = process.env.DATA_DIR
  ? path.join(process.env.DATA_DIR, 'uploads')
  : path.join(process.cwd(), 'uploads');

async function extractText(buf: Buffer, mime: string, name: string): Promise<string> {
  const lname = name.toLowerCase();

  if (mime === 'application/pdf' || lname.endsWith('.pdf')) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const pdfParse = require('pdf-parse');
      const data = await pdfParse(buf);
      const text = data.text?.trim();
      if (text && text.length > 50) return text;
    } catch (e) {
      console.error('pdf-parse error:', e);
    }
    return ''; // Return empty rather than raw binary garbage
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

  return '';
}

export async function POST(req: NextRequest) {
  try {
    const fd = await req.formData();
    const file = fd.get('file') as File;
    const matterId = (fd.get('matterId') as string) || null;
    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });

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

    await sql`INSERT INTO documents (id,matter_id,filename,original_name,mime_type,size_bytes,storage_path,status,uploaded_by) VALUES (${docId}, ${matterId}, ${`${docId}.${ext}`}, ${file.name}, ${file.type}, ${buf.length}, ${storagePath}, ${'processing'}, ${'user'})`;

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
