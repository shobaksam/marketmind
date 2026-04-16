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

  const prompt = `Generate a step-by-step action plan for launching this business:

Business: ${idea.title}
Category: ${idea.category}
Location: ${idea.location || 'General'}

Return JSON:
{
  "phases": [
    {
      "name": "Phase 1: Planning",
      "duration": "Weeks 1-4",
      "icon": "📋",
      "steps": [
        { "task": "Register business entity", "duration": "1-2 days", "priority": "high", "cost": "$200-500" },
        { "task": "Secure funding", "duration": "2-4 weeks", "priority": "high", "cost": "Varies" }
      ]
    }
  ],
  "totalTimeline": "6-9 months",
  "criticalPath": ["task1", "task2", "task3"]
}

Generate 4-5 phases with 3-5 steps each. Be specific to this business type.`;

  try {
    const plan = await aiGenerateJSON(prompt, 2000);
    
    await supabase
      .from('marketmind_ideas')
      .update({ action_plan: plan })
      .eq('id', params.id);

    return NextResponse.json(plan);
  } catch (err) {
    console.error('Action plan error:', err);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
