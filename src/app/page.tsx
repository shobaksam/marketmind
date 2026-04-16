'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { signIn } from 'next-auth/react';
import { Lightbulb, BarChart3, Target, Zap, ArrowRight, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { FadeIn, FadeInStagger, FadeInItem } from '@/components/animate';
import Link from 'next/link';

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
];

const SEED_IDEAS = [
  'Airbnb for home gyms',
  'AI therapist for dogs',
  'SaaS pricing comparison tool',
  'Auto-generate SOC 2 docs',
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

export default function LandingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [idea, setIdea] = useState('');
  const [loading, setLoading] = useState(false);
  const [vibeResult, setVibeResult] = useState<VibeResult | null>(null);
  const [error, setError] = useState('');
  const [showWhy, setShowWhy] = useState(false);
  const [openSection, setOpenSection] = useState<null | 'details' | 'alts'>(null);
  const [showResult, setShowResult] = useState(false);
  const [quip, setQuip] = useState('');
  const quipInterval = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (session) router.push('/dashboard');
  }, [session, router]);

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
    setError('');
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
      try {
        localStorage.setItem('mm:pending_vibe', JSON.stringify({ idea: target, result: data, ts: Date.now() }));
      } catch {}
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Something broke');
    } finally {
      setLoading(false);
      stopQuips();
    }
  }

  function refine(suffix: string) {
    const base = idea.trim().replace(/\s+$/, '');
    vibeCheck(base + suffix);
  }

  function toggle(s: 'details' | 'alts') {
    setOpenSection((cur) => (cur === s ? null : s));
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-950">
        <div className="animate-spin h-8 w-8 border-2 border-amber-500/30 border-t-amber-500 rounded-full" />
      </div>
    );
  }

  const altHeading = vibeResult?.verdict === 'good' ? 'Sharper angles' : 'Try instead';
  const hasDetails = !!(vibeResult && (vibeResult.scores || vibeResult.biggest_risk || vibeResult.who_pays || vibeResult.first_step || (vibeResult.comparables && vibeResult.comparables.length)));

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      {/* Nav */}
      <nav className="border-b border-neutral-800 px-4 sm:px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lightbulb className="h-6 w-6 text-amber-400" />
            <span className="text-xl font-bold">MarketMind</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/pricing" className="text-sm text-neutral-400 hover:text-white transition-colors hidden sm:inline">
              Pricing
            </Link>
            <Button onClick={() => signIn('google')} variant="outline" className="border-neutral-700 hover:bg-neutral-800">
              Sign In
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero with Vibe Check */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-20 relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-amber-500/5 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-orange-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        </div>

        <FadeIn>
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-1.5 text-sm text-amber-400 mb-6">
              <Zap className="h-3.5 w-3.5" />
              Free instant vibe check
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight mb-4">
              Is your idea{' '}
              <span className="bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
                any good?
              </span>
            </h1>
            <p className="text-lg text-neutral-400 max-w-xl mx-auto">
              Pitch your business idea. Get an honest verdict in seconds.
            </p>
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
                  key={s}
                  onClick={() => vibeCheck(s)}
                  className="text-xs text-neutral-400 hover:text-amber-300 bg-neutral-900/60 hover:bg-neutral-900 border border-neutral-800 hover:border-amber-500/40 rounded-full px-3 py-2 transition-colors"
                >
                  {s}
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

        {/* Loading */}
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

            {/* Details + alternatives */}
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

            {/* CTA to sign in for full research */}
            <div className={`mt-8 transition-all duration-500 delay-500 ${showResult ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1'}`}>
              <div className="rounded-2xl border border-amber-500/20 bg-gradient-to-r from-amber-500/5 to-orange-500/5 p-6 text-center">
                <p className="text-sm text-neutral-300 mb-3">Want the full market research? Competitors, costs, action plan & more.</p>
                <Button
                  onClick={() => signIn('google', { callbackUrl: '/ideas/new?pending=1' })}
                  className="bg-amber-500 hover:bg-amber-600 text-black font-semibold px-8"
                >
                  Sign in for full research <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </section>

      {/* Features */}
      <section id="features" className="max-w-6xl mx-auto px-4 sm:px-6 py-20">
        <FadeIn>
          <h2 className="text-3xl font-bold text-center mb-4">How it works</h2>
          <p className="text-neutral-400 text-center mb-16 max-w-xl mx-auto">
            From quick gut check to deep market research — all AI-powered.
          </p>
        </FadeIn>
        <FadeInStagger className="grid sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8">
          {[
            {
              icon: Zap,
              title: 'Instant Vibe Check',
              desc: 'Type your idea and get an honest verdict in seconds. Good, bad, or needs work — no sugarcoating.',
            },
            {
              icon: BarChart3,
              title: 'Deep Market Research',
              desc: 'Sign in to unlock full analysis: market size, competition, costs, regulations, and more — all tailored to your idea.',
            },
            {
              icon: Target,
              title: 'Actionable Next Steps',
              desc: 'Get specific actions you can take this week. Not "build an MVP" — real, concrete steps for your exact idea.',
            },
          ].map((f, i) => (
            <FadeInItem key={i}>
              <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-6 sm:p-8 hover:border-neutral-700 transition-colors h-full">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-amber-500/10 text-amber-400 mb-4">
                  <f.icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
                <p className="text-neutral-400 text-sm leading-relaxed">{f.desc}</p>
              </div>
            </FadeInItem>
          ))}
        </FadeInStagger>
      </section>

      {/* Examples */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-20">
        <FadeIn>
          <h2 className="text-3xl font-bold text-center mb-12">Works for any business idea</h2>
        </FadeIn>
        <FadeInStagger className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {[
            '🐄 Starting a Dairy Farm',
            '🍮 Homemade Pudding Business',
            '☕ Coffee Shop Franchise',
            '🏠 Airbnb Property Management',
            '🚗 Mobile Car Detailing',
            '👕 Custom T-Shirt Brand',
            '📱 SaaS App Startup',
            '🌱 Organic Farm-to-Table',
          ].map((idea, i) => (
            <FadeInItem key={i}>
              <button
                onClick={() => vibeCheck(idea.replace(/^[^\s]+\s/, ''))}
                className="w-full text-left rounded-lg border border-neutral-800 bg-neutral-900/30 p-3 sm:p-4 text-xs sm:text-sm text-neutral-300 hover:border-amber-500/30 hover:bg-amber-500/5 transition-colors cursor-pointer"
              >
                {idea}
              </button>
            </FadeInItem>
          ))}
        </FadeInStagger>
      </section>

      {/* Pricing Preview */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-20">
        <FadeIn>
          <h2 className="text-3xl font-bold text-center mb-4">Simple pricing</h2>
          <p className="text-neutral-400 text-center mb-12">Vibe check is free. Full research needs an account.</p>
        </FadeIn>
        <FadeInStagger className="grid sm:grid-cols-2 gap-6">
          <FadeInItem>
            <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-8">
              <h3 className="text-lg font-semibold mb-1">Free</h3>
              <p className="text-3xl font-bold mb-4">$0<span className="text-sm font-normal text-neutral-500">/mo</span></p>
              <ul className="space-y-2 text-sm text-neutral-400 mb-6">
                {['Unlimited vibe checks', '2 full research reports/mo', 'Instant verdict + scores', 'Refinement suggestions'].map((f, i) => (
                  <li key={i} className="flex items-center gap-2"><Check className="h-4 w-4 text-green-400 shrink-0" />{f}</li>
                ))}
              </ul>
              <Button onClick={() => signIn('google')} className="w-full bg-neutral-800 hover:bg-neutral-700">Get Started</Button>
            </div>
          </FadeInItem>
          <FadeInItem>
            <div className="rounded-xl border-2 border-amber-500/50 bg-neutral-900/50 p-8 relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-500 text-black text-xs font-bold px-3 py-1 rounded-full">POPULAR</div>
              <h3 className="text-lg font-semibold mb-1">Pro</h3>
              <p className="text-3xl font-bold mb-4">$19<span className="text-sm font-normal text-neutral-500">/mo</span></p>
              <ul className="space-y-2 text-sm text-neutral-400 mb-6">
                {['Unlimited full research', 'Priority AI (faster)', 'PDF export', 'SWOT analysis', 'Compare ideas', 'Share links'].map((f, i) => (
                  <li key={i} className="flex items-center gap-2"><Check className="h-4 w-4 text-amber-400 shrink-0" />{f}</li>
                ))}
              </ul>
              <Button onClick={() => signIn('google')} className="w-full bg-amber-500 hover:bg-amber-600 text-black font-semibold">Start Pro Trial</Button>
            </div>
          </FadeInItem>
        </FadeInStagger>
      </section>

      {/* Footer */}
      <footer className="border-t border-neutral-800 px-4 sm:px-6 py-8">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-neutral-500">
          <div className="flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-amber-400" />
            <span>MarketMind</span>
          </div>
          <div className="flex gap-4">
            <Link href="/pricing" className="hover:text-neutral-300 transition-colors">Pricing</Link>
          </div>
          <span>© 2026 MarketMind. All rights reserved.</span>
        </div>
      </footer>
    </div>
  );
}
