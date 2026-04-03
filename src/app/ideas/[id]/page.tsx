'use client';

import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Section {
  id: string;
  title: string;
  icon: string;
  description: string;
  questions: string[];
  priority: string;
}

interface Research {
  sectionId: string;
  content: string;
  keyInsights?: string[];
  estimatedCosts?: { item: string; low: number; high: number }[];
  risks?: string[];
  opportunities?: string[];
  resources?: { title: string; url: string; type: string }[];
  score?: number;
}

interface Idea {
  id: string;
  title: string;
  summary: string;
  category: string;
  idea_text: string;
  location: string;
  framework: { sections: Section[] };
  research: Record<string, Research>;
}

export default function IdeaPage() {
  const { status } = useSession();
  const router = useRouter();
  const params = useParams();
  const [idea, setIdea] = useState<Idea | null>(null);
  const [loading, setLoading] = useState(true);
  const [researchingSection, setResearchingSection] = useState<string | null>(null);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const fetchIdea = useCallback(async () => {
    try {
      const res = await fetch(`/api/ideas/${params.id}`);
      if (res.ok) {
        const data = await res.json();
        setIdea(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
    if (status === 'authenticated') fetchIdea();
  }, [status, router, fetchIdea]);

  const handleResearch = async (sectionId: string) => {
    setResearchingSection(sectionId);
    try {
      const res = await fetch(`/api/ideas/${params.id}/research`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sectionId }),
      });
      if (res.ok) {
        const research = await res.json();
        setIdea((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            research: { ...prev.research, [sectionId]: research },
          };
        });
        setExpandedSection(sectionId);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setResearchingSection(null);
    }
  };

  const handleResearchAll = async () => {
    if (!idea) return;
    for (const section of idea.framework.sections) {
      if (!idea.research?.[section.id]) {
        await handleResearch(section.id);
      }
    }
  };

  if (loading || !idea) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="animate-pulse text-white">Loading research...</div>
      </div>
    );
  }

  const completedSections = Object.keys(idea.research || {}).length;
  const totalSections = idea.framework.sections?.length || 0;

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-4">
            <button onClick={() => router.push('/dashboard')} className="text-slate-400 hover:text-white">← Back</button>
            <span className="text-lg font-bold">{idea.title}</span>
            <Badge variant="secondary" className="bg-indigo-500/20 text-indigo-300">{idea.category}</Badge>
          </div>
          {completedSections < totalSections && (
            <Button onClick={handleResearchAll} className="bg-indigo-600 hover:bg-indigo-700">
              Research All Sections
            </Button>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Summary */}
        <Card className="border-slate-800 bg-slate-900/50 mb-8">
          <CardContent className="pt-6">
            <p className="text-slate-300 leading-relaxed">{idea.summary}</p>
            <div className="flex gap-4 mt-4 text-sm text-slate-500">
              {idea.location && <span>📍 {idea.location}</span>}
              <span>📊 {completedSections}/{totalSections} sections researched</span>
            </div>
            {/* Progress bar */}
            <div className="mt-4 h-2 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500"
                style={{ width: `${totalSections ? (completedSections / totalSections) * 100 : 0}%` }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Research sections grid */}
        <div className="grid md:grid-cols-2 gap-4">
          {idea.framework.sections?.map((section) => {
            const research = idea.research?.[section.id];
            const isExpanded = expandedSection === section.id;
            const isResearching = researchingSection === section.id;

            return (
              <Card
                key={section.id}
                className={`border-slate-800 bg-slate-900/50 transition-all ${isExpanded ? 'md:col-span-2' : ''} ${research ? 'border-l-2 border-l-green-500/50' : ''}`}
              >
                <CardHeader className="cursor-pointer" onClick={() => research && setExpandedSection(isExpanded ? null : section.id)}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{section.icon}</span>
                      <div>
                        <CardTitle className="text-base text-white">{section.title}</CardTitle>
                        <p className="text-sm text-slate-400 mt-1">{section.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {research?.score && (
                        <Badge className={`${research.score >= 7 ? 'bg-green-500/20 text-green-300' : research.score >= 4 ? 'bg-yellow-500/20 text-yellow-300' : 'bg-red-500/20 text-red-300'}`}>
                          {research.score}/10
                        </Badge>
                      )}
                      <Badge variant="outline" className={`text-xs ${section.priority === 'high' ? 'border-red-500/50 text-red-300' : section.priority === 'medium' ? 'border-yellow-500/50 text-yellow-300' : 'border-slate-600 text-slate-400'}`}>
                        {section.priority}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>

                <CardContent>
                  {!research && !isResearching && (
                    <div>
                      <div className="space-y-1 mb-4">
                        {section.questions.map((q, i) => (
                          <p key={i} className="text-sm text-slate-500">• {q}</p>
                        ))}
                      </div>
                      <Button onClick={() => handleResearch(section.id)} size="sm" className="bg-indigo-600 hover:bg-indigo-700">
                        Research This Section
                      </Button>
                    </div>
                  )}

                  {isResearching && (
                    <div className="flex items-center gap-3 py-4">
                      <span className="animate-spin h-5 w-5 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full" />
                      <span className="text-sm text-slate-400">AI is researching this section...</span>
                    </div>
                  )}

                  {research && isExpanded && (
                    <div className="space-y-6 pt-2">
                      {/* Key Insights */}
                      {research.keyInsights && research.keyInsights.length > 0 && (
                        <div>
                          <h4 className="text-sm font-semibold text-indigo-300 mb-2">💡 Key Insights</h4>
                          <div className="space-y-1">
                            {research.keyInsights.map((insight, i) => (
                              <p key={i} className="text-sm text-slate-300">• {insight}</p>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Content */}
                      <div className="prose prose-invert prose-sm max-w-none">
                        <div className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">{research.content}</div>
                      </div>

                      {/* Costs */}
                      {research.estimatedCosts && research.estimatedCosts.length > 0 && (
                        <div>
                          <h4 className="text-sm font-semibold text-green-300 mb-2">💰 Estimated Costs</h4>
                          <div className="grid grid-cols-2 gap-2">
                            {research.estimatedCosts.map((cost, i) => (
                              <div key={i} className="bg-slate-800/50 rounded-lg p-3">
                                <p className="text-xs text-slate-400">{cost.item}</p>
                                <p className="text-sm font-medium text-white">${cost.low.toLocaleString()} - ${cost.high.toLocaleString()}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Risks & Opportunities */}
                      <div className="grid md:grid-cols-2 gap-4">
                        {research.risks && research.risks.length > 0 && (
                          <div>
                            <h4 className="text-sm font-semibold text-red-300 mb-2">⚠️ Risks</h4>
                            {research.risks.map((r, i) => (
                              <p key={i} className="text-sm text-slate-400">• {r}</p>
                            ))}
                          </div>
                        )}
                        {research.opportunities && research.opportunities.length > 0 && (
                          <div>
                            <h4 className="text-sm font-semibold text-green-300 mb-2">🚀 Opportunities</h4>
                            {research.opportunities.map((o, i) => (
                              <p key={i} className="text-sm text-slate-400">• {o}</p>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Resources */}
                      {research.resources && research.resources.length > 0 && (
                        <div>
                          <h4 className="text-sm font-semibold text-purple-300 mb-2">📚 Resources</h4>
                          <div className="space-y-1">
                            {research.resources.map((r, i) => (
                              <a key={i} href={r.url} target="_blank" rel="noopener noreferrer" className="block text-sm text-indigo-400 hover:text-indigo-300">
                                {r.type === 'video' ? '🎥' : r.type === 'tool' ? '🔧' : '📄'} {r.title}
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {research && !isExpanded && (
                    <p className="text-sm text-slate-500 cursor-pointer" onClick={() => setExpandedSection(section.id)}>
                      Click to expand research results →
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </main>
    </div>
  );
}
