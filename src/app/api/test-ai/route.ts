import { NextResponse } from 'next/server';

export async function GET() {
  const results: Record<string, unknown> = {};
  
  const groqKey = process.env.GROQ_API_KEY?.trim();
  results.groqKeyLength = groqKey?.length || 0;
  results.groqKeyPrefix = groqKey?.slice(0, 8) || 'none';
  
  if (groqKey) {
    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${groqKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [{ role: 'user', content: 'Say hi' }],
          max_tokens: 5,
        }),
      });
      const body = await res.text();
      results.groqStatus = res.status;
      results.groqBody = body.slice(0, 300);
    } catch (e) {
      results.groqError = e instanceof Error ? e.message : String(e);
    }
  }

  const geminiKey = process.env.GEMINI_API_KEY?.trim();
  results.geminiKeyLength = geminiKey?.length || 0;

  return NextResponse.json(results);
}
