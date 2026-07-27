import React, { useEffect } from 'react';
import { useReportData } from '../hooks/useReportData';
import { ShieldCheck, FileCheck, Calendar, DollarSign, Award, UserCheck } from 'lucide-react';

interface PrintReportProps {
  reportType: string;
  filters: Record<string, any>;
  reportTitle: string;
  filtersSummary?: string;
  generatedBy?: string;
}

export function PrintFriendlyReport({ reportType, filters, reportTitle, filtersSummary, generatedBy }: PrintReportProps) {
  const { data: caseData, loading: caseLoading, fetchReport: fetchCases } = useReportData('cases');
  const { data: hearingData, loading: hearingLoading, fetchReport: fetchHearings } = useReportData('cases/hearings');
  const { data: finData, loading: finLoading, fetchReport: fetchFin } = useReportData('financials');
  const { data: prodData, loading: prodLoading, fetchReport: fetchProd } = useReportData('productivity');

  useEffect(() => {
    if (reportType === 'master' || reportType === 'cases' || reportType === 'status') {
      fetchCases(filters);
    }
    if (reportType === 'master' || reportType === 'cases' || reportType === 'hearings') {
      fetchHearings(filters);
    }
    if (reportType === 'master' || reportType === 'accounts') {
      fetchFin(filters);
    }
    if (reportType === 'master' || reportType === 'productivity') {
      fetchProd(filters);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reportType, JSON.stringify(filters)]);

  const loading = caseLoading || hearingLoading || finLoading || prodLoading;

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-600 font-medium bg-white rounded-xl border border-slate-200 shadow-sm animate-pulse flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-3 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-semibold tracking-wide">Compiling Official Chamber Records...</p>
      </div>
    );
  }

  const displaySummary = filtersSummary || Object.entries(filters)
    .filter(([_, val]) => val !== '' && val !== null && val !== undefined)
    .map(([key, val]) => `${key.replace('_', ' ').toUpperCase()}: ${val}`)
    .join(' | ') || 'ALL RECORDS (No filters applied)';

  const totalCases = caseData?.total_cases || 0;
  const totalHearings = hearingData?.total_hearings || 0;
  const isDetailed = filters.scope === 'detailed';
  const nowStr = new Date().toLocaleString('en-PK', { dateStyle: 'full', timeStyle: 'short' });
  const refNumber = `RA-RPT-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${Math.floor(1000 + Math.random() * 9000)}`;

  return (
    <div className="bg-white text-slate-900 p-8 sm:p-12 border border-slate-300 shadow-lg rounded-xl print:border-none print:shadow-none print:p-0 w-full max-w-5xl mx-auto font-sans leading-relaxed">
      
      {/* ── FORMAL A4 CHAMBER LETTERHEAD HEADER ── */}
      <div className="border-b-2 border-slate-900 pb-5 mb-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-4">
          
          {/* Chamber Title */}
          <div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 uppercase">
              RAHIMULLAH &amp; ASSOCIATES
            </h1>
            <p className="text-xs font-extrabold text-amber-700 dark:text-amber-600 uppercase tracking-widest">
              Advocates, Legal Consultants &amp; High Court Practitioners
            </p>
            <p className="text-[11px] text-slate-600 font-medium">
              District &amp; Sessions Courts Complex, Swat, Khyber Pakhtunkhwa
            </p>
          </div>

          {/* Document Verification Badge */}
          <div className="text-right sm:text-right border-t sm:border-t-0 sm:border-l border-slate-200 pt-2 sm:pt-0 sm:pl-5">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 rounded text-[11px] font-bold text-slate-800 border border-slate-300 uppercase tracking-wider mb-1">
              <ShieldCheck size={13} className="text-emerald-700" /> Official Chamber Record
            </div>
            <p className="text-[11px] font-mono text-slate-600">Ref: <span className="font-bold text-slate-900">{refNumber}</span></p>
            <p className="text-[11px] font-mono text-slate-500">Issued: {nowStr}</p>
          </div>

        </div>

        {/* Double Border Line */}
        <div className="h-0.5 bg-slate-900 w-full mb-0.5"></div>
        <div className="h-px bg-slate-400 w-full"></div>
      </div>

      {/* ── REPORT METADATA & TITLE BLOCK ── */}
      <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 mb-8 space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-2">
          <h2 className="text-base sm:text-lg font-black text-slate-900 uppercase tracking-wide flex items-center gap-2">
            <FileCheck size={18} className="text-slate-700" />
            {reportTitle} <span className="text-xs font-bold px-2 py-0.5 bg-slate-900 text-white rounded uppercase tracking-widest">{isDetailed ? 'Detailed Itemized Register' : 'Summary Overview'}</span>
          </h2>
          <span className="text-xs text-slate-500 font-medium">Generated By: <strong>{generatedBy || 'Chamber Administrator'}</strong></span>
        </div>
        <div className="text-xs text-slate-700 flex items-start gap-1.5">
          <span className="font-bold shrink-0 text-slate-900">Selection Criteria &amp; Scope:</span>
          <span className="font-mono text-slate-800">{displaySummary}</span>
        </div>
      </div>

      {/* ── REPORT CONTENT SECTIONS ── */}

      {/* 1. MASTER REPORT */}
      {reportType === 'master' && (
        <div className="space-y-8 text-sm">
          
          {/* Executive KPI Bar */}
          <div>
            <h3 className="font-black text-xs uppercase tracking-widest bg-slate-900 text-white p-2.5 rounded-t-md mb-0 flex items-center justify-between">
              <span>1. Executive Summary &amp; Key Indicators</span>
              <Award size={14} className="text-amber-400" />
            </h3>
            <table className="w-full border-collapse border border-slate-300 text-left text-xs">
              <tbody>
                <tr className="even:bg-slate-50">
                  <th className="border border-slate-300 p-3 bg-slate-100 font-bold w-1/4">Total Litigation Caseload</th>
                  <td className="border border-slate-300 p-3 font-bold text-base text-slate-900">{totalCases.toLocaleString()} Cases</td>
                  <th className="border border-slate-300 p-3 bg-slate-100 font-bold w-1/4">Scheduled Hearing Listings</th>
                  <td className="border border-slate-300 p-3 font-bold text-base text-slate-900">{totalHearings.toLocaleString()} Listings</td>
                </tr>
                {finData?.kpis && (
                  <>
                    <tr className="even:bg-slate-50">
                      <th className="border border-slate-300 p-3 bg-slate-100 font-bold">Total Invoiced Amount</th>
                      <td className="border border-slate-300 p-3 font-mono font-bold text-slate-900">Rs {Number(finData.kpis.total_billed || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                      <th className="border border-slate-300 p-3 bg-slate-100 font-bold">Total Collections Received</th>
                      <td className="border border-slate-300 p-3 font-mono font-bold text-emerald-800">Rs {Number(finData.kpis.total_collected || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    </tr>
                    <tr className="even:bg-slate-50">
                      <th className="border border-slate-300 p-3 bg-slate-100 font-bold">Outstanding Receivables</th>
                      <td className="border border-slate-300 p-3 font-mono font-bold text-red-700" colSpan={3}>
                        Rs {Number(finData.kpis.total_outstanding || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  </>
                )}
              </tbody>
            </table>
          </div>

          {/* Detailed Itemized Cases Register (when scope == detailed) */}
          {isDetailed && caseData?.detailed_cases && (
            <div>
              <h3 className="font-black text-xs uppercase tracking-widest bg-slate-900 text-white p-2.5 rounded-t-md mb-0">
                Itemized Litigation Register ({caseData.detailed_cases.length} Active Records)
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-slate-300 text-left text-xs">
                  <thead>
                    <tr className="bg-slate-800 text-white font-bold">
                      <th className="border border-slate-700 p-2 text-center w-8">#</th>
                      <th className="border border-slate-700 p-2">Case No / FIR</th>
                      <th className="border border-slate-700 p-2">Client Name</th>
                      <th className="border border-slate-700 p-2">Opponent</th>
                      <th className="border border-slate-700 p-2">Category</th>
                      <th className="border border-slate-700 p-2">Court Forum</th>
                      <th className="border border-slate-700 p-2">Assigned Advocate</th>
                      <th className="border border-slate-700 p-2">Status</th>
                      <th className="border border-slate-700 p-2 text-right">Agreed Fee</th>
                    </tr>
                  </thead>
                  <tbody>
                    {caseData.detailed_cases.map((c: any, idx: number) => (
                      <tr key={c.id || idx} className="even:bg-slate-50 hover:bg-slate-100/80 transition-colors">
                        <td className="border border-slate-300 p-2 text-center font-bold text-slate-600">{idx + 1}</td>
                        <td className="border border-slate-300 p-2 font-bold font-mono text-slate-900">{c.case_number}</td>
                        <td className="border border-slate-300 p-2 font-medium">{c.client__name}</td>
                        <td className="border border-slate-300 p-2">{c.opponent_name}</td>
                        <td className="border border-slate-300 p-2">{c.category}</td>
                        <td className="border border-slate-300 p-2">{c.court__name}</td>
                        <td className="border border-slate-300 p-2">{c.assigned_advocate}</td>
                        <td className="border border-slate-300 p-2 font-semibold text-slate-800">{c.status}</td>
                        <td className="border border-slate-300 p-2 text-right font-mono font-bold">Rs {Number(c.total_fee || 0).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Case Status Breakdown */}
          {caseData?.status_distribution && (
            <div>
              <h3 className="font-black text-xs uppercase tracking-widest bg-slate-900 text-white p-2.5 rounded-t-md mb-0">
                2. Caseload Distribution by Legal Status
              </h3>
              <table className="w-full border-collapse border border-slate-300 text-left text-xs">
                <thead>
                  <tr className="bg-slate-100 font-bold border-b-2 border-slate-900">
                    <th className="border border-slate-300 p-2.5">Procedural Status</th>
                    <th className="border border-slate-300 p-2.5 text-right">Case Volume</th>
                    <th className="border border-slate-300 p-2.5 text-right">Proportion (%)</th>
                  </tr>
                </thead>
                <tbody>
                  {caseData.status_distribution.map((item: any, idx: number) => {
                    const pct = totalCases > 0 ? ((item.count / totalCases) * 100).toFixed(1) : '0';
                    return (
                      <tr key={idx} className="even:bg-slate-50">
                        <td className="border border-slate-300 p-2 font-medium">{item.status || 'Unspecified'}</td>
                        <td className="border border-slate-300 p-2 text-right font-bold">{item.count}</td>
                        <td className="border border-slate-300 p-2 text-right font-mono">{pct}%</td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-100 font-bold border-t-2 border-b-2 border-slate-900">
                    <td className="border border-slate-300 p-2.5">Total Active Portfolio</td>
                    <td className="border border-slate-300 p-2.5 text-right">{totalCases}</td>
                    <td className="border border-slate-300 p-2.5 text-right font-mono">100%</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}

        </div>
      )}

      {/* 2. ACCOUNTS & FINANCIAL REPORT */}
      {reportType === 'accounts' && finData && (
        <div className="space-y-8 text-sm">
          
          {/* Summary Financial Matrix */}
          <div>
            <h3 className="font-black text-xs uppercase tracking-widest bg-slate-900 text-white p-2.5 rounded-t-md mb-0 flex items-center justify-between">
              <span>Financial Ledger Summary</span>
              <DollarSign size={14} className="text-emerald-400" />
            </h3>
            <table className="w-full border-collapse border border-slate-300 text-left text-xs">
              <tbody>
                <tr className="even:bg-slate-50">
                  <th className="border border-slate-300 p-3 bg-slate-100 font-bold w-1/3">Total Billed Receivables</th>
                  <td className="border border-slate-300 p-3 font-mono font-bold text-base text-slate-900">
                    Rs {Number(finData.kpis?.total_billed || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                </tr>
                <tr className="even:bg-slate-50">
                  <th className="border border-slate-300 p-3 bg-slate-100 font-bold">Total Collections Received</th>
                  <td className="border border-slate-300 p-3 font-mono font-bold text-base text-emerald-800">
                    Rs {Number(finData.kpis?.total_collected || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                </tr>
                <tr className="even:bg-slate-50">
                  <th className="border border-slate-300 p-3 bg-slate-100 font-bold">Total Pending Receivables</th>
                  <td className="border border-slate-300 p-3 font-mono font-bold text-base text-red-700">
                    Rs {Number(finData.kpis?.total_outstanding || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Detailed Invoices Register */}
          {isDetailed && finData.detailed_invoices && (
            <div>
              <h3 className="font-black text-xs uppercase tracking-widest bg-slate-900 text-white p-2.5 rounded-t-md mb-0">
                Itemized Invoices Register ({finData.detailed_invoices.length} Records)
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-slate-300 text-left text-xs">
                  <thead>
                    <tr className="bg-slate-800 text-white font-bold">
                      <th className="border border-slate-700 p-2 text-center w-8">#</th>
                      <th className="border border-slate-700 p-2">Invoice #</th>
                      <th className="border border-slate-700 p-2">Client Name</th>
                      <th className="border border-slate-700 p-2">Case Number</th>
                      <th className="border border-slate-700 p-2">Issue Date</th>
                      <th className="border border-slate-700 p-2">Due Date</th>
                      <th className="border border-slate-700 p-2 text-right">Billed (Rs)</th>
                      <th className="border border-slate-700 p-2 text-right">Paid (Rs)</th>
                      <th className="border border-slate-700 p-2 text-right">Balance (Rs)</th>
                      <th className="border border-slate-700 p-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {finData.detailed_invoices.map((inv: any, idx: number) => (
                      <tr key={idx} className="even:bg-slate-50 hover:bg-slate-100/80 transition-colors">
                        <td className="border border-slate-300 p-2 text-center font-bold text-slate-600">{idx + 1}</td>
                        <td className="border border-slate-300 p-2 font-bold font-mono text-slate-900">{inv.invoice_number}</td>
                        <td className="border border-slate-300 p-2 font-medium">{inv.client_name}</td>
                        <td className="border border-slate-300 p-2">{inv.case_number}</td>
                        <td className="border border-slate-300 p-2 font-mono">{inv.issue_date}</td>
                        <td className="border border-slate-300 p-2 font-mono">{inv.due_date}</td>
                        <td className="border border-slate-300 p-2 text-right font-mono font-bold">Rs {Number(inv.total_amount || 0).toLocaleString()}</td>
                        <td className="border border-slate-300 p-2 text-right font-mono font-semibold text-emerald-800">Rs {Number(inv.paid_amount || 0).toLocaleString()}</td>
                        <td className="border border-slate-300 p-2 text-right font-mono font-bold text-red-700">Rs {Number(inv.balance || 0).toLocaleString()}</td>
                        <td className="border border-slate-300 p-2 font-semibold text-slate-800">{inv.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Detailed Payments Register */}
          {isDetailed && finData.detailed_payments && (
            <div>
              <h3 className="font-black text-xs uppercase tracking-widest bg-slate-900 text-white p-2.5 rounded-t-md mb-0">
                Itemized Collections Register ({finData.detailed_payments.length} Records)
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-slate-300 text-left text-xs">
                  <thead>
                    <tr className="bg-slate-800 text-white font-bold">
                      <th className="border border-slate-700 p-2 text-center w-8">#</th>
                      <th className="border border-slate-700 p-2">Payment Date</th>
                      <th className="border border-slate-700 p-2">Invoice #</th>
                      <th className="border border-slate-700 p-2">Client Name</th>
                      <th className="border border-slate-700 p-2">Case Number</th>
                      <th className="border border-slate-700 p-2">Payment Method</th>
                      <th className="border border-slate-700 p-2">Reference #</th>
                      <th className="border border-slate-700 p-2 text-right">Amount Received</th>
                    </tr>
                  </thead>
                  <tbody>
                    {finData.detailed_payments.map((p: any, idx: number) => (
                      <tr key={idx} className="even:bg-slate-50 hover:bg-slate-100/80 transition-colors">
                        <td className="border border-slate-300 p-2 text-center font-bold text-slate-600">{idx + 1}</td>
                        <td className="border border-slate-300 p-2 font-mono">{p.payment_date}</td>
                        <td className="border border-slate-300 p-2 font-bold font-mono text-slate-900">{p.invoice__invoice_number}</td>
                        <td className="border border-slate-300 p-2 font-medium">{p.invoice__case__client__name}</td>
                        <td className="border border-slate-300 p-2">{p.invoice__case__case_number}</td>
                        <td className="border border-slate-300 p-2">{p.payment_method}</td>
                        <td className="border border-slate-300 p-2 font-mono text-slate-600">{p.reference_number || '---'}</td>
                        <td className="border border-slate-300 p-2 text-right font-mono font-bold text-emerald-800">
                          Rs {Number(p.amount_received || 0).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div>
            <h3 className="font-black text-xs uppercase tracking-widest bg-slate-900 text-white p-2.5 rounded-t-md mb-0">
              Collections Breakdown by Practice Area
            </h3>
            <table className="w-full border-collapse border border-slate-300 text-left text-xs">
              <thead>
                <tr className="bg-slate-100 font-bold border-b-2 border-slate-900">
                  <th className="border border-slate-300 p-2.5">Practice Area</th>
                  <th className="border border-slate-300 p-2.5 text-right">Revenue Collected (Rs)</th>
                </tr>
              </thead>
              <tbody>
                {(finData.revenue_by_category || []).map((item: any, idx: number) => (
                  <tr key={idx} className="even:bg-slate-50">
                    <td className="border border-slate-300 p-2 font-medium">{item.category || 'General Services'}</td>
                    <td className="border border-slate-300 p-2 text-right font-mono font-bold">
                      Rs {Number(item.revenue || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>
      )}

      {/* 3. CASES / STATUS REPORT */}
      {(reportType === 'cases' || reportType === 'status') && caseData && (
        <div className="space-y-8 text-sm">
          
          {/* Detailed Itemized Cases Register */}
          {isDetailed && caseData.detailed_cases && (
            <div>
              <h3 className="font-black text-xs uppercase tracking-widest bg-slate-900 text-white p-2.5 rounded-t-md mb-0">
                Itemized Litigation Portfolio ({caseData.detailed_cases.length} Active Records)
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-slate-300 text-left text-xs">
                  <thead>
                    <tr className="bg-slate-800 text-white font-bold">
                      <th className="border border-slate-700 p-2 text-center w-8">#</th>
                      <th className="border border-slate-700 p-2">Case No / FIR</th>
                      <th className="border border-slate-700 p-2">Client Name</th>
                      <th className="border border-slate-700 p-2">Opponent</th>
                      <th className="border border-slate-700 p-2">Category</th>
                      <th className="border border-slate-700 p-2">Court Forum</th>
                      <th className="border border-slate-700 p-2">Assigned Advocate</th>
                      <th className="border border-slate-700 p-2">Status</th>
                      <th className="border border-slate-700 p-2 text-right">Agreed Fee</th>
                    </tr>
                  </thead>
                  <tbody>
                    {caseData.detailed_cases.map((c: any, idx: number) => (
                      <tr key={c.id || idx} className="even:bg-slate-50 hover:bg-slate-100/80 transition-colors">
                        <td className="border border-slate-300 p-2 text-center font-bold text-slate-600">{idx + 1}</td>
                        <td className="border border-slate-300 p-2 font-bold font-mono text-slate-900">{c.case_number}</td>
                        <td className="border border-slate-300 p-2 font-medium">{c.client__name}</td>
                        <td className="border border-slate-300 p-2">{c.opponent_name}</td>
                        <td className="border border-slate-300 p-2">{c.category}</td>
                        <td className="border border-slate-300 p-2">{c.court__name}</td>
                        <td className="border border-slate-300 p-2">{c.assigned_advocate}</td>
                        <td className="border border-slate-300 p-2 font-semibold text-slate-800">{c.status}</td>
                        <td className="border border-slate-300 p-2 text-right font-mono font-bold">Rs {Number(c.total_fee || 0).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div>
            <h3 className="font-black text-xs uppercase tracking-widest bg-slate-900 text-white p-2.5 rounded-t-md mb-0">
              Case Status Distribution Summary
            </h3>
            <table className="w-full border-collapse border border-slate-300 text-left text-xs">
              <thead>
                <tr className="bg-slate-100 font-bold border-b-2 border-slate-900">
                  <th className="border border-slate-300 p-2.5">Case Status</th>
                  <th className="border border-slate-300 p-2.5 text-right">Case Volume</th>
                  <th className="border border-slate-300 p-2.5 text-right">Share (%)</th>
                </tr>
              </thead>
              <tbody>
                {(caseData.status_distribution || []).map((item: any, idx: number) => {
                  const pct = totalCases > 0 ? ((item.count / totalCases) * 100).toFixed(1) : '0';
                  return (
                    <tr key={idx} className="even:bg-slate-50">
                      <td className="border border-slate-300 p-2 font-medium">{item.status || 'Unspecified'}</td>
                      <td className="border border-slate-300 p-2 text-right font-bold">{item.count}</td>
                      <td className="border border-slate-300 p-2 text-right font-mono">{pct}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

        </div>
      )}

      {/* 4. HEARINGS / CAUSE LIST REPORT */}
      {reportType === 'hearings' && hearingData && (
        <div className="space-y-8 text-sm">
          
          {/* Detailed Itemized Cause List */}
          {isDetailed && hearingData.detailed_hearings && (
            <div>
              <h3 className="font-black text-xs uppercase tracking-widest bg-slate-900 text-white p-2.5 rounded-t-md mb-0 flex items-center justify-between">
                <span>Official Daily Cause List &amp; Hearing Register ({hearingData.detailed_hearings.length} Listings)</span>
                <Calendar size={14} className="text-amber-400" />
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-slate-300 text-left text-xs">
                  <thead>
                    <tr className="bg-slate-800 text-white font-bold">
                      <th className="border border-slate-700 p-2 text-center w-8">#</th>
                      <th className="border border-slate-700 p-2">Hearing Date</th>
                      <th className="border border-slate-700 p-2">Case Number</th>
                      <th className="border border-slate-700 p-2">Client Name</th>
                      <th className="border border-slate-700 p-2">Court Forum</th>
                      <th className="border border-slate-700 p-2">Hearing Stage</th>
                      <th className="border border-slate-700 p-2">Next Date</th>
                      <th className="border border-slate-700 p-2">Assigned Advocate</th>
                      <th className="border border-slate-700 p-2">Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {hearingData.detailed_hearings.map((h: any, idx: number) => (
                      <tr key={h.id || idx} className="even:bg-slate-50 hover:bg-slate-100/80 transition-colors">
                        <td className="border border-slate-300 p-2 text-center font-bold text-slate-600">{idx + 1}</td>
                        <td className="border border-slate-300 p-2 font-bold font-mono text-slate-900">{h.hearing_date}</td>
                        <td className="border border-slate-300 p-2 font-semibold">{h.case__case_number}</td>
                        <td className="border border-slate-300 p-2 font-medium">{h.case__client__name}</td>
                        <td className="border border-slate-300 p-2">{h.case__court__name}</td>
                        <td className="border border-slate-300 p-2 font-semibold text-slate-800">{h.hearing_stage}</td>
                        <td className="border border-slate-300 p-2 font-mono text-amber-700 font-semibold">{h.next_date || '---'}</td>
                        <td className="border border-slate-300 p-2">{h.assigned_advocate}</td>
                        <td className="border border-slate-300 p-2 truncate max-w-xs text-slate-600">{h.notes || '---'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div>
            <h3 className="font-black text-xs uppercase tracking-widest bg-slate-900 text-white p-2.5 rounded-t-md mb-0">
              Procedural Stage Analysis
            </h3>
            <table className="w-full border-collapse border border-slate-300 text-left text-xs">
              <thead>
                <tr className="bg-slate-100 font-bold border-b-2 border-slate-900">
                  <th className="border border-slate-300 p-2.5">Procedural Stage</th>
                  <th className="border border-slate-300 p-2.5 text-right">Listing Count</th>
                  <th className="border border-slate-300 p-2.5 text-right">Share (%)</th>
                </tr>
              </thead>
              <tbody>
                {(hearingData.hearing_stages || []).map((item: any, idx: number) => {
                  const pct = totalHearings > 0 ? ((item.count / totalHearings) * 100).toFixed(1) : '0';
                  return (
                    <tr key={idx} className="even:bg-slate-50">
                      <td className="border border-slate-300 p-2 font-medium">{item.hearing_stage || 'Unspecified'}</td>
                      <td className="border border-slate-300 p-2 text-right font-bold">{item.count}</td>
                      <td className="border border-slate-300 p-2 text-right font-mono">{pct}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

        </div>
      )}

      {/* 5. PRODUCTIVITY REPORT */}
      {reportType === 'productivity' && prodData && (
        <div className="space-y-8 text-sm">
          
          {/* Detailed Itemized Deadlines Register */}
          {isDetailed && prodData.detailed_deadlines && (
            <div>
              <h3 className="font-black text-xs uppercase tracking-widest bg-slate-900 text-white p-2.5 rounded-t-md mb-0">
                Itemized Staff Deadlines &amp; Task Register ({prodData.detailed_deadlines.length} Records)
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-slate-300 text-left text-xs">
                  <thead>
                    <tr className="bg-slate-800 text-white font-bold">
                      <th className="border border-slate-700 p-2 text-center w-8">#</th>
                      <th className="border border-slate-700 p-2">Task / Deadline Title</th>
                      <th className="border border-slate-700 p-2">Case Number</th>
                      <th className="border border-slate-700 p-2">Assigned Advocate</th>
                      <th className="border border-slate-700 p-2">Priority</th>
                      <th className="border border-slate-700 p-2">Due Date</th>
                      <th className="border border-slate-700 p-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {prodData.detailed_deadlines.map((d: any, idx: number) => (
                      <tr key={d.id || idx} className="even:bg-slate-50 hover:bg-slate-100/80 transition-colors">
                        <td className="border border-slate-300 p-2 text-center font-bold text-slate-600">{idx + 1}</td>
                        <td className="border border-slate-300 p-2 font-bold text-slate-900">{d.title}</td>
                        <td className="border border-slate-300 p-2 font-mono">{d.case__case_number || 'General Chamber'}</td>
                        <td className="border border-slate-300 p-2 font-medium">{d.assigned_advocate}</td>
                        <td className="border border-slate-300 p-2">{d.priority}</td>
                        <td className="border border-slate-300 p-2 font-mono font-semibold">{d.due_date}</td>
                        <td className="border border-slate-300 p-2 font-semibold text-slate-800">{d.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div>
            <h3 className="font-black text-xs uppercase tracking-widest bg-slate-900 text-white p-2.5 rounded-t-md mb-0">
              Advocate Caseload &amp; Task Completion Matrix
            </h3>
            <table className="w-full border-collapse border border-slate-300 text-left text-xs">
              <thead>
                <tr className="bg-slate-100 font-bold border-b-2 border-slate-900">
                  <th className="border border-slate-300 p-2.5">Staff Member Name</th>
                  <th className="border border-slate-300 p-2.5">Role / Designation</th>
                  <th className="border border-slate-300 p-2.5 text-right">Assigned Cases</th>
                  <th className="border border-slate-300 p-2.5 text-right text-emerald-800">Completed Tasks</th>
                  <th className="border border-slate-300 p-2.5 text-right text-amber-800">Pending Deadlines</th>
                </tr>
              </thead>
              <tbody>
                {(prodData.matrix || prodData || []).map((staff: any, idx: number) => (
                  <tr key={idx} className="even:bg-slate-50">
                    <td className="border border-slate-300 p-2.5 font-bold text-slate-900">{staff.name || `User #${staff.id}`}</td>
                    <td className="border border-slate-300 p-2.5 text-slate-700">{staff.role || 'Staff'}</td>
                    <td className="border border-slate-300 p-2.5 text-right font-bold text-slate-900">{staff.cases || 0}</td>
                    <td className="border border-slate-300 p-2.5 text-right font-semibold text-emerald-800">{staff.completed || 0}</td>
                    <td className="border border-slate-300 p-2.5 text-right font-semibold text-amber-800">{staff.pending || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>
      )}

      {/* ── FORMAL DUAL SIGNATURE & APPROVAL BLOCK ── */}
      <div className="mt-16 pt-8 border-t-2 border-slate-900 flex flex-col sm:flex-row justify-between items-end gap-8 text-xs text-slate-700 print:mt-16 print:page-break-inside-avoid">
        
        {/* Prepared By Signature */}
        <div className="w-full sm:w-64 space-y-2">
          <div className="border-b border-slate-400 pb-8 text-slate-400 text-[11px] font-mono text-center">
            [ Registrar / Staff Signature ]
          </div>
          <div className="text-left space-y-0.5">
            <p className="font-bold text-slate-900 uppercase">Prepared By:</p>
            <p className="font-semibold text-slate-800">{generatedBy || 'Chamber Administrator'}</p>
            <p className="text-[11px] text-slate-500 font-mono">Date: {nowStr.split(',')[0]}</p>
          </div>
        </div>

        {/* Chamber Official Stamp Frame */}
        <div className="w-28 h-28 rounded-full border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-center p-2 text-[10px] text-slate-400 uppercase font-mono tracking-tighter shrink-0 print:border-slate-400">
          <UserCheck size={18} className="text-slate-400 mb-0.5" />
          <span>Official Seal</span>
          <span>&amp; Stamp</span>
        </div>

        {/* Verified & Approved By Signature */}
        <div className="w-full sm:w-64 space-y-2">
          <div className="border-b border-slate-900 pb-8 text-slate-400 text-[11px] font-mono text-center">
            [ Senior Partner Signature ]
          </div>
          <div className="text-right space-y-0.5">
            <p className="font-bold text-slate-900 uppercase">Verified &amp; Approved By:</p>
            <p className="font-black text-slate-900">RAHIMULLAH ADVOCATE</p>
            <p className="text-[11px] text-slate-600 font-medium">Managing Partner &amp; Head of Chamber</p>
          </div>
        </div>

      </div>

      {/* Footer Legal Notice */}
      <div className="mt-8 pt-3 border-t border-slate-200 text-center text-[10px] text-slate-500 font-mono flex flex-col sm:flex-row justify-between items-center gap-1">
        <span>RAHIMULLAH ADVOCATES • CONFIDENTIAL CHAMBER DOCUMENT</span>
        <span>VERIFICATION HASH: {refNumber}</span>
      </div>

    </div>
  );
}
