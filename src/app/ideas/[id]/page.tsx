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
import { ResearchDashboard } from '@/components/research-dashboard';
import { FinancialProjections } from '@/components/financial-projections';
import { CompetitorAnalysis } from '@/components/competitor-analysis';
import { ScoreBreakdown } from '@/components/score-breakdown';
import { ChatAssistant } from '@/components/chat-assistant';
import { ChevronDown, ChevronUp } from 'lucide-react';

const LOADING_MESSAGES = [
  '🔍 Analyzing market data...',
  '📊 Crunching the numbers...',
  '🏢 Scouting competitors...',
  '💡 Finding opportunities...',
  '📋 Preparing your report...',
];

function ResearchLoader() {
  const [msgIndex, setMsgIndex] = useState(0);
  const [fade, setFade] = useState(true);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const msgInterval = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setMsgIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
        setFade(true);
      }, 300);
    }, 3000);
    const progInterval = setInterval(() => {
      setProgress((prev) => Math.min(prev + Math.random() * 8 + 2, 92));
    }, 500);
    return () => { clearInterval(msgInterval); clearInterval(progInterval); };
  }, []);

  return (
    <div className="py-6 space-y-4">
      <div className="flex items-center gap-3">
        <span className="animate-spin h-5 w-5 border-2 border-amber-500/30 border-t-amber-500 rounded-full" />
        <span
          className={`text-sm text-amber-300 font-medium transition-opacity duration-300 ${fade ? 'opacity-100' : 'opacity-0'}`}
        >
          {LOADING_MESSAGES[msgIndex]}
        </span>
      </div>
      <div className="h-2 bg-neutral-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="grid grid-cols-3 gap-2">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-16 bg-neutral-800/40 rounded-lg animate-pulse" style={{ animationDelay: `${i * 200}ms` }} />
        ))}
      </div>
    </div>
  );
}

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
  researchedAt?: string;
  content?: string;
  keyTakeaway?: string;
  keyInsights?: string[];
  stats?: { label: string; value: string; icon: string; trend?: string }[];
  insights?: { text: string; type: string; importance: string }[];
  estimatedCosts?: { item: string; low: number; high: number }[];
  costBreakdown?: { item: string; low: number; high: number }[];
  marketSegments?: { name: string; value: number }[];
  competitors?: { name: string; price: string; rating: number; strengths?: string }[];
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
  executive_summary: { executiveSummary: string; verdict: string; topStrengths: string[]; topRisks: string[]; nextSteps: string[] } | null;
  notes: Record<string, string> | null;
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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [journeyMode, setJourneyMode] = useState(false); // collapsed-first layout; users opt into Guided Mode
  const [depthOpen, setDepthOpen] = useState<null | 'swot' | 'projections' | 'plan' | 'competitors'>(null);
  const [showHeroWhy, setShowHeroWhy] = useState(false);
  const [executiveSummary, setExecutiveSummary] = useState<{ executiveSummary: string; verdict: string; topStrengths: string[]; topRisks: string[]; nextSteps: string[] } | null>(null);
  const [generatingSummary, setGeneratingSummary] = useState(false);
  const [notes, setNotes] = useState<Record<string, string>>({});
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [projections, setProjections] = useState<any>(null);
  const [generatingProjections, setGeneratingProjections] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [competitorData, setCompetitorData] = useState<any>(null);
  const [generatingCompetitors, setGeneratingCompetitors] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [actionPlan, setActionPlan] = useState<any>(null);
  const [generatingPlan, setGeneratingPlan] = useState(false);

  const fetchIdea = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch(`/api/ideas/${params.id}`);
      if (!res.ok) throw new Error('Failed to load idea');
      const data = await res.json();
      setIdea(data);
      if (data.executive_summary) setExecutiveSummary(data.executive_summary);
      if (data.notes) setNotes(data.notes);
      if (data.projections) setProjections(data.projections);
      if (data.competitor_analysis) setCompetitorData(data.competitor_analysis);
      if (data.action_plan) setActionPlan(data.action_plan);
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
      // Keep sections collapsed by default — user taps the card to expand
      if (journeyMode) {
        setExpandedSection(sectionId);
        setTimeout(() => {
          document.getElementById(`section-${sectionId}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 300);
      }
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

  const handleGeneratePlan = async () => {
    setGeneratingPlan(true);
    try {
      const res = await fetch(`/api/ideas/${params.id}/actionplan`, { method: 'POST' });
      if (res.ok) setActionPlan(await res.json());
    } catch { /* ignore */ } finally {
      setGeneratingPlan(false);
    }
  };

  const handleGenerateCompetitors = async () => {
    setGeneratingCompetitors(true);
    try {
      const res = await fetch(`/api/ideas/${params.id}/competitors`, { method: 'POST' });
      if (res.ok) setCompetitorData(await res.json());
    } catch { /* ignore */ } finally {
      setGeneratingCompetitors(false);
    }
  };

  const handleGenerateProjections = async () => {
    setGeneratingProjections(true);
    try {
      const res = await fetch(`/api/ideas/${params.id}/projections`, { method: 'POST' });
      if (res.ok) setProjections(await res.json());
    } catch { /* ignore */ } finally {
      setGeneratingProjections(false);
    }
  };

  const handleGenerateSummary = async () => {
    setGeneratingSummary(true);
    try {
      const res = await fetch(`/api/ideas/${params.id}/summary`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setExecutiveSummary(data);
      }
    } catch { /* ignore */ } finally {
      setGeneratingSummary(false);
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

  const handleExportMarkdown = () => {
    if (!idea) return;
    let md = `# ${idea.title}\n\n`;
    md += `**Category:** ${idea.category} | **Location:** ${idea.location || 'N/A'}\n\n`;
    md += `## Summary\n${idea.summary}\n\n`;
    
    if (executiveSummary) {
      md += `## Executive Summary\n${executiveSummary.executiveSummary}\n\n`;
      md += `**Verdict:** ${executiveSummary.verdict}\n\n`;
    }

    for (const section of idea.framework.sections) {
      const research = idea.research?.[section.id];
      md += `## ${section.icon} ${section.title}\n`;
      if (research) {
        if (research.keyTakeaway) md += `> ${research.keyTakeaway}\n\n`;
        if (research.score) md += `**Score:** ${research.score}/10\n\n`;
        if (research.stats?.length) {
          research.stats.forEach((s: { icon: string; label: string; value: string }) => {
            md += `- ${s.icon} **${s.label}:** ${s.value}\n`;
          });
          md += '\n';
        }
        if (research.keyInsights?.length) {
          research.keyInsights.forEach(i => { md += `- ${i}\n`; });
          md += '\n';
        }
      } else {
        md += '*Not yet researched*\n\n';
      }
    }

    if (idea.swot) {
      md += `## SWOT Analysis\n`;
      md += `**Score:** ${idea.swot.overallScore}/10\n\n`;
      md += `### Strengths\n${idea.swot.strengths.map(s => `- ${s}`).join('\n')}\n\n`;
      md += `### Weaknesses\n${idea.swot.weaknesses.map(w => `- ${w}`).join('\n')}\n\n`;
      md += `### Opportunities\n${idea.swot.opportunities.map(o => `- ${o}`).join('\n')}\n\n`;
      md += `### Threats\n${idea.swot.threats.map(t => `- ${t}`).join('\n')}\n\n`;
    }

    md += `\n---\n*Generated by MarketMind — ${new Date().toLocaleDateString()}*\n`;

    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${idea.title || 'research'}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportPDF = () => {
    if (!idea) return;
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    const maxWidth = pageWidth - margin * 2;
    let y = 20;

    const addPage = () => {
      doc.addPage();
      doc.setFillColor(10, 10, 10);
      doc.rect(0, 0, pageWidth, doc.internal.pageSize.getHeight(), 'F');
      y = 20;
    };

    const addText = (text: string, size: number, bold = false, color: [number, number, number] = [255, 255, 255]) => {
      doc.setFontSize(size);
      doc.setFont('helvetica', bold ? 'bold' : 'normal');
      doc.setTextColor(...color);
      const lines = doc.splitTextToSize(text, maxWidth);
      for (const line of lines) {
        if (y > 275) { addPage(); }
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
      if (y > 250) { addPage(); }
      addText(`${section.icon} ${section.title}`, 14, true, [245, 158, 11]);
      if (research) {
        if (research.keyTakeaway) {
          addText(research.keyTakeaway, 10, true, [200, 200, 200]);
        }
        if (research.score) addText(`Score: ${research.score}/10`, 10, true, [34, 197, 94]);
        if (research.stats?.length) {
          addText('Key Stats:', 10, true, [200, 200, 200]);
          research.stats.forEach((s: { icon: string; label: string; value: string }) => addText(`${s.icon} ${s.label}: ${s.value}`, 9, false, [180, 180, 180]));
        }
        if (research.insights?.length) {
          addText('Insights:', 10, true, [200, 200, 200]);
          research.insights.forEach((i: { text: string }) => addText(`• ${i.text}`, 9, false, [180, 180, 180]));
        }
        if (research.keyInsights?.length) {
          research.keyInsights.forEach(i => addText(`• ${i}`, 9, false, [180, 180, 180]));
        }
        if (research.costBreakdown?.length || research.estimatedCosts?.length) {
          const costs = research.costBreakdown || research.estimatedCosts || [];
          addText('Cost Estimates:', 10, true, [200, 200, 200]);
          costs.forEach((c: { item: string; low: number; high: number }) => addText(`• ${c.item}: $${c.low.toLocaleString()} - $${c.high.toLocaleString()}`, 9, false, [180, 180, 180]));
        }
        if (research.competitors?.length) {
          addText('Competitors:', 10, true, [200, 200, 200]);
          research.competitors.forEach((c: { name: string; price: string; rating: number }) => addText(`• ${c.name} — ${c.price} (${c.rating}★)`, 9, false, [180, 180, 180]));
        }
        if (research.content && !research.stats?.length) {
          addText(research.content.substring(0, 800), 9, false, [170, 170, 170]);
        }
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
  const progressPct = totalSections ? Math.round((completedSections / totalSections) * 100) : 0;

  // V8 Journey: find first unresearched section
  const firstUnresearchedIdx = idea.framework.sections?.findIndex(s => !idea.research?.[s.id]) ?? -1;

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <header className="border-b border-neutral-800 bg-neutral-950/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div className="flex items-center gap-3 min-w-0">
              <button onClick={() => router.push('/dashboard')} className="text-neutral-400 hover:text-white transition-colors shrink-0 text-lg">←</button>
              <span className="text-lg font-bold truncate">{idea.title}</span>
              <Badge variant="secondary" className="bg-amber-500/10 text-amber-400 border-amber-500/20 shrink-0 hidden sm:inline-flex">{idea.category}</Badge>
            </div>
            <div className="flex flex-wrap gap-2">
              {completedSections < totalSections && (
                <Button onClick={handleResearchAll} disabled={researchingAll} className="bg-amber-500 hover:bg-amber-600 text-black font-semibold text-base px-5 py-2" size="lg">
                  {researchingAll ? '⏳ Researching...' : '🔬 Research All Sections'}
                </Button>
              )}
              {completedSections > 0 && !idea.swot && (
                <Button onClick={handleGenerateSwot} disabled={generatingSwot} variant="outline" size="lg" className="border-neutral-700 text-base px-5">
                  {generatingSwot ? '⏳ Generating...' : '📊 Get SWOT Analysis'}
                </Button>
              )}
              <Button onClick={handleShare} variant="outline" size="lg" className="border-neutral-700 text-base px-5">
                {copied ? '✓ Link Copied!' : '🔗 Share'}
              </Button>
              {completedSections > 0 && (
                <>
                  <Button onClick={handleExportPDF} variant="outline" size="lg" className="border-neutral-700 text-base px-5">
                    📄 PDF
                  </Button>
                  <Button onClick={handleExportMarkdown} variant="outline" size="lg" className="border-neutral-700 text-base px-5">
                    📝 Markdown
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* V8: Progress Stepper */}
          <div className="mt-3 flex items-center gap-1 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            {idea.framework.sections?.map((section, idx) => {
              const done = !!(idea.research && idea.research[section.id]);
              const isCurrent = idx === firstUnresearchedIdx;
              const isActive = researchingSection === section.id;
              return (
                <button
                  key={section.id}
                  onClick={() => {
                    document.getElementById(`section-${section.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    if (done) setExpandedSection(expandedSection === section.id ? null : section.id);
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap ${
                    done ? 'bg-green-500/15 text-green-400 border border-green-500/30' :
                    isActive ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30 animate-pulse' :
                    isCurrent ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20' :
                    'bg-neutral-800/50 text-neutral-500 border border-neutral-700/50'
                  }`}
                  title={section.title}
                >
                  <span>{section.icon}</span>
                  <span className="hidden lg:inline">{section.title}</span>
                  {done && <span>✓</span>}
                  {isActive && <span className="animate-spin h-3 w-3 border border-amber-500/30 border-t-amber-500 rounded-full" />}
                </button>
              );
            })}
            {idea.swot && (
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-green-500/15 text-green-400 border border-green-500/30">
                📊 SWOT ✓
              </span>
            )}
          </div>

          {/* Progress bar */}
          <div className="mt-2 flex items-center gap-3">
            <div className="flex-1 h-2 bg-neutral-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all duration-500"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <span className="text-xs text-neutral-400 shrink-0">{completedSections}/{totalSections} done</span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Hero Verdict — punchline-first */}
        <FadeIn>
          {(() => {
            const vKey = executiveSummary?.verdict;
            const tone = vKey === 'GO'
              ? { label: 'Go for it', sub: 'Clear edge', bg: 'bg-emerald-500/10', text: 'text-emerald-300', ring: 'ring-emerald-500/30', dot: 'bg-emerald-400' }
              : vKey === 'CAUTION'
              ? { label: 'Has potential', sub: 'Needs a sharper angle', bg: 'bg-amber-500/10', text: 'text-amber-300', ring: 'ring-amber-500/30', dot: 'bg-amber-400' }
              : vKey === 'NO-GO'
              ? { label: 'Skip it', sub: 'Try something else', bg: 'bg-red-500/10', text: 'text-red-300', ring: 'ring-red-500/30', dot: 'bg-red-400' }
              : { label: 'In progress', sub: 'Research to unlock the verdict', bg: 'bg-neutral-800/50', text: 'text-neutral-300', ring: 'ring-neutral-700', dot: 'bg-neutral-500' };
            const punchline = executiveSummary
              ? (executiveSummary.executiveSummary?.split('\n').find(l => l.trim())?.trim().split(/[.!?]/)[0] || idea.summary)
              : idea.summary;
            const rest = executiveSummary?.executiveSummary?.replace(punchline, '').trim();
            return (
              <div className={`mb-8 rounded-2xl p-6 sm:p-8 ring-1 ${tone.ring} ${tone.bg}`}>
                <div className="flex items-start justify-between gap-4 mb-4 flex-wrap">
                  <div className="flex flex-col">
                    <div className={`inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest px-2.5 py-1 rounded-md ${tone.bg} ${tone.text} w-fit`}>
                      <span className={`inline-block h-1.5 w-1.5 rounded-full ${tone.dot}`} />
                      {tone.label}
                    </div>
                    <span className="text-[10px] text-neutral-500 mt-1 px-1">{tone.sub}</span>
                  </div>
                  {!executiveSummary && completedSections >= 2 && (
                    <Button
                      onClick={handleGenerateSummary}
                      disabled={generatingSummary}
                      size="sm"
                      className="bg-amber-500 hover:bg-amber-600 text-black font-semibold text-xs"
                    >
                      {generatingSummary ? '⏳ Thinking…' : 'Get the verdict →'}
                    </Button>
                  )}
                </div>
                <div className="text-xl sm:text-2xl md:text-3xl font-semibold leading-snug tracking-tight text-white">
                  {punchline}
                </div>
                {executiveSummary && (rest || (executiveSummary.topStrengths?.length || executiveSummary.topRisks?.length || executiveSummary.nextSteps?.length)) && (
                  showHeroWhy ? (
                    <div className="mt-4 space-y-4">
                      {rest && <p className="text-sm text-neutral-400 leading-relaxed whitespace-pre-line">{rest}</p>}
                      <div className="grid sm:grid-cols-3 gap-3">
                        {executiveSummary.topStrengths?.length ? (
                          <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-lg p-3">
                            <h4 className="text-[10px] font-semibold text-emerald-400 uppercase tracking-widest mb-2">Strengths</h4>
                            {executiveSummary.topStrengths.map((s, i) => (
                              <p key={i} className="text-xs text-neutral-300 mb-1">• {s}</p>
                            ))}
                          </div>
                        ) : null}
                        {executiveSummary.topRisks?.length ? (
                          <div className="bg-red-500/5 border border-red-500/20 rounded-lg p-3">
                            <h4 className="text-[10px] font-semibold text-red-400 uppercase tracking-widest mb-2">Risks</h4>
                            {executiveSummary.topRisks.map((r, i) => (
                              <p key={i} className="text-xs text-neutral-300 mb-1">• {r}</p>
                            ))}
                          </div>
                        ) : null}
                        {executiveSummary.nextSteps?.length ? (
                          <div className="bg-amber-500/5 border border-amber-500/20 rounded-lg p-3">
                            <h4 className="text-[10px] font-semibold text-amber-400 uppercase tracking-widest mb-2">Next</h4>
                            {executiveSummary.nextSteps.map((s, i) => (
                              <p key={i} className="text-xs text-neutral-300 mb-1">{i + 1}. {s}</p>
                            ))}
                          </div>
                        ) : null}
                      </div>
                      <button onClick={() => setShowHeroWhy(false)} className="text-xs text-neutral-500 hover:text-neutral-300 transition-colors">
                        show less
                      </button>
                    </div>
                  ) : (
                    <button onClick={() => setShowHeroWhy(true)} className="mt-3 text-xs text-neutral-500 hover:text-neutral-300 transition-colors">
                      why?
                    </button>
                  )
                )}
                {!executiveSummary && (
                  <p className="mt-3 text-xs text-neutral-500">
                    {completedSections < 2
                      ? 'Research at least 2 sections and we\'ll give you a one-line verdict.'
                      : 'Tap "Get the verdict" above to see the bottom line.'}
                  </p>
                )}
                <div className="flex flex-wrap gap-4 mt-5 text-xs text-neutral-500">
                  {idea.location && <span className="flex items-center gap-1">📍 {idea.location}</span>}
                  <span>📊 {progressPct}% complete</span>
                  {idea.swot && <span>🎯 Viability {idea.swot.overallScore}/10</span>}
                </div>
              </div>
            );
          })()}
        </FadeIn>

        {/* V23: Score Breakdown */}
        {completedSections >= 3 && (() => {
          const sections = idea.framework.sections
            ?.filter(s => idea.research?.[s.id]?.score)
            .map(s => ({ title: s.title, icon: s.icon, score: idea.research[s.id].score || 0 })) || [];
          if (sections.length < 2) return null;
          const avgScore = sections.reduce((sum, s) => sum + s.score, 0) / sections.length;
          return (
            <FadeIn delay={0.08}>
              <div className="mb-8">
                <h2 className="text-xl font-bold mb-4">⭐ Idea Scoring</h2>
                <ScoreBreakdown data={{ sections, avgScore }} />
              </div>
            </FadeIn>
          );
        })()}

        {/* More depth section header */}
        {(idea.swot || projections || actionPlan || competitorData) && (
          <div className="mb-4 mt-10">
            <h2 className="text-xl font-bold">📚 More depth</h2>
            <p className="text-xs text-neutral-500 mt-1">Tap to expand each section.</p>
          </div>
        )}

        {/* SWOT Analysis - collapsible */}
        {idea.swot && (
          <FadeIn delay={0.1}>
            <div className="mb-3 rounded-xl border border-neutral-800 bg-neutral-900/40 overflow-hidden">
              <button onClick={() => setDepthOpen(depthOpen === 'swot' ? null : 'swot')} className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-neutral-900/70 transition-colors">
                <span className="flex items-center gap-3">
                  <span className="text-lg">📊</span>
                  <span className="font-semibold text-white">SWOT Analysis</span>
                  <Badge className={`text-xs ${
                    idea.swot.overallScore >= 7 ? 'bg-green-500/20 text-green-300' :
                    idea.swot.overallScore >= 4 ? 'bg-amber-500/20 text-amber-300' :
                    'bg-red-500/20 text-red-300'
                  }`}>
                    {idea.swot.overallScore}/10
                  </Badge>
                </span>
                {depthOpen === 'swot' ? <ChevronUp className="h-4 w-4 text-neutral-500" /> : <ChevronDown className="h-4 w-4 text-neutral-500" />}
              </button>
              {depthOpen === 'swot' && (
            <div className="px-5 pb-5">
              <div className="rounded-xl border border-neutral-800 overflow-hidden mb-4">
                {/* Header row labels */}
                <div className="grid grid-cols-2">
                  <div className="text-center text-xs font-semibold text-neutral-500 py-2 border-b border-neutral-800 bg-neutral-900/30">INTERNAL</div>
                  <div className="text-center text-xs font-semibold text-neutral-500 py-2 border-b border-neutral-800 bg-neutral-900/30">EXTERNAL</div>
                </div>
                <div className="grid grid-cols-2">
                  {/* Strengths - top left */}
                  <div className="p-5 bg-green-500/5 border-r border-b border-neutral-800 relative">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-500 to-green-400" />
                    <h4 className="text-sm font-bold text-green-400 mb-3 flex items-center gap-2">💪 Strengths</h4>
                    <ul className="space-y-2">
                      {idea.swot.strengths.map((s, i) => (
                        <li key={i} className="text-sm text-neutral-300 flex items-start gap-2">
                          <span className="text-green-500 mt-0.5 shrink-0">✓</span>{s}
                        </li>
                      ))}
                    </ul>
                  </div>
                  {/* Opportunities - top right */}
                  <div className="p-5 bg-blue-500/5 border-b border-neutral-800 relative">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-blue-400" />
                    <h4 className="text-sm font-bold text-blue-400 mb-3 flex items-center gap-2">🚀 Opportunities</h4>
                    <ul className="space-y-2">
                      {idea.swot.opportunities.map((o, i) => (
                        <li key={i} className="text-sm text-neutral-300 flex items-start gap-2">
                          <span className="text-blue-500 mt-0.5 shrink-0">→</span>{o}
                        </li>
                      ))}
                    </ul>
                  </div>
                  {/* Weaknesses - bottom left */}
                  <div className="p-5 bg-red-500/5 border-r border-neutral-800 relative">
                    <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 to-red-400" />
                    <h4 className="text-sm font-bold text-red-400 mb-3 flex items-center gap-2">⚠️ Weaknesses</h4>
                    <ul className="space-y-2">
                      {idea.swot.weaknesses.map((w, i) => (
                        <li key={i} className="text-sm text-neutral-300 flex items-start gap-2">
                          <span className="text-red-500 mt-0.5 shrink-0">✗</span>{w}
                        </li>
                      ))}
                    </ul>
                  </div>
                  {/* Threats - bottom right */}
                  <div className="p-5 bg-yellow-500/5 relative">
                    <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-500 to-yellow-400" />
                    <h4 className="text-sm font-bold text-yellow-400 mb-3 flex items-center gap-2">🔥 Threats</h4>
                    <ul className="space-y-2">
                      {idea.swot.threats.map((t, i) => (
                        <li key={i} className="text-sm text-neutral-300 flex items-start gap-2">
                          <span className="text-yellow-500 mt-0.5 shrink-0">!</span>{t}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
              {/* Viability Score */}
              <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-6 flex items-center gap-6">
                <div className="relative">
                  <div className={`w-20 h-20 rounded-full border-4 flex items-center justify-center ${
                    idea.swot.overallScore >= 7 ? 'border-green-500 bg-green-500/10' :
                    idea.swot.overallScore >= 4 ? 'border-amber-500 bg-amber-500/10' :
                    'border-red-500 bg-red-500/10'
                  }`}>
                    <span className="text-2xl font-bold text-white">{idea.swot.overallScore}</span>
                    <span className="text-sm text-neutral-400">/10</span>
                  </div>
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-neutral-400 uppercase tracking-wider mb-1">Viability Score</h4>
                  <p className="text-neutral-300 text-sm leading-relaxed">{idea.swot.verdict}</p>
                </div>
              </div>
            </div>
              )}
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

        {/* V17: Financial Projections — collapsible */}
        {projections ? (
          <FadeIn delay={0.15}>
            <div className="mb-3 rounded-xl border border-neutral-800 bg-neutral-900/40 overflow-hidden">
              <button onClick={() => setDepthOpen(depthOpen === 'projections' ? null : 'projections')} className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-neutral-900/70 transition-colors">
                <span className="flex items-center gap-3">
                  <span className="text-lg">💰</span>
                  <span className="font-semibold text-white">Financial Projections</span>
                </span>
                {depthOpen === 'projections' ? <ChevronUp className="h-4 w-4 text-neutral-500" /> : <ChevronDown className="h-4 w-4 text-neutral-500" />}
              </button>
              {depthOpen === 'projections' && (
                <div className="px-5 pb-5">
                  <FinancialProjections data={projections} />
                </div>
              )}
            </div>
          </FadeIn>
        ) : completedSections >= 2 && (
          <FadeIn delay={0.15}>
            <div className="mb-3 rounded-xl border border-dashed border-neutral-800 bg-neutral-900/20 px-5 py-4 flex items-center justify-between gap-3">
              <span className="flex items-center gap-3 text-sm text-neutral-400">
                <span className="text-lg">💰</span>
                <span>Financial Projections</span>
              </span>
              <Button
                onClick={handleGenerateProjections}
                disabled={generatingProjections}
                size="sm"
                variant="outline"
                className="border-neutral-700 text-xs"
              >
                {generatingProjections ? '⏳ Generating...' : 'Generate'}
              </Button>
            </div>
          </FadeIn>
        )}

        {/* V19: Action Plan — collapsible */}
        {actionPlan ? (
          <FadeIn delay={0.2}>
            <div className="mb-3 rounded-xl border border-neutral-800 bg-neutral-900/40 overflow-hidden">
              <button onClick={() => setDepthOpen(depthOpen === 'plan' ? null : 'plan')} className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-neutral-900/70 transition-colors">
                <span className="flex items-center gap-3">
                  <span className="text-lg">🎯</span>
                  <span className="font-semibold text-white">Action Plan</span>
                  {actionPlan.totalTimeline && (
                    <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20 text-xs">
                      {actionPlan.totalTimeline}
                    </Badge>
                  )}
                </span>
                {depthOpen === 'plan' ? <ChevronUp className="h-4 w-4 text-neutral-500" /> : <ChevronDown className="h-4 w-4 text-neutral-500" />}
              </button>
              {depthOpen === 'plan' && (
                <div className="px-5 pb-5">
              <div className="space-y-4">
                {actionPlan.phases?.map((phase: { name: string; duration: string; icon: string; steps: { task: string; duration: string; priority: string; cost: string }[] }, pi: number) => (
                  <Card key={pi} className="border-neutral-800 bg-neutral-900/50">
                    <CardContent className="pt-5">
                      <div className="flex items-center gap-3 mb-4">
                        <span className="text-2xl">{phase.icon}</span>
                        <div>
                          <h3 className="font-semibold text-white">{phase.name}</h3>
                          <p className="text-xs text-neutral-500">{phase.duration}</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        {phase.steps?.map((step: { task: string; duration: string; priority: string; cost: string }, si: number) => (
                          <div key={si} className="flex items-start gap-3 p-3 rounded-lg bg-neutral-800/30 border border-neutral-700/30">
                            <span className={`mt-0.5 text-sm ${step.priority === 'high' ? 'text-red-400' : step.priority === 'medium' ? 'text-amber-400' : 'text-neutral-500'}`}>
                              {step.priority === 'high' ? '🔴' : step.priority === 'medium' ? '🟡' : '⚪'}
                            </span>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-neutral-200">{step.task}</p>
                              <div className="flex gap-3 mt-1 text-xs text-neutral-500">
                                <span>⏱️ {step.duration}</span>
                                {step.cost && <span>💰 {step.cost}</span>}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              {actionPlan.criticalPath?.length > 0 && (
                <div className="mt-4 p-4 rounded-xl border border-red-500/20 bg-red-500/5">
                  <h4 className="text-sm font-semibold text-red-400 mb-2">⚡ Critical Path</h4>
                  <div className="flex flex-wrap gap-2">
                    {actionPlan.criticalPath.map((t: string, i: number) => (
                      <span key={i} className="text-xs bg-red-500/10 text-red-300 px-2 py-1 rounded">{t}</span>
                    ))}
                  </div>
                </div>
              )}
                </div>
              )}
            </div>
          </FadeIn>
        ) : completedSections >= 2 && (
          <FadeIn delay={0.2}>
            <div className="mb-3 rounded-xl border border-dashed border-neutral-800 bg-neutral-900/20 px-5 py-4 flex items-center justify-between gap-3">
              <span className="flex items-center gap-3 text-sm text-neutral-400">
                <span className="text-lg">🎯</span>
                <span>Action Plan</span>
              </span>
              <Button onClick={handleGeneratePlan} disabled={generatingPlan} size="sm" variant="outline" className="border-neutral-700 text-xs">
                {generatingPlan ? '⏳ Generating...' : 'Generate'}
              </Button>
            </div>
          </FadeIn>
        )}

        {/* V18: Competitor Deep Dive — collapsible */}
        {competitorData ? (
          <FadeIn delay={0.2}>
            <div className="mb-3 rounded-xl border border-neutral-800 bg-neutral-900/40 overflow-hidden">
              <button onClick={() => setDepthOpen(depthOpen === 'competitors' ? null : 'competitors')} className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-neutral-900/70 transition-colors">
                <span className="flex items-center gap-3">
                  <span className="text-lg">🏢</span>
                  <span className="font-semibold text-white">Competitor Analysis</span>
                </span>
                {depthOpen === 'competitors' ? <ChevronUp className="h-4 w-4 text-neutral-500" /> : <ChevronDown className="h-4 w-4 text-neutral-500" />}
              </button>
              {depthOpen === 'competitors' && (
                <div className="px-5 pb-5">
                  <CompetitorAnalysis data={competitorData} />
                </div>
              )}
            </div>
          </FadeIn>
        ) : completedSections >= 2 && (
          <FadeIn delay={0.2}>
            <div className="mb-3 rounded-xl border border-dashed border-neutral-800 bg-neutral-900/20 px-5 py-4 flex items-center justify-between gap-3">
              <span className="flex items-center gap-3 text-sm text-neutral-400">
                <span className="text-lg">🏢</span>
                <span>Competitor Analysis</span>
              </span>
              <Button
                onClick={handleGenerateCompetitors}
                disabled={generatingCompetitors}
                size="sm"
                variant="outline"
                className="border-neutral-700 text-xs"
              >
                {generatingCompetitors ? '⏳ Analyzing...' : 'Generate'}
              </Button>
            </div>
          </FadeIn>
        )}

        {/* V8: Journey flow toggle */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">🔬 Research Sections</h2>
          <button
            onClick={() => setJourneyMode(!journeyMode)}
            className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${journeyMode ? 'border-amber-500/30 text-amber-400 bg-amber-500/10' : 'border-neutral-700 text-neutral-400'}`}
          >
            {journeyMode ? '📖 Guided Mode' : '📋 Grid Mode'}
          </button>
        </div>

        {/* Research sections — journey or grid */}
        <FadeInStagger className={journeyMode ? 'space-y-4' : 'grid md:grid-cols-2 gap-4'}>
          {idea.framework.sections?.map((section, idx) => {
            const research = idea.research?.[section.id];
            // V8 Journey: auto-expand current/completed, collapse future
            const isJourneyCurrent = journeyMode && idx === firstUnresearchedIdx;
            const isJourneyFuture = journeyMode && !research && idx > firstUnresearchedIdx && firstUnresearchedIdx !== -1;
            const isExpanded = expandedSection === section.id;
            const isResearching = researchingSection === section.id;
            const hasError = sectionError === section.id;

            return (
              <FadeInItem
                key={section.id}
                id={`section-${section.id}`}
                className={`scroll-mt-40 ${isExpanded && !journeyMode ? 'md:col-span-2' : ''} ${isJourneyFuture ? 'opacity-40' : ''}`}
              >
                <Card
                  className={`border-neutral-800 bg-neutral-900/50 transition-all ${
                    research ? 'border-l-4 border-l-green-500/50' :
                    isJourneyCurrent ? 'border-l-4 border-l-amber-500/50 ring-1 ring-amber-500/20' : ''
                  }`}
                >
                  <CardHeader
                    className="cursor-pointer"
                    onClick={() => {
                      if (research) {
                        if (journeyMode) {
                          setExpandedSection(isExpanded ? `close-${section.id}` : section.id);
                        } else {
                          setExpandedSection(isExpanded ? null : section.id);
                        }
                      }
                    }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-neutral-800/80 text-2xl shrink-0">
                          {section.icon}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-neutral-500 font-mono">Step {idx + 1}</span>
                            {research && <span className="text-xs text-green-400">✓ Done</span>}
                          </div>
                          <CardTitle className="text-base text-white">{section.title}</CardTitle>
                          <p className="text-sm text-neutral-400 mt-1">{section.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {research?.score && (
                          <Badge className={`text-sm px-3 py-1 ${research.score >= 7 ? 'bg-green-500/20 text-green-300' : research.score >= 4 ? 'bg-yellow-500/20 text-yellow-300' : 'bg-red-500/20 text-red-300'}`}>
                            {research.score}/10
                          </Badge>
                        )}
                        {isExpanded && research ? <span className="text-neutral-500">▼</span> : research ? <span className="text-neutral-600">▶</span> : null}
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent>
                    {hasError && (
                      <div className="mb-4 p-4 rounded-lg border border-red-500/20 bg-red-500/5 flex items-center justify-between">
                        <span className="text-sm text-red-300">Something went wrong. Want to try again?</span>
                        <Button onClick={() => { setSectionError(null); handleResearch(section.id); }} size="lg" variant="outline" className="border-red-500/30 text-red-300 hover:bg-red-500/10 text-base px-5">
                          🔄 Try Again
                        </Button>
                      </div>
                    )}

                    {!research && !isResearching && !hasError && !isJourneyFuture && (
                      <div>
                        <div className="space-y-2 mb-5">
                          {section.questions.map((q, i) => (
                            <p key={i} className="text-sm text-neutral-400 flex items-start gap-2">
                              <span className="text-amber-500 shrink-0">?</span> {q}
                            </p>
                          ))}
                        </div>
                        <Button
                          onClick={() => handleResearch(section.id)}
                          size="lg"
                          className="bg-amber-500 hover:bg-amber-600 text-black font-semibold text-base px-6 py-3"
                        >
                          🔍 Research This Section
                        </Button>
                      </div>
                    )}

                    {isJourneyFuture && !research && !isResearching && (
                      <p className="text-sm text-neutral-600 italic">Complete the sections above first to unlock this one.</p>
                    )}

                    {isResearching && (
                      <ResearchLoader />
                    )}

                    {research && isExpanded && (
                      <FadeIn>
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xs text-neutral-500">
                            {research.researchedAt ? `Researched ${new Date(research.researchedAt).toLocaleDateString()}` : 'Researched'}
                          </span>
                          <div className="flex gap-2">
                            <Button
                              onClick={(e) => {
                                e.stopPropagation();
                                const text = `${section.title}\n${research.keyTakeaway || ''}\nScore: ${research.score || 'N/A'}/10`;
                                navigator.clipboard.writeText(text);
                              }}
                              size="sm"
                              variant="outline"
                              className="border-neutral-700 text-xs"
                            >
                              📋 Copy
                            </Button>
                            <Button
                              onClick={(e) => { e.stopPropagation(); handleResearch(section.id); }}
                              size="sm"
                              variant="outline"
                              className="border-neutral-700 text-xs"
                              disabled={researchingSection !== null}
                            >
                              🔄 Re-research
                            </Button>
                          </div>
                        </div>
                        <ResearchDashboard research={research} />
                        {/* V15: Notes */}
                        <div className="mt-4 pt-4 border-t border-neutral-800">
                          <label className="text-xs font-semibold text-neutral-500 mb-2 block">📝 Your Notes</label>
                          <textarea
                            value={notes[section.id] || ''}
                            onChange={(e) => setNotes(prev => ({ ...prev, [section.id]: e.target.value }))}
                            onBlur={() => {
                              fetch(`/api/ideas/${params.id}/notes`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ sectionId: section.id, note: notes[section.id] || '' }),
                              });
                            }}
                            placeholder="Add your thoughts, insights, or action items..."
                            className="w-full bg-neutral-800/50 border border-neutral-700/50 rounded-lg p-3 text-sm text-neutral-300 placeholder:text-neutral-600 focus:outline-none focus:border-amber-500/30 min-h-[80px] resize-y"
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                        {/* V8 Journey: next section CTA */}
                        {journeyMode && idx < (idea.framework.sections?.length || 0) - 1 && !idea.research?.[idea.framework.sections[idx + 1]?.id] && (
                          <div className="mt-6 pt-4 border-t border-neutral-800 flex justify-center">
                            <Button
                              onClick={() => handleResearch(idea.framework.sections[idx + 1].id)}
                              size="lg"
                              className="bg-amber-500 hover:bg-amber-600 text-black font-semibold text-base px-8 py-3"
                              disabled={researchingSection !== null}
                            >
                              Continue → {idea.framework.sections[idx + 1].icon} {idea.framework.sections[idx + 1].title}
                            </Button>
                          </div>
                        )}
                      </FadeIn>
                    )}

                    {research && !isExpanded && (
                      <div className="cursor-pointer hover:bg-neutral-800/30 rounded-lg p-2 -mx-2 transition-colors" onClick={() => setExpandedSection(section.id)}>
                        {research.keyTakeaway && (
                          <p className="text-sm text-neutral-300 line-clamp-2 mb-1">{research.keyTakeaway}</p>
                        )}
                        <div className="flex items-center gap-3">
                          {research.score && (
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${research.score >= 7 ? 'bg-green-500/20 text-green-400' : research.score >= 4 ? 'bg-amber-500/20 text-amber-400' : 'bg-red-500/20 text-red-400'}`}>
                              {research.score}/10
                            </span>
                          )}
                          <span className="text-xs text-neutral-500">Tap to expand ▼</span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </FadeInItem>
            );
          })}
        </FadeInStagger>
      </main>
      {/* V25: AI Chat Assistant */}
      {completedSections > 0 && <ChatAssistant ideaId={idea.id} />}
    </div>
  );
}
