'use client';

import { signIn } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Lightbulb, Check, ArrowRight } from 'lucide-react';
import { FadeIn, FadeInStagger, FadeInItem } from '@/components/animate';
import Link from 'next/link';

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      {/* Nav */}
      <nav className="border-b border-neutral-800 px-4 sm:px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Lightbulb className="h-6 w-6 text-amber-400" />
            <span className="text-xl font-bold">MarketMind</span>
          </Link>
          <Button onClick={() => signIn('google')} variant="outline" className="border-neutral-700 hover:bg-neutral-800">
            Sign In
          </Button>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
        <FadeIn>
          <div className="text-center mb-16">
            <h1 className="text-4xl sm:text-5xl font-bold mb-4">Simple, transparent pricing</h1>
            <p className="text-lg text-neutral-400 max-w-xl mx-auto">
              Start with 2 free ideas per month. Upgrade to Pro for unlimited research.
            </p>
          </div>
        </FadeIn>

        <FadeInStagger className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {/* Free */}
          <FadeInItem>
            <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-8 h-full flex flex-col">
              <h3 className="text-lg font-semibold mb-1">Free</h3>
              <p className="text-4xl font-bold mb-1">$0</p>
              <p className="text-sm text-neutral-500 mb-6">Forever free</p>
              <ul className="space-y-3 text-sm text-neutral-300 mb-8 flex-1">
                {[
                  '2 ideas per month',
                  'AI research framework',
                  'Deep section research',
                  'SWOT analysis',
                  'Text export',
                  'Share links',
                ].map((f, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-green-400 shrink-0 mt-0.5" />{f}
                  </li>
                ))}
              </ul>
              <Button onClick={() => signIn('google')} className="w-full bg-neutral-800 hover:bg-neutral-700">
                Get Started <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </FadeInItem>

          {/* Pro */}
          <FadeInItem>
            <div className="rounded-xl border-2 border-amber-500/50 bg-neutral-900/50 p-8 h-full flex flex-col relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-500 text-black text-xs font-bold px-3 py-1 rounded-full">
                MOST POPULAR
              </div>
              <h3 className="text-lg font-semibold mb-1">Pro</h3>
              <p className="text-4xl font-bold mb-1">$19<span className="text-lg font-normal text-neutral-500">/mo</span></p>
              <p className="text-sm text-neutral-500 mb-6">Billed monthly</p>
              <ul className="space-y-3 text-sm text-neutral-300 mb-8 flex-1">
                {[
                  'Unlimited ideas',
                  'Everything in Free',
                  'Priority AI processing',
                  'PDF report export',
                  'Compare ideas side-by-side',
                  'Advanced SWOT with action items',
                  'Custom research sections',
                  'Email support',
                ].map((f, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />{f}
                  </li>
                ))}
              </ul>
              <Button onClick={() => signIn('google')} className="w-full bg-amber-500 hover:bg-amber-600 text-black font-semibold">
                Start Pro Trial <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </FadeInItem>

          {/* Team */}
          <FadeInItem>
            <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-8 h-full flex flex-col">
              <h3 className="text-lg font-semibold mb-1">Team</h3>
              <p className="text-4xl font-bold mb-1">$49<span className="text-lg font-normal text-neutral-500">/mo</span></p>
              <p className="text-sm text-neutral-500 mb-6">Per team, up to 5 members</p>
              <ul className="space-y-3 text-sm text-neutral-300 mb-8 flex-1">
                {[
                  'Everything in Pro',
                  '5 team members',
                  'Shared idea workspace',
                  'Team comparison views',
                  'Priority support',
                  'API access (coming soon)',
                ].map((f, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />{f}
                  </li>
                ))}
              </ul>
              <Button onClick={() => signIn('google')} variant="outline" className="w-full border-neutral-700 hover:bg-neutral-800">
                Contact Us <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </FadeInItem>
        </FadeInStagger>

        {/* FAQ */}
        <FadeIn delay={0.3}>
          <div className="mt-20 max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-center mb-8">Frequently asked questions</h2>
            <div className="space-y-6">
              {[
                { q: 'What counts as an "idea"?', a: 'Each business concept you submit counts as one idea. You can research sections within an idea as many times as you want.' },
                { q: 'Can I upgrade or downgrade anytime?', a: 'Yes! You can change your plan at any time. Changes take effect immediately.' },
                { q: 'Is the AI research accurate?', a: 'Our AI uses the latest models (Gemini 2.0 Flash + Groq Llama 3.3) to provide data-driven insights. While AI research is a great starting point, we recommend validating key findings for critical decisions.' },
                { q: 'Do you offer refunds?', a: 'Yes, we offer a full refund within 7 days if you\'re not satisfied with Pro.' },
              ].map((faq, i) => (
                <div key={i} className="border-b border-neutral-800 pb-6">
                  <h3 className="font-semibold mb-2">{faq.q}</h3>
                  <p className="text-sm text-neutral-400">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>
        </FadeIn>
      </main>

      {/* Footer */}
      <footer className="border-t border-neutral-800 px-4 sm:px-6 py-8">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-neutral-500">
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
