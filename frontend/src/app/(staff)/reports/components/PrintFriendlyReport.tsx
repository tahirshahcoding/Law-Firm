import React, { useEffect } from 'react';
import { useReportData } from '../hooks/useReportData';

interface PrintReportProps {
  reportType: string;
  filters: Record<string, any>;
  reportTitle: string;
  filtersSummary?: string;
}

export function PrintFriendlyReport({ reportType, filters, reportTitle, filtersSummary }: PrintReportProps) {
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

  if (loading) return <div className="p-8 text-center text-slate-500 font-medium">Loading report data...</div>;

  const displaySummary = filtersSummary || Object.entries(filters)
    .filter(([_, val]) => val !== '' && val !== null && val !== undefined)
    .map(([key, val]) => `${key.replace('_', ' ').toUpperCase()}: ${val}`)
    .join(' | ') || 'ALL RECORDS (No filters applied)';

  const totalCases = caseData?.total_cases || 0;
  const totalHearings = hearingData?.total_hearings || 0;
  const isDetailed = filters.scope === 'detailed';

  return (
    <div className="bg-white text-black p-6 sm:p-10 border border-slate-300 shadow-sm rounded-lg print:border-none print:shadow-none print:p-0 w-full font-sans">
      
      {/* Formal Document Header */}
      <div className="text-center border-b-2 border-black pb-6 mb-6">
        <h1 className="text-xl sm:text-2xl font-black tracking-wider uppercase text-black">
          RAHIMULLAH ADVOCATES
        </h1>
        <p className="text-xs sm:text-sm font-bold text-slate-700 uppercase tracking-widest mt-0.5">
          Law Chamber Swat | Office Management System
        </p>
        <h2 className="text-lg sm:text-xl font-bold underline underline-offset-4 mt-4 uppercase text-black">
          {reportTitle} {isDetailed ? '(ITEMIZED REGISTER)' : '(SUMMARY OVERVIEW)'}
        </h2>
        
        <div className="mt-4 flex flex-col sm:flex-row justify-between text-xs text-slate-600 border-t border-slate-200 pt-2">
          <span><strong>Generated On:</strong> {new Date().toLocaleString()}</span>
          <span><strong>Selection Criteria:</strong> {displaySummary}</span>
        </div>
      </div>

      {/* REPORT CONTENT */}

      {/* 1. MASTER REPORT */}
      {reportType === 'master' && (
        <div className="space-y-8 text-sm">
          {/* Executive Summary Table */}
          <div>
            <h3 className="font-bold text-base uppercase bg-slate-100 p-2 border border-black mb-2 text-black">
              1. Executive Summary &amp; KPIs
            </h3>
            <table className="w-full border-collapse border border-black text-left">
              <tbody>
                <tr>
                  <th className="border border-black p-2 bg-slate-50 w-1/4 font-bold">Total Litigation Caseload</th>
                  <td className="border border-black p-2 font-bold text-lg">{totalCases.toLocaleString()}</td>
                  <th className="border border-black p-2 bg-slate-50 w-1/4 font-bold">Active Hearing Schedules</th>
                  <td className="border border-black p-2 font-bold text-lg">{totalHearings.toLocaleString()}</td>
                </tr>
                {finData?.kpis && (
                  <tr>
                    <th className="border border-black p-2 bg-slate-50 font-bold">Total Billed Revenue</th>
                    <td className="border border-black p-2">Rs {Number(finData.kpis.total_billed || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <th className="border border-black p-2 bg-slate-50 font-bold">Total Revenue Collected</th>
                    <td className="border border-black p-2 font-bold text-emerald-800">Rs {Number(finData.kpis.total_collected || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                  </tr>
                )}
                {finData?.kpis && (
                  <tr>
                    <th className="border border-black p-2 bg-slate-50 font-bold">Outstanding Receivables</th>
                    <td className="border border-black p-2 font-bold text-red-800" colSpan={3}>
                      Rs {Number(finData.kpis.total_outstanding || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Detailed Itemized Cases Register (when scope == detailed) */}
          {isDetailed && caseData?.detailed_cases && (
            <div>
              <h3 className="font-bold text-base uppercase bg-slate-100 p-2 border border-black mb-2 text-black">
                Itemized Case Register ({caseData.detailed_cases.length} Records)
              </h3>
              <table className="w-full border-collapse border border-black text-left text-xs">
                <thead>
                  <tr className="bg-slate-200 font-bold">
                    <th className="border border-black p-1.5 text-center w-8">#</th>
                    <th className="border border-black p-1.5">Case No / FIR</th>
                    <th className="border border-black p-1.5">Client Name</th>
                    <th className="border border-black p-1.5">Opponent</th>
                    <th className="border border-black p-1.5">Category</th>
                    <th className="border border-black p-1.5">Court Forum</th>
                    <th className="border border-black p-1.5">Advocate</th>
                    <th className="border border-black p-1.5">Status</th>
                    <th className="border border-black p-1.5 text-right">Agreed Fee</th>
                  </tr>
                </thead>
                <tbody>
                  {caseData.detailed_cases.map((c: any, idx: number) => (
                    <tr key={c.id || idx}>
                      <td className="border border-black p-1.5 text-center font-bold">{idx + 1}</td>
                      <td className="border border-black p-1.5 font-bold">{c.case_number}</td>
                      <td className="border border-black p-1.5">{c.client__name}</td>
                      <td className="border border-black p-1.5">{c.opponent_name}</td>
                      <td className="border border-black p-1.5">{c.category}</td>
                      <td className="border border-black p-1.5">{c.court__name}</td>
                      <td className="border border-black p-1.5">{c.assigned_advocate}</td>
                      <td className="border border-black p-1.5 font-semibold">{c.status}</td>
                      <td className="border border-black p-1.5 text-right font-mono">Rs {Number(c.total_fee || 0).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Case Status Breakdown */}
          {caseData?.status_distribution && (
            <div>
              <h3 className="font-bold text-base uppercase bg-slate-100 p-2 border border-black mb-2 text-black">
                2. Caseload by Status
              </h3>
              <table className="w-full border-collapse border border-black text-left">
                <thead>
                  <tr className="bg-slate-200 font-bold">
                    <th className="border border-black p-2">Case Status</th>
                    <th className="border border-black p-2 text-right">Number of Cases</th>
                    <th className="border border-black p-2 text-right">Share of Total (%)</th>
                  </tr>
                </thead>
                <tbody>
                  {caseData.status_distribution.map((item: any, idx: number) => {
                    const pct = totalCases > 0 ? ((item.count / totalCases) * 100).toFixed(1) : '0';
                    return (
                      <tr key={idx}>
                        <td className="border border-black p-2 font-medium">{item.status || 'Unspecified'}</td>
                        <td className="border border-black p-2 text-right font-bold">{item.count}</td>
                        <td className="border border-black p-2 text-right">{pct}%</td>
                      </tr>
                    );
                  })}
                  {caseData.status_distribution.length === 0 && (
                    <tr><td colSpan={3} className="p-4 text-center text-slate-500">No records found.</td></tr>
                  )}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-100 font-bold">
                    <td className="border border-black p-2">Total Cases</td>
                    <td className="border border-black p-2 text-right">{totalCases}</td>
                    <td className="border border-black p-2 text-right">100%</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 2. ACCOUNTS & FINANCIAL REPORT */}
      {reportType === 'accounts' && finData && (
        <div className="space-y-6 text-sm">
          <div>
            <h3 className="font-bold text-base uppercase bg-slate-100 p-2 border border-black mb-2 text-black">
              Financial Summary Ledger
            </h3>
            <table className="w-full border-collapse border border-black text-left">
              <tbody>
                <tr>
                  <th className="border border-black p-3 bg-slate-50 w-1/3 font-bold">Total Invoiced Amount</th>
                  <td className="border border-black p-3 font-bold text-lg">
                    Rs {Number(finData.kpis?.total_billed || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                </tr>
                <tr>
                  <th className="border border-black p-3 bg-slate-50 font-bold">Total Collections Received</th>
                  <td className="border border-black p-3 font-bold text-lg text-emerald-800">
                    Rs {Number(finData.kpis?.total_collected || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                </tr>
                <tr>
                  <th className="border border-black p-3 bg-slate-50 font-bold">Total Outstanding Receivables</th>
                  <td className="border border-black p-3 font-bold text-lg text-red-800">
                    Rs {Number(finData.kpis?.total_outstanding || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Detailed Invoices Register */}
          {isDetailed && finData.detailed_invoices && (
            <div>
              <h3 className="font-bold text-base uppercase bg-slate-100 p-2 border border-black mb-2 text-black">
                Itemized Invoices Register ({finData.detailed_invoices.length} Records)
              </h3>
              <table className="w-full border-collapse border border-black text-left text-xs">
                <thead>
                  <tr className="bg-slate-200 font-bold">
                    <th className="border border-black p-1.5 text-center w-8">#</th>
                    <th className="border border-black p-1.5">Invoice #</th>
                    <th className="border border-black p-1.5">Client Name</th>
                    <th className="border border-black p-1.5">Case Number</th>
                    <th className="border border-black p-1.5">Issue Date</th>
                    <th className="border border-black p-1.5">Due Date</th>
                    <th className="border border-black p-1.5 text-right">Billed (Rs)</th>
                    <th className="border border-black p-1.5 text-right">Paid (Rs)</th>
                    <th className="border border-black p-1.5 text-right">Balance (Rs)</th>
                    <th className="border border-black p-1.5">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {finData.detailed_invoices.map((inv: any, idx: number) => (
                    <tr key={idx}>
                      <td className="border border-black p-1.5 text-center font-bold">{idx + 1}</td>
                      <td className="border border-black p-1.5 font-bold">{inv.invoice_number}</td>
                      <td className="border border-black p-1.5">{inv.client_name}</td>
                      <td className="border border-black p-1.5">{inv.case_number}</td>
                      <td className="border border-black p-1.5">{inv.issue_date}</td>
                      <td className="border border-black p-1.5">{inv.due_date}</td>
                      <td className="border border-black p-1.5 text-right font-mono">Rs {Number(inv.total_amount || 0).toLocaleString()}</td>
                      <td className="border border-black p-1.5 text-right font-mono text-emerald-800">Rs {Number(inv.paid_amount || 0).toLocaleString()}</td>
                      <td className="border border-black p-1.5 text-right font-mono text-red-800">Rs {Number(inv.balance || 0).toLocaleString()}</td>
                      <td className="border border-black p-1.5 font-semibold">{inv.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Detailed Payments Register */}
          {isDetailed && finData.detailed_payments && (
            <div>
              <h3 className="font-bold text-base uppercase bg-slate-100 p-2 border border-black mb-2 text-black">
                Itemized Payments Collection Register ({finData.detailed_payments.length} Records)
              </h3>
              <table className="w-full border-collapse border border-black text-left text-xs">
                <thead>
                  <tr className="bg-slate-200 font-bold">
                    <th className="border border-black p-1.5 text-center w-8">#</th>
                    <th className="border border-black p-1.5">Payment Date</th>
                    <th className="border border-black p-1.5">Invoice #</th>
                    <th className="border border-black p-1.5">Client Name</th>
                    <th className="border border-black p-1.5">Case Number</th>
                    <th className="border border-black p-1.5">Method</th>
                    <th className="border border-black p-1.5">Reference #</th>
                    <th className="border border-black p-1.5 text-right">Amount Received (Rs)</th>
                  </tr>
                </thead>
                <tbody>
                  {finData.detailed_payments.map((p: any, idx: number) => (
                    <tr key={idx}>
                      <td className="border border-black p-1.5 text-center font-bold">{idx + 1}</td>
                      <td className="border border-black p-1.5">{p.payment_date}</td>
                      <td className="border border-black p-1.5 font-bold">{p.invoice__invoice_number}</td>
                      <td className="border border-black p-1.5">{p.invoice__case__client__name}</td>
                      <td className="border border-black p-1.5">{p.invoice__case__case_number}</td>
                      <td className="border border-black p-1.5">{p.payment_method}</td>
                      <td className="border border-black p-1.5 font-mono">{p.reference_number || '---'}</td>
                      <td className="border border-black p-1.5 text-right font-bold text-emerald-800">
                        Rs {Number(p.amount_received || 0).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div>
            <h3 className="font-bold text-base uppercase bg-slate-100 p-2 border border-black mb-2 text-black">
              Collections Breakdown by Practice Area
            </h3>
            <table className="w-full border-collapse border border-black text-left">
              <thead>
                <tr className="bg-slate-200 font-bold">
                  <th className="border border-black p-2">Practice Area</th>
                  <th className="border border-black p-2 text-right">Revenue Collected (Rs)</th>
                </tr>
              </thead>
              <tbody>
                {(finData.revenue_by_category || []).map((item: any, idx: number) => (
                  <tr key={idx}>
                    <td className="border border-black p-2 font-medium">{item.category || 'General Services'}</td>
                    <td className="border border-black p-2 text-right font-bold">
                      Rs {Number(item.revenue || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. CASES REPORT / CASE STATUS REPORT */}
      {(reportType === 'cases' || reportType === 'status') && caseData && (
        <div className="space-y-6 text-sm">
          {/* Detailed Itemized Cases Register */}
          {isDetailed && caseData.detailed_cases && (
            <div>
              <h3 className="font-bold text-base uppercase bg-slate-100 p-2 border border-black mb-2 text-black">
                Itemized Case Register ({caseData.detailed_cases.length} Records)
              </h3>
              <table className="w-full border-collapse border border-black text-left text-xs">
                <thead>
                  <tr className="bg-slate-200 font-bold">
                    <th className="border border-black p-1.5 text-center w-8">#</th>
                    <th className="border border-black p-1.5">Case No / FIR</th>
                    <th className="border border-black p-1.5">Client Name</th>
                    <th className="border border-black p-1.5">Opponent</th>
                    <th className="border border-black p-1.5">Category</th>
                    <th className="border border-black p-1.5">Court Forum</th>
                    <th className="border border-black p-1.5">Advocate</th>
                    <th className="border border-black p-1.5">Status</th>
                    <th className="border border-black p-1.5 text-right">Agreed Fee</th>
                  </tr>
                </thead>
                <tbody>
                  {caseData.detailed_cases.map((c: any, idx: number) => (
                    <tr key={c.id || idx}>
                      <td className="border border-black p-1.5 text-center font-bold">{idx + 1}</td>
                      <td className="border border-black p-1.5 font-bold">{c.case_number}</td>
                      <td className="border border-black p-1.5">{c.client__name}</td>
                      <td className="border border-black p-1.5">{c.opponent_name}</td>
                      <td className="border border-black p-1.5">{c.category}</td>
                      <td className="border border-black p-1.5">{c.court__name}</td>
                      <td className="border border-black p-1.5">{c.assigned_advocate}</td>
                      <td className="border border-black p-1.5 font-semibold">{c.status}</td>
                      <td className="border border-black p-1.5 text-right font-mono">Rs {Number(c.total_fee || 0).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div>
            <h3 className="font-bold text-base uppercase bg-slate-100 p-2 border border-black mb-2 text-black">
              Case Status Distribution Table
            </h3>
            <table className="w-full border-collapse border border-black text-left">
              <thead>
                <tr className="bg-slate-200 font-bold">
                  <th className="border border-black p-2">Case Status</th>
                  <th className="border border-black p-2 text-right">Case Count</th>
                  <th className="border border-black p-2 text-right">Share (%)</th>
                </tr>
              </thead>
              <tbody>
                {(caseData.status_distribution || []).map((item: any, idx: number) => {
                  const pct = totalCases > 0 ? ((item.count / totalCases) * 100).toFixed(1) : '0';
                  return (
                    <tr key={idx}>
                      <td className="border border-black p-2 font-medium">{item.status || 'Unspecified'}</td>
                      <td className="border border-black p-2 text-right font-bold">{item.count}</td>
                      <td className="border border-black p-2 text-right">{pct}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. HEARINGS REPORT */}
      {reportType === 'hearings' && hearingData && (
        <div className="space-y-6 text-sm">
          {/* Detailed Itemized Hearings Register */}
          {isDetailed && hearingData.detailed_hearings && (
            <div>
              <h3 className="font-bold text-base uppercase bg-slate-100 p-2 border border-black mb-2 text-black">
                Itemized Cause List &amp; Hearing Register ({hearingData.detailed_hearings.length} Records)
              </h3>
              <table className="w-full border-collapse border border-black text-left text-xs">
                <thead>
                  <tr className="bg-slate-200 font-bold">
                    <th className="border border-black p-1.5 text-center w-8">#</th>
                    <th className="border border-black p-1.5">Hearing Date</th>
                    <th className="border border-black p-1.5">Case Number</th>
                    <th className="border border-black p-1.5">Client Name</th>
                    <th className="border border-black p-1.5">Court Forum</th>
                    <th className="border border-black p-1.5">Hearing Stage</th>
                    <th className="border border-black p-1.5">Next Date</th>
                    <th className="border border-black p-1.5">Advocate</th>
                    <th className="border border-black p-1.5">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {hearingData.detailed_hearings.map((h: any, idx: number) => (
                    <tr key={h.id || idx}>
                      <td className="border border-black p-1.5 text-center font-bold">{idx + 1}</td>
                      <td className="border border-black p-1.5 font-bold">{h.hearing_date}</td>
                      <td className="border border-black p-1.5">{h.case__case_number}</td>
                      <td className="border border-black p-1.5">{h.case__client__name}</td>
                      <td className="border border-black p-1.5">{h.case__court__name}</td>
                      <td className="border border-black p-1.5 font-semibold">{h.hearing_stage}</td>
                      <td className="border border-black p-1.5">{h.next_date || '---'}</td>
                      <td className="border border-black p-1.5">{h.assigned_advocate}</td>
                      <td className="border border-black p-1.5 truncate max-w-xs">{h.notes || '---'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div>
            <h3 className="font-bold text-base uppercase bg-slate-100 p-2 border border-black mb-2 text-black">
              Procedural Hearing Stage Analysis
            </h3>
            <table className="w-full border-collapse border border-black text-left">
              <thead>
                <tr className="bg-slate-200 font-bold">
                  <th className="border border-black p-2">Hearing Stage</th>
                  <th className="border border-black p-2 text-right">Number of Hearings</th>
                  <th className="border border-black p-2 text-right">Share of Total (%)</th>
                </tr>
              </thead>
              <tbody>
                {(hearingData.hearing_stages || []).map((item: any, idx: number) => {
                  const pct = totalHearings > 0 ? ((item.count / totalHearings) * 100).toFixed(1) : '0';
                  return (
                    <tr key={idx}>
                      <td className="border border-black p-2 font-medium">{item.hearing_stage || 'Unspecified'}</td>
                      <td className="border border-black p-2 text-right font-bold">{item.count}</td>
                      <td className="border border-black p-2 text-right">{pct}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. STAFF PRODUCTIVITY REPORT */}
      {reportType === 'productivity' && prodData && (
        <div className="space-y-6 text-sm">
          {/* Detailed Itemized Deadlines Register */}
          {isDetailed && prodData.detailed_deadlines && (
            <div>
              <h3 className="font-bold text-base uppercase bg-slate-100 p-2 border border-black mb-2 text-black">
                Itemized Staff Deadlines &amp; Task Register ({prodData.detailed_deadlines.length} Records)
              </h3>
              <table className="w-full border-collapse border border-black text-left text-xs">
                <thead>
                  <tr className="bg-slate-200 font-bold">
                    <th className="border border-black p-1.5 text-center w-8">#</th>
                    <th className="border border-black p-1.5">Task / Deadline Title</th>
                    <th className="border border-black p-1.5">Case Number</th>
                    <th className="border border-black p-1.5">Assigned Advocate</th>
                    <th className="border border-black p-1.5">Priority</th>
                    <th className="border border-black p-1.5">Due Date</th>
                    <th className="border border-black p-1.5">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {prodData.detailed_deadlines.map((d: any, idx: number) => (
                    <tr key={d.id || idx}>
                      <td className="border border-black p-1.5 text-center font-bold">{idx + 1}</td>
                      <td className="border border-black p-1.5 font-bold">{d.title}</td>
                      <td className="border border-black p-1.5">{d.case__case_number || 'General'}</td>
                      <td className="border border-black p-1.5">{d.assigned_advocate}</td>
                      <td className="border border-black p-1.5">{d.priority}</td>
                      <td className="border border-black p-1.5 font-mono">{d.due_date}</td>
                      <td className="border border-black p-1.5 font-semibold">{d.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div>
            <h3 className="font-bold text-base uppercase bg-slate-100 p-2 border border-black mb-2 text-black">
              Advocate Caseload &amp; Task Completion Matrix
            </h3>
            <table className="w-full border-collapse border border-black text-left">
              <thead>
                <tr className="bg-slate-200 font-bold">
                  <th className="border border-black p-2">Staff Member Name</th>
                  <th className="border border-black p-2">Role / Designation</th>
                  <th className="border border-black p-2 text-right">Assigned Cases</th>
                  <th className="border border-black p-2 text-right text-emerald-800">Completed Tasks</th>
                  <th className="border border-black p-2 text-right text-amber-800">Pending Deadlines</th>
                </tr>
              </thead>
              <tbody>
                {(prodData.matrix || prodData || []).map((staff: any, idx: number) => (
                  <tr key={idx}>
                    <td className="border border-black p-2 font-bold">{staff.name || `User #${staff.id}`}</td>
                    <td className="border border-black p-2">{staff.role || 'Staff'}</td>
                    <td className="border border-black p-2 text-right font-bold">{staff.cases || 0}</td>
                    <td className="border border-black p-2 text-right font-semibold text-emerald-800">{staff.completed || 0}</td>
                    <td className="border border-black p-2 text-right font-semibold text-amber-800">{staff.pending || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Formal Document Footer */}
      <div className="mt-12 pt-6 border-t border-black flex justify-between items-end text-xs text-slate-600 print:mt-16">
        <div>
          <p className="font-bold text-black">RAHIMULLAH ADVOCATES - LEGAL SYSTEMS</p>
          <p>Confidential • For Internal Legal Firm Use Only</p>
        </div>
        <div className="text-right">
          <div className="w-48 border-b border-black mb-1 pb-6"></div>
          <p className="font-bold text-black">Authorized Signatory / Managing Partner</p>
        </div>
      </div>

    </div>
  );
}
