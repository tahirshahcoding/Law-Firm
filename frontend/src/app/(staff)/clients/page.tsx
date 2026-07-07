'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Plus, Search, Eye, Trash2, Edit2, CreditCard, Phone, Users, MapPin, ChevronLeft, ChevronRight } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';
import { API_BASE, apiFetch } from '@/lib/api';
import AddClientModal from '@/components/AddClientModal';
import EditClientModal from '@/components/EditClientModal';
import { useAuth } from '@/context/AuthContext';
import { useUI } from '@/context/UIContext';
import { TableSkeleton } from '@/components/SkeletonLoaders';

function ClientsPageContent() {
  const searchParams = useSearchParams();
  const initialSearch = searchParams.get('search') || '';
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  
  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);

  const { user } = useAuth();
  const { confirm, toast } = useUI();

  const canViewClients = user?.role === 'Admin' || user?.permissions?.clients?.view === true;
  const canAddClients  = user?.role === 'Admin' || user?.permissions?.clients?.add === true;
  const canEditClients = user?.role === 'Admin' || user?.permissions?.clients?.edit === true;
  const canDeleteClients = user?.role === 'Admin' || user?.permissions?.clients?.delete === true;

  const fetchClients = () => {
    if (!canViewClients) return;
    setLoading(true);
    const query = new URLSearchParams({
      page: page.toString(),
      limit: '20',
      ...(debouncedSearchTerm && { search: debouncedSearchTerm })
    });

    apiFetch(`${API_BASE}/clients/?${query.toString()}`)
      .then(res => res.json())
      .then(data => {
        if (data && Array.isArray(data.results)) {
          setClients(data.results);
          setTotalCount(data.count ?? data.results.length);
          setTotalPages(Math.ceil((data.count ?? data.results.length) / 20));
        } else if (Array.isArray(data)) {
          setClients(data);
          setTotalCount(data.length);
          setTotalPages(1);
        } else {
          setClients([]);
          setTotalCount(0);
          setTotalPages(1);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch clients:', err);
        setClients([]);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchClients();
  }, [page, debouncedSearchTerm]);


  const handleDelete = async (id: string, name: string) => {
    const ok = await confirm({
      title: 'Delete Client',
      message: `This will permanently remove the profile for ${name} and all associated records. This action cannot be undone.`,
      confirmLabel: 'Delete',
      variant: 'danger',
    });
    if (!ok) return;
    
    try {
      const res = await apiFetch(`${API_BASE}/clients/${id}/`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete client');
      toast.success(`Client "${name}" has been deleted.`);
      fetchClients();
    } catch (err) {
      toast.error('Failed to delete client. Please try again.');
      console.error(err);
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
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Client Directory</h2>
          <p className="text-slate-500 mt-1 text-sm sm:text-base">Manage and view all registered firm clients.</p>
        </div>
        {canAddClients && (
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-medium transition-all duration-200 shadow-sm shadow-blue-600/20 flex items-center justify-center gap-2"
          >
            <Plus size={18} /> Add Client
          </button>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] border border-slate-100 overflow-hidden">
        {/* Table Toolbar */}
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-50/50">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Search by ID, name, CNIC, or Case No..." 
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400"
            />
          </div>
          <div className="text-sm text-slate-500 font-medium whitespace-nowrap">
            {totalCount} Total
          </div>
        </div>

        {loading ? (
          <TableSkeleton />
        ) : clients.length === 0 ? (
          <div className="px-6 py-12 text-center text-slate-500 bg-slate-50/50">
            <div className="flex flex-col items-center justify-center max-w-sm mx-auto">
              <div className="w-12 h-12 bg-white border border-slate-200 rounded-full flex items-center justify-center mb-3">
                <Users className="text-slate-400" size={24} />
              </div>
              <p className="text-slate-900 font-medium mb-1">
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
            <div className="md:hidden divide-y divide-slate-100">
              {clients.map((client: any) => (
                <div key={client.id} className="p-4 hover:bg-slate-50/80 transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-10 h-10 shrink-0 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 border border-blue-200 flex items-center justify-center text-blue-700 font-bold uppercase text-sm">
                        {(client.name || 'U').charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-slate-900">{client.name}</p>
                          {client.client_number && (
                            <span className="font-mono text-xs font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                              {client.client_number}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono mt-0.5">
                          <CreditCard size={11} className="text-slate-300" />
                          {client.cnic}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                          <Phone size={11} className="text-slate-400" />
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
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="bg-white border-b border-slate-100">
                    <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider w-16">ID</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider w-1/3">Client Details</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider w-1/3">Contact Info</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {clients.map((client: any) => (
                    <tr key={client.id} className="hover:bg-slate-50/80 transition-colors duration-200 group">
                      <td className="px-6 py-4">
                        <span className="font-mono text-sm font-semibold text-slate-600 bg-slate-100 px-2 py-1 rounded-md border border-slate-200 whitespace-nowrap">
                          {client.client_number || '---'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 shrink-0 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 border border-blue-200 flex items-center justify-center text-blue-700 font-bold uppercase text-sm">
                            {(client.name || 'U').charAt(0)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-0.5">
                              <p className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">{client.name}</p>
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono">
                              <CreditCard size={12} className="text-slate-300" />
                              {client.cnic}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1.5">
                          <div className="flex items-center gap-2 text-sm text-slate-600 font-mono">
                            <Phone size={14} className="text-slate-400 shrink-0" />
                            {client.mobile_number}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-slate-500 truncate max-w-[200px]" title={client.address}>
                            <MapPin size={14} className="text-slate-400 shrink-0" />
                            <span className="truncate">{client.address}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
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

      <AddClientModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        onSuccess={fetchClients} 
      />

      <EditClientModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSuccess={fetchClients}
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

