'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FadeIn, FadeInStagger, FadeInItem } from '@/components/animate';
import Link from 'next/link';

interface SharedIdea {
  title: string;
  summary: string;
  category: string;
  location: string;
  framework: { sections: Array<{ id: string; title: string; icon: string; description: string; questions: string[]; priority: string }> };
  research: Record<string, { content: string; keyInsights?: string[]; score?: number; risks?: string[]; opportunities?: string[] }>;
  analysis: Record<string, unknown> | null;
  swot: { strengths: string[]; weaknesses: string[]; opportunities: string[]; threats: string[]; overallScore: number; verdict: string } | null;
  created_at: string;
}

export default function SharePage() {
  const params = useParams();
  const [idea, setIdea] = useState<SharedIdea | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/share/${params.shareId}`)
      .then(res => {
        if (!res.ok) throw new Error('Not found');
        return res.json();
      })
      .then(setIdea)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [params.shareId]);

  // Update page title dynamically
  useEffect(() => {
    if (idea) {
      document.title = `${idea.title} — MarketMind Research`;
    }
  }, [idea]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-950">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin h-8 w-8 border-2 border-amber-500/30 border-t-amber-500 rounded-full" />
          <span className="text-neutral-400 text-sm">Loading shared research...</span>
        </div>
      </div>
    );
  }

  if (error || !idea) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-950 text-white">
        <div className="text-center px-4">
          <div className="text-4xl mb-4">🔍</div>
          <h1 className="text-2xl font-bold mb-2">Research Not Found</h1>
          <p className="text-neutral-400 mb-6">This shared link may have expired or been removed.</p>
          <Link href="/" className="inline-flex items-center gap-2 text-amber-400 hover:text-amber-300 transition-colors">
            ← Go to MarketMind
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <header className="border-b border-neutral-800 px-4 sm:px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold">📊 MarketMind</span>
            <Badge variant="secondary" className="bg-neutral-800 text-neutral-400">Shared Research</Badge>
          </div>
          <Link href="/" className="text-amber-400 hover:text-amber-300 text-sm">
            Try MarketMind →
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <FadeIn>
          <div className="mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">{idea.title}</h1>
            <div className="flex flex-wrap gap-3 items-center">
              <Badge className="bg-amber-500/20 text-amber-300">{idea.category}</Badge>
              {idea.location && <span className="text-sm text-neutral-400">📍 {idea.location}</span>}
              <span className="text-sm text-neutral-500">{new Date(idea.created_at).toLocaleDateString()}</span>
            </div>
            <p className="text-neutral-300 mt-4 leading-relaxed">{idea.summary}</p>
          </div>
        </FadeIn>

        {/* SWOT if available */}
        {idea.swot && (
          <FadeIn delay={0.1}>
            <div className="mb-8">
              <h2 className="text-xl font-bold mb-4">📊 SWOT Analysis</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <Card className="border-green-500/20 bg-green-500/5">
                  <CardContent className="p-4">
                    <h4 className="text-sm font-semibold text-green-400 mb-2">💪 Strengths</h4>
                    {idea.swot.strengths.map((s, i) => <p key={i} className="text-sm text-neutral-300 mb-1">• {s}</p>)}
                  </CardContent>
                </Card>
                <Card className="border-red-500/20 bg-red-500/5">
                  <CardContent className="p-4">
                    <h4 className="text-sm font-semibold text-red-400 mb-2">⚠️ Weaknesses</h4>
                    {idea.swot.weaknesses.map((w, i) => <p key={i} className="text-sm text-neutral-300 mb-1">• {w}</p>)}
                  </CardContent>
                </Card>
                <Card className="border-blue-500/20 bg-blue-500/5">
                  <CardContent className="p-4">
                    <h4 className="text-sm font-semibold text-blue-400 mb-2">🚀 Opportunities</h4>
                    {idea.swot.opportunities.map((o, i) => <p key={i} className="text-sm text-neutral-300 mb-1">• {o}</p>)}
                  </CardContent>
                </Card>
                <Card className="border-yellow-500/20 bg-yellow-500/5">
                  <CardContent className="p-4">
                    <h4 className="text-sm font-semibold text-yellow-400 mb-2">🔥 Threats</h4>
                    {idea.swot.threats.map((t, i) => <p key={i} className="text-sm text-neutral-300 mb-1">• {t}</p>)}
                  </CardContent>
                </Card>
              </div>
              <Card className="border-neutral-800 bg-neutral-900/50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <span className="text-3xl font-bold text-amber-400">{idea.swot.overallScore}/10</span>
                    <div>
                      <span className="text-neutral-400 text-sm">Viability Score</span>
                      <p className="text-neutral-300 text-sm mt-1">{idea.swot.verdict}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </FadeIn>
        )}

        <FadeInStagger className="grid md:grid-cols-2 gap-4">
          {idea.framework?.sections?.map((section) => {
            const research = idea.research?.[section.id];
            const isExpanded = expandedSection === section.id;
            return (
              <FadeInItem key={section.id} className={isExpanded ? 'md:col-span-2' : ''}>
                <Card
                  className={`border-neutral-800 bg-neutral-900/50 ${research ? 'border-l-2 border-l-green-500/50' : ''} cursor-pointer`}
                  onClick={() => research && setExpandedSection(isExpanded ? null : section.id)}
                >
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <span className="text-xl">{section.icon}</span>
                      <span className="flex-1">{section.title}</span>
                      {research?.score && (
                        <Badge className="ml-auto bg-amber-500/20 text-amber-300">{research.score}/10</Badge>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {research ? (
                      <div className="space-y-3">
                        {research.keyInsights?.map((insight, i) => (
                          <p key={i} className="text-sm text-neutral-300">• {insight}</p>
                        ))}
                        {isExpanded ? (
                          <div className="text-sm text-neutral-400 whitespace-pre-wrap">{research.content}</div>
                        ) : (
                          <p className="text-xs text-neutral-500">Click to expand →</p>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-neutral-500">Not yet researched</p>
                    )}
                  </CardContent>
                </Card>
              </FadeInItem>
            );
          })}
        </FadeInStagger>
      </main>

      <footer className="border-t border-neutral-800 py-8 text-center text-sm text-neutral-500 mt-12 px-4">
        Generated by <Link href="/" className="text-amber-400 hover:text-amber-300">MarketMind</Link> — AI-Powered Business Research
      </footer>
    </div>
  );
}
