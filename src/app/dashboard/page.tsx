'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { IdeaCardSkeleton } from '@/components/ui/skeleton';
import { FadeIn, FadeInStagger, FadeInItem } from '@/components/animate';
import { Lightbulb, Plus, LogOut, Clock, MapPin, ChevronRight, ArrowLeftRight, Trash2, X, CheckCircle2, Circle } from 'lucide-react';

interface Research {
  score?: number;
  stats?: { label: string; value: string; icon: string; trend?: string }[];
  keyTakeaway?: string;
}

interface Idea {
  id: string;
  title: string;
  summary: string;
  category: string;
  idea_text: string;
  location: string;
  status: string;
  framework: { sections: Array<{ id: string; title: string; icon: string }> };
  research: Record<string, Research>;
  created_at: string;
}

function OnboardingBanner({ onDismiss }: { onDismiss: () => void }) {
  return (
    <FadeIn>
      <div className="mb-8 rounded-xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 to-orange-500/10 p-6 relative">
        <button onClick={onDismiss} className="absolute top-3 right-3 text-neutral-500 hover:text-white"><X className="h-4 w-4" /></button>
        <h3 className="text-lg font-bold text-amber-400 mb-2">👋 Welcome to MarketMind!</h3>
        <p className="text-sm text-neutral-300 mb-4">Here&apos;s how to get the most out of your research:</p>
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            { step: '1', title: 'Describe your idea', desc: 'Click "New Idea" and tell us about your business concept.', icon: '💡' },
            { step: '2', title: 'AI builds your framework', desc: 'We generate research sections tailored to YOUR specific idea.', icon: '🔬' },
            { step: '3', title: 'Deep dive each section', desc: 'Research sections individually or all at once for visual insights.', icon: '📊' },
          ].map((s) => (
            <div key={s.step} className="flex gap-3">
              <span className="text-2xl shrink-0">{s.icon}</span>
              <div>
                <p className="text-sm font-semibold text-white">{s.title}</p>
                <p className="text-xs text-neutral-400">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </FadeIn>
  );
}

function MiniStats({ research }: { research: Record<string, Research> }) {
  const allStats = Object.values(research || {}).flatMap(r => r.stats || []).slice(0, 3);
  if (!allStats.length) return null;
  return (
    <div className="flex flex-wrap gap-2 mt-3">
      {allStats.map((s, i) => (
        <span key={i} className="inline-flex items-center gap-1 bg-neutral-800/80 rounded-md px-2 py-1 text-xs">
          <span>{s.icon}</span>
          <span className="font-semibold text-white">{s.value}</span>
          <span className="text-neutral-500">{s.label}</span>
        </span>
      ))}
    </div>
  );
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);

  const fetchIdeas = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch('/api/ideas');
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setIdeas(data);
      // Show onboarding if first time (no ideas and never dismissed)
      if (data.length === 0 && !localStorage.getItem('mm-onboarding-dismissed')) {
        setShowOnboarding(true);
      }
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

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/ideas/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setIdeas(prev => prev.filter(i => i.id !== id));
      }
    } catch {
      // ignore
    } finally {
      setDeletingId(null);
      setConfirmDeleteId(null);
    }
  };

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

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {showOnboarding && (
          <OnboardingBanner onDismiss={() => { setShowOnboarding(false); localStorage.setItem('mm-onboarding-dismissed', '1'); }} />
        )}

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
        ) : ideas.length === 0 && !showOnboarding ? (
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
                    className="border-neutral-800 bg-neutral-900/50 hover:border-neutral-700 transition-all cursor-pointer group relative"
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
                            {progress === 100 && (
                              <Badge className="bg-green-500/10 text-green-400 border-green-500/20">✓ Complete</Badge>
                            )}
                          </div>
                          <p className="text-sm text-neutral-400 line-clamp-2 mb-3">{idea.summary || idea.idea_text}</p>

                          {/* Mini stat previews */}
                          <MiniStats research={idea.research} />

                          <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-500 mt-3">
                            {idea.location && (
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" /> {idea.location}
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" /> {new Date(idea.created_at).toLocaleDateString()}
                            </span>
                          </div>

                          {/* Section progress with checkmarks */}
                          <div className="flex flex-wrap items-center gap-2 mt-3">
                            {idea.framework?.sections?.map((s) => {
                              const done = !!(idea.research && idea.research[s.id]);
                              return (
                                <span key={s.id} className={`inline-flex items-center gap-1 text-xs ${done ? 'text-green-400' : 'text-neutral-600'}`} title={s.title}>
                                  {done ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Circle className="h-3.5 w-3.5" />}
                                  <span className="hidden lg:inline">{s.title}</span>
                                </span>
                              );
                            })}
                          </div>

                          <div className="mt-3 h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-4 shrink-0">
                          {/* Delete button */}
                          {confirmDeleteId === idea.id ? (
                            <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-red-500/50 text-red-400 hover:bg-red-500/10 text-xs px-2 h-7"
                                onClick={() => handleDelete(idea.id)}
                                disabled={deletingId === idea.id}
                              >
                                {deletingId === idea.id ? '...' : 'Delete'}
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-neutral-500 text-xs px-2 h-7"
                                onClick={() => setConfirmDeleteId(null)}
                              >
                                Cancel
                              </Button>
                            </div>
                          ) : (
                            <button
                              className="text-neutral-700 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 p-1"
                              onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(idea.id); }}
                              title="Delete idea"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                          <ChevronRight className="h-5 w-5 text-neutral-600 group-hover:text-neutral-400 transition-colors mt-1" />
                        </div>
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
