'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';

const STEPS = [
  { title: 'Welcome to MarketMind! 👋', description: 'Let us show you around. This quick tour will help you get the most out of your research.', position: 'center' },
  { title: 'Create New Ideas 💡', description: 'Click "New Idea" to describe your business concept. Add a location for hyper-local research.', position: 'top-right' },
  { title: 'AI Research Framework 🔬', description: 'Our AI creates a custom research framework with sections tailored to YOUR specific business idea.', position: 'center' },
  { title: 'Deep Dive Each Section 📊', description: 'Research sections individually for visual insights, or use "Research All" for a complete analysis.', position: 'center' },
  { title: 'Compare & Export 📋', description: 'Compare ideas side-by-side, generate SWOT analysis, financial projections, and export PDF reports.', position: 'center' },
  { title: 'You\'re all set! 🚀', description: 'Start by creating your first idea. Our AI will handle the rest.', position: 'center' },
];

export function OnboardingTour() {
  const [step, setStep] = useState(-1);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem('mm-tour-completed') && !localStorage.getItem('mm-onboarding-dismissed')) {
      const timer = setTimeout(() => { setStep(0); setVisible(true); }, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const next = () => {
    if (step < STEPS.length - 1) {
      setStep(step + 1);
    } else {
      setVisible(false);
      localStorage.setItem('mm-tour-completed', '1');
    }
  };

  const skip = () => {
    setVisible(false);
    localStorage.setItem('mm-tour-completed', '1');
  };

  if (!visible || step < 0) return null;

  const current = STEPS[step];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={skip} />
      <div className="relative bg-neutral-900 border border-amber-500/30 rounded-2xl p-6 max-w-sm mx-4 shadow-2xl shadow-amber-500/10">
        <div className="flex items-center gap-2 mb-1">
          {STEPS.map((_, i) => (
            <div key={i} className={`h-1 flex-1 rounded-full ${i <= step ? 'bg-amber-500' : 'bg-neutral-700'}`} />
          ))}
        </div>
        <h3 className="text-lg font-bold text-white mt-4">{current.title}</h3>
        <p className="text-sm text-neutral-400 mt-2 leading-relaxed">{current.description}</p>
        <div className="flex items-center justify-between mt-6">
          <button onClick={skip} className="text-xs text-neutral-500 hover:text-neutral-300">Skip tour</button>
          <Button onClick={next} className="bg-amber-500 hover:bg-amber-600 text-black font-semibold">
            {step < STEPS.length - 1 ? 'Next →' : 'Get Started! 🚀'}
          </Button>
        </div>
      </div>
    </div>
  );
}
