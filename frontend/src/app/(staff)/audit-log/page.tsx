'use client';

import { useState, useEffect } from 'react';
import { Activity, Clock, User, ShieldAlert, FileText, FileDown, Eye, FileSignature, DollarSign, Calendar as CalendarIcon, CheckSquare, MessageSquare } from 'lucide-react';
import { API_BASE, apiFetch } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { TableSkeleton } from '@/components/SkeletonLoaders';
import useSWR from 'swr';
import { swrFetcher } from '@/lib/fetcher';

export default function AuditLogPage() {
  const [period, setPeriod] = useState('all');
  const { user } = useAuth();
  const isAdmin = user && ['Admin', 'Senior Partner'].includes(user.role || '');

  // Redirect if not admin
  useEffect(() => {
    if (user && !isAdmin) {
      window.location.href = '/';
    }
  }, [user, isAdmin]);

  const { data, isLoading: loading } = useSWR(
    isAdmin ? `${API_BASE}/audit-log/?period=${period}` : null,
    swrFetcher
  );
  
  const logs = Array.isArray(data) ? data : [];

  const getActionColor = (action: string) => {
    switch (action.toLowerCase()) {
      case 'created': return 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800';
      case 'updated': return 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800';
      case 'deleted': return 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/30 border-rose-200 dark:border-rose-800';
      default: return 'text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700';
    }
  };

  const getModelIcon = (modelName: string) => {
    switch (modelName.toLowerCase()) {
      case 'case': return <FileText size={16} className="text-blue-500" />;
      case 'hearing': return <Eye size={16} className="text-purple-500" />;
      case 'invoice': return <FileSignature size={16} className="text-emerald-500" />;
      case 'deadline': return <Clock size={16} className="text-amber-500" />;
      case 'payment': return <DollarSign size={16} className="text-emerald-500" />;
      case 'expense': return <DollarSign size={16} className="text-rose-500" />;
      case 'task': return <CheckSquare size={16} className="text-blue-500" />;
      case 'consultationrequest': return <MessageSquare size={16} className="text-purple-500" />;
      case 'calendarevent': return <CalendarIcon size={16} className="text-amber-500" />;
      case 'casetimeline': return <Activity size={16} className="text-slate-500" />;
      default: return <FileDown size={16} className="text-slate-500" />;
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <ShieldAlert className="text-rose-500" />
            System Audit Log
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm sm:text-base">Record of all system activities. Visible only to Admins.</p>
        </div>
        <div className="w-full sm:w-auto">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="w-full sm:w-auto px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none text-sm font-medium text-slate-700 dark:text-slate-300 transition-colors"
          >
            <option value="all">All Time</option>
            <option value="daily">Last 24 Hours</option>
            <option value="weekly">Last 7 Days</option>
            <option value="monthly">Last 30 Days</option>
          </select>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] dark:shadow-none border border-slate-100 dark:border-slate-800 overflow-hidden transition-colors">
        {loading ? (
          <TableSkeleton />
        ) : logs.length === 0 ? (
          <div className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
            <Activity className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-600 mb-3" />
            <p className="text-slate-900 dark:text-white font-medium mb-1">No activity logged yet</p>
            <p className="text-sm">Modifications to records will appear here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 transition-colors">
                  <th className="px-6 py-4 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Timestamp</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">User</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Action</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Entity</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider w-1/3">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {logs.map((log: any, idx: number) => (
                  <tr key={`${log.id}-${idx}`} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 font-mono">
                        <Clock size={14} className="text-slate-400 dark:text-slate-500" />
                        {new Date(log.date).toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-700 dark:text-blue-400 font-bold text-[10px]">
                          {(log.user || 'S').charAt(0).toUpperCase()}
                        </div>
                        <span className="text-sm font-medium text-slate-900 dark:text-white">{log.user}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getActionColor(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {getModelIcon(log.model)}
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{log.model}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-slate-600 dark:text-slate-400">{log.details}</p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
