// AI provider abstraction: tries Gemini first (better for structured output), falls back to Groq

interface AiOptions {
  maxTokens?: number;
  temperature?: number;
  system?: string;
  jsonMode?: boolean;
}

export async function aiGenerate(prompt: string, maxTokensOrOpts: number | AiOptions = 2000): Promise<string> {
  const opts: AiOptions = typeof maxTokensOrOpts === 'number'
    ? { maxTokens: maxTokensOrOpts }
    : maxTokensOrOpts;
  const maxTokens = opts.maxTokens ?? 2000;
  const temperature = opts.temperature ?? 0.7;
  const errors: string[] = [];

  // Try Gemini first (better structured JSON, system instructions)
  const geminiKey = process.env.GEMINI_API_KEY?.trim();
  if (geminiKey) {
    try {
      const body: Record<string, unknown> = {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: maxTokens, temperature },
      };
      if (opts.system) {
        body.systemInstruction = { parts: [{ text: opts.system }] };
      }
      if (opts.jsonMode) {
        (body.generationConfig as Record<string, unknown>).responseMimeType = 'application/json';
      }
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
        { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
      );
      if (res.ok) {
        const data = await res.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        if (text) return text;
      }
      const errText = await res.text();
      errors.push(`Gemini ${res.status}: ${errText.slice(0, 150)}`);
      console.warn('Gemini failed, status:', res.status);
    } catch (e) {
      errors.push(`Gemini exception: ${e instanceof Error ? e.message : String(e)}`);
      console.warn('Gemini error:', e);
    }
  } else {
    errors.push('No GEMINI_API_KEY');
  }

  // Fallback to Groq
  const groqKey = process.env.GROQ_API_KEY?.trim();
  if (groqKey) {
    try {
      const messages: { role: string; content: string }[] = [];
      if (opts.system) messages.push({ role: 'system', content: opts.system });
      messages.push({ role: 'user', content: prompt });
      const body: Record<string, unknown> = {
        model: 'llama-3.3-70b-versatile',
        messages,
        max_tokens: maxTokens,
        temperature,
      };
      if (opts.jsonMode) {
        body.response_format = { type: 'json_object' };
      }
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${groqKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        const data = await res.json();
        return data.choices?.[0]?.message?.content || '';
      }
      const errText = await res.text();
      errors.push(`Groq ${res.status}: ${errText.slice(0, 150)}`);
      console.warn('Groq failed, status:', res.status, 'body:', errText.slice(0, 200));
    } catch (e) {
      errors.push(`Groq exception: ${e instanceof Error ? e.message : String(e)}`);
      console.warn('Groq error:', e);
    }
  } else {
    errors.push('No GROQ_API_KEY');
  }

  throw new Error(`All AI providers failed: ${errors.join(' | ')}`);
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
