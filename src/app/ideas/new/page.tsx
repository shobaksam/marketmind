'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { FadeIn } from '@/components/animate';
import { ArrowLeft, ArrowRight, ChevronDown, ChevronUp } from 'lucide-react';

type Dim = { score: number; note: string };
type Scores = { market: Dim; execution: Dim; timing: Dim };
type Comp = { name: string; note: string };
type Alt = { title: string; why: string };
type VibeResult = {
  verdict: 'good' | 'meh' | 'bad';
  punchline: string;
  why: string;
  scores?: Scores;
  biggest_risk?: string;
  who_pays?: string;
  first_step?: string;
  comparables?: Comp[];
  alternatives: Alt[];
};

const LOADING_QUIPS = [
  'Checking if anyone else thought of this...',
  'Asking the brutally honest advisor...',
  'Finding the real competition...',
  'Looking for the money trail...',
  'Checking the graveyard of similar apps...',
  'Running the numbers...',
  'Consulting the startup oracle...',
];

const SEED_IDEAS = [
  { text: 'Airbnb for home gyms', icon: '🏋️' },
  { text: 'AI therapist for dogs', icon: '🐕' },
  { text: 'SaaS pricing comparison extension', icon: '💰' },
  { text: 'Auto-generate SOC 2 compliance docs', icon: '🔒' },
];

const REFINEMENTS = [
  { label: 'Make it B2B', suffix: ' for small businesses instead of consumers' },
  { label: 'Go local', suffix: ' but focused on a single city to start' },
  { label: 'Pick a niche', suffix: ' but only for a specific niche audience' },
];

const VERDICT_STYLES: Record<VibeResult['verdict'], { label: string; sublabel: string; bg: string; text: string; ring: string; dot: string }> = {
  good: { label: 'Go for it', sublabel: 'Clear edge', bg: 'bg-emerald-500/10', text: 'text-emerald-300', ring: 'ring-emerald-500/30', dot: 'bg-emerald-400' },
  meh: { label: 'Has potential', sublabel: 'Needs a sharper angle', bg: 'bg-amber-500/10', text: 'text-amber-300', ring: 'ring-amber-500/30', dot: 'bg-amber-400' },
  bad: { label: 'Skip it', sublabel: 'Try something else', bg: 'bg-red-500/10', text: 'text-red-300', ring: 'ring-red-500/30', dot: 'bg-red-400' },
};

export default function NewIdeaPage() {
  const { status } = useSession();
  const router = useRouter();
  const [idea, setIdea] = useState('');
  const [loading, setLoading] = useState(false);
  const [vibeResult, setVibeResult] = useState<VibeResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showWhy, setShowWhy] = useState(false);
  const [openSection, setOpenSection] = useState<null | 'details' | 'alts'>(null);
  const [showResult, setShowResult] = useState(false);
  const [quip, setQuip] = useState('');
  const [deepLoading, setDeepLoading] = useState(false);
  const quipInterval = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
  }, [status, router]);

  const startQuips = useCallback(() => {
    setQuip(LOADING_QUIPS[Math.floor(Math.random() * LOADING_QUIPS.length)]);
    quipInterval.current = setInterval(() => {
      setQuip(LOADING_QUIPS[Math.floor(Math.random() * LOADING_QUIPS.length)]);
    }, 2500);
  }, []);

  const stopQuips = useCallback(() => {
    if (quipInterval.current) { clearInterval(quipInterval.current); quipInterval.current = null; }
    setQuip('');
  }, []);

  async function vibeCheck(nextIdea?: string) {
    const target = (nextIdea ?? idea).trim();
    if (!target) return;
    if (nextIdea) setIdea(nextIdea);
    setLoading(true);
    setError(null);
    setVibeResult(null);
    setShowWhy(false);
    setShowResult(false);
    setOpenSection(null);
    startQuips();
    try {
      const r = await fetch('/api/ideas/vibe-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idea: target }),
      });
      if (!r.ok) throw new Error(await r.text());
      const data: VibeResult = await r.json();
      setVibeResult(data);
      setOpenSection(data.verdict === 'bad' ? 'alts' : null);
      setTimeout(() => setShowResult(true), 50);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Something broke');
    } finally {
      setLoading(false);
      stopQuips();
    }
  }

  async function goDeeper() {
    if (!idea.trim()) return;
    setDeepLoading(true);
    try {
      const res = await fetch('/api/ideas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idea: idea.trim(), location: '' }),
      });
      const data = await res.json();
      if (data.id) {
        router.push(`/ideas/${data.id}`);
      } else {
        setError(data.error || 'Failed to create research');
      }
    } catch {
      setError('Network error');
    } finally {
      setDeepLoading(false);
    }
  }

  function refine(suffix: string) {
    const base = idea.trim().replace(/\s+$/, '');
    vibeCheck(base + suffix);
  }

  function toggle(s: 'details' | 'alts') {
    setOpenSection((cur) => (cur === s ? null : s));
  }

  const altHeading = vibeResult?.verdict === 'good' ? 'Sharper angles' : 'Try instead';
  const hasDetails = !!(vibeResult && (vibeResult.scores || vibeResult.biggest_risk || vibeResult.who_pays || vibeResult.first_step || (vibeResult.comparables && vibeResult.comparables.length)));

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-950">
        <div className="animate-spin h-8 w-8 border-2 border-amber-500/30 border-t-amber-500 rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <header className="border-b border-neutral-800 bg-neutral-950/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center gap-4 px-6 py-3">
          <button onClick={() => router.push('/dashboard')} className="text-neutral-400 hover:text-white transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <span className="text-lg font-bold">New Idea</span>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <FadeIn>
          <div className="text-center mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold mb-2">Vibe Check</h1>
            <p className="text-neutral-400 text-base sm:text-lg">Pitch an idea. One honest line back.</p>
          </div>
        </FadeIn>

        <FadeIn delay={0.1}>
          <div className="flex flex-col sm:flex-row gap-2 bg-neutral-900/70 border border-neutral-800 rounded-2xl p-2 focus-within:border-amber-500/60 transition-colors">
            <input
              value={idea}
              onChange={(e) => setIdea(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && vibeCheck()}
              placeholder="An app that..."
              className="flex-1 bg-transparent px-4 py-3 outline-none text-base sm:text-lg placeholder:text-neutral-600 min-h-[44px]"
            />
            <button
              onClick={() => vibeCheck()}
              disabled={loading || !idea.trim()}
              className="bg-amber-500 hover:bg-amber-400 text-black font-semibold px-6 py-3 rounded-xl disabled:opacity-40 disabled:cursor-not-allowed transition-colors min-h-[44px]"
            >
              {loading ? 'Thinking…' : 'Check'}
            </button>
          </div>
        </FadeIn>

        {/* Seed ideas */}
        {!vibeResult && !loading && !error && (
          <FadeIn delay={0.2}>
            <div className="mt-5 flex flex-wrap gap-2 justify-center">
              {SEED_IDEAS.map((s) => (
                <button
                  key={s.text}
                  onClick={() => vibeCheck(s.text)}
                  className="text-xs text-neutral-400 hover:text-amber-300 bg-neutral-900/60 hover:bg-neutral-900 border border-neutral-800 hover:border-amber-500/40 rounded-full px-3 py-2 transition-colors"
                >
                  {s.icon} {s.text}
                </button>
              ))}
            </div>
          </FadeIn>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="mt-6 rounded-2xl border border-red-500/30 bg-red-500/5 p-5 text-sm">
            <div className="text-red-300 font-semibold mb-1">Couldn&apos;t get a verdict</div>
            <div className="text-neutral-400 mb-3">{error.length > 200 ? 'The AI didn\'t answer. Try again.' : error}</div>
            <button onClick={() => vibeCheck()} className="text-xs text-amber-300 hover:text-amber-200 border border-amber-500/40 rounded-md px-3 py-1.5 transition-colors">
              Retry
            </button>
          </div>
        )}

        {/* Loading skeleton */}
        {loading && !vibeResult && (
          <div className="mt-8 rounded-2xl p-7 ring-1 ring-neutral-800 bg-neutral-900/40">
            <div className="flex items-center gap-3 mb-5">
              <div className="flex gap-1">
                <span className="h-2 w-2 rounded-full bg-amber-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="h-2 w-2 rounded-full bg-amber-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="h-2 w-2 rounded-full bg-amber-400 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
              {quip && <span className="text-sm text-neutral-500 transition-opacity duration-500">{quip}</span>}
            </div>
            <div className="space-y-3 animate-pulse">
              <div className="h-5 w-24 rounded bg-neutral-800" />
              <div className="h-7 w-3/4 rounded bg-neutral-800" />
              <div className="h-4 w-full rounded bg-neutral-800/60" />
            </div>
          </div>
        )}

        {/* Verdict */}
        {vibeResult && (
          <>
            <div className={`mt-8 rounded-2xl p-6 sm:p-7 ring-1 ${VERDICT_STYLES[vibeResult.verdict].ring} ${VERDICT_STYLES[vibeResult.verdict].bg} relative transition-all duration-500 ${showResult ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex flex-col">
                  <div className={`inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest px-2.5 py-1 rounded-md ${VERDICT_STYLES[vibeResult.verdict].bg} ${VERDICT_STYLES[vibeResult.verdict].text}`}>
                    <span className={`inline-block h-1.5 w-1.5 rounded-full ${VERDICT_STYLES[vibeResult.verdict].dot}`} />
                    {VERDICT_STYLES[vibeResult.verdict].label}
                  </div>
                  <span className="text-[10px] text-neutral-500 mt-1 px-1">{VERDICT_STYLES[vibeResult.verdict].sublabel}</span>
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-semibold leading-snug tracking-tight">{vibeResult.punchline}</div>
              {vibeResult.why && (
                showWhy ? (
                  <div className="mt-3 text-sm text-neutral-400 leading-relaxed">{vibeResult.why}</div>
                ) : (
                  <button onClick={() => setShowWhy(true)} className="mt-3 text-xs text-neutral-500 hover:text-neutral-300 transition-colors">
                    why?
                  </button>
                )
              )}
            </div>

            {/* Refinement chips */}
            <div className={`mt-5 flex flex-wrap gap-2 transition-all duration-500 delay-200 ${showResult ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1'}`}>
              {REFINEMENTS.map((r) => (
                <button key={r.label} onClick={() => refine(r.suffix)} disabled={loading}
                  className="text-xs text-neutral-300 hover:text-amber-300 bg-neutral-900/60 hover:bg-neutral-900 border border-neutral-800 hover:border-amber-500/40 disabled:opacity-40 rounded-full px-3 py-2 transition-colors">
                  ↻ {r.label}
                </button>
              ))}
            </div>

            {/* Dig deeper + alternatives */}
            <div className={`mt-6 grid gap-2 transition-all duration-500 delay-400 ${showResult ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1'}`}>
              {hasDetails && (
                <div className="rounded-xl border border-neutral-800 bg-neutral-900/40 overflow-hidden">
                  <button onClick={() => toggle('details')} className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-neutral-900/70 transition-colors min-h-[44px]">
                    <span className="text-sm text-neutral-300">Dig deeper</span>
                    <span className="flex items-center gap-3">
                      {vibeResult.scores && (
                        <span className="flex gap-1">
                          {(['market', 'execution', 'timing'] as const).map((k) => {
                            const d = vibeResult.scores![k];
                            const dot = d.score >= 7 ? 'bg-emerald-400' : d.score >= 4 ? 'bg-amber-400' : 'bg-red-400';
                            return <span key={k} className={`inline-block h-2 w-2 rounded-full ${dot}`} title={`${k}: ${d.score}/10`} />;
                          })}
                        </span>
                      )}
                      {openSection === 'details' ? <ChevronUp className="h-4 w-4 text-neutral-600" /> : <ChevronDown className="h-4 w-4 text-neutral-600" />}
                    </span>
                  </button>
                  {openSection === 'details' && (
                    <div className="px-4 pb-4 space-y-5">
                      {vibeResult.scores && (
                        <div className="grid grid-cols-3 gap-2 sm:gap-3">
                          {(['market', 'execution', 'timing'] as const).map((k) => {
                            const d = vibeResult.scores![k];
                            const color = d.score >= 7 ? 'text-emerald-300' : d.score >= 4 ? 'text-amber-300' : 'text-red-300';
                            const bar = d.score >= 7 ? 'bg-emerald-400' : d.score >= 4 ? 'bg-amber-400' : 'bg-red-400';
                            return (
                              <div key={k} className="bg-neutral-950/40 border border-neutral-800 rounded-lg p-3">
                                <div className="flex items-baseline justify-between mb-2">
                                  <div className="text-[10px] uppercase tracking-widest text-neutral-500">{k}</div>
                                  <div className={`text-lg font-bold ${color}`}>{d.score}<span className="text-xs text-neutral-600 font-normal">/10</span></div>
                                </div>
                                <div className="h-1 rounded-full bg-neutral-800 mb-2 overflow-hidden">
                                  <div className={`h-full ${bar} transition-all duration-700 ease-out`} style={{ width: `${Math.max(0, Math.min(10, d.score)) * 10}%` }} />
                                </div>
                                <div className="text-[11px] text-neutral-400 leading-relaxed">{d.note}</div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                      {(vibeResult.biggest_risk || vibeResult.who_pays || vibeResult.first_step) && (
                        <div className="grid gap-3">
                          {vibeResult.biggest_risk && (
                            <div className="flex gap-3">
                              <div className="text-[11px] uppercase tracking-widest text-red-300/80 w-20 flex-shrink-0 pt-0.5">Risk</div>
                              <div className="text-sm text-neutral-200 flex-1">{vibeResult.biggest_risk}</div>
                            </div>
                          )}
                          {vibeResult.who_pays && (
                            <div className="flex gap-3">
                              <div className="text-[11px] uppercase tracking-widest text-emerald-300/80 w-20 flex-shrink-0 pt-0.5">Buyer</div>
                              <div className="text-sm text-neutral-200 flex-1">{vibeResult.who_pays}</div>
                            </div>
                          )}
                          {vibeResult.first_step && (
                            <div className="flex gap-3">
                              <div className="text-[11px] uppercase tracking-widest text-amber-300/80 w-20 flex-shrink-0 pt-0.5">Test it</div>
                              <div className="text-sm text-neutral-200 flex-1">{vibeResult.first_step}</div>
                            </div>
                          )}
                        </div>
                      )}
                      {vibeResult.comparables && vibeResult.comparables.length > 0 && (
                        <div>
                          <div className="text-[11px] uppercase tracking-widest text-neutral-500 mb-2">Like</div>
                          <div className="flex flex-wrap gap-2">
                            {vibeResult.comparables.slice(0, 3).map((c, i) => (
                              <div key={i} className="text-xs bg-neutral-950/40 border border-neutral-800 rounded-full px-3 py-1.5">
                                <span className="text-neutral-100 font-medium">{c.name}</span>
                                <span className="text-neutral-500"> · {c.note}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {vibeResult.alternatives.length > 0 && (
                <div className="rounded-xl border border-neutral-800 bg-neutral-900/40 overflow-hidden">
                  <button onClick={() => toggle('alts')} className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-neutral-900/70 transition-colors min-h-[44px]">
                    <span className="text-sm text-neutral-300">{altHeading}</span>
                    <span className="flex items-center gap-2">
                      <span className="text-[11px] text-neutral-600">{vibeResult.alternatives.length}</span>
                      {openSection === 'alts' ? <ChevronUp className="h-4 w-4 text-neutral-600" /> : <ChevronDown className="h-4 w-4 text-neutral-600" />}
                    </span>
                  </button>
                  {openSection === 'alts' && (
                    <div className="px-4 pb-4 grid gap-2">
                      {vibeResult.alternatives.slice(0, 3).map((a, i) => (
                        <button key={i} onClick={() => vibeCheck(a.title)}
                          className="text-left bg-neutral-950/40 hover:bg-neutral-950 border border-neutral-800 hover:border-amber-500/40 rounded-lg p-3 transition-colors group">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <div className="font-medium text-neutral-100 text-sm">{a.title}</div>
                            <div className="text-[11px] text-neutral-600 group-hover:text-amber-400 transition-colors whitespace-nowrap">Check →</div>
                          </div>
                          <div className="text-xs text-neutral-400">{a.why}</div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Go deeper CTA — creates full research project */}
            {vibeResult.verdict !== 'bad' && (
              <div className={`mt-8 transition-all duration-500 delay-500 ${showResult ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1'}`}>
                <Button
                  onClick={goDeeper}
                  disabled={deepLoading}
                  className="w-full h-14 bg-amber-500 hover:bg-amber-600 text-black text-lg font-bold rounded-xl"
                >
                  {deepLoading ? (
                    <span className="flex items-center gap-3">
                      <span className="animate-spin h-5 w-5 border-2 border-black/30 border-t-black rounded-full" />
                      Building research plan...
                    </span>
                  ) : (
                    <>
                      Full Research <ArrowRight className="ml-2 h-5 w-5" />
                    </>
                  )}
                </Button>
                <p className="text-xs text-neutral-600 text-center mt-2">Deep dive with market data, competitors, costs & action plan</p>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
