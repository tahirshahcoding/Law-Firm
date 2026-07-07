'use client';

import { useState, useEffect } from 'react';
import { 
  Briefcase, 
  Users, 
  Calendar, 
  TrendingUp, 
  Sun, 
  Sunset, 
  Moon, 
  ArrowUpRight
} from 'lucide-react';
import { API_BASE, apiFetch } from '@/lib/api';
import DailyDiaryWidget from '@/components/DailyDiaryWidget';
import CauseListWidget from '@/components/CauseListWidget';
import AccountsDashboardWidget from '@/components/AccountsDashboardWidget';
import { useAuth } from '@/context/AuthContext';
import { StatsCardSkeleton } from '@/components/SkeletonLoaders';

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    active_cases: 0,
    total_clients: 0,
    todays_hearings: 0,
    total_revenue: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch(`${API_BASE}/dashboard/stats/`)
      .then(res => res.json())
      .then(data => {
        if (data && typeof data === 'object' && 'active_cases' in data) {
          setStats(data);
        } else {
          console.warn('Unexpected dashboard stats format:', data);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch dashboard stats:', err);
        setLoading(false);
      });
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const getGreetingIcon = () => {
    const hour = new Date().getHours();
    if (hour < 12) return <Sun className="text-amber-500 shrink-0" size={22} />;
    if (hour < 17) return <Sunset className="text-orange-500 shrink-0" size={22} />;
    return <Moon className="text-indigo-400 shrink-0" size={22} />;
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-500">
      {/* Premium Welcome Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-50/80 via-indigo-50/50 to-sky-50/30 p-6 sm:p-8 rounded-3xl border border-blue-100/60 shadow-[0_2px_12px_-3px_rgba(59,130,246,0.08)]">
        {/* Floating gradient circles */}
        <div className="absolute -right-8 -top-8 w-48 h-48 bg-blue-400/10 rounded-full blur-2xl pointer-events-none"></div>
        <div className="absolute right-20 bottom-0 w-32 h-32 bg-indigo-300/15 rounded-full blur-xl pointer-events-none"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              {getGreetingIcon()}
              <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight">
                {getGreeting()}, {user?.username || 'Member'}!
              </h2>
            </div>
            <p className="text-slate-500 max-w-xl leading-relaxed text-sm sm:text-base font-medium">
              Here is what's happening at the firm today. You have <strong className="text-blue-600 font-semibold">{stats.todays_hearings} hearings</strong> scheduled and <strong className="text-blue-600 font-semibold">{stats.active_cases} active cases</strong> to manage.
            </p>
          </div>
          
          {/* User Role Badge */}
          {user?.role && (
            <div className="shrink-0 flex items-center gap-2 bg-white/80 border border-slate-200/60 px-4 py-2 rounded-2xl shadow-sm w-fit">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse"></span>
              <span className="text-xs font-bold text-slate-700 tracking-wide uppercase">{user.role} Workspace</span>
            </div>
          )}
        </div>
      </div>
      
      {/* Stat Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Active Cases Card */}
        {loading ? (
          <StatsCardSkeleton />
        ) : (
          <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-100 hover:border-blue-200/50 hover:shadow-lg hover:shadow-blue-500/[0.02] hover:-translate-y-1 transition-all duration-300 group cursor-pointer relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-blue-500 scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300"></div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-xs text-slate-400 uppercase tracking-wider">Active Cases</h3>
              <div className="p-2 bg-blue-50 text-blue-600 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
                <Briefcase size={18} />
              </div>
            </div>
            <p className="text-3xl sm:text-4xl font-extrabold text-slate-800 font-mono tracking-tight">{stats.active_cases}</p>
            <div className="mt-4 flex items-center text-xs text-emerald-600 font-semibold">
              <TrendingUp size={14} className="mr-1" />
              <span>Tracked Live</span>
            </div>
          </div>
        )}

        {/* Total Clients Card */}
        {loading ? (
          <StatsCardSkeleton />
        ) : (
          <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-100 hover:border-indigo-200/50 hover:shadow-lg hover:shadow-indigo-500/[0.02] hover:-translate-y-1 transition-all duration-300 group cursor-pointer relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-indigo-500 scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300"></div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-xs text-slate-400 uppercase tracking-wider">Total Clients</h3>
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-300">
                <Users size={18} />
              </div>
            </div>
            <p className="text-3xl sm:text-4xl font-extrabold text-slate-800 font-mono tracking-tight">{stats.total_clients}</p>
            <div className="mt-4 flex items-center text-xs text-emerald-600 font-semibold">
              <TrendingUp size={14} className="mr-1" />
              <span>Registered</span>
            </div>
          </div>
        )}

        {/* Today's Hearings Card */}
        {loading ? (
          <StatsCardSkeleton />
        ) : (
          <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-100 hover:border-rose-200/50 hover:shadow-lg hover:shadow-rose-500/[0.02] hover:-translate-y-1 transition-all duration-300 group cursor-pointer relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-rose-500 scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300"></div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-xs text-slate-400 uppercase tracking-wider">Hearings Today</h3>
              <div className="p-2 bg-rose-50 text-rose-600 rounded-xl group-hover:bg-rose-600 group-hover:text-white transition-colors duration-300 relative">
                {stats.todays_hearings > 0 && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-500 border border-white rounded-full animate-ping"></span>
                )}
                <Calendar size={18} />
              </div>
            </div>
            <p className="text-3xl sm:text-4xl font-extrabold text-slate-800 font-mono tracking-tight">{stats.todays_hearings}</p>
            <div className={`mt-4 flex items-center text-xs font-semibold ${stats.todays_hearings > 0 ? 'text-rose-500 animate-pulse' : 'text-slate-400'}`}>
              <span>{stats.todays_hearings > 0 ? 'Action Required' : 'All Clear'}</span>
            </div>
          </div>
        )}

        {/* Total Revenue Card */}
        {(user?.role === 'Admin' || user?.permissions?.manage_accounts) && (
          loading ? (
            <StatsCardSkeleton />
          ) : (
            <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-100 hover:border-emerald-200/50 hover:shadow-lg hover:shadow-emerald-500/[0.02] hover:-translate-y-1 transition-all duration-300 group cursor-pointer relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-emerald-500 scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300"></div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-xs text-slate-400 uppercase tracking-wider">Total Revenue</h3>
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl group-hover:bg-emerald-600 group-hover:text-white transition-colors duration-300">
                  <TrendingUp size={18} />
                </div>
              </div>
              <p className="text-xl sm:text-2xl font-extrabold text-slate-800 font-mono tracking-tight">Rs. {Number(stats.total_revenue || 0).toLocaleString()}</p>
              <div className="mt-4 flex items-center text-xs text-emerald-600 font-semibold">
                <ArrowUpRight size={14} className="mr-0.5" />
                <span>Overall Billed</span>
              </div>
            </div>
          )
        )}
      </div>

      {/* Embedded Daily Diary & Cause List Widgets */}
      {(() => {
        const canViewCauseList = user?.role === 'Admin' || user?.permissions?.cause_list?.view === true;
        return (
          <div className={`grid grid-cols-1 ${canViewCauseList ? 'lg:grid-cols-2' : 'lg:grid-cols-1'} gap-6 items-stretch`}>
            <div className="[&>div]:mt-0 mt-8">
              <DailyDiaryWidget />
            </div>
            {canViewCauseList && (
              <div className="mt-8">
                <CauseListWidget />
              </div>
            )}
          </div>
        );
      })()}

      {/* Embedded Accounts Widget */}
      {(() => {
        const canViewAccounts = user?.role === 'Admin' || user?.permissions?.accounts?.view === true;
        return canViewAccounts ? (
          <div className="mt-8">
            <AccountsDashboardWidget />
          </div>
        ) : null;
      })()}
    </div>
  );
}
