'use client';

import { useState, useEffect } from 'react';
import { Coins, TrendingUp, Wallet, Receipt, CreditCard, ArrowUpRight, BarChart3 } from 'lucide-react';
import { API_BASE, apiFetch } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

export default function AccountsDashboardWidget() {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const canView = user?.role === 'Admin' || user?.permissions?.accounts?.view === true;

  useEffect(() => {
    if (!canView) return;

    apiFetch(`${API_BASE}/dashboard/stats/`)
      .then((res) => res.json())
      .then((stats) => {
        if (stats.accounts_stats) {
          setData(stats.accounts_stats);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load accounts widget stats:', err);
        setLoading(false);
      });
  }, [canView]);

  if (!canView) return null;

  if (loading) {
    return (
      <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm animate-pulse space-y-6">
        <div className="flex justify-between items-center">
          <div className="h-6 w-48 bg-slate-100 rounded"></div>
          <div className="h-6 w-24 bg-slate-100 rounded"></div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-slate-50 rounded-2xl"></div>
          ))}
        </div>
        <div className="h-48 bg-slate-50 rounded-2xl"></div>
      </div>
    );
  }

  if (!data) return null;

  // Calculate percentages
  const totalBilled = data.overall_billed || 1;
  const collectionPercentage = Math.round((data.overall_collected / totalBilled) * 100);
  const remainingPercentage = 100 - collectionPercentage;

  // Prepare chart heights
  const billingMax = Math.max(...data.billing_trend.map((d: any) => d.amount), 1);
  const collectionsMax = Math.max(...data.collections_trend.map((d: any) => d.amount), 1);
  const overallMax = Math.max(billingMax, collectionsMax, 1);

  return (
    <div className="bg-white rounded-3xl border border-slate-100 p-6 sm:p-8 shadow-[0_4px_20px_-4px_rgba(6,81,237,0.03)] space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-50 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-2xl">
            <Coins size={20} />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-lg tracking-tight">Financial Performance Overview</h3>
            <p className="text-slate-400 text-xs mt-0.5">Real-time ledger analytics & month-wise collections tracking</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 bg-slate-50 text-slate-600 text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700/50 bg-white dark:bg-slate-900">
          <BarChart3 size={14} className="text-slate-400" />
          Analytics Dashboard
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Billed Current Month */}
        <div className="bg-slate-50/60 p-5 rounded-2xl border border-slate-100 flex flex-col justify-between hover:bg-slate-50 hover:border-blue-100 transition-all duration-300">
          <div>
            <h4 className="text-slate-400 text-[11px] font-bold uppercase tracking-wider mb-1 flex items-center gap-1">
              <Receipt size={12} className="text-blue-500" /> Billed (This Month)
            </h4>
            <p className="text-xl font-black font-mono text-slate-900 mt-1">
              Rs. {Number(data.current_month_billed).toLocaleString()}
            </p>
          </div>
          <div className="text-[10px] text-slate-400 font-medium mt-3">
            Invoiced challans
          </div>
        </div>

        {/* Card 2: Collected Current Month */}
        <div className="bg-slate-50/60 p-5 rounded-2xl border border-slate-100 flex flex-col justify-between hover:bg-slate-50 hover:border-emerald-100 transition-all duration-300">
          <div>
            <h4 className="text-slate-400 text-[11px] font-bold uppercase tracking-wider mb-1 flex items-center gap-1">
              <Wallet size={12} className="text-emerald-500" /> Collected (This Month)
            </h4>
            <p className="text-xl font-black font-mono text-emerald-600 mt-1">
              Rs. {Number(data.current_month_collected).toLocaleString()}
            </p>
          </div>
          <div className="text-[10px] text-emerald-500 font-semibold mt-3 flex items-center gap-0.5">
            <ArrowUpRight size={10} /> Recieved to date
          </div>
        </div>

        {/* Card 3: Overall Collected */}
        <div className="bg-slate-50/60 p-5 rounded-2xl border border-slate-100 flex flex-col justify-between hover:bg-slate-50 hover:border-teal-100 transition-all duration-300">
          <div>
            <h4 className="text-slate-400 text-[11px] font-bold uppercase tracking-wider mb-1 flex items-center gap-1">
              <CreditCard size={12} className="text-teal-500" /> Total Received
            </h4>
            <p className="text-xl font-black font-mono text-slate-900 mt-1">
              Rs. {Number(data.overall_collected).toLocaleString()}
            </p>
          </div>
          <div className="text-[10px] text-slate-400 font-medium mt-3">
            Overall collections (all time)
          </div>
        </div>

        {/* Card 4: Outstanding Balance */}
        <div className="bg-slate-50/60 p-5 rounded-2xl border border-slate-100 flex flex-col justify-between hover:bg-slate-50 hover:border-rose-100 transition-all duration-300">
          <div>
            <h4 className="text-slate-400 text-[11px] font-bold uppercase tracking-wider mb-1 flex items-center gap-1">
              <TrendingUp size={12} className="text-rose-500" /> Total Outstanding
            </h4>
            <p className="text-xl font-black font-mono text-rose-600 mt-1">
              Rs. {Number(data.overall_remaining).toLocaleString()}
            </p>
          </div>
          <div className="text-[10px] text-rose-500 font-semibold mt-3">
            Remaining uncollected fees
          </div>
        </div>
      </div>

      {/* Progress Collected vs Remaining Gauge */}
      <div className="bg-slate-50/40 border border-slate-100 rounded-2xl p-5">
        <div className="flex justify-between items-center text-xs font-bold text-slate-600 uppercase tracking-wide mb-2.5">
          <span>Collected: {collectionPercentage}%</span>
          <span>Remaining: {remainingPercentage}%</span>
        </div>
        <div className="w-full h-4 bg-slate-200/70 rounded-full overflow-hidden flex shadow-inner">
          <div 
            style={{ width: `${collectionPercentage}%` }} 
            className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 shadow-sm"
          ></div>
          <div 
            style={{ width: `${remainingPercentage}%` }} 
            className="h-full bg-gradient-to-r from-rose-400 to-rose-300 shadow-sm"
          ></div>
        </div>
        <p className="text-slate-400 text-xs mt-2.5 text-center font-medium">
          Of the total billed fee <strong className="text-slate-700 font-bold">Rs. {Number(data.overall_billed).toLocaleString()}</strong>, 
          the firm has successfully recovered <strong className="text-emerald-600 font-extrabold">Rs. {Number(data.overall_collected).toLocaleString()}</strong>.
        </p>
      </div>

      {/* Billing vs Collections Monthwise Bar Chart */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-1">
          <h4 className="text-slate-700 text-xs font-bold uppercase tracking-wider">Billing vs Collections (Last 6 Months)</h4>
          <div className="flex items-center gap-4 text-xs font-semibold">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 bg-blue-500 rounded-sm"></span>
              <span className="text-slate-500">Invoiced Billing</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 bg-emerald-500 rounded-sm"></span>
              <span className="text-slate-500">Payments Collected</span>
            </div>
          </div>
        </div>

        <div className="border border-slate-100 rounded-2xl p-6 bg-slate-50/30">
          {data.billing_trend.length > 0 ? (
            <div className="flex items-end justify-between h-48 gap-3 sm:gap-6 pt-6">
              {data.billing_trend.map((b: any, idx: number) => {
                const c = data.collections_trend.find((t: any) => t.month === b.month) || { amount: 0 };
                
                const billHeight = (b.amount / overallMax) * 100;
                const collHeight = (c.amount / overallMax) * 100;

                return (
                  <div key={idx} className="flex flex-col items-center gap-2 flex-1 h-full justify-end group relative">
                    {/* Tooltip on Hover */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute bottom-full mb-2 bg-slate-900 text-white rounded-lg p-2.5 text-[10px] space-y-1 shadow-md z-20 pointer-events-none whitespace-nowrap">
                      <p className="font-bold text-slate-300">{b.month}</p>
                      <p className="flex justify-between gap-4">Billed: <span className="font-mono font-bold text-blue-400">Rs. {Number(b.amount).toLocaleString()}</span></p>
                      <p className="flex justify-between gap-4">Collected: <span className="font-mono font-bold text-emerald-400">Rs. {Number(c.amount).toLocaleString()}</span></p>
                    </div>

                    <div className="flex items-end justify-center gap-1 sm:gap-1.5 w-full h-full border-b border-slate-200/80 pb-0.5">
                      {/* Billing Bar (Blue) */}
                      <div className="w-[35%] bg-slate-100 rounded-t-sm overflow-hidden flex items-end h-full">
                        <div 
                          style={{ height: `${billHeight}%`, minHeight: billHeight > 0 ? '3px' : '0' }} 
                          className="w-full bg-gradient-to-t from-blue-600 to-blue-400 hover:from-blue-500 hover:to-blue-300 rounded-t-sm transition-all duration-300 shadow-sm"
                        ></div>
                      </div>
                      {/* Collections Bar (Emerald) */}
                      <div className="w-[35%] bg-slate-100 rounded-t-sm overflow-hidden flex items-end h-full">
                        <div 
                          style={{ height: `${collHeight}%`, minHeight: collHeight > 0 ? '3px' : '0' }} 
                          className="w-full bg-gradient-to-t from-emerald-600 to-emerald-400 hover:from-emerald-500 hover:to-emerald-300 rounded-t-sm transition-all duration-300 shadow-sm"
                        ></div>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 whitespace-nowrap mt-1">{b.month.split(' ')[0]}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center text-slate-400 italic text-sm">
              No recent transaction trends available
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
