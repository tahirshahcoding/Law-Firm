'use client';

import { useState } from 'react';
import { X, Banknote, Calendar, CreditCard } from 'lucide-react';
import { API_BASE, apiFetch, safeJson } from '@/lib/api';

interface AddPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  challan: any | null;
}

export default function AddPaymentModal({ isOpen, onClose, onSuccess, challan }: AddPaymentModalProps) {
  const [amountReceived, setAmountReceived] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !challan) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await apiFetch(`${API_BASE}/payments/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          case: challan.case,
          amount_received: parseFloat(amountReceived),
        }),
      });

      const data = await safeJson(res);
      if (!res.ok) throw new Error(data.error || data.detail || 'Failed to record payment');

      // The backend recalculates invoice status atomically inside Payment.save().
      // No frontend patch needed — just refresh the list.
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const remainingAmount = parseFloat(challan.amount) - parseFloat(challan.amount_paid || 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-slate-100 shrink-0 bg-slate-50/50">
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <CreditCard size={20} className="text-emerald-600" />
            Record Payment
          </h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-sm text-rose-600 font-medium">{error}</div>}

          {/* Context Info */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Challan No:</span>
              <span className="font-semibold text-slate-900">{challan.invoice_number}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Client:</span>
              <span className="font-semibold text-slate-900">{challan.client_name}</span>
            </div>
            <div className="flex justify-between text-sm pt-2 border-t border-slate-200">
              <span className="text-slate-500">Total Amount:</span>
              <span className="font-mono text-slate-900">Rs. {Number(challan.amount).toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Amount Paid:</span>
              <span className="font-mono text-emerald-600">Rs. {Number(challan.amount_paid || 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm font-bold">
              <span className="text-slate-700">Remaining Balance:</span>
              <span className="font-mono text-rose-600">Rs. {remainingAmount.toLocaleString()}</span>
            </div>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Amount Received (Rs.) *</label>
            <div className="relative">
              <Banknote size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="number" 
                step="0.01"
                required 
                value={amountReceived} 
                onChange={(e) => setAmountReceived(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-mono text-lg" 
                placeholder={remainingAmount.toString()} 
              />
            </div>
            <div className="flex justify-end mt-1">
              <button 
                type="button" 
                onClick={() => setAmountReceived(remainingAmount.toString())}
                className="text-xs text-emerald-600 font-medium hover:text-emerald-700"
              >
                Set to remaining balance
              </button>
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg font-medium text-slate-600 hover:bg-slate-50 border border-slate-200 transition-colors">Cancel</button>
            <button type="submit" disabled={submitting || !amountReceived}
              className="px-6 py-2 rounded-lg font-medium text-white bg-emerald-600 hover:bg-emerald-700 transition-colors shadow-sm shadow-emerald-600/20 disabled:opacity-50 flex items-center justify-center min-w-[140px]">
              {submitting ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Record Payment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
