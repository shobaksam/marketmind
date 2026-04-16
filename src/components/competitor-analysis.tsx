'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Competitor {
  name: string;
  description: string;
  strengths: string[];
  weaknesses: string[];
  priceRange: string;
  marketShare: number;
  rating: number;
  differentiator: string;
}

interface Positioning {
  xAxis: string;
  yAxis: string;
  players: { name: string; x: number; y: number }[];
}

interface CompetitorData {
  competitors: Competitor[];
  positioning: Positioning;
  marketGaps: string[];
  competitiveAdvantage: string;
}

export function CompetitorAnalysis({ data }: { data: CompetitorData }) {
  if (!data) return null;

  return (
    <div className="space-y-6">
      {/* Positioning Map */}
      {data.positioning?.players?.length > 0 && (
        <Card className="border-neutral-800 bg-neutral-900/50">
          <CardContent className="pt-6">
            <h3 className="text-sm font-semibold text-neutral-300 mb-4">🎯 Market Positioning Map</h3>
            <div className="relative w-full aspect-square max-w-md mx-auto bg-neutral-800/30 rounded-xl border border-neutral-700/50 p-4">
              {/* Axes labels */}
              <div className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[10px] text-neutral-500">{data.positioning.xAxis}</div>
              <div className="absolute left-1 top-1/2 -translate-y-1/2 -rotate-90 text-[10px] text-neutral-500 whitespace-nowrap">{data.positioning.yAxis}</div>
              {/* Grid lines */}
              <div className="absolute inset-8 border border-neutral-700/30 border-dashed" />
              <div className="absolute left-1/2 top-8 bottom-8 border-l border-neutral-700/30 border-dashed" />
              <div className="absolute top-1/2 left-8 right-8 border-t border-neutral-700/30 border-dashed" />
              {/* Players */}
              {data.positioning.players.map((p, i) => {
                const isYou = p.name.toLowerCase().includes('your') || p.name.toLowerCase().includes('you');
                return (
                  <div
                    key={i}
                    className="absolute transform -translate-x-1/2 -translate-y-1/2 group"
                    style={{ left: `${8 + (p.x / 100) * 84}%`, top: `${8 + ((100 - p.y) / 100) * 84}%` }}
                  >
                    <div className={`w-4 h-4 rounded-full ${isYou ? 'bg-amber-500 ring-2 ring-amber-500/30' : 'bg-blue-500'} cursor-pointer`} />
                    <span className={`absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] whitespace-nowrap px-1.5 py-0.5 rounded ${isYou ? 'bg-amber-500/20 text-amber-400 font-bold' : 'bg-neutral-800 text-neutral-400'}`}>
                      {p.name}
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Competitor Cards */}
      <div className="grid sm:grid-cols-2 gap-4">
        {data.competitors?.map((c, i) => (
          <Card key={i} className="border-neutral-800 bg-neutral-900/50">
            <CardContent className="pt-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-white">{c.name}</h3>
                  <p className="text-xs text-neutral-400 mt-1">{c.description}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <span className="text-yellow-400 text-sm">★</span>
                  <span className="text-sm font-mono text-white">{c.rating}</span>
                </div>
              </div>
              <div className="flex gap-2 mb-3">
                <Badge className="bg-neutral-800 text-neutral-300 text-[10px]">{c.priceRange}</Badge>
                <Badge className="bg-blue-500/10 text-blue-400 text-[10px]">{c.marketShare}% share</Badge>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-[10px] text-green-400 font-semibold mb-1">Strengths</p>
                  {c.strengths?.slice(0, 2).map((s, j) => (
                    <p key={j} className="text-xs text-neutral-400">+ {s}</p>
                  ))}
                </div>
                <div>
                  <p className="text-[10px] text-red-400 font-semibold mb-1">Weaknesses</p>
                  {c.weaknesses?.slice(0, 2).map((w, j) => (
                    <p key={j} className="text-xs text-neutral-400">− {w}</p>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Market Gaps & Advantage */}
      <div className="grid sm:grid-cols-2 gap-4">
        {data.marketGaps?.length > 0 && (
          <Card className="border-green-500/20 bg-green-500/5">
            <CardContent className="pt-5">
              <h3 className="text-sm font-semibold text-green-400 mb-3">🎯 Market Gaps</h3>
              {data.marketGaps.map((g, i) => (
                <p key={i} className="text-sm text-neutral-300 mb-1">• {g}</p>
              ))}
            </CardContent>
          </Card>
        )}
        {data.competitiveAdvantage && (
          <Card className="border-amber-500/20 bg-amber-500/5">
            <CardContent className="pt-5">
              <h3 className="text-sm font-semibold text-amber-400 mb-3">⚡ Your Competitive Advantage</h3>
              <p className="text-sm text-neutral-300">{data.competitiveAdvantage}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
