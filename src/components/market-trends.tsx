'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FadeIn } from '@/components/animate';

const TRENDS = [
  { name: 'AI & Machine Learning', status: 'hot', growth: '+34%', icon: '🤖' },
  { name: 'Sustainable Products', status: 'rising', growth: '+22%', icon: '🌱' },
  { name: 'Health & Wellness', status: 'rising', growth: '+18%', icon: '💪' },
  { name: 'Remote Work Tools', status: 'saturated', growth: '+5%', icon: '🏠' },
  { name: 'Food Delivery', status: 'saturated', growth: '+3%', icon: '🍔' },
  { name: 'Electric Vehicles', status: 'hot', growth: '+28%', icon: '⚡' },
  { name: 'Creator Economy', status: 'rising', growth: '+15%', icon: '🎨' },
  { name: 'Cybersecurity', status: 'hot', growth: '+26%', icon: '🔒' },
];

const statusStyles: Record<string, { bg: string; text: string; label: string }> = {
  hot: { bg: 'bg-red-500/10', text: 'text-red-400', label: '🔥 Hot' },
  rising: { bg: 'bg-green-500/10', text: 'text-green-400', label: '📈 Rising' },
  saturated: { bg: 'bg-yellow-500/10', text: 'text-yellow-400', label: '⚡ Saturated' },
};

export function MarketTrends() {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? TRENDS : TRENDS.slice(0, 4);

  return (
    <FadeIn delay={0.1}>
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold flex items-center gap-2">📊 Market Trends</h2>
          <button onClick={() => setExpanded(!expanded)} className="text-xs text-amber-400 hover:text-amber-300">
            {expanded ? 'Show less' : 'Show all'}
          </button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {visible.map((t) => {
            const s = statusStyles[t.status];
            return (
              <Card key={t.name} className="border-neutral-800 bg-neutral-900/50 hover:border-neutral-700 transition-colors">
                <CardContent className="p-4">
                  <span className="text-2xl">{t.icon}</span>
                  <h3 className="text-sm font-medium text-white mt-2 line-clamp-1">{t.name}</h3>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge className={`${s.bg} ${s.text} text-[10px]`}>{s.label}</Badge>
                    <span className="text-xs text-green-400 font-mono">{t.growth}</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </FadeIn>
  );
}
