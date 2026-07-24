import React, { useEffect, useState } from 'react';
import { useReportData } from '../hooks/useReportData';
import { ReportFilterBar } from './ReportFilterBar';
import { ExportToolbar } from './ExportToolbar';
import { AppShellSkeleton } from '@/components/SkeletonLoaders';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip
} from 'recharts';
import { IndianRupee } from 'lucide-react';

export function FinancialReports() {
  const { data, loading, error, fetchReport } = useReportData('financials');
  const [currentFilters, setCurrentFilters] = useState<Record<string, any>>({});

  const handleFilterChange = (filters: Record<string, any>) => {
    setCurrentFilters(filters);
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
        <ReportFilterBar onFilterChange={handleFilterChange} showStaffFilter={false} />
        <ExportToolbar endpoint="financials" filters={currentFilters} filename="Financial_Overview" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* KPI Cards */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors flex items-center gap-4">
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl">
            <IndianRupee size={28} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Total Billed</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white">
              Rs {Number(data.kpis.total_billed).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h3>
          </div>
        </div>
        
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors flex items-center gap-4">
          <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-xl">
            <IndianRupee size={28} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Total Collected</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white">
              Rs {Number(data.kpis.total_collected).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h3>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors flex items-center gap-4">
          <div className="p-4 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 rounded-xl">
            <IndianRupee size={28} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Outstanding</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white">
              Rs {Number(data.kpis.total_outstanding).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h3>
          </div>
        </div>

        {/* Revenue by Practice Area */}
        <div className="md:col-span-3 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Collected Revenue by Practice Area</h3>
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.revenue_by_category}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="category" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} tickFormatter={(value) => `Rs ${value}`} />
                <Tooltip 
                  cursor={{ fill: 'transparent' }} 
                  formatter={(value: any) => `Rs ${Number(value).toLocaleString()}`}
                />
                <Bar dataKey="revenue" fill="#10b981" radius={[4, 4, 0, 0]} barSize={50} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
