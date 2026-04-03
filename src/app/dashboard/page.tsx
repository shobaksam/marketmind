'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Lightbulb, Plus, LogOut } from 'lucide-react';

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-950">
        <div className="animate-pulse text-neutral-400">Loading...</div>
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      {/* Nav */}
      <nav className="border-b border-neutral-800 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lightbulb className="h-6 w-6 text-amber-400" />
            <span className="text-xl font-bold">MarketMind</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-neutral-400">{session.user?.name}</span>
            <Button variant="ghost" size="sm" onClick={() => signOut({ callbackUrl: '/' })} className="text-neutral-400 hover:text-white">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </nav>

      {/* Dashboard Content */}
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Your Ideas</h1>
            <p className="text-neutral-400 mt-1">Research and validate your business ideas</p>
          </div>
          <Button
            onClick={() => router.push('/ideas/new')}
            className="bg-amber-500 hover:bg-amber-600 text-black font-semibold"
          >
            <Plus className="h-4 w-4 mr-2" /> New Idea
          </Button>
        </div>

        {/* Empty State */}
        <div className="rounded-xl border border-neutral-800 bg-neutral-900/30 p-16 text-center">
          <Lightbulb className="h-12 w-12 text-amber-400/50 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No ideas yet</h3>
          <p className="text-neutral-400 mb-6 max-w-md mx-auto">
            Start by describing a business idea. Our AI will generate a complete market research framework tailored to your concept.
          </p>
          <Button
            onClick={() => router.push('/ideas/new')}
            className="bg-amber-500 hover:bg-amber-600 text-black font-semibold"
          >
            <Plus className="h-4 w-4 mr-2" /> Research Your First Idea
          </Button>
        </div>
      </div>
    </div>
  );
}
