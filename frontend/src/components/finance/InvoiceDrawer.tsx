'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Receipt, CreditCard, Clock, DollarSign, Printer, Download, Trash2 } from 'lucide-react';
import { API_BASE, apiFetch, safeJson, parseApiError } from '@/lib/api';
import { useUI } from '@/context/UIContext';
import StatusBadge from './StatusBadge';
import ReceivePaymentModal from './ReceivePaymentModal';
import InvoiceTemplate from '../InvoiceTemplate';

interface InvoiceDrawerProps {
  invoice: any;
  onClose: () => void;
  onUpdate: () => void;
}

function fmt(n: any) {
  return `PKR ${parseFloat(n ?? 0).toLocaleString()}`;
}

function fmtDate(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function InvoiceDrawer({ invoice, onClose, onUpdate }: InvoiceDrawerProps) {
  const [payments, setPayments] = useState<any[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const { toast, showLoading, hideLoading } = useUI();
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!invoice) return;
    setLoadingPayments(true);
    apiFetch(`${API_BASE}/payments/?invoice=${invoice.id}`)
      .then(r => safeJson(r))
      .then(d => setPayments(Array.isArray(d.results ?? d) ? (d.results ?? d) : []))
      .catch(() => setPayments([]))
      .finally(() => setLoadingPayments(false));
  }, [invoice]);

  if (!invoice) return null;

  const isPaid = invoice.status === 'Paid';

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this invoice? This action cannot be undone.')) return;
    
    showLoading('Deleting invoice...');
    try {
      const res = await apiFetch(`${API_BASE}/invoices/${invoice.id}/`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const errData = await safeJson(res);
        throw new Error(parseApiError(errData) || 'Failed to delete invoice');
      }
      toast.success('Invoice deleted successfully');
      onUpdate();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete invoice');
    } finally {
      hideLoading();
    }
  };

  const handleDeletePayment = async (paymentId: string) => {
    if (!confirm('Are you sure you want to reverse this payment?')) return;
    
    showLoading('Reversing payment...');
    try {
      const res = await apiFetch(`${API_BASE}/payments/${paymentId}/`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const errData = await safeJson(res);
        throw new Error(parseApiError(errData) || 'Failed to reverse payment');
      }
      toast.success('Payment reversed successfully');
      // Refresh the invoice list in the parent, which will update our invoice prop
      onUpdate();
    } catch (err: any) {
      toast.error(err.message || 'Failed to reverse payment');
    } finally {
      hideLoading();
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = async () => {
    showLoading('Generating PDF...');
    try {
      const html2pdf = (await import('html2pdf.js')).default;
      const element = printRef.current;
      if (!element) throw new Error('Template not found');
      
      const opt: any = {
        margin:       0,
        filename:     `${invoice.invoice_number}.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true },
        jsPDF:        { unit: 'in', format: 'a4', orientation: 'portrait' }
      };
      
      const originalDisplay = element.style.display;
      element.style.display = 'block';
      await html2pdf().set(opt).from(element).save();
      element.style.display = originalDisplay;
      
      toast.success('PDF downloaded successfully');
    } catch (err: any) {
      toast.error('Failed to generate PDF');
    } finally {
      hideLoading();
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-[2px]"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full z-50 w-full max-w-[560px] bg-white shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-700 animate-slide-in-right">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-100 rounded-xl">
              <Receipt size={18} className="text-slate-600 dark:text-slate-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">{invoice.invoice_number}</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{invoice.client_name} · {invoice.case_number}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={invoice.status} size="md" />
            <div className="flex items-center ml-2 border-l border-slate-200 dark:border-slate-700 pl-2">
              <button
                onClick={handlePrint}
                className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="Print Invoice"
              >
                <Printer size={18} />
              </button>
              <button
                onClick={handleDownload}
                className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                title="Download PDF"
              >
                <Download size={18} />
              </button>
              <button
                onClick={handleDelete}
                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                title="Delete Invoice"
              >
                <Trash2 size={18} />
              </button>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors ml-1"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Financial Summary */}
          <div className="grid grid-cols-3 border-b border-slate-100 dark:border-slate-800">
            <div className="px-6 py-5 border-r border-slate-100 dark:border-slate-800">
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Invoice Amount</p>
              <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">{fmt(invoice.amount)}</p>
            </div>
            <div className="px-6 py-5 border-r border-slate-100 dark:border-slate-800">
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Amount Paid</p>
              <p className="text-xl font-bold text-emerald-600 mt-1">{fmt(invoice.amount_paid)}</p>
            </div>
            <div className="px-6 py-5">
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Balance Due</p>
              <p className={`text-xl font-bold mt-1 ${parseFloat(invoice.balance_due) > 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                {fmt(invoice.balance_due)}
              </p>
            </div>
          </div>

          {/* Info */}
          <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 space-y-3">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Details</h3>
            <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
              <div>
                <span className="text-slate-500 dark:text-slate-400">Client</span>
                <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">{invoice.client_name}</p>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400">Case</span>
                <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">{invoice.case_number}</p>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400">Issue Date</span>
                <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">{fmtDate(invoice.issue_date)}</p>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400">Due Date</span>
                <p className={`font-semibold mt-0.5 ${invoice.status === 'Overdue' ? 'text-rose-600' : 'text-slate-800 dark:text-slate-200'}`}>
                  {fmtDate(invoice.due_date)}
                  {invoice.status === 'Overdue' && invoice.days_overdue > 0 && (
                    <span className="ml-1.5 text-xs text-rose-500">({invoice.days_overdue}d overdue)</span>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Line Items */}
          {invoice.items?.length > 0 && (
            <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Line Items</h3>
              <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                <div className="divide-y divide-slate-100">
                  {invoice.items.map((item: any, i: number) => (
                    <div key={i} className="flex items-center justify-between px-4 py-3">
                      <span className="text-sm text-slate-700 dark:text-slate-300">{item.description}</span>
                      <span className="text-sm font-semibold text-slate-900 dark:text-white">PKR {parseFloat(item.amount).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700">
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Total</span>
                  <span className="text-sm font-bold text-slate-900 dark:text-white">{fmt(invoice.amount)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Payment History */}
          <div className="px-6 py-5">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Payment History</h3>
            {loadingPayments ? (
              <div className="text-sm text-slate-400 py-4 text-center">Loading…</div>
            ) : payments.length > 0 ? (
              <div className="space-y-2">
                {payments.map((p: any) => (
                  <div key={p.id} className="flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                      <div className="p-1.5 bg-emerald-100 rounded-lg">
                        <DollarSign size={14} className="text-emerald-600" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">PKR {parseFloat(p.amount_received).toLocaleString()}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{p.payment_method}{p.reference_number ? ` · ${p.reference_number}` : ''}</p>
                      </div>
                    </div>
                    <div className="text-right flex items-center gap-3">
                      <p className="text-xs font-medium text-slate-600 dark:text-slate-400">{fmtDate(p.payment_date)}</p>
                      <button
                        onClick={() => handleDeletePayment(p.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Reverse Payment"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 border border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
                <Clock size={24} className="text-slate-300 mx-auto mb-1.5" />
                <p className="text-sm text-slate-400">No payments recorded yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer Action */}
        {!isPaid && (
          <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 shrink-0 bg-white">
            <button
              onClick={() => setShowPaymentModal(true)}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2"
            >
              <DollarSign size={16} />
              Receive Payment
            </button>
          </div>
        )}
      </div>

      {showPaymentModal && (
        <ReceivePaymentModal
          invoice={invoice}
          onClose={() => setShowPaymentModal(false)}
          onSuccess={() => { onUpdate(); setShowPaymentModal(false); }}
        />
      )}

      {/* Hidden printable template */}
      <div 
        ref={printRef}
        id="printable-invoice-template" 
        className="hidden print:block absolute top-0 left-0 w-[794px] bg-white text-black print:z-[9999] print:w-[100vw] print:h-[100vh] origin-top-left"
      >
        <InvoiceTemplate caseData={invoice} />
      </div>

      <style jsx global>{`
        @keyframes slide-in-right {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        .animate-slide-in-right {
          animation: slide-in-right 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-invoice-template, #printable-invoice-template * {
            visibility: visible;
          }
          #printable-invoice-template {
            position: absolute;
            left: 0;
            top: 0;
            margin: 0;
            padding: 0;
            width: 100%;
          }
        }
      `}</style>
    </>
  );
}
