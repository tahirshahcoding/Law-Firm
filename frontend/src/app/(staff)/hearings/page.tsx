'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { Plus, Search, Calendar, Edit2, Trash2, MapPin, AlignLeft, FolderOpen, MoreVertical, Check, FileText, Gavel, Zap, CheckCircle2 } from 'lucide-react';
import { API_BASE, apiFetch } from '@/lib/api';
const AddHearingModal = dynamic(() => import('@/components/AddHearingModal'), { ssr: false });
const EditHearingModal = dynamic(() => import('@/components/EditHearingModal'), { ssr: false });
const HearingDocumentsModal = dynamic(() => import('@/components/HearingDocumentsModal'), { ssr: false });
const LogProceedingModal = dynamic(() => import('@/components/LogProceedingModal'), { ssr: false });
import { useAuth } from '@/context/AuthContext';
import { useUI } from '@/context/UIContext';
import { TableSkeleton } from '@/components/SkeletonLoaders';
import Pagination from '@/components/Pagination';
import useSWR from 'swr';
import { swrFetcher } from '@/lib/fetcher';
import { useDebounce } from '@/hooks/useDebounce';
import { CASE_STATUSES } from '@/lib/constants';
import { formatCaseTitle } from '@/lib/formatters';

const formatDate = (dateStr: string) => {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const [year, month, day] = parts;
  return `${day}/${month}/${year}`;
};

export default function HearingsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  
  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedHearing, setSelectedHearing] = useState(null);
  const [isDocsModalOpen, setIsDocsModalOpen] = useState(false);
  const [selectedDocsHearing, setSelectedDocsHearing] = useState(null);
  const [selectedLogHearing, setSelectedLogHearing] = useState(null);

  const { user } = useAuth();
  const { confirm, toast, showLoading, hideLoading } = useUI();

  const canViewHearings   = user?.role === 'Admin' || user?.permissions?.hearings?.view === true;
  const canAddHearings    = user?.role === 'Admin' || user?.permissions?.hearings?.add === true;
  const canEditHearings   = user?.role === 'Admin' || user?.permissions?.hearings?.edit === true;
  const canDeleteHearings = user?.role === 'Admin' || user?.permissions?.hearings?.delete === true;

  const [viewMode, setViewMode] = useState<'by_case' | 'all_dates'>('by_case');
  const [filterStage, setFilterStage] = useState('');
  const [filterLogStatus, setFilterLogStatus] = useState('');
  const [filterDatePreset, setFilterDatePreset] = useState('all');

  let url = `${API_BASE}/hearings/?limit=10000`;
  if (debouncedSearchTerm.trim()) {
    url += `&search=${encodeURIComponent(debouncedSearchTerm.trim())}`;
  }

  const { data, error, isLoading: loading, mutate: fetchHearings } = useSWR(canViewHearings ? url : null, swrFetcher);

  const hearingsData = data && Array.isArray(data.results) ? data.results : Array.isArray(data) ? data : [];
  const hearings = [...hearingsData].sort((a: any, b: any) => new Date(a.hearing_date).getTime() - new Date(b.hearing_date).getTime());

  const todayStr = new Date().toISOString().split('T')[0];

  const filteredHearings = hearings.filter((h: any) => {
    const matchesSearch = !searchTerm.trim() || (
      h.case_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      h.opponent_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      h.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      h.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      formatDate(h.hearing_date).includes(searchTerm)
    );

    const matchesStage = !filterStage || h.hearing_stage?.toLowerCase() === filterStage.toLowerCase();

    const matchesLogStatus = !filterLogStatus || (
      filterLogStatus === 'pending' ? !h.is_completed :
      filterLogStatus === 'completed' ? !!h.is_completed : true
    );

    let matchesDate = true;
    if (filterDatePreset === 'today') {
      matchesDate = h.hearing_date === todayStr;
    } else if (filterDatePreset === 'upcoming') {
      matchesDate = h.hearing_date >= todayStr;
    } else if (filterDatePreset === 'past') {
      matchesDate = h.hearing_date < todayStr;
    }

    return matchesSearch && matchesStage && matchesLogStatus && matchesDate;
  });

  // Group hearings by Case
  const groupedByCase = filteredHearings.reduce((acc: any, h: any) => {
    const key = h.case_number || 'Unassigned';
    if (!acc[key]) {
      acc[key] = {
        case_number: h.case_number,
        client_name: h.client_name,
        opponent_name: h.opponent_name,
        court: h.court,
        judge: h.judge,
        hearings: [],
      };
    }
    acc[key].hearings.push(h);
    return acc;
  }, {});

  const paginatedHearings = viewMode === 'all_dates' 
    ? filteredHearings.slice((page - 1) * limit, page * limit)
    : filteredHearings;

  const handleDelete = async (id: string, caseNumber: string, date: string) => {
    const ok = await confirm({
      title: 'Delete Hearing',
      message: `This will permanently delete the hearing scheduled on ${date} for Case ${caseNumber}.`,
      confirmLabel: 'Delete',
      variant: 'danger',
    });
    if (!ok) return;
    
    try {
      showLoading('Deleting hearing record...');
      const res = await apiFetch(`${API_BASE}/hearings/${id}/`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete hearing');
      toast.success('Hearing deleted successfully.');
      fetchHearings();
    } catch (err) {
      toast.error('Failed to delete hearing. Please try again.');
      console.error(err);
    } finally {
      hideLoading();
    }
  };

  const handleEdit = (hearingObj: any) => {
    setSelectedHearing(hearingObj);
    setIsEditModalOpen(true);
  };

  const handleOpenDocs = (hearingObj: any) => {
    setSelectedDocsHearing(hearingObj);
    setIsDocsModalOpen(true);
  };

  if (!canViewHearings) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center">
        <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4 transition-colors">
          <Gavel size={32} className="text-slate-300 dark:text-slate-600" />
        </div>
        <h2 className="text-xl font-bold text-slate-700 dark:text-slate-300">Access Denied</h2>
        <p className="text-slate-500 dark:text-slate-400 mt-1">You don't have permission to view hearings.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Legal Hearings</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm sm:text-base">Manage all upcoming firm hearings and schedules.</p>
        </div>
        {canAddHearings && (
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 duration-300 shadow-[0_4px_12px_rgba(37,99,235,0.25)] hover:shadow-[0_6px_16px_rgba(37,99,235,0.35)] hover:-translate-y-0.5 px-5 py-2.5 rounded-xl font-medium flex items-center justify-center gap-2 text-white"
          >
            <Plus size={18} /> Schedule Hearing
          </button>
        )}
      </div>

      <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none border border-white/60 dark:border-slate-800/60 overflow-hidden transition-colors">
        {/* Toolbar */}
        <div className="p-4 border-b border-slate-200/60 dark:border-slate-700/60 flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-800/50 transition-colors">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
            <div className="relative w-full sm:max-w-xs group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 group-focus-within:text-blue-500 transition-colors" size={16} />
              <input 
                type="text" 
                placeholder="Search by date, Case No, or notes..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500 shadow-sm hover:border-slate-300 dark:hover:border-slate-600 text-slate-900 dark:text-white"
              />
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={filterDatePreset}
                onChange={(e) => setFilterDatePreset(e.target.value)}
                className="px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-700 dark:text-slate-300 focus:outline-none focus:border-blue-500 min-w-[110px]"
              >
                <option value="all">All Dates</option>
                <option value="today">Today</option>
                <option value="upcoming">Upcoming</option>
                <option value="past">Past</option>
              </select>

              <select
                value={filterLogStatus}
                onChange={(e) => setFilterLogStatus(e.target.value)}
                className="px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-700 dark:text-slate-300 focus:outline-none focus:border-blue-500 min-w-[130px]"
              >
                <option value="">All Statuses</option>
                <option value="pending">Pending Proceeding</option>
                <option value="completed">Proceeding Logged</option>
              </select>

              <select
                value={filterStage}
                onChange={(e) => setFilterStage(e.target.value)}
                className="px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-700 dark:text-slate-300 focus:outline-none focus:border-blue-500 min-w-[130px]"
              >
                <option value="">All Stages</option>
                {CASE_STATUSES.map(stage => (
                  <option key={stage} value={stage}>{stage}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-3 self-end xl:self-auto shrink-0">
            {/* View Mode Toggle */}
            <div className="flex gap-1 bg-slate-200/60 dark:bg-slate-800 p-1 rounded-xl">
              <button
                onClick={() => setViewMode('by_case')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  viewMode === 'by_case'
                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Grouped by Case
              </button>
              <button
                onClick={() => setViewMode('all_dates')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  viewMode === 'all_dates'
                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                All Hearings List
              </button>
            </div>

            <div className="text-sm text-slate-500 dark:text-slate-400 font-medium whitespace-nowrap">
              {filteredHearings.length} Results
            </div>
          </div>
        </div>

        {loading ? (
          <TableSkeleton />
        ) : filteredHearings.length === 0 ? (
          <div className="px-6 py-12 text-center text-slate-500 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-900/50 transition-colors">
            <div className="flex flex-col items-center justify-center max-w-sm mx-auto">
              <div className="w-12 h-12 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full flex items-center justify-center mb-3">
                <Calendar className="text-slate-400 dark:text-slate-500" size={24} />
              </div>
              <p className="text-slate-900 dark:text-white font-medium mb-1">
                {searchTerm ? 'No schedules found' : 'The Hearings list is empty'}
              </p>
              <p className="text-sm">
                {searchTerm ? 'Adjust your search parameters.' : 'Click "Schedule Hearing" to begin planning.'}
              </p>
            </div>
          </div>
        ) : viewMode === 'by_case' ? (
          <div className="p-6 space-y-6">
            {Object.values(groupedByCase).map((group: any) => (
              <div key={group.case_number} className="bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 overflow-hidden shadow-sm">
                {/* Case Header Card */}
                <div className="p-4 bg-slate-50/80 dark:bg-slate-800 border-b border-slate-200/80 dark:border-slate-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                      <FolderOpen size={20} />
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                        {group.client_name ? `${group.client_name} vs. ${group.opponent_name}` : formatCaseTitle(group)}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1">
                        <FolderOpen size={12} className="text-slate-400" /> Case {group.case_number}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                    {group.hearings.length} {group.hearings.length === 1 ? 'Hearing' : 'Hearings'} Scheduled
                  </span>
                </div>

                {/* Hearings List for this Case */}
                <div className="divide-y divide-slate-100 dark:divide-slate-700/60">
                  {group.hearings.map((h: any) => {
                    const isToday = h.hearing_date === new Date().toISOString().split('T')[0];
                    return (
                      <div key={h.id} className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-colors">
                        <div className="flex items-start gap-3">
                          <div className={`p-2.5 rounded-xl border shrink-0 mt-0.5 ${isToday ? 'bg-rose-100 dark:bg-rose-900/40 border-rose-200 text-rose-600' : 'bg-slate-100 dark:bg-slate-700 border-slate-200 text-slate-500'}`}>
                            <Calendar size={16} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-sm text-slate-900 dark:text-white font-mono">{formatDate(h.hearing_date)}</span>
                              {isToday && <span className="text-[10px] uppercase font-bold text-rose-500 tracking-wider">Today</span>}
                              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                                Stage: {h.hearing_stage}
                              </span>
                            </div>
                            {h.notes && <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 line-clamp-1">{h.notes}</p>}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-center">
                          {h.is_completed ? (
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-3 py-1.5 rounded-xl border border-emerald-200 dark:border-emerald-800 shadow-sm">
                              <CheckCircle2 size={13} /> Proceeding Logged
                            </span>
                          ) : (
                            <button
                              onClick={() => setSelectedLogHearing(h)}
                              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md shadow-blue-500/20 hover:-translate-y-0.5 transition-all whitespace-nowrap"
                            >
                              <Zap size={13} className="fill-white" /> Log Proceeding
                            </button>
                          )}
                          <div className="flex items-center gap-0.5 opacity-70 hover:opacity-100 transition-opacity">
                            <button onClick={() => handleOpenDocs(h)} className="p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg" title="Documents"><FileText size={16} /></button>
                            <button onClick={() => handleEdit(h)} className="p-1.5 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 rounded-lg" title="Edit Hearing"><Edit2 size={16} /></button>
                            <button onClick={() => handleDelete(h.id, h.case_number, h.hearing_date)} className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg" title="Cancel Hearing"><Trash2 size={16} /></button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            {/* Mobile Card View */}
            <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800">
              {filteredHearings.map((h: any) => {
                const isToday = h.hearing_date === new Date().toISOString().split('T')[0];
                return (
                  <div key={h.id} className={`p-4 ${isToday ? 'bg-rose-50/30 dark:bg-rose-900/30' : 'hover:bg-slate-50/80 dark:hover:bg-slate-800/80'} transition-colors`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className={`p-2 rounded-xl border shrink-0 ${isToday ? 'bg-rose-100 dark:bg-rose-900/40 border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400' : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400'}`}>
                          <Calendar size={16} />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className={`font-semibold tracking-wide ${isToday ? 'text-rose-700 dark:text-rose-400' : 'text-slate-900 dark:text-white'}`}>{formatDate(h.hearing_date)}</p>
                            {isToday && <span className="text-[10px] uppercase font-bold text-rose-500 dark:text-rose-400 tracking-wider">Today</span>}
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300 font-medium mt-0.5 max-w-[250px] truncate" title={formatCaseTitle(h)}>
                            {formatCaseTitle(h)}
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                            <FolderOpen size={11} className="text-slate-400 dark:text-slate-500" />
                            Case {h.case_number}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                            Advocate: {h.advocate_name || 'Senior Partner'}
                          </div>
                          {h.notes && (
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">{h.notes}</p>
                          )}
                          {h.next_date && (
                            <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 w-fit px-2 py-0.5 rounded border border-emerald-100 dark:border-emerald-800 tracking-wide mt-1.5">
                              ND: {formatDate(h.next_date)}
                            </div>
                          )}
                          {h.is_completed ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800 mt-2">
                              <CheckCircle2 size={12} /> Proceeding Logged
                            </span>
                          ) : (
                            <button
                              onClick={() => setSelectedLogHearing(h)}
                              className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-sm transition-all"
                            >
                              <Zap size={13} className="fill-white" /> Log Proceeding
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button 
                          onClick={() => handleOpenDocs(h)}
                          className="p-2 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-800/50 rounded-lg transition-colors relative"
                          title="Documents"
                        >
                          <FileText size={17} />
                          {h.documents && h.documents.length > 0 && (
                            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-[9px] font-bold text-white ring-2 ring-white dark:ring-slate-900">
                              {h.documents.length}
                            </span>
                          )}
                        </button>
                        <button 
                          onClick={() => handleEdit(h)}
                          className="p-2 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-lg transition-colors"
                          title="Update Hearing"
                        >
                          <Edit2 size={17} />
                        </button>
                        <button 
                          onClick={() => handleDelete(h.id, h.case_number, h.hearing_date)}
                          className="p-2 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg transition-colors"
                          title="Cancel Hearing"
                        >
                          <Trash2 size={17} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead className="bg-slate-50/80 dark:bg-slate-800/80 backdrop-blur-md sticky top-0 z-10 transition-colors">
                  <tr className="border-b border-slate-200/60 dark:border-slate-700/60">
                    <th className="px-4 py-2.5 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider w-1/5">Date</th>
                    <th className="px-4 py-2.5 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider w-1/5">Target Case</th>
                    <th className="px-4 py-2.5 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider w-1/5">Advocate</th>
                    <th className="px-4 py-2.5 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider w-1/4">Notes & Next Date</th>
                    <th className="px-4 py-2.5 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100/80 dark:divide-slate-800/80">
                  {paginatedHearings.map((h: any, index: number) => {
                    const isToday = h.hearing_date === new Date().toISOString().split('T')[0];
                    return (
                      <tr 
                        key={h.id} 
                        className={`hover:bg-blue-50/40 dark:hover:bg-slate-800/40 transition-all duration-300 group border-l-4 border-transparent hover:border-blue-500 animate-in fade-in slide-in-from-bottom-2 ${isToday ? 'bg-rose-50/30 dark:bg-rose-900/30' : ''}`}
                        style={{ animationFillMode: 'both', animationDelay: `${index * 40}ms` }}
                      >
                        <td className="px-4 py-2">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-xl border shadow-sm group-hover:shadow group-hover:-translate-y-0.5 transition-all ${isToday ? 'bg-gradient-to-br from-rose-100 to-rose-50 dark:from-rose-900/40 dark:to-rose-800/40 border-rose-200 dark:border-rose-700 text-rose-600 dark:text-rose-400 ring-4 ring-rose-500/10 dark:ring-rose-500/20' : 'bg-gradient-to-br from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-700 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 group-hover:border-blue-200 dark:group-hover:border-blue-700 group-hover:text-blue-600 dark:group-hover:text-blue-400'}`}>
                              <Calendar size={16} />
                            </div>
                            <div>
                              <p className={`font-semibold text-sm tracking-wide ${isToday ? 'text-rose-700 dark:text-rose-400' : 'text-slate-900 dark:text-white'}`}>{formatDate(h.hearing_date)}</p>
                              {isToday && <span className="text-[10px] uppercase font-bold text-rose-500 dark:text-rose-400 tracking-wider">Today</span>}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-2">
                          <div className="flex flex-col">
                            <div className="flex items-center gap-1.5 text-slate-900 dark:text-white text-sm font-medium group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate max-w-[200px]" title={formatCaseTitle(h)}>
                              {formatCaseTitle(h)}
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                              <FolderOpen size={11} className="text-slate-400 dark:text-slate-500" />
                              Case {h.case_number}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-2">
                          <div className="text-sm font-medium text-slate-700 dark:text-slate-300">
                            {h.advocate_name || 'Senior Partner'}
                          </div>
                        </td>
                        <td className="px-4 py-2">
                          <div className="flex flex-col gap-1">
                            {h.notes ? (
                              <div className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400">
                                <AlignLeft size={13} className="text-slate-400 dark:text-slate-500 shrink-0 mt-0.5" />
                                <span className="line-clamp-2 max-w-[250px]" title={h.notes}>{h.notes}</span>
                              </div>
                            ) : (
                              <span className="text-sm text-slate-400 dark:text-slate-500 italic">No notes.</span>
                            )}
                            
                            {h.next_date && (
                              <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 w-fit px-2 py-0.5 rounded border border-emerald-100 dark:border-emerald-800 tracking-wide">
                                ND: {formatDate(h.next_date)}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-2 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {h.is_completed ? (
                              <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-3 py-1.5 rounded-xl border border-emerald-200 dark:border-emerald-800 shadow-sm">
                                <CheckCircle2 size={13} /> Logged
                              </span>
                            ) : (
                              <button
                                onClick={() => setSelectedLogHearing(h)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/30 hover:-translate-y-0.5 transition-all whitespace-nowrap"
                              >
                                <Zap size={13} className="fill-white" /> Log Proceeding
                              </button>
                            )}
                            
                            <div className="flex items-center gap-0.5 opacity-60 hover:opacity-100 transition-opacity">
                              <button 
                                onClick={() => handleOpenDocs(h)}
                                className="p-1 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-800/50 rounded-lg transition-colors relative"
                                title="Documents"
                              >
                                <FileText size={16} />
                                {h.documents && h.documents.length > 0 && (
                                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-[9px] font-bold text-white ring-2 ring-white dark:ring-slate-900">
                                    {h.documents.length}
                                  </span>
                                )}
                              </button>
                              <button 
                                onClick={() => handleEdit(h)}
                                className="p-1 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-lg transition-colors"
                                title="Edit Hearing"
                              >
                                <Edit2 size={16} />
                              </button>
                              <button 
                                onClick={() => handleDelete(h.id, h.case_number, h.hearing_date)}
                                className="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg transition-colors"
                                title="Cancel Hearing"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            
            {/* Pagination Controls */}
            {viewMode === 'all_dates' && filteredHearings.length > 0 && (
              <Pagination 
                currentPage={page}
                totalItems={filteredHearings.length}
                pageSize={limit}
                onPageChange={setPage}
                onPageSizeChange={setLimit}
              />
            )}
          </>
        )}
      </div>

      <AddHearingModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        onSuccess={fetchHearings} 
      />

      <EditHearingModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSuccess={fetchHearings}
        hearingData={selectedHearing}
      />

      <HearingDocumentsModal
        isOpen={isDocsModalOpen}
        onClose={() => setIsDocsModalOpen(false)}
        onSuccess={fetchHearings}
        hearingData={selectedDocsHearing}
      />

      {selectedLogHearing && (
        <LogProceedingModal
          isOpen={!!selectedLogHearing}
          hearing={selectedLogHearing}
          onClose={() => setSelectedLogHearing(null)}
          onSuccess={fetchHearings}
        />
      )}
    </div>
  );
}

