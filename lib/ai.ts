import Anthropic from '@anthropic-ai/sdk';

const API_KEY = process.env.ANTHROPIC_API_KEY || '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';
const anthropic = new Anthropic({ apiKey: API_KEY });

const LEGAL_SYSTEM_PROMPT = `You are an expert legal AI assistant with deep knowledge of contract law, corporate law, and legal drafting conventions across common law and civil law jurisdictions. You assist qualified lawyers and legal professionals. Your analysis is precise, thorough, and grounded in legal reasoning. When identifying risks, cite the specific clause language. When suggesting improvements, provide concrete alternative drafting.`;

export interface PlaybookItem {
  label: string;
  prompt: string;
  severity: 'high' | 'medium' | 'low';
}

export interface PlaybookResult {
  label: string;
  status: 'pass' | 'issue' | 'missing';
  explanation: string;
  severity: string;
}

export interface AnnotationResult {
  text: string;
  severity: 'high' | 'medium' | 'low';
  issue: string;
  suggestion: string;
}

async function callClaude(system: string, userContent: string, maxTokens = 2048): Promise<string> {
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-5',
    max_tokens: maxTokens,
    system,
    messages: [{ role: 'user', content: userContent }],
  });
  return response.content[0].type === 'text' ? response.content[0].text : '';
}

export async function analyzeDocument(text: string, instruction: string): Promise<string> {
  return callClaude(LEGAL_SYSTEM_PROMPT, `Document:\n\n${text.slice(0, 50000)}\n\n${instruction}`);
}

export async function generateAnnotations(docText: string): Promise<AnnotationResult[]> {
  const response = await callClaude(LEGAL_SYSTEM_PROMPT,
    `Analyse this legal document and identify 5-8 clauses that carry legal risk. Return ONLY valid JSON, no other text:\n\n{"annotations":[{"text":"exact clause text max 80 chars","severity":"high","issue":"brief risk","suggestion":"concrete fix"}]}\n\nSeverity: high=significant exposure, medium=notable concern, low=minor issue.\n\nDocument:\n${docText.slice(0, 40000)}`
  );
  try {
    const match = response.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]).annotations || [];
  } catch {}
  return [];
}

export async function runPlaybookItem(docText: string, item: PlaybookItem): Promise<PlaybookResult> {
  const response = await callClaude(LEGAL_SYSTEM_PROMPT,
    `Review this document for: ${item.label}\n\n${item.prompt}\n\nRespond with ONLY valid JSON:\n{"status":"pass","explanation":"2-3 sentences"}\n\nStatus options: pass (adequate), issue (problems found), missing (absent/deficient)\n\nDocument:\n${docText.slice(0, 40000)}`
  );
  try {
    const match = response.match(/\{[\s\S]*\}/);
    if (match) {
      const parsed = JSON.parse(match[0]);
      return { label: item.label, status: parsed.status, explanation: parsed.explanation, severity: item.severity };
    }
  } catch {}
  return { label: item.label, status: 'issue', explanation: response.slice(0, 300), severity: item.severity };
}

export async function generateRedactions(docText: string): Promise<{ text: string; reason: string }[]> {
  const response = await callClaude(LEGAL_SYSTEM_PROMPT,
    `Identify PII and sensitive data in this document. Return ONLY valid JSON:\n{"redactions":[{"text":"exact text to redact","reason":"why"}]}\n\nDocument:\n${docText.slice(0, 40000)}`
  );
  try {
    const match = response.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]).redactions || [];
  } catch {}
  return [];
}

export async function translateDocument(docText: string, targetLanguage: string): Promise<string> {
  return callClaude(LEGAL_SYSTEM_PROMPT,
    `Translate this legal document to ${targetLanguage}. Preserve all legal formatting and terminology.\n\n${docText.slice(0, 40000)}`,
    4096
  );
}

export async function summarizeDocument(docText: string): Promise<string> {
  return callClaude(LEGAL_SYSTEM_PROMPT,
    `Provide an executive summary in 5 bullet points covering: key parties and obligations, main commercial terms, key risks, governing law, and recommended next steps.\n\nDocument:\n${docText.slice(0, 40000)}`
  );
}

export async function legalResearch(question: string): Promise<string> {
  return callClaude(
    LEGAL_SYSTEM_PROMPT + '\n\nNote: AI-generated research. Cases and statutes cited should be independently verified.',
    `Legal research question: ${question}\n\nProvide a structured analysis covering: applicable law, key principles and cases, practical implications, and recommended approach.`,
    3000
  );
}

export async function* chatWithDocument(docText: string, messages: { role: string; content: string }[]): AsyncGenerator<string> {
  const stream = await anthropic.messages.stream({
    model: 'claude-sonnet-4-5',
    max_tokens: 2048,
    system: LEGAL_SYSTEM_PROMPT + `\n\nDocument under review:\n\n${docText.slice(0, 50000)}`,
    messages: messages as any,
  });
  for await (const chunk of stream) {
    if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
      yield chunk.delta.text;
    }
  }
}
