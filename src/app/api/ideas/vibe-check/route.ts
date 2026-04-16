import { NextRequest, NextResponse } from 'next/server';
import { aiGenerate } from '@/lib/ai';

export const runtime = 'nodejs';

const SYSTEM = `You are a brutally honest startup advisor. You judge business ideas with ZERO sugar-coating. You NEVER invent statistics or cite specific numbers/dates/reports. You speak in plain English a teenager could understand.

CRITICAL OUTPUT RULES:
- Return ONLY valid JSON. No markdown, no backticks, no prose before or after.
- Follow EVERY constraint below exactly. Re-read them before writing your response.

VERDICT CALIBRATION (highest priority):
- You MUST rate approximately 2-3 out of every 10 ideas as "good." If you find yourself rating everything "meh," you are being too conservative.
- "good" does NOT mean zero competition. Dropbox had dozens of competitors. Slack competed with email. Having competitors is NORMAL for good ideas.
- "good" means: clear buyer + clear pain + a reason this specific product could win a segment. That's it.
- "meh" means: you genuinely cannot see ANY angle where this wins. Not "it'll be hard" — hard is fine. "I can't see it working at all."
- NEVER start a punchline with "Crowded." That word is banned as a punchline opener. Say something specific about THIS idea.`;

const PROMPT = (idea: string) => `Judge this startup idea: "${idea}"

Return ONLY valid JSON matching this exact shape:

{
  "verdict": "good" | "meh" | "bad",
  "punchline": "max 10 words. A JUDGMENT, not a tagline.",
  "why": "one sentence. A concrete insight about THIS specific idea. ZERO statistics or dates.",
  "scores": {
    "market":    { "score": 1-10, "note": "max 6 words, demand angle" },
    "execution": { "score": 1-10, "note": "max 6 words, build difficulty" },
    "timing":    { "score": 1-10, "note": "max 6 words, why-now angle" }
  },
  "biggest_risk": "one sentence. A NEW insight not in punchline, why, or score notes.",
  "who_pays": "one sentence. Name the SPECIFIC person (job title or role) and their concrete pain.",
  "first_step": "one sentence — see rules below.",
  "comparables": [{ "name": "real company", "note": "max 8 words" }],
  "alternatives": [{ "title": "3-6 word creative pivot", "why": "one sentence, why it's better than the original" }]
}

VERDICT RULES:
- "bad" = oversaturated, joke idea, no paying buyer, or clone of existing service. MOST COMMON.
- "meh" = real problem but unclear wedge, tiny market, or the founder would need deep domain expertise they likely lack.
- "good" = a real pain point where current solutions are weak, clunky, or overpriced for the target buyer. Having competitors is FINE — most good businesses enter crowded markets with a sharper angle. "Good" means the idea has a plausible path to paying customers, NOT that it's a guaranteed winner. Roughly 2-3 out of 10 ideas deserve "good."
- VERDICT IS DETERMINED BY SCORES (not the other way around):
  * First, assign honest scores for market/execution/timing independently.
  * Then: if average score >= 6.0 → verdict MUST be "good". If average < 3.5 → verdict MUST be "bad". Otherwise → "meh".
  * Do NOT artificially lower scores to avoid giving a "good" verdict. Score each dimension on its own merits.

CALIBRATION CHECK (do this BEFORE writing your response):
1. Ask: "Does this idea target a SPECIFIC group of people with a SPECIFIC pain that current solutions handle poorly?" If YES → verdict is "good" unless the idea is literally a clone of an existing product.
2. Having competitors does NOT make an idea "meh." Every good business has competitors. "meh" means the idea has no angle — it's a straight fight with no edge.
3. SELF-CHECK: If you wrote "meh" and your punchline starts with "Crowded" — rewrite. "Crowded" is lazy analysis. Explain WHY this specific founder can't win in this specific segment.
4. If you can articulate a clear buyer + clear pain + a reason existing tools fail them → "good." Full stop.

PUNCHLINE RULES:
- Each punchline must be UNIQUE to this specific idea — reference what makes THIS idea win or fail.
- BANNED: "Worth testing" (overused), "Crowded" as a standalone opener (lazy), taglines, benefit restatements.

WHY RULES:
- Must be a concrete observation about THIS idea's market/dynamics.
- NEVER start with "The single dynamic that decides this is" or any echo of the prompt instructions.
- NEVER contain statistics, percentages, dollar amounts, or dates.

FIRST_STEP RULES:
- If verdict is "bad": MUST start with "Skip it." then suggest a specific creative pivot.
- If verdict is "good" or "meh": a SPECIFIC action doable THIS WEEK. Reference the actual product/market.
- BANNED phrases: "Survey 100 people", "Build an MVP", "Build a prototype", "Develop a minimum viable product", "Develop a prototype", "Create a landing page", "Build a landing page", "Validate demand", "Test the market". Give a REAL action specific to this idea.
- Good examples: "Post in r/compliance asking what tools they hate", "DM 5 Etsy sellers about their shipping pain", "List a fake product on Craigslist and count replies in 48h".

ALTERNATIVES RULES:
- Must be CREATIVE pivots that SURPRISE — not obvious adjacent businesses.

DEDUP RULES (critical):
- punchline, why, biggest_risk, who_pays, first_step, and all score notes must EACH say something DIFFERENT.
- Before finalizing, re-read all fields — if two say similar things, rewrite one.

EXAMPLES:

"An app that reminds you to drink water" → bad
  punchline: "Your phone already does this for free"
  scores: 1/2/1

"B2B tool that auto-generates SOC 2 evidence from git commits" → good
  punchline: "Real gap — compliance teams still do this by hand"
  scores: 8/6/9

"Browser extension that shows SaaS pricing history" → good
  punchline: "Underserved niche — buyers have zero price transparency"
  scores: 7/8/7

Exactly 3 alternatives. 2-3 comparables (real companies only).`;

export async function POST(req: NextRequest) {
  const { idea } = await req.json();
  if (!idea || typeof idea !== 'string') {
    return NextResponse.json({ error: 'idea required' }, { status: 400 });
  }

  try {
    const text = await aiGenerate(PROMPT(idea), {
      system: SYSTEM,
      maxTokens: 1500,
      temperature: 0.3,
      jsonMode: true,
    });

    const cleaned = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    const parsed = JSON.parse(cleaned);

    if (!Array.isArray(parsed.alternatives)) parsed.alternatives = [];
    if (!Array.isArray(parsed.comparables)) parsed.comparables = [];

    // Score-based verdict enforcement
    if (parsed.scores) {
      const avg = (parsed.scores.market?.score + parsed.scores.execution?.score + parsed.scores.timing?.score) / 3;
      if (avg >= 6 && parsed.verdict !== 'good') parsed.verdict = 'good';
      else if (avg < 3.5 && parsed.verdict !== 'bad') parsed.verdict = 'bad';
    }

    // Strip "Crowded" from punchline
    if (parsed.punchline) {
      parsed.punchline = parsed.punchline.replace(/^Crowded\s*[—–\-,.:]\s*/i, '').trim();
      if (parsed.punchline[0]) parsed.punchline = parsed.punchline[0].toUpperCase() + parsed.punchline.slice(1);
    }

    return NextResponse.json(parsed);
  } catch (e) {
    console.error('Vibe check error:', e);
    return NextResponse.json({ error: 'Failed to analyze idea' }, { status: 500 });
  }
}
