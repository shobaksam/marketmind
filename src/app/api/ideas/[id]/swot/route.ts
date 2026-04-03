import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { aiGenerate } from '@/lib/ai';
import { getServiceSupabase } from '@/lib/supabase';

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession();
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = getServiceSupabase();
  const { data: idea, error } = await supabase
    .from('ideas')
    .select('*')
    .eq('id', params.id)
    .single();

  if (error || !idea) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const researchSummary = Object.values(idea.research || {})
    .map((r: unknown) => {
      const research = r as { content?: string };
      return research.content?.substring(0, 500) || '';
    })
    .join('\n\n');

  const prompt = `Based on this business idea and research, generate a comprehensive SWOT analysis.

Business Idea: "${idea.idea_text}"
${idea.location ? `Location: ${idea.location}` : ''}

Research Summary:
${researchSummary.substring(0, 3000)}

Return a JSON object:
{
  "strengths": ["strength 1", "strength 2", "strength 3", "strength 4"],
  "weaknesses": ["weakness 1", "weakness 2", "weakness 3", "weakness 4"],
  "opportunities": ["opportunity 1", "opportunity 2", "opportunity 3", "opportunity 4"],
  "threats": ["threat 1", "threat 2", "threat 3", "threat 4"],
  "overallScore": 7,
  "verdict": "One paragraph verdict on viability"
}

Return ONLY valid JSON.`;

  try {
    const aiResponse = await aiGenerate(prompt, 3000);
    const cleaned = aiResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const swot = JSON.parse(cleaned);

    await supabase
      .from('ideas')
      .update({ swot, status: 'complete' })
      .eq('id', params.id);

    return NextResponse.json(swot);
  } catch (err) {
    console.error('SWOT error:', err);
    return NextResponse.json({ error: 'SWOT generation failed' }, { status: 500 });
  }
}
