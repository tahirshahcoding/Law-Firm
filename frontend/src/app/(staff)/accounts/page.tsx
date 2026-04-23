'use client';

import { useState, useEffect, useRef } from 'react';
import { CircleDollarSign, Receipt, TrendingUp, Download, ArrowUpRight, Search, FileText } from 'lucide-react';
import { API_BASE, apiFetch } from '@/lib/api';
import InvoiceTemplate from '@/components/InvoiceTemplate';
import { useAuth } from '@/context/AuthContext';

export default function AccountsPage() {
  const [ledger, setLedger] = useState({
    total_billed: 0,
    total_received: 0,
    outstanding_balance: 0,
    revenue_chart: [] as { month: string, revenue: number }[]
  });
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // State for PDF Generation
  const [selectedCaseForInvoice, setSelectedCaseForInvoice] = useState<any>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const invoiceContainerRef = useRef<HTMLDivElement>(null);

  const { user } = useAuth();
  
  useEffect(() => {
    if (user && user.role !== 'Admin' && !user.permissions?.manage_accounts) {
      window.location.href = '/';
      return;
    }

    const fetchAccounts = async () => {
      try {
        const [ledgerRes, casesRes] = await Promise.all([
          apiFetch('${API_BASE}/accounts/ledger/'),
          apiFetch('${API_BASE}/cases/')
        ]);
        
        const ledgerData = await ledgerRes.json();
        const casesData = await casesRes.json();
        
        setLedger(ledgerData);
        setCases(casesData);
        setLoading(false);
      } catch (err) {
        console.error('Failed to fetch accounts data:', err);
        setLoading(false);
      }
    };
    fetchAccounts();
  }, []);

  const handleGenerateInvoice = async (caseObj: any) => {
    setSelectedCaseForInvoice(caseObj);
    setIsGeneratingPdf(true);

    try {
      // Wait for React to render the InvoiceTemplate
      setTimeout(() => {
        const element = document.getElementById('invoice-template-container');
        if (!element) return;
        
        // Native Print Approach: Best quality, no canvas bugs!
        const printWindow = window.open('', '', 'width=800,height=900');
        if (!printWindow) {
          alert('Please allow popups to generate the invoice.');
          setIsGeneratingPdf(false);
          setSelectedCaseForInvoice(null);
          return;
        }

        // We inject Tailwind CSS directly into the print window to ensure styles are perfect
        printWindow.document.write(`
          <html>
            <head>
              <title>Invoice - ${caseObj.case_number}</title>
              <script src="https://cdn.tailwindcss.com"></script>
              <style>
                @media print {
                  @page { margin: 0; }
                  body { margin: 1.6cm; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                }
              </style>
            </head>
            <body>
              ${element.innerHTML}
              <script>
                // Wait for Tailwind to process
                setTimeout(() => {
                  window.print();
                  window.close();
                }, 500);
              </script>
            </body>
          </html>
        `);
        printWindow.document.close();
        
        setIsGeneratingPdf(false);
        setSelectedCaseForInvoice(null);
      }, 500);
      
    } catch (err) {
      console.error('Error generating PDF:', err);
      setIsGeneratingPdf(false);
      alert('Error generating PDF.');
    }
  };

  const filteredCases = cases.filter((c: any) => 
    c.case_number?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.opponent_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500 w-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Financial Accounts</h2>
          <p className="text-slate-500 mt-1">Manage ledgers, revenues, and client invoices.</p>
        </div>
      </div>

      {/* Ledger Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] border border-slate-100 hover:shadow-md transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-sm text-slate-500 uppercase tracking-wider">Total Billed</h3>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <Receipt size={20} />
            </div>
          </div>
          {loading ? (
             <div className="h-10 w-24 bg-slate-100 animate-pulse rounded mt-2"></div>
          ) : (
            <p className="text-3xl font-bold text-slate-900 mt-2 font-mono">Rs. {Number(ledger.total_billed).toLocaleString()}</p>
          )}
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] border border-slate-100 hover:shadow-md transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-sm text-slate-500 uppercase tracking-wider">Total Received</h3>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <CircleDollarSign size={20} />
            </div>
          </div>
          {loading ? (
             <div className="h-10 w-24 bg-slate-100 animate-pulse rounded mt-2"></div>
          ) : (
            <p className="text-3xl font-bold text-emerald-600 mt-2 font-mono">Rs. {Number(ledger.total_received).toLocaleString()}</p>
          )}
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] border border-slate-100 hover:shadow-md transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-sm text-slate-500 uppercase tracking-wider">Outstanding</h3>
            <div className="p-2 bg-rose-50 text-rose-600 rounded-lg">
              <TrendingUp size={20} />
            </div>
          </div>
          {loading ? (
             <div className="h-10 w-24 bg-slate-100 animate-pulse rounded mt-2"></div>
          ) : (
            <p className="text-3xl font-bold text-rose-600 mt-2 font-mono">Rs. {Number(ledger.outstanding_balance).toLocaleString()}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Invoice Generator Table */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] border border-slate-100 overflow-hidden flex flex-col h-[500px]">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <FileText size={18} className="text-blue-600" /> Issue Invoices
            </h3>
            <div className="relative max-w-xs w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input 
                type="text" 
                placeholder="Search case..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
              />
            </div>
          </div>
          <div className="overflow-y-auto flex-1 custom-scrollbar">
            {loading ? (
               <div className="p-12 flex justify-center"><div className="w-8 h-8 border-4 border-slate-100 border-t-blue-500 rounded-full animate-spin"></div></div>
            ) : (
              <table className="w-full text-left border-collapse min-w-[500px]">
                <thead className="sticky top-0 bg-white/90 backdrop-blur border-b border-slate-100 z-10">
                  <tr>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Case Reference</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Fee</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredCases.map((c: any) => (
                    <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-semibold text-slate-900">{c.case_number}</p>
                        <p className="text-xs text-slate-500 mt-0.5">vs. {c.opponent_name}</p>
                      </td>
                      <td className="px-6 py-4 font-mono font-medium text-slate-700">
                        Rs. {Number(c.total_fee).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => handleGenerateInvoice(c)}
                          disabled={isGeneratingPdf && selectedCaseForInvoice?.id === c.id}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                        >
                          {(isGeneratingPdf && selectedCaseForInvoice?.id === c.id) ? (
                            <div className="w-4 h-4 border-2 border-slate-400 border-t-slate-700 rounded-full animate-spin"></div>
                          ) : (
                            <Download size={14} />
                          )}
                          PDF
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Monthly Revenue Chart */}
        <div className="bg-white rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] border border-slate-100 overflow-hidden flex flex-col h-[500px]">
          <div className="p-5 border-b border-slate-100 bg-slate-50/50 shrink-0">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <TrendingUp size={18} className="text-emerald-600" /> Monthly Revenue
            </h3>
          </div>
          <div className="p-6 flex-1 flex flex-col justify-end">
            {ledger.revenue_chart.length > 0 ? (
              <div className="flex items-end justify-between h-64 gap-2">
                {ledger.revenue_chart.map((data, idx) => {
                  // Calculate max revenue to scale the bars
                  const maxRevenue = Math.max(...ledger.revenue_chart.map(d => d.revenue));
                  const heightPercentage = maxRevenue > 0 ? (data.revenue / maxRevenue) * 100 : 0;
                  
                  return (
                    <div key={idx} className="flex flex-col items-center gap-2 flex-1 group">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md mb-1 whitespace-nowrap z-10 absolute -mt-8">
                        Rs. {Number(data.revenue).toLocaleString()}
                      </div>
                      <div className="w-full bg-slate-100 rounded-t-sm overflow-hidden flex items-end h-full">
                        <div 
                          className="w-full bg-emerald-500 hover:bg-emerald-400 transition-all duration-300 cursor-pointer"
                          style={{ height: `${heightPercentage}%` }}
                        ></div>
                      </div>
                      <span className="text-xs font-medium text-slate-500 -rotate-45 origin-top-left mt-2">{data.month.split(' ')[0]}</span>
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

      {/* Hidden Invoice Template - only rendered into the DOM temporarily when generating a PDF */}
      <div className="absolute top-[-9999px] left-[-9999px]">
        {selectedCaseForInvoice && (
          <div id="invoice-template-container" style={{ width: '800px', backgroundColor: '#ffffff', color: '#000000', fontSize: '14px' }}>
            <InvoiceTemplate caseData={selectedCaseForInvoice} />
          </div>
        )}
      </div>
    </div>
  );
}
