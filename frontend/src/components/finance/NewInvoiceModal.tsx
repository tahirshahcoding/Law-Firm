'use client';

import { useState, useEffect } from 'react';
import { X, Plus, Trash2, FileText } from 'lucide-react';
import { API_BASE, apiFetch, safeJson, parseApiError } from '@/lib/api';
import { sendWhatsApp, challanMessage } from '@/lib/whatsapp';

interface NewInvoiceModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

interface LineItem {
  description: string;
  amount: string;
}

export default function NewInvoiceModal({ onClose, onSuccess }: NewInvoiceModalProps) {
  const [cases, setCases] = useState<any[]>([]);
  const [loadingCases, setLoadingCases] = useState(true);
  const [caseSearch, setCaseSearch] = useState('');
  const [selectedCase, setSelectedCase] = useState<any>(null);
  const [showCaseDropdown, setShowCaseDropdown] = useState(false);
  const [form, setForm] = useState({
    case: '',
    issue_date: new Date().toISOString().split('T')[0],
    due_date: '',
  });
  const [items, setItems] = useState<LineItem[]>([{ description: '', amount: '' }]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    apiFetch(`${API_BASE}/cases/?limit=200`)
      .then(r => safeJson(r))
      .then(d => setCases(Array.isArray(d.results ?? d) ? (d.results ?? d) : []))
      .catch(() => {})
      .finally(() => setLoadingCases(false));
  }, []);

  const filteredCases = cases.filter(c =>
    c.case_number?.toLowerCase().includes(caseSearch.toLowerCase()) ||
    c.client_name?.toLowerCase().includes(caseSearch.toLowerCase())
  );

  const total = items.reduce((sum, i) => sum + (parseFloat(i.amount) || 0), 0);

  const addItem = () => setItems(p => [...p, { description: '', amount: '' }]);
  const removeItem = (idx: number) => setItems(p => p.filter((_, i) => i !== idx));
  const updateItem = (idx: number, field: keyof LineItem, val: string) =>
    setItems(p => p.map((item, i) => i === idx ? { ...item, [field]: val } : item));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.case) { setError('Please select a case.'); return; }
    if (items.some(i => !i.description || !i.amount)) { setError('All line items must have a description and amount.'); return; }
    if (total <= 0) { setError('Total amount must be greater than zero.'); return; }

    setLoading(true);
    try {
      const res = await apiFetch(`${API_BASE}/invoices/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          due_date: form.due_date || null,
          items: items.map(i => ({ description: i.description, amount: parseFloat(i.amount) })),
        }),
      });
      const data = await safeJson(res);
      if (!res.ok) {
        throw new Error(parseApiError(data));
      }
      onSuccess();
      onClose();

      // Auto-open WhatsApp with the invoice
      if (selectedCase?.client_mobile) {
        const msg = challanMessage(
          selectedCase.client_name,
          data.invoice_number || 'INV-NEW',
          selectedCase.case_number,
          total,
          0, // amountPaid
          total, // balanceDue
          form.due_date ? new Date(form.due_date).toLocaleDateString() : 'Upon Receipt',
          [], // No payments yet
          'Legal Services Invoice'
        );
        sendWhatsApp(selectedCase.client_mobile, msg);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-xl">
              <FileText size={18} className="text-blue-600 dark:text-blue-400" />
            </div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Generate Invoice</h2>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1">
          <form id="new-invoice-form" onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
            {error && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-lg px-4 py-2.5">
                {error}
              </div>
            )}

            {/* Case Selector */}
            <div className="relative">
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Case*</label>
              {selectedCase ? (
                <div className="flex items-center justify-between px-3 py-2.5 border border-blue-300 dark:border-blue-800 rounded-xl bg-blue-50 dark:bg-blue-900/20">
                  <div>
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{selectedCase.case_number}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{selectedCase.client_name}</p>
                  </div>
                  <button type="button" onClick={() => { setSelectedCase(null); setForm(p => ({ ...p, case: '' })); setCaseSearch(''); setItems([{ description: '', amount: '' }]); }} className="text-slate-400 hover:text-slate-700">
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search by case number or client…"
                    value={caseSearch}
                    onChange={e => { setCaseSearch(e.target.value); setShowCaseDropdown(true); }}
                    onFocus={() => setShowCaseDropdown(true)}
                    className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
                  />
                  {showCaseDropdown && (
                    <div className="absolute z-10 w-full top-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg max-h-48 overflow-y-auto text-slate-900 dark:text-white">
                      {loadingCases ? (
                        <div className="p-3 text-sm text-slate-500 dark:text-slate-400 text-center">Loading…</div>
                      ) : filteredCases.length > 0 ? (
                        filteredCases.slice(0, 10).map(c => (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => {
                              setSelectedCase(c);
                              setForm(p => ({ ...p, case: c.id }));
                              setShowCaseDropdown(false);
                              if (c.total_fee) {
                                setItems([{ description: 'Advocate Fee', amount: parseFloat(c.total_fee).toString() }]);
                              }
                            }}
                            className="w-full text-left px-4 py-2.5 hover:bg-blue-50 border-b border-slate-50 last:border-0"
                          >
                            <p className="text-sm font-semibold text-slate-800">{c.case_number}</p>
                            <p className="text-xs text-slate-500">{c.client_name} · {c.status}</p>
                          </button>
                        ))
                      ) : (
                        <div className="p-3 text-sm text-slate-500 text-center">No cases found</div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Issue Date*</label>
                <input type="date" value={form.issue_date} onChange={e => setForm(p => ({ ...p, issue_date: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-white" required />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Due Date*</label>
                <input type="date" value={form.due_date} onChange={e => setForm(p => ({ ...p, due_date: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-white" required />
              </div>
            </div>

            {/* Line Items */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-slate-600">Line Items*</label>
              </div>
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="grid grid-cols-[1fr_140px_40px] bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-500 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
                  <span>Description</span>
                  <span className="text-right">Amount (PKR)</span>
                  <span />
                </div>
                <div className="divide-y divide-slate-100">
                  {items.map((item, idx) => (
                    <div key={idx} className="grid grid-cols-[1fr_140px_40px] items-center px-3 py-2 gap-2">
                      <input
                        type="text"
                        placeholder="e.g. Advocate Fee"
                        value={item.description}
                        onChange={e => updateItem(idx, 'description', e.target.value)}
                        className="text-sm border-0 outline-none bg-transparent placeholder-slate-400 w-full"
                        required
                      />
                      <input
                        type="number"
                        min="0.01"
                        step="0.01"
                        placeholder="0"
                        value={item.amount}
                        onChange={e => updateItem(idx, 'amount', e.target.value)}
                        className="text-sm border-0 outline-none bg-transparent placeholder-slate-400 text-right w-full"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => removeItem(idx)}
                        disabled={items.length === 1}
                        className="text-slate-300 hover:text-rose-500 disabled:opacity-30 transition-colors flex justify-center"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="px-3 py-2 border-t border-slate-100 bg-slate-50/60 flex items-center justify-between">
                  <button type="button" onClick={addItem} className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700">
                    <Plus size={14} /> Add Item
                  </button>
                  <div className="text-sm font-bold text-slate-800">
                    Total: PKR {total.toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 shrink-0 flex gap-3 bg-white">
          <button type="button" onClick={onClose}
            className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors">
            Cancel
          </button>
          <button type="submit" form="new-invoice-form" disabled={loading}
            className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-60">
            {loading ? 'Creating…' : 'Generate Invoice'}
          </button>
        </div>
      </div>
    </div>
  );
}
