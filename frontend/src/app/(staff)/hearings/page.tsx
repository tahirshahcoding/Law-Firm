'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, Calendar, Edit2, Trash2, MapPin, AlignLeft, FolderOpen, MoreVertical, Check, FileText } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import AddHearingModal from '@/components/AddHearingModal';
import EditHearingModal from '@/components/EditHearingModal';
import HearingDocumentsModal from '@/components/HearingDocumentsModal';
import { useAuth } from '@/context/AuthContext';

export default function HearingsPage() {
  const [hearings, setHearings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedHearing, setSelectedHearing] = useState(null);
  const [isDocsModalOpen, setIsDocsModalOpen] = useState(false);
  const [selectedDocsHearing, setSelectedDocsHearing] = useState(null);

  const { user } = useAuth();

  const fetchHearings = () => {
    if (user && user.role !== 'Admin' && !user.permissions?.manage_cases) {
      window.location.href = '/';
      return;
    }
    setLoading(true);
    apiFetch('http://localhost:8000/api/hearings/')
      .then(res => res.json())
      .then(data => {
        // Sort chronologically (closest dates first)
        const sortedData = data.sort((a: any, b: any) => new Date(a.hearing_date).getTime() - new Date(b.hearing_date).getTime());
        setHearings(sortedData);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch hearings:', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchHearings();
  }, []);

  const handleDelete = async (id: string, caseNumber: string, date: string) => {
    if (!window.confirm(`Delete the hearing scheduled on ${date} for Case ${caseNumber}?`)) return;
    
    try {
      const res = await apiFetch(`http://localhost:8000/api/hearings/${id}/`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete hearing');
      fetchHearings();
    } catch (err) {
      alert('Error deleting hearing.');
      console.error(err);
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

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Legal Hearings</h2>
          <p className="text-slate-500 mt-1">Manage all upcoming firm hearings and schedules.</p>
        </div>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-medium transition-all duration-200 shadow-sm shadow-blue-600/20 flex items-center gap-2"
        >
          <Plus size={18} /> Schedule Hearing
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] border border-slate-100 overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Search by date (DD/MM/YYYY), Case No, or notes..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400"
            />
          </div>
          <div className="text-sm text-slate-500 font-medium whitespace-nowrap ml-4">
            {filteredHearings.length} Scheduled
          </div>
        </div>

        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center text-slate-400">
            <div className="w-8 h-8 border-4 border-slate-100 border-t-rose-500 rounded-full animate-spin mb-4"></div>
            <p>Syncing schedule records...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-white border-b border-slate-100">
                  <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider w-1/4">Date</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider w-1/4">Target Case</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider w-1/3">Notes & Next Date</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredHearings.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-slate-500 bg-slate-50/50">
                      <div className="flex flex-col items-center justify-center max-w-sm mx-auto">
                        <div className="w-12 h-12 bg-white border border-slate-200 rounded-full flex items-center justify-center mb-3">
                          <Calendar className="text-slate-400" size={24} />
                        </div>
                        <p className="text-slate-900 font-medium mb-1">
                          {searchTerm ? 'No schedules found' : 'The Hearings list is empty'}
                        </p>
                        <p className="text-sm">
                          {searchTerm ? 'Adjust your search parameters.' : 'Click "Schedule Hearing" to begin planning.'}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredHearings.map((h: any) => {
                    const isToday = h.hearing_date === new Date().toISOString().split('T')[0];
                    return (
                      <tr key={h.id} className={`hover:bg-slate-50/80 transition-colors duration-200 group ${isToday ? 'bg-rose-50/30' : ''}`}>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className={`p-2.5 rounded-xl border ${isToday ? 'bg-rose-100 border-rose-200 text-rose-600' : 'bg-slate-100 border-slate-200 text-slate-500'}`}>
                              <Calendar size={18} />
                            </div>
                            <div>
                              <p className={`font-semibold tracking-wide ${isToday ? 'text-rose-700' : 'text-slate-900'}`}>{formatDate(h.hearing_date)}</p>
                              {isToday && <span className="text-[10px] uppercase font-bold text-rose-500 tracking-wider">Today</span>}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <div className="flex items-center gap-1.5 text-slate-900 font-medium group-hover:text-blue-600 transition-colors">
                              <FolderOpen size={14} className="text-slate-400" />
                              {h.case_number}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1.5">
                            {h.notes ? (
                              <div className="flex items-start gap-2 text-sm text-slate-600">
                                <AlignLeft size={14} className="text-slate-400 shrink-0 mt-0.5" />
                                <span className="line-clamp-2 max-w-[250px]" title={h.notes}>{h.notes}</span>
                              </div>
                            ) : (
                              <span className="text-sm text-slate-400 italic">No notes attached.</span>
                            )}
                            
                            {h.next_date && (
                              <div className="flex items-center gap-1.5 text-[11px] uppercase font-bold text-emerald-600 bg-emerald-50 w-fit px-2 py-0.5 rounded border border-emerald-100 tracking-wide mt-1">
                                ND: {formatDate(h.next_date)}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                              onClick={() => handleOpenDocs(h)}
                              className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors relative"
                              title="Documents"
                            >
                              <FileText size={18} />
                              {h.documents && h.documents.length > 0 && (
                                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-[9px] font-bold text-white ring-2 ring-white">
                                  {h.documents.length}
                                </span>
                              )}
                            </button>
                            <button 
                              onClick={() => handleEdit(h)}
                              className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                              title="Update Hearing"
                            >
                              <Edit2 size={18} />
                            </button>
                            <button 
                              onClick={() => handleDelete(h.id, h.case_number, h.hearing_date)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                              title="Cancel Hearing"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
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
