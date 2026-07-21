'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Plus, Search, Trash2, Edit2, User, Building2, Briefcase, ChevronLeft, ChevronRight } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';
import { API_BASE, apiFetch } from '@/lib/api';
import AddJudgeModal from '@/components/AddJudgeModal';
import EditJudgeModal from '@/components/EditJudgeModal';
import { useAuth } from '@/context/AuthContext';
import { useUI } from '@/context/UIContext';
import { TableSkeleton } from '@/components/SkeletonLoaders';
import useSWR from 'swr';
import { swrFetcher } from '@/lib/fetcher';

function JudgesPageContent() {
  const searchParams = useSearchParams();
  const initialSearch = searchParams.get('search') || '';
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [page, setPage] = useState(1);
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedJudge, setSelectedJudge] = useState(null);

  const { user } = useAuth();
  const { confirm, toast, showLoading, hideLoading } = useUI();

  // Restrict to Admin for master data.
  const canManageJudges = user?.role === 'Admin';

  const query = new URLSearchParams({
    page: page.toString(),
    limit: '20',
    ...(debouncedSearchTerm && { search: debouncedSearchTerm })
  });

  const { data, isLoading: loading, mutate: fetchJudges } = useSWR(`${API_BASE}/judges/?${query.toString()}`, swrFetcher);

  const judges = data?.results || (Array.isArray(data) ? data : []);
  const totalCount = data?.count ?? judges.length;
  const totalPages = Math.ceil((data?.count ?? judges.length) / 20);


  const handleDelete = async (id: string, name: string) => {
    const ok = await confirm({
      title: 'Delete Judge',
      message: `Are you sure you want to delete ${name}? This action cannot be undone and will fail if cases are currently assigned to this judge.`,
      confirmLabel: 'Delete',
      variant: 'danger',
    });
    if (!ok) return;
    
    try {
      showLoading('Deleting judge...');
      const res = await apiFetch(`${API_BASE}/judges/${id}/`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        if (res.status === 400 || res.status === 403 || res.status === 500) {
           throw new Error('Cannot delete this judge because they are associated with active cases.');
        }
        throw new Error('Failed to delete judge');
      }
      toast.success(`Judge "${name}" has been deleted.`);
      fetchJudges();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete judge. Please try again.');
      console.error(err);
    } finally {
      hideLoading();
    }
  };

  const handleEdit = (judge: any) => {
    setSelectedJudge(judge);
    setIsEditModalOpen(true);
  };

  if (!canManageJudges) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center">
        <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4 transition-colors">
          <User size={32} className="text-slate-300 dark:text-slate-600" />
        </div>
        <h2 className="text-xl font-bold text-slate-700 dark:text-slate-300">Access Denied</h2>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Only Administrators can manage master judge data.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Judge Management</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm sm:text-base">Maintain master data for honourable judges.</p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-2.5 rounded-xl font-medium transition-all duration-300 shadow-[0_4px_12px_rgba(37,99,235,0.25)] hover:shadow-[0_6px_16px_rgba(37,99,235,0.35)] hover:-translate-y-0.5 flex items-center justify-center gap-2"
        >
          <Plus size={18} /> Add Judge
        </button>
      </div>

      <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none border border-white/60 dark:border-slate-800/60 overflow-hidden transition-colors">
        <div className="p-4 border-b border-slate-200/60 dark:border-slate-700/60 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-800/50 transition-colors">
          <div className="relative w-full group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 group-focus-within:text-blue-500 transition-colors" size={16} />
            <input 
              type="text" 
              placeholder="Search by judge name, designation, or court..." 
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500 shadow-sm hover:border-slate-300 dark:hover:border-slate-600 text-slate-900 dark:text-white"
            />
          </div>
          <div className="text-sm text-slate-500 dark:text-slate-400 font-medium whitespace-nowrap">
            {totalCount} Total
          </div>
        </div>

        {loading ? (
          <TableSkeleton />
        ) : judges.length === 0 ? (
          <div className="px-6 py-12 text-center text-slate-500 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-900/50 transition-colors">
            <div className="flex flex-col items-center justify-center max-w-sm mx-auto">
              <div className="w-12 h-12 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full flex items-center justify-center mb-3">
                <User className="text-slate-400 dark:text-slate-500" size={24} />
              </div>
              <p className="text-slate-900 dark:text-white font-medium mb-1">
                {searchTerm ? 'No search results found' : 'No judges found'}
              </p>
              <p className="text-sm">
                {searchTerm ? 'Try adjusting your search query.' : 'Get started by clicking "Add Judge" above.'}
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead className="bg-slate-50/80 dark:bg-slate-800/80 backdrop-blur-md sticky top-0 z-10 transition-colors">
                  <tr className="border-b border-slate-200/60 dark:border-slate-700/60">
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider w-1/3">Judge Details</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Court</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100/80 dark:divide-slate-800/80">
                  {judges.map((judge: any, index: number) => (
                    <tr 
                      key={judge.id} 
                      className="hover:bg-blue-50/40 dark:hover:bg-slate-800/40 transition-all duration-300 group border-l-4 border-transparent hover:border-blue-500 animate-in fade-in slide-in-from-bottom-2"
                      style={{ animationFillMode: 'both', animationDelay: `${index * 40}ms` }}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 shrink-0 rounded-xl bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-900/30 dark:to-blue-900/30 border border-blue-100 dark:border-blue-800 flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-sm group-hover:shadow group-hover:border-blue-300 dark:group-hover:border-blue-700 group-hover:scale-105 transition-all">
                            <User size={20} />
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{judge.name}</p>
                            {judge.designation && (
                              <div className="flex items-center gap-1 mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">
                                <Briefcase size={12} />
                                <span>{judge.designation}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                          <Building2 size={16} className="text-slate-400 dark:text-slate-500 shrink-0" />
                          {judge.court_name || 'Unknown Court'}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => handleEdit(judge)}
                            className="p-1.5 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-lg transition-colors"
                            title="Edit Judge"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button 
                            onClick={() => handleDelete(judge.id, judge.name)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg transition-colors"
                            title="Delete Judge"
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

      <AddJudgeModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        onSuccess={fetchJudges} 
      />

      <EditJudgeModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSuccess={fetchJudges}
        judge={selectedJudge}
      />
    </div>
  );
}

export default function JudgesPage() {
  return (
    <Suspense fallback={<TableSkeleton />}>
      <JudgesPageContent />
    </Suspense>
  );
}
