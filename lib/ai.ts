import Anthropic from '@anthropic-ai/sdk';
import fs from 'fs';
import path from 'path';
import { STU_SYSTEM_PROMPT, STU_RESEARCH_PROMPT, STU_DOCUMENT_PROMPT } from './legal/uk-system-prompt';
import { getRelevantKnowledge } from './legal/uk-knowledge-base';

// ─── Anthropic client ────────────────────────────────────────

function getApiKey(): string {
  if (process.env.ANTHROPIC_API_KEY) return process.env.ANTHROPIC_API_KEY;
  try {
    const envPath = path.join(process.cwd(), '.env.local');
    const content = fs.readFileSync(envPath, 'utf8');
    const match = content.match(/^ANTHROPIC_API_KEY=(.+)$/m);
    if (match?.[1]) return match[1].trim();
  } catch {}
  throw new Error('ANTHROPIC_API_KEY is not set.');
}

function getAnthropic() {
  return new Anthropic({ apiKey: getApiKey() });
}

// ─── Core call ───────────────────────────────────────────────

async function callClaude(system: string, userContent: string, maxTokens = 2048): Promise<string> {
  const response = await getAnthropic().messages.create({
    model: 'claude-sonnet-4-5',
    max_tokens: maxTokens,
    system,
    messages: [{ role: 'user', content: userContent }],
  });
  return response.content[0].type === 'text' ? response.content[0].text : '';
}

/**
 * Builds a full UK-grounded system prompt for a given query.
 * Injects relevant knowledge blocks from the UK law knowledge base.
 */
function buildPromptWithKB(base: string, queryText: string): string {
  return base + getRelevantKnowledge(queryText);
}

// ─── Types ───────────────────────────────────────────────────

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

// ─── Document analysis ───────────────────────────────────────

export async function analyzeDocument(text: string, instruction: string): Promise<string> {
  const system = buildPromptWithKB(STU_DOCUMENT_PROMPT, text + ' ' + instruction);
  return callClaude(system, `Document:\n\n${text.slice(0, 50000)}\n\n${instruction}`);
}

export async function generateAnnotations(docText: string): Promise<AnnotationResult[]> {
  const system = buildPromptWithKB(STU_DOCUMENT_PROMPT, docText);
  const response = await callClaude(
    system,
    `Analyse this legal document and identify 5-8 clauses that carry legal risk under UK law. Return ONLY valid JSON, no other text:\n\n{"annotations":[{"text":"exact clause text max 80 chars","severity":"high","issue":"brief risk referencing applicable UK law","suggestion":"concrete alternative drafting"}]}\n\nSeverity: high=material exposure, medium=notable risk, low=minor issue.\n\nDocument:\n${docText.slice(0, 40000)}`
  );
  try {
    const match = response.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]).annotations || [];
  } catch {}
  return [];
}

export async function runPlaybookItem(docText: string, item: PlaybookItem): Promise<PlaybookResult> {
  const system = buildPromptWithKB(STU_DOCUMENT_PROMPT, item.label + ' ' + item.prompt);
  const response = await callClaude(
    system,
    `Review this document for the following under UK law: ${item.label}\n\n${item.prompt}\n\nRespond with ONLY valid JSON:\n{"status":"pass","explanation":"2-3 sentences referencing applicable UK law"}\n\nStatus: pass (adequate), issue (problems found), missing (absent/deficient)\n\nDocument:\n${docText.slice(0, 40000)}`
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
  const response = await callClaude(
    STU_DOCUMENT_PROMPT,
    `Identify PII and sensitive data in this document that should be redacted under UK GDPR / DPA 2018. Return ONLY valid JSON:\n{"redactions":[{"text":"exact text to redact","reason":"why under UK data protection law"}]}\n\nDocument:\n${docText.slice(0, 40000)}`
  );
  try {
    const match = response.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]).redactions || [];
  } catch {}
  return [];
}

export async function translateDocument(docText: string, targetLanguage: string): Promise<string> {
  return callClaude(
    STU_SYSTEM_PROMPT,
    `Translate this UK legal document to ${targetLanguage}. Preserve all legal formatting, party names, and defined terms. Add a translator's note for any UK-specific legal concepts that may not translate directly.\n\n${docText.slice(0, 40000)}`,
    4096
  );
}

export async function summarizeDocument(docText: string): Promise<string> {
  const system = buildPromptWithKB(STU_DOCUMENT_PROMPT, docText);
  return callClaude(
    system,
    `Provide a professional executive summary covering: (1) key parties and their obligations, (2) main commercial terms, (3) key legal risks under UK law, (4) governing law and jurisdiction clause, (5) recommended next steps before signing.\n\nDocument:\n${docText.slice(0, 40000)}`
  );
}

// ─── Legal research ──────────────────────────────────────────

export async function legalResearch(question: string): Promise<string> {
  const system = buildPromptWithKB(STU_RESEARCH_PROMPT, question);
  return callClaude(
    system,
    `Legal research question: ${question}\n\nProvide a structured research note: Issue → Applicable UK law → Legal position → Practical implications → Recommended approach.`,
    3000
  );
}

// ─── Document chat ───────────────────────────────────────────

export async function* chatWithDocument(
  docText: string,
  messages: { role: string; content: string }[]
): AsyncGenerator<string> {
  const lastUserMsg = [...messages].reverse().find(m => m.role === 'user')?.content ?? '';
  const system = buildPromptWithKB(STU_DOCUMENT_PROMPT, docText + ' ' + lastUserMsg)
    + `\n\n## Document under review\n\n${docText.slice(0, 50000)}`;

  const stream = await getAnthropic().messages.stream({
    model: 'claude-sonnet-4-5',
    max_tokens: 2048,
    system,
    messages: messages as any,
  });

  for await (const chunk of stream) {
    if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
      yield chunk.delta.text;
    }
  }
}

// ─── Re-export system prompts for use in other routes ────────
export { STU_SYSTEM_PROMPT, STU_RESEARCH_PROMPT, STU_DOCUMENT_PROMPT };
export { getRelevantKnowledge, detectLegalTopics } from './legal/uk-knowledge-base';
