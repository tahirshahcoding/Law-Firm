'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Plus, Search, Eye, Trash2, Edit2, CreditCard, Phone, Users, MapPin, ChevronLeft, ChevronRight } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';
import { API_BASE, apiFetch } from '@/lib/api';
import { useClients } from '@/hooks/api/useClients';
import AddClientModal from '@/components/AddClientModal';
import EditClientModal from '@/components/EditClientModal';
import { useAuth } from '@/context/AuthContext';
import { useUI } from '@/context/UIContext';
import { TableSkeleton } from '@/components/SkeletonLoaders';

function ClientsPageContent() {
  const searchParams = useSearchParams();
  const initialSearch = searchParams.get('search') || '';
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [page, setPage] = useState(1);
  
  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);

  const { user } = useAuth();
  const { confirm, toast, showLoading, hideLoading } = useUI();

  const canViewClients = user?.role === 'Admin' || user?.permissions?.clients?.view === true;
  const canAddClients  = user?.role === 'Admin' || user?.permissions?.clients?.add === true;
  const canEditClients = user?.role === 'Admin' || user?.permissions?.clients?.edit === true;
  const canDeleteClients = user?.role === 'Admin' || user?.permissions?.clients?.delete === true;

  const { clients, count: totalCount, totalPages, isLoading: loading, mutate } = useClients({
    page,
    limit: 20,
    search: debouncedSearchTerm,
    enabled: canViewClients,
  });


  const handleDelete = async (id: string, name: string) => {
    const ok = await confirm({
      title: 'Delete Client',
      message: `This will permanently remove the profile for ${name} and all associated records. This action cannot be undone.`,
      confirmLabel: 'Delete',
      variant: 'danger',
    });
    if (!ok) return;
    
    try {
      showLoading('Deleting client profile...');
      const res = await apiFetch(`${API_BASE}/clients/${id}/`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete client');
      toast.success(`Client "${name}" has been deleted.`);
      mutate();
    } catch (err) {
      toast.error('Failed to delete client. Please try again.');
      console.error(err);
    } finally {
      hideLoading();
    }
  };

  const handleEdit = (client: any) => {
    setSelectedClient(client);
    setIsEditModalOpen(true);
  };

  // Server handles filtering now

  if (!canViewClients) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center">
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
          <Users size={32} className="text-slate-300" />
        </div>
        <h2 className="text-xl font-bold text-slate-700">Access Denied</h2>
        <p className="text-slate-500 mt-1">You don't have permission to view clients.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Client Directory</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm sm:text-base">Manage and view all registered firm clients.</p>
        </div>
        {canAddClients && (
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 duration-300 shadow-[0_4px_12px_rgba(37,99,235,0.25)] hover:shadow-[0_6px_16px_rgba(37,99,235,0.35)] hover:-translate-y-0.5 px-5 py-2.5 rounded-xl font-medium flex items-center justify-center gap-2 text-white"
          >
            <Plus size={18} /> Add Client
          </button>
        )}
      </div>

      <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none border border-white/60 dark:border-slate-800 overflow-hidden transition-colors">
        {/* Table Toolbar */}
        <div className="p-4 border-b border-slate-200/60 dark:border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-800/50 transition-colors">
          <div className="relative w-full group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={16} />
            <input 
              type="text" 
              placeholder="Search by ID, name, CNIC, or Case No..." 
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500 shadow-sm hover:border-slate-300 dark:hover:border-slate-600"
            />
          </div>
          <div className="text-sm text-slate-500 dark:text-slate-400 font-medium whitespace-nowrap">
            {totalCount} Total
          </div>
        </div>

        {loading ? (
          <TableSkeleton />
        ) : clients.length === 0 ? (
          <div className="px-6 py-12 text-center text-slate-500 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-800/30 transition-colors">
            <div className="flex flex-col items-center justify-center max-w-sm mx-auto">
              <div className="w-12 h-12 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full flex items-center justify-center mb-3">
                <Users className="text-slate-400 dark:text-slate-500" size={24} />
              </div>
              <p className="text-slate-900 dark:text-white font-medium mb-1">
                {searchTerm ? 'No search results found' : 'No clients found'}
              </p>
              <p className="text-sm">
                {searchTerm ? 'Try adjusting your search query.' : 'Get started by clicking "Add Client" above.'}
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Mobile Card View */}
            <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800">
              {clients.map((client: any) => (
                <div key={client.id} className="p-4 hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-10 h-10 shrink-0 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/40 dark:to-indigo-900/40 border border-blue-200 dark:border-blue-800/50 flex items-center justify-center text-blue-700 dark:text-blue-400 font-bold uppercase text-sm">
                        {(client.name || 'U').charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-slate-900 dark:text-white">{client.name}</p>
                          {client.client_number && (
                            <span className="font-mono text-xs font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                              {client.client_number}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500 font-mono mt-0.5">
                          <CreditCard size={11} className="text-slate-300 dark:text-slate-600" />
                          {client.cnic}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mt-1">
                          <Phone size={11} className="text-slate-400 dark:text-slate-500" />
                          {client.mobile_number}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button 
                        onClick={() => handleEdit(client)}
                        className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                        title="Edit Client"
                      >
                        <Edit2 size={17} />
                      </button>
                      <button 
                        onClick={() => handleDelete(client.id, client.name)}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Delete Client"
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
              <table className="w-full text-left border-collapse table-fixed min-w-[800px]">
                <thead className="bg-slate-50/80 dark:bg-slate-800/80 backdrop-blur-md sticky top-0 z-10 transition-colors">
                  <tr className="border-b border-slate-200/60 dark:border-slate-700/60">
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider w-16">ID</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider w-1/3">Client Details</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider w-1/3">Contact Info</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100/80 dark:divide-slate-800/80">
                  {clients.map((client: any, index: number) => (
                    <tr 
                      key={client.id} 
                      className="hover:bg-blue-50/40 dark:hover:bg-blue-900/10 transition-all duration-300 group border-l-4 border-transparent hover:border-blue-500 animate-in fade-in slide-in-from-bottom-2"
                      style={{ animationFillMode: 'both', animationDelay: `${index * 40}ms` }}
                    >
                      <td className="px-6 py-4">
                        <span className="font-mono text-sm font-semibold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md border border-slate-200 dark:border-slate-700 whitespace-nowrap">
                          {client.client_number || '---'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 shrink-0 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/40 dark:to-indigo-900/40 border border-blue-200 dark:border-blue-800/50 flex items-center justify-center text-blue-700 dark:text-blue-400 font-bold uppercase text-sm shadow-sm group-hover:shadow group-hover:scale-105 group-hover:border-blue-300 dark:group-hover:border-blue-700 transition-all">
                            {(client.name || 'U').charAt(0)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-0.5">
                              <p className="font-semibold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{client.name}</p>
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500 font-mono">
                              <CreditCard size={12} className="text-slate-300 dark:text-slate-600" />
                              {client.cnic}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1.5">
                          <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 font-mono">
                            <Phone size={14} className="text-slate-400 dark:text-slate-500 shrink-0" />
                            {client.mobile_number}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 truncate max-w-[200px]" title={client.address}>
                            <MapPin size={14} className="text-slate-400 dark:text-slate-500 shrink-0" />
                            <span className="truncate">{client.address}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-700 ring-1 ring-emerald-500/20 shadow-sm">
                          Active
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="View Profile"
                          >
                            <Eye size={18} />
                          </button>
                          <button 
                            onClick={() => handleEdit(client)}
                            className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                            title="Edit Client"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button 
                            onClick={() => handleDelete(client.id, client.name)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Delete Client"
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

      <AddClientModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        onSuccess={() => mutate()} 
      />

      <EditClientModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSuccess={() => mutate()}
        clientData={selectedClient}
      />
    </div>
  );
}

export default function ClientsPage() {
  return (
    <Suspense fallback={<TableSkeleton />}>
      <ClientsPageContent />
    </Suspense>
  );
}

