'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus, Search, FolderOpen, MoreVertical, Eye, Trash2, Edit2, Scale, UserX, Clock, Gavel, ChevronLeft, ChevronRight, Download } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';
import { API_BASE, apiFetch } from '@/lib/api';
import AddCaseModal from '@/components/AddCaseModal';
import EditCaseModal from '@/components/EditCaseModal';
import { useAuth } from '@/context/AuthContext';
import { useUI } from '@/context/UIContext';
import { TableSkeleton } from '@/components/SkeletonLoaders';
import { CASE_CATEGORIES, CASE_PRIORITIES, CASE_STATUSES } from '@/lib/constants';
import StatusDropdown from '@/components/StatusDropdown';

function CasesPageContent() {
  const searchParams = useSearchParams();
  const initialSearch = searchParams.get('search') || '';
  const [cases, setCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [filterCategory, setFilterCategory] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  
  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedCase, setSelectedCase] = useState(null);

  const { user } = useAuth();
  const { confirm, toast, showLoading, hideLoading } = useUI();

  const canViewCases   = user?.role === 'Admin' || user?.permissions?.cases?.view === true;
  const canAddCases    = user?.role === 'Admin' || user?.permissions?.cases?.add === true;
  const canEditCases   = user?.role === 'Admin' || user?.permissions?.cases?.edit === true;
  const canDeleteCases = user?.role === 'Admin' || user?.permissions?.cases?.delete === true;

  const fetchCases = () => {
    if (!canViewCases) return;
    setLoading(true);
    const query = new URLSearchParams({
      page: page.toString(),
      limit: '20',
      ...(debouncedSearchTerm && { search: debouncedSearchTerm }),
      ...(filterCategory && { category: filterCategory }),
      ...(filterPriority && { priority: filterPriority }),
      ...(filterStatus && { status: filterStatus }),
    });

    apiFetch(`${API_BASE}/cases/?${query.toString()}`)
      .then(res => res.json())
      .then(data => {
        if (data && Array.isArray(data.results)) {
          setCases(data.results);
          setTotalCount(data.count ?? data.results.length);
          setTotalPages(Math.ceil((data.count ?? data.results.length) / 20));
        } else if (Array.isArray(data)) {
          setCases(data);
          setTotalCount(data.length);
          setTotalPages(1);
        } else {
          // API returned an error object or unexpected shape — stay safe
          setCases([]);
          setTotalCount(0);
          setTotalPages(1);
        }
      })
      .catch(err => {
        console.error(err);
        toast.error('Could not load cases.');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const handleInlineStatusUpdate = async (caseId: string, newStatus: string) => {
    try {
      const res = await apiFetch(`${API_BASE}/cases/${caseId}/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        toast.success('Status updated');
        fetchCases();
      } else {
        toast.error('Failed to update status');
      }
    } catch (err) {
      toast.error('Could not update status');
    }
  };

  useEffect(() => {
    fetchCases();
  }, [page, debouncedSearchTerm, filterCategory, filterPriority, filterStatus]);


  const handleDelete = async (id: string, caseNumber: string) => {
    const ok = await confirm({
      title: 'Delete Case',
      message: `This will permanently delete Case ${caseNumber} along with all hearings, invoices, and payments. This action cannot be undone.`,
      confirmLabel: 'Delete',
      variant: 'danger',
    });
    if (!ok) return;
    
    try {
      showLoading('Deleting case record...');
      const res = await apiFetch(`${API_BASE}/cases/${id}/`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete case');
      toast.success(`Case ${caseNumber} has been deleted.`);
      fetchCases();
    } catch (err) {
      toast.error('Failed to delete case. Please try again.');
      console.error(err);
    } finally {
      hideLoading();
    }
  };

  const handleEdit = (caseItem: any) => {
    setSelectedCase(caseItem);
    setIsEditModalOpen(true);
  };

  // Server handles filtering now

  const exportToCSV = async () => {
    // Fetch all cases (no pagination) for export
    try {
      const res = await apiFetch(`${API_BASE}/cases/?limit=10000`);
      const data = await res.json();
      const allCases = data.results || data;
      const headers = ['Case Number', 'Client', 'Opponent', 'Court', 'Judge', 'Status', 'Total Fee', 'Created'];
      const rows = allCases.map((c: any) => [
        c.case_number,
        c.client_name || '',
        c.opponent_name,
        c.court_details?.name || '---',
        c.court_details?.judge || '---',
        c.status || 'Active',
        c.total_fee,
        c.created_at ? new Date(c.created_at).toLocaleDateString('en-GB') : ''
      ]);
      const csvContent = [headers, ...rows].map(row => row.map((cell: any) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `cases_export_${new Date().toISOString().slice(0, 10)}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed:', err);
    }
  };

  if (!canViewCases) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center">
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
          <FolderOpen size={32} className="text-slate-300" />
        </div>
        <h2 className="text-xl font-bold text-slate-700">Access Denied</h2>
        <p className="text-slate-500 mt-1">You don't have permission to view cases.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Case Register</h2>
          <p className="text-slate-500 mt-1 text-sm sm:text-base">Track and manage active legal proceedings.</p>
        </div>
        {canAddCases && (
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 duration-300 shadow-[0_4px_12px_rgba(37,99,235,0.25)] hover:shadow-[0_6px_16px_rgba(37,99,235,0.35)] hover:-translate-y-0.5 px-5 py-2.5 rounded-xl font-medium flex items-center justify-center gap-2 text-white"
          >
            <Plus size={18} /> New Case
          </button>
        )}
      </div>

      <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/60 overflow-hidden">
        {/* Table Toolbar */}
        <div className="p-4 border-b border-slate-200/60 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-slate-50/50">
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto flex-1">
            <div className="relative w-full sm:max-w-xs group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={16} />
              <input 
                type="text" 
                placeholder="Search by Case No. or Opponent..." 
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400 shadow-sm hover:border-slate-300"
              />
            </div>
            
            <div className="flex gap-2 w-full sm:w-auto">
              <select 
                value={filterCategory} 
                onChange={(e) => { setFilterCategory(e.target.value); setPage(1); }}
                className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:border-blue-500 flex-1 sm:flex-none min-w-[120px]"
              >
                <option value="">All Categories</option>
                {CASE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <select 
                value={filterPriority} 
                onChange={(e) => { setFilterPriority(e.target.value); setPage(1); }}
                className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:border-blue-500 flex-1 sm:flex-none min-w-[110px]"
              >
                <option value="">All Priorities</option>
                {CASE_PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
              <select 
                value={filterStatus} 
                onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
                className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:border-blue-500 flex-1 sm:flex-none min-w-[120px]"
              >
                <option value="">All Statuses</option>
                {CASE_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-3 self-end md:self-auto">
            <button
              onClick={exportToCSV}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-sm font-medium rounded-lg border border-emerald-200 transition-colors whitespace-nowrap"
            >
              <Download size={14} /> Export Excel
            </button>
            <span className="text-sm text-slate-500 font-medium whitespace-nowrap">
              {totalCount} Results
            </span>
          </div>
        </div>

        {loading ? (
          <TableSkeleton />
        ) : cases.length === 0 ? (
          <div className="px-6 py-12 text-center text-slate-500 bg-slate-50/50">
            <div className="flex flex-col items-center justify-center max-w-sm mx-auto">
              <div className="w-12 h-12 bg-white border border-slate-200 rounded-full flex items-center justify-center mb-3">
                <FolderOpen className="text-slate-400" size={24} />
              </div>
              <p className="text-slate-900 font-medium mb-1">
                {searchTerm ? 'No cases found matching query' : 'No active cases'}
              </p>
              <p className="text-sm">
                {searchTerm ? 'Try adjusting your search terms.' : "Your firm's active legal proceedings will appear here."}
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Mobile Card View */}
            <div className="md:hidden divide-y divide-slate-100">
              {cases.map((caseItem: any) => (
                <div key={caseItem.id} className="p-4 hover:bg-slate-50/80 transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="w-9 h-9 shrink-0 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500">
                        <FolderOpen size={16} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1.5">
                          <p className="font-semibold text-slate-900">{caseItem.case_number}</p>
                          {caseItem.priority && (
                            <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                              caseItem.priority === 'Urgent' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                              caseItem.priority === 'High' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                              'bg-slate-50 text-slate-500 border-slate-200'
                            }`}>
                              {caseItem.priority}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
                          <UserX size={11} className="text-rose-400 shrink-0" />
                          <span className="truncate">vs. {caseItem.opponent_name}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-slate-600 mt-1 font-medium">
                          <Scale size={11} className="text-slate-400 shrink-0" />
                          <span className="truncate">{caseItem.court_details?.name || '---'}</span>
                        </div>
                      <div className="mt-2 flex items-center gap-2">
                          <StatusDropdown 
                            value={caseItem.status} 
                            onChange={(newStatus) => handleInlineStatusUpdate(caseItem.id, newStatus)} 
                          />
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Link href={`/cases/${caseItem.id}`} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="View Case">
                        <Eye size={17} />
                      </Link>
                      <button 
                        onClick={() => handleEdit(caseItem)}
                        className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                        title="Edit Case"
                      >
                        <Edit2 size={17} />
                      </button>
                      <button 
                        onClick={() => handleDelete(caseItem.id, caseItem.case_number)}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Delete Case"
                      >
                        <Trash2 size={17} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead className="bg-slate-50/80 backdrop-blur-md sticky top-0 z-10">
                  <tr className="border-b border-slate-200/60">
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider w-1/3">Case Reference</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider w-1/3">Judiciary Details</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100/80">
                  {cases.map((caseItem: any, index: number) => (
                    <tr 
                      key={caseItem.id} 
                      className="hover:bg-blue-50/40 transition-all duration-300 group border-l-4 border-transparent hover:border-blue-500 animate-in fade-in slide-in-from-bottom-2"
                      style={{ animationFillMode: 'both', animationDelay: `${index * 40}ms` }}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 shrink-0 rounded-xl bg-gradient-to-br from-slate-100 to-slate-50 border border-slate-200 flex items-center justify-center text-slate-500 shadow-sm group-hover:shadow group-hover:border-blue-200 group-hover:text-blue-600 transition-all">
                            <FolderOpen size={18} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-0.5">
                              <p className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors cursor-pointer">{caseItem.case_number}</p>
                              {caseItem.priority && (
                                <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                                  caseItem.priority === 'Urgent' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                                  caseItem.priority === 'High' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                                  'bg-slate-50 text-slate-500 border-slate-200'
                                }`}>
                                  {caseItem.priority}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1 max-w-[200px]">
                              <UserX size={12} className="text-rose-400 shrink-0" />
                              <span className="truncate">vs. {caseItem.opponent_name}</span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1.5">
                          <div className="flex items-center gap-2 text-sm text-slate-700 font-medium">
                            <Scale size={14} className="text-slate-400 shrink-0" />
                            <span className="truncate max-w-[250px]">{caseItem.court_details?.name || '---'}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-slate-500">
                            <Gavel size={14} className="text-slate-400 shrink-0" />
                            <span>{caseItem.court_details?.judge || '---'}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <StatusDropdown 
                          value={caseItem.status} 
                          onChange={(newStatus) => handleInlineStatusUpdate(caseItem.id, newStatus)} 
                        />
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Link 
                            href={`/cases/${caseItem.id}`}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="View Case"
                          >
                            <Eye size={18} />
                          </Link>
                          <button 
                            onClick={() => handleEdit(caseItem)}
                            className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                            title="Edit Case"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button 
                            onClick={() => handleDelete(caseItem.id, caseItem.case_number)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Delete Case"
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
            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/30">
                <p className="text-sm text-slate-500">
                  Showing <span className="font-medium text-slate-900">{(page - 1) * 20 + 1}</span> to <span className="font-medium text-slate-900">{Math.min(page * 20, totalCount)}</span> of <span className="font-medium text-slate-900">{totalCount}</span> results
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <span className="text-sm font-medium text-slate-700 px-2">
                    Page {page} of {totalPages}
                  </span>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <AddCaseModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        onSuccess={fetchCases} 
      />

      <EditCaseModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSuccess={fetchCases}
        caseData={selectedCase}
      />
    </div>
  );
}

export default function CasesPage() {
  return (
    <Suspense fallback={<TableSkeleton />}>
      <CasesPageContent />
    </Suspense>
  );
}

