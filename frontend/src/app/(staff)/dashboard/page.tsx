'use client';

import { useState, useEffect } from 'react';
import { 
  Briefcase, 
  Users, 
  Calendar, 
  CheckSquare,
  Receipt,
  TrendingUp
} from 'lucide-react';
import { API_BASE, apiFetch } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { MonthlyRevenueChart, CaseStatusChart } from '@/components/dashboard/DashboardCharts';
import { 
  DailyTasks, 
  RecentActivity, 
  TodaysHearingsList, 
  RecentCasesTable,
  CalendarWidget
} from '@/components/dashboard/DashboardWidgets';

function formatCurrency(amount: number) {
  if (amount == null) return 'Rs 0';
  if (amount >= 1000000) return `Rs ${(amount / 1000000).toFixed(1)}M`;
  if (amount >= 1000) return `Rs ${(amount / 1000).toFixed(1)}K`;
  return `Rs ${amount.toLocaleString()}`;
}

function LiveClock() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const hours = time.getHours();
  const minutes = time.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  const displayMinutes = minutes.toString().padStart(2, '0');

  return (
    <div className="flex items-end gap-2 text-blue-600 mt-2">
      <div className="text-4xl md:text-6xl font-black tracking-tight leading-none drop-shadow-sm">
        {displayHours}:{displayMinutes}
      </div>
      <div className="text-lg md:text-2xl font-bold mb-1 md:mb-2 opacity-80">
        {ampm}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState<any>({
    active_cases: 0,
    closed_cases: 0,
    pending_cases: 0,
    total_clients: 0,
    todays_hearings: 0,
    total_revenue: 0,
    pending_tasks: 0,
    accounts_stats: {
      collections_trend: [],
      overall_remaining: 0
    }
  });

  const fetchStats = () => {
    apiFetch(`${API_BASE}/dashboard/stats/`)
      .then(res => res.json())
      .then(data => {
        if (data && typeof data === 'object' && 'active_cases' in data) {
          setStats((prev: any) => ({ ...prev, ...data }));
        }
      })
      .catch(err => {
        console.error('Failed to fetch dashboard stats:', err);
      });
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const { user } = useAuth();
  const hasAccountsAccess = user?.role === 'Admin' || user?.permissions?.accounts?.view;

  return (
    <div className="w-full max-w-[1600px] mx-auto space-y-6 animate-fade-in pb-20">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-50 via-white to-blue-50/50 rounded-2xl p-6 md:p-8 border border-blue-100 flex justify-between items-center relative overflow-hidden shadow-sm">
        <div className="z-10 flex flex-col gap-1">
          <p className="text-slate-500 text-sm md:text-base font-semibold uppercase tracking-wider">Welcome back</p>
          <p className="text-slate-800 text-xl md:text-2xl font-bold">Here's what's happening at the firm today.</p>
          <LiveClock />
        </div>
        
        {/* Scale Illustration placeholder for the UI */}
        <div className="hidden lg:block absolute right-12 bottom-0 h-full w-64 opacity-90 pointer-events-none">
          <div className="relative w-full h-full">
            <svg viewBox="0 0 200 100" className="absolute bottom-0 right-0 w-full h-full text-blue-600">
              <path d="M100 20 L100 80 M40 20 L160 20 M30 50 Q40 80 50 50 L30 50 M150 50 Q160 80 170 50 L150 50 M70 80 L130 80" stroke="currentColor" strokeWidth="2" fill="none" opacity="0.2"/>
              <circle cx="100" cy="20" r="4" fill="currentColor" opacity="0.3"/>
            </svg>
            <div className="absolute right-4 bottom-2 w-16 h-20 bg-emerald-100/50 rounded-t-full blur-xl"></div>
            <div className="absolute right-20 top-4 w-24 h-24 bg-blue-100/50 rounded-full blur-xl"></div>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* Active Cases */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-bold text-slate-500">Active Cases</span>
            <div className="bg-blue-600 text-white p-1.5 rounded-lg"><Briefcase size={16} /></div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900">{stats.active_cases}</div>
        </div>
        
        {/* Today's Hearings */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-bold text-slate-500">Today's Hearings</span>
            <div className="bg-amber-500 text-white p-1.5 rounded-lg"><Calendar size={16} /></div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900">{stats.todays_hearings}</div>
        </div>

        {/* Pending Tasks */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-bold text-slate-500">Pending Tasks</span>
            <div className="bg-rose-500 text-white p-1.5 rounded-lg"><CheckSquare size={16} /></div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900">{stats.pending_tasks}</div>
        </div>

        {/* Clients */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-bold text-slate-500">Clients</span>
            <div className="bg-indigo-500 text-white p-1.5 rounded-lg"><Users size={16} /></div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900">{stats.total_clients}</div>
        </div>

        {/* Revenue */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-bold text-slate-500">Revenue</span>
            <div className="bg-emerald-500 text-white p-1.5 rounded-lg"><TrendingUp size={16} /></div>
          </div>
          <div className="text-xl font-extrabold text-slate-900">
            {hasAccountsAccess ? formatCurrency(stats.total_revenue) : <span className="text-sm text-slate-400">Restricted</span>}
          </div>
        </div>

        {/* Outstanding */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-bold text-slate-500">Outstanding Payments</span>
            <div className="bg-amber-400 text-white p-1.5 rounded-lg"><Receipt size={16} /></div>
          </div>
          <div className="text-xl font-extrabold text-slate-900">
            {hasAccountsAccess ? formatCurrency(stats.accounts_stats?.overall_remaining || 0) : <span className="text-sm text-slate-400">Restricted</span>}
          </div>
        </div>
      </div>

      {/* Main Grid Content */}
      <div className="flex flex-col gap-6">
        
        {/* Top Row: Charts & Calendar */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5">
            {hasAccountsAccess ? (
              <MonthlyRevenueChart trendData={stats.accounts_stats?.collections_trend || []} />
            ) : (
              <div className="h-full min-h-[300px] bg-white rounded-2xl border border-slate-200 flex flex-col items-center justify-center text-slate-400">
                <TrendingUp size={32} className="mb-2 opacity-50" />
                <p className="text-sm font-medium">Financial data restricted</p>
              </div>
            )}
          </div>
          <div className="lg:col-span-4">
            <CaseStatusChart active={stats.active_cases} closed={stats.closed_cases} pending={stats.pending_cases} />
          </div>
          <div className="lg:col-span-3">
            <CalendarWidget />
          </div>
        </div>

        {/* Middle Row: Cases & Hearings */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8">
            <RecentCasesTable />
          </div>
          <div className="lg:col-span-4">
            <TodaysHearingsList />
          </div>
        </div>

        {/* Bottom Row: Tasks & Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8">
            <DailyTasks />
          </div>
          <div className="lg:col-span-4">
            <RecentActivity />
          </div>
        </div>

      </div>
    </div>
  );
}
