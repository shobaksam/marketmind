import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'MarketMind — AI-Powered Business Idea Research',
  description: 'Turn any business idea into actionable market research in minutes. Get AI-generated research frameworks, cost breakdowns, SWOT analysis, and competitive intelligence.',
  keywords: ['business research', 'market analysis', 'AI research', 'business idea validation', 'SWOT analysis', 'startup research'],
  authors: [{ name: 'MarketMind' }],
  openGraph: {
    title: 'MarketMind — AI-Powered Business Idea Research',
    description: 'Turn any business idea into actionable market research in minutes.',
    url: 'https://marketmind.shobak.dev',
    siteName: 'MarketMind',
    type: 'website',
    images: [{
      url: 'https://marketmind.shobak.dev/og-image.png',
      width: 1200,
      height: 630,
      alt: 'MarketMind - AI Business Research',
    }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MarketMind — AI-Powered Business Idea Research',
    description: 'Turn any business idea into actionable market research in minutes.',
    images: ['https://marketmind.shobak.dev/og-image.png'],
  },
  metadataBase: new URL('https://marketmind.shobak.dev'),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
