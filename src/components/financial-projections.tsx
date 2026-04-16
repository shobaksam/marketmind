'use client';

import { Card, CardContent } from '@/components/ui/card';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell,
} from 'recharts';

interface Projections {
  startupCosts: { total: number; breakdown: { item: string; cost: number }[] };
  monthlyExpenses: { total: number; breakdown: { item: string; cost: number }[] };
  revenueProjections: { month: number; revenue: number; expenses: number }[];
  breakEvenMonths: number;
  year1Profit: number;
  year3Profit: number;
  roiPercent: number;
}

const COLORS = ['#f59e0b', '#f97316', '#ef4444', '#22c55e', '#3b82f6', '#8b5cf6'];

export function FinancialProjections({ data }: { data: Projections }) {
  if (!data) return null;

  const chartData = data.revenueProjections?.map(p => ({
    name: `M${p.month}`,
    revenue: p.revenue,
    expenses: p.expenses,
    profit: p.revenue - p.expenses,
  })) || [];

  return (
    <div className="space-y-6">
      {/* Key metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Startup Cost', value: `$${(data.startupCosts?.total || 0).toLocaleString()}`, icon: '💰', color: 'text-amber-400' },
          { label: 'Break-even', value: `${data.breakEvenMonths || '?'} months`, icon: '⏱️', color: 'text-blue-400' },
          { label: 'Year 1 P/L', value: `$${(data.year1Profit || 0).toLocaleString()}`, icon: data.year1Profit >= 0 ? '📈' : '📉', color: data.year1Profit >= 0 ? 'text-green-400' : 'text-red-400' },
          { label: '3-Year ROI', value: `${data.roiPercent || 0}%`, icon: '🚀', color: 'text-green-400' },
        ].map((m, i) => (
          <Card key={i} className="border-neutral-800 bg-neutral-900/50">
            <CardContent className="p-4 text-center">
              <span className="text-2xl">{m.icon}</span>
              <p className={`text-lg font-bold ${m.color} mt-1`}>{m.value}</p>
              <p className="text-xs text-neutral-500">{m.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Revenue vs Expenses Chart */}
      {chartData.length > 0 && (
        <Card className="border-neutral-800 bg-neutral-900/50">
          <CardContent className="pt-6">
            <h3 className="text-sm font-semibold text-neutral-300 mb-4">📊 Revenue vs Expenses Projection</h3>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="expGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" tick={{ fill: '#737373', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#737373', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                <Tooltip contentStyle={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: '8px', fontSize: '12px' }} />
                <Area type="monotone" dataKey="revenue" stroke="#22c55e" fill="url(#revGrad)" strokeWidth={2} name="Revenue" />
                <Area type="monotone" dataKey="expenses" stroke="#ef4444" fill="url(#expGrad)" strokeWidth={2} name="Expenses" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Startup Cost Breakdown */}
      {data.startupCosts?.breakdown?.length > 0 && (
        <Card className="border-neutral-800 bg-neutral-900/50">
          <CardContent className="pt-6">
            <h3 className="text-sm font-semibold text-neutral-300 mb-4">💰 Startup Cost Breakdown</h3>
            <ResponsiveContainer width="100%" height={data.startupCosts.breakdown.length * 40 + 20}>
              <BarChart data={data.startupCosts.breakdown} layout="vertical" margin={{ left: 0, right: 16 }}>
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="item" width={120} tick={{ fill: '#a3a3a3', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: '8px' }} formatter={(v) => `$${Number(v).toLocaleString()}`} />
                <Bar dataKey="cost" radius={[0, 4, 4, 0]}>
                  {data.startupCosts.breakdown.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
