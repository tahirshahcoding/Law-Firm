'use client';

import React from 'react';

// Using strictly inline styles for ALL colors/borders to prevent html2canvas crashing on Tailwind v4 lab/oklch colors
export default function InvoiceTemplate({ caseData }: { caseData: any }) {
  // caseData here is the challan/invoice object which includes case and amount data
  const currentDate = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const dueDate = new Date(caseData.due_date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const invoiceNumber = caseData.invoice_number || `INV-${new Date().getTime().toString().slice(-4)}`;
  const amount = Number(caseData.amount);
  const amountPaid = Number(caseData.amount_paid || 0);
  const remaining = amount - amountPaid;

  return (
    <div 
      className="p-12 w-full h-full font-sans relative" 
      style={{ backgroundColor: '#ffffff', color: '#1e293b', borderTop: '8px solid #2563eb', minHeight: '1056px' }} 
    >
      {/* Status Watermark */}
      <div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-9xl font-black uppercase tracking-widest opacity-[0.03] rotate-[-30deg] pointer-events-none"
        style={{ color: caseData.status === 'Paid' ? '#10b981' : caseData.status === 'Partial' ? '#f59e0b' : '#ef4444' }}
      >
        {caseData.status}
      </div>

      {/* Header */}
      <div className="flex justify-between items-start mb-12">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-xl" style={{ backgroundColor: '#2563eb', color: '#ffffff' }}>
              EN
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tighter uppercase" style={{ color: '#0f172a' }}>EagleNest</h1>
              <p className="text-xs font-semibold tracking-widest uppercase" style={{ color: '#64748b' }}>Legal Solutions</p>
            </div>
          </div>
          
          <div className="mt-6 text-sm space-y-1" style={{ color: '#475569' }}>
            <p>123 Justice Boulevard, Suite 400</p>
            <p>Metropolis, NY 10001</p>
            <p>contact@eaglenestlegal.com</p>
            <p>+1 (555) 123-4567</p>
          </div>
        </div>
        
        <div className="text-right">
          <h2 className="text-4xl font-black uppercase tracking-widest mb-4" style={{ color: '#2563eb' }}>CHALLAN</h2>
          <div className="space-y-1.5 p-4 rounded-xl" style={{ backgroundColor: '#f8fafc', border: '1px solid #f1f5f9' }}>
            <p className="text-sm flex justify-between gap-8"><span style={{ color: '#64748b' }}>Challan No:</span> <span className="font-bold font-mono text-base">{invoiceNumber}</span></p>
            <p className="text-sm flex justify-between gap-8"><span style={{ color: '#64748b' }}>Issue Date:</span> <span className="font-bold font-mono">{currentDate}</span></p>
            <p className="text-sm flex justify-between gap-8"><span style={{ color: '#64748b' }}>Due Date:</span> <span className="font-bold font-mono" style={{ color: '#ef4444' }}>{dueDate}</span></p>
          </div>
        </div>
      </div>

      <hr className="mb-8 border-0" style={{ borderTop: '1px solid #f1f5f9' }} />

      {/* Bill To & Case Info */}
      <div className="flex justify-between mb-12">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#94a3b8' }}>Billed To</h3>
          <p className="text-xl font-bold" style={{ color: '#0f172a' }}>{caseData.client_name || 'Client Name'}</p>
          <p className="text-sm mt-1" style={{ color: '#475569' }}>{caseData.client_mobile || 'N/A'}</p>
        </div>
        <div className="text-right">
          <h3 className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#94a3b8' }}>Case Reference</h3>
          <p className="text-lg font-bold" style={{ color: '#0f172a' }}>{caseData.case_number}</p>
          <p className="text-sm mt-1 font-medium" style={{ color: '#475569' }}>vs. {caseData.opponent_name}</p>
          <p className="text-sm mt-0.5" style={{ color: '#64748b' }}>{caseData.court || 'Court'}</p>
        </div>
      </div>

      {/* Itemized Table */}
      <div className="rounded-xl overflow-hidden mb-8" style={{ border: '1px solid #e2e8f0' }}>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              <th className="py-4 px-6 text-xs font-bold uppercase tracking-wider" style={{ color: '#64748b' }}>Description</th>
              <th className="py-4 px-6 text-xs font-bold uppercase tracking-wider text-right" style={{ color: '#64748b' }}>Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="py-6 px-6">
                <p className="font-bold text-base" style={{ color: '#0f172a' }}>{caseData.description || 'Professional Legal Services'}</p>
                <p className="text-sm mt-1 max-w-md" style={{ color: '#64748b' }}>Legal representation and advisory services concerning the matter of {caseData.case_number}.</p>
              </td>
              <td className="py-6 px-6 text-right font-mono font-bold text-lg" style={{ color: '#0f172a' }}>
                Rs. {amount.toLocaleString()}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Totals */}
      <div className="flex justify-end mb-16">
        <div className="w-80 p-6 rounded-xl" style={{ border: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }}>
          <div className="space-y-4">
            <div className="flex justify-between text-sm">
              <span className="font-medium uppercase tracking-wider" style={{ color: '#64748b' }}>Subtotal</span>
              <span className="font-mono font-bold">Rs. {amount.toLocaleString()}</span>
            </div>
            
            {amountPaid > 0 && (
              <div className="flex justify-between text-sm">
                <span className="font-medium uppercase tracking-wider" style={{ color: '#64748b' }}>Amount Paid</span>
                <span className="font-mono font-bold" style={{ color: '#10b981' }}>- Rs. {amountPaid.toLocaleString()}</span>
              </div>
            )}
            
            <div className="pt-4" style={{ borderTop: '1px solid #cbd5e1' }}>
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold uppercase tracking-wider" style={{ color: '#0f172a' }}>Total Due</span>
                <span className="text-2xl font-black font-mono" style={{ color: remaining > 0 ? '#ef4444' : '#10b981' }}>
                  Rs. {remaining.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bank Details Footer (pushed to bottom) */}
      <div className="absolute bottom-12 left-12 right-12">
        <hr className="mb-6 border-0" style={{ borderTop: '1px solid #f1f5f9' }} />
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest mb-3 flex items-center gap-2" style={{ color: '#94a3b8' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2" ry="2"></rect><line x1="2" y1="10" x2="22" y2="10"></line></svg>
              Payment Instructions
            </h3>
            <div className="grid grid-cols-2 gap-x-12 gap-y-1.5 text-sm" style={{ color: '#475569' }}>
              <p><span className="font-medium mr-2" style={{ color: '#94a3b8' }}>Bank Name:</span> <strong style={{ color: '#0f172a' }}>EagleNest Bank</strong></p>
              <p><span className="font-medium mr-2" style={{ color: '#94a3b8' }}>Account No:</span> <strong className="font-mono" style={{ color: '#0f172a' }}>1029384756</strong></p>
              <p><span className="font-medium mr-2" style={{ color: '#94a3b8' }}>Account Name:</span> <strong style={{ color: '#0f172a' }}>EagleNest Legal Solutions</strong></p>
              <p><span className="font-medium mr-2" style={{ color: '#94a3b8' }}>IBAN:</span> <strong className="font-mono" style={{ color: '#0f172a' }}>PK99 EGN 1029 3847 56</strong></p>
            </div>
          </div>
          
          <div className="text-right text-xs" style={{ color: '#94a3b8' }}>
            <p className="max-w-xs">Generated electronically on {currentDate}. This is a computer generated document and requires no signature.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
