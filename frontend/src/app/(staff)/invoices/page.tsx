'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, Download, Filter } from 'lucide-react';
import { API_BASE, apiFetch, safeJson } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import StatusBadge from '@/components/finance/StatusBadge';
import InvoiceDrawer from '@/components/finance/InvoiceDrawer';
import { TableRowSkeleton } from '@/components/SkeletonLoaders';
import NewInvoiceModal from '@/components/finance/NewInvoiceModal';

const STATUSES = ['All', 'Unpaid', 'Partial', 'Paid', 'Overdue'];

function fmt(n: any) { return `PKR ${parseFloat(n ?? 0).toLocaleString()}`; }
function fmtDate(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [showNewModal, setShowNewModal] = useState(false);
  const { user } = useAuth();

  const canManage = user?.role === 'Admin' || user?.permissions?.accounts?.edit;

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const res = await apiFetch(`${API_BASE}/invoices/`);
      const d = await safeJson(res);
      setInvoices(Array.isArray(d.results ?? d) ? (d.results ?? d) : []);
    } catch { /* silent */ } finally { setLoading(false); }
  };

  useEffect(() => { fetchInvoices(); }, []);

  const filtered = invoices.filter(inv => {
    const q = search.toLowerCase();
    const matchSearch = !q ||
      (inv.invoice_number && inv.invoice_number.toLowerCase().includes(q)) ||
      (inv.client_name && inv.client_name.toLowerCase().includes(q)) ||
      (inv.case_number && inv.case_number.toLowerCase().includes(q));
    const matchStatus = statusFilter === 'All' || inv.status === statusFilter;
    return matchSearch && matchStatus;
  });

  // Summary counts
  const counts = {
    total: invoices.length,
    paid: invoices.filter(i => i.status === 'Paid').length,
    partial: invoices.filter(i => i.status === 'Partial').length,
    unpaid: invoices.filter(i => i.status === 'Unpaid').length,
    overdue: invoices.filter(i => i.status === 'Overdue').length,
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-500">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Invoices</h1>
          <p className="text-sm text-slate-500 mt-0.5">Manage billing and payments for all cases</p>
        </div>
        {canManage && (
          <button
            onClick={() => setShowNewModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm"
          >
            <Plus size={16} />
            New Invoice
          </button>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: 'Total', count: counts.total, onClick: () => setStatusFilter('All'), active: statusFilter === 'All', color: 'text-slate-900' },
          { label: 'Paid', count: counts.paid, onClick: () => setStatusFilter('Paid'), active: statusFilter === 'Paid', color: 'text-emerald-600' },
          { label: 'Partial', count: counts.partial, onClick: () => setStatusFilter('Partial'), active: statusFilter === 'Partial', color: 'text-amber-600' },
          { label: 'Unpaid', count: counts.unpaid, onClick: () => setStatusFilter('Unpaid'), active: statusFilter === 'Unpaid', color: 'text-slate-600' },
          { label: 'Overdue', count: counts.overdue, onClick: () => setStatusFilter('Overdue'), active: statusFilter === 'Overdue', color: 'text-rose-600' },
        ].map(card => (
          <button
            key={card.label}
            onClick={card.onClick}
            className={`text-left p-4 rounded-xl border transition-all ${card.active ? 'border-blue-300 bg-blue-50 shadow-sm' : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'}`}
          >
            <p className="text-xs font-medium text-slate-500">{card.label}</p>
            <p className={`text-2xl font-bold mt-1 ${card.color}`}>{card.count}</p>
          </button>
        ))}
      </div>

      {/* Search + Filter toolbar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search invoice, client, case…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          />
        </div>
        <div className="flex gap-1 border border-slate-200 rounded-xl overflow-hidden bg-white">
          {STATUSES.map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-2 text-xs font-semibold transition-colors ${statusFilter === s ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70">
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Invoice #</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Client</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Case</th>
                <th className="px-5 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide">Amount</th>
                <th className="px-5 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide">Paid</th>
                <th className="px-5 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide">Balance</th>
                <th className="px-5 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <TableRowSkeleton columns={8} />
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-sm text-slate-400">
                    No invoices found.
                  </td>
                </tr>
              ) : filtered.map(inv => (
                <tr
                  key={inv.id}
                  onClick={() => setSelectedInvoice(inv)}
                  className="hover:bg-blue-50/40 cursor-pointer transition-colors group"
                >
                  <td className="px-5 py-3.5 font-mono font-semibold text-slate-700 text-xs">{inv.invoice_number}</td>
                  <td className="px-5 py-3.5 font-medium text-slate-800">{inv.client_name}</td>
                  <td className="px-5 py-3.5 text-slate-500">{inv.case_number}</td>
                  <td className="px-5 py-3.5 text-right font-semibold text-slate-800">{fmt(inv.amount)}</td>
                  <td className="px-5 py-3.5 text-right text-emerald-600 font-medium">{fmt(inv.amount_paid)}</td>
                  <td className="px-5 py-3.5 text-right font-semibold text-rose-600">{parseFloat(inv.balance_due ?? 0) > 0 ? fmt(inv.balance_due) : <span className="text-slate-400">—</span>}</td>
                  <td className="px-5 py-3.5 text-center"><StatusBadge status={inv.status} /></td>
                  <td className="px-5 py-3.5 text-slate-500 text-xs">{fmtDate(inv.issue_date)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length > 0 && (
          <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/50 text-xs text-slate-500">
            Showing {filtered.length} of {invoices.length} invoices
          </div>
        )}
      </div>

      {selectedInvoice && (
        <InvoiceDrawer
          invoice={selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
          onUpdate={() => { fetchInvoices(); setSelectedInvoice(null); }}
        />
      )}

      {showNewModal && (
        <NewInvoiceModal
          onClose={() => setShowNewModal(false)}
          onSuccess={() => { fetchInvoices(); setShowNewModal(false); }}
        />
      )}
    </div>
  );
}
