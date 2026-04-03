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

interface SWOT {
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  threats: string[];
  overallScore: number;
  verdict: string;
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
  swot: SWOT | null;
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
  const [, setShareUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

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
        const swot = await res.json();
        setIdea((prev) => prev ? { ...prev, swot } : prev);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setGeneratingSwot(false);
    }
  };

  const handleShare = async () => {
    try {
      const res = await fetch(`/api/ideas/${params.id}/share`, { method: 'POST' });
      if (res.ok) {
        const { shareId } = await res.json();
        const url = `${window.location.origin}/share/${shareId}`;
        setShareUrl(url);
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleExportPDF = () => {
    // Simple text-based export
    const text = generateReportText(idea!);
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${idea!.title || 'research'}-report.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading || !idea) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-950">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin h-8 w-8 border-2 border-amber-500/30 border-t-amber-500 rounded-full" />
          <span className="text-neutral-400">Loading research...</span>
        </div>
      </div>
    );
  }

  const completedSections = Object.keys(idea.research || {}).length;
  const totalSections = idea.framework.sections?.length || 0;

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <header className="border-b border-neutral-800 bg-neutral-950/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-4">
            <button onClick={() => router.push('/dashboard')} className="text-neutral-400 hover:text-white transition-colors">← Back</button>
            <span className="text-lg font-bold">{idea.title}</span>
            <Badge variant="secondary" className="bg-amber-500/10 text-amber-400 border-amber-500/20">{idea.category}</Badge>
          </div>
          <div className="flex gap-2">
            {completedSections < totalSections && (
              <Button onClick={handleResearchAll} className="bg-amber-500 hover:bg-amber-600 text-black font-semibold" size="sm">
                Research All Sections
              </Button>
            )}
            {completedSections > 0 && !idea.swot && (
              <Button onClick={handleGenerateSwot} disabled={generatingSwot} variant="outline" size="sm" className="border-neutral-700">
                {generatingSwot ? 'Generating...' : '📊 Generate SWOT'}
              </Button>
            )}
            <Button onClick={handleShare} variant="outline" size="sm" className="border-neutral-700">
              {copied ? '✓ Copied!' : '🔗 Share'}
            </Button>
            {completedSections > 0 && (
              <Button onClick={handleExportPDF} variant="outline" size="sm" className="border-neutral-700">
                📄 Export
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Summary */}
        <Card className="border-neutral-800 bg-neutral-900/50 mb-8">
          <CardContent className="pt-6">
            <p className="text-neutral-300 leading-relaxed">{idea.summary}</p>
            <div className="flex gap-4 mt-4 text-sm text-neutral-500">
              {idea.location && <span>📍 {idea.location}</span>}
              <span>📊 {completedSections}/{totalSections} sections researched</span>
            </div>
            <div className="mt-4 h-2 bg-neutral-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all duration-500"
                style={{ width: `${totalSections ? (completedSections / totalSections) * 100 : 0}%` }}
              />
            </div>
          </CardContent>
        </Card>

        {/* SWOT Analysis */}
        {idea.swot && (
          <div className="mb-8">
            <h2 className="text-xl font-bold mb-4">📊 SWOT Analysis</h2>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <Card className="border-green-500/20 bg-green-500/5">
                <CardHeader className="pb-2"><CardTitle className="text-sm text-green-400">💪 Strengths</CardTitle></CardHeader>
                <CardContent className="pt-0">
                  {idea.swot.strengths.map((s, i) => <p key={i} className="text-sm text-neutral-300 mb-1">• {s}</p>)}
                </CardContent>
              </Card>
              <Card className="border-red-500/20 bg-red-500/5">
                <CardHeader className="pb-2"><CardTitle className="text-sm text-red-400">⚠️ Weaknesses</CardTitle></CardHeader>
                <CardContent className="pt-0">
                  {idea.swot.weaknesses.map((w, i) => <p key={i} className="text-sm text-neutral-300 mb-1">• {w}</p>)}
                </CardContent>
              </Card>
              <Card className="border-blue-500/20 bg-blue-500/5">
                <CardHeader className="pb-2"><CardTitle className="text-sm text-blue-400">🚀 Opportunities</CardTitle></CardHeader>
                <CardContent className="pt-0">
                  {idea.swot.opportunities.map((o, i) => <p key={i} className="text-sm text-neutral-300 mb-1">• {o}</p>)}
                </CardContent>
              </Card>
              <Card className="border-yellow-500/20 bg-yellow-500/5">
                <CardHeader className="pb-2"><CardTitle className="text-sm text-yellow-400">🔥 Threats</CardTitle></CardHeader>
                <CardContent className="pt-0">
                  {idea.swot.threats.map((t, i) => <p key={i} className="text-sm text-neutral-300 mb-1">• {t}</p>)}
                </CardContent>
              </Card>
            </div>
            <Card className="border-neutral-800 bg-neutral-900/50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4 mb-3">
                  <span className="text-3xl font-bold text-amber-400">{idea.swot.overallScore}/10</span>
                  <span className="text-neutral-400">Viability Score</span>
                </div>
                <p className="text-neutral-300 text-sm leading-relaxed">{idea.swot.verdict}</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Research sections grid */}
        <h2 className="text-xl font-bold mb-4">🔬 Research Sections</h2>
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
                <CardHeader className="cursor-pointer" onClick={() => research && setExpandedSection(isExpanded ? null : section.id)}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{section.icon}</span>
                      <div>
                        <CardTitle className="text-base text-white">{section.title}</CardTitle>
                        <p className="text-sm text-neutral-400 mt-1">{section.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {research?.score && (
                        <Badge className={`${research.score >= 7 ? 'bg-green-500/20 text-green-300' : research.score >= 4 ? 'bg-yellow-500/20 text-yellow-300' : 'bg-red-500/20 text-red-300'}`}>
                          {research.score}/10
                        </Badge>
                      )}
                      <Badge variant="outline" className={`text-xs ${section.priority === 'high' ? 'border-red-500/50 text-red-300' : section.priority === 'medium' ? 'border-yellow-500/50 text-yellow-300' : 'border-neutral-600 text-neutral-400'}`}>
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
                      <span className="animate-spin h-5 w-5 border-2 border-amber-500/30 border-t-amber-500 rounded-full" />
                      <span className="text-sm text-neutral-400">AI is researching this section...</span>
                    </div>
                  )}

                  {research && isExpanded && (
                    <div className="space-y-6 pt-2">
                      {research.keyInsights && research.keyInsights.length > 0 && (
                        <div>
                          <h4 className="text-sm font-semibold text-amber-300 mb-2">💡 Key Insights</h4>
                          <div className="space-y-1">
                            {research.keyInsights.map((insight, i) => (
                              <p key={i} className="text-sm text-neutral-300">• {insight}</p>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="text-sm text-neutral-300 whitespace-pre-wrap leading-relaxed">{research.content}</div>

                      {research.estimatedCosts && research.estimatedCosts.length > 0 && (
                        <div>
                          <h4 className="text-sm font-semibold text-green-300 mb-2">💰 Estimated Costs</h4>
                          <div className="grid grid-cols-2 gap-2">
                            {research.estimatedCosts.map((cost, i) => (
                              <div key={i} className="bg-neutral-800/50 rounded-lg p-3">
                                <p className="text-xs text-neutral-400">{cost.item}</p>
                                <p className="text-sm font-medium text-white">${cost.low.toLocaleString()} - ${cost.high.toLocaleString()}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="grid md:grid-cols-2 gap-4">
                        {research.risks && research.risks.length > 0 && (
                          <div>
                            <h4 className="text-sm font-semibold text-red-300 mb-2">⚠️ Risks</h4>
                            {research.risks.map((r, i) => <p key={i} className="text-sm text-neutral-400">• {r}</p>)}
                          </div>
                        )}
                        {research.opportunities && research.opportunities.length > 0 && (
                          <div>
                            <h4 className="text-sm font-semibold text-green-300 mb-2">🚀 Opportunities</h4>
                            {research.opportunities.map((o, i) => <p key={i} className="text-sm text-neutral-400">• {o}</p>)}
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
      </main>
    </div>
  );
}

function generateReportText(idea: Idea): string {
  let text = `MARKETMIND RESEARCH REPORT\n${'='.repeat(50)}\n\n`;
  text += `Title: ${idea.title}\n`;
  text += `Category: ${idea.category}\n`;
  if (idea.location) text += `Location: ${idea.location}\n`;
  text += `\nSummary:\n${idea.summary}\n\n`;

  if (idea.framework?.sections) {
    for (const section of idea.framework.sections) {
      const research = idea.research?.[section.id];
      text += `\n${section.icon} ${section.title}\n${'-'.repeat(40)}\n`;
      text += `${section.description}\n`;
      if (research) {
        if (research.keyInsights?.length) {
          text += `\nKey Insights:\n${research.keyInsights.map(i => `  • ${i}`).join('\n')}\n`;
        }
        if (research.content) text += `\n${research.content}\n`;
        if (research.risks?.length) {
          text += `\nRisks:\n${research.risks.map(r => `  ⚠ ${r}`).join('\n')}\n`;
        }
        if (research.opportunities?.length) {
          text += `\nOpportunities:\n${research.opportunities.map(o => `  🚀 ${o}`).join('\n')}\n`;
        }
        if (research.score) text += `\nScore: ${research.score}/10\n`;
      }
    }
  }

  text += `\n\nGenerated by MarketMind - ${new Date().toLocaleDateString()}\n`;
  return text;
}

// types defined above
