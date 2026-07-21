'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Calendar, AlignLeft, Search, Check, FolderOpen } from 'lucide-react';
import { API_BASE, apiFetch, safeJson } from '@/lib/api';
import { sendWhatsApp, hearingScheduledMessage } from '@/lib/whatsapp';
import { useUI } from '@/context/UIContext';

interface AddHearingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddHearingModal({ isOpen, onClose, onSuccess }: AddHearingModalProps) {
  const { toast, showLoading, hideLoading } = useUI();
  const [formData, setFormData] = useState({
    case: '',
    hearing_date: new Date().toISOString().split('T')[0],
    next_date: '',
    notes: '',
    hearing_stage: 'Attendance'
  });
  
  // Combobox specific state
  const [cases, setCases] = useState<any[]>([]);
  const [isCaseDropdownOpen, setIsCaseDropdownOpen] = useState(false);
  const [isCasesLoading, setIsCasesLoading] = useState(true);
  const [caseSearchText, setCaseSearchText] = useState('');
  const [selectedCaseName, setSelectedCaseName] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setIsCasesLoading(true);
      // Fetch cases for the dropdown
      apiFetch(`${API_BASE}/cases/?page_size=1000`)
        .then(res => res.json())
        .then(data => setCases(Array.isArray(data) ? data : (data.results || [])))
        .catch(err => console.error("Failed to load cases:", err))
        .finally(() => setIsCasesLoading(false));
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
      toast.error("Please select a target case from the dropdown.");
      return;
    }
    
    if (!formData.hearing_date) {
      toast.error("Hearing Date is required.");
      return;
    }

    const payload = { ...formData };
    
    if (!formData.next_date) {
      delete (payload as any).next_date;
    }

    try {
      showLoading('Scheduling hearing...');
      const res = await apiFetch(`${API_BASE}/hearings/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await safeJson(res);

      if (!res.ok) {
        throw new Error(data.error || data.detail || JSON.stringify(data) || 'Failed to register hearing');
      }

      toast.success("Hearing scheduled successfully");

      // Auto-send WhatsApp notification to the client
      const selectedCase = cases.find((c: any) => c.id === formData.case);
      if (selectedCase?.client_mobile) {
        const message = hearingScheduledMessage(
          selectedCase.client_name || 'Client',
          selectedCase.case_number,
          formData.hearing_date,
          formData.next_date || undefined,
          formData.notes || undefined,
        );
        sendWhatsApp(selectedCase.client_mobile, message);
        toast.success('WhatsApp notification opened — press Send to deliver.');
      }

      onSuccess();
      setFormData({ case: '', hearing_date: '', next_date: '', notes: '', hearing_stage: 'Attendance' });
      setSelectedCaseName('');
      onClose();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      hideLoading();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh] transition-colors">
        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800 shrink-0 transition-colors">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white transition-colors">Schedule New Hearing</h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 custom-scrollbar">
          {/* Case Selection Combobox */}
          <div className="relative" ref={dropdownRef}>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 transition-colors">Target Case</label>
            <div 
              className={`w-full px-4 py-2.5 bg-white dark:bg-slate-800 border ${isCaseDropdownOpen ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-slate-200 dark:border-slate-700'} rounded-lg text-sm transition-all cursor-pointer flex items-center justify-between text-slate-900 dark:text-white`}
              onClick={() => setIsCaseDropdownOpen(!isCaseDropdownOpen)}
            >
              <span className={selectedCaseName ? 'text-slate-900 dark:text-white font-medium' : 'text-slate-400 dark:text-slate-500 dark:text-slate-400'}>
                {selectedCaseName || 'Search & Select Active Case...'}
              </span>
              <Search size={16} className="text-slate-400 dark:text-slate-500 dark:text-slate-400" />
            </div>

            {isCaseDropdownOpen && (
              <div className="absolute z-10 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 text-slate-900 dark:text-white">
                <div className="p-2 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 transition-colors">
                  <input
                    type="text"
                    autoFocus
                    placeholder="Type to search cases..."
                    value={caseSearchText}
                    onChange={(e) => setCaseSearchText(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-sm focus:outline-none focus:border-blue-500 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 transition-colors"
                  />
                </div>
                <div className="max-h-48 overflow-y-auto">
                  {isCasesLoading ? (
                    <div className="p-3 text-sm text-slate-500 dark:text-slate-400 text-center animate-pulse">Loading cases...</div>
                  ) : filteredCases.length === 0 ? (
                    <div className="p-3 text-sm text-slate-500 dark:text-slate-400 text-center">No cases found matching '{caseSearchText}'</div>
                  ) : (
                    filteredCases.map(c => (
                      <div 
                        key={c.id} 
                        onClick={() => selectCaseItem(c)}
                        className="px-3 py-2 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 flex items-center justify-between group transition-colors"
                      >
                        <div>
                          <p className="text-sm font-medium text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 flex items-center gap-2 transition-colors">
                            <FolderOpen size={14} className="text-slate-400 dark:text-slate-500 dark:text-slate-400" />
                            {c.case_number}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 transition-colors">vs. {c.opponent_name}</p>
                        </div>
                        {formData.case === c.id && <Check size={16} className="text-blue-600 dark:text-blue-400" />}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 transition-colors">Hearing Date</label>
              <div className="relative">
                <input
                  type="date"
                  required
                  value={formData.hearing_date}
                  onChange={(e) => setFormData({...formData, hearing_date: e.target.value})}
                  className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-mono text-slate-700 dark:text-slate-300"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 transition-colors">Next Date (Optional)</label>
              <div className="relative">
                <input
                  type="date"
                  value={formData.next_date}
                  onChange={(e) => setFormData({...formData, next_date: e.target.value})}
                  className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-mono text-slate-700 dark:text-slate-300"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 transition-colors">Hearing Stage / Class</label>
            <input
              type="text"
              list="stages-list"
              required
              value={formData.hearing_stage}
              onChange={(e) => setFormData({...formData, hearing_stage: e.target.value})}
              className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500 dark:text-slate-400 font-medium text-slate-900 dark:text-white"
              placeholder="e.g. Attendance, Arguments, Evidence..."
            />
            <datalist id="stages-list">
              <option value="Attendance" />
              <option value="Arguments" />
              <option value="Evidence" />
              <option value="Written Statement" />
              <option value="Issues" />
              <option value="Framing of Charge" />
              <option value="Judgment" />
              <option value="Miscellaneous" />
            </datalist>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 transition-colors">Hearing Notes (Optional)</label>
            <div className="relative">
              <AlignLeft size={16} className="absolute left-3 top-3 text-slate-400 dark:text-slate-500 dark:text-slate-400" />
              <textarea
                rows={4}
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500 dark:text-slate-400 resize-none text-slate-900 dark:text-white"
                placeholder="Brief summary of expected proceedings..."
              ></textarea>
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 dark:border-slate-800 mt-6 transition-colors">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 rounded-lg font-medium bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 duration-300 shadow-[0_4px_12px_rgba(37,99,235,0.25)] hover:shadow-[0_6px_16px_rgba(37,99,235,0.35)] hover:-translate-y-0.5 flex items-center justify-center min-w-[100px] text-white"
            >
              Schedule Hearing
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
