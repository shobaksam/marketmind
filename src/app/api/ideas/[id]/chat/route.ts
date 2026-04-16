import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { getServiceSupabase } from '@/lib/supabase';
import { aiGenerate } from '@/lib/ai';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession();
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { message } = await req.json();
  if (!message) {
    return NextResponse.json({ error: 'Message required' }, { status: 400 });
  }

  const supabase = getServiceSupabase();
  const { data: idea } = await supabase
    .from('marketmind_ideas')
    .select('*')
    .eq('id', params.id)
    .eq('user_email', session.user.email)
    .single();

  if (!idea) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  // Build context from research
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const researchContext = Object.entries(idea.research || {}).map(([id, r]: [string, any]) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const section = idea.framework?.sections?.find((s: any) => s.id === id);
    return `${section?.title || id}: Score ${r.score || 'N/A'}/10. ${r.keyTakeaway || ''}`;
  }).join('\n');

  const prompt = `You are an AI business research assistant. You have deep knowledge of this business idea and its research:

Business: ${idea.title}
Category: ${idea.category}
Location: ${idea.location || 'Not specified'}
Summary: ${idea.summary}

Research:
${researchContext}

${idea.swot ? `SWOT Score: ${idea.swot.overallScore}/10. Verdict: ${idea.swot.verdict}` : ''}

User question: "${message}"

Provide a helpful, concise, and specific answer. Reference the research data when relevant. Keep it under 300 words.`;

  try {
    const reply = await aiGenerate(prompt, 800);
    return NextResponse.json({ reply });
  } catch (err) {
    console.error('Chat error:', err);
    return NextResponse.json({ error: 'Failed to generate response' }, { status: 500 });
  }
}
