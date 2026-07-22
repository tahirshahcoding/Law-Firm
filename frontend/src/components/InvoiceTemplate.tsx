'use client';

import React from 'react';

const COLORS = {
  slate900: '#0f172a',
  slate800: '#1e293b',
  slate700: '#334155',
  slate600: '#475569',
  slate500: '#64748b',
  slate400: '#94a3b8',
  slate300: '#cbd5e1',
  slate200: '#e2e8f0',
  slate100: '#f1f5f9',
  slate50: '#f8fafc',
  blue600: '#2563eb',
  blue50: '#eff6ff',
  emerald700: '#047857',
  emerald50: '#ecfdf5',
  rose700: '#be123c',
  rose600: '#e11d48',
  rose50: '#fff1f2',
  amber700: '#b45309',
  amber50: '#fef3c7',
  white: '#ffffff',
  black: '#000000',
};

// Single Challan Copy sub-component using STRICTLY hex values for color and background properties
function ChallanCopy({ 
  copyType, 
  caseData, 
  currentDate, 
  dueDate, 
  invoiceNumber, 
  amount, 
  amountPaid, 
  remaining 
}: { 
  copyType: string;
  caseData: any;
  currentDate: string;
  dueDate: string;
  invoiceNumber: string;
  amount: number;
  amountPaid: number;
  remaining: number;
}) {
  const isPaid = caseData.status === 'Paid';
  const isPartial = caseData.status === 'Partial';

  const statusBg = isPaid ? COLORS.emerald50 : isPartial ? COLORS.amber50 : COLORS.rose50;
  const statusBorder = isPaid ? COLORS.emerald700 : isPartial ? COLORS.amber700 : COLORS.rose600;
  const statusColor = isPaid ? COLORS.emerald700 : isPartial ? COLORS.amber700 : COLORS.rose700;

  return (
    <div 
      className="flex flex-col justify-between h-[285px] border rounded-xl p-4 bg-white relative font-sans" 
      style={{ boxSizing: 'border-box', borderColor: COLORS.slate300, backgroundColor: COLORS.white, color: COLORS.slate800 }}
    >
      {/* Status Watermark in Background */}
      <div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-5xl font-black uppercase tracking-widest opacity-[0.04] rotate-[-20deg] pointer-events-none"
        style={{ color: statusColor }}
      >
        {caseData.status}
      </div>

      {/* Top row */}
      <div className="flex justify-between items-center relative z-10">
        {/* Firm Logo & Title */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg overflow-hidden relative border border-slate-200 dark:border-slate-700 shadow-sm shrink-0">
            <img src="/logo.png" alt="Logo" className="w-full h-full object-cover scale-[1.15]" />
          </div>
          <div>
            <h1 className="text-sm font-extrabold tracking-tight uppercase leading-none" style={{ color: COLORS.slate900 }}>Rahimullah Advocate</h1>
            <p className="text-[9px] font-semibold tracking-wider uppercase mt-0.5" style={{ color: COLORS.slate500 }}>Advocate High Court</p>
            <p className="text-[7px] font-medium tracking-wide mt-1" style={{ color: COLORS.slate500 }}>
              Hassan Trade Center Kabal, Swat | Ph: 0345-9309670
            </p>
          </div>
        </div>

        {/* Copy Label & Status Badges */}
        <div className="flex items-center gap-2">
          <div 
            className="border px-3 py-1 rounded-md text-[10px] font-extrabold uppercase tracking-widest"
            style={{ backgroundColor: COLORS.slate100, borderColor: COLORS.slate200, color: COLORS.slate800 }}
          >
            {copyType}
          </div>
          <span 
            className="px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider border"
            style={{ backgroundColor: statusBg, borderColor: statusBorder, color: statusColor }}
          >
            {caseData.status}
          </span>
        </div>

        {/* Barcode and Challan Info */}
        <div className="text-right">
          <div className="flex gap-0.5 items-center justify-end h-5 mb-1" title={invoiceNumber}>
            {[2, 1, 3, 1, 2, 4, 1, 2, 3, 1, 2, 1, 4, 2, 1, 3].map((w, idx) => (
              <div key={idx} className="h-full" style={{ width: `${w}px`, backgroundColor: COLORS.black }} />
            ))}
          </div>
          <p className="text-[10px] font-mono font-bold" style={{ color: COLORS.slate700 }}>Challan No: {invoiceNumber}</p>
        </div>
      </div>

      {/* Grid: Client vs Case Info */}
      <div 
        className="grid grid-cols-2 gap-4 border-y py-2 my-1 text-xs relative z-10"
        style={{ borderColor: COLORS.slate100 }}
      >
        <div>
          <h3 className="text-[9px] font-bold uppercase tracking-wider mb-0.5" style={{ color: COLORS.slate400 }}>Depositor Details</h3>
          <p className="font-bold" style={{ color: COLORS.slate900 }}>{caseData.client_name}</p>
          <p className="text-[10px] mt-0.5" style={{ color: COLORS.slate500 }}>
            ID: <span className="font-semibold" style={{ color: COLORS.blue600 }}>{caseData.client_number || 'N/A'}</span> | Mob: {caseData.client_mobile || 'N/A'}
          </p>
        </div>
        <div className="text-right">
          <h3 className="text-[9px] font-bold uppercase tracking-wider mb-0.5" style={{ color: COLORS.slate400 }}>Case Reference</h3>
          <p className="font-semibold truncate max-w-[200px] ml-auto" style={{ color: COLORS.slate900 }} title={caseData.case_number}>
            {caseData.case_number}
          </p>
          <p className="text-[10px] truncate mt-0.5" style={{ color: COLORS.slate500 }} title={caseData.court}>
            Court: {caseData.court || 'N/A'}
          </p>
        </div>
      </div>

      {/* Grid: Description and breakdown */}
      <div className="grid grid-cols-12 gap-2 text-xs relative z-10">
        <div className="col-span-7">
          <h4 className="text-[9px] font-bold uppercase tracking-wider mb-0.5" style={{ color: COLORS.slate400 }}>Particulars</h4>
          <p className="font-semibold leading-tight" style={{ color: COLORS.slate800 }}>{caseData.description || 'Professional Legal Services'}</p>
          <p className="text-[10px] mt-1 max-w-[420px] leading-tight" style={{ color: COLORS.slate500 }}>
            Legal counsel and representation fees regarding the matter of {caseData.client_name || 'Client'} vs. {caseData.opponent_name || 'Opponent'}.
          </p>
        </div>
        <div 
          className="col-span-5 text-right flex flex-col justify-end space-y-0.5 pl-4 border-l"
          style={{ borderColor: COLORS.slate100 }}
        >
          <div className="flex justify-between text-[10px]" style={{ color: COLORS.slate500 }}>
            <span>Subtotal:</span>
            <span className="font-mono font-semibold">Rs. {amount.toLocaleString()}</span>
          </div>
          {amountPaid > 0 && (
            <div className="flex justify-between text-[10px]" style={{ color: COLORS.emerald700 }}>
              <span>Paid:</span>
              <span className="font-mono font-semibold">- Rs. {amountPaid.toLocaleString()}</span>
            </div>
          )}
          <div 
            className="flex justify-between font-bold pt-1 mt-0.5 border-t"
            style={{ color: COLORS.slate900, borderColor: COLORS.slate100 }}
          >
            <span className="text-[10px] uppercase">Net Payable:</span>
            <span className="font-mono text-sm" style={{ color: COLORS.rose600 }}>Rs. {remaining.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Footer bank info & signatures */}
      <div 
        className="flex justify-between items-end pt-1.5 text-[9px] border-t relative z-10"
        style={{ color: COLORS.slate500, borderColor: COLORS.slate100 }}
      >
        <div>
          <span className="font-bold block uppercase tracking-wider text-[8px] mb-0.5" style={{ color: COLORS.slate600 }}>Bank Details & Due Date</span>
          <p className="leading-tight">Deposit at <strong style={{ color: COLORS.slate800 }}>ALLIED BANK LIMITED</strong> | Title: <strong style={{ color: COLORS.slate800 }}>RAHIM ULLAH</strong> | Account No: <strong className="font-mono" style={{ color: COLORS.slate800 }}>09800010033550130015</strong></p>
          <p className="leading-tight">IBAN: <strong className="font-mono" style={{ color: COLORS.slate800 }}>PK32ABPA0010033550130015</strong> | Easypaisa: <strong className="font-mono" style={{ color: COLORS.slate800 }}>03420813399</strong> | Due Date: <strong className="font-bold" style={{ color: COLORS.rose600 }}>{dueDate}</strong></p>
        </div>

        <div className="flex gap-6 items-end">
          <div className="text-center w-24">
            <div className="h-10 border-b" style={{ borderColor: COLORS.slate200 }}></div>
            <p className="mt-1 uppercase text-[7px] font-bold" style={{ color: COLORS.slate400 }}>Depositor Signature</p>
          </div>
          <div className="text-center w-24">
            <div className="h-10 border-b" style={{ borderColor: COLORS.slate200 }}></div>
            <p className="mt-1 uppercase text-[7px] font-bold" style={{ color: COLORS.slate400 }}>Authorized Stamp</p>
          </div>
        </div>
      </div>

      {/* Developer Watermark */}
      <div 
        className="absolute bottom-1.5 right-4 text-[6.5px] font-mono select-none"
        style={{ color: COLORS.slate400, opacity: 0.8 }}
      >
        Software provided by EagleNest Creations (03464451505)
      </div>
    </div>
  );
}

export default function InvoiceTemplate({ caseData }: { caseData: any }) {
  const currentDate = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const dueDate = new Date(caseData.due_date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const invoiceNumber = caseData.invoice_number || `INV-${new Date().getTime().toString().slice(-4)}`;
  const amount = Number(caseData.amount);
  const amountPaid = Number(caseData.amount_paid || 0);
  const remaining = amount - amountPaid;

  const copies = [
    { type: 'BANK COPY' },
    { type: 'OFFICE COPY' },
    { type: 'CLIENT COPY' }
  ];

  return (
    <div 
      className="p-4 w-full flex flex-col justify-between h-[100vh] print:h-[100vh]" 
      style={{ boxSizing: 'border-box', backgroundColor: COLORS.white, overflow: 'hidden' }}
    >
      {copies.map((copy, index) => (
        <React.Fragment key={copy.type}>
          <ChallanCopy 
            copyType={copy.type}
            caseData={caseData}
            currentDate={currentDate}
            dueDate={dueDate}
            invoiceNumber={invoiceNumber}
            amount={amount}
            amountPaid={amountPaid}
            remaining={remaining}
          />
          {index < copies.length - 1 && (
            <div className="relative my-2.5 flex items-center justify-center shrink-0">
              <div className="w-full border-t border-dashed" style={{ borderColor: COLORS.slate300 }}></div>
              <span 
                className="absolute px-3 text-[9px] font-bold uppercase tracking-widest flex items-center gap-1 font-mono"
                style={{ backgroundColor: COLORS.white, color: COLORS.slate400 }}
              >
                ✂ Cut here to separate copies
              </span>
            </div>
          )}
        </React.Fragment>
      ))}
    </div>
  );
}
