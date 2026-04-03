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

  const prompt = `You are a business research analyst creating VISUAL DASHBOARD DATA. Your output will be rendered as charts, stat cards, and visual components — NOT walls of text.

Business Idea: "${idea.idea_text}"
${idea.location ? `Location: ${idea.location}` : ''}

Research Section: "${section.title}"
Questions to answer:
${(section.questions as string[]).map((q: string, i: number) => `${i + 1}. ${q}`).join('\n')}

Return a JSON object with RICH STRUCTURED DATA for visual rendering:
{
  "sectionId": "${sectionId}",
  "keyTakeaway": "One clear sentence summarizing the most important finding",
  "score": 7,
  "stats": [
    {"label": "Market Size", "value": "$2.4B", "icon": "📊", "trend": "up", "description": "Growing 12% annually"},
    {"label": "Avg Startup Cost", "value": "$45K", "icon": "💰", "trend": "neutral"},
    {"label": "Break-even", "value": "18 mo", "icon": "⏱️", "trend": "neutral"},
    {"label": "Competition", "value": "Medium", "icon": "🏢", "trend": "up"}
  ],
  "insights": [
    {"text": "Clear actionable insight", "type": "opportunity", "importance": "high"},
    {"text": "A risk to watch out for", "type": "risk", "importance": "medium"},
    {"text": "Neutral observation", "type": "neutral", "importance": "low"}
  ],
  "costBreakdown": [
    {"item": "Equipment", "low": 5000, "high": 15000},
    {"item": "Marketing", "low": 2000, "high": 8000}
  ],
  "marketSegments": [
    {"name": "Segment A", "value": 40},
    {"name": "Segment B", "value": 35},
    {"name": "Segment C", "value": 25}
  ],
  "competitors": [
    {"name": "Competitor A", "price": "$49/mo", "rating": 4.2, "strengths": "Brand recognition"}
  ],
  "resources": [{"title": "Resource name", "url": "https://...", "type": "article|video|tool"}]
}

RULES:
- stats: 3-6 items with BIG numbers people can scan instantly. Use $ and % formatting. Every stat needs an emoji icon.
- insights: 3-8 items. Tag each as opportunity/risk/neutral and high/medium/low importance.
- costBreakdown: Include if costs are relevant (most sections). Use realistic ranges.
- marketSegments: Include if market data is relevant. Values should sum to ~100 (percentages).
- competitors: Include real competitor names with approximate pricing and ratings.
- resources: Real URLs to articles, YouTube videos, or tools.
- score: 1-10 how favorable this aspect is.
- Use simple language a grandmother would understand. No jargon.
- Be specific with real data, real names, real numbers.

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
