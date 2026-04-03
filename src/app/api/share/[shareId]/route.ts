import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';

export async function GET(_req: NextRequest, { params }: { params: { shareId: string } }) {
  const supabase = getServiceSupabase();
  const { data, error } = await supabase
    .from('marketmind_ideas')
    .select('title, summary, category, location, framework, research, analysis, created_at')
    .eq('share_id', params.shareId)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json(data);
}
