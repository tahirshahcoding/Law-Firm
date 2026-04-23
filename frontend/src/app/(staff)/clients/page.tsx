'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, Eye, Trash2, Edit2, CreditCard, Phone, Users, MapPin } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import AddClientModal from '@/components/AddClientModal';
import EditClientModal from '@/components/EditClientModal';
import { useAuth } from '@/context/AuthContext';

export default function ClientsPage() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);

  const { user } = useAuth();

  const fetchClients = () => {
    if (user && user.role !== 'Admin' && !user.permissions?.manage_clients) {
      window.location.href = '/';
      return;
    }
    setLoading(true);
    apiFetch('http://localhost:8000/api/clients/')
      .then(res => res.json())
      .then(data => {
        setClients(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch clients:', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete the profile for ${name}?`)) return;
    
    try {
      const res = await apiFetch(`http://localhost:8000/api/clients/${id}/`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete client');
      fetchClients();
    } catch (err) {
      alert('Error deleting client.');
      console.error(err);
    }
  };

  const handleEdit = (client: any) => {
    setSelectedClient(client);
    setIsEditModalOpen(true);
  };

  // Set up local search filtering
  const filteredClients = clients.filter((c: any) => 
    c.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.cnic?.includes(searchTerm) ||
    c.mobile_number?.includes(searchTerm) ||
    c.client_number?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Client Directory</h2>
          <p className="text-slate-500 mt-1">Manage and view all registered firm clients.</p>
        </div>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-medium transition-all duration-200 shadow-sm shadow-blue-600/20 flex items-center gap-2"
        >
          <Plus size={18} /> Add Client
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] border border-slate-100 overflow-hidden">
        {/* Table Toolbar */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Search by ID, name, CNIC, or phone..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400"
            />
          </div>
          <div className="text-sm text-slate-500 font-medium whitespace-nowrap ml-4">
            {filteredClients.length} Total
          </div>
        </div>

        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center text-slate-400">
            <div className="w-8 h-8 border-4 border-slate-100 border-t-blue-600 rounded-full animate-spin mb-4"></div>
            <p>Loading database...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
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
                {filteredClients.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500 bg-slate-50/50">
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
                    </td>
                  </tr>
                ) : (
                  filteredClients.map((client: any) => (
                    <tr key={client.id} className="hover:bg-slate-50/80 transition-colors duration-200 group">
                      <td className="px-6 py-4">
                        <span className="font-mono text-sm font-semibold text-slate-600 bg-slate-100 px-2 py-1 rounded-md border border-slate-200 whitespace-nowrap hidden sm:inline-block">
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
                  ))
                )}
              </tbody>
            </table>
          </div>
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
