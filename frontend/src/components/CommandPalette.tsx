'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search, FolderOpen, User, X, FileText } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';
import { API_BASE, apiFetch } from '@/lib/api';

export default function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{ cases: any[]; clients: any[]; invoices: any[] }>({ cases: [], clients: [], invoices: [] });
  const [loading, setLoading] = useState(false);
  const debouncedQuery = useDebounce(query, 300);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen((open) => !open);
      }
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
      setResults({ cases: [], clients: [], invoices: [] });
    }
  }, [isOpen]);

  // Search API
  useEffect(() => {
    if (!debouncedQuery) {
      setResults({ cases: [], clients: [], invoices: [] });
      setLoading(false);
      return;
    }

    setLoading(true);
    Promise.all([
      apiFetch(`${API_BASE}/cases/?search=${debouncedQuery}&limit=5`).then((res) => res.json()),
      apiFetch(`${API_BASE}/clients/?search=${debouncedQuery}&limit=5`).then((res) => res.json()),
      apiFetch(`${API_BASE}/invoices/?search=${debouncedQuery}&limit=5`).then((res) => res.json()),
    ])
      .then(([casesData, clientsData, invoicesData]) => {
        setResults({
          cases: casesData.results || casesData || [],
          clients: clientsData.results || clientsData || [],
          invoices: invoicesData.results || invoicesData || [],
        });
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [debouncedQuery]);

  const handleSelectCase = (caseObj: any) => {
    setIsOpen(false);
    router.push(`/cases?search=${caseObj.case_number}`);
  };

  const handleSelectClient = (clientObj: any) => {
    setIsOpen(false);
    const searchVal = clientObj.client_number || clientObj.cnic;
    router.push(`/clients?search=${searchVal}`);
  };

  const handleSelectInvoice = (invoiceObj: any) => {
    setIsOpen(false);
    router.push(`/accounts?search=${invoiceObj.invoice_number}`);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-32 bg-slate-900/60 backdrop-blur-sm p-4">
      <div 
        className="w-full max-w-2xl bg-slate-900 border border-slate-700/50 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center px-4 border-b border-slate-800">
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            className="flex-1 w-full bg-transparent border-0 px-4 py-4 text-slate-100 placeholder-slate-500 focus:ring-0 focus:outline-none"
            placeholder="Search cases, clients, or type a command..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button 
            onClick={() => setIsOpen(false)}
            className="p-1 rounded-md text-slate-400 hover:text-slate-300 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto overscroll-contain">
          {loading && (
            <div className="p-8 text-center text-slate-500 dark:text-slate-400 text-sm">
              <div className="w-5 h-5 border-2 border-slate-600 border-t-slate-400 rounded-full animate-spin mx-auto mb-2"></div>
              Searching...
            </div>
          )}

          {!loading && query && results.cases.length === 0 && results.clients.length === 0 && results.invoices.length === 0 && (
            <div className="p-8 text-center text-slate-500 dark:text-slate-400 text-sm">
              No results found for "{query}".
            </div>
          )}

          {!loading && results.cases.length > 0 && (
            <div className="p-2">
              <div className="px-3 py-2 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Cases
              </div>
              {results.cases.map((c) => (
                <button
                  key={c.id}
                  onClick={() => handleSelectCase(c)}
                  className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left hover:bg-slate-800 transition-colors group"
                >
                  <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 group-hover:text-blue-400 group-hover:bg-slate-900 group-hover:border-blue-500/30 transition-all">
                    <FolderOpen className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-slate-200 group-hover:text-blue-400 transition-colors truncate">
                      {c.case_number}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                      vs {c.opponent_name} • {c.court}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {!loading && results.clients.length > 0 && (
            <div className="p-2 border-t border-slate-800">
              <div className="px-3 py-2 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Clients
              </div>
              {results.clients.map((client) => (
                <button
                  key={client.id}
                  onClick={() => handleSelectClient(client)}
                  className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left hover:bg-slate-800 transition-colors group"
                >
                  <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 group-hover:text-emerald-400 group-hover:bg-slate-900 group-hover:border-emerald-500/30 transition-all">
                    <User className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-slate-200 group-hover:text-emerald-400 transition-colors truncate">
                      {client.name} {client.client_number ? `(${client.client_number})` : ''}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                      CNIC: {client.cnic}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {!loading && results.invoices.length > 0 && (
            <div className="p-2 border-t border-slate-800">
              <div className="px-3 py-2 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Challans
              </div>
              {results.invoices.map((invoice) => (
                <button
                  key={invoice.id}
                  onClick={() => handleSelectInvoice(invoice)}
                  className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left hover:bg-slate-800 transition-colors group"
                >
                  <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 group-hover:text-amber-400 group-hover:bg-slate-900 group-hover:border-amber-500/30 transition-all">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-slate-200 group-hover:text-amber-400 transition-colors truncate">
                      {invoice.invoice_number}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                      Client: {invoice.client_name} • Amount: Rs. {Number(invoice.amount).toLocaleString()}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
