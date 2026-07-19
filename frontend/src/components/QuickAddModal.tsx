'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { X, Plus, FolderOpen, Users, Calendar, MessageSquare, ListTodo, FileText } from 'lucide-react';
import AddCaseModal from './AddCaseModal';
import AddClientModal from './AddClientModal';
import AddHearingModal from './AddHearingModal';
import GenerateChallanModal from './GenerateChallanModal';

export default function QuickAddModal() {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  
  // Modals state
  const [activeModal, setActiveModal] = useState<'case' | 'client' | 'hearing' | 'challan' | null>(null);

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

  const handleOpenSpecificModal = (type: 'case' | 'client' | 'hearing' | 'challan') => {
    setIsOpen(false);
    setActiveModal(type);
  };

  const handleNavigateToDiary = () => {
    setIsOpen(false);
    router.push('/diary');
  };

  const handleNavigateToConsultations = () => {
    setIsOpen(false);
    router.push('/consultations');
  };

  return (
    <>
      {/* Floating Action Button */}
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 md:bottom-8 md:right-8 z-40 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 duration-300 shadow-[0_4px_12px_rgba(37,99,235,0.25)] hover:shadow-[0_6px_16px_rgba(37,99,235,0.35)] hover:-translate-y-0.5 p-4 rounded-full shadow-lg hover:shadow-xl duration-300 group flex items-center justify-center text-white"
        aria-label="Quick Add"
      >
        <Plus size={24} className="group-hover:rotate-90 transition-transform duration-300" />
      </button>

      {/* Main Menu Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 sm:p-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setIsOpen(false)}>
          <div 
            className="bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in slide-in-from-bottom-8 sm:zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">Quick Add</h2>
              <button onClick={() => setIsOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="p-4 grid grid-cols-2 gap-3">
              <button 
                onClick={() => handleOpenSpecificModal('case')}
                className="flex flex-col items-center justify-center gap-3 p-5 rounded-xl border border-slate-100 bg-white hover:border-blue-200 hover:bg-blue-50 transition-colors group"
              >
                <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <FolderOpen size={20} />
                </div>
                <span className="text-sm font-semibold text-slate-700 group-hover:text-blue-700">New Case</span>
              </button>
              
              <button 
                onClick={() => handleOpenSpecificModal('hearing')}
                className="flex flex-col items-center justify-center gap-3 p-5 rounded-xl border border-slate-100 bg-white hover:border-emerald-200 hover:bg-emerald-50 transition-colors group"
              >
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Calendar size={20} />
                </div>
                <span className="text-sm font-semibold text-slate-700 group-hover:text-emerald-700">Hearing</span>
              </button>

              <button 
                onClick={() => handleOpenSpecificModal('client')}
                className="flex flex-col items-center justify-center gap-3 p-5 rounded-xl border border-slate-100 bg-white hover:border-indigo-200 hover:bg-indigo-50 transition-colors group"
              >
                <div className="w-12 h-12 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Users size={20} />
                </div>
                <span className="text-sm font-semibold text-slate-700 group-hover:text-indigo-700">New Client</span>
              </button>

              <button 
                onClick={handleNavigateToDiary}
                className="flex flex-col items-center justify-center gap-3 p-5 rounded-xl border border-slate-100 bg-white hover:border-amber-200 hover:bg-amber-50 transition-colors group"
              >
                <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <ListTodo size={20} />
                </div>
                <span className="text-sm font-semibold text-slate-700 group-hover:text-amber-700">New Task</span>
              </button>

              <button 
                onClick={() => handleOpenSpecificModal('challan')}
                className="flex flex-col items-center justify-center gap-3 p-5 rounded-xl border border-slate-100 bg-white hover:border-rose-200 hover:bg-rose-50 transition-colors group"
              >
                <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <FileText size={20} />
                </div>
                <span className="text-sm font-semibold text-slate-700 group-hover:text-rose-700">Challan</span>
              </button>

              <button 
                onClick={handleNavigateToConsultations}
                className="col-span-2 flex items-center gap-4 p-4 rounded-xl border border-slate-100 bg-white hover:border-purple-200 hover:bg-purple-50 transition-colors group"
              >
                <div className="w-10 h-10 shrink-0 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <MessageSquare size={18} />
                </div>
                <div className="text-left flex-1">
                  <p className="text-sm font-semibold text-slate-700 group-hover:text-purple-700">Log Consultation</p>
                  <p className="text-xs text-slate-500">Record a new lead or query</p>
                </div>
              </button>
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-100 text-center">
              <p className="text-xs text-slate-400">Pro tip: Press <kbd className="bg-white border border-slate-200 px-1.5 py-0.5 rounded shadow-sm font-mono font-medium text-slate-600 mx-1">Ctrl+N</kbd> to open this menu instantly.</p>
            </div>
          </div>
        </div>
      )}

      {/* Sub Modals */}
      <AddCaseModal 
        isOpen={activeModal === 'case'} 
        onClose={() => setActiveModal(null)} 
        onSuccess={() => setActiveModal(null)} 
      />
      <AddClientModal 
        isOpen={activeModal === 'client'} 
        onClose={() => setActiveModal(null)} 
        onSuccess={() => setActiveModal(null)} 
      />
      <AddHearingModal 
        isOpen={activeModal === 'hearing'} 
        onClose={() => setActiveModal(null)} 
        onSuccess={() => setActiveModal(null)} 
      />
      <GenerateChallanModal 
        isOpen={activeModal === 'challan'} 
        onClose={() => setActiveModal(null)} 
        onSuccess={() => setActiveModal(null)} 
      />
    </>
  );
}
