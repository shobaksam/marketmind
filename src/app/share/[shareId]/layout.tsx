import type { Metadata } from 'next';
import { createClient } from '@supabase/supabase-js';

export async function generateMetadata({ params }: { params: { shareId: string } }): Promise<Metadata> {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const { data } = await supabase
      .from('marketmind_ideas')
      .select('title, summary, category')
      .eq('share_id', params.shareId)
      .single();

    if (data) {
      return {
        title: `${data.title} — MarketMind Research`,
        description: data.summary,
        openGraph: {
          title: `${data.title} — MarketMind Research`,
          description: data.summary,
          type: 'article',
          siteName: 'MarketMind',
        },
        twitter: {
          card: 'summary',
          title: `${data.title} — MarketMind Research`,
          description: data.summary,
        },
      };
    }
  } catch {
    // fallback
  }

  return {
    title: 'Shared Research — MarketMind',
    description: 'AI-powered business idea research',
  };
}

export default function ShareLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
