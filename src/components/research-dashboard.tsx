'use client';

import { Badge } from '@/components/ui/badge';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, RadialBarChart, RadialBar,
} from 'recharts';

interface StatItem {
  label: string;
  value: string;
  icon: string;
  trend?: string;
  description?: string;
}

interface InsightItem {
  text: string;
  type: string;
  importance: string;
}

interface CostItem {
  item: string;
  low: number;
  high: number;
}

interface CompetitorItem {
  name: string;
  price: string;
  rating: number;
  strengths?: string;
  weaknesses?: string;
}

interface ResourceItem {
  title: string;
  url: string;
  type: string;
}

interface MarketSegment {
  name: string;
  value: number;
}

export interface StructuredResearch {
  sectionId: string;
  keyTakeaway?: string;
  stats?: StatItem[];
  insights?: InsightItem[];
  costBreakdown?: CostItem[];
  competitors?: CompetitorItem[];
  marketSegments?: MarketSegment[];
  resources?: ResourceItem[];
  score?: number;
  // Legacy fields
  content?: string;
  keyInsights?: string[];
  estimatedCosts?: CostItem[];
  risks?: string[];
  opportunities?: string[];
}

const COLORS = ['#f59e0b', '#f97316', '#ef4444', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899'];

function TrendArrow({ trend }: { trend?: string }) {
  if (trend === 'up') return <span className="text-green-400 text-sm">↑</span>;
  if (trend === 'down') return <span className="text-red-400 text-sm">↓</span>;
  return null;
}

function ScoreRing({ score }: { score: number }) {
  const data = [{ value: score, fill: score >= 7 ? '#22c55e' : score >= 4 ? '#f59e0b' : '#ef4444' }];
  return (
    <div className="relative w-24 h-24">
      <RadialBarChart
        width={96} height={96} cx={48} cy={48}
        innerRadius={32} outerRadius={44} barSize={8}
        data={data} startAngle={90} endAngle={90 - (score / 10) * 360}
      >
        <RadialBar dataKey="value" cornerRadius={4} background={{ fill: '#262626' }} />
      </RadialBarChart>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xl font-bold text-white">{score}</span>
      </div>
    </div>
  );
}

function KeyTakeawayBox({ text, score }: { text: string; score: number }) {
  return (
    <div className="flex items-start gap-4 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 mb-6">
      <ScoreRing score={score} />
      <div className="flex-1 min-w-0">
        <h4 className="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-1">Key Takeaway</h4>
        <p className="text-neutral-200 text-sm leading-relaxed">{text}</p>
      </div>
    </div>
  );
}

function StatsGrid({ stats }: { stats: StatItem[] }) {
  if (!stats?.length) return null;
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-6">
      {stats.map((s, i) => (
        <div key={i} className="bg-neutral-800/60 rounded-xl p-4 border border-neutral-700/50 hover:border-amber-500/30 transition-colors">
          <div className="text-2xl mb-1">{s.icon}</div>
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-bold text-white">{s.value}</span>
            <TrendArrow trend={s.trend} />
          </div>
          <p className="text-xs text-neutral-400 mt-1">{s.label}</p>
          {s.description && <p className="text-xs text-neutral-500 mt-0.5">{s.description}</p>}
        </div>
      ))}
    </div>
  );
}

function CostChart({ costs }: { costs: CostItem[] }) {
  if (!costs?.length) return null;
  const data = costs.map(c => ({ name: c.item, low: c.low, high: c.high - c.low }));
  const total = costs.reduce((sum, c) => sum + ((c.low + c.high) / 2), 0);

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-semibold text-green-300 flex items-center gap-2">💰 Cost Breakdown</h4>
        <span className="text-xs text-neutral-400">
          Est. total: <span className="text-white font-semibold">${Math.round(total).toLocaleString()}</span>
        </span>
      </div>
      <div className="bg-neutral-800/40 rounded-xl p-4 border border-neutral-700/50">
        <ResponsiveContainer width="100%" height={costs.length * 44 + 20}>
          <BarChart data={data} layout="vertical" margin={{ left: 0, right: 16, top: 0, bottom: 0 }}>
            <XAxis type="number" hide />
            <YAxis type="category" dataKey="name" width={100} tick={{ fill: '#a3a3a3', fontSize: 12 }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: '8px', fontSize: '12px' }}
              labelStyle={{ color: '#fff' }}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              formatter={(value: any, name: any) => {
                return [`$${Number(value).toLocaleString()}`, name === 'low' ? 'Min' : 'Additional'];
              }}
            />
            <Bar dataKey="low" stackId="a" fill="#22c55e" radius={[4, 0, 0, 4]} />
            <Bar dataKey="high" stackId="a" fill="#22c55e40" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
        <div className="flex gap-4 mt-2 text-xs text-neutral-500">
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-500 inline-block" /> Min</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-500/25 inline-block" /> Max range</span>
        </div>
      </div>
    </div>
  );
}

function MarketPieChart({ segments }: { segments: MarketSegment[] }) {
  if (!segments?.length) return null;
  return (
    <div className="mb-6">
      <h4 className="text-sm font-semibold text-blue-300 flex items-center gap-2 mb-3">🎯 Market Segments</h4>
      <div className="bg-neutral-800/40 rounded-xl p-4 border border-neutral-700/50 flex flex-col sm:flex-row items-center gap-4">
        <ResponsiveContainer width={180} height={180}>
          <PieChart>
            <Pie
              data={segments} dataKey="value" nameKey="name"
              cx="50%" cy="50%" outerRadius={70} innerRadius={40}
              paddingAngle={2} strokeWidth={0}
            >
              {segments.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Pie>
            <Tooltip
              contentStyle={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: '8px', fontSize: '12px' }}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              formatter={(value: any) => [`${value}%`]}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="flex flex-wrap gap-2">
          {segments.map((s, i) => (
            <div key={i} className="flex items-center gap-2 text-xs text-neutral-300">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
              {s.name} ({s.value}%)
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function InsightsCards({ insights }: { insights: InsightItem[] }) {
  if (!insights?.length) return null;
  const colorMap = {
    opportunity: { bg: 'bg-green-500/8', border: 'border-green-500/20', icon: '🚀', label: 'text-green-400' },
    risk: { bg: 'bg-red-500/8', border: 'border-red-500/20', icon: '⚠️', label: 'text-red-400' },
    neutral: { bg: 'bg-neutral-500/8', border: 'border-neutral-500/20', icon: '💡', label: 'text-neutral-400' },
  };

  return (
    <div className="mb-6">
      <h4 className="text-sm font-semibold text-amber-300 flex items-center gap-2 mb-3">📋 Key Insights</h4>
      <div className="grid gap-2">
        {insights.map((ins, i) => {
          const c = colorMap[ins.type as keyof typeof colorMap] || colorMap.neutral;
          return (
            <div key={i} className={`${c.bg} ${c.border} border rounded-lg p-3 flex items-start gap-3`}>
              <span className="text-lg shrink-0">{c.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-neutral-200">{ins.text}</p>
              </div>
              {ins.importance === 'high' && (
                <Badge className="bg-amber-500/20 text-amber-300 text-xs shrink-0">Important</Badge>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CompetitorTable({ competitors }: { competitors: CompetitorItem[] }) {
  if (!competitors?.length) return null;
  return (
    <div className="mb-6">
      <h4 className="text-sm font-semibold text-purple-300 flex items-center gap-2 mb-3">🏢 Competitor Landscape</h4>
      <div className="bg-neutral-800/40 rounded-xl border border-neutral-700/50 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-700/50">
              <th className="text-left p-3 text-neutral-400 font-medium">Competitor</th>
              <th className="text-left p-3 text-neutral-400 font-medium">Price</th>
              <th className="text-left p-3 text-neutral-400 font-medium">Rating</th>
              <th className="text-left p-3 text-neutral-400 font-medium hidden sm:table-cell">Strengths</th>
            </tr>
          </thead>
          <tbody>
            {competitors.map((c, i) => (
              <tr key={i} className="border-b border-neutral-700/30 last:border-0">
                <td className="p-3 text-white font-medium">{c.name}</td>
                <td className="p-3 text-neutral-300">{c.price}</td>
                <td className="p-3">
                  <div className="flex items-center gap-1">
                    <span className="text-amber-400">{'★'.repeat(Math.round(c.rating))}</span>
                    <span className="text-neutral-500 text-xs">{c.rating}</span>
                  </div>
                </td>
                <td className="p-3 text-neutral-400 text-xs hidden sm:table-cell">{c.strengths || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ResourceLinks({ resources }: { resources: ResourceItem[] }) {
  if (!resources?.length) return null;
  const iconMap: Record<string, string> = { video: '🎥', tool: '🔧', article: '📄' };
  return (
    <div className="mb-2">
      <h4 className="text-sm font-semibold text-purple-300 flex items-center gap-2 mb-3">📚 Resources</h4>
      <div className="flex flex-wrap gap-2">
        {resources.map((r, i) => (
          <a
            key={i} href={r.url} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-2 bg-neutral-800/50 hover:bg-neutral-700/50 border border-neutral-700/50 rounded-lg px-3 py-2 text-sm text-amber-400 hover:text-amber-300 transition-colors"
          >
            {iconMap[r.type] || '📄'} {r.title}
          </a>
        ))}
      </div>
    </div>
  );
}

// Convert legacy format to structured format for backward compatibility
function normalizeResearch(research: StructuredResearch): StructuredResearch {
  return {
    ...research,
    keyTakeaway: research.keyTakeaway || (research.keyInsights?.[0] ?? ''),
    stats: research.stats || [],
    insights: research.insights || [
      ...(research.opportunities?.map(t => ({ text: t, type: 'opportunity' as const, importance: 'medium' as const })) || []),
      ...(research.risks?.map(t => ({ text: t, type: 'risk' as const, importance: 'medium' as const })) || []),
    ],
    costBreakdown: research.costBreakdown || research.estimatedCosts || [],
    competitors: research.competitors || [],
    resources: research.resources || [],
    score: research.score || 5,
  };
}

export function ResearchDashboard({ research: raw }: { research: StructuredResearch }) {
  const research = normalizeResearch(raw);
  const hasVisualData = research.stats?.length || research.insights?.length || research.costBreakdown?.length;

  return (
    <div className="space-y-2 pt-2">
      {research.keyTakeaway && (
        <KeyTakeawayBox text={research.keyTakeaway} score={research.score ?? 5} />
      )}

      <StatsGrid stats={research.stats ?? []} />
      <InsightsCards insights={research.insights ?? []} />
      <CostChart costs={research.costBreakdown ?? []} />
      {research.marketSegments && <MarketPieChart segments={research.marketSegments} />}
      <CompetitorTable competitors={research.competitors ?? []} />
      <ResourceLinks resources={research.resources ?? []} />

      {/* Fallback: show content if no structured data */}
      {!hasVisualData && research.content && (
        <div className="text-sm text-neutral-300 whitespace-pre-wrap leading-relaxed">
          {research.content}
        </div>
      )}
    </div>
  );
}
