'use client';

import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import React from 'react';

interface PaginationProps {
  currentPage: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

export default function Pagination({
  currentPage,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
}: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  
  const handlePrev = () => {
    if (currentPage > 1) onPageChange(currentPage - 1);
  };
  
  const handleNext = () => {
    if (currentPage < totalPages) onPageChange(currentPage + 1);
  };

  const renderPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = startPage + maxVisiblePages - 1;
    
    if (endPage > totalPages) {
      endPage = totalPages;
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => onPageChange(i)}
          className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-medium transition-all ${
            currentPage === i 
              ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/20' 
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          {i}
        </button>
      );
    }
    return pages;
  };

  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-3 px-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 transition-colors">
      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 text-sm text-slate-500 dark:text-slate-400 w-full sm:w-auto">
        <span className="whitespace-nowrap">
          Showing <span className="font-semibold text-slate-700 dark:text-slate-300">{startItem}</span> to <span className="font-semibold text-slate-700 dark:text-slate-300">{endItem}</span> of <span className="font-semibold text-slate-700 dark:text-slate-300">{totalItems}</span>
        </span>
        <div className="h-4 w-px bg-slate-300 dark:bg-slate-700 hidden sm:block"></div>
        <div className="flex items-center gap-2">
          <span>Rows:</span>
          <select 
            value={pageSize} 
            onChange={(e) => {
              onPageSizeChange(Number(e.target.value));
              onPageChange(1); // Reset to page 1 on size change
            }}
            className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-sm py-1 pl-2 pr-6 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:text-white transition-all cursor-pointer appearance-none"
            style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.25rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.25rem 1.25rem' }}
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>
      </div>
      
      <div className="flex items-center justify-center gap-1 w-full sm:w-auto">
        <button 
          onClick={() => onPageChange(1)} 
          disabled={currentPage === 1}
          className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="First Page"
        >
          <ChevronsLeft size={18} />
        </button>
        <button 
          onClick={handlePrev} 
          disabled={currentPage === 1}
          className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="Previous Page"
        >
          <ChevronLeft size={18} />
        </button>
        
        <div className="flex items-center mx-1">
          {renderPageNumbers()}
        </div>
        
        <button 
          onClick={handleNext} 
          disabled={currentPage === totalPages || totalPages === 0}
          className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="Next Page"
        >
          <ChevronRight size={18} />
        </button>
        <button 
          onClick={() => onPageChange(totalPages)} 
          disabled={currentPage === totalPages || totalPages === 0}
          className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="Last Page"
        >
          <ChevronsRight size={18} />
        </button>
      </div>
    </div>
  );
}
