'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
export default function NewIdeaPage() {
  const { status } = useSession();
  const router = useRouter();
  const [idea, setIdea] = useState('');
  const [location, setLocation] = useState('');
  const [loading, setLoading] = useState(false);

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
      }
    } catch (err) {
      console.error('Failed to submit idea:', err);
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="animate-pulse text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center gap-4 px-6 py-3">
          <button onClick={() => router.push('/dashboard')} className="text-slate-400 hover:text-white transition-colors">
            ← Back
          </button>
          <span className="text-lg font-bold">New Research</span>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-12">
        <Card className="border-slate-800 bg-slate-900/50">
          <CardHeader>
            <CardTitle className="text-2xl text-white">What&apos;s your business idea?</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="idea" className="text-slate-300">Describe your idea</label>
                <Textarea
                  id="idea"
                  placeholder="e.g., I want to start a homemade pudding delivery service, open a CrossFit gym, buy a McDonald's franchise..."
                  value={idea}
                  onChange={(e) => setIdea(e.target.value)}
                  className="min-h-[120px] bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="location" className="text-slate-300">Location (optional)</label>
                <Input
                  id="location"
                  placeholder="e.g., Austin, TX or Dubai, UAE"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                />
              </div>

              <Button
                type="submit"
                disabled={loading || !idea.trim()}
                className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white text-base"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full" />
                    Generating Research Framework...
                  </span>
                ) : (
                  'Generate Research Framework →'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
