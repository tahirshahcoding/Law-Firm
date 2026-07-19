'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, Trash2 } from 'lucide-react';
import { API_BASE, apiFetch, safeJson } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useUI } from '@/context/UIContext';
import AddExpenseModal from '@/components/finance/AddExpenseModal';

const CATEGORIES = ['All', 'Court Fee', 'Stamp Paper', 'Printing', 'Fuel', 'Courier', 'Staff Salary', 'Office Rent', 'Internet', 'Electricity', 'Other'];

function fmt(n: any) { return `PKR ${parseFloat(n ?? 0).toLocaleString()}`; }
function fmtDate(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [showModal, setShowModal] = useState(false);
  const { user } = useAuth();
  const { confirm, toast, showLoading, hideLoading } = useUI();
  const canManage = user?.role === 'Admin' || user?.permissions?.accounts?.edit;

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const res = await apiFetch(`${API_BASE}/expenses/`);
      const d = await safeJson(res);
      setExpenses(Array.isArray(d.results ?? d) ? (d.results ?? d) : []);
    } catch { /* silent */ } finally { setLoading(false); }
  };

  useEffect(() => { fetchExpenses(); }, []);

  const filtered = expenses.filter(e => {
    const q = search.toLowerCase();
    const matchSearch = !q || 
      (e.description && e.description.toLowerCase().includes(q)) || 
      (e.vendor && e.vendor.toLowerCase().includes(q)) || 
      (e.case_number && e.case_number.toLowerCase().includes(q));
    const matchCat = categoryFilter === 'All' || e.category === categoryFilter;
    return matchSearch && matchCat;
  });

  const today = new Date().toISOString().split('T')[0];
  const todayTotal = expenses.filter(e => e.date === today).reduce((s, e) => s + parseFloat(e.amount ?? 0), 0);
  const thisMonthTotal = expenses.filter(e => {
    const d = new Date(e.date);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).reduce((s, e) => s + parseFloat(e.amount ?? 0), 0);

  const handleDelete = async (id: string) => {
    const ok = await confirm({ title: 'Delete Expense', message: 'This will permanently remove this expense record.', confirmLabel: 'Delete', variant: 'danger' });
    if (!ok) return;
    showLoading('Deleting expense…');
    try {
      await apiFetch(`${API_BASE}/expenses/${id}/`, { method: 'DELETE' });
      toast.success('Expense deleted.');
      fetchExpenses();
    } catch { toast.error('Failed to delete.'); }
    finally { hideLoading(); }
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Expenses</h1>
          <p className="text-sm text-slate-500 mt-0.5">Track firm costs, fees, and operational expenses</p>
        </div>
        {canManage && (
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm"
          >
            <Plus size={16} />
            Add Expense
          </button>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="p-5 bg-white border border-slate-200 rounded-2xl">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Today's Expenses</p>
          <p className="text-3xl font-bold text-rose-600 mt-2">{fmt(todayTotal)}</p>
        </div>
        <div className="p-5 bg-white border border-slate-200 rounded-2xl">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">This Month</p>
          <p className="text-3xl font-bold text-slate-900 mt-2">{fmt(thisMonthTotal)}</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search expenses…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          />
        </div>
        <div className="flex gap-1 border border-slate-200 rounded-xl overflow-hidden bg-white flex-wrap">
          {CATEGORIES.map(c => (
            <button
              key={c}
              onClick={() => setCategoryFilter(c)}
              className={`px-3 py-2 text-xs font-semibold transition-colors ${categoryFilter === c ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              {c}
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
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Date</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Description</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Category</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Case</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Vendor</th>
                <th className="px-5 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide">Amount</th>
                {canManage && <th className="px-5 py-3 w-10" />}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr><td colSpan={7} className="py-12 text-center"><div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-rose-600 border-t-transparent" /></td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="py-12 text-center text-sm text-slate-400">No expenses found.</td></tr>
              ) : filtered.map(exp => (
                <tr key={exp.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-5 py-3.5 text-slate-500 text-xs whitespace-nowrap">{fmtDate(exp.date)}</td>
                  <td className="px-5 py-3.5 font-medium text-slate-800">{exp.description}</td>
                  <td className="px-5 py-3.5">
                    <span className="text-xs font-semibold px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full">{exp.category}</span>
                  </td>
                  <td className="px-5 py-3.5 text-slate-500 text-xs">
                    {exp.case_number ? (
                      <span className="text-blue-600 font-medium">{exp.case_number}</span>
                    ) : <span className="text-slate-300">—</span>}
                  </td>
                  <td className="px-5 py-3.5 text-slate-500">{exp.vendor || '—'}</td>
                  <td className="px-5 py-3.5 text-right font-semibold text-rose-600">{fmt(exp.amount)}</td>
                  {canManage && (
                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={() => handleDelete(exp.id)}
                        className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length > 0 && (
          <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/50 flex justify-between text-xs text-slate-500">
            <span>{filtered.length} expenses</span>
            <span className="font-semibold text-slate-700">
              Total: {fmt(filtered.reduce((s, e) => s + parseFloat(e.amount ?? 0), 0))}
            </span>
          </div>
        )}
      </div>

      {showModal && (
        <AddExpenseModal
          onClose={() => setShowModal(false)}
          onSuccess={() => { fetchExpenses(); setShowModal(false); }}
        />
      )}
    </div>
  );
}
