'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { IdeaCardSkeleton } from '@/components/ui/skeleton';
import { FadeIn, FadeInStagger, FadeInItem } from '@/components/animate';
import { Lightbulb, Plus, LogOut, Clock, MapPin, ChevronRight, ArrowLeftRight } from 'lucide-react';

interface Idea {
  id: string;
  title: string;
  summary: string;
  category: string;
  idea_text: string;
  location: string;
  status: string;
  framework: { sections: Array<{ id: string }> };
  research: Record<string, unknown>;
  created_at: string;
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchIdeas = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch('/api/ideas');
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setIdeas(data);
    } catch {
      setError('Failed to load your ideas. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
    if (status === 'authenticated') fetchIdeas();
  }, [status, router, fetchIdeas]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-950">
        <div className="animate-spin h-8 w-8 border-2 border-amber-500/30 border-t-amber-500 rounded-full" />
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      {/* Nav */}
      <nav className="border-b border-neutral-800 px-4 sm:px-6 py-4 sticky top-0 bg-neutral-950/80 backdrop-blur z-50">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lightbulb className="h-6 w-6 text-amber-400" />
            <span className="text-xl font-bold">MarketMind</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-neutral-400 hidden sm:inline">{session.user?.name}</span>
            <Button variant="ghost" size="sm" onClick={() => signOut({ callbackUrl: '/' })} className="text-neutral-400 hover:text-white">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </nav>

      {/* Dashboard Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <FadeIn>
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">Your Ideas</h1>
              <p className="text-neutral-400 mt-1">{ideas.length} idea{ideas.length !== 1 ? 's' : ''} researched</p>
            </div>
            <div className="flex gap-2">
              {ideas.length >= 2 && (
                <Button onClick={() => router.push('/compare')} variant="outline" className="border-neutral-700">
                  <ArrowLeftRight className="h-4 w-4 mr-1" /> <span className="hidden sm:inline">Compare</span>
                </Button>
              )}
              <Button
                onClick={() => router.push('/ideas/new')}
                className="bg-amber-500 hover:bg-amber-600 text-black font-semibold"
              >
                <Plus className="h-4 w-4 mr-1 sm:mr-2" /> <span className="hidden sm:inline">New Idea</span><span className="sm:hidden">New</span>
              </Button>
            </div>
          </div>
        </FadeIn>

        {error && (
          <FadeIn>
            <div className="mb-6 p-4 rounded-lg border border-red-500/20 bg-red-500/5 flex items-center justify-between">
              <span className="text-sm text-red-300">{error}</span>
              <Button onClick={fetchIdeas} size="sm" variant="outline" className="border-red-500/30 text-red-300">
                🔄 Retry
              </Button>
            </div>
          </FadeIn>
        )}

        {loading ? (
          <div className="grid gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <IdeaCardSkeleton key={i} />
            ))}
          </div>
        ) : ideas.length === 0 ? (
          <FadeIn delay={0.1}>
            <div className="rounded-xl border border-neutral-800 bg-neutral-900/30 p-12 sm:p-16 text-center">
              <Lightbulb className="h-12 w-12 text-amber-400/50 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No ideas yet</h3>
              <p className="text-neutral-400 mb-6 max-w-md mx-auto">
                Start by describing a business idea. Our AI will generate a complete market research framework.
              </p>
              <Button
                onClick={() => router.push('/ideas/new')}
                className="bg-amber-500 hover:bg-amber-600 text-black font-semibold"
              >
                <Plus className="h-4 w-4 mr-2" /> Research Your First Idea
              </Button>
            </div>
          </FadeIn>
        ) : (
          <FadeInStagger className="grid gap-4">
            {ideas.map((idea) => {
              const totalSections = idea.framework?.sections?.length || 0;
              const completedSections = Object.keys(idea.research || {}).length;
              const progress = totalSections ? Math.round((completedSections / totalSections) * 100) : 0;

              return (
                <FadeInItem key={idea.id}>
                  <Card
                    className="border-neutral-800 bg-neutral-900/50 hover:border-neutral-700 transition-all cursor-pointer group"
                    onClick={() => router.push(`/ideas/${idea.id}`)}
                  >
                    <CardContent className="p-4 sm:p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2 flex-wrap">
                            <h3 className="text-lg font-semibold truncate">{idea.title || 'Untitled Idea'}</h3>
                            {idea.category && (
                              <Badge variant="secondary" className="bg-amber-500/10 text-amber-400 border-amber-500/20 shrink-0">
                                {idea.category}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-neutral-400 line-clamp-2 mb-3">{idea.summary || idea.idea_text}</p>
                          <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-500">
                            {idea.location && (
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" /> {idea.location}
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" /> {new Date(idea.created_at).toLocaleDateString()}
                            </span>
                            <span>{completedSections}/{totalSections} sections</span>
                          </div>
                          <div className="mt-3 h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>
                        <ChevronRight className="h-5 w-5 text-neutral-600 group-hover:text-neutral-400 transition-colors ml-4 shrink-0 mt-1" />
                      </div>
                    </CardContent>
                  </Card>
                </FadeInItem>
              );
            })}
          </FadeInStagger>
        )}
      </div>
    </div>
  );
}
