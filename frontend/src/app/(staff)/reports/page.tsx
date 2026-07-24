'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { LayoutDashboard, Gavel, DollarSign, Activity } from 'lucide-react';
import { CaseReports } from './components/CaseReports';
import { FinancialReports } from './components/FinancialReports';
import { ProductivityReports } from './components/ProductivityReports';

export default function ReportsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('cases');

  // Check if user has permission to view financial and productivity reports
  const canViewFinancial = user?.role === 'Admin' || user?.role === 'Senior Partner' || user?.role === 'Accountant';
  const canViewProductivity = user?.role === 'Admin' || user?.role === 'Senior Partner' || user?.role === 'Manager';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900/50">
      <div className="max-w-[1600px] mx-auto p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Reports & Analytics
          </h1>
          <p className="mt-2 text-slate-500 dark:text-slate-400">
            Comprehensive overview of firm performance and caseloads.
          </p>
        </div>

        {/* Tabs */}
        <div className="border-b border-slate-200 dark:border-slate-800 mb-8">
          <nav className="-mb-px flex space-x-8 overflow-x-auto scrollbar-hide">
            <button
              onClick={() => setActiveTab('overview')}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${
                activeTab === 'overview'
                  ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-300'
              }`}
            >
              <LayoutDashboard size={18} />
              Overview
            </button>
            <button
              onClick={() => setActiveTab('cases')}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${
                activeTab === 'cases'
                  ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-300'
              }`}
            >
              <Gavel size={18} />
              Cases & Hearings
            </button>
            {canViewFinancial && (
              <button
                onClick={() => setActiveTab('financial')}
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${
                  activeTab === 'financial'
                    ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-300'
                }`}
              >
                <DollarSign size={18} />
                Financial
              </button>
            )}
            {canViewProductivity && (
              <button
                onClick={() => setActiveTab('productivity')}
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${
                  activeTab === 'productivity'
                    ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-300'
                }`}
              >
                <Activity size={18} />
                Staff Productivity
              </button>
            )}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="transition-all duration-300">
          {activeTab === 'overview' && (
            <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 text-center shadow-sm">
               <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Welcome to the Analytics Hub</h2>
               <p className="text-slate-500 dark:text-slate-400">Select a tab above to drill down into specific reports. (Overview KPI cards coming soon)</p>
            </div>
          )}
          {activeTab === 'cases' && <CaseReports />}
          {activeTab === 'financial' && canViewFinancial && <FinancialReports />}
          {activeTab === 'productivity' && canViewProductivity && <ProductivityReports />}
        </div>
      </div>
    </div>
  );
}
