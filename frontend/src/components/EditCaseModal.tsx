'use client';

import { useState, useEffect, useRef } from 'react';
import { X, FolderOpen, Scale, Gavel, UserX, CircleDollarSign, Search, Check } from 'lucide-react';
import { API_BASE, apiFetch } from '@/lib/api';

interface EditCaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  caseData: any | null;
}

export default function EditCaseModal({ isOpen, onClose, onSuccess, caseData }: EditCaseModalProps) {
  const [formData, setFormData] = useState({
    client: '',
    case_number: '',
    court: '',
    judge: '',
    opponent_name: '',
    total_fee: '',
    status: 'Active'
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Combobox specific state
  const [clients, setClients] = useState<any[]>([]);
  const [isClientDropdownOpen, setIsClientDropdownOpen] = useState(false);
  const [clientSearchText, setClientSearchText] = useState('');
  const [selectedClientName, setSelectedClientName] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      // Fetch clients for the dropdown
      apiFetch(`${API_BASE}/clients/`)
        .then(res => res.json())
        .then(data => {
          setClients(data);
          
          // Pre-populate actual data
          if (caseData) {
            setFormData({
              client: caseData.client || '',
              case_number: caseData.case_number || '',
              court: caseData.court || '',
              judge: caseData.judge || '',
              opponent_name: caseData.opponent_name || '',
              total_fee: caseData.total_fee || '',
              status: caseData.status || 'Active'
            });
            
            // Sync client display name
            const matchingClient = data.find((c: any) => c.id === caseData.client);
            if (matchingClient) {
              setSelectedClientName(`${matchingClient.client_number ? matchingClient.client_number + ' - ' : ''}${matchingClient.name}`);
            }
          }
        })
        .catch(err => console.error("Failed to load clients:", err));
    }
  }, [isOpen, caseData]);

  // Handle clicking outside of combobox to close it
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsClientDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!isOpen || !caseData) return null;

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(clientSearchText.toLowerCase()) || 
    (c.client_number && c.client_number.toLowerCase().includes(clientSearchText.toLowerCase()))
  );

  const selectClient = (client: any) => {
    setFormData({ ...formData, client: client.id });
    setSelectedClientName(`${client.client_number ? client.client_number + ' - ' : ''}${client.name}`);
    setIsClientDropdownOpen(false);
    setClientSearchText('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.client) {
      setError("Please select a client from the dropdown.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await apiFetch(`${API_BASE}/cases/${caseData.id}/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || data.detail || JSON.stringify(data) || 'Failed to update case');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-6 border-b border-slate-100 shrink-0">
          <h2 className="text-xl font-bold text-slate-900">Edit Case Details</h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 custom-scrollbar">
          {error && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-sm text-rose-600 font-medium">
              {error}
            </div>
          )}

          {/* Client Selection Combobox */}
          <div className="relative" ref={dropdownRef}>
            <label className="block text-sm font-medium text-slate-700 mb-1">Assigned Client</label>
            <div 
              className={`w-full px-4 py-2.5 bg-white border ${isClientDropdownOpen ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-slate-200'} rounded-lg text-sm transition-all cursor-pointer flex items-center justify-between`}
              onClick={() => setIsClientDropdownOpen(!isClientDropdownOpen)}
            >
              <span className={selectedClientName ? 'text-slate-900 font-medium' : 'text-slate-400'}>
                {selectedClientName || 'Search & Select Client...'}
              </span>
              <Search size={16} className="text-slate-400" />
            </div>

            {isClientDropdownOpen && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="p-2 border-b border-slate-100 bg-slate-50/50">
                  <input
                    type="text"
                    autoFocus
                    placeholder="Type to search clients..."
                    value={clientSearchText}
                    onChange={(e) => setClientSearchText(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div className="max-h-48 overflow-y-auto">
                  {filteredClients.length === 0 ? (
                    <div className="p-3 text-sm text-slate-500 text-center">No clients found matching '{clientSearchText}'</div>
                  ) : (
                    filteredClients.map(c => (
                      <div 
                        key={c.id} 
                        onClick={() => selectClient(c)}
                        className="px-3 py-2 cursor-pointer hover:bg-slate-50 flex items-center justify-between group"
                      >
                        <div>
                          <p className="text-sm font-medium text-slate-900 group-hover:text-blue-600">{c.name}</p>
                          <p className="text-xs text-slate-500 font-mono">{c.client_number || '---'} | {c.cnic}</p>
                        </div>
                        {formData.client === c.id && <Check size={16} className="text-blue-600" />}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Case Number / FIR</label>
              <div className="relative">
                <FolderOpen size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  required
                  value={formData.case_number}
                  onChange={(e) => setFormData({...formData, case_number: e.target.value})}
                  className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400"
                  placeholder="e.g. 543/2026"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Total Agreed Fee</label>
              <div className="relative">
                <CircleDollarSign size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="number"
                  step="0.01"
                  required
                  value={formData.total_fee}
                  onChange={(e) => setFormData({...formData, total_fee: e.target.value})}
                  className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400"
                  placeholder="e.g. 150000.00"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Court Name / Location</label>
            <div className="relative">
              <Scale size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                required
                value={formData.court}
                onChange={(e) => setFormData({...formData, court: e.target.value})}
                className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400"
                placeholder="High Court of Justice"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Presiding Judge</label>
            <div className="relative">
              <Gavel size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                required
                value={formData.judge}
                onChange={(e) => setFormData({...formData, judge: e.target.value})}
                className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400"
                placeholder="Honourable Justice Smith"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Opponent Name</label>
            <div className="relative">
              <UserX size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                required
                value={formData.opponent_name}
                onChange={(e) => setFormData({...formData, opponent_name: e.target.value})}
                className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400"
                placeholder="Defendant / Respondent Name"
              />
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg font-medium text-slate-600 hover:bg-slate-50 border border-slate-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 rounded-lg font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-sm shadow-blue-600/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[100px]"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
