'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Calendar, AlignLeft, Search, Check, FolderOpen } from 'lucide-react';
import { API_BASE, apiFetch } from '@/lib/api';

interface AddHearingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddHearingModal({ isOpen, onClose, onSuccess }: AddHearingModalProps) {
  const [formData, setFormData] = useState({
    case: '',
    hearing_date: '',
    next_date: '',
    notes: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Combobox specific state
  const [cases, setCases] = useState<any[]>([]);
  const [isCaseDropdownOpen, setIsCaseDropdownOpen] = useState(false);
  const [caseSearchText, setCaseSearchText] = useState('');
  const [selectedCaseName, setSelectedCaseName] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      // Fetch cases for the dropdown
      apiFetch(`${API_BASE}/cases/`)
        .then(res => res.json())
        .then(data => setCases(data))
        .catch(err => console.error("Failed to load cases:", err));
    }
  }, [isOpen]);

  // Handle clicking outside of combobox to close it
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsCaseDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!isOpen) return null;

  const filteredCases = cases.filter(c => 
    c.case_number.toLowerCase().includes(caseSearchText.toLowerCase()) || 
    c.opponent_name.toLowerCase().includes(caseSearchText.toLowerCase())
  );

  const selectCaseItem = (c: any) => {
    setFormData({ ...formData, case: c.id });
    setSelectedCaseName(`${c.case_number} (vs. ${c.opponent_name})`);
    setIsCaseDropdownOpen(false);
    setCaseSearchText('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.case) {
      setError("Please select a target case from the dropdown.");
      return;
    }
    
    if (!formData.hearing_date) {
      setError("Hearing Date is required.");
      return;
    }

    const payload = { ...formData };
    
    if (!formData.next_date) {
      delete (payload as any).next_date;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await apiFetch(`${API_BASE}/hearings/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || data.detail || JSON.stringify(data) || 'Failed to register hearing');
      }

      onSuccess();
      setFormData({ case: '', hearing_date: '', next_date: '', notes: '' });
      setSelectedCaseName('');
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
          <h2 className="text-xl font-bold text-slate-900">Schedule New Hearing</h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 custom-scrollbar">
          {error && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-sm text-rose-600 font-medium whitespace-pre-wrap">
              {error}
            </div>
          )}

          {/* Case Selection Combobox */}
          <div className="relative" ref={dropdownRef}>
            <label className="block text-sm font-medium text-slate-700 mb-1">Target Case</label>
            <div 
              className={`w-full px-4 py-2.5 bg-white border ${isCaseDropdownOpen ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-slate-200'} rounded-lg text-sm transition-all cursor-pointer flex items-center justify-between`}
              onClick={() => setIsCaseDropdownOpen(!isCaseDropdownOpen)}
            >
              <span className={selectedCaseName ? 'text-slate-900 font-medium' : 'text-slate-400'}>
                {selectedCaseName || 'Search & Select Active Case...'}
              </span>
              <Search size={16} className="text-slate-400" />
            </div>

            {isCaseDropdownOpen && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="p-2 border-b border-slate-100 bg-slate-50/50">
                  <input
                    type="text"
                    autoFocus
                    placeholder="Type to search cases..."
                    value={caseSearchText}
                    onChange={(e) => setCaseSearchText(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div className="max-h-48 overflow-y-auto">
                  {filteredCases.length === 0 ? (
                    <div className="p-3 text-sm text-slate-500 text-center">No cases found matching '{caseSearchText}'</div>
                  ) : (
                    filteredCases.map(c => (
                      <div 
                        key={c.id} 
                        onClick={() => selectCaseItem(c)}
                        className="px-3 py-2 cursor-pointer hover:bg-slate-50 flex items-center justify-between group"
                      >
                        <div>
                          <p className="text-sm font-medium text-slate-900 group-hover:text-blue-600 flex items-center gap-2">
                            <FolderOpen size={14} className="text-slate-400" />
                            {c.case_number}
                          </p>
                          <p className="text-xs text-slate-500 mt-0.5">vs. {c.opponent_name}</p>
                        </div>
                        {formData.case === c.id && <Check size={16} className="text-blue-600" />}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Hearing Date</label>
              <div className="relative">
                <input
                  type="date"
                  required
                  value={formData.hearing_date}
                  onChange={(e) => setFormData({...formData, hearing_date: e.target.value})}
                  className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-mono text-slate-700"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Next Date (Optional)</label>
              <div className="relative">
                <input
                  type="date"
                  value={formData.next_date}
                  onChange={(e) => setFormData({...formData, next_date: e.target.value})}
                  className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-mono text-slate-700"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Hearing Notes (Optional)</label>
            <div className="relative">
              <AlignLeft size={16} className="absolute left-3 top-3 text-slate-400" />
              <textarea
                rows={4}
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400 resize-none"
                placeholder="Brief summary of expected proceedings..."
              ></textarea>
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
                'Schedule Hearing'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
