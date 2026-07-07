'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Coins, TrendingUp, Download, Search, FileText, Plus, Trash2, Wallet, ShieldAlert, Share2, Printer, MessageCircle } from 'lucide-react';
import { API_BASE, apiFetch, safeJson } from '@/lib/api';
import { sendWhatsApp, challanMessage } from '@/lib/whatsapp';
import InvoiceTemplate from '@/components/InvoiceTemplate';
import GenerateChallanModal from '@/components/GenerateChallanModal';
import AddPaymentModal from '@/components/AddPaymentModal';
import { useAuth } from '@/context/AuthContext';
import { useUI } from '@/context/UIContext';

function AccountsContent() {
  const searchParams = useSearchParams();
  const initialSearch = searchParams.get('search') || '';
  
  const [ledger, setLedger] = useState({
    total_billed: 0,
    total_received: 0,
    outstanding_balance: 0,
    revenue_chart: [] as { month: string, revenue: number }[]
  });
  const [challans, setChallans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [statusFilter, setStatusFilter] = useState('All');
  const [groupBy, setGroupBy] = useState<'flat' | 'client'>('flat');
  const [activeTab, setActiveTab] = useState<'challans' | 'payments'>('challans');
  const [payments, setPayments] = useState<any[]>([]);
  const [paymentsLoading, setPaymentsLoading] = useState(false);
  const [paymentSearchTerm, setPaymentSearchTerm] = useState('');
  
  // Modals state
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedChallanForPayment, setSelectedChallanForPayment] = useState<any | null>(null);

  // PDF State
  const [selectedCaseForInvoice, setSelectedCaseForInvoice] = useState<any>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const { user } = useAuth();
  const canViewAccounts = user?.role === 'Admin' || user?.permissions?.accounts?.view === true;
  const canManageAccounts = user?.role === 'Admin' || user?.permissions?.accounts?.edit === true;
  const canDeleteAccounts = user?.role === 'Admin' || user?.permissions?.accounts?.delete === true;
  const { confirm, toast, showLoading, hideLoading } = useUI();

  const fetchAccounts = async () => {
    try {
      const [ledgerRes, challansRes] = await Promise.all([
        apiFetch(`${API_BASE}/accounts/ledger/`),
        apiFetch(`${API_BASE}/invoices/`)
      ]);
      
      const ledgerData = await safeJson(ledgerRes);
      const challansData = await safeJson(challansRes);
      
      setLedger(ledgerData.results || ledgerData);
      setChallans(challansData.results || challansData);
    } catch (err) {
      console.error('Failed to fetch accounts data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPayments = async () => {
    setPaymentsLoading(true);
    try {
      const res = await apiFetch(`${API_BASE}/payments/`);
      const data = await safeJson(res);
      setPayments(data.results || data);
    } catch (err) {
      console.error('Failed to fetch payments:', err);
    } finally {
      setPaymentsLoading(false);
    }
  };

  const handleSuccess = () => {
    fetchAccounts();
    fetchPayments();
  };

  const handleDeletePayment = async (id: string) => {
    const ok = await confirm({
      title: 'Reverse Payment',
      message: 'This will permanently delete the payment record and update the associated challan status accordingly.',
      confirmLabel: 'Reverse Payment',
      variant: 'warning',
    });
    if (!ok) return;
    try {
      showLoading('Reversing payment...');
      const res = await apiFetch(`${API_BASE}/payments/${id}/`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || `Failed to delete payment (${res.status})`);
        return;
      }
      toast.success('Payment reversed successfully.');
      handleSuccess();
    } catch (err) {
      toast.error('Failed to reverse payment: network error');
    } finally {
      hideLoading();
    }
  };

  useEffect(() => {
    if (canViewAccounts) {
      fetchAccounts();
      fetchPayments();
    }
  }, [canViewAccounts]);

  const handleDeleteChallan = async (id: string) => {
    const ok = await confirm({
      title: 'Delete Challan',
      message: 'This will permanently delete this challan. This action cannot be undone.',
      confirmLabel: 'Delete',
      variant: 'danger',
    });
    if (!ok) return;
    try {
      showLoading('Deleting challan...');
      const res = await apiFetch(`${API_BASE}/invoices/${id}/`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || `Failed to delete challan (${res.status})`);
        return;
      }
      toast.success('Challan deleted successfully.');
      handleSuccess();
    } catch (err) {
      toast.error('Failed to delete challan: network error');
    } finally {
      hideLoading();
    }
  };

  const handleWhatsApp = (challan: any) => {
    if (!challan.client_mobile) {
      toast.error("Client does not have a registered mobile number.");
      return;
    }
    const message = challanMessage(
      challan.client_name,
      challan.invoice_number,
      challan.case_number,
      challan.amount,
      challan.due_date,
      challan.description || 'Professional Legal Services'
    );
    const success = sendWhatsApp(challan.client_mobile, message);
    if (success) {
      toast.success("WhatsApp opened!");
    } else {
      toast.error("Could not open WhatsApp.");
    }
  };

  const handleGeneratePdf = async (challan: any, action: 'download' | 'print' = 'download') => {
    setIsGeneratingPdf(true);
    let originalGetComputedStyle: typeof window.getComputedStyle | null = null;

    try {
      // Force synchronous render of the hidden invoice template so it's in the DOM immediately
      const { flushSync } = await import('react-dom');
      flushSync(() => {
        setSelectedCaseForInvoice(challan);
      });

      const element = document.getElementById('invoice-template-container');
      if (!element) throw new Error("Template container not found");
      
      // html2canvas crashes on Tailwind v4's oklch/lab colors.
      // We safely proxy getComputedStyle. To avoid Illegal Invocation on CSSStyleDeclaration,
      // we must NOT pass the proxy receiver to Reflect.get or property access,
      // and we MUST bind all functions to the original native target.
      originalGetComputedStyle = window.getComputedStyle;
      window.getComputedStyle = function(el, pseudoElt) {
        const style = originalGetComputedStyle!(el, pseudoElt);
        return new Proxy(style, {
          get(target, prop) {
            // Native property access without receiver preserves the correct 'this' for internal slots
            const val = (target as any)[prop];
            
            if (typeof val === 'function') {
              if (prop === 'getPropertyValue') {
                return function(property: string) {
                  const res = target.getPropertyValue(property);
                  if (typeof res === 'string' && (res.includes('lab(') || res.includes('oklch(') || res.includes('color('))) {
                    return 'rgb(255, 255, 255)'; // Safe fallback
                  }
                  return res;
                };
              }
              // Bind other methods to the native object to prevent Illegal Invocation
              return val.bind(target);
            }
            
            if (typeof val === 'string' && (val.includes('lab(') || val.includes('oklch(') || val.includes('color('))) {
              return 'rgb(255, 255, 255)';
            }
            
            return val;
          }
        });
      };

      const html2pdfModule = await import('html2pdf.js');
      const html2pdf = html2pdfModule.default || html2pdfModule;
      
      const opt = {
        margin:       0,
        filename:     `Challan_${challan.invoice_number}.pdf`,
        image:        { type: 'jpeg' as const, quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true },
        jsPDF:        { unit: 'in', format: 'a4', orientation: 'portrait' as const }
      };

      if (action === 'print') {
        const pdfUrl = await html2pdf().set(opt).from(element).output('bloburl');
        window.open(pdfUrl, '_blank');
      } else {
        if (navigator.share && navigator.canShare) {
          const pdfBlob = await html2pdf().set(opt).from(element).output('blob');
          const file = new File([pdfBlob], opt.filename, { type: 'application/pdf' });
          
          if (navigator.canShare({ files: [file] })) {
             await navigator.share({
               files: [file],
               title: `Challan ${challan.invoice_number}`,
               text: 'Please find the payment challan attached.'
             });
          } else {
             html2pdf().set(opt).from(element).save();
          }
        } else {
          // Desktop fallback: just download
          html2pdf().set(opt).from(element).save();
        }
      }
    } catch (err: any) {
      console.error("PDF generation error:", err);
      // If sharing failed (e.g. NotAllowedError due to user gesture), fallback to download
      if (err.name === 'NotAllowedError' || err.message?.includes('share')) {
        try {
          const element = document.getElementById('invoice-template-container');
          const html2pdfModule = await import('html2pdf.js');
          const html2pdf = html2pdfModule.default || html2pdfModule;
          html2pdf().set({ filename: `Challan_${challan.invoice_number}.pdf` }).from(element!).save();
        } catch (fallbackErr) {
          toast.error(`Error generating PDF: ${fallbackErr}`);
        }
      } else {
        toast.error(`Error generating or sharing PDF: ${err.message || err}`);
      }
    } finally {
      if (originalGetComputedStyle) {
        window.getComputedStyle = originalGetComputedStyle;
      }

      setIsGeneratingPdf(false);
      setSelectedCaseForInvoice(null);
    }
  };

  const filteredChallans = challans.filter((c: any) => {
    const matchesSearch = 
      c.case_number?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      c.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.invoice_number?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'All' || c.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const filteredPayments = payments.filter((p: any) => {
    const matchesSearch = 
      p.case_number?.toLowerCase().includes(paymentSearchTerm.toLowerCase()) || 
      p.client_name?.toLowerCase().includes(paymentSearchTerm.toLowerCase()) ||
      p.amount_received?.toString().includes(paymentSearchTerm);
    
    return matchesSearch;
  });

  if (!canViewAccounts) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center">
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
          <ShieldAlert size={32} className="text-slate-300" />
        </div>
        <h2 className="text-xl font-bold text-slate-700">Access Denied</h2>
        <p className="text-slate-500 mt-1">You don't have permission to view accounts.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-500 w-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Financial Accounts</h2>
          <p className="text-slate-500 mt-1 text-sm sm:text-base">Manage ledgers, issue challans, and record payments.</p>
        </div>
        {canManageAccounts && (
          <button 
            onClick={() => setIsGenerateModalOpen(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-medium transition-colors shadow-sm shadow-blue-600/20"
          >
            <Plus size={18} /> Generate Challan
          </button>
        )}
      </div>

      {/* Ledger Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-2xl shadow-lg shadow-blue-500/20 text-white relative overflow-hidden group">
          <div className="absolute right-[-10px] top-[-10px] opacity-10 group-hover:scale-110 transition-transform duration-500"><FileText size={100} /></div>
          <div className="relative z-10">
            <h3 className="font-semibold text-blue-100 uppercase tracking-wider text-sm mb-1">Total Billed</h3>
            {loading ? <div className="h-8 w-24 bg-blue-400/50 animate-pulse rounded mt-2"></div> : (
              <p className="text-3xl font-black font-mono">Rs. {Number(ledger.total_billed).toLocaleString()}</p>
            )}
          </div>
        </div>

        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 p-6 rounded-2xl shadow-lg shadow-emerald-500/20 text-white relative overflow-hidden group">
          <div className="absolute right-[-10px] top-[-10px] opacity-10 group-hover:scale-110 transition-transform duration-500"><Wallet size={100} /></div>
          <div className="relative z-10">
            <h3 className="font-semibold text-emerald-100 uppercase tracking-wider text-sm mb-1">Total Received</h3>
            {loading ? <div className="h-8 w-24 bg-emerald-400/50 animate-pulse rounded mt-2"></div> : (
              <p className="text-3xl font-black font-mono">Rs. {Number(ledger.total_received).toLocaleString()}</p>
            )}
          </div>
        </div>

        <div className="bg-gradient-to-br from-rose-500 to-rose-600 p-6 rounded-2xl shadow-lg shadow-rose-500/20 text-white relative overflow-hidden group">
          <div className="absolute right-[-10px] top-[-10px] opacity-10 group-hover:scale-110 transition-transform duration-500"><TrendingUp size={100} /></div>
          <div className="relative z-10">
            <h3 className="font-semibold text-rose-100 uppercase tracking-wider text-sm mb-1">Outstanding</h3>
            {loading ? <div className="h-8 w-24 bg-rose-400/50 animate-pulse rounded mt-2"></div> : (
              <p className="text-3xl font-black font-mono">Rs. {Number(ledger.outstanding_balance).toLocaleString()}</p>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] border border-slate-100 relative overflow-hidden group">
          <div className="absolute right-[-10px] top-[-10px] opacity-5 text-slate-400 group-hover:scale-110 transition-transform duration-500"><Coins size={100} /></div>
          <div className="relative z-10">
            <h3 className="font-semibold text-slate-500 uppercase tracking-wider text-sm mb-1">Active Challans</h3>
            {loading ? <div className="h-8 w-16 bg-slate-100 animate-pulse rounded mt-2"></div> : (
              <p className="text-3xl font-black text-slate-900">{challans.length}</p>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
        {/* Main Challan Table Area */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] border border-slate-100 overflow-hidden flex flex-col h-[600px]">
          <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-50/50 shrink-0">
            <div className="flex gap-2 border-b border-slate-100 pb-1">
              <button
                onClick={() => setActiveTab('challans')}
                className={`pb-2 px-3 text-sm font-bold border-b-2 transition-colors ${
                  activeTab === 'challans'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                Challans
              </button>
              <button
                onClick={() => setActiveTab('payments')}
                className={`pb-2 px-3 text-sm font-bold border-b-2 transition-colors ${
                  activeTab === 'payments'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                Payment History
              </button>
            </div>
            
            {activeTab === 'challans' ? (
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <select 
                  value={groupBy}
                  onChange={(e) => setGroupBy(e.target.value as 'flat' | 'client')}
                  className="pl-3 pr-8 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-medium"
                >
                  <option value="flat">List View</option>
                  <option value="client">Client-Wise View</option>
                </select>

                <select 
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="pl-3 pr-8 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-medium"
                >
                  <option value="All">All Statuses</option>
                  <option value="Paid">Paid</option>
                  <option value="Partial">Partial</option>
                  <option value="Pending">Pending</option>
                </select>

                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                  <input 
                    type="text" 
                    placeholder="Search challans..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                  />
                </div>
              </div>
            ) : (
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                <input 
                  type="text" 
                  placeholder="Search payments..." 
                  value={paymentSearchTerm}
                  onChange={(e) => setPaymentSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                />
              </div>
            )}
          </div>

          <div className="overflow-y-auto flex-1 custom-scrollbar">
            {activeTab === 'challans' ? (
              loading ? (
                 <div className="p-12 flex justify-center"><div className="w-8 h-8 border-4 border-slate-100 border-t-blue-500 rounded-full animate-spin"></div></div>
              ) : filteredChallans.length === 0 ? (
                 <div className="p-12 text-center text-slate-500">No challans found.</div>
              ) : (
                <table className="w-full text-left border-collapse min-w-[600px]">
                  <thead className="sticky top-0 bg-white/90 backdrop-blur border-b border-slate-100 z-10">
                    <tr>
                      <th className="px-4 sm:px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Details</th>
                      <th className="px-4 sm:px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Amount</th>
                      <th className="px-4 sm:px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                      <th className="px-4 sm:px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {groupBy === 'flat' ? (
                      filteredChallans.map((c: any) => (
                        <tr key={c.id} className="hover:bg-slate-50/50 transition-colors group">
                          <td className="px-4 sm:px-6 py-4">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-mono text-xs font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">{c.invoice_number}</span>
                            </div>
                            <p className="font-semibold text-slate-900 flex items-center gap-1.5">
                              {c.client_number && <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded font-mono shrink-0">{c.client_number}</span>}
                              {c.client_name}
                            </p>
                            <p className="text-xs text-slate-500 mt-0.5">Case: {c.case_number}</p>
                          </td>
                          <td className="px-4 sm:px-6 py-4">
                            <p className="font-mono font-bold text-slate-900">Rs. {Number(c.amount).toLocaleString()}</p>
                            <p className="text-xs text-slate-500 mt-0.5">Paid: <span className="font-medium text-emerald-600">Rs. {Number(c.amount_paid || 0).toLocaleString()}</span></p>
                          </td>
                          <td className="px-4 sm:px-6 py-4">
                            <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-semibold ${
                              c.status === 'Paid' ? 'bg-emerald-100 text-emerald-700' :
                              c.status === 'Partial' ? 'bg-amber-100 text-amber-700' :
                              'bg-rose-100 text-rose-700'
                            }`}>
                              {c.status}
                            </span>
                          </td>
                          <td className="px-4 sm:px-6 py-4">
                            <div className="flex items-center justify-end gap-2">
                              <button 
                                onClick={() => handleGeneratePdf(c, 'print')}
                                disabled={isGeneratingPdf && selectedCaseForInvoice?.id === c.id}
                                title="Print Challan"
                                className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
                              >
                                {(isGeneratingPdf && selectedCaseForInvoice?.id === c.id) ? (
                                  <div className="w-4 h-4 border-2 border-slate-400 border-t-slate-800 rounded-full animate-spin"></div>
                                ) : (
                                  <Printer size={16} />
                                )}
                              </button>

                              <button 
                                onClick={() => handleWhatsApp(c)}
                                title="Share via WhatsApp"
                                className="p-1.5 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                              >
                                <MessageCircle size={16} />
                              </button>

                              <button 
                                onClick={() => handleGeneratePdf(c, 'download')}
                                disabled={isGeneratingPdf && selectedCaseForInvoice?.id === c.id}
                                title="Download PDF"
                                className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50 hidden sm:inline-flex"
                              >
                                {(isGeneratingPdf && selectedCaseForInvoice?.id === c.id) ? (
                                  <div className="w-4 h-4 border-2 border-slate-400 border-t-blue-600 rounded-full animate-spin"></div>
                                ) : (
                                  <Download size={16} />
                                )}
                              </button>

                              {canManageAccounts && c.status !== 'Paid' && (
                                <button 
                                  onClick={() => {
                                    setSelectedChallanForPayment(c);
                                    setIsPaymentModalOpen(true);
                                  }}
                                  title="Add Payment"
                                  className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                >
                                  <Coins size={16} />
                                </button>
                              )}

                              {canDeleteAccounts && (
                                <button 
                                  onClick={() => handleDeleteChallan(c.id)}
                                  title="Delete Challan"
                                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                >
                                  <Trash2 size={16} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      (() => {
                        const grouped: { [key: string]: any[] } = {};
                        filteredChallans.forEach((c: any) => {
                          const key = c.client_number ? `${c.client_number} - ${c.client_name}` : c.client_name || 'Unknown Client';
                          if (!grouped[key]) grouped[key] = [];
                          grouped[key].push(c);
                        });
                        const keys = Object.keys(grouped).sort((a, b) => a.localeCompare(b));
                        return keys.map(clientKey => (
                          <Suspense key={clientKey}>
                            <tr className="bg-slate-50/80 font-semibold text-slate-700">
                              <td colSpan={4} className="px-4 sm:px-6 py-2.5 border-y border-slate-200 text-xs font-extrabold uppercase tracking-wider text-slate-500 bg-slate-50">
                                👤 {clientKey} ({grouped[clientKey].length} {grouped[clientKey].length === 1 ? 'Challan' : 'Challans'})
                              </td>
                            </tr>
                            {grouped[clientKey].map((c: any) => (
                              <tr key={c.id} className="hover:bg-slate-50/50 transition-colors group">
                                <td className="px-4 sm:px-6 py-4 pl-8 sm:pl-10">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="font-mono text-xs font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">{c.invoice_number}</span>
                                  </div>
                                  <p className="font-medium text-slate-700">Case: {c.case_number}</p>
                                </td>
                                <td className="px-4 sm:px-6 py-4">
                                  <p className="font-mono font-bold text-slate-900">Rs. {Number(c.amount).toLocaleString()}</p>
                                  <p className="text-xs text-slate-500 mt-0.5">Paid: <span className="font-medium text-emerald-600">Rs. {Number(c.amount_paid || 0).toLocaleString()}</span></p>
                                </td>
                                <td className="px-4 sm:px-6 py-4">
                                  <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-semibold ${
                                    c.status === 'Paid' ? 'bg-emerald-100 text-emerald-700' :
                                    c.status === 'Partial' ? 'bg-amber-100 text-amber-700' :
                                    'bg-rose-100 text-rose-700'
                                  }`}>
                                    {c.status}
                                  </span>
                                </td>
                                <td className="px-4 sm:px-6 py-4">
                                  <div className="flex items-center justify-end gap-2">
                                    <button 
                                      onClick={() => handleGeneratePdf(c, 'print')}
                                      disabled={isGeneratingPdf && selectedCaseForInvoice?.id === c.id}
                                      title="Print Challan"
                                      className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
                                    >
                                      {(isGeneratingPdf && selectedCaseForInvoice?.id === c.id) ? (
                                        <div className="w-4 h-4 border-2 border-slate-400 border-t-slate-800 rounded-full animate-spin"></div>
                                      ) : (
                                        <Printer size={16} />
                                      )}
                                    </button>

                                    <button 
                                      onClick={() => handleWhatsApp(c)}
                                      title="Share via WhatsApp"
                                      className="p-1.5 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                    >
                                      <MessageCircle size={16} />
                                    </button>

                                    <button 
                                      onClick={() => handleGeneratePdf(c, 'download')}
                                      disabled={isGeneratingPdf && selectedCaseForInvoice?.id === c.id}
                                      title="Download PDF"
                                      className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50 hidden sm:inline-flex"
                                    >
                                      {(isGeneratingPdf && selectedCaseForInvoice?.id === c.id) ? (
                                        <div className="w-4 h-4 border-2 border-slate-400 border-t-blue-600 rounded-full animate-spin"></div>
                                      ) : (
                                        <Download size={16} />
                                      )}
                                    </button>

                                    {canManageAccounts && c.status !== 'Paid' && (
                                      <button 
                                        onClick={() => {
                                          setSelectedChallanForPayment(c);
                                          setIsPaymentModalOpen(true);
                                        }}
                                        title="Add Payment"
                                        className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                      >
                                        <Coins size={16} />
                                      </button>
                                    )}

                                    {canDeleteAccounts && (
                                      <button 
                                        onClick={() => handleDeleteChallan(c.id)}
                                        title="Delete Challan"
                                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                      >
                                        <Trash2 size={16} />
                                      </button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </Suspense>
                        ));
                      })()
                    )}
                  </tbody>
                </table>
              )
            ) : (
              loading || paymentsLoading ? (
                 <div className="p-12 flex justify-center"><div className="w-8 h-8 border-4 border-slate-100 border-t-blue-500 rounded-full animate-spin"></div></div>
              ) : filteredPayments.length === 0 ? (
                 <div className="p-12 text-center text-slate-500">No payments found.</div>
              ) : (
                <table className="w-full text-left border-collapse min-w-[600px]">
                  <thead className="sticky top-0 bg-white/90 backdrop-blur border-b border-slate-100 z-10">
                    <tr>
                      <th className="px-4 sm:px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Case Info</th>
                      <th className="px-4 sm:px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Amount</th>
                      <th className="px-4 sm:px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Date</th>
                      <th className="px-4 sm:px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredPayments.map((p: any) => (
                      <tr key={p.id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-4 sm:px-6 py-4">
                          <p className="font-semibold text-slate-900">{p.client_name}</p>
                          <p className="text-xs text-slate-500 mt-0.5">Case: {p.case_number}</p>
                        </td>
                        <td className="px-4 sm:px-6 py-4">
                          <p className="font-mono font-bold text-slate-900">Rs. {Number(p.amount_received).toLocaleString()}</p>
                        </td>
                        <td className="px-4 sm:px-6 py-4">
                          <p className="text-sm text-slate-600">{new Date(p.payment_date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}</p>
                        </td>
                        <td className="px-4 sm:px-6 py-4 text-right">
                          {canDeleteAccounts && (
                            <button 
                              onClick={() => handleDeletePayment(p.id)}
                              title="Reverse Payment"
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )
            )}
          </div>
        </div>

        {/* Monthly Revenue Chart */}
        <div className="bg-white rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] border border-slate-100 overflow-hidden flex flex-col h-[400px] lg:h-[600px]">
          <div className="p-5 border-b border-slate-100 bg-slate-50/50 shrink-0">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <TrendingUp size={18} className="text-emerald-600" /> Monthly Revenue
            </h3>
          </div>
          <div className="p-6 flex-1 flex flex-col justify-end">
            {ledger.revenue_chart.length > 0 ? (
              <div className="flex items-end justify-between h-full gap-2 pt-8">
                {ledger.revenue_chart.map((data, idx) => {
                  const maxRevenue = Math.max(...ledger.revenue_chart.map(d => d.revenue));
                  const heightPercentage = maxRevenue > 0 ? (data.revenue / maxRevenue) * 100 : 0;
                  
                  return (
                    <div key={idx} className="flex flex-col items-center gap-2 flex-1 group relative h-full justify-end">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md mb-1 whitespace-nowrap z-10 absolute top-0 -mt-6">
                        Rs. {Number(data.revenue).toLocaleString()}
                      </div>
                      <div className="w-full bg-slate-50 rounded-t-sm overflow-hidden flex items-end h-full border-b border-slate-200">
                        <div 
                          className="w-full bg-gradient-to-t from-emerald-600 to-emerald-400 rounded-t-sm hover:from-emerald-500 hover:to-emerald-300 transition-all duration-300 cursor-pointer shadow-sm shadow-emerald-500/20"
                          style={{ height: `${heightPercentage}%`, minHeight: heightPercentage > 0 ? '4px' : '0' }}
                        ></div>
                      </div>
                      <span className="text-xs font-semibold text-slate-500 mt-2">{data.month.split(' ')[0]}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-sm text-slate-400 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                No revenue recorded yet
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Hidden Invoice Template for PDF generation */}
      <div className="absolute top-[-9999px] left-[-9999px]">
        {selectedCaseForInvoice && (
          <div id="invoice-template-container" style={{ width: '800px' }}>
            <InvoiceTemplate caseData={selectedCaseForInvoice} />
          </div>
        )}
      </div>

      {/* Modals */}
      <GenerateChallanModal 
        isOpen={isGenerateModalOpen} 
        onClose={() => setIsGenerateModalOpen(false)} 
        onSuccess={handleSuccess} 
      />
      
      <AddPaymentModal 
        isOpen={isPaymentModalOpen} 
        onClose={() => {
          setIsPaymentModalOpen(false);
          setSelectedChallanForPayment(null);
        }} 
        onSuccess={handleSuccess}
        challan={selectedChallanForPayment}
      />
    </div>
  );
}

export default function AccountsPage() {
  return (
    <Suspense fallback={<div className="p-12 flex justify-center"><div className="w-8 h-8 border-4 border-slate-100 border-t-blue-500 rounded-full animate-spin"></div></div>}>
      <AccountsContent />
    </Suspense>
  );
}
