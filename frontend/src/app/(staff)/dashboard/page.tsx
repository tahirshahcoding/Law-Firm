'use client';

import { useState, useEffect } from 'react';
import { Briefcase, Users, Calendar, TrendingUp } from 'lucide-react';
import { API_BASE, apiFetch } from '@/lib/api';
import DailyDiaryWidget from '@/components/DailyDiaryWidget';
import { useAuth } from '@/context/AuthContext';

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
        setStats(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch dashboard stats:', err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="relative overflow-hidden bg-white p-8 rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-slate-100">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-full blur-3xl opacity-50 -mr-16 -mt-16 pointer-events-none"></div>
        <h2 className="text-2xl font-bold mb-2 text-slate-900 tracking-tight">Welcome back!</h2>
        <p className="text-slate-500 max-w-xl leading-relaxed">
          Here is what's happening at the firm today. You have <strong className="text-blue-600 font-medium">{stats.todays_hearings} hearings</strong> scheduled and <strong className="text-blue-600 font-medium">{stats.active_cases} active cases</strong> to manage.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Active Cases Card */}
        <div className="bg-white p-6 rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] border border-slate-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group cursor-pointer">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-sm text-slate-500 uppercase tracking-wider">Active Cases</h3>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
              <Briefcase size={20} />
            </div>
          </div>
          {loading ? (
            <div className="h-10 w-16 bg-slate-100 animate-pulse rounded mt-2"></div>
          ) : (
            <p className="text-4xl font-bold text-slate-900 mt-2 font-mono">{stats.active_cases}</p>
          )}
          <div className="mt-4 flex items-center text-sm text-emerald-600 font-medium">
            <TrendingUp size={16} className="mr-1" />
            <span>Tracked</span>
          </div>
        </div>

        {/* Recent Clients Card */}
        <div className="bg-white p-6 rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] border border-slate-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group cursor-pointer">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-sm text-slate-500 uppercase tracking-wider">Total Clients</h3>
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-300">
              <Users size={20} />
            </div>
          </div>
          {loading ? (
            <div className="h-10 w-16 bg-slate-100 animate-pulse rounded mt-2"></div>
          ) : (
            <p className="text-4xl font-bold text-slate-900 mt-2 font-mono">{stats.total_clients}</p>
          )}
          <div className="mt-4 flex items-center text-sm text-emerald-600 font-medium">
            <TrendingUp size={16} className="mr-1" />
            <span>Registered</span>
          </div>
        </div>

        {/* Today's Hearings Card */}
        <div className="bg-white p-6 rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] border border-slate-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group cursor-pointer">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-sm text-slate-500 uppercase tracking-wider">Hearings Today</h3>
            <div className="p-2 bg-rose-50 text-rose-600 rounded-lg group-hover:bg-rose-600 group-hover:text-white transition-colors duration-300">
              <Calendar size={20} />
            </div>
          </div>
          {loading ? (
            <div className="h-10 w-16 bg-slate-100 animate-pulse rounded mt-2"></div>
          ) : (
            <p className="text-4xl font-bold text-slate-900 mt-2 font-mono">{stats.todays_hearings}</p>
          )}
          <div className="mt-4 flex items-center text-sm text-rose-500 font-medium">
            <span>High priority</span>
          </div>
        </div>

        {/* Total Revenue Card */}
        {(user?.role === 'Admin' || user?.permissions?.manage_accounts) && (
          <div className="bg-white p-6 rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] border border-slate-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group cursor-pointer">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-sm text-slate-500 uppercase tracking-wider">Total Revenue</h3>
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg group-hover:bg-emerald-600 group-hover:text-white transition-colors duration-300">
                <TrendingUp size={20} />
              </div>
            </div>
            {loading ? (
              <div className="h-10 w-16 bg-slate-100 animate-pulse rounded mt-2"></div>
            ) : (
              <p className="text-3xl font-bold text-slate-900 mt-2 font-mono">Rs. {Number(stats.total_revenue || 0).toLocaleString()}</p>
            )}
            <div className="mt-4 flex items-center text-sm text-emerald-600 font-medium">
              <span>Overall Billed</span>
            </div>
          </div>
        )}
      </div>

      {/* Embedded Daily Diary Widget */}
      <DailyDiaryWidget />
    </div>
  );
}
