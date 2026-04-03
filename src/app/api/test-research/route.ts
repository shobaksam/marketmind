import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { aiGenerate } from '@/lib/ai';
import { getServiceSupabase } from '@/lib/supabase';

export async function GET() {
  const results: Record<string, unknown> = {};
  
  // Test 1: Session
  try {
    const session = await getServerSession();
    results.session = session ? { email: session.user?.email } : null;
  } catch (e) { results.session = `Error: ${e}`; }
  
  // Test 2: AI
  try {
    const start = Date.now();
    const ai = await aiGenerate('Return JSON: {"ok": true}', 50);
    results.ai = { ok: true, elapsed: Date.now() - start, preview: ai.slice(0, 100) };
  } catch (e) { results.ai = `Error: ${e instanceof Error ? e.message : e}`; }
  
  // Test 3: Supabase
  try {
    const supabase = getServiceSupabase();
    const { data, error } = await supabase.from('marketmind_ideas').select('id').limit(1);
    results.supabase = error ? `Error: ${error.message}` : { ok: true, count: data?.length };
  } catch (e) { results.supabase = `Error: ${e instanceof Error ? e.message : e}`; }

  return NextResponse.json(results);
}
