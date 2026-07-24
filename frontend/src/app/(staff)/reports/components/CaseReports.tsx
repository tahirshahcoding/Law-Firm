import React, { useEffect } from 'react';
import { useReportData } from '../hooks/useReportData';
import { ReportFilterBar } from './ReportFilterBar';
import { ExportToolbar } from './ExportToolbar';
import { AppShellSkeleton } from '@/components/SkeletonLoaders';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';

const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

export function CaseReports() {
  const { data: caseData, loading: caseLoading, error: caseError, fetchReport: fetchCases } = useReportData('cases');
  const { data: hearingData, loading: hearingLoading, fetchReport: fetchHearings } = useReportData('cases/hearings');
  
  const [currentFilters, setCurrentFilters] = React.useState<Record<string, any>>({});

  const handleFilterChange = (filters: Record<string, any>) => {
    setCurrentFilters(filters);
    fetchCases(filters);
    fetchHearings(filters);
  };

  useEffect(() => {
    fetchCases({});
    fetchHearings({});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (caseLoading || hearingLoading) return <AppShellSkeleton />;
  if (caseError) return <div className="text-red-500 p-4 bg-red-50 dark:bg-red-900/20 rounded-xl">{caseError}</div>;
  if (!caseData || !hearingData) return null;

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4 border-b border-slate-200 dark:border-slate-800 pb-4 mb-2">
        <ReportFilterBar onFilterChange={handleFilterChange} showStaffFilter={true} />
        <ExportToolbar endpoint="cases" filters={currentFilters} filename="Cases_Overview" />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Case Status Distribution */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Case Status Distribution</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={caseData.status_distribution}
                  cx="50%" cy="50%"
                  innerRadius={60} outerRadius={90}
                  dataKey="count" nameKey="status"
                  label={({ status, percent }: any) => `${status} ${((percent || 0) * 100).toFixed(0)}%`}
                >
                  {caseData.status_distribution.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Hearing Stages */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Hearing Stages</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={hearingData.hearing_stages}
                  cx="50%" cy="50%"
                  outerRadius={90}
                  dataKey="count" nameKey="hearing_stage"
                >
                  {hearingData.hearing_stages.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Court Load */}
        <div className="md:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Case Load by Court</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={caseData.court_load}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="court__name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: 'transparent' }} />
                <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
