'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Check } from 'lucide-react';
import { getStatusColor } from '@/lib/constants';

const STATUS_GROUPS = {
  'Initial': ['Consultation', 'Case Accepted', 'Documentation Pending'],
  'Active Litigation': ['Filing in Progress', 'Filed', 'Under Trial', 'Evidence Stage', 'Arguments Stage', 'Judgment Reserved'],
  'Post-Trial': ['Decided', 'Appeal'],
  'Closed / Resolved': ['Closed - Won', 'Closed - Lost', 'Closed - Settled', 'Closed - Withdrawn', 'Closed - Dismissed'],
  'Other': ['Archived', 'Active', 'Closed']
};

interface StatusDropdownProps {
  value: string;
  onChange: (status: string) => void;
  disabled?: boolean;
}

export default function StatusDropdown({ value, onChange, disabled }: StatusDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const portalRef = useRef<HTMLDivElement>(null);
  const [dropdownStyles, setDropdownStyles] = useState({});

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // We check if the click was inside the button or the dropdown portal
      const target = event.target as Node;
      const isInsideButton = buttonRef.current?.contains(target);
      const isInsideDropdown = portalRef.current?.contains(target);
      
      if (!isInsideButton && !isInsideDropdown) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    
    // Also close on scroll to prevent detached dropdowns, unless scrolling the dropdown itself
    const handleScroll = (event: Event) => {
      if (portalRef.current && portalRef.current.contains(event.target as Node)) {
        return;
      }
      setIsOpen(false);
    };
    window.addEventListener('scroll', handleScroll, true);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, []);

  const toggleDropdown = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      // Position below the button
      setDropdownStyles({
        position: 'fixed',
        top: rect.bottom + 4,
        left: Math.min(rect.left, typeof window !== 'undefined' ? window.innerWidth - 244 : rect.left), // Ensure 240px width fits on mobile
        width: 240, // Slightly wider for groups
        zIndex: 9999
      });
    }
    setIsOpen(!isOpen);
  };

  const portalContent = isOpen && (
    <div 
      ref={portalRef}
      style={dropdownStyles}
      className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 py-2 focus:outline-none overflow-hidden flex flex-col"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
        {Object.entries(STATUS_GROUPS).map(([groupName, statuses]) => (
          <div key={groupName} className="mb-2 last:mb-0">
            <div className="px-4 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50/50 dark:bg-slate-800/50">
              {groupName}
            </div>
            {statuses.map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => {
                  onChange(status);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-4 py-2 text-sm flex items-center justify-between transition-colors ${value === status ? 'text-blue-700 dark:text-blue-400 font-semibold bg-blue-50/50 dark:bg-blue-900/30' : 'text-slate-700 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-slate-700/50'}`}
              >
                {status}
                {value === status && <Check size={14} className="text-blue-600 shrink-0" />}
              </button>
            ))}
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        ref={buttonRef}
        type="button"
        disabled={disabled}
        onClick={toggleDropdown}
        className={`inline-flex items-center justify-between gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 disabled:opacity-50 hover:shadow ${getStatusColor(value)}`}
      >
        <span>{value}</span>
        <div className="border-l pl-2 opacity-60">
          <ChevronDown size={14} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {isOpen && typeof document !== 'undefined' && createPortal(portalContent, document.body)}
    </div>
  );
}
