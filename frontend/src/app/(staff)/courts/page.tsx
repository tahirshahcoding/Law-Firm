'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Plus, Search, Trash2, Edit2, Scale, MapPin, Building2, User, ChevronLeft, ChevronRight } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';
import { API_BASE, apiFetch } from '@/lib/api';
import AddCourtModal from '@/components/AddCourtModal';
import EditCourtModal from '@/components/EditCourtModal';
import { useAuth } from '@/context/AuthContext';
import { useUI } from '@/context/UIContext';
import { TableSkeleton } from '@/components/SkeletonLoaders';
import useSWR from 'swr';
import { swrFetcher } from '@/lib/fetcher';

function CourtsPageContent() {
  const searchParams = useSearchParams();
  const initialSearch = searchParams.get('search') || '';
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [page, setPage] = useState(1);
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedCourt, setSelectedCourt] = useState(null);

  const { user } = useAuth();
  const { confirm, toast, showLoading, hideLoading } = useUI();

  // For now, assuming staff users can manage courts if they can manage cases,
  // or restrict to Admin. Let's restrict to Admin for master data.
  const canManageCourts = user?.role === 'Admin';

  const query = new URLSearchParams({
    page: page.toString(),
    limit: '20',
    ...(debouncedSearchTerm && { search: debouncedSearchTerm })
  });

  const { data, isLoading: loading, mutate: fetchCourts } = useSWR(`${API_BASE}/courts/?${query.toString()}`, swrFetcher);

  const courts = data?.results || (Array.isArray(data) ? data : []);
  const totalCount = data?.count ?? courts.length;
  const totalPages = Math.ceil((data?.count ?? courts.length) / 20);


  const handleDelete = async (id: string, name: string) => {
    const ok = await confirm({
      title: 'Delete Court',
      message: `Are you sure you want to delete ${name}? This action cannot be undone and will fail if cases are currently assigned to this court.`,
      confirmLabel: 'Delete',
      variant: 'danger',
    });
    if (!ok) return;
    
    try {
      showLoading('Deleting court...');
      const res = await apiFetch(`${API_BASE}/courts/${id}/`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        if (res.status === 400 || res.status === 403 || res.status === 500) {
           throw new Error('Cannot delete this court because it is associated with active cases.');
        }
        throw new Error('Failed to delete court');
      }
      toast.success(`Court "${name}" has been deleted.`);
      fetchCourts();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete court. Please try again.');
      console.error(err);
    } finally {
      hideLoading();
    }
  };

  const handleEdit = (court: any) => {
    setSelectedCourt(court);
    setIsEditModalOpen(true);
  };

  if (!canManageCourts) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center">
        <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4 transition-colors">
          <Scale size={32} className="text-slate-300 dark:text-slate-600" />
        </div>
        <h2 className="text-xl font-bold text-slate-700 dark:text-slate-300">Access Denied</h2>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Only Administrators can manage master court data.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Court Management</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm sm:text-base">Maintain master data for courts across all districts.</p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-2.5 rounded-xl font-medium transition-all duration-300 shadow-[0_4px_12px_rgba(37,99,235,0.25)] hover:shadow-[0_6px_16px_rgba(37,99,235,0.35)] hover:-translate-y-0.5 flex items-center justify-center gap-2"
        >
          <Plus size={18} /> Add Court
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-[0_4px_24px_-8px_rgba(59,130,246,0.08)] dark:shadow-none border border-blue-100/50 dark:border-slate-800 overflow-hidden transition-colors">
        <div className="p-4 border-b border-blue-100/50 dark:border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-blue-50/30 dark:bg-slate-800/30 transition-colors">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={16} />
            <input 
              type="text" 
              placeholder="Search by court name, type, judge, district..." 
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500 text-slate-900 dark:text-white"
            />
          </div>
          <div className="text-sm text-slate-500 dark:text-slate-400 font-medium whitespace-nowrap">
            {totalCount} Total
          </div>
        </div>

        {loading ? (
          <TableSkeleton />
        ) : courts.length === 0 ? (
          <div className="px-6 py-12 text-center text-slate-500 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-900/50 transition-colors">
            <div className="flex flex-col items-center justify-center max-w-sm mx-auto">
              <div className="w-12 h-12 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full flex items-center justify-center mb-3">
                <Scale className="text-slate-400 dark:text-slate-500" size={24} />
              </div>
              <p className="text-slate-900 dark:text-white font-medium mb-1">
                {searchTerm ? 'No search results found' : 'No courts found'}
              </p>
              <p className="text-sm">
                {searchTerm ? 'Try adjusting your search query.' : 'Get started by clicking "Add Court" above.'}
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="bg-blue-50/40 dark:bg-slate-800/40 border-b border-blue-100/60 dark:border-slate-700/60 transition-colors">
                    <th className="px-6 py-4 text-xs font-semibold text-blue-900/60 dark:text-slate-400 uppercase tracking-wider w-1/3">Court Details</th>
                    <th className="px-6 py-4 text-xs font-semibold text-blue-900/60 dark:text-slate-400 uppercase tracking-wider">Location</th>
                    <th className="px-6 py-4 text-xs font-semibold text-blue-900/60 dark:text-slate-400 uppercase tracking-wider">Presiding Judge</th>
                    <th className="px-6 py-4 text-xs font-semibold text-blue-900/60 dark:text-slate-400 uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-blue-50 dark:divide-slate-800">
                  {courts.map((court: any) => (
                    <tr key={court.id} className="hover:bg-blue-50/30 dark:hover:bg-slate-800/30 transition-colors duration-200 group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 shrink-0 rounded-lg bg-blue-50 dark:bg-slate-800 border border-blue-100 dark:border-slate-700 flex items-center justify-center text-blue-600 dark:text-blue-400 transition-colors">
                            <Scale size={20} />
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{court.name}</p>
                            <span className="inline-flex items-center mt-1 px-2 py-0.5 rounded text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                              {court.type}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1.5">
                          <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                            <MapPin size={14} className="text-slate-400 dark:text-slate-500 shrink-0" />
                            {court.district || '---'} {court.tehsil ? `(${court.tehsil})` : ''}
                          </div>
                          {court.court_room && (
                            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-500">
                              <Building2 size={14} className="text-slate-400 dark:text-slate-500 shrink-0" />
                              Room: {court.court_room}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 font-medium">
                          <User size={16} className="text-slate-400 dark:text-slate-500" />
                          {court.judge}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => handleEdit(court)}
                            className="p-1.5 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-lg transition-colors"
                            title="Edit Court"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button 
                            onClick={() => handleDelete(court.id, court.name)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg transition-colors"
                            title="Delete Court"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {totalPages > 1 && (
              <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/30 dark:bg-slate-800/30 transition-colors">
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Showing <span className="font-medium text-slate-900 dark:text-white">{(page - 1) * 20 + 1}</span> to <span className="font-medium text-slate-900 dark:text-white">{Math.min(page * 20, totalCount)}</span> of <span className="font-medium text-slate-900 dark:text-white">{totalCount}</span> results
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300 px-2">
                    Page {page} of {totalPages}
                  </span>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <AddCourtModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        onSuccess={fetchCourts} 
      />

      <EditCourtModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSuccess={fetchCourts}
        courtData={selectedCourt}
      />
    </div>
  );
}

export default function CourtsPage() {
  return (
    <Suspense fallback={<TableSkeleton />}>
      <CourtsPageContent />
    </Suspense>
  );
}
