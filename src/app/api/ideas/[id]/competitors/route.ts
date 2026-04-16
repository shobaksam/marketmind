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
  const { data: idea } = await supabase
    .from('marketmind_ideas')
    .select('*')
    .eq('id', params.id)
    .eq('user_email', session.user.email)
    .single();

  if (!idea) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const prompt = `You are a competitive intelligence analyst. Analyze competitors for:

Business: ${idea.title}
Category: ${idea.category}
Location: ${idea.location || 'General market'}

Return JSON:
{
  "competitors": [
    {
      "name": "Competitor Name",
      "description": "Brief description",
      "strengths": ["strength1", "strength2"],
      "weaknesses": ["weakness1", "weakness2"],
      "priceRange": "$10-20",
      "marketShare": 25,
      "rating": 4.2,
      "differentiator": "What makes them unique"
    }
  ],
  "positioning": {
    "xAxis": "Price (Low to High)",
    "yAxis": "Quality (Low to High)",
    "players": [
      { "name": "Competitor 1", "x": 30, "y": 70 },
      { "name": "Competitor 2", "x": 70, "y": 80 },
      { "name": "Your Business", "x": 50, "y": 85 }
    ]
  },
  "marketGaps": ["gap1", "gap2", "gap3"],
  "competitiveAdvantage": "What your business can do better"
}

Generate 4-6 realistic competitors. Values for x,y should be 0-100.`;

  try {
    const analysis = await aiGenerateJSON(prompt, 2000);
    
    await supabase
      .from('marketmind_ideas')
      .update({ competitor_analysis: analysis })
      .eq('id', params.id);

    return NextResponse.json(analysis);
  } catch (err) {
    console.error('Competitor analysis error:', err);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
