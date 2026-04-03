import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { aiGenerate } from '@/lib/ai';
import { getServiceSupabase } from '@/lib/supabase';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession();
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { sectionId } = await req.json();

  const supabase = getServiceSupabase();
  const { data: idea, error } = await supabase
    .from('marketmind_ideas')
    .select('*')
    .eq('id', params.id)
    .single();

  if (error || !idea) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const framework = idea.framework as Record<string, unknown>;
  const sections = framework.sections as Array<Record<string, unknown>>;
  const section = sections?.find((s) => s.id === sectionId);

  if (!section) {
    return NextResponse.json({ error: 'Section not found' }, { status: 404 });
  }

  const prompt = `You are a business research analyst providing deep, actionable research.

Business Idea: "${idea.idea_text}"
${idea.location ? `Location: ${idea.location}` : ''}

Research Section: "${section.title}"
Questions to answer:
${(section.questions as string[]).map((q: string, i: number) => `${i + 1}. ${q}`).join('\n')}

Provide thorough, specific research with:
- Real data points and statistics where possible (cite approximate figures)
- Specific competitor names and examples
- Actionable recommendations
- Local regulations or considerations if location is specified
- Cost estimates with ranges
- Links or references to look up (YouTube channels, industry reports, etc.)

Format your response as a JSON object:
{
  "sectionId": "${sectionId}",
  "content": "Detailed markdown content with headers, bullet points, and data",
  "keyInsights": ["insight 1", "insight 2", "insight 3"],
  "estimatedCosts": [{"item": "name", "low": 1000, "high": 5000}],
  "risks": ["risk 1", "risk 2"],
  "opportunities": ["opportunity 1", "opportunity 2"],
  "resources": [{"title": "Resource name", "url": "https://...", "type": "article|video|tool"}],
  "score": 7
}

The score is 1-10 rating of how favorable this aspect is for the business idea.
Return ONLY valid JSON.`;

  try {
    const aiResponse = await aiGenerate(prompt, 6000);
    let research;
    try {
      const match = aiResponse.match(/```(?:json)?\s*([\s\S]*?)```/);
      const jsonStr = match ? match[1].trim() : aiResponse.trim();
      research = JSON.parse(jsonStr);
    } catch {
      research = { sectionId, content: aiResponse, keyInsights: [], score: 5 };
    }

    // Save research to idea
    const existingResearch = (idea.research as Record<string, unknown>) || {};
    const updatedResearch = { ...existingResearch, [sectionId]: research };

    await supabase
      .from('marketmind_ideas')
      .update({ research: updatedResearch, status: 'researching' })
      .eq('id', params.id);

    return NextResponse.json(research);
  } catch (err) {
    console.error('Research error:', err);
    return NextResponse.json({ error: 'Research generation failed' }, { status: 500 });
  }
}
