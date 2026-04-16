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

  const prompt = `You are a financial analyst. Generate realistic financial projections for this business:

Business: ${idea.title}
Category: ${idea.category}
Location: ${idea.location || 'General'}
Description: ${idea.summary}

Return JSON:
{
  "startupCosts": { "total": 50000, "breakdown": [{ "item": "Equipment", "cost": 15000 }, ...] },
  "monthlyExpenses": { "total": 8000, "breakdown": [{ "item": "Rent", "cost": 2000 }, ...] },
  "revenueProjections": [
    { "month": 1, "revenue": 2000, "expenses": 8000 },
    { "month": 6, "revenue": 8000, "expenses": 8500 },
    { "month": 12, "revenue": 15000, "expenses": 9000 },
    { "month": 24, "revenue": 25000, "expenses": 10000 },
    { "month": 36, "revenue": 35000, "expenses": 11000 }
  ],
  "breakEvenMonths": 14,
  "year1Profit": -20000,
  "year3Profit": 180000,
  "roiPercent": 260
}

Use realistic numbers for ${idea.location || 'the US market'}. All values in USD.`;

  try {
    const projections = await aiGenerateJSON(prompt, 1500);
    
    await supabase
      .from('marketmind_ideas')
      .update({ projections })
      .eq('id', params.id);

    return NextResponse.json(projections);
  } catch (err) {
    console.error('Projections error:', err);
    return NextResponse.json({ error: 'Failed to generate projections' }, { status: 500 });
  }
}
