'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { X, Plus, FolderOpen, Users, Calendar, MessageSquare, ListTodo, FileText, Receipt, Banknote, DollarSign, Timer, Landmark, Gavel } from 'lucide-react';

// Core
import AddCaseModal from './AddCaseModal';
import AddClientModal from './AddClientModal';
import AddHearingModal from './AddHearingModal';
import GenerateChallanModal from './GenerateChallanModal';

// Finance
import NewInvoiceModal from './finance/NewInvoiceModal';
import AddExpenseModal from './finance/AddExpenseModal';

// Deadlines & Court
import CreateDeadlineModal from './deadlines/CreateDeadlineModal';
import AddCourtModal from './AddCourtModal';
import AddJudgeModal from './AddJudgeModal';

type ModalType = 
  | 'case' | 'client' | 'hearing' | 'challan' 
  | 'invoice' | 'payment' | 'expense' 
  | 'deadline' | 'court' | 'judge' | null;

export default function QuickAddModal() {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  
  const [activeModal, setActiveModal] = useState<ModalType>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+N or Cmd+N
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        setIsOpen(true);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleOpenSpecificModal = (type: ModalType) => {
    setIsOpen(false);
    setActiveModal(type);
  };

  const handleNavigate = (path: string) => {
    setIsOpen(false);
    router.push(path);
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 md:bottom-8 md:right-8 z-40 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 duration-300 shadow-[0_4px_12px_rgba(37,99,235,0.25)] hover:shadow-[0_6px_16px_rgba(37,99,235,0.35)] hover:-translate-y-0.5 p-4 rounded-full shadow-lg hover:shadow-xl duration-300 group flex items-center justify-center text-white"
        aria-label="Quick Add"
      >
        <Plus size={24} className="group-hover:rotate-90 transition-transform duration-300" />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 sm:p-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setIsOpen(false)}>
          <div 
            className="bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in slide-in-from-bottom-8 sm:zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/50">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Quick Add</h2>
                <p className="text-xs text-slate-500 mt-0.5">Press <kbd className="bg-white border border-slate-200 px-1.5 py-0.5 rounded shadow-sm font-mono font-medium text-slate-600 mx-1">Ctrl+N</kbd> to open anytime</p>
              </div>
              <button onClick={() => setIsOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 max-h-[70vh] overflow-y-auto">
              {/* Category: Core Practice */}
              <div className="mb-6">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 px-1">Core Practice</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <QuickAddButton icon={<FolderOpen size={20} />} label="New Case" color="blue" onClick={() => handleOpenSpecificModal('case')} />
                  <QuickAddButton icon={<Calendar size={20} />} label="Hearing" color="emerald" onClick={() => handleOpenSpecificModal('hearing')} />
                  <QuickAddButton icon={<Users size={20} />} label="New Client" color="indigo" onClick={() => handleOpenSpecificModal('client')} />
                  <QuickAddButton icon={<FileText size={20} />} label="Challan" color="rose" onClick={() => handleOpenSpecificModal('challan')} />
                </div>
              </div>

              {/* Category: Finance & Billing */}
              <div className="mb-6">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 px-1">Finance & Billing</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <QuickAddButton icon={<Receipt size={20} />} label="New Invoice" color="teal" onClick={() => handleOpenSpecificModal('invoice')} />
                  <QuickAddButton icon={<DollarSign size={20} />} label="Receive Payment" color="green" onClick={() => handleNavigate('/revenue')} />
                  <QuickAddButton icon={<Banknote size={20} />} label="Log Expense" color="orange" onClick={() => handleOpenSpecificModal('expense')} />
                </div>
              </div>

              {/* Category: Calendar & Court */}
              <div className="mb-6">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 px-1">Office & Court</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <QuickAddButton icon={<Timer size={20} />} label="Deadline" color="red" onClick={() => handleOpenSpecificModal('deadline')} />
                  <QuickAddButton icon={<Landmark size={20} />} label="Add Court" color="slate" onClick={() => handleOpenSpecificModal('court')} />
                  <QuickAddButton icon={<Gavel size={20} />} label="Add Judge" color="stone" onClick={() => handleOpenSpecificModal('judge')} />
                  <QuickAddButton icon={<ListTodo size={20} />} label="New Task" color="amber" onClick={() => handleNavigate('/diary')} />
                </div>
              </div>

              {/* Consultation Full Width */}
              <button 
                onClick={() => handleNavigate('/consultations')}
                className="w-full flex items-center gap-4 p-4 rounded-xl border border-slate-100 bg-white hover:border-purple-200 hover:bg-purple-50 transition-colors group"
              >
                <div className="w-10 h-10 shrink-0 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <MessageSquare size={18} />
                </div>
                <div className="text-left flex-1">
                  <p className="text-sm font-semibold text-slate-700 group-hover:text-purple-700">Log Consultation</p>
                  <p className="text-xs text-slate-500">Record a new lead or general query</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sub Modals */}
      <AddCaseModal isOpen={activeModal === 'case'} onClose={() => setActiveModal(null)} onSuccess={() => setActiveModal(null)} />
      <AddClientModal isOpen={activeModal === 'client'} onClose={() => setActiveModal(null)} onSuccess={() => setActiveModal(null)} />
      <AddHearingModal isOpen={activeModal === 'hearing'} onClose={() => setActiveModal(null)} onSuccess={() => setActiveModal(null)} />
      <GenerateChallanModal isOpen={activeModal === 'challan'} onClose={() => setActiveModal(null)} onSuccess={() => setActiveModal(null)} />
      
      {activeModal === 'invoice' && <NewInvoiceModal onClose={() => setActiveModal(null)} onSuccess={() => setActiveModal(null)} />}
      {activeModal === 'expense' && <AddExpenseModal onClose={() => setActiveModal(null)} onSuccess={() => setActiveModal(null)} />}
      
      <CreateDeadlineModal isOpen={activeModal === 'deadline'} onClose={() => setActiveModal(null)} onSuccess={() => setActiveModal(null)} />
      <AddCourtModal isOpen={activeModal === 'court'} onClose={() => setActiveModal(null)} onSuccess={() => setActiveModal(null)} />
      <AddJudgeModal isOpen={activeModal === 'judge'} onClose={() => setActiveModal(null)} onSuccess={() => setActiveModal(null)} />
    </>
  );
}

// Helper component for uniform buttons
function QuickAddButton({ icon, label, color, onClick }: { icon: React.ReactNode, label: string, color: string, onClick: () => void }) {
  const colorMap: Record<string, { bg: string, text: string, hoverBorder: string, hoverBg: string, hoverText: string }> = {
    blue: { bg: 'bg-blue-100', text: 'text-blue-600', hoverBorder: 'hover:border-blue-200', hoverBg: 'hover:bg-blue-50', hoverText: 'group-hover:text-blue-700' },
    emerald: { bg: 'bg-emerald-100', text: 'text-emerald-600', hoverBorder: 'hover:border-emerald-200', hoverBg: 'hover:bg-emerald-50', hoverText: 'group-hover:text-emerald-700' },
    indigo: { bg: 'bg-indigo-100', text: 'text-indigo-600', hoverBorder: 'hover:border-indigo-200', hoverBg: 'hover:bg-indigo-50', hoverText: 'group-hover:text-indigo-700' },
    rose: { bg: 'bg-rose-100', text: 'text-rose-600', hoverBorder: 'hover:border-rose-200', hoverBg: 'hover:bg-rose-50', hoverText: 'group-hover:text-rose-700' },
    amber: { bg: 'bg-amber-100', text: 'text-amber-600', hoverBorder: 'hover:border-amber-200', hoverBg: 'hover:bg-amber-50', hoverText: 'group-hover:text-amber-700' },
    teal: { bg: 'bg-teal-100', text: 'text-teal-600', hoverBorder: 'hover:border-teal-200', hoverBg: 'hover:bg-teal-50', hoverText: 'group-hover:text-teal-700' },
    green: { bg: 'bg-green-100', text: 'text-green-600', hoverBorder: 'hover:border-green-200', hoverBg: 'hover:bg-green-50', hoverText: 'group-hover:text-green-700' },
    orange: { bg: 'bg-orange-100', text: 'text-orange-600', hoverBorder: 'hover:border-orange-200', hoverBg: 'hover:bg-orange-50', hoverText: 'group-hover:text-orange-700' },
    red: { bg: 'bg-red-100', text: 'text-red-600', hoverBorder: 'hover:border-red-200', hoverBg: 'hover:bg-red-50', hoverText: 'group-hover:text-red-700' },
    slate: { bg: 'bg-slate-200', text: 'text-slate-600', hoverBorder: 'hover:border-slate-300', hoverBg: 'hover:bg-slate-100', hoverText: 'group-hover:text-slate-800' },
    stone: { bg: 'bg-stone-200', text: 'text-stone-600', hoverBorder: 'hover:border-stone-300', hoverBg: 'hover:bg-stone-100', hoverText: 'group-hover:text-stone-800' },
  };

  const theme = colorMap[color] || colorMap.blue;

  return (
    <button 
      onClick={onClick}
      className={`flex flex-col items-center justify-center gap-3 p-4 sm:p-5 rounded-xl border border-slate-100 bg-white transition-colors group ${theme.hoverBorder} ${theme.hoverBg}`}
    >
      <div className={`w-12 h-12 rounded-full ${theme.bg} ${theme.text} flex items-center justify-center group-hover:scale-110 transition-transform`}>
        {icon}
      </div>
      <span className={`text-sm font-semibold text-slate-700 ${theme.hoverText}`}>{label}</span>
    </button>
  );
}
