import { NextResponse } from 'next/server';
import { aiGenerate } from '@/lib/ai';

export async function GET() {
  try {
    const start = Date.now();
    const result = await aiGenerate('Return JSON: {"ok": true, "message": "hello"}', 100);
    const elapsed = Date.now() - start;
    return NextResponse.json({ ok: true, elapsed, result: result.slice(0, 200) });
  } catch (err) {
    return NextResponse.json({ ok: false, error: err instanceof Error ? err.message : String(err) });
  }
}
