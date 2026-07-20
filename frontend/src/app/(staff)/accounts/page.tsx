'use client';

import { useState, useEffect } from 'react';
import { Search, Download, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { API_BASE, apiFetch, safeJson } from '@/lib/api';
import { TableRowSkeleton } from '@/components/SkeletonLoaders';

const TYPE_FILTER = ['All', 'Payment', 'Expense'];

function fmt(n: any) { return `PKR ${parseFloat(n ?? 0).toLocaleString()}`; }
function fmtDate(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function AccountsPage() {
  const [ledger, setLedger] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  useEffect(() => {
    apiFetch(`${API_BASE}/accounts/ledger/`)
      .then(r => safeJson(r))
      .then(d => setLedger(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const raw: any[] = ledger?.transactions ?? [];

  // Filter
  const filtered = raw.filter(txn => {
    const q = search.toLowerCase();
    const matchSearch = !q ||
      txn.description?.toLowerCase().includes(q) ||
      txn.case_number?.toLowerCase().includes(q) ||
      txn.client_name?.toLowerCase().includes(q);
    const matchType = typeFilter === 'All' ||
      (typeFilter === 'Payment' && txn.type === 'Payment') ||
      (typeFilter === 'Expense' && txn.type === 'Expense');
    const txDate = txn.date;
    const matchFrom = !dateFrom || txDate >= dateFrom;
    const matchTo = !dateTo || txDate <= dateTo;
    return matchSearch && matchType && matchFrom && matchTo;
  });

  // Compute running balance chronologically (from oldest to newest)
  const runningBalances: number[] = [];
  let acc = 0;
  for (let i = filtered.length - 1; i >= 0; i--) {
    const txn = filtered[i];
    acc += (parseFloat(txn.credit ?? 0) - parseFloat(txn.debit ?? 0));
    runningBalances[i] = acc;
  }
  const withBalance = filtered.map((txn, idx) => ({
    ...txn,
    running: runningBalances[idx]
  }));

  // Summary stats from full ledger
  const totalIncome = raw.reduce((s, t) => s + parseFloat(t.credit ?? 0), 0);
  const totalExpenses = raw.reduce((s, t) => s + parseFloat(t.debit ?? 0), 0);
  const netProfit = totalIncome - totalExpenses;
  const currentBalance = netProfit;

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Accounts Ledger</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Complete financial record of all transactions</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors bg-white dark:bg-slate-900 shadow-sm dark:shadow-none">
          <Download size={15} />
          Export
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl transition-colors shadow-sm dark:shadow-none">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Current Balance</p>
          <p className={`text-2xl font-bold mt-2 ${currentBalance >= 0 ? 'text-slate-900 dark:text-white' : 'text-rose-600 dark:text-rose-400'}`}>{fmt(currentBalance)}</p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Income minus expenses</p>
        </div>
        <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl transition-colors shadow-sm dark:shadow-none">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Total Income</p>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-2">{fmt(totalIncome)}</p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">All payments received</p>
        </div>
        <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl transition-colors shadow-sm dark:shadow-none">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Total Expenses</p>
          <p className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-2">{fmt(totalExpenses)}</p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">All recorded costs</p>
        </div>
        <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl transition-colors shadow-sm dark:shadow-none">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Net Profit</p>
          <p className={`text-2xl font-bold mt-2 ${netProfit >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-rose-600 dark:text-rose-400'}`}>{fmt(netProfit)}</p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Income minus expenses</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[180px] max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
          <input type="text" placeholder="Search transactions…"
            value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500" />
        </div>
        <div className="flex gap-1 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden bg-white dark:bg-slate-900 p-1">
          {TYPE_FILTER.map(t => (
            <button key={t} onClick={() => setTypeFilter(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${typeFilter === t ? 'bg-slate-900 dark:bg-blue-600 text-white' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
              {t}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
            className="px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <span className="text-slate-400 dark:text-slate-500 text-xs">to</span>
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
            className="px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
      </div>

      {/* Table */}
      {/* Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden transition-colors">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50">
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Date</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Description</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Client</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Case</th>
                <th className="px-5 py-3 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                  <span className="text-rose-500 dark:text-rose-400">Debit</span>
                </th>
                <th className="px-5 py-3 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                  <span className="text-emerald-600 dark:text-emerald-400">Credit</span>
                </th>
                <th className="px-5 py-3 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
              {loading ? (
                <TableRowSkeleton columns={7} />
              ) : withBalance.length === 0 ? (
                <tr><td colSpan={7} className="py-12 text-center text-sm text-slate-400 dark:text-slate-500">
                  No transactions found.
                </td></tr>
              ) : withBalance.map((txn, i) => (
                <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="px-5 py-3.5 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">{fmtDate(txn.date)}</td>
                  <td className="px-5 py-3.5">
                    <div>
                      <p className="font-medium text-slate-800 dark:text-white">{txn.description}</p>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{txn.type}</p>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-slate-600 dark:text-slate-300 text-sm">{txn.client_name || '—'}</td>
                  <td className="px-5 py-3.5 text-xs">
                    {txn.case_number ? <span className="text-blue-600 dark:text-blue-400 font-medium">{txn.case_number}</span> : <span className="text-slate-300 dark:text-slate-600">—</span>}
                  </td>
                  <td className="px-5 py-3.5 text-right font-semibold text-rose-600 dark:text-rose-400">
                    {txn.debit ? fmt(txn.debit) : <span className="text-slate-200 dark:text-slate-700">—</span>}
                  </td>
                  <td className="px-5 py-3.5 text-right font-semibold text-emerald-600 dark:text-emerald-400">
                    {txn.credit ? fmt(txn.credit) : <span className="text-slate-200 dark:text-slate-700">—</span>}
                  </td>
                  <td className={`px-5 py-3.5 text-right font-bold text-xs ${txn.running >= 0 ? 'text-slate-700 dark:text-slate-300' : 'text-rose-600 dark:text-rose-400'}`}>
                    {fmt(txn.running)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {withBalance.length > 0 && (
          <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex justify-between text-xs text-slate-500 dark:text-slate-400 transition-colors">
            <span>{withBalance.length} transactions</span>
            <span className="font-semibold text-slate-700 dark:text-slate-300">Closing Balance: {fmt(withBalance[0]?.running ?? 0)}</span>
          </div>
        )}
      </div>
    </div>
  );
}
