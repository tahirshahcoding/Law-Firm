'use client';

import React, { useState } from 'react';
import { Plus, Briefcase, Users, Calendar, Receipt } from 'lucide-react';

interface FloatingActionButtonProps {
  onAction?: (action: 'case' | 'client' | 'hearing' | 'invoice') => void;
}

export function FloatingActionButton({ onAction }: FloatingActionButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  const actions = [
    { name: 'New Case', id: 'case' as const, icon: Briefcase, color: 'text-blue-600' },
    { name: 'New Client', id: 'client' as const, icon: Users, color: 'text-indigo-600' },
    { name: 'New Hearing', id: 'hearing' as const, icon: Calendar, color: 'text-rose-600' },
    { name: 'New Invoice', id: 'invoice' as const, icon: Receipt, color: 'text-emerald-600' },
  ];

  return (
    <div className="fixed bottom-8 right-8 z-50 flex flex-col items-end">
      {/* Expandable Menu */}
      <div 
        className={`flex flex-col gap-3 mb-4 transition-all duration-300 origin-bottom ${
          isOpen ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-90 translate-y-8 pointer-events-none'
        }`}
      >
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 p-2 flex flex-col gap-1 w-48 border dark:border-slate-800">
          {actions.map((action, idx) => (
            <button 
              key={idx} 
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors w-full text-left"
              onClick={() => {
                setIsOpen(false);
                if (onAction) onAction(action.id);
              }}
            >
              <action.icon size={16} className={action.color} />
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{action.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-[0_8px_20px_-4px_rgba(37,99,235,0.4)] hover:bg-blue-700 hover:shadow-[0_12px_24px_-6px_rgba(37,99,235,0.5)] hover:-translate-y-1 transition-all duration-300 z-10 ${isOpen ? 'rotate-45' : ''}`}
      >
        <Plus size={28} strokeWidth={2.5} />
      </button>
    </div>
  );
}
