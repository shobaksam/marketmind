import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { getServiceSupabase } from '@/lib/supabase';
import { aiGenerateJSON } from '@/lib/ai';

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession();
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = getServiceSupabase();
  const { data: idea, error } = await supabase
    .from('marketmind_ideas')
    .select('*')
    .eq('id', params.id)
    .eq('user_email', session.user.email)
    .single();

  if (error || !idea) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const researchSummaries = Object.entries(idea.research || {}).map(([sectionId, r]: [string, any]) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const section = idea.framework?.sections?.find((s: any) => s.id === sectionId);
    return `${section?.title || sectionId}: Score ${r.score || 'N/A'}/10. ${r.keyTakeaway || r.content?.slice(0, 200) || 'No data'}`;
  }).join('\n');

  const swotSummary = idea.swot 
    ? `SWOT Score: ${idea.swot.overallScore}/10. Verdict: ${idea.swot.verdict}` 
    : '';

  const prompt = `You are a business analyst. Generate a concise executive summary for this business idea research.

Business: ${idea.title}
Category: ${idea.category}
Location: ${idea.location || 'Not specified'}
Description: ${idea.summary}

Research Results:
${researchSummaries}

${swotSummary}

Return JSON:
{
  "executiveSummary": "2-3 paragraph executive summary covering key findings, viability, and recommendation",
  "verdict": "GO" | "CAUTION" | "NO-GO",
  "topStrengths": ["strength1", "strength2", "strength3"],
  "topRisks": ["risk1", "risk2", "risk3"],
  "nextSteps": ["step1", "step2", "step3"]
}`;

  try {
    const summary = await aiGenerateJSON(prompt, 1500);
    
    // Save to idea
    await supabase
      .from('marketmind_ideas')
      .update({ executive_summary: summary })
      .eq('id', params.id);

    return NextResponse.json(summary);
  } catch (err) {
    console.error('Summary generation error:', err);
    return NextResponse.json({ error: 'Failed to generate summary' }, { status: 500 });
  }
}
