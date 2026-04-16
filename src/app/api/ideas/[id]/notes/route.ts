import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { getServiceSupabase } from '@/lib/supabase';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession();
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { sectionId, note } = await req.json();
  const supabase = getServiceSupabase();
  
  // Get current idea
  const { data: idea } = await supabase
    .from('marketmind_ideas')
    .select('notes')
    .eq('id', params.id)
    .eq('user_email', session.user.email)
    .single();

  if (!idea) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const notes = idea.notes || {};
  notes[sectionId] = note;

  const { error } = await supabase
    .from('marketmind_ideas')
    .update({ notes })
    .eq('id', params.id);

  if (error) {
    return NextResponse.json({ error: 'Failed to save note' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
