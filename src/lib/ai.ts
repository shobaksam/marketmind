// AI provider abstraction: tries Gemini first, falls back to Groq

export async function aiGenerate(prompt: string, maxTokens: number = 4000): Promise<string> {
  // Try Gemini first
  const geminiKey = process.env.GEMINI_API_KEY?.trim();
  if (geminiKey) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { maxOutputTokens: maxTokens, temperature: 0.7 },
          }),
        }
      );
      if (res.ok) {
        const data = await res.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        if (text) return text;
      }
      const errText = await res.text();
      console.warn('Gemini failed, status:', res.status, 'body:', errText.slice(0, 200));
    } catch (e) {
      console.warn('Gemini error:', e);
    }
  } else {
    console.warn('No GEMINI_API_KEY set');
  }

  // Fallback to Groq
  const groqKey = process.env.GROQ_API_KEY?.trim();
  if (groqKey) {
    try {
      console.log('Trying Groq fallback...');
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${groqKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: maxTokens,
          temperature: 0.7,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        return data.choices?.[0]?.message?.content || '';
      }
      const errText = await res.text();
      console.warn('Groq failed, status:', res.status, 'body:', errText.slice(0, 200));
    } catch (e) {
      console.warn('Groq error:', e);
    }
  } else {
    console.warn('No GROQ_API_KEY set');
  }

  throw new Error('All AI providers failed - check API keys');
}

export function parseJSON<T>(text: string): T {
  const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  return JSON.parse(cleaned) as T;
}

export async function aiGenerateJSON<T>(prompt: string, maxTokens: number = 4000): Promise<T> {
  const fullPrompt = `${prompt}\n\nRespond ONLY with valid JSON. No markdown, no code fences, no explanation.`;
  const text = await aiGenerate(fullPrompt, maxTokens);
  // Strip any markdown code fences
  const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  return JSON.parse(cleaned) as T;
}
