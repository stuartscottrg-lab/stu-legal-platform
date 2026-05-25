import sql from '@/lib/db/pg';
import { v4 as uuidv4 } from 'uuid';

// Text chunking
export function chunkText(text: string, chunkSize = 800, overlap = 150): string[] {
  const chunks: string[] = [];
  let i = 0;
  while (i < text.length) {
    chunks.push(text.slice(i, i + chunkSize));
    i += chunkSize - overlap;
    if (i + overlap >= text.length) break;
  }
  if (text.length > 0 && (chunks.length === 0 || chunks[chunks.length - 1] !== text.slice(text.length - Math.min(chunkSize, text.length)))) {
    const last = text.slice(Math.max(0, text.length - chunkSize));
    if (!chunks.includes(last)) chunks.push(last);
  }
  return chunks.filter(c => c.trim().length > 50);
}

// Store memory/document chunks
export async function storeMemory(opts: {
  userId: string;
  content: string;
  sourceType: 'chat' | 'document' | 'matter';
  sourceId?: string;
  matterId?: string;
}): Promise<void> {
  const { userId, content, sourceType, sourceId, matterId } = opts;
  try {
    if (sourceType === 'document' && sourceId) {
      // For documents, we store in user_memories so they're recalled in chat
      await sql`
        INSERT INTO user_memories (id, user_id, content, source_type, source_id, matter_id)
        VALUES (${uuidv4()}, ${userId}, ${content.slice(0, 2000)}, ${sourceType}, ${sourceId ?? null}, ${matterId ?? null})
        ON CONFLICT DO NOTHING
      `;
    } else if (sourceType === 'chat') {
      // Store chat snippets for context recall
      await sql`
        INSERT INTO user_memories (id, user_id, content, source_type, matter_id)
        VALUES (${uuidv4()}, ${userId}, ${content.slice(0, 1000)}, ${sourceType}, ${matterId ?? null})
      `;
    }
  } catch (e) {
    // Non-fatal — memory is a nice-to-have
    console.error('storeMemory error:', e);
  }
}

// Store document chunks specifically (called from upload pipeline)
export async function storeDocumentChunks(opts: {
  userId: string;
  documentId: string;
  matterId?: string | null;
  chunks: string[];
}): Promise<void> {
  const { userId, documentId, matterId, chunks } = opts;
  try {
    // Delete existing chunks for this doc first
    await sql`DELETE FROM document_chunks WHERE document_id = ${documentId}`;
    // Insert new chunks
    for (let i = 0; i < chunks.length; i++) {
      await sql`
        INSERT INTO document_chunks (id, document_id, matter_id, user_id, chunk_index, content)
        VALUES (${uuidv4()}, ${documentId}, ${matterId ?? null}, ${userId}, ${i}, ${chunks[i]})
      `;
    }
  } catch (e) {
    console.error('storeDocumentChunks error:', e);
  }
}

// Recall relevant memories using Postgres full-text search
export async function recallMemories(
  userId: string,
  query: string,
  limit = 5,
): Promise<string[]> {
  if (!query.trim() || userId === 'demo-user') return [];
  try {
    // Search document chunks first (most relevant for legal work)
    const chunks = await sql`
      SELECT content,
        ts_rank(to_tsvector('english', content), plainto_tsquery('english', ${query})) AS rank
      FROM document_chunks
      WHERE user_id = ${userId}
        AND to_tsvector('english', content) @@ plainto_tsquery('english', ${query})
      ORDER BY rank DESC
      LIMIT ${Math.ceil(limit * 0.7)}
    `;

    // Also search chat memories
    const memories = await sql`
      SELECT content,
        ts_rank(to_tsvector('english', content), plainto_tsquery('english', ${query})) AS rank
      FROM user_memories
      WHERE user_id = ${userId}
        AND to_tsvector('english', content) @@ plainto_tsquery('english', ${query})
      ORDER BY rank DESC
      LIMIT ${Math.floor(limit * 0.3)}
    `;

    return [...chunks, ...memories].map(r => r.content as string);
  } catch (e) {
    console.error('recallMemories error:', e);
    return [];
  }
}

// Stub — will be activated when embedding provider (Voyage AI / OpenAI) is configured
export async function embed(_text: string): Promise<number[] | null> {
  return null;
}
