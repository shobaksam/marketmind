'use client';

import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Loader2, ChevronDown, ChevronUp, Zap, TrendingUp, Shield, AlertTriangle, Target, DollarSign, Clock, Award } from 'lucide-react';

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

interface SwotItem {
  title: string;
  description: string;
}

interface Analysis {
  swot: {
    strengths: SwotItem[];
    weaknesses: SwotItem[];
    opportunities: SwotItem[];
    threats: SwotItem[];
  };
  overallScore: number;
  verdict: 'GO' | 'CAUTION' | 'NO-GO';
  verdictExplanation: string;
  topRecommendations: string[];
  estimatedTimeToRevenue: string;
  estimatedStartupCost: { low: number; high: number };
  competitiveAdvantage: string;
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
  analysis: Analysis | null;
}

export default function IdeaPage() {
  const { status } = useSession();
  const router = useRouter();
  const params = useParams();
  const [idea, setIdea] = useState<Idea | null>(null);
  const [loading, setLoading] = useState(true);
  const [researchingSection, setResearchingSection] = useState<string | null>(null);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [generatingSwot, setGeneratingSwot] = useState(false);

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
          return { ...prev, research: { ...prev.research, [sectionId]: research } };
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

  const handleGenerateSwot = async () => {
    setGeneratingSwot(true);
    try {
      const res = await fetch(`/api/ideas/${params.id}/swot`, { method: 'POST' });
      if (res.ok) {
        const analysis = await res.json();
        setIdea((prev) => prev ? { ...prev, analysis } : prev);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setGeneratingSwot(false);
    }
  };

  if (loading || !idea) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-950">
        <Loader2 className="h-8 w-8 animate-spin text-amber-400" />
      </div>
    );
  }

  const completedSections = Object.keys(idea.research || {}).length;
  const totalSections = idea.framework.sections?.length || 0;
  const allResearched = completedSections >= totalSections && totalSections > 0;

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <header className="border-b border-neutral-800 bg-neutral-950/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-4">
            <button onClick={() => router.push('/dashboard')} className="text-neutral-400 hover:text-white flex items-center gap-1">
              <ArrowLeft className="h-4 w-4" /> Back
            </button>
            <span className="text-lg font-bold">{idea.title}</span>
            <Badge variant="secondary" className="bg-amber-500/20 text-amber-300">{idea.category}</Badge>
          </div>
          <div className="flex items-center gap-2">
            {!allResearched && (
              <Button onClick={handleResearchAll} className="bg-amber-500 hover:bg-amber-600 text-black font-semibold" size="sm">
                <Zap className="h-4 w-4 mr-1" /> Research All
              </Button>
            )}
            {allResearched && !idea.analysis && (
              <Button onClick={handleGenerateSwot} disabled={generatingSwot} className="bg-green-600 hover:bg-green-700" size="sm">
                {generatingSwot ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Award className="h-4 w-4 mr-1" />}
                Generate SWOT Analysis
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Summary Card */}
        <Card className="border-neutral-800 bg-neutral-900/50">
          <CardContent className="pt-6">
            <p className="text-neutral-300 leading-relaxed">{idea.summary}</p>
            <div className="flex flex-wrap gap-4 mt-4 text-sm text-neutral-500">
              {idea.location && <span>📍 {idea.location}</span>}
              <span>📊 {completedSections}/{totalSections} sections researched</span>
              {idea.analysis && <span>✅ SWOT Complete</span>}
            </div>
            <div className="mt-4 h-2 bg-neutral-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all duration-500"
                style={{ width: `${totalSections ? (completedSections / totalSections) * 100 : 0}%` }}
              />
            </div>
          </CardContent>
        </Card>

        {/* SWOT Analysis & Verdict */}
        {idea.analysis && (
          <div className="space-y-6">
            {/* Verdict Banner */}
            <Card className={`border-2 ${
              idea.analysis.verdict === 'GO' ? 'border-green-500/50 bg-green-500/5' :
              idea.analysis.verdict === 'CAUTION' ? 'border-yellow-500/50 bg-yellow-500/5' :
              'border-red-500/50 bg-red-500/5'
            }`}>
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row md:items-center gap-6">
                  <div className="flex items-center gap-4">
                    <div className={`text-5xl font-bold ${
                      idea.analysis.verdict === 'GO' ? 'text-green-400' :
                      idea.analysis.verdict === 'CAUTION' ? 'text-yellow-400' :
                      'text-red-400'
                    }`}>
                      {idea.analysis.overallScore}/10
                    </div>
                    <div>
                      <Badge className={`text-lg px-3 py-1 ${
                        idea.analysis.verdict === 'GO' ? 'bg-green-500/20 text-green-300' :
                        idea.analysis.verdict === 'CAUTION' ? 'bg-yellow-500/20 text-yellow-300' :
                        'bg-red-500/20 text-red-300'
                      }`}>
                        {idea.analysis.verdict}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="text-neutral-300">{idea.analysis.verdictExplanation}</p>
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                  <div className="bg-neutral-800/50 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-xs text-neutral-400 mb-1">
                      <DollarSign className="h-3 w-3" /> Startup Cost
                    </div>
                    <p className="text-sm font-semibold">
                      ${idea.analysis.estimatedStartupCost.low.toLocaleString()} - ${idea.analysis.estimatedStartupCost.high.toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-neutral-800/50 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-xs text-neutral-400 mb-1">
                      <Clock className="h-3 w-3" /> Time to Revenue
                    </div>
                    <p className="text-sm font-semibold">{idea.analysis.estimatedTimeToRevenue}</p>
                  </div>
                  <div className="bg-neutral-800/50 rounded-lg p-4 col-span-2">
                    <div className="flex items-center gap-2 text-xs text-neutral-400 mb-1">
                      <Target className="h-3 w-3" /> Competitive Advantage
                    </div>
                    <p className="text-sm font-semibold">{idea.analysis.competitiveAdvantage}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* SWOT Grid */}
            <div className="grid md:grid-cols-2 gap-4">
              <SwotCard title="Strengths" items={idea.analysis.swot.strengths} icon={<TrendingUp className="h-5 w-5" />} color="green" />
              <SwotCard title="Weaknesses" items={idea.analysis.swot.weaknesses} icon={<AlertTriangle className="h-5 w-5" />} color="red" />
              <SwotCard title="Opportunities" items={idea.analysis.swot.opportunities} icon={<Zap className="h-5 w-5" />} color="blue" />
              <SwotCard title="Threats" items={idea.analysis.swot.threats} icon={<Shield className="h-5 w-5" />} color="orange" />
            </div>

            {/* Top Recommendations */}
            <Card className="border-neutral-800 bg-neutral-900/50">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Target className="h-5 w-5 text-amber-400" /> Top Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {idea.analysis.topRecommendations.map((rec, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <span className="bg-amber-500/20 text-amber-400 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <p className="text-sm text-neutral-300">{rec}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Research Sections Grid */}
        <div>
          <h2 className="text-xl font-bold mb-4">Research Sections</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {idea.framework.sections?.map((section) => {
              const research = idea.research?.[section.id];
              const isExpanded = expandedSection === section.id;
              const isResearching = researchingSection === section.id;

              return (
                <Card
                  key={section.id}
                  className={`border-neutral-800 bg-neutral-900/50 transition-all ${isExpanded ? 'md:col-span-2' : ''} ${research ? 'border-l-2 border-l-green-500/50' : ''}`}
                >
                  <CardHeader
                    className="cursor-pointer"
                    onClick={() => research && setExpandedSection(isExpanded ? null : section.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{section.icon}</span>
                        <div>
                          <CardTitle className="text-base text-white flex items-center gap-2">
                            {section.title}
                            {research && (isExpanded ? <ChevronUp className="h-4 w-4 text-neutral-500" /> : <ChevronDown className="h-4 w-4 text-neutral-500" />)}
                          </CardTitle>
                          <p className="text-sm text-neutral-400 mt-1">{section.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {research?.score && (
                          <Badge className={`${
                            research.score >= 7 ? 'bg-green-500/20 text-green-300' :
                            research.score >= 4 ? 'bg-yellow-500/20 text-yellow-300' :
                            'bg-red-500/20 text-red-300'
                          }`}>
                            {research.score}/10
                          </Badge>
                        )}
                        <Badge variant="outline" className={`text-xs ${
                          section.priority === 'high' ? 'border-red-500/50 text-red-300' :
                          section.priority === 'medium' ? 'border-yellow-500/50 text-yellow-300' :
                          'border-neutral-600 text-neutral-400'
                        }`}>
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
                            <p key={i} className="text-sm text-neutral-500">• {q}</p>
                          ))}
                        </div>
                        <Button onClick={() => handleResearch(section.id)} size="sm" className="bg-amber-500 hover:bg-amber-600 text-black font-semibold">
                          Research This Section
                        </Button>
                      </div>
                    )}

                    {isResearching && (
                      <div className="flex items-center gap-3 py-4">
                        <Loader2 className="h-5 w-5 animate-spin text-amber-500" />
                        <span className="text-sm text-neutral-400">AI is researching this section...</span>
                      </div>
                    )}

                    {research && isExpanded && (
                      <div className="space-y-6 pt-2">
                        {research.keyInsights && research.keyInsights.length > 0 && (
                          <div className="bg-amber-500/5 border border-amber-500/20 rounded-lg p-4">
                            <h4 className="text-sm font-semibold text-amber-300 mb-2">💡 Key Insights</h4>
                            <div className="space-y-1">
                              {research.keyInsights.map((insight, i) => (
                                <p key={i} className="text-sm text-neutral-300">• {insight}</p>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="text-sm text-neutral-300 whitespace-pre-wrap leading-relaxed">
                          {research.content}
                        </div>

                        {research.estimatedCosts && research.estimatedCosts.length > 0 && (
                          <div>
                            <h4 className="text-sm font-semibold text-green-300 mb-2">💰 Estimated Costs</h4>
                            <div className="grid grid-cols-2 gap-2">
                              {research.estimatedCosts.map((cost, i) => (
                                <div key={i} className="bg-neutral-800/50 rounded-lg p-3">
                                  <p className="text-xs text-neutral-400">{cost.item}</p>
                                  <p className="text-sm font-medium">${cost.low.toLocaleString()} - ${cost.high.toLocaleString()}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="grid md:grid-cols-2 gap-4">
                          {research.risks && research.risks.length > 0 && (
                            <div className="bg-red-500/5 border border-red-500/20 rounded-lg p-4">
                              <h4 className="text-sm font-semibold text-red-300 mb-2">⚠️ Risks</h4>
                              {research.risks.map((r, i) => (
                                <p key={i} className="text-sm text-neutral-400">• {r}</p>
                              ))}
                            </div>
                          )}
                          {research.opportunities && research.opportunities.length > 0 && (
                            <div className="bg-green-500/5 border border-green-500/20 rounded-lg p-4">
                              <h4 className="text-sm font-semibold text-green-300 mb-2">🚀 Opportunities</h4>
                              {research.opportunities.map((o, i) => (
                                <p key={i} className="text-sm text-neutral-400">• {o}</p>
                              ))}
                            </div>
                          )}
                        </div>

                        {research.resources && research.resources.length > 0 && (
                          <div>
                            <h4 className="text-sm font-semibold text-purple-300 mb-2">📚 Resources</h4>
                            <div className="space-y-1">
                              {research.resources.map((r, i) => (
                                <a key={i} href={r.url} target="_blank" rel="noopener noreferrer" className="block text-sm text-amber-400 hover:text-amber-300">
                                  {r.type === 'video' ? '🎥' : r.type === 'tool' ? '🔧' : '📄'} {r.title}
                                </a>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {research && !isExpanded && (
                      <p className="text-sm text-neutral-500 cursor-pointer hover:text-neutral-400" onClick={() => setExpandedSection(section.id)}>
                        Click to expand research results →
                      </p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}

function SwotCard({ title, items, icon, color }: {
  title: string;
  items: SwotItem[];
  icon: React.ReactNode;
  color: 'green' | 'red' | 'blue' | 'orange';
}) {
  const colorMap = {
    green: 'border-green-500/30 bg-green-500/5',
    red: 'border-red-500/30 bg-red-500/5',
    blue: 'border-blue-500/30 bg-blue-500/5',
    orange: 'border-orange-500/30 bg-orange-500/5',
  };
  const textColorMap = {
    green: 'text-green-400',
    red: 'text-red-400',
    blue: 'text-blue-400',
    orange: 'text-orange-400',
  };

  return (
    <Card className={`border ${colorMap[color]}`}>
      <CardHeader className="pb-3">
        <CardTitle className={`text-base flex items-center gap-2 ${textColorMap[color]}`}>
          {icon} {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.map((item, i) => (
          <div key={i}>
            <p className="text-sm font-medium text-white">{item.title}</p>
            <p className="text-xs text-neutral-400 mt-0.5">{item.description}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
