'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { FadeIn } from '@/components/animate';

const EXAMPLES = [
  { text: 'A homemade pudding delivery service', icon: '🍮' },
  { text: 'A CrossFit gym in my neighborhood', icon: '💪' },
  { text: 'An online tutoring platform for kids', icon: '📚' },
  { text: 'A food truck selling gourmet tacos', icon: '🌮' },
];

export default function NewIdeaPage() {
  const { status } = useSession();
  const router = useRouter();
  const [idea, setIdea] = useState('');
  const [location, setLocation] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
  }, [status, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!idea.trim()) return;
    setLoading(true);
    try {
      const res = await fetch('/api/ideas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idea: idea.trim(), location: location.trim() }),
      });
      const data = await res.json();
      if (data.id) {
        router.push(`/ideas/${data.id}`);
      } else {
        setError(data.error || 'Something went wrong. Please try again.');
      }
    } catch (err) {
      console.error('Failed to submit idea:', err);
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

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
          <button onClick={() => router.push('/dashboard')} className="text-neutral-400 hover:text-white transition-colors text-lg">
            ←
          </button>
          <span className="text-lg font-bold">New Research</span>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <FadeIn>
          <div className="text-center mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold mb-3">💡 What&apos;s your idea?</h1>
            <p className="text-neutral-400 text-lg">Tell us about your business idea and we&apos;ll research everything for you.</p>
          </div>
        </FadeIn>

        <FadeIn delay={0.1}>
          <Card className="border-neutral-800 bg-neutral-900/50">
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-3">
                  <label htmlFor="idea" className="text-base font-medium text-white">
                    Describe your business idea
                  </label>
                  <Textarea
                    id="idea"
                    placeholder="I want to start a..."
                    value={idea}
                    onChange={(e) => setIdea(e.target.value)}
                    className="min-h-[140px] bg-neutral-800 border-neutral-700 text-white placeholder:text-neutral-500 text-base"
                    required
                  />
                  {/* Quick examples */}
                  {!idea && (
                    <div className="flex flex-wrap gap-2">
                      <span className="text-xs text-neutral-500">Try:</span>
                      {EXAMPLES.map((ex) => (
                        <button
                          key={ex.text}
                          type="button"
                          onClick={() => setIdea(ex.text)}
                          className="text-xs px-3 py-1.5 rounded-full bg-neutral-800 border border-neutral-700 text-neutral-300 hover:border-amber-500/30 hover:text-amber-400 transition-colors"
                        >
                          {ex.icon} {ex.text}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <label htmlFor="location" className="text-base font-medium text-white flex items-center gap-2">
                    📍 Where will this business operate?
                    <span className="text-xs text-neutral-500 font-normal">(recommended)</span>
                  </label>
                  <Input
                    id="location"
                    placeholder="e.g., Austin, TX or Dubai, UAE"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="bg-neutral-800 border-neutral-700 text-white placeholder:text-neutral-500 text-base h-12"
                  />
                  <p className="text-xs text-neutral-500">Adding a location gives you hyper-local market data, competitors, regulations, and costs specific to your area.</p>
                </div>

                {error && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-4 text-sm text-red-300">
                    ⚠️ {error}
                    <button onClick={() => setError(null)} className="ml-2 underline text-red-400">Dismiss</button>
                  </div>
                )}
                <Button
                  type="submit"
                  disabled={loading || !idea.trim()}
                  onClick={() => setError(null)}
                  className="w-full h-14 bg-amber-500 hover:bg-amber-600 text-black text-lg font-bold rounded-xl"
                >
                  {loading ? (
                    <span className="flex items-center gap-3">
                      <span className="animate-spin h-5 w-5 border-2 border-black/30 border-t-black rounded-full" />
                      Building your research plan...
                    </span>
                  ) : (
                    '🚀 Start Research'
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </FadeIn>
      </main>
    </div>
  );
}
