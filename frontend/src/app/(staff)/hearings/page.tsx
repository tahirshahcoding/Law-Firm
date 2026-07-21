'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, Calendar, Edit2, Trash2, MapPin, AlignLeft, FolderOpen, MoreVertical, Check, FileText, Gavel } from 'lucide-react';
import { API_BASE, apiFetch } from '@/lib/api';
import AddHearingModal from '@/components/AddHearingModal';
import EditHearingModal from '@/components/EditHearingModal';
import HearingDocumentsModal from '@/components/HearingDocumentsModal';
import { useAuth } from '@/context/AuthContext';
import { useUI } from '@/context/UIContext';
import { TableSkeleton } from '@/components/SkeletonLoaders';
import useSWR from 'swr';
import { swrFetcher } from '@/lib/fetcher';

export default function HearingsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedHearing, setSelectedHearing] = useState(null);
  const [isDocsModalOpen, setIsDocsModalOpen] = useState(false);
  const [selectedDocsHearing, setSelectedDocsHearing] = useState(null);

  const { user } = useAuth();
  const { confirm, toast, showLoading, hideLoading } = useUI();

  const canViewHearings   = user?.role === 'Admin' || user?.permissions?.hearings?.view === true;
  const canAddHearings    = user?.role === 'Admin' || user?.permissions?.hearings?.add === true;
  const canEditHearings   = user?.role === 'Admin' || user?.permissions?.hearings?.edit === true;
  const canDeleteHearings = user?.role === 'Admin' || user?.permissions?.hearings?.delete === true;

  const { data, error, isLoading: loading, mutate: fetchHearings } = useSWR(canViewHearings ? `${API_BASE}/hearings/` : null, swrFetcher);

  const hearingsData = data && Array.isArray(data.results) ? data.results : Array.isArray(data) ? data : [];
  const hearings = [...hearingsData].sort((a: any, b: any) => new Date(a.hearing_date).getTime() - new Date(b.hearing_date).getTime());

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

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    const [year, month, day] = parts;
    return `${day}/${month}/${year}`;
  };

  const filteredHearings = hearings.filter((h: any) => 
    h.case_number?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    h.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    formatDate(h.hearing_date).includes(searchTerm)
  );

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
        <div className="p-4 border-b border-slate-200/60 dark:border-slate-700/60 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-800/50 transition-colors">
          <div className="relative w-full group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 group-focus-within:text-blue-500 transition-colors" size={16} />
            <input 
              type="text" 
              placeholder="Search by date (DD/MM/YYYY), Case No, or notes..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500 shadow-sm hover:border-slate-300 dark:hover:border-slate-600 text-slate-900 dark:text-white"
            />
          </div>
          <div className="text-sm text-slate-500 dark:text-slate-400 font-medium whitespace-nowrap">
            {filteredHearings.length} Scheduled
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
                          <div className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300 font-medium mt-0.5">
                            <FolderOpen size={11} className="text-slate-400 dark:text-slate-500" />
                            {h.case_number}
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
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider w-1/5">Date</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider w-1/5">Target Case</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider w-1/5">Advocate</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider w-1/4">Notes & Next Date</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100/80 dark:divide-slate-800/80">
                  {filteredHearings.map((h: any, index: number) => {
                    const isToday = h.hearing_date === new Date().toISOString().split('T')[0];
                    return (
                      <tr 
                        key={h.id} 
                        className={`hover:bg-blue-50/40 dark:hover:bg-slate-800/40 transition-all duration-300 group border-l-4 border-transparent hover:border-blue-500 animate-in fade-in slide-in-from-bottom-2 ${isToday ? 'bg-rose-50/30 dark:bg-rose-900/30' : ''}`}
                        style={{ animationFillMode: 'both', animationDelay: `${index * 40}ms` }}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className={`p-2.5 rounded-xl border shadow-sm group-hover:shadow group-hover:-translate-y-0.5 transition-all ${isToday ? 'bg-gradient-to-br from-rose-100 to-rose-50 dark:from-rose-900/40 dark:to-rose-800/40 border-rose-200 dark:border-rose-700 text-rose-600 dark:text-rose-400 ring-4 ring-rose-500/10 dark:ring-rose-500/20' : 'bg-gradient-to-br from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-700 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 group-hover:border-blue-200 dark:group-hover:border-blue-700 group-hover:text-blue-600 dark:group-hover:text-blue-400'}`}>
                              <Calendar size={18} />
                            </div>
                            <div>
                              <p className={`font-semibold tracking-wide ${isToday ? 'text-rose-700 dark:text-rose-400' : 'text-slate-900 dark:text-white'}`}>{formatDate(h.hearing_date)}</p>
                              {isToday && <span className="text-[10px] uppercase font-bold text-rose-500 dark:text-rose-400 tracking-wider">Today</span>}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <div className="flex items-center gap-1.5 text-slate-900 dark:text-white font-medium group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                              <FolderOpen size={14} className="text-slate-400 dark:text-slate-500" />
                              {h.case_number}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-slate-700 dark:text-slate-300">
                            {h.advocate_name || 'Senior Partner'}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1.5">
                            {h.notes ? (
                              <div className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400">
                                <AlignLeft size={14} className="text-slate-400 dark:text-slate-500 shrink-0 mt-0.5" />
                                <span className="line-clamp-2 max-w-[250px]" title={h.notes}>{h.notes}</span>
                              </div>
                            ) : (
                              <span className="text-sm text-slate-400 dark:text-slate-500 italic">No notes attached.</span>
                            )}
                            
                            {h.next_date && (
                              <div className="flex items-center gap-1.5 text-[11px] uppercase font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 w-fit px-2 py-0.5 rounded border border-emerald-100 dark:border-emerald-800 tracking-wide mt-1">
                                ND: {formatDate(h.next_date)}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                              onClick={() => handleOpenDocs(h)}
                              className="p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-800/50 rounded-lg transition-colors relative"
                              title="Documents"
                            >
                              <FileText size={18} />
                              {h.documents && h.documents.length > 0 && (
                                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-[9px] font-bold text-white ring-2 ring-white dark:ring-slate-900">
                                  {h.documents.length}
                                </span>
                              )}
                            </button>
                            <button 
                              onClick={() => handleEdit(h)}
                              className="p-1.5 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-lg transition-colors"
                              title="Update Hearing"
                            >
                              <Edit2 size={18} />
                            </button>
                            <button 
                              onClick={() => handleDelete(h.id, h.case_number, h.hearing_date)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg transition-colors"
                              title="Cancel Hearing"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
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
    </div>
  );
}

