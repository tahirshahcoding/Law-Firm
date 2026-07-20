'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Calendar, AlignLeft, Search, Check } from 'lucide-react';
import { API_BASE, apiFetch, safeJson } from '@/lib/api';
import { useUI } from '@/context/UIContext';

interface CreateDeadlineModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialDate?: string;
  initialCaseId?: string;
}

const DEADLINE_TYPES = [
  'Court Filing', 'Appeal Deadline', 'Evidence Submission', 'Client Document',
  'Payment Due', 'Internal Task', 'Compliance', 'Contract Renewal',
  'Consultation Follow-up', 'Other'
];

export default function CreateDeadlineModal({ isOpen, onClose, onSuccess, initialDate, initialCaseId }: CreateDeadlineModalProps) {
  const { toast, showLoading, hideLoading } = useUI();
  const [formData, setFormData] = useState({
    title: '',
    case: initialCaseId || '',
    deadline_type: 'Other',
    assigned_to: '',
    priority: 'Medium',
    due_date: initialDate || new Date().toISOString().split('T')[0],
    description: '',
    reminders: ['7', '3', '1']
  });
  
  // Combobox state
  const [cases, setCases] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [caseSearch, setCaseSearch] = useState('');
  const [caseMenuOpen, setCaseMenuOpen] = useState(false);
  const [isCasesLoading, setIsCasesLoading] = useState(true);
  const caseMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    setIsCasesLoading(true);
    const fetchCases = async () => {
      try {
        const res = await apiFetch(`${API_BASE}/cases/`);
        if (res.ok) {
          const data = await res.json();
          setCases(data.results || data);
        }
      } catch (err) {
        console.error("Failed to fetch cases", err);
      } finally {
        setIsCasesLoading(false);
      }
    };
    const fetchUsers = async () => {
      try {
        const res = await apiFetch(`${API_BASE}/users/advocates/`);
        if (res.ok) {
          const data = await res.json();
          setUsers(data);
        }
      } catch (err) {
        console.error("Failed to fetch users", err);
      }
    };
    fetchCases();
    fetchUsers();
    
    // Reset form on open
    setFormData({
      title: '',
      case: initialCaseId || '',
      deadline_type: 'Other',
      assigned_to: '',
      priority: 'Medium',
      due_date: initialDate || new Date().toISOString().split('T')[0],
      description: '',
      reminders: ['7', '3', '1']
    });
    setCaseSearch('');
  }, [isOpen, initialDate, initialCaseId]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (caseMenuRef.current && !caseMenuRef.current.contains(event.target as Node)) {
        setCaseMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const toggleReminder = (days: string) => {
    setFormData(prev => {
      const current = new Set(prev.reminders);
      if (current.has(days)) {
        current.delete(days);
      } else {
        current.add(days);
      }
      return { ...prev, reminders: Array.from(current) };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title) {
      toast.error('Please enter a title');
      return;
    }
    
    const payload = {
      ...formData,
      case: formData.case || null,
      assigned_to: formData.assigned_to || null,
      reminders: formData.reminders.map(Number)
    };

    showLoading('Saving deadline...');
    try {
      const res = await apiFetch(`${API_BASE}/deadlines/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await safeJson(res);
        throw new Error(errData.detail || 'Failed to add deadline');
      }

      toast.success('Deadline created successfully!');
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Something went wrong');
    } finally {
      hideLoading();
    }
  };

  if (!isOpen) return null;

  const filteredCases = cases.filter(c => 
    c.case_number.toLowerCase().includes(caseSearch.toLowerCase()) || 
    c.client_name?.toLowerCase().includes(caseSearch.toLowerCase()) ||
    c.opponent_name?.toLowerCase().includes(caseSearch.toLowerCase())
  );
  
  const selectedCaseObj = cases.find(c => c.id === formData.case);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-xl my-8 transition-colors duration-300">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 transition-colors">
          <h2 className="text-lg font-bold text-slate-800 dark:text-white transition-colors">Create Deadline</h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5 transition-colors">Title <span className="text-rose-500">*</span></label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              placeholder="e.g. File Written Statement"
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all outline-none text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-5">
            {/* Case Combobox */}
            <div className="relative" ref={caseMenuRef}>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5 transition-colors">Related Case</label>
              <div 
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl cursor-pointer flex justify-between items-center transition-colors"
                onClick={() => setCaseMenuOpen(!caseMenuOpen)}
              >
                <span className={`truncate ${selectedCaseObj ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-slate-500'}`}>
                  {selectedCaseObj ? `${selectedCaseObj.case_number} - ${selectedCaseObj.client_name}` : 'Select Case (Optional)'}
                </span>
              </div>
              
              {caseMenuOpen && (
                <div className="absolute z-10 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                  <div className="sticky top-0 bg-white dark:bg-slate-800 p-2 border-b border-slate-100 dark:border-slate-700">
                    <div className="relative">
                      <Search size={14} className="absolute left-3 top-2.5 text-slate-400 dark:text-slate-500" />
                      <input
                        type="text"
                        placeholder="Search cases..."
                        className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:border-blue-500 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
                        value={caseSearch}
                        onChange={e => setCaseSearch(e.target.value)}
                        onClick={e => e.stopPropagation()}
                      />
                    </div>
                  </div>
                  <div className="p-1">
                    <div 
                      className={`px-3 py-2 text-sm rounded-lg cursor-pointer flex items-center justify-between ${formData.case === '' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400' : 'hover:bg-slate-50 dark:hover:bg-slate-700/50'}`}
                      onClick={() => { setFormData({...formData, case: ''}); setCaseMenuOpen(false); }}
                    >
                      <span className="text-slate-500 dark:text-slate-400 italic">No Case</span>
                      {formData.case === '' && <Check size={14} className="dark:text-blue-400" />}
                    </div>
                    {isCasesLoading ? (
                      <div className="px-3 py-4 text-center text-sm text-slate-500 dark:text-slate-400 animate-pulse">Loading cases...</div>
                    ) : filteredCases.length === 0 ? (
                      <div className="px-3 py-4 text-center text-sm text-slate-500 dark:text-slate-400">No cases found</div>
                    ) : (
                      filteredCases.map((c) => (
                        <div 
                          key={c.id}
                          className={`px-3 py-2 text-sm rounded-lg cursor-pointer flex items-center justify-between ${formData.case === c.id ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400' : 'hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-700 dark:text-slate-300'}`}
                          onClick={() => { setFormData({...formData, case: c.id}); setCaseMenuOpen(false); }}
                        >
                          <span className="truncate pr-2">{c.case_number} - {c.client_name}</span>
                          {formData.case === c.id && <Check size={14} className="shrink-0 dark:text-blue-400" />}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5 transition-colors">Deadline Type</label>
              <select
                name="deadline_type"
                value={formData.deadline_type}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none text-slate-900 dark:text-white transition-colors"
              >
                {DEADLINE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5 transition-colors">Due Date</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 text-slate-400 dark:text-slate-500" size={18} />
                <input
                  type="date"
                  name="due_date"
                  value={formData.due_date}
                  onChange={handleChange}
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none text-slate-900 dark:text-white transition-colors"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5 transition-colors">Assigned To</label>
              <select
                name="assigned_to"
                value={formData.assigned_to}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none text-slate-900 dark:text-white transition-colors"
              >
                <option value="">Unassigned</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>{u.first_name} {u.last_name} ({u.username})</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 transition-colors">Priority</label>
            <div className="flex gap-4">
              {['Low', 'Medium', 'High'].map(p => (
                <label key={p} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="priority"
                    value={p}
                    checked={formData.priority === p}
                    onChange={handleChange}
                    className="text-blue-600 focus:ring-blue-600"
                  />
                  <span className="text-sm text-slate-700 dark:text-slate-300 transition-colors">{p}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 transition-colors">Reminders</label>
            <div className="flex gap-4">
              {['7', '3', '1'].map(days => (
                <label key={days} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.reminders.includes(days)}
                    onChange={() => toggleReminder(days)}
                    className="rounded text-blue-600 focus:ring-blue-600"
                  />
                  <span className="text-sm text-slate-700 dark:text-slate-300 transition-colors">{days} Days Before</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5 transition-colors">Description</label>
            <div className="relative">
              <AlignLeft className="absolute left-3 top-3 text-slate-400 dark:text-slate-500" size={18} />
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                placeholder="Details about the deadline..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none text-slate-900 dark:text-white transition-colors placeholder-slate-400 dark:placeholder-slate-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800 transition-colors">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors"
            >
              Save Deadline
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
