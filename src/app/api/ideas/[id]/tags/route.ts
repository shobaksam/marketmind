import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { getServiceSupabase } from '@/lib/supabase';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession();
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { tags } = await req.json();
  const supabase = getServiceSupabase();

  const { error } = await supabase
    .from('marketmind_ideas')
    .update({ tags: tags || [] })
    .eq('id', params.id)
    .eq('user_email', session.user.email);

  if (error) {
    return NextResponse.json({ error: 'Failed to update tags' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
