'use client';

import { useState, useEffect } from 'react';
import { X, CreditCard } from 'lucide-react';
import { API_BASE, apiFetch, safeJson, parseApiError } from '@/lib/api';

interface AddExpenseModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

const CATEGORIES = ['Court Fee', 'Stamp Paper', 'Printing', 'Fuel', 'Courier', 'Staff Salary', 'Office Rent', 'Internet', 'Electricity', 'Other'];
const PAYMENT_METHODS = ['Cash', 'Bank Transfer', 'Cheque', 'Online', 'Other'];

export default function AddExpenseModal({ onClose, onSuccess }: AddExpenseModalProps) {
  const [cases, setCases] = useState<any[]>([]);
  const [caseSearch, setCaseSearch] = useState('');
  const [showCaseDropdown, setShowCaseDropdown] = useState(false);
  const [form, setForm] = useState({
    description: '',
    category: 'Court Fee',
    amount: '',
    case: '' as string | null,
    vendor: '',
    payment_method: 'Cash',
    date: new Date().toISOString().split('T')[0],
    notes: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    apiFetch(`${API_BASE}/cases/?limit=200`)
      .then(r => safeJson(r))
      .then(d => setCases(Array.isArray(d.results ?? d) ? (d.results ?? d) : []))
      .catch(() => {});
  }, []);

  const filteredCases = cases.filter(c =>
    c.case_number?.toLowerCase().includes(caseSearch.toLowerCase()) ||
    c.client_name?.toLowerCase().includes(caseSearch.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.description) { setError('Description is required.'); return; }
    if (!form.amount || parseFloat(form.amount) <= 0) { setError('Enter a valid amount.'); return; }

    setLoading(true);
    try {
      const payload: any = {
        description: form.description,
        category: form.category,
        amount: parseFloat(form.amount),
        vendor: form.vendor,
        payment_method: form.payment_method,
        date: form.date,
        notes: form.notes,
      };
      if (form.case) payload.case = form.case;

      const res = await apiFetch(`${API_BASE}/expenses/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await safeJson(res);
        throw new Error(parseApiError(data));
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-rose-50 rounded-xl">
              <CreditCard size={18} className="text-rose-600" />
            </div>
            <h2 className="text-base font-bold text-slate-900">Add Expense</h2>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors">
            <X size={18} />
          </button>
        </div>

        <form id="add-expense-form" onSubmit={handleSubmit} className="overflow-y-auto flex-1 px-6 py-5 space-y-4">
          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-lg px-4 py-2.5">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Description*</label>
            <input type="text" placeholder="e.g. Court filing fee"
              value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-white" required />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Category*</label>
              <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Amount (PKR)*</label>
              <input type="number" min="0.01" step="0.01" placeholder="0"
                value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))}
                className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-white" required />
            </div>
          </div>

          {/* Related Case */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Related Case <span className="text-slate-400 font-normal">(optional)</span></label>
            <div className="relative">
              <input type="text" placeholder="Search case…"
                value={caseSearch}
                onChange={e => { setCaseSearch(e.target.value); setShowCaseDropdown(true); if (!e.target.value) setForm(p => ({ ...p, case: null })); }}
                onFocus={() => setShowCaseDropdown(true)}
                className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-white" />
              {showCaseDropdown && caseSearch && (
                <div className="absolute z-10 w-full top-full mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg max-h-40 overflow-y-auto text-slate-900 dark:text-white">
                  {filteredCases.slice(0, 8).map(c => (
                    <button key={c.id} type="button"
                      onClick={() => { setForm(p => ({ ...p, case: c.id })); setCaseSearch(`${c.case_number} – ${c.client_name}`); setShowCaseDropdown(false); }}
                      className="w-full text-left px-4 py-2 hover:bg-blue-50 border-b border-slate-50 last:border-0">
                      <p className="text-sm font-semibold text-slate-800">{c.case_number}</p>
                      <p className="text-xs text-slate-500">{c.client_name}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Payment Method</label>
              <select value={form.payment_method} onChange={e => setForm(p => ({ ...p, payment_method: e.target.value }))}
                className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                {PAYMENT_METHODS.map(m => <option key={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Date*</label>
              <input type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))}
                className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-white" required />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Vendor / Payee</label>
            <input type="text" placeholder="e.g. District Court"
              value={form.vendor} onChange={e => setForm(p => ({ ...p, vendor: e.target.value }))}
              className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-white" />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Notes</label>
            <textarea rows={2} placeholder="Optional notes…"
              value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
              className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none bg-white dark:bg-slate-900 text-slate-900 dark:text-white" />
          </div>
        </form>

        <div className="px-6 py-4 border-t border-slate-100 shrink-0 flex gap-3 bg-white">
          <button type="button" onClick={onClose}
            className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors">
            Cancel
          </button>
          <button type="submit" form="add-expense-form" disabled={loading}
            className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-60">
            {loading ? 'Saving…' : 'Save Expense'}
          </button>
        </div>
      </div>
    </div>
  );
}
