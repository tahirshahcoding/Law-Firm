'use client';

import { useState, useEffect } from 'react';
import { Download, TrendingUp, DollarSign, Calendar, Landmark, CreditCard } from 'lucide-react';
import { API_BASE } from '@/lib/api';
import useSWR from 'swr';
import { swrFetcher } from '@/lib/fetcher';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';

function fmt(n: any) {
  return `PKR ${parseFloat(n ?? 0).toLocaleString()}`;
}

export default function RevenuePage() {
  const { data: ledger, isLoading: loading } = useSWR(`${API_BASE}/accounts/ledger/`, swrFetcher);

  const chartData = ledger?.revenue_chart || [];
  
  // Format for Area Chart (cumulative profit)
  let cumulativeProfit = 0;
  const cumulativeData = chartData.map((d: any) => {
    cumulativeProfit += (d.revenue || 0) - (d.expenses || 0);
    return { ...d, cumulative: cumulativeProfit };
  });

  const topClients = ledger?.top_paying_clients || [];
  const maxClientAmount = topClients.reduce((max: number, c: any) => c.amount > max ? c.amount : max, 1);

  const practiceAreas = ledger?.revenue_by_practice_area || [];
  const totalPracticeRevenue = practiceAreas.reduce((sum: number, c: any) => sum + c.amount, 0) || 1;

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Revenue Analytics</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Visualize firm income, cash flow, and financial trends</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors bg-white dark:bg-slate-900 shadow-sm dark:shadow-none">
          <Download size={15} />
          Export Report
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm dark:shadow-none transition-colors">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Today's Revenue</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-2">{fmt(ledger?.todays_revenue)}</p>
          <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-1">Payments cleared today</p>
        </div>
        <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm dark:shadow-none transition-colors">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">This Month</p>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-2">{fmt(ledger?.this_month_revenue)}</p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Current calendar month</p>
        </div>
        <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm dark:shadow-none transition-colors">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">This Year</p>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-2">{fmt(ledger?.this_year_revenue)}</p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Year to date collections</p>
        </div>
        <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm dark:shadow-none transition-colors">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Outstanding</p>
          <p className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-2">{fmt(ledger?.outstanding_balance)}</p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Unpaid invoice balances</p>
        </div>
      </div>

      {/* Charts section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Income vs Expenses Bar Chart */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-none flex flex-col justify-between transition-colors">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 bg-blue-50 dark:bg-blue-900/30 rounded-xl text-blue-600 dark:text-blue-400">
              <DollarSign size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Income vs Expenses</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Monthly breakdowns</p>
            </div>
          </div>
          
          <div className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 11}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 11}} tickFormatter={(val) => `${val/1000}k`} dx={-5} />
                <RechartsTooltip 
                  cursor={{fill: '#f8fafc'}}
                  contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)'}}
                />
                <Legend iconType="circle" wrapperStyle={{paddingTop: '15px', fontSize: 12}} />
                <Bar dataKey="revenue" name="Revenue" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={30} />
                <Bar dataKey="expenses" name="Expenses" fill="#f43f5e" radius={[4, 4, 0, 0]} maxBarSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Cumulative Profit Area Chart */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-none flex flex-col justify-between transition-colors">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 bg-emerald-50 dark:bg-emerald-900/30 rounded-xl text-emerald-600 dark:text-emerald-400">
              <TrendingUp size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Cumulative Net Profit</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Growth trajectory</p>
            </div>
          </div>
          
          <div className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={cumulativeData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCumulative" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 11}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 11}} tickFormatter={(val) => `${val/1000}k`} dx={-5} />
                <RechartsTooltip 
                  contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)'}}
                />
                <Area type="monotone" dataKey="cumulative" name="Net Profit" stroke="#3b82f6" strokeWidth={2.5} fillOpacity={1} fill="url(#colorCumulative)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Two column: Top Clients & Revenue by Practice Area */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Clients */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-none transition-colors">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-5 uppercase tracking-wider">Top Paying Clients</h2>
          {topClients.length === 0 ? (
            <p className="text-sm text-slate-400 dark:text-slate-500 text-center py-12">No client payment data available.</p>
          ) : (
            <div className="space-y-4">
              {topClients.map((client: any, i: number) => {
                const pct = (client.amount / maxClientAmount) * 100;
                return (
                  <div key={i} className="space-y-1.5">
                    <div className="flex justify-between items-center text-sm font-medium">
                      <span className="text-slate-800 dark:text-slate-200">{client.name}</span>
                      <span className="text-slate-900 dark:text-white font-semibold">{fmt(client.amount)}</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div className="bg-blue-600 h-full rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Revenue by Practice Area */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-none transition-colors">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-5 uppercase tracking-wider">Revenue by Practice Area</h2>
          {practiceAreas.length === 0 ? (
            <p className="text-sm text-slate-400 dark:text-slate-500 text-center py-12">No practice area data available.</p>
          ) : (
            <div className="space-y-4">
              {practiceAreas.map((area: any, i: number) => {
                const pct = Math.round((area.amount / totalPracticeRevenue) * 100);
                return (
                  <div key={i} className="space-y-1.5">
                    <div className="flex justify-between items-center text-sm font-medium">
                      <span className="text-slate-800 dark:text-slate-200">{area.category}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-500 dark:text-slate-400 text-xs">({pct}%)</span>
                        <span className="text-slate-900 dark:text-white font-semibold">{fmt(area.amount)}</span>
                      </div>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
