import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { aiGenerate } from '@/lib/ai';
import { getServiceSupabase } from '@/lib/supabase';

function extractStructuredData(sectionId: string, text: string) {
  const stats: { label: string; value: string; icon: string }[] = [];
  const insights: { text: string; type: string; importance: string }[] = [];
  const costBreakdown: { item: string; low: number; high: number }[] = [];

  // Extract dollar amounts as stats
  const dollarMatches = Array.from(text.matchAll(/(\b[A-Z][a-z ]+(?:cost|price|revenue|market|budget|salary|fee|investment)s?)\b[^$]*?\$([0-9,.]+[KMBkmb]?)/gi));
  for (const m of dollarMatches) {
    stats.push({ label: m[1].trim(), value: `$${m[2]}`, icon: '💰' });
  }

  // Extract percentages as stats
  const pctMatches = Array.from(text.matchAll(/(\b[A-Z][a-z ]+(?:rate|growth|margin|share))\b[^0-9]*?([0-9.]+%)/gi));
  for (const m of pctMatches) {
    stats.push({ label: m[1].trim(), value: m[2], icon: '📊' });
  }

  // Extract cost ranges like "$5,000 - $15,000"
  const costRanges = Array.from(text.matchAll(/([A-Za-z ]+?):\s*\$([0-9,.]+)[KkMm]?\s*[-–to]+\s*\$([0-9,.]+)[KkMm]?/g));
  for (const m of costRanges) {
    const parseNum = (s: string) => parseFloat(s.replace(/,/g, ''));
    costBreakdown.push({ item: m[1].trim(), low: parseNum(m[2]), high: parseNum(m[3]) });
  }

  // Extract bullet points as insights
  const bullets = text.match(/[-•]\s+(.+)/g);
  if (bullets) {
    for (const b of bullets.slice(0, 8)) {
      const clean = b.replace(/^[-•]\s+/, '').trim();
      const type = /risk|threat|challenge|difficult|expensive|danger/i.test(clean) ? 'risk'
        : /opportunit|advantage|growing|potential|benefit/i.test(clean) ? 'opportunity' : 'neutral';
      insights.push({ text: clean, type, importance: 'medium' });
    }
  }

  // Extract first sentence as key takeaway
  const firstSentence = text.match(/^[^.!?]+[.!?]/)?.[0] || text.substring(0, 200);

  return {
    sectionId,
    content: text,
    keyTakeaway: firstSentence.trim(),
    score: 5,
    stats: stats.slice(0, 6),
    insights,
    costBreakdown,
    competitors: [],
    resources: [],
  };
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession();
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { sectionId } = await req.json();

  const supabase = getServiceSupabase();
  const { data: idea, error } = await supabase
    .from('marketmind_ideas')
    .select('*')
    .eq('id', params.id)
    .single();

  if (error || !idea) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const framework = idea.framework as Record<string, unknown>;
  const sections = framework.sections as Array<Record<string, unknown>>;
  const section = sections?.find((s) => s.id === sectionId);

  if (!section) {
    return NextResponse.json({ error: 'Section not found' }, { status: 404 });
  }

  const locationDirective = idea.location ? `
CRITICAL — LOCAL FOCUS: The user is researching this idea for "${idea.location}" specifically.
- ALL data, stats, competitors, costs, and insights MUST be specific to the ${idea.location} area
- Name REAL local competitors in ${idea.location}, not national chains (unless they operate there)
- Use local cost-of-living, rent prices, wages, and market data for ${idea.location}
- Reference local regulations, permits, zoning laws specific to ${idea.location}
- Consider ${idea.location}'s demographics, culture, income levels, and consumer preferences
- Do NOT give generic advice — be hyper-specific to ${idea.location}` : '';

  const prompt = `You are a business research analyst creating VISUAL DASHBOARD DATA. Your output will be rendered as charts, stat cards, and visual components — NOT walls of text.

Business Idea: "${idea.idea_text}"
${idea.location ? `Location: ${idea.location}` : ''}
${locationDirective}

Research Section: "${section.title}"
Questions to answer:
${(section.questions as string[]).map((q: string, i: number) => `${i + 1}. ${q}`).join('\n')}

You are designing a UNIQUE visual dashboard for this specific section. Choose ONLY the UI blocks that make sense for THIS topic.

Return a JSON object:
{
  "sectionId": "${sectionId}",
  "keyTakeaway": "One clear sentence — the #1 thing to know",
  "score": 7,
  "layout": [
    // YOU CHOOSE which blocks to include and in what order. Pick 3-6 that fit THIS section best.
    // Available block types:

    // "stat-grid" — Big number cards. Use for market sizes, costs, percentages, counts.
    {"type": "stat-grid", "data": [{"label": "Market Size", "value": "$2.4B", "icon": "📊", "trend": "up", "description": "Growing 12% yearly"}]},

    // "bar-chart" — Horizontal bar chart for cost breakdowns, budget allocations, comparisons.
    {"type": "bar-chart", "title": "Startup Costs", "data": [{"item": "Equipment", "low": 5000, "high": 15000}]},

    // "pie-chart" — Donut chart for market segments, demographics, distributions.
    {"type": "pie-chart", "title": "Market Segments", "data": [{"name": "Segment A", "value": 40}]},

    // "pros-cons" — Two-column pros and cons. Great for risks/opportunities, advantages/disadvantages.
    {"type": "pros-cons", "pros": [{"text": "Growing market", "importance": "high"}], "cons": [{"text": "High competition", "importance": "medium"}]},

    // "checklist" — Action items or requirements list. Great for permits, regulations, steps to take.
    {"type": "checklist", "title": "Requirements", "items": [{"text": "Business license", "checked": false, "detail": "Apply at city hall, $150"}]},

    // "comparison-table" — Compare competitors, products, options side by side.
    {"type": "comparison-table", "title": "Competitors", "columns": ["Name", "Price", "Rating", "Notes"], "rows": [["Competitor A", "$49/mo", "4.5★", "Market leader"]]},

    // "timeline" — Sequential steps or milestones. Great for launch plans, processes.
    {"type": "timeline", "title": "Launch Timeline", "steps": [{"label": "Month 1", "text": "Secure permits and location", "icon": "📋"}]},

    // "callout" — Important warning, tip, or highlight box.
    {"type": "callout", "style": "warning|tip|info|success", "title": "Important", "text": "You'll need a food handler's permit before opening."},

    // "number-highlight" — One BIG featured number with context. Use for the most impressive stat.
    {"type": "number-highlight", "value": "$127K", "label": "Average First-Year Revenue", "context": "Based on similar businesses in the area", "trend": "up"},

    // "quote" — Real testimonial or expert quote.
    {"type": "quote", "text": "The food truck scene here is booming", "source": "San Diego Food Truck Association", "url": "https://..."},

    // "insights" — Color-coded insight cards (opportunity/risk/neutral).
    {"type": "insights", "data": [{"text": "Clear insight", "kind": "opportunity|risk|neutral", "importance": "high|medium|low"}]},

    // "resources" — Links to articles, videos, tools.
    {"type": "resources", "data": [{"title": "Resource name", "url": "https://...", "kind": "article|video|tool"}]}
  ]
}

CRITICAL RULES:
- CHOOSE blocks that FIT this section topic. A "Regulations" section should use checklist + callout + timeline. A "Costs" section should use stat-grid + bar-chart + number-highlight. A "Competition" section should use comparison-table + pie-chart. BE CREATIVE and SPECIFIC.
- Do NOT use the same layout for every section. Each section should feel different and tailored.
- Use 3-6 blocks per section. Quality over quantity.
- Use simple language anyone can understand. No business jargon.
- Include REAL data, real business names, real numbers, real URLs.${idea.location ? `\n- ALL data MUST be specific to ${idea.location}. Real local businesses, local prices, local laws.` : ''}

Return ONLY valid JSON.`;

  try {
    const aiResponse = await aiGenerate(prompt, 6000);
    let research;
    try {
      const match = aiResponse.match(/```(?:json)?\s*([\s\S]*?)```/);
      const jsonStr = match ? match[1].trim() : aiResponse.trim();
      research = JSON.parse(jsonStr);
    } catch {
      // AI returned text instead of JSON — extract what we can
      research = extractStructuredData(sectionId, aiResponse);
    }

    // Ensure required fields always exist
    research.sectionId = sectionId;
    research.score = research.score || 5;
    // Preserve layout array from new dynamic format
    research.layout = research.layout || [];
    // Legacy fields for backward compat
    research.stats = research.stats || [];
    research.insights = research.insights || [];
    research.costBreakdown = research.costBreakdown || research.estimatedCosts || [];
    research.competitors = research.competitors || [];
    research.resources = research.resources || [];
    if (!research.keyTakeaway && research.keyInsights?.length) {
      research.keyTakeaway = research.keyInsights[0];
    }

    // Save research to idea
    const existingResearch = (idea.research as Record<string, unknown>) || {};
    const updatedResearch = { ...existingResearch, [sectionId]: research };

    await supabase
      .from('marketmind_ideas')
      .update({ research: updatedResearch, status: 'researching' })
      .eq('id', params.id);

    return NextResponse.json(research);
  } catch (err) {
    console.error('Research error:', err instanceof Error ? err.message : err);
    // Return a minimal fallback result instead of 500
    const fallback = {
      sectionId,
      keyTakeaway: 'Research generation encountered an issue. Please try again.',
      score: 5,
      layout: [
        { type: 'callout', style: 'warning', title: 'Research Incomplete', text: 'We had trouble generating this research. Please click "Research This Section" to try again.' }
      ],
    };
    // Still try to save partial result
    try {
      const existingResearch = (idea.research as Record<string, unknown>) || {};
      const updatedResearch = { ...existingResearch, [sectionId]: fallback };
      await supabase.from('marketmind_ideas').update({ research: updatedResearch }).eq('id', params.id);
    } catch { /* ignore save error */ }
    return NextResponse.json(fallback);
  }
}
