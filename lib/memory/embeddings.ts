import sql from '@/lib/db/pg';
import { v4 as uuid } from 'uuid';

const VOYAGE_API_KEY = process.env.VOYAGE_API_KEY;
const VOYAGE_MODEL = 'voyage-law-2';

// Generate embedding via Voyage AI
export async function embed(text: string): Promise<number[] | null> {
  if (!VOYAGE_API_KEY) return null;
  try {
    const res = await fetch('https://api.voyageai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${VOYAGE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ model: VOYAGE_MODEL, input: [text.slice(0, 8000)] }),
    });
    const data = await res.json();
    return data.data?.[0]?.embedding ?? null;
  } catch {
    return null;
  }
}

// Store a memory for a user
export async function storeMemory({
  userId,
  content,
  sourceType,
  sourceId,
  matterId,
}: {
  userId: string;
  content: string;
  sourceType: 'chat' | 'document' | 'matter';
  sourceId?: string;
  matterId?: string;
}) {
  if (!content.trim() || content.length < 20) return;
  const embedding = await embed(content);
  const id = uuid();

  if (embedding) {
    const vectorStr = `[${embedding.join(',')}]`;
    await sql`
      INSERT INTO user_memories (id, user_id, content, embedding, source_type, source_id, matter_id)
      VALUES (${id}, ${userId}, ${content}, ${vectorStr}::vector, ${sourceType}, ${sourceId ?? null}, ${matterId ?? null})
    `;
  } else {
    // Fallback without embedding (still searchable by text)
    await sql`
      INSERT INTO user_memories (id, user_id, content, source_type, source_id, matter_id)
      VALUES (${id}, ${userId}, ${content}, ${sourceType}, ${sourceId ?? null}, ${matterId ?? null})
    `;
  }
}

// Retrieve relevant memories for a query
export async function recallMemories(userId: string, query: string, limit = 6): Promise<string[]> {
  const embedding = await embed(query);

  if (embedding) {
    const vectorStr = `[${embedding.join(',')}]`;
    const rows = await sql`
      SELECT content
      FROM user_memories
      WHERE user_id = ${userId}
        AND embedding IS NOT NULL
      ORDER BY embedding <=> ${vectorStr}::vector
      LIMIT ${limit}
    ` as { content: string }[];
    return rows.map(r => r.content);
  }

  // Fallback: return recent memories
  const rows = await sql`
    SELECT content FROM user_memories
    WHERE user_id = ${userId}
    ORDER BY created_at DESC
    LIMIT ${limit}
  ` as { content: string }[];
  return rows.map(r => r.content);
}

// Chunk long text into overlapping segments for better recall
export function chunkText(text: string, chunkSize = 600, overlap = 100): string[] {
  const chunks: string[] = [];
  let i = 0;
  while (i < text.length) {
    chunks.push(text.slice(i, i + chunkSize));
    i += chunkSize - overlap;
  }
  return chunks;
}
