'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { signIn } from 'next-auth/react';
import { Lightbulb, BarChart3, Target, Zap, ArrowRight } from 'lucide-react';

export default function LandingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (session) router.push('/dashboard');
  }, [session, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-950">
        <div className="animate-pulse text-neutral-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      {/* Nav */}
      <nav className="border-b border-neutral-800 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lightbulb className="h-6 w-6 text-amber-400" />
            <span className="text-xl font-bold">MarketMind</span>
          </div>
          <Button onClick={() => signIn('google')} variant="outline" className="border-neutral-700 hover:bg-neutral-800">
            Sign In
          </Button>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 py-24 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-1.5 text-sm text-amber-400 mb-8">
          <Zap className="h-3.5 w-3.5" />
          AI-Powered Market Research
        </div>
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6">
          Turn any business idea into{' '}
          <span className="bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
            actionable research
          </span>
        </h1>
        <p className="text-xl text-neutral-400 max-w-2xl mx-auto mb-10">
          Stop guessing. MarketMind analyzes your business idea and generates a complete market research report with real data, cost breakdowns, and competitive analysis — in minutes.
        </p>
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
      </section>

      {/* Features */}
      <section id="features" className="max-w-6xl mx-auto px-6 py-20">
        <h2 className="text-3xl font-bold text-center mb-4">How it works</h2>
        <p className="text-neutral-400 text-center mb-16 max-w-xl mx-auto">
          Describe your idea, and our AI builds a custom research framework tailored to your specific business.
        </p>
        <div className="grid md:grid-cols-3 gap-8">
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
            <div key={i} className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-8 hover:border-neutral-700 transition-colors">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-amber-500/10 text-amber-400 mb-4">
                <f.icon className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
              <p className="text-neutral-400 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Examples */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <h2 className="text-3xl font-bold text-center mb-12">Works for any business idea</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
            <div
              key={i}
              className="rounded-lg border border-neutral-800 bg-neutral-900/30 p-4 text-sm text-neutral-300 hover:border-amber-500/30 hover:bg-amber-500/5 transition-colors cursor-default"
            >
              {idea}
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-3xl mx-auto px-6 py-20 text-center">
        <h2 className="text-3xl font-bold mb-4">Ready to validate your next big idea?</h2>
        <p className="text-neutral-400 mb-8">Free to start. No credit card required.</p>
        <Button
          onClick={() => signIn('google')}
          size="lg"
          className="bg-amber-500 hover:bg-amber-600 text-black font-semibold text-lg px-8 py-6"
        >
          Start Researching <ArrowRight className="ml-2 h-5 w-5" />
        </Button>
      </section>

      {/* Footer */}
      <footer className="border-t border-neutral-800 px-6 py-8">
        <div className="max-w-6xl mx-auto flex items-center justify-between text-sm text-neutral-500">
          <div className="flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-amber-400" />
            <span>MarketMind</span>
          </div>
          <span>© 2026 MarketMind. All rights reserved.</span>
        </div>
      </footer>
    </div>
  );
}
