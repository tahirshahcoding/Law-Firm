'use client';

import { useState } from 'react';
import { X, DollarSign } from 'lucide-react';
import { API_BASE, apiFetch, safeJson, parseApiError } from '@/lib/api';
import { sendWhatsApp, challanMessage } from '@/lib/whatsapp';

interface ReceivePaymentModalProps {
  invoice: any;
  onClose: () => void;
  onSuccess: () => void;
}

const PAYMENT_METHODS = ['Cash', 'Bank Transfer', 'Cheque', 'Online', 'Other'];

export default function ReceivePaymentModal({ invoice, onClose, onSuccess }: ReceivePaymentModalProps) {
  const remaining = parseFloat(invoice?.balance_due ?? invoice?.balance ?? invoice?.amount ?? 0);
  const alreadyPaid = parseFloat(invoice?.amount_paid ?? invoice?.paid_amount ?? 0);
  const total = parseFloat(invoice?.amount ?? invoice?.total_amount ?? 0);

  const [form, setForm] = useState({
    amount_received: remaining ? remaining.toString() : '',
    payment_method: 'Cash',
    reference_number: '',
    notes: '',
    payment_date: new Date().toISOString().split('T')[0],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const amount = parseFloat(form.amount_received);
    if (!amount || amount <= 0) { setError('Enter a valid amount.'); return; }
    if (amount > remaining + 0.01) { setError(`Amount cannot exceed remaining balance of PKR ${remaining.toLocaleString()}.`); return; }

    setLoading(true);
    try {
      const res = await apiFetch(`${API_BASE}/payments/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, invoice: invoice.id, amount_received: amount }),
      });
      if (!res.ok) {
        const data = await safeJson(res);
        throw new Error(parseApiError(data));
      }
      onSuccess();
      onClose();
      
      // Auto-open WhatsApp with payment receipt
      if (invoice?.client_mobile) {
        const newPaid = alreadyPaid + amount;
        const newBalance = Math.max(0, remaining - amount);
        const msg = challanMessage(
          invoice.client_name,
          invoice.invoice_number,
          invoice.case_number,
          total,
          newPaid,
          newBalance,
          new Date(invoice.due_date).toLocaleDateString(),
          [{ payment_date: form.payment_date, amount_received: amount }], // Pass the newly created payment
          'Payment Receipt'
        );
        sendWhatsApp(invoice.client_mobile, msg);
      }
      
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border dark:border-slate-800">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-50 dark:bg-emerald-900/30 rounded-xl">
              <DollarSign size={18} className="text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Receive Payment</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">{invoice?.invoice_number}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Invoice Summary */}
        <div className="px-6 py-4 bg-slate-50/60 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Total</p>
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-0.5">PKR {total.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Already Paid</p>
              <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">PKR {alreadyPaid.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Remaining</p>
              <p className="text-sm font-bold text-rose-600 dark:text-rose-400 mt-0.5">PKR {remaining.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-lg px-4 py-2.5">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Amount Received (PKR)*</label>
            <input
              type="number"
              min="1"
              max={remaining}
              step="0.01"
              placeholder="0"
              value={form.amount_received}
              onChange={e => setForm(p => ({ ...p, amount_received: e.target.value }))}
              className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Payment Method*</label>
              <select
                value={form.payment_method}
                onChange={e => setForm(p => ({ ...p, payment_method: e.target.value }))}
                className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              >
                {PAYMENT_METHODS.map(m => <option key={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Date*</label>
              <input
                type="date"
                value={form.payment_date}
                onChange={e => setForm(p => ({ ...p, payment_date: e.target.value }))}
                className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Reference No</label>
            <input
              type="text"
              placeholder="Cheque no., transaction ID, etc."
              value={form.reference_number}
              onChange={e => setForm(p => ({ ...p, reference_number: e.target.value }))}
              className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Notes</label>
            <textarea
              placeholder="Optional notes…"
              rows={2}
              value={form.notes}
              onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
              className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-60"
            >
              {loading ? 'Saving…' : 'Receive Payment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
