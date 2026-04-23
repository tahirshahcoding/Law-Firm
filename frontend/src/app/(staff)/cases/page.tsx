'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, FolderOpen, MoreVertical, Eye, Trash2, Edit2, Scale, UserX, Clock, Gavel } from 'lucide-react';
import { API_BASE, apiFetch } from '@/lib/api';
import AddCaseModal from '@/components/AddCaseModal';
import EditCaseModal from '@/components/EditCaseModal';
import { useAuth } from '@/context/AuthContext';

export default function CasesPage() {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedCase, setSelectedCase] = useState(null);

  const { user } = useAuth();

  const fetchCases = () => {
    if (user && user.role !== 'Admin' && !user.permissions?.manage_cases) {
      window.location.href = '/';
      return;
    }
    setLoading(true);
    apiFetch('${API_BASE}/cases/')
      .then(res => res.json())
      .then(data => {
        setCases(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch cases:', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchCases();
  }, []);

  const handleDelete = async (id: string, caseNumber: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete Case ${caseNumber}?`)) return;
    
    try {
      const res = await apiFetch(`${API_BASE}/cases/${id}/`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete case');
      fetchCases();
    } catch (err) {
      alert('Error deleting case.');
      console.error(err);
    }
  };

  const handleEdit = (caseItem: any) => {
    setSelectedCase(caseItem);
    setIsEditModalOpen(true);
  };

  // Set up local search filtering
  const filteredCases = cases.filter((c: any) => 
    c.case_number?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.opponent_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.court?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Case Register</h2>
          <p className="text-slate-500 mt-1">Track and manage active legal proceedings.</p>
        </div>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-medium transition-all duration-200 shadow-sm shadow-blue-600/20 flex items-center gap-2"
        >
          <Plus size={18} /> New Case
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] border border-slate-100 overflow-hidden">
        {/* Table Toolbar */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Search by Case No. or Opponent..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400"
            />
          </div>
          <div className="text-sm text-slate-500 font-medium whitespace-nowrap ml-4">
            {filteredCases.length} Active
          </div>
        </div>

        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center text-slate-400">
            <div className="w-8 h-8 border-4 border-slate-100 border-t-blue-600 rounded-full animate-spin mb-4"></div>
            <p>Loading cases mapping...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-white border-b border-slate-100">
                  <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider w-1/3">Case Reference</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider w-1/3">Judiciary Details</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCases.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-slate-500 bg-slate-50/50">
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
                    </td>
                  </tr>
                ) : (
                  filteredCases.map((caseItem: any) => (
                    <tr key={caseItem.id} className="hover:bg-slate-50/80 transition-colors duration-200 group">
                      <td className="px-6 py-4">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 shrink-0 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500">
                            <FolderOpen size={18} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-0.5">
                              <p className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors cursor-pointer">{caseItem.case_number}</p>
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
                            <span className="truncate max-w-[250px]">{caseItem.court}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-slate-500">
                            <Gavel size={14} className="text-slate-400 shrink-0" />
                            <span>{caseItem.judge}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                          <Clock size={12} className="mr-1 mt-[1px]" /> {caseItem.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="View Case"
                          >
                            <Eye size={18} />
                          </button>
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
                  ))
                )}
              </tbody>
            </table>
          </div>
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
