'use client';

import { Badge } from '@/components/ui/badge';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, RadialBarChart, RadialBar,
} from 'recharts';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Block = { type: string; [key: string]: any };

export interface StructuredResearch {
  sectionId: string;
  keyTakeaway?: string;
  score?: number;
  layout?: Block[];
  // Legacy fields for backward compatibility
  stats?: { label: string; value: string; icon: string; trend?: string; description?: string }[];
  insights?: { text: string; type: string; importance: string }[];
  costBreakdown?: { item: string; low: number; high: number }[];
  estimatedCosts?: { item: string; low: number; high: number }[];
  competitors?: { name: string; price: string; rating: number; strengths?: string }[];
  marketSegments?: { name: string; value: number }[];
  resources?: { title: string; url: string; type: string }[];
  content?: string;
  keyInsights?: string[];
  risks?: string[];
  opportunities?: string[];
}

const COLORS = ['#f59e0b', '#f97316', '#ef4444', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899'];

// ─── Score Ring ───
function ScoreRing({ score }: { score: number }) {
  const data = [{ value: score, fill: score >= 7 ? '#22c55e' : score >= 4 ? '#f59e0b' : '#ef4444' }];
  return (
    <div className="relative w-20 h-20">
      <RadialBarChart width={80} height={80} cx={40} cy={40} innerRadius={26} outerRadius={36} barSize={7} data={data} startAngle={90} endAngle={90 - (score / 10) * 360}>
        <RadialBar dataKey="value" cornerRadius={4} background={{ fill: '#262626' }} />
      </RadialBarChart>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-lg font-bold text-white">{score}</span>
      </div>
    </div>
  );
}

// ─── Key Takeaway ───
function KeyTakeaway({ text, score }: { text: string; score: number }) {
  return (
    <div className="flex items-start gap-4 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 mb-5">
      <ScoreRing score={score} />
      <div className="flex-1 min-w-0">
        <h4 className="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-1">Key Takeaway</h4>
        <p className="text-neutral-200 text-sm leading-relaxed">{text}</p>
      </div>
    </div>
  );
}

// ─── Block: Stat Grid ───
function StatGridBlock({ data }: { data: ({ label: string; value: string; icon: string; trend?: string; description?: string } | string)[] }) {
  if (!data?.length) return null;
  // Normalize: AI sometimes returns strings instead of objects
  const normalized = data.map(d => typeof d === 'string' ? { label: d, value: '', icon: '📊' } : d);
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-5">
      {normalized.map((s, i) => (
        <div key={i} className="bg-neutral-800/60 rounded-xl p-4 border border-neutral-700/50 hover:border-amber-500/30 transition-colors">
          <div className="text-2xl mb-1">{s.icon}</div>
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-bold text-white">{s.value}</span>
            {s.trend === 'up' && <span className="text-green-400 text-sm">↑</span>}
            {s.trend === 'down' && <span className="text-red-400 text-sm">↓</span>}
          </div>
          <p className="text-xs text-neutral-400 mt-1">{s.label}</p>
          {s.description && <p className="text-xs text-neutral-500 mt-0.5">{s.description}</p>}
        </div>
      ))}
    </div>
  );
}

// ─── Block: Bar Chart ───
function BarChartBlock({ title, data }: { title?: string; data: { item: string; low: number; high: number }[] }) {
  if (!data?.length) return null;
  const chartData = data.map(c => ({ name: c.item, low: c.low, range: c.high - c.low }));
  const total = data.reduce((sum, c) => sum + ((c.low + c.high) / 2), 0);
  return (
    <div className="mb-5">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-semibold text-green-300">💰 {title || 'Cost Breakdown'}</h4>
        <span className="text-xs text-neutral-400">Est. total: <span className="text-white font-semibold">${Math.round(total).toLocaleString()}</span></span>
      </div>
      <div className="bg-neutral-800/40 rounded-xl p-4 border border-neutral-700/50">
        <ResponsiveContainer width="100%" height={data.length * 44 + 20}>
          <BarChart data={chartData} layout="vertical" margin={{ left: 0, right: 16 }}>
            <XAxis type="number" hide />
            <YAxis type="category" dataKey="name" width={110} tick={{ fill: '#a3a3a3', fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: '8px', fontSize: '12px' }} />
            <Bar dataKey="low" stackId="a" fill="#22c55e" radius={[4, 0, 0, 4]} />
            <Bar dataKey="range" stackId="a" fill="#22c55e40" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ─── Block: Pie Chart ───
function PieChartBlock({ title, data }: { title?: string; data: { name: string; value: number }[] }) {
  if (!data?.length) return null;
  return (
    <div className="mb-5">
      <h4 className="text-sm font-semibold text-blue-300 mb-3">🎯 {title || 'Distribution'}</h4>
      <div className="bg-neutral-800/40 rounded-xl p-4 border border-neutral-700/50 flex flex-col sm:flex-row items-center gap-4">
        <ResponsiveContainer width={160} height={160}>
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={65} innerRadius={38} paddingAngle={2} strokeWidth={0}>
              {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Pie>
            <Tooltip contentStyle={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: '8px' }} />
          </PieChart>
        </ResponsiveContainer>
        <div className="flex flex-wrap gap-2">
          {data.map((s, i) => (
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

// ─── Block: Pros/Cons ───
function ProsConsBlock({ pros, cons }: { pros?: { text: string; importance?: string }[]; cons?: { text: string; importance?: string }[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
      {pros?.length ? (
        <div className="bg-green-500/5 border border-green-500/20 rounded-xl p-4">
          <h4 className="text-sm font-semibold text-green-400 mb-3">✅ Opportunities</h4>
          <div className="space-y-2">
            {pros.map((p, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="text-green-400 mt-0.5 shrink-0">+</span>
                <span className="text-sm text-neutral-200">{p.text}</span>
                {p.importance === 'high' && <Badge className="bg-green-500/20 text-green-300 text-[10px] shrink-0">Key</Badge>}
              </div>
            ))}
          </div>
        </div>
      ) : null}
      {cons?.length ? (
        <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4">
          <h4 className="text-sm font-semibold text-red-400 mb-3">⚠️ Risks</h4>
          <div className="space-y-2">
            {cons.map((c, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="text-red-400 mt-0.5 shrink-0">−</span>
                <span className="text-sm text-neutral-200">{c.text}</span>
                {c.importance === 'high' && <Badge className="bg-red-500/20 text-red-300 text-[10px] shrink-0">Watch</Badge>}
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

// ─── Block: Checklist ───
function ChecklistBlock({ title, items }: { title?: string; items: (string | { text: string; checked?: boolean; detail?: string })[] }) {
  if (!items?.length) return null;
  return (
    <div className="mb-5">
      <h4 className="text-sm font-semibold text-purple-300 mb-3">📋 {title || 'Checklist'}</h4>
      <div className="bg-neutral-800/40 rounded-xl border border-neutral-700/50 divide-y divide-neutral-700/30">
        {items.map((raw, i) => {
          const item = typeof raw === 'string' ? { text: raw, checked: false, detail: undefined } : raw;
          return (
            <div key={i} className="flex items-start gap-3 p-3">
              <span className={`mt-0.5 shrink-0 ${item.checked ? 'text-green-400' : 'text-neutral-500'}`}>
                {item.checked ? '✅' : '☐'}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-neutral-200">{item.text}</p>
                {item.detail && <p className="text-xs text-neutral-500 mt-0.5">{item.detail}</p>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Block: Comparison Table ───
function ComparisonTableBlock({ title, columns, rows }: { title?: string; columns: string[]; rows: string[][] }) {
  if (!rows?.length) return null;
  return (
    <div className="mb-5">
      <h4 className="text-sm font-semibold text-purple-300 mb-3">🏢 {title || 'Comparison'}</h4>
      <div className="bg-neutral-800/40 rounded-xl border border-neutral-700/50 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-700/50">
              {columns?.map((col, i) => <th key={i} className="text-left p-3 text-neutral-400 font-medium">{col}</th>)}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className="border-b border-neutral-700/30 last:border-0">
                {row.map((cell, j) => (
                  <td key={j} className={`p-3 ${j === 0 ? 'text-white font-medium' : 'text-neutral-300'}`}>{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Block: Timeline ───
function TimelineBlock({ title, steps }: { title?: string; steps: { label: string; text: string; icon?: string }[] }) {
  if (!steps?.length) return null;
  return (
    <div className="mb-5">
      <h4 className="text-sm font-semibold text-blue-300 mb-3">📅 {title || 'Timeline'}</h4>
      <div className="space-y-0">
        {steps.map((step, i) => (
          <div key={i} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-sm">
                {step.icon || (i + 1)}
              </div>
              {i < steps.length - 1 && <div className="w-0.5 h-full bg-neutral-700 min-h-[24px]" />}
            </div>
            <div className="pb-4">
              <p className="text-xs font-semibold text-amber-400">{step.label}</p>
              <p className="text-sm text-neutral-200">{step.text}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Block: Callout ───
function CalloutBlock({ style, title, text }: { style?: string; title?: string; text: string }) {
  const styles: Record<string, { bg: string; border: string; icon: string; titleColor: string }> = {
    warning: { bg: 'bg-red-500/8', border: 'border-red-500/20', icon: '⚠️', titleColor: 'text-red-400' },
    tip: { bg: 'bg-green-500/8', border: 'border-green-500/20', icon: '💡', titleColor: 'text-green-400' },
    info: { bg: 'bg-blue-500/8', border: 'border-blue-500/20', icon: 'ℹ️', titleColor: 'text-blue-400' },
    success: { bg: 'bg-green-500/8', border: 'border-green-500/20', icon: '✅', titleColor: 'text-green-400' },
  };
  const s = styles[style || 'info'] || styles.info;
  return (
    <div className={`${s.bg} ${s.border} border rounded-xl p-4 mb-5 flex items-start gap-3`}>
      <span className="text-xl shrink-0">{s.icon}</span>
      <div>
        {title && <p className={`text-sm font-semibold ${s.titleColor} mb-1`}>{title}</p>}
        <p className="text-sm text-neutral-200 leading-relaxed">{text}</p>
      </div>
    </div>
  );
}

// ─── Block: Number Highlight ───
function NumberHighlightBlock({ value, label, context, trend }: { value: string; label: string; context?: string; trend?: string }) {
  return (
    <div className="mb-5 bg-gradient-to-r from-amber-500/10 to-transparent border border-amber-500/20 rounded-xl p-6 text-center">
      <div className="flex items-center justify-center gap-2">
        <span className="text-4xl font-bold text-white">{value}</span>
        {trend === 'up' && <span className="text-green-400 text-2xl">↑</span>}
        {trend === 'down' && <span className="text-red-400 text-2xl">↓</span>}
      </div>
      <p className="text-sm font-medium text-amber-400 mt-1">{label}</p>
      {context && <p className="text-xs text-neutral-400 mt-1">{context}</p>}
    </div>
  );
}

// ─── Block: Quote ───
function QuoteBlock({ text, source, url }: { text: string; source?: string; url?: string }) {
  return (
    <div className="mb-5 border-l-4 border-amber-500/50 bg-neutral-800/30 rounded-r-xl p-4">
      <p className="text-sm text-neutral-200 italic">&ldquo;{text}&rdquo;</p>
      {source && (
        <p className="text-xs text-neutral-400 mt-2">
          — {url ? <a href={url} target="_blank" rel="noopener noreferrer" className="text-amber-400 hover:underline">{source}</a> : source}
        </p>
      )}
    </div>
  );
}

// ─── Block: Insights ───
function InsightsBlock({ data }: { data: { text: string; kind?: string; type?: string; importance?: string }[] }) {
  if (!data?.length) return null;
  const colorMap: Record<string, { bg: string; border: string; icon: string }> = {
    opportunity: { bg: 'bg-green-500/8', border: 'border-green-500/20', icon: '🚀' },
    risk: { bg: 'bg-red-500/8', border: 'border-red-500/20', icon: '⚠️' },
    neutral: { bg: 'bg-neutral-500/8', border: 'border-neutral-500/20', icon: '💡' },
  };
  return (
    <div className="mb-5 space-y-2">
      <h4 className="text-sm font-semibold text-amber-300 mb-2">📋 Key Insights</h4>
      {data.map((ins, i) => {
        const kind = ins.kind || ins.type || 'neutral';
        const c = colorMap[kind] || colorMap.neutral;
        return (
          <div key={i} className={`${c.bg} ${c.border} border rounded-lg p-3 flex items-start gap-3`}>
            <span className="text-lg shrink-0">{c.icon}</span>
            <p className="text-sm text-neutral-200 flex-1">{ins.text}</p>
            {ins.importance === 'high' && <Badge className="bg-amber-500/20 text-amber-300 text-[10px] shrink-0">Important</Badge>}
          </div>
        );
      })}
    </div>
  );
}

// ─── Block: Resources ───
function ResourcesBlock({ data }: { data: { title: string; url: string; kind?: string; type?: string }[] }) {
  if (!data?.length) return null;
  const iconMap: Record<string, string> = { video: '🎥', tool: '🔧', article: '📄' };
  return (
    <div className="mb-3">
      <h4 className="text-sm font-semibold text-purple-300 mb-3">📚 Resources</h4>
      <div className="flex flex-wrap gap-2">
        {data.map((r, i) => (
          <a key={i} href={r.url} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-2 bg-neutral-800/50 hover:bg-neutral-700/50 border border-neutral-700/50 rounded-lg px-3 py-2 text-sm text-amber-400 hover:text-amber-300 transition-colors">
            {iconMap[r.kind || r.type || 'article'] || '📄'} {r.title}
          </a>
        ))}
      </div>
    </div>
  );
}

// ─── Block Router ───
function RenderBlock({ block }: { block: Block }) {
  switch (block.type) {
    case 'stat-grid': return <StatGridBlock data={block.data} />;
    case 'bar-chart': return <BarChartBlock title={block.title} data={block.data} />;
    case 'pie-chart': return <PieChartBlock title={block.title} data={block.data} />;
    case 'pros-cons': return <ProsConsBlock pros={block.pros} cons={block.cons} />;
    case 'checklist': return <ChecklistBlock title={block.title} items={block.items} />;
    case 'comparison-table': return <ComparisonTableBlock title={block.title} columns={block.columns} rows={block.rows} />;
    case 'timeline': return <TimelineBlock title={block.title} steps={block.steps} />;
    case 'callout': return <CalloutBlock style={block.style} title={block.title} text={block.text} />;
    case 'number-highlight': return <NumberHighlightBlock value={block.value} label={block.label} context={block.context} trend={block.trend} />;
    case 'quote': return <QuoteBlock text={block.text} source={block.source} url={block.url} />;
    case 'insights': return <InsightsBlock data={block.data} />;
    case 'resources': return <ResourcesBlock data={block.data} />;
    default: return null;
  }
}

// ─── Legacy to Layout Converter ───
function legacyToLayout(research: StructuredResearch): Block[] {
  const blocks: Block[] = [];
  const stats = research.stats || [];
  const insights = research.insights || [];
  const costs = research.costBreakdown || research.estimatedCosts || [];
  const segments = research.marketSegments || [];
  const competitors = research.competitors || [];
  const resources = research.resources || [];
  const risks = research.risks || [];
  const opportunities = research.opportunities || [];

  if (stats.length) blocks.push({ type: 'stat-grid', data: stats });

  if (opportunities.length || risks.length || insights.length) {
    const prosFromInsights = insights.filter(i => i.type === 'opportunity').map(i => ({ text: i.text, importance: i.importance }));
    const consFromInsights = insights.filter(i => i.type === 'risk').map(i => ({ text: i.text, importance: i.importance }));
    const allPros = [...prosFromInsights, ...opportunities.map(t => ({ text: t, importance: 'medium' }))];
    const allCons = [...consFromInsights, ...risks.map(t => ({ text: t, importance: 'medium' }))];
    const neutrals = insights.filter(i => i.type === 'neutral');
    if (allPros.length || allCons.length) blocks.push({ type: 'pros-cons', pros: allPros, cons: allCons });
    if (neutrals.length) blocks.push({ type: 'insights', data: neutrals });
  }

  if (costs.length) blocks.push({ type: 'bar-chart', title: 'Cost Breakdown', data: costs });
  if (segments.length) blocks.push({ type: 'pie-chart', title: 'Market Segments', data: segments });
  if (competitors.length) {
    blocks.push({
      type: 'comparison-table',
      title: 'Competitors',
      columns: ['Name', 'Price', 'Rating', 'Strengths'],
      rows: competitors.map(c => [c.name, c.price, `${c.rating}★`, c.strengths || '—']),
    });
  }
  if (resources.length) blocks.push({ type: 'resources', data: resources });

  return blocks;
}

// ─── Main Component ───
export function ResearchDashboard({ research }: { research: StructuredResearch }) {
  // Use layout blocks if available, otherwise convert legacy format
  const layout = research.layout?.length ? research.layout : legacyToLayout(research);
  const score = research.score || 5;
  const takeaway = research.keyTakeaway || research.keyInsights?.[0] || '';

  return (
    <div className="pt-2">
      {takeaway && <KeyTakeaway text={takeaway} score={score} />}
      {layout.map((block, i) => <RenderBlock key={i} block={block} />)}
      {/* Fallback for pure text content */}
      {!layout.length && research.content && (
        <div className="text-sm text-neutral-300 whitespace-pre-wrap">{research.content}</div>
      )}
    </div>
  );
}
