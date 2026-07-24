import React, { useEffect, useState } from 'react';
import { useReportData } from '../hooks/useReportData';
import { ReportFilterBar } from './ReportFilterBar';
import { AppShellSkeleton } from '@/components/SkeletonLoaders';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Legend
} from 'recharts';

export function ProductivityReports() {
  const { data, loading, error, fetchReport } = useReportData('productivity');

  const handleFilterChange = (filters: Record<string, any>) => {
    fetchReport(filters);
  };

  useEffect(() => {
    fetchReport({});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) return <AppShellSkeleton />;
  if (error) return <div className="text-red-500 p-4 bg-red-50 dark:bg-red-900/20 rounded-xl">{error}</div>;
  if (!data) return null;

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4 border-b border-slate-200 dark:border-slate-800 pb-4 mb-2">
        <ReportFilterBar onFilterChange={handleFilterChange} showStaffFilter={true} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Assigned Cases per Staff</h3>
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip cursor={{ fill: 'transparent' }} />
                <Bar dataKey="cases" name="Cases" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Deadlines: Completed vs Pending</h3>
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip cursor={{ fill: 'transparent' }} />
                <Legend />
                <Bar dataKey="completed" name="Completed" fill="#10b981" radius={[4, 4, 0, 0]} barSize={40} />
                <Bar dataKey="pending" name="Pending" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
