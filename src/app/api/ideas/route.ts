import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { aiGenerate } from '@/lib/ai';
import { getServiceSupabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  const session = await getServerSession();
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { idea, location } = await req.json();
  if (!idea) {
    return NextResponse.json({ error: 'Idea is required' }, { status: 400 });
  }

  // Generate research framework via AI
  const locationEmphasis = location ? `
CRITICAL — LOCAL FOCUS: The user specified "${location}" as their target area. Every section MUST be hyper-local:
- Questions must ask about "${location}" specifically (local competitors, local regulations, local demographics, local pricing)
- Include a dedicated "Local Market" section about the ${location} area specifically
- Reference local zoning laws, permits, and business regulations for ${location}
- Consider local culture, demographics, income levels, and consumer behavior in ${location}
- Mention nearby competitors and local market saturation in ${location}
- Do NOT give generic national/global advice — everything should be actionable for someone in ${location}` : '';

  const prompt = `You are a business research analyst. Given a business idea, generate a structured research framework with sections that are specifically relevant to THIS type of business.

Business Idea: "${idea}"
${location ? `Location: ${location}` : ''}
${locationEmphasis}

Return a JSON object with this exact structure:
{
  "title": "Short catchy title for this research",
  "summary": "One paragraph summary of the idea${location ? ` in ${location}` : ''}",
  "category": "Category like Food & Beverage, Technology, Retail, Service, etc.",
  "sections": [
    {
      "id": "unique-slug",
      "title": "Section Title",
      "icon": "emoji",
      "description": "What this section covers",
      "questions": ["Specific question 1", "Specific question 2", "Specific question 3"],
      "priority": "high" | "medium" | "low"
    }
  ]
}

Generate 6-8 sections that are SPECIFICALLY relevant to this business idea. Not generic — think about what someone actually needs to know for THIS particular business. Include sections like market size, competition, regulations, startup costs, target customers, etc. but make questions specific.${location ? ` Frame ALL questions around the ${location} area.` : ''}

Return ONLY valid JSON, no markdown.`;

  try {
    const aiResponse = await aiGenerate(prompt, 2000);
    const cleaned = aiResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const framework = JSON.parse(cleaned) as Record<string, unknown>;

    // Save to Supabase
    const supabase = getServiceSupabase();
    const { data, error } = await supabase
      .from('marketmind_ideas')
      .insert({
        user_email: session.user.email,
        idea_text: idea,
        location: location || null,
        title: framework.title,
        summary: framework.summary,
        category: framework.category,
        framework: framework,
        status: 'framework_ready',
      })
      .select('id')
      .single();

    if (error) {
      console.error('Supabase error:', error);
      // Return framework without saving if DB fails
      return NextResponse.json({ id: 'temp', framework });
    }

    return NextResponse.json({ id: data.id, framework });
  } catch (err) {
    console.error('AI generation error:', err);
    return NextResponse.json({ error: 'Failed to generate framework' }, { status: 500 });
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function GET() {
  const session = await getServerSession();
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = getServiceSupabase();
  const { data, error } = await supabase
    .from('marketmind_ideas')
    .select('*')
    .eq('user_email', session.user.email)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch ideas' }, { status: 500 });
  }

  return NextResponse.json(data);
}
