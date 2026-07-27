'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { API_BASE, apiFetch } from '@/lib/api';
import { CASE_STATUSES, CASE_CATEGORIES } from '@/lib/constants';
import { PrintFriendlyReport } from './components/PrintFriendlyReport';
import { ExportToolbar } from './components/ExportToolbar';
import { Printer, FileText, RotateCcw, Play, ShieldCheck, Calendar, Briefcase, Gavel, CheckCircle2, Users, Filter } from 'lucide-react';

export default function ReportsPage() {
  const { user } = useAuth();
  
  // Permission checks
  const canViewFinancial = user?.role === 'Admin' || user?.role === 'Senior Partner' || user?.role === 'Accountant';
  const canViewProductivity = user?.role === 'Admin' || user?.role === 'Senior Partner' || user?.role === 'Manager';

  const [selectedReportType, setSelectedReportType] = useState<string>('master');
  const [courtsList, setCourtsList] = useState<any[]>([]);
  const [staffList, setStaffList] = useState<any[]>([]);
  
  const [criteria, setCriteria] = useState<{
    start_date: string;
    end_date: string;
    category: string;
    status: string;
    staff_id: string;
    court: string;
    scope: 'overview' | 'detailed';
  }>({
    start_date: '',
    end_date: '',
    category: '',
    status: '',
    staff_id: '',
    court: '',
    scope: 'overview',
  });

  const [generatedReport, setGeneratedReport] = useState<{
    type: string;
    filters: Record<string, any>;
    label: string;
    summaryText?: string;
  } | null>(null);

  useEffect(() => {
    apiFetch(`${API_BASE}/courts/?limit=1000`)
      .then(res => res.json())
      .then(data => setCourtsList(Array.isArray(data) ? data : (data.results || [])))
      .catch(err => console.error("Failed to load courts:", err));

    apiFetch(`${API_BASE}/users/advocates/`)
      .then(res => res.json())
      .then(data => setStaffList(Array.isArray(data) ? data : (data.results || [])))
      .catch(err => console.error("Failed to load staff:", err));
  }, []);

  const reportTypes = [
    { id: 'master', title: 'Master Comprehensive Report', allowed: true },
    { id: 'accounts', title: 'Accounts & Financial Ledger Report', allowed: canViewFinancial },
    { id: 'cases', title: 'Cases & Litigation Overview Report', allowed: true },
    { id: 'status', title: 'Case Status Distribution Report', allowed: true },
    { id: 'hearings', title: 'Hearings & Cause List Report', allowed: true },
    { id: 'productivity', title: 'Staff Productivity & Deadlines Report', allowed: canViewProductivity },
  ];

  const handleCriteriaChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setCriteria({ ...criteria, [e.target.name]: e.target.value });
  };

  const applyDatePreset = (preset: 'week' | 'month' | 'last_month' | 'year' | 'all') => {
    const now = new Date();
    let start = '';
    let end = '';

    const formatDate = (d: Date) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    if (preset === 'week') {
      const today = new Date();
      const day = today.getDay();
      const diff = today.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
      const monday = new Date(today.getFullYear(), today.getMonth(), diff);
      start = formatDate(monday);
      end = formatDate(new Date());
    } else if (preset === 'month') {
      start = formatDate(new Date(now.getFullYear(), now.getMonth(), 1));
      end = formatDate(new Date(now.getFullYear(), now.getMonth() + 1, 0));
    } else if (preset === 'last_month') {
      start = formatDate(new Date(now.getFullYear(), now.getMonth() - 1, 1));
      end = formatDate(new Date(now.getFullYear(), now.getMonth(), 0));
    } else if (preset === 'year') {
      start = formatDate(new Date(now.getFullYear(), 0, 1));
      end = formatDate(new Date(now.getFullYear(), 11, 31));
    } else if (preset === 'all') {
      start = '';
      end = '';
    }

    setCriteria(prev => ({ ...prev, start_date: start, end_date: end }));
  };

  const handleReset = () => {
    setCriteria({
      start_date: '',
      end_date: '',
      category: '',
      status: '',
      staff_id: '',
      court: '',
      scope: 'overview',
    });
    setGeneratedReport(null);
  };

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    const activeReport = reportTypes.find(r => r.id === selectedReportType);
    if (!activeReport) return;

    const cleanFilters: Record<string, any> = {};
    const displayParts: string[] = [];

    cleanFilters.scope = criteria.scope;
    displayParts.push(`Depth: ${criteria.scope === 'detailed' ? 'Detailed Register' : 'Summary Overview'}`);

    if (criteria.start_date) {
      cleanFilters.start_date = criteria.start_date;
      displayParts.push(`From: ${criteria.start_date}`);
    }
    if (criteria.end_date) {
      cleanFilters.end_date = criteria.end_date;
      displayParts.push(`To: ${criteria.end_date}`);
    }
    if (criteria.category) {
      cleanFilters.category = criteria.category;
      displayParts.push(`Category: ${criteria.category}`);
    }
    if (criteria.status) {
      cleanFilters.status = criteria.status;
      displayParts.push(`Status: ${criteria.status}`);
    }
    if (criteria.court) {
      cleanFilters.court = criteria.court;
      const courtObj = courtsList.find(c => String(c.id) === String(criteria.court));
      displayParts.push(`Court: ${courtObj ? courtObj.name : criteria.court}`);
    }
    if (criteria.staff_id) {
      cleanFilters.staff_id = criteria.staff_id;
      const staffObj = staffList.find(s => String(s.id) === String(criteria.staff_id));
      const staffName = staffObj ? (staffObj.first_name || staffObj.last_name ? `${staffObj.first_name} ${staffObj.last_name}`.trim() : staffObj.username) : criteria.staff_id;
      displayParts.push(`Staff/Advocate: ${staffName}`);
    }

    setGeneratedReport({
      type: selectedReportType,
      filters: cleanFilters,
      label: activeReport.title,
      summaryText: displayParts.join(' | '),
    });
  };

  const handlePrint = () => {
    window.print();
  };

  // Determine export endpoint for CSV toolbar
  const getExportEndpoint = () => {
    if (!generatedReport) return 'cases';
    if (generatedReport.type === 'accounts') return 'financials';
    if (generatedReport.type === 'hearings') return 'cases/hearings';
    if (generatedReport.type === 'productivity') return 'productivity';
    return 'cases';
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900 pb-16 print:bg-white print:pb-0 animate-in fade-in duration-500">
      <div className="w-full p-3 sm:p-6 print:p-0">
        
        {/* SELECTION CRITERIA FORM PANEL (HIDDEN WHEN PRINTING) */}
        <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none border border-white/60 dark:border-slate-800 p-6 sm:p-8 mb-6 transition-colors print:hidden">
          <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/40 dark:to-indigo-900/40 border border-blue-200 dark:border-blue-800/50 flex items-center justify-center text-blue-700 dark:text-blue-400">
                <FileText size={20} />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                  Report Generator & Selection Criteria
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400">Select parameters to generate formal printable legal records</p>
              </div>
            </div>
            <div className="text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center gap-1.5">
              <ShieldCheck size={14} className="text-emerald-500" />
              <span>Role: <strong>{user?.role || 'Staff'}</strong></span>
            </div>
          </div>

          <form onSubmit={handleGenerate}>
            {/* Quick Date Presets Bar */}
            <div className="flex flex-wrap items-center gap-2 mb-5 pb-4 border-b border-slate-100 dark:border-slate-800">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mr-1">
                Quick Date Presets:
              </span>
              <button
                type="button"
                onClick={() => applyDatePreset('week')}
                className="px-3 py-1.5 bg-slate-100 hover:bg-blue-50 dark:bg-slate-800 dark:hover:bg-blue-900/30 text-slate-700 hover:text-blue-600 dark:text-slate-300 dark:hover:text-blue-400 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 transition-colors shadow-sm"
              >
                This Week
              </button>
              <button
                type="button"
                onClick={() => applyDatePreset('month')}
                className="px-3 py-1.5 bg-slate-100 hover:bg-blue-50 dark:bg-slate-800 dark:hover:bg-blue-900/30 text-slate-700 hover:text-blue-600 dark:text-slate-300 dark:hover:text-blue-400 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 transition-colors shadow-sm"
              >
                This Month
              </button>
              <button
                type="button"
                onClick={() => applyDatePreset('last_month')}
                className="px-3 py-1.5 bg-slate-100 hover:bg-blue-50 dark:bg-slate-800 dark:hover:bg-blue-900/30 text-slate-700 hover:text-blue-600 dark:text-slate-300 dark:hover:text-blue-400 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 transition-colors shadow-sm"
              >
                Last Month
              </button>
              <button
                type="button"
                onClick={() => applyDatePreset('year')}
                className="px-3 py-1.5 bg-slate-100 hover:bg-blue-50 dark:bg-slate-800 dark:hover:bg-blue-900/30 text-slate-700 hover:text-blue-600 dark:text-slate-300 dark:hover:text-blue-400 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 transition-colors shadow-sm"
              >
                This Year
              </button>
              <button
                type="button"
                onClick={() => applyDatePreset('all')}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 transition-colors shadow-sm"
              >
                All Time / Clear
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4 mb-6 text-sm">
              
              {/* Report Type Selection */}
              <div className="sm:col-span-2 md:col-span-2 lg:col-span-2 xl:col-span-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Select Report Type <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <FileText size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <select
                    value={selectedReportType}
                    onChange={(e) => setSelectedReportType(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
                  >
                    {reportTypes.map((rt) => {
                      if (!rt.allowed) return null;
                      return (
                        <option key={rt.id} value={rt.id}>
                          {rt.title}
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>

              {/* Report Depth / Scope */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Report Detail Level
                </label>
                <div className="relative">
                  <Filter size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <select
                    name="scope"
                    value={criteria.scope}
                    onChange={handleCriteriaChange}
                    className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
                  >
                    <option value="overview">📊 Summary Overview</option>
                    <option value="detailed">📋 Detailed Itemized Register</option>
                  </select>
                </div>
              </div>

              {/* Start Date */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Start Date
                </label>
                <div className="relative">
                  <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <input
                    type="date"
                    name="start_date"
                    value={criteria.start_date}
                    onChange={handleCriteriaChange}
                    className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
                  />
                </div>
              </div>

              {/* End Date */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  End Date
                </label>
                <div className="relative">
                  <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <input
                    type="date"
                    name="end_date"
                    value={criteria.end_date}
                    onChange={handleCriteriaChange}
                    className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
                  />
                </div>
              </div>

              {/* Practice Area */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Practice Area
                </label>
                <div className="relative">
                  <Briefcase size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <select
                    name="category"
                    value={criteria.category}
                    onChange={handleCriteriaChange}
                    className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
                  >
                    <option value="">All Categories</option>
                    {CASE_CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Court Forum — fetched from /courts/ API */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Court Forum
                </label>
                <div className="relative">
                  <Gavel size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <select
                    name="court"
                    value={criteria.court}
                    onChange={handleCriteriaChange}
                    className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
                  >
                    <option value="">All Courts</option>
                    {courtsList.map((c: any) => (
                      <option key={c.id} value={c.id}>
                        {c.name} {c.type ? `(${c.type})` : ''} {c.district ? `[${c.district}]` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Status — from CASE_STATUSES constant */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Status Filter
                </label>
                <div className="relative">
                  <CheckCircle2 size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <select
                    name="status"
                    value={criteria.status}
                    onChange={handleCriteriaChange}
                    className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
                  >
                    <option value="">All Statuses</option>
                    {CASE_STATUSES.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Staff / Advocate — fetched from /users/advocates/ API */}
              {(canViewProductivity || selectedReportType === 'productivity') && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Staff / Advocate
                  </label>
                  <div className="relative">
                    <Users size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <select
                      name="staff_id"
                      value={criteria.staff_id}
                      onChange={handleCriteriaChange}
                      className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
                    >
                      <option value="">All Staff</option>
                      {staffList.map((s: any) => (
                        <option key={s.id} value={s.id}>
                          {s.first_name || s.last_name ? `${s.first_name} ${s.last_name}`.trim() : s.username} ({s.role || 'Staff'})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* Actions Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-5 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl font-medium bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 duration-300 shadow-[0_4px_12px_rgba(37,99,235,0.25)] hover:shadow-[0_6px_16px_rgba(37,99,235,0.35)] hover:-translate-y-0.5 text-white text-sm flex items-center justify-center gap-2"
                >
                  <Play size={16} />
                  Generate Report
                </button>

                <button
                  type="button"
                  onClick={handleReset}
                  className="px-4 py-2.5 rounded-xl font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors text-sm flex items-center gap-1.5"
                >
                  <RotateCcw size={15} />
                  Reset Criteria
                </button>
              </div>

              {/* When Report is Generated: Show Print & Export Options */}
              {generatedReport && (
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handlePrint}
                    className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-200 text-white dark:text-slate-900 font-semibold text-sm rounded-xl shadow transition-all flex items-center gap-2 hover:-translate-y-0.5"
                  >
                    <Printer size={16} />
                    Print / Save as PDF
                  </button>

                  <div className="border-l border-slate-200 dark:border-slate-700 pl-3">
                    <ExportToolbar
                      endpoint={getExportEndpoint()}
                      filters={generatedReport.filters}
                      filename={generatedReport.type + '_report'}
                    />
                  </div>
                </div>
              )}
            </div>
          </form>
        </div>

        {/* PRINTABLE REPORT DOCUMENT AREA */}
        {!generatedReport ? (
          <div className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-12 text-center shadow-sm">
            <FileText className="mx-auto h-12 w-12 text-slate-400 mb-3" />
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200 mb-1">
              No Report Generated
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              Please select your desired report type and filter criteria above, then click <strong>Generate Report</strong> to view printable official records.
            </p>
          </div>
        ) : (
          <PrintFriendlyReport
            reportType={generatedReport.type}
            filters={generatedReport.filters}
            reportTitle={generatedReport.label}
            filtersSummary={generatedReport.summaryText}
          />
        )}

      </div>
    </div>
  );
}
