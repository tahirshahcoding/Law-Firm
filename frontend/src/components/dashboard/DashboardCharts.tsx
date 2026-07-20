'use client';

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';

export function MonthlyRevenueChart({ trendData = [], loading = false }: { trendData?: { month: string, amount: number }[], loading?: boolean }) {
  const chartData = trendData.map(d => ({
    name: d.month.split(' ')[0], // e.g. "Jul 2026" -> "Jul"
    revenue: d.amount
  }));

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h3 className="font-bold text-slate-900">Monthly Revenue</h3>
      </div>
      <div className="flex-1 min-h-[220px]">
        {loading ? (
          <div className="w-full h-full bg-slate-100 rounded-xl animate-pulse flex items-center justify-center">
            <div className="w-8 h-8 rounded-full border-2 border-slate-300 border-t-transparent animate-spin"></div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} tickFormatter={(val) => {
                if (val >= 1000000) return (val / 1000000).toFixed(1) + 'M';
                if (val >= 1000) return (val / 1000).toFixed(1) + 'K';
                return val;
              }} />
              <Tooltip
                cursor={{ fill: '#f1f5f9' }}
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}
                formatter={(value: any) => {
                  const num = Number(value);
                  const formatted = num >= 1000000 ? `${(num / 1000000).toFixed(1)}M` : num >= 1000 ? `${(num / 1000).toFixed(1)}K` : num;
                  return [`Rs ${formatted}`, 'Revenue'];
                }}
              />
              <Bar dataKey="revenue" radius={[4, 4, 0, 0]} maxBarSize={40}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={index === chartData.length - 1 ? '#3b82f6' : '#93c5fd'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

export function CaseStatusChart({ active = 0, closed = 0, pending = 0, loading = false }: { active?: number, closed?: number, pending?: number, loading?: boolean }) {
  const total = active + closed + pending;
  
  const statusData = total > 0 ? [
    { name: 'Active Cases', value: Math.round((active / total) * 100), color: '#3b82f6', count: active },
    { name: 'Closed Cases', value: Math.round((closed / total) * 100), color: '#10b981', count: closed },
    { name: 'Pending Cases', value: Math.round((pending / total) * 100), color: '#f59e0b', count: pending },
  ] : [
    { name: 'No Cases Yet', value: 100, color: '#e2e8f0', count: 0 },
  ];

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm h-full flex flex-col">
      <h3 className="font-bold text-slate-900 mb-6">Case Status Overview</h3>
      <div className="flex-1 flex items-center justify-between min-h-[220px]">
        {loading ? (
          <div className="w-full h-full bg-slate-100 rounded-xl animate-pulse flex items-center justify-center">
            <div className="w-8 h-8 rounded-full border-2 border-slate-300 border-t-transparent animate-spin"></div>
          </div>
        ) : (
          <>
            <div className="relative w-1/2 h-full flex justify-center items-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                    stroke="none"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    formatter={(value: any) => [`${value}%`, 'Share']}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="w-1/2 pl-4 flex flex-col gap-4">
              {statusData.map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-2.5 h-2.5 rounded-full mt-1 shrink-0" style={{ backgroundColor: item.color }}></div>
                  <div>
                    <p className="text-sm font-bold text-slate-900 leading-tight">{item.name}</p>
                    <p className="text-xs text-slate-500 font-medium">{item.value}% ({item.count})</p>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
