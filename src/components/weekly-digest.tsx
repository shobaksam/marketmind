'use client';

import { Card, CardContent } from '@/components/ui/card';
import { FadeIn } from '@/components/animate';

interface Idea {
  title: string;
  category: string;
  created_at: string;
  research: Record<string, { score?: number }>;
}

export function WeeklyDigest({ ideas }: { ideas: Idea[] }) {
  if (ideas.length < 2) return null;

  // Compute stats
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thisWeek = ideas.filter(i => new Date(i.created_at) >= weekAgo);
  const totalResearch = ideas.reduce((sum, i) => sum + Object.keys(i.research || {}).length, 0);
  const avgScore = ideas.reduce((sum, i) => {
    const scores = Object.values(i.research || {}).map(r => r.score || 0).filter(s => s > 0);
    return sum + (scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0);
  }, 0) / ideas.length;

  // Most researched category
  const catCounts: Record<string, number> = {};
  ideas.forEach(i => { catCounts[i.category] = (catCounts[i.category] || 0) + 1; });
  const topCategory = Object.entries(catCounts).sort((a, b) => b[1] - a[1])[0];

  return (
    <FadeIn delay={0.15}>
      <Card className="border-neutral-800 bg-gradient-to-br from-neutral-900/80 to-purple-950/10 mb-8">
        <CardContent className="pt-5">
          <h3 className="text-sm font-bold text-purple-400 mb-3 flex items-center gap-2">📈 Your Insights</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="text-center">
              <p className="text-2xl font-bold text-white">{thisWeek.length}</p>
              <p className="text-xs text-neutral-500">Ideas this week</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-white">{totalResearch}</p>
              <p className="text-xs text-neutral-500">Sections researched</p>
            </div>
            <div className="text-center">
              <p className={`text-2xl font-bold ${avgScore >= 7 ? 'text-green-400' : avgScore >= 4 ? 'text-amber-400' : 'text-red-400'}`}>
                {avgScore.toFixed(1)}
              </p>
              <p className="text-xs text-neutral-500">Avg score</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-amber-400">{topCategory?.[0] || '—'}</p>
              <p className="text-xs text-neutral-500">Top category</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </FadeIn>
  );
}
