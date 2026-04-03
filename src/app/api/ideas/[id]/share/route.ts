import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { getServiceSupabase } from '@/lib/supabase';
import { randomBytes } from 'crypto';

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession();
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = getServiceSupabase();
  const { data: idea } = await supabase
    .from('ideas')
    .select('share_id')
    .eq('id', params.id)
    .eq('user_email', session.user.email)
    .single();

  if (!idea) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  if (idea.share_id) {
    return NextResponse.json({ shareId: idea.share_id });
  }

  const shareId = randomBytes(8).toString('hex');
  await supabase
    .from('ideas')
    .update({ share_id: shareId })
    .eq('id', params.id);

  return NextResponse.json({ shareId });
}
