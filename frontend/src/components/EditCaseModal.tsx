'use client';

import { useState, useEffect, useRef } from 'react';
import { X, FolderOpen, Scale, Gavel, UserX, Coins, Search, Check, Users } from 'lucide-react';
import { API_BASE, apiFetch, safeJson } from '@/lib/api';
import { useDebounce } from '@/hooks/useDebounce';
import { CASE_CATEGORIES, CASE_PRIORITIES, CASE_STATUSES } from '@/lib/constants';

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
    assigned_to: '',
    case_number: '',
    court: '',
    opponent_name: '',
    total_fee: '',
    status: 'Case Accepted',
    category: 'Civil',
    priority: 'Medium'
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Combobox specific state
  const [clients, setClients] = useState<any[]>([]);
  const [advocates, setAdvocates] = useState<any[]>([]);
  const [courts, setCourts] = useState<any[]>([]);
  const [isClientDropdownOpen, setIsClientDropdownOpen] = useState(false);
  const [clientSearchText, setClientSearchText] = useState('');
  const [selectedClientName, setSelectedClientName] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const [conflictWarning, setConflictWarning] = useState<any>(null);
  const debouncedOpponentName = useDebounce(formData.opponent_name, 500);

  useEffect(() => {
    const controller = new AbortController();
    const checkConflict = async () => {
      const q = debouncedOpponentName;
      if (!q || q.length < 3) {
        setConflictWarning(null);
        return;
      }
      try {
        const res = await apiFetch(`${API_BASE}/cases/conflict-check/?q=${encodeURIComponent(q)}`, {
          signal: controller.signal
        });
        const data = await res.json();
        // Ignore the case being edited itself in the opponents list
        if (data.opponents) {
          data.opponents = data.opponents.filter((o: any) => o.id !== caseData?.id);
        }
        if ((data.clients && data.clients.length > 0) || (data.opponents && data.opponents.length > 0)) {
          setConflictWarning(data);
        } else {
          setConflictWarning(null);
        }
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.error(err);
        }
      }
    };
    checkConflict();
    return () => controller.abort();
  }, [debouncedOpponentName, caseData?.id]);

  useEffect(() => {
    if (isOpen) {
      // Fetch clients for the dropdown
      apiFetch(`${API_BASE}/clients/?page_size=1000`)
        .then(res => res.json())
        .then(data => {
          const list = Array.isArray(data) ? data : (data.results || []);
          setClients(list);
          
          // Pre-populate actual data
          if (caseData) {
            setFormData({
              client: caseData.client || '',
              assigned_to: caseData.assigned_to || '',
              case_number: caseData.case_number || '',
              court: caseData.court || '',
              opponent_name: caseData.opponent_name || '',
              total_fee: caseData.total_fee || '',
              status: caseData.status || 'Case Accepted',
              category: caseData.category || 'Civil',
              priority: caseData.priority || 'Medium'
            });
            
            // Sync client display name
            const matchingClient = list.find((c: any) => c.id === caseData.client);
            if (matchingClient) {
              setSelectedClientName(`${matchingClient.client_number ? matchingClient.client_number + ' - ' : ''}${matchingClient.name}`);
            }
          }
        })
        .catch(err => console.error("Failed to load clients:", err));
        
      apiFetch(`${API_BASE}/users/advocates/`)
        .then(res => res.json())
        .then(data => setAdvocates(Array.isArray(data) ? data : (data.results || [])))
        .catch(err => console.error("Failed to load advocates:", err));
        
      apiFetch(`${API_BASE}/courts/?limit=1000`)
        .then(res => res.json())
        .then(data => setCourts(Array.isArray(data) ? data : (data.results || [])))
        .catch(err => console.error("Failed to load courts:", err));
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

    const payload = { ...formData };
    if (!payload.assigned_to) {
      // @ts-ignore
      payload.assigned_to = null;
    }

    try {
      const res = await apiFetch(`${API_BASE}/cases/${caseData.id}/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await safeJson(res);

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
              className={`w-full px-4 py-2.5 bg-white dark:bg-slate-900 border ${isClientDropdownOpen ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-slate-200 dark:border-slate-700'} rounded-lg text-sm transition-all cursor-pointer flex items-center justify-between text-slate-900 dark:text-white`}
              onClick={() => setIsClientDropdownOpen(!isClientDropdownOpen)}
            >
              <span className={selectedClientName ? 'text-slate-900 font-medium' : 'text-slate-400'}>
                {selectedClientName || 'Search & Select Client...'}
              </span>
              <Search size={16} className="text-slate-400" />
            </div>

            {isClientDropdownOpen && (
              <div className="absolute z-10 w-full mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 text-slate-900 dark:text-white">
                <div className="p-2 border-b border-slate-100 bg-slate-50/50">
                  <input
                    type="text"
                    autoFocus
                    placeholder="Type to search clients..."
                    value={clientSearchText}
                    onChange={(e) => setClientSearchText(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-sm focus:outline-none focus:border-blue-500 text-slate-900 dark:text-white"
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

          {/* Advocate Selection */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Assigned Advocate</label>
            <div className="relative">
              <Users size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <select
                value={formData.assigned_to}
                onChange={(e) => setFormData({...formData, assigned_to: e.target.value})}
                className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none text-slate-900 dark:text-white"
              >
                <option value="">Senior Partner (Default)</option>
                {advocates.map((adv: any) => (
                  <option key={adv.id} value={adv.id}>
                    {adv.first_name} {adv.last_name} {(!adv.first_name && !adv.last_name) ? adv.username : ''} ({adv.role})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
                className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-900 dark:text-white"
              >
                {CASE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Priority</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({...formData, priority: e.target.value})}
                className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-900 dark:text-white"
              >
                {CASE_PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({...formData, status: e.target.value})}
                className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-900 dark:text-white"
              >
                {CASE_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
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
                  className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400"
                  placeholder="e.g. 543/2026"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Total Agreed Fee</label>
              <div className="relative">
                <Coins size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={formData.total_fee}
                  onChange={(e) => setFormData({...formData, total_fee: e.target.value})}
                  className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400"
                  placeholder="e.g. 150000.00"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Court Name / Location</label>
            <div className="relative">
              <Scale size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <select
                required
                value={formData.court}
                onChange={(e) => setFormData({...formData, court: e.target.value})}
                className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none text-slate-900 dark:text-white"
              >
                <option value="">Select Court...</option>
                {courts.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.type}) - {c.judge} {c.district ? `[${c.district}]` : ''}
                  </option>
                ))}
              </select>
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
                className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400"
                placeholder="Defendant / Respondent Name"
              />
            </div>
            
            {conflictWarning && (
              <div className="mt-3 p-4 bg-orange-50 border border-orange-200 rounded-xl">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5"><Scale size={18} className="text-orange-500" /></div>
                  <div>
                    <h4 className="text-sm font-bold text-orange-800">Potential Conflict of Interest Detected</h4>
                    <p className="text-xs text-orange-700 mt-1 mb-2">This opponent name closely matches existing records in the firm's database:</p>
                    
                    {conflictWarning.clients?.length > 0 && (
                      <div className="mb-2">
                        <span className="text-xs font-semibold text-orange-800 uppercase tracking-wider block mb-1">Matching Clients</span>
                        <ul className="space-y-1">
                          {conflictWarning.clients.map((c: any) => (
                            <li key={c.id} className="text-xs text-orange-700 flex items-center gap-1.5 before:content-['•'] before:text-orange-400">
                              <span className="font-semibold">{c.name}</span>
                              <span className="opacity-75">({c.client_number || 'No ID'}, CNIC: {c.cnic})</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {conflictWarning.opponents?.length > 0 && (
                      <div>
                        <span className="text-xs font-semibold text-orange-800 uppercase tracking-wider block mb-1">Matching Opponents</span>
                        <ul className="space-y-1">
                          {conflictWarning.opponents.map((o: any) => (
                            <li key={o.id} className="text-xs text-orange-700 flex items-center gap-1.5 before:content-['•'] before:text-orange-400">
                              <span className="font-semibold">{o.opponent_name}</span>
                              <span className="opacity-75">(in case {o.case_number})</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
            
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
              className="px-6 py-2 rounded-lg font-medium bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 duration-300 shadow-[0_4px_12px_rgba(37,99,235,0.25)] hover:shadow-[0_6px_16px_rgba(37,99,235,0.35)] hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[100px] text-white"
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
