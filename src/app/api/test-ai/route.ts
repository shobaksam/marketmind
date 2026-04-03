import { NextResponse } from 'next/server';
import { aiGenerate } from '@/lib/ai';

export async function GET() {
  try {
    const start = Date.now();
    // Use a prompt similar to the research route
    const result = await aiGenerate('You are a business research analyst. Research market size for a coffee shop. Return JSON: {"sectionId":"test","keyTakeaway":"Coffee is popular","score":7,"layout":[{"type":"stat-grid","data":[{"label":"Market","value":"$48B","icon":"📊"}]}]}. Return ONLY valid JSON.', 2000);
    const elapsed = Date.now() - start;
    return NextResponse.json({ ok: true, elapsed, result: result.slice(0, 500) });
  } catch (err) {
    return NextResponse.json({ ok: false, error: err instanceof Error ? err.message : String(err) });
  }
}

export async function POST() {
  // Same test but as POST
  try {
    const start = Date.now();
    const result = await aiGenerate('Return JSON: {"ok": true}', 50);
    const elapsed = Date.now() - start;
    return NextResponse.json({ ok: true, elapsed, result: result.slice(0, 200) });
  } catch (err) {
    return NextResponse.json({ ok: false, error: err instanceof Error ? err.message : String(err) });
  }
}
