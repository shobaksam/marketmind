'use client';

import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, useCallback, Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FadeIn } from '@/components/animate';
import { Lightbulb, ArrowLeft } from 'lucide-react';

interface Idea {
  id: string;
  title: string;
  summary: string;
  category: string;
  location: string;
  framework: { sections: Array<{ id: string; title: string; icon: string }> };
  research: Record<string, { score?: number; keyInsights?: string[]; content?: string }>;
  swot: { strengths: string[]; weaknesses: string[]; opportunities: string[]; threats: string[]; overallScore: number; verdict: string } | null;
}

function CompareContent() {
  const { status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [allIdeas, setAllIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const fetchAllIdeas = useCallback(async () => {
    try {
      const res = await fetch('/api/ideas');
      if (res.ok) {
        const data = await res.json();
        setAllIdeas(data);
        // Check URL params for pre-selected ideas
        const a = searchParams.get('a');
        const b = searchParams.get('b');
        if (a && b) {
          setSelectedIds([a, b]);
          const selected = data.filter((i: Idea) => i.id === a || i.id === b);
          setIdeas(selected);
        }
      }
    } catch {
      console.error('Failed to fetch ideas');
    } finally {
      setLoading(false);
    }
  }, [searchParams]);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
    if (status === 'authenticated') fetchAllIdeas();
  }, [status, router, fetchAllIdeas]);

  const handleSelect = (id: string) => {
    const newIds = selectedIds.includes(id)
      ? selectedIds.filter(i => i !== id)
      : selectedIds.length < 2 ? [...selectedIds, id] : [selectedIds[1], id];
    
    setSelectedIds(newIds);
    setIdeas(allIdeas.filter(i => newIds.includes(i.id)));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-950">
        <div className="animate-spin h-8 w-8 border-2 border-amber-500/30 border-t-amber-500 rounded-full" />
      </div>
    );
  }

  const [ideaA, ideaB] = ideas;

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <header className="border-b border-neutral-800 px-4 sm:px-6 py-4 sticky top-0 bg-neutral-950/80 backdrop-blur z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push('/dashboard')} className="text-neutral-400 hover:text-white">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <Lightbulb className="h-5 w-5 text-amber-400" />
            <span className="text-lg font-bold">Compare Ideas</span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Idea Selector */}
        <FadeIn>
          <div className="mb-8">
            <h2 className="text-sm font-semibold text-neutral-400 mb-3">Select 2 ideas to compare:</h2>
            <div className="flex flex-wrap gap-2">
              {allIdeas.map(idea => (
                <button
                  key={idea.id}
                  onClick={() => handleSelect(idea.id)}
                  className={`px-3 py-2 rounded-lg text-sm border transition-all ${
                    selectedIds.includes(idea.id)
                      ? 'border-amber-500 bg-amber-500/10 text-amber-400'
                      : 'border-neutral-800 bg-neutral-900/50 text-neutral-400 hover:border-neutral-700'
                  }`}
                >
                  {idea.title}
                </button>
              ))}
            </div>
          </div>
        </FadeIn>

        {ideas.length < 2 ? (
          <FadeIn>
            <div className="rounded-xl border border-neutral-800 bg-neutral-900/30 p-16 text-center">
              <h3 className="text-lg font-semibold mb-2">Select two ideas to compare</h3>
              <p className="text-neutral-400">Click on two ideas above to see a side-by-side comparison.</p>
            </div>
          </FadeIn>
        ) : (
          <FadeIn delay={0.1}>
            <div className="space-y-8">
              {/* Overview comparison */}
              <div className="grid grid-cols-2 gap-4">
                {[ideaA, ideaB].map(idea => (
                  <Card key={idea.id} className="border-neutral-800 bg-neutral-900/50">
                    <CardHeader>
                      <CardTitle className="text-base text-white">{idea.title}</CardTitle>
                      <div className="flex gap-2 mt-1">
                        <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20">{idea.category}</Badge>
                        {idea.location && <span className="text-xs text-neutral-500">📍 {idea.location}</span>}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-neutral-400 line-clamp-3">{idea.summary}</p>
                      <div className="mt-3 text-xs text-neutral-500">
                        {Object.keys(idea.research || {}).length}/{idea.framework?.sections?.length || 0} sections researched
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* SWOT comparison */}
              {(ideaA?.swot || ideaB?.swot) && (
                <div>
                  <h3 className="text-lg font-bold mb-4">📊 SWOT Comparison</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {[ideaA, ideaB].map(idea => (
                      <div key={idea.id} className="space-y-3">
                        {idea.swot ? (
                          <>
                            <div className="text-center mb-4">
                              <span className="text-3xl font-bold text-amber-400">{idea.swot.overallScore}/10</span>
                              <p className="text-xs text-neutral-500 mt-1">Viability Score</p>
                            </div>
                            {[
                              { label: '💪 Strengths', items: idea.swot.strengths, color: 'green' },
                              { label: '⚠️ Weaknesses', items: idea.swot.weaknesses, color: 'red' },
                              { label: '🚀 Opportunities', items: idea.swot.opportunities, color: 'blue' },
                              { label: '🔥 Threats', items: idea.swot.threats, color: 'yellow' },
                            ].map(({ label, items, color }) => (
                              <Card key={label} className={`border-${color}-500/20 bg-${color}-500/5`}>
                                <CardContent className="p-3">
                                  <h4 className="text-xs font-semibold mb-1" style={{ color: `var(--${color}-400, #888)` }}>{label}</h4>
                                  {items.slice(0, 3).map((item, i) => (
                                    <p key={i} className="text-xs text-neutral-400">• {item}</p>
                                  ))}
                                </CardContent>
                              </Card>
                            ))}
                          </>
                        ) : (
                          <div className="text-center py-8 text-neutral-500 text-sm">No SWOT analysis yet</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Section scores comparison */}
              <div>
                <h3 className="text-lg font-bold mb-4">🔬 Section Scores</h3>
                <div className="space-y-3">
                  {/* Collect all unique section titles */}
                  {(() => {
                    const allSections = new Map<string, { title: string; icon: string }>();
                    [ideaA, ideaB].forEach(idea => {
                      idea.framework?.sections?.forEach(s => {
                        if (!allSections.has(s.title)) allSections.set(s.title, { title: s.title, icon: s.icon });
                      });
                    });
                    return Array.from(allSections.values()).map(section => {
                      const scoreA = ideaA.framework?.sections?.find(s => s.title === section.title);
                      const scoreB = ideaB.framework?.sections?.find(s => s.title === section.title);
                      const resA = scoreA ? ideaA.research?.[scoreA.id] : null;
                      const resB = scoreB ? ideaB.research?.[scoreB.id] : null;
                      return (
                        <div key={section.title} className="grid grid-cols-[1fr_auto_1fr] gap-4 items-center">
                          <div className="text-right">
                            {resA?.score ? (
                              <div className="flex items-center justify-end gap-2">
                                <div className="h-2 rounded-full bg-neutral-800 w-full overflow-hidden">
                                  <div className="h-full bg-amber-500 rounded-full" style={{ width: `${(resA.score / 10) * 100}%` }} />
                                </div>
                                <span className="text-sm font-mono text-amber-400 w-8">{resA.score}</span>
                              </div>
                            ) : <span className="text-xs text-neutral-600">—</span>}
                          </div>
                          <div className="text-center px-2">
                            <span className="text-lg">{section.icon}</span>
                            <p className="text-xs text-neutral-500 truncate max-w-[120px]">{section.title}</p>
                          </div>
                          <div>
                            {resB?.score ? (
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-mono text-amber-400 w-8">{resB.score}</span>
                                <div className="h-2 rounded-full bg-neutral-800 w-full overflow-hidden">
                                  <div className="h-full bg-amber-500 rounded-full" style={{ width: `${(resB.score / 10) * 100}%` }} />
                                </div>
                              </div>
                            ) : <span className="text-xs text-neutral-600">—</span>}
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>

              {/* Back to dashboard */}
              <div className="text-center pt-4">
                <Button onClick={() => router.push('/dashboard')} variant="outline" className="border-neutral-700">
                  ← Back to Dashboard
                </Button>
              </div>
            </div>
          </FadeIn>
        )}
      </main>
    </div>
  );
}

export default function ComparePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-neutral-950">
        <div className="animate-spin h-8 w-8 border-2 border-amber-500/30 border-t-amber-500 rounded-full" />
      </div>
    }>
      <CompareContent />
    </Suspense>
  );
}
