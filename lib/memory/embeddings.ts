// Memory / embeddings — disabled until an embedding provider is configured.
// The assistant works fully without this; it just won't have cross-session recall.

export async function embed(_text: string): Promise<number[] | null> {
  return null;
}

export async function storeMemory(_opts: {
  userId: string;
  content: string;
  sourceType: 'chat' | 'document' | 'matter';
  sourceId?: string;
  matterId?: string;
}): Promise<void> {
  // no-op
}

export async function recallMemories(
  _userId: string,
  _query: string,
  _limit = 6,
): Promise<string[]> {
  return [];
}

export function chunkText(text: string, chunkSize = 600, overlap = 100): string[] {
  const chunks: string[] = [];
  let i = 0;
  while (i < text.length) {
    chunks.push(text.slice(i, i + chunkSize));
    i += chunkSize - overlap;
  }
  return chunks;
}
