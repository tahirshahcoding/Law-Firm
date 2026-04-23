'use client';

import React from 'react';

// Using inline styles for colors to prevent html2canvas crashing on Tailwind v4 lab/oklch colors
export default function InvoiceTemplate({ caseData }: { caseData: any }) {
  const currentDate = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const invoiceNumber = `INV-${caseData.case_number.replace(/\D/g, '')}-${new Date().getTime().toString().slice(-4)}`;

  return (
    <div 
      className="p-12 w-full h-full font-sans border-t-8" 
      style={{ backgroundColor: '#ffffff', color: '#1e293b', borderTopColor: '#2563eb' }}
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-12">
        <div>
          <h1 className="text-4xl font-black tracking-tighter mb-1 uppercase" style={{ color: '#0f172a' }}>EagleNest</h1>
          <p className="text-sm font-semibold tracking-widest uppercase" style={{ color: '#64748b' }}>Legal Associates</p>
          
          <div className="mt-6 text-sm space-y-1" style={{ color: '#475569' }}>
            <p>123 Justice Boulevard, Suite 400</p>
            <p>Metropolis, NY 10001</p>
            <p>contact@eaglenestlegal.com</p>
            <p>+1 (555) 123-4567</p>
          </div>
        </div>
        
        <div className="text-right">
          <h2 className="text-3xl font-light uppercase tracking-widest mb-4" style={{ color: '#cbd5e1' }}>Invoice</h2>
          <div className="space-y-1">
            <p className="text-sm"><span style={{ color: '#94a3b8', marginRight: '8px' }}>Invoice No:</span> <span className="font-bold">{invoiceNumber}</span></p>
            <p className="text-sm"><span style={{ color: '#94a3b8', marginRight: '8px' }}>Issue Date:</span> <span className="font-bold">{currentDate}</span></p>
            <p className="text-sm"><span style={{ color: '#94a3b8', marginRight: '8px' }}>Due Date:</span> <span className="font-bold">Upon Receipt</span></p>
          </div>
        </div>
      </div>

      <hr className="mb-8" style={{ borderColor: '#f1f5f9' }} />

      {/* Bill To */}
      <div className="mb-12">
        <h3 className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#94a3b8' }}>Billed To</h3>
        <p className="text-lg font-bold" style={{ color: '#0f172a' }}>{caseData.client_name || 'Client Name'}</p>
        <p className="text-sm mt-1" style={{ color: '#475569' }}>Case Ref: {caseData.case_number}</p>
        <p className="text-sm" style={{ color: '#475569' }}>Re: {caseData.client_name} vs. {caseData.opponent_name}</p>
      </div>

      {/* Itemized Table */}
      <table className="w-full mb-8 text-left border-collapse">
        <thead>
          <tr className="border-b-2" style={{ borderBottomColor: '#0f172a' }}>
            <th className="py-3 px-2 text-sm font-bold uppercase tracking-wider" style={{ color: '#0f172a' }}>Description of Legal Services</th>
            <th className="py-3 px-2 text-sm font-bold uppercase tracking-wider text-right" style={{ color: '#0f172a' }}>Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-b" style={{ borderBottomColor: '#f1f5f9' }}>
            <td className="py-4 px-2">
              <p className="font-semibold">Professional Fees</p>
              <p className="text-xs mt-1 max-w-sm" style={{ color: '#64748b' }}>Legal representation and advisory services concerning the matter of {caseData.case_number}.</p>
            </td>
            <td className="py-4 px-2 text-right font-mono font-medium">Rs. {Number(caseData.total_fee).toLocaleString()}</td>
          </tr>
        </tbody>
      </table>

      {/* Totals */}
      <div className="flex justify-end mb-16">
        <div className="w-64 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="font-medium" style={{ color: '#64748b' }}>Subtotal</span>
            <span className="font-mono">Rs. {Number(caseData.total_fee).toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="font-medium" style={{ color: '#64748b' }}>Tax (0%)</span>
            <span className="font-mono">Rs. 0.00</span>
          </div>
          <div className="flex justify-between pt-3 border-t-2" style={{ borderTopColor: '#0f172a' }}>
            <span className="text-lg font-bold uppercase" style={{ color: '#0f172a' }}>Total Due</span>
            <span className="text-lg font-bold font-mono" style={{ color: '#2563eb' }}>Rs. {Number(caseData.total_fee).toLocaleString()}</span>
          </div>
        </div>
      </div>

      <hr className="mb-8" style={{ borderColor: '#f1f5f9' }} />

      {/* Payment Details */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: '#94a3b8' }}>Payment Instructions</h3>
        <div className="rounded-lg p-5 border" style={{ backgroundColor: '#f8fafc', borderColor: '#f1f5f9' }}>
          <p className="text-sm mb-3" style={{ color: '#334155' }}>Please make all wire transfers to the following bank account:</p>
          <div className="grid grid-cols-2 gap-y-2 text-sm">
            <p><span className="font-medium mr-2" style={{ color: '#94a3b8' }}>Bank Name:</span> <strong>EagleNest Bank</strong></p>
            <p><span className="font-medium mr-2" style={{ color: '#94a3b8' }}>Account Name:</span> <strong>EagleNest Legal Associates</strong></p>
            <p><span className="font-medium mr-2" style={{ color: '#94a3b8' }}>Account No:</span> <strong className="font-mono">1029384756</strong></p>
            <p><span className="font-medium mr-2" style={{ color: '#94a3b8' }}>IBAN:</span> <strong className="font-mono">PK99 EGN 1029 3847 56</strong></p>
            <p><span className="font-medium mr-2" style={{ color: '#94a3b8' }}>Branch:</span> <strong>Metropolis Central (001)</strong></p>
          </div>
        </div>
      </div>

      <div className="mt-16 text-center text-xs" style={{ color: '#94a3b8' }}>
        <p>Thank you for trusting EagleNest Legal Associates with your matters.</p>
        <p className="mt-1">Generated electronically on {currentDate}. No signature required.</p>
      </div>
    </div>
  );
}
