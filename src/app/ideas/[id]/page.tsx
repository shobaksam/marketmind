'use client';

import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { IdeaDetailSkeleton } from '@/components/ui/skeleton';
import { FadeIn, FadeInStagger, FadeInItem } from '@/components/animate';
import jsPDF from 'jspdf';

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
  const [error, setError] = useState<string | null>(null);
  const [researchingSection, setResearchingSection] = useState<string | null>(null);
  const [researchingAll, setResearchingAll] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [generatingSwot, setGeneratingSwot] = useState(false);
  const [copied, setCopied] = useState(false);
  const [sectionError, setSectionError] = useState<string | null>(null);

  const fetchIdea = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch(`/api/ideas/${params.id}`);
      if (!res.ok) throw new Error('Failed to load idea');
      const data = await res.json();
      setIdea(data);
    } catch {
      setError('Failed to load idea. Please try again.');
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
    setSectionError(null);
    try {
      const res = await fetch(`/api/ideas/${params.id}/research`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sectionId }),
      });
      if (!res.ok) throw new Error('Research failed');
      const research = await res.json();
      setIdea((prev) => {
        if (!prev) return prev;
        return { ...prev, research: { ...prev.research, [sectionId]: research } };
      });
      setExpandedSection(sectionId);
    } catch {
      setSectionError(sectionId);
    } finally {
      setResearchingSection(null);
    }
  };

  const handleResearchAll = async () => {
    if (!idea) return;
    setResearchingAll(true);
    const unresearched = idea.framework.sections.filter(s => !idea.research?.[s.id]);
    for (const section of unresearched) {
      await handleResearch(section.id);
    }
    setResearchingAll(false);
  };

  const handleGenerateSwot = async () => {
    setGeneratingSwot(true);
    try {
      const res = await fetch(`/api/ideas/${params.id}/swot`, { method: 'POST' });
      if (!res.ok) throw new Error('SWOT failed');
      const swot = await res.json();
      setIdea((prev) => prev ? { ...prev, swot } : prev);
    } catch {
      setSectionError('swot');
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
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      console.error('Share failed');
    }
  };

  const handleExportPDF = () => {
    if (!idea) return;
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    const maxWidth = pageWidth - margin * 2;
    let y = 20;

    const addText = (text: string, size: number, bold = false, color: [number, number, number] = [255, 255, 255]) => {
      doc.setFontSize(size);
      doc.setFont('helvetica', bold ? 'bold' : 'normal');
      doc.setTextColor(...color);
      const lines = doc.splitTextToSize(text, maxWidth);
      for (const line of lines) {
        if (y > 275) { doc.addPage(); y = 20; }
        doc.text(line, margin, y);
        y += size * 0.5;
      }
      y += 4;
    };

    // Background
    doc.setFillColor(10, 10, 10);
    doc.rect(0, 0, pageWidth, doc.internal.pageSize.getHeight(), 'F');

    addText('MARKETMIND RESEARCH REPORT', 20, true, [245, 158, 11]);
    addText(idea.title, 16, true);
    addText(`Category: ${idea.category}${idea.location ? ` | Location: ${idea.location}` : ''}`, 10, false, [150, 150, 150]);
    y += 4;
    addText(idea.summary, 10, false, [200, 200, 200]);
    y += 8;

    for (const section of idea.framework.sections) {
      const research = idea.research?.[section.id];
      if (y > 250) { doc.addPage(); doc.setFillColor(10, 10, 10); doc.rect(0, 0, pageWidth, doc.internal.pageSize.getHeight(), 'F'); y = 20; }
      addText(`${section.icon} ${section.title}`, 14, true, [245, 158, 11]);
      if (research) {
        if (research.keyInsights?.length) {
          addText('Key Insights:', 10, true, [200, 200, 200]);
          research.keyInsights.forEach(i => addText(`• ${i}`, 9, false, [180, 180, 180]));
        }
        if (research.content) {
          addText(research.content.substring(0, 800), 9, false, [170, 170, 170]);
        }
        if (research.score) addText(`Score: ${research.score}/10`, 10, true, [34, 197, 94]);
      } else {
        addText('Not yet researched', 9, false, [100, 100, 100]);
      }
      y += 6;
    }

    if (idea.swot) {
      if (y > 200) { doc.addPage(); doc.setFillColor(10, 10, 10); doc.rect(0, 0, pageWidth, doc.internal.pageSize.getHeight(), 'F'); y = 20; }
      addText('SWOT ANALYSIS', 16, true, [245, 158, 11]);
      addText('Strengths:', 11, true, [34, 197, 94]);
      idea.swot.strengths.forEach(s => addText(`• ${s}`, 9, false, [180, 180, 180]));
      addText('Weaknesses:', 11, true, [239, 68, 68]);
      idea.swot.weaknesses.forEach(w => addText(`• ${w}`, 9, false, [180, 180, 180]));
      addText('Opportunities:', 11, true, [59, 130, 246]);
      idea.swot.opportunities.forEach(o => addText(`• ${o}`, 9, false, [180, 180, 180]));
      addText('Threats:', 11, true, [234, 179, 8]);
      idea.swot.threats.forEach(t => addText(`• ${t}`, 9, false, [180, 180, 180]));
      y += 4;
      addText(`Viability Score: ${idea.swot.overallScore}/10`, 14, true, [245, 158, 11]);
      addText(idea.swot.verdict, 10, false, [200, 200, 200]);
    }

    y += 10;
    addText(`Generated by MarketMind — ${new Date().toLocaleDateString()}`, 8, false, [100, 100, 100]);

    doc.save(`${idea.title || 'research'}-report.pdf`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 text-white">
        <header className="border-b border-neutral-800 bg-neutral-950/80 backdrop-blur sticky top-0 z-50">
          <div className="max-w-7xl mx-auto flex items-center gap-4 px-4 sm:px-6 py-3">
            <div className="h-5 w-16 bg-neutral-800 rounded animate-pulse" />
            <div className="h-5 w-32 bg-neutral-800 rounded animate-pulse" />
          </div>
        </header>
        <IdeaDetailSkeleton />
      </div>
    );
  }

  if (error || !idea) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-950 text-white">
        <div className="text-center">
          <div className="text-4xl mb-4">😵</div>
          <h2 className="text-xl font-bold mb-2">Something went wrong</h2>
          <p className="text-neutral-400 mb-6">{error || 'Failed to load idea.'}</p>
          <div className="flex gap-3 justify-center">
            <Button onClick={fetchIdea} className="bg-amber-500 hover:bg-amber-600 text-black font-semibold">
              🔄 Try Again
            </Button>
            <Button onClick={() => router.push('/dashboard')} variant="outline" className="border-neutral-700">
              ← Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const completedSections = Object.keys(idea.research || {}).length;
  const totalSections = idea.framework.sections?.length || 0;

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <header className="border-b border-neutral-800 bg-neutral-950/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between px-4 sm:px-6 py-3 gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <button onClick={() => router.push('/dashboard')} className="text-neutral-400 hover:text-white transition-colors shrink-0">←</button>
            <span className="text-lg font-bold truncate">{idea.title}</span>
            <Badge variant="secondary" className="bg-amber-500/10 text-amber-400 border-amber-500/20 shrink-0 hidden sm:inline-flex">{idea.category}</Badge>
          </div>
          <div className="flex flex-wrap gap-2">
            {completedSections < totalSections && (
              <Button onClick={handleResearchAll} disabled={researchingAll} className="bg-amber-500 hover:bg-amber-600 text-black font-semibold" size="sm">
                {researchingAll ? '⏳ Researching...' : '🔬 Research All'}
              </Button>
            )}
            {completedSections > 0 && !idea.swot && (
              <Button onClick={handleGenerateSwot} disabled={generatingSwot} variant="outline" size="sm" className="border-neutral-700">
                {generatingSwot ? '⏳ Generating...' : '📊 SWOT'}
              </Button>
            )}
            <Button onClick={handleShare} variant="outline" size="sm" className="border-neutral-700">
              {copied ? '✓ Copied!' : '🔗 Share'}
            </Button>
            {completedSections > 0 && (
              <Button onClick={handleExportPDF} variant="outline" size="sm" className="border-neutral-700">
                📄 PDF
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Summary */}
        <FadeIn>
          <Card className="border-neutral-800 bg-neutral-900/50 mb-8">
            <CardContent className="pt-6">
              <p className="text-neutral-300 leading-relaxed">{idea.summary}</p>
              <div className="flex flex-wrap gap-4 mt-4 text-sm text-neutral-500">
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
        </FadeIn>

        {/* SWOT Analysis */}
        {idea.swot && (
          <FadeIn delay={0.1}>
            <div className="mb-8">
              <h2 className="text-xl font-bold mb-4">📊 SWOT Analysis</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
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
          </FadeIn>
        )}

        {sectionError === 'swot' && (
          <div className="mb-4 p-4 rounded-lg border border-red-500/20 bg-red-500/5 flex items-center justify-between">
            <span className="text-sm text-red-300">Failed to generate SWOT analysis.</span>
            <Button onClick={handleGenerateSwot} size="sm" variant="outline" className="border-red-500/30 text-red-300 hover:bg-red-500/10">
              🔄 Retry
            </Button>
          </div>
        )}

        {/* Research sections grid */}
        <h2 className="text-xl font-bold mb-4">🔬 Research Sections</h2>
        <FadeInStagger className="grid md:grid-cols-2 gap-4">
          {idea.framework.sections?.map((section) => {
            const research = idea.research?.[section.id];
            const isExpanded = expandedSection === section.id;
            const isResearching = researchingSection === section.id;
            const hasError = sectionError === section.id;

            return (
              <FadeInItem
                key={section.id}
                className={isExpanded ? 'md:col-span-2' : ''}
              >
                <Card
                  className={`border-neutral-800 bg-neutral-900/50 transition-all ${research ? 'border-l-2 border-l-green-500/50' : ''}`}
                >
                  <CardHeader className="cursor-pointer" onClick={() => research && setExpandedSection(isExpanded ? null : section.id)}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-2xl shrink-0">{section.icon}</span>
                        <div className="min-w-0">
                          <CardTitle className="text-base text-white truncate">{section.title}</CardTitle>
                          <p className="text-sm text-neutral-400 mt-1 line-clamp-2">{section.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {research?.score && (
                          <Badge className={`${research.score >= 7 ? 'bg-green-500/20 text-green-300' : research.score >= 4 ? 'bg-yellow-500/20 text-yellow-300' : 'bg-red-500/20 text-red-300'}`}>
                            {research.score}/10
                          </Badge>
                        )}
                        <Badge variant="outline" className={`text-xs hidden sm:inline-flex ${section.priority === 'high' ? 'border-red-500/50 text-red-300' : section.priority === 'medium' ? 'border-yellow-500/50 text-yellow-300' : 'border-neutral-600 text-neutral-400'}`}>
                          {section.priority}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent>
                    {hasError && (
                      <div className="mb-4 p-3 rounded-lg border border-red-500/20 bg-red-500/5 flex items-center justify-between">
                        <span className="text-sm text-red-300">AI research failed for this section.</span>
                        <Button onClick={() => { setSectionError(null); handleResearch(section.id); }} size="sm" variant="outline" className="border-red-500/30 text-red-300 hover:bg-red-500/10">
                          🔄 Retry
                        </Button>
                      </div>
                    )}

                    {!research && !isResearching && !hasError && (
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
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {research.estimatedCosts.map((cost, i) => (
                                <div key={i} className="bg-neutral-800/50 rounded-lg p-3">
                                  <p className="text-xs text-neutral-400">{cost.item}</p>
                                  <p className="text-sm font-medium text-white">${cost.low.toLocaleString()} - ${cost.high.toLocaleString()}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                                <a key={i} href={r.url} target="_blank" rel="noopener noreferrer" className="block text-sm text-amber-400 hover:text-amber-300 truncate">
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
              </FadeInItem>
            );
          })}
        </FadeInStagger>
      </main>
    </div>
  );
}
