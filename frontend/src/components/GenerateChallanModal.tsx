'use client';

import { useState, useEffect } from 'react';
import { X, Search, FileText, Calendar, Banknote, AlignLeft } from 'lucide-react';
import { API_BASE, apiFetch, safeJson } from '@/lib/api';
import { sendWhatsApp, challanMessage } from '@/lib/whatsapp';
import { useUI } from '@/context/UIContext';

interface GenerateChallanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function GenerateChallanModal({ isOpen, onClose, onSuccess }: GenerateChallanModalProps) {
  const { toast, showLoading, hideLoading } = useUI();
  const [cases, setCases] = useState<any[]>([]);
  const [loadingCases, setLoadingCases] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  const [selectedCase, setSelectedCase] = useState<any | null>(null);
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  });
  const [description, setDescription] = useState('Professional Legal Services');
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0]);

  // Fetch cases for combobox
  useEffect(() => {
    if (isOpen) {
      const fetchCases = async () => {
        setLoadingCases(true);
        try {
          const res = await apiFetch(`${API_BASE}/cases/`);
          const data = await safeJson(res);
          setCases(data.results || data);
        } catch (err) {
          console.error("Failed to fetch cases", err);
        } finally {
          setLoadingCases(false);
        }
      };
      fetchCases();
      
      // Reset form
      setSelectedCase(null);
      setSearchTerm('');
      setAmount('');
      setDueDate('');
      setDescription('Professional Legal Services');
    }
  }, [isOpen]);

  const filteredCases = cases.filter(c => 
    c.case_number?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.opponent_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectCase = (c: any) => {
    setSelectedCase(c);
    setSearchTerm(`${c.case_number} - ${c.client_name}`);
    setAmount(c.total_fee || '');
    setShowDropdown(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCase) {
      toast.error("Please select a case.");
      return;
    }

    try {
      showLoading('Generating challan...');
      const res = await apiFetch(`${API_BASE}/invoices/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          case: selectedCase.id,
          amount: parseFloat(amount),
          description: description,
          issue_date: issueDate,
          due_date: dueDate,
        }),
      });

      const data = await safeJson(res);
      if (!res.ok) throw new Error(data.error || data.detail || 'Failed to generate challan');
      
      toast.success('Challan generated successfully.');
      onSuccess();
      onClose();

      // Auto-open WhatsApp with the challan
      if (selectedCase.client_mobile) {
        const msg = challanMessage(
          selectedCase.client_name,
          data.invoice_number || 'INV-NEW',
          selectedCase.case_number,
          parseFloat(amount),
          0, // amountPaid
          parseFloat(amount), // balanceDue
          new Date(dueDate).toLocaleDateString(),
          [], // No payments yet
          description
        );
        sendWhatsApp(selectedCase.client_mobile, msg);
      }

    } catch (err: any) {
      toast.error(err.message);
    } finally {
      hideLoading();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh] border dark:border-slate-800">
        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FileText size={20} className="text-blue-600" />
            Generate Challan
          </h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors"><X size={20} /></button>
        </div>

        <div className="overflow-y-auto">
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {/* Case Selector */}
            <div className="relative">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Select Case *</label>
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search case number or client..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setShowDropdown(true);
                    if (selectedCase) setSelectedCase(null); // Clear selection if user types
                  }}
                  onFocus={() => setShowDropdown(true)}
                  className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-900 dark:text-white"
                  required
                />
              </div>

              {showDropdown && (
                <div className="absolute z-10 w-full mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg max-h-60 overflow-auto text-slate-900 dark:text-white">
                  {loadingCases ? (
                    <div className="p-3 text-sm text-slate-500 dark:text-slate-400 text-center">Loading cases...</div>
                  ) : filteredCases.length > 0 ? (
                    filteredCases.map(c => (
                      <div
                        key={c.id}
                        onClick={() => handleSelectCase(c)}
                        className="px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer border-b border-slate-50 last:border-0"
                      >
                        <div className="font-semibold text-slate-900 dark:text-white text-sm">{c.case_number}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">{c.client_name} vs {c.opponent_name}</div>
                      </div>
                    ))
                  ) : (
                    <div className="p-3 text-sm text-slate-500 dark:text-slate-400 text-center">No cases found</div>
                  )}
                </div>
              )}
            </div>

            {/* Amount */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Challan Amount (Rs.) *</label>
              <div className="relative">
                <Banknote size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="number" 
                  step="0.01"
                  required 
                  value={amount} 
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-mono text-slate-900 dark:text-white" 
                  placeholder="50000" 
                />
              </div>
              {selectedCase && (
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Total case fee: Rs. {Number(selectedCase.total_fee).toLocaleString()}
                </p>
              )}
            </div>

            {/* Due Date */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Due Date *</label>
              <div className="relative">
                <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="date" 
                  required 
                  min={issueDate}
                  value={dueDate} 
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-900 dark:text-white" 
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Description</label>
              <div className="relative">
                <AlignLeft size={16} className="absolute left-3 top-3 text-slate-400" />
                <textarea 
                  rows={3} 
                  value={description} 
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none text-slate-900 dark:text-white" 
                  placeholder="Professional Legal Services..." 
                />
              </div>
            </div>

            <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
              <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors">Cancel</button>
              <button type="submit" disabled={!selectedCase}
                className="px-6 py-2 rounded-lg font-medium bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 duration-300 shadow-[0_4px_12px_rgba(37,99,235,0.25)] hover:shadow-[0_6px_16px_rgba(37,99,235,0.35)] hover:-translate-y-0.5 disabled:opacity-50 flex items-center justify-center min-w-[140px] text-white">
                Generate Challan
              </button>
            </div>
          </form>
        </div>
      </div>
      
      {/* Backdrop for closing dropdown */}
      {showDropdown && (
        <div className="fixed inset-0 z-0" onClick={() => setShowDropdown(false)}></div>
      )}
    </div>
  );
}
