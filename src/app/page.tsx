'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { signIn } from 'next-auth/react';
import { Lightbulb, BarChart3, Target, Zap, ArrowRight, Check } from 'lucide-react';
import { FadeIn, FadeInStagger, FadeInItem } from '@/components/animate';
import Link from 'next/link';

export default function LandingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (session) router.push('/dashboard');
  }, [session, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-950">
        <div className="animate-spin h-8 w-8 border-2 border-amber-500/30 border-t-amber-500 rounded-full" />
      </div>
    );
  }

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

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-24 text-center">
        <FadeIn>
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-1.5 text-sm text-amber-400 mb-8">
            <Zap className="h-3.5 w-3.5" />
            AI-Powered Market Research
          </div>
        </FadeIn>
        <FadeIn delay={0.1}>
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold tracking-tight mb-6">
            Turn any business idea into{' '}
            <span className="bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
              actionable research
            </span>
          </h1>
        </FadeIn>
        <FadeIn delay={0.2}>
          <p className="text-lg sm:text-xl text-neutral-400 max-w-2xl mx-auto mb-10">
            Stop guessing. MarketMind analyzes your business idea and generates a complete market research report with real data, cost breakdowns, and competitive analysis — in minutes.
          </p>
        </FadeIn>
        <FadeIn delay={0.3}>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={() => signIn('google')}
              size="lg"
              className="bg-amber-500 hover:bg-amber-600 text-black font-semibold text-lg px-8 py-6"
            >
              Get Started Free <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="border-neutral-700 hover:bg-neutral-800 text-lg px-8 py-6"
              onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
            >
              See How It Works
            </Button>
          </div>
        </FadeIn>
      </section>

      {/* Features */}
      <section id="features" className="max-w-6xl mx-auto px-4 sm:px-6 py-20">
        <FadeIn>
          <h2 className="text-3xl font-bold text-center mb-4">How it works</h2>
          <p className="text-neutral-400 text-center mb-16 max-w-xl mx-auto">
            Describe your idea, and our AI builds a custom research framework tailored to your specific business.
          </p>
        </FadeIn>
        <FadeInStagger className="grid sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8">
          {[
            {
              icon: Lightbulb,
              title: 'Describe Your Idea',
              desc: 'Tell us about your business concept — from a pudding company to a dairy farm. Add your location for localized data.',
            },
            {
              icon: BarChart3,
              title: 'AI Research Framework',
              desc: 'Our AI identifies exactly what questions matter for YOUR idea: costs, regulations, market size, competition, and more.',
            },
            {
              icon: Target,
              title: 'Deep Market Analysis',
              desc: 'Get real numbers, case studies, YouTube resources, SWOT analysis, and competitive intelligence — all in one place.',
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

      {/* Before / After */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-20">
        <FadeIn>
          <h2 className="text-3xl font-bold text-center mb-4">From vague idea to visual insights</h2>
          <p className="text-neutral-400 text-center mb-12 max-w-xl mx-auto">See the difference MarketMind makes — no more guessing with walls of text.</p>
        </FadeIn>
        <div className="grid sm:grid-cols-2 gap-6">
          <FadeIn delay={0.1}>
            <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-6 relative">
              <div className="absolute -top-3 left-4 bg-red-500/80 text-white text-xs font-bold px-3 py-1 rounded-full">BEFORE</div>
              <div className="space-y-2 text-sm text-neutral-500 font-mono mt-2">
                <p>Market size: approximately $2.4 billion</p>
                <p>Startup costs range from $15,000-$45,000</p>
                <p>Main competitors: Company A, Company B</p>
                <p>Growth rate: 12% annually</p>
                <p>Break-even estimate: 14-18 months</p>
                <p className="text-neutral-600">... 3 more pages of text ...</p>
              </div>
            </div>
          </FadeIn>
          <FadeIn delay={0.2}>
            <div className="rounded-xl border-2 border-amber-500/30 bg-neutral-900/50 p-6 relative">
              <div className="absolute -top-3 left-4 bg-amber-500 text-black text-xs font-bold px-3 py-1 rounded-full">AFTER — MARKETMIND</div>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <div className="bg-neutral-800/60 rounded-lg p-3 border border-neutral-700/50">
                  <div className="text-lg">📊</div>
                  <div className="text-lg font-bold text-white">$2.4B</div>
                  <div className="text-xs text-neutral-400">Market Size <span className="text-green-400">↑</span></div>
                </div>
                <div className="bg-neutral-800/60 rounded-lg p-3 border border-neutral-700/50">
                  <div className="text-lg">💰</div>
                  <div className="text-lg font-bold text-white">$30K</div>
                  <div className="text-xs text-neutral-400">Avg Startup Cost</div>
                </div>
                <div className="bg-neutral-800/60 rounded-lg p-3 border border-neutral-700/50">
                  <div className="text-lg">⏱️</div>
                  <div className="text-lg font-bold text-white">16 mo</div>
                  <div className="text-xs text-neutral-400">Break-even</div>
                </div>
                <div className="bg-neutral-800/60 rounded-lg p-3 border border-neutral-700/50">
                  <div className="text-lg">🚀</div>
                  <div className="text-lg font-bold text-white">12%</div>
                  <div className="text-xs text-neutral-400">Growth Rate <span className="text-green-400">↑</span></div>
                </div>
              </div>
              <div className="mt-2 bg-green-500/8 border border-green-500/20 rounded-lg p-2 text-xs text-green-300 flex items-center gap-2">
                🚀 High growth market with low competition in your area
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Testimonials */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-20">
        <FadeIn>
          <h2 className="text-3xl font-bold text-center mb-12">Trusted by entrepreneurs</h2>
        </FadeIn>
        <FadeInStagger className="grid sm:grid-cols-3 gap-6">
          {[
            { name: 'Sarah K.', role: 'Food Truck Owner', quote: 'MarketMind showed me exactly what permits I needed and how much to budget. Saved me weeks of research.', avatar: '👩‍🍳' },
            { name: 'James R.', role: 'SaaS Founder', quote: 'The competitor analysis alone was worth it. Found a gap in the market I would have completely missed.', avatar: '👨‍💻' },
            { name: 'Maria L.', role: 'Fitness Studio', quote: 'I went from "maybe someday" to a solid business plan in one afternoon. The visual dashboard makes it so clear.', avatar: '💪' },
          ].map((t, i) => (
            <FadeInItem key={i}>
              <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-6 h-full flex flex-col">
                <p className="text-neutral-300 text-sm leading-relaxed flex-1">&ldquo;{t.quote}&rdquo;</p>
                <div className="flex items-center gap-3 mt-4 pt-4 border-t border-neutral-800">
                  <span className="text-2xl">{t.avatar}</span>
                  <div>
                    <p className="text-sm font-semibold text-white">{t.name}</p>
                    <p className="text-xs text-neutral-500">{t.role}</p>
                  </div>
                </div>
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
              <div className="rounded-lg border border-neutral-800 bg-neutral-900/30 p-3 sm:p-4 text-xs sm:text-sm text-neutral-300 hover:border-amber-500/30 hover:bg-amber-500/5 transition-colors cursor-default">
                {idea}
              </div>
            </FadeInItem>
          ))}
        </FadeInStagger>
      </section>

      {/* Pricing Preview */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-20">
        <FadeIn>
          <h2 className="text-3xl font-bold text-center mb-4">Simple pricing</h2>
          <p className="text-neutral-400 text-center mb-12">Start free, upgrade when you need more.</p>
        </FadeIn>
        <FadeInStagger className="grid sm:grid-cols-2 gap-6">
          <FadeInItem>
            <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-8">
              <h3 className="text-lg font-semibold mb-1">Free</h3>
              <p className="text-3xl font-bold mb-4">$0<span className="text-sm font-normal text-neutral-500">/mo</span></p>
              <ul className="space-y-2 text-sm text-neutral-400 mb-6">
                {['2 ideas per month', 'AI research framework', 'Deep section research', 'Text export'].map((f, i) => (
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
                {['Unlimited ideas', 'Priority AI (faster)', 'PDF export', 'SWOT analysis', 'Compare ideas', 'Share links'].map((f, i) => (
                  <li key={i} className="flex items-center gap-2"><Check className="h-4 w-4 text-amber-400 shrink-0" />{f}</li>
                ))}
              </ul>
              <Button onClick={() => signIn('google')} className="w-full bg-amber-500 hover:bg-amber-600 text-black font-semibold">Start Pro Trial</Button>
            </div>
          </FadeInItem>
        </FadeInStagger>
      </section>

      {/* CTA */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 py-20 text-center">
        <FadeIn>
          <h2 className="text-3xl font-bold mb-4">Ready to validate your next big idea?</h2>
          <p className="text-neutral-400 mb-8">Free to start. No credit card required.</p>
          <Button
            onClick={() => signIn('google')}
            size="lg"
            className="bg-amber-500 hover:bg-amber-600 text-black font-semibold text-lg px-8 py-6"
          >
            Start Researching <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </FadeIn>
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
