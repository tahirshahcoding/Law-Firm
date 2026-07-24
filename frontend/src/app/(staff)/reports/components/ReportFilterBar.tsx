import React, { useState } from 'react';
import { Users, Filter, Search } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface ReportFilterBarProps {
  onFilterChange: (filters: Record<string, any>) => void;
  showStaffFilter?: boolean;
}

export function ReportFilterBar({ onFilterChange, showStaffFilter = false }: ReportFilterBarProps) {
  const { user } = useAuth();
  const [filters, setFilters] = useState({
    start_date: '',
    end_date: '',
    staff_id: '',
    status: '',
  });

  const canFilterStaff = user?.role === 'Admin' || user?.role === 'Senior Partner' || user?.role === 'Manager';

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const newFilters = { ...filters, [e.target.name]: e.target.value };
    setFilters(newFilters);
  };

  const handleApply = () => {
    onFilterChange(filters);
  };

  return (
    <div className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] border border-slate-200 dark:border-slate-800 flex flex-wrap gap-4 items-end transition-colors flex-1">
      <div className="flex-1 min-w-[200px]">
        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Date Range</label>
        <div className="flex items-center gap-2">
          <input
            type="date"
            name="start_date"
            value={filters.start_date}
            onChange={handleChange}
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
          />
          <span className="text-slate-400 font-medium">to</span>
          <input
            type="date"
            name="end_date"
            value={filters.end_date}
            onChange={handleChange}
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
          />
        </div>
      </div>

      {showStaffFilter && canFilterStaff && (
        <div className="w-48">
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Staff Member ID</label>
          <div className="relative">
            <Users className="absolute left-3 top-2.5 text-slate-400" size={16} />
            <input
              type="text"
              name="staff_id"
              placeholder="e.g. 1"
              value={filters.staff_id}
              onChange={handleChange}
              className="w-full pl-9 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
            />
          </div>
        </div>
      )}

      <div className="w-48">
        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Status</label>
        <div className="relative">
          <Filter className="absolute left-3 top-2.5 text-slate-400" size={16} />
          <input
            type="text"
            name="status"
            placeholder="e.g. Active"
            value={filters.status}
            onChange={handleChange}
            className="w-full pl-9 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
          />
        </div>
      </div>

      <button
        onClick={handleApply}
        className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
      >
        <Search size={16} />
        Apply Filters
      </button>
    </div>
  );
}
