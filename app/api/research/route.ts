import { NextRequest, NextResponse } from 'next/server';
import { legalResearch } from '@/lib/ai';
import { getUser } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const { question } = body;
    if (!question?.trim()) return NextResponse.json({ error: 'No question provided' }, { status: 400 });
    const answer = await legalResearch(question);
    return NextResponse.json({ answer });
  } catch (e: any) {
    console.error('Research error:', e);
    return NextResponse.json({ error: e?.message || 'AI request failed' }, { status: 500 });
  }
}
