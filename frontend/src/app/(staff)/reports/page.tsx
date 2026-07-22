'use client';

import { useState, useEffect, useRef } from 'react';
import { API_BASE, apiFetch } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import { Printer, Download, Shield, Briefcase, Users, TrendingUp, DollarSign } from 'lucide-react';
import { useUI } from '@/context/UIContext';
import { AppShellSkeleton } from '@/components/SkeletonLoaders';

const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

function fmt(n: any) { return `PKR ${parseFloat(n ?? 0).toLocaleString()}`; }

export default function ReportsPage() {
  const { user } = useAuth();
  const { toast } = useUI();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [ledger, setLedger] = useState<any>(null);
  const printRef = useRef<HTMLDivElement>(null);

  const canViewReports = user?.role === 'Admin' || user?.permissions?.reports?.view === true;
  const canPrintReports = user?.role === 'Admin' || user?.permissions?.reports?.print === true;

  useEffect(() => {
    if (!canViewReports) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        const [statsRes, ledgerRes] = await Promise.all([
          apiFetch(`${API_BASE}/dashboard/stats/`),
          apiFetch(`${API_BASE}/accounts/ledger/`)
        ]);

        if (statsRes.ok) setStats(await statsRes.json());
        if (ledgerRes.ok) setLedger(await ledgerRes.json());
      } catch (error) {
        toast.error('Failed to load reports data.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, canViewReports, toast]);

  const handlePrint = () => {
    window.print();
  };

  const handleExportPDF = async () => {
    if (!printRef.current) return;
    
    // We dynamically import html2pdf so it only loads on the client side
    const html2pdf = (await import('html2pdf.js')).default;
    
    const element = printRef.current;
    const opt: any = {
      margin:       10,
      filename:     `LawFirm_Report_${new Date().toISOString().split('T')[0]}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    
    // Temporarily hide action buttons during PDF generation
    const actionButtons = document.getElementById('report-actions');
    if (actionButtons) actionButtons.style.display = 'none';
    
    await html2pdf().set(opt).from(element).save();
    
    if (actionButtons) actionButtons.style.display = 'flex';
  };

  if (!canViewReports) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <Shield size={48} className="text-slate-300 dark:text-slate-600 mb-4" />
        <h2 className="text-xl font-bold text-slate-700 dark:text-slate-300">Access Denied</h2>
        <p className="text-slate-500 dark:text-slate-400">You do not have permission to view reports.</p>
      </div>
    );
  }

  if (loading || !stats || !ledger) {
    return <AppShellSkeleton />;
  }

  const caseStatusData = [
    { name: 'Active', value: stats.active_cases || 0 },
    { name: 'Pending', value: stats.pending_cases || 0 },
    { name: 'Closed', value: stats.closed_cases || 0 },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-7xl mx-auto" ref={printRef}>
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">System Reports</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Comprehensive overview of firm performance and finances</p>
        </div>
        
        {canPrintReports && (
          <div id="report-actions" className="flex items-center gap-3 print:hidden">
            <button 
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm font-semibold rounded-xl transition-colors"
            >
              <Printer size={16} /> Print
            </button>
            <button 
              onClick={handleExportPDF}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm"
            >
              <Download size={16} /> Export PDF
            </button>
          </div>
        )}
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400">Total Revenue</h3>
            <div className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center">
              <DollarSign size={16} className="text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{fmt(ledger.total_received)}</p>
          <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-1">This Month: {fmt(ledger.this_month_revenue)}</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400">Net Profit</h3>
            <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
              <TrendingUp size={16} className="text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{fmt(ledger.net_profit)}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">Revenue - Expenses</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400">Active Cases</h3>
            <div className="w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center">
              <Briefcase size={16} className="text-indigo-600 dark:text-indigo-400" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.active_cases}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">{stats.closed_cases} Closed</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400">Total Clients</h3>
            <div className="w-8 h-8 rounded-full bg-orange-50 dark:bg-orange-900/30 flex items-center justify-center">
              <Users size={16} className="text-orange-600 dark:text-orange-400" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.total_clients}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">Registered Clients</p>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue vs Expenses */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-6">Financial Cash Flow</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ledger.revenue_chart}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} tickFormatter={(val) => `Rs ${val / 1000}k`} />
                <Tooltip 
                  formatter={(value: any) => fmt(value)}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="revenue" name="Revenue" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expenses" name="Expenses" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Paying Clients */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-6">Top Clients by Revenue</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ledger.top_paying_clients} layout="vertical" margin={{ left: 50 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#334155" opacity={0.2} />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} tickFormatter={(val) => `${val / 1000}k`} />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} width={80} />
                <Tooltip 
                  formatter={(value: any) => fmt(value)}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="amount" fill="#3b82f6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Practice Area Revenue */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-6">Revenue by Practice Area</h3>
          <div className="h-64 flex items-center justify-center">
            {ledger.revenue_by_practice_area?.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={ledger.revenue_by_practice_area}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="amount"
                    nameKey="category"
                    labelLine={false}
                  >
                    {ledger.revenue_by_practice_area.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: any) => fmt(value)} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-slate-400">No data available.</p>
            )}
          </div>
        </div>

        {/* Case Status Distribution */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-6">Case Status Distribution</h3>
          <div className="h-64 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={caseStatusData}
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  dataKey="value"
                  nameKey="name"
                  label={({ name, percent }: any) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                  labelLine={true}
                >
                  {caseStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
