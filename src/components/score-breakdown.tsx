'use client';

import { Card, CardContent } from '@/components/ui/card';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer,
} from 'recharts';

interface ScoreData {
  sections: { title: string; icon: string; score: number }[];
  avgScore: number;
}

export function ScoreBreakdown({ data }: { data: ScoreData }) {
  if (!data?.sections?.length) return null;

  const radarData = data.sections.map(s => ({
    subject: s.icon + ' ' + s.title,
    score: s.score,
    fullMark: 10,
  }));

  return (
    <div className="grid sm:grid-cols-2 gap-4">
      {/* Radar Chart */}
      <Card className="border-neutral-800 bg-neutral-900/50">
        <CardContent className="pt-6">
          <h3 className="text-sm font-semibold text-neutral-300 mb-2 text-center">Score Radar</h3>
          <ResponsiveContainer width="100%" height={250}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="#333" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: '#737373', fontSize: 10 }} />
              <PolarRadiusAxis angle={30} domain={[0, 10]} tick={{ fill: '#555', fontSize: 9 }} />
              <Radar dataKey="score" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.2} strokeWidth={2} />
            </RadarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Score List */}
      <Card className="border-neutral-800 bg-neutral-900/50">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-neutral-300">Score Breakdown</h3>
            <div className={`text-2xl font-bold ${data.avgScore >= 7 ? 'text-green-400' : data.avgScore >= 4 ? 'text-amber-400' : 'text-red-400'}`}>
              {data.avgScore.toFixed(1)}<span className="text-sm text-neutral-500">/10</span>
            </div>
          </div>
          <div className="space-y-3">
            {data.sections.map((s, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-lg w-8">{s.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-neutral-400 truncate">{s.title}</span>
                    <span className={`text-xs font-mono font-bold ${s.score >= 7 ? 'text-green-400' : s.score >= 4 ? 'text-amber-400' : 'text-red-400'}`}>
                      {s.score}
                    </span>
                  </div>
                  <div className="h-1.5 bg-neutral-800 rounded-full mt-1 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${s.score >= 7 ? 'bg-green-500' : s.score >= 4 ? 'bg-amber-500' : 'bg-red-500'}`}
                      style={{ width: `${(s.score / 10) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
