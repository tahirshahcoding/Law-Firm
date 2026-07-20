import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalCount: number;
  limit: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({ currentPage, totalCount, limit, onPageChange }: PaginationProps) {
  const totalPages = Math.ceil(totalCount / limit);

  if (totalPages <= 1) return null;

  const handlePrev = () => {
    if (currentPage > 1) onPageChange(currentPage - 1);
  };

  const handleNext = () => {
    if (currentPage < totalPages) onPageChange(currentPage + 1);
  };

  return (
    <div className="flex items-center justify-between px-4 py-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 sm:px-6">
      <div className="flex justify-between flex-1 sm:hidden">
        <button
          onClick={handlePrev}
          disabled={currentPage === 1}
          className="relative inline-flex items-center px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50"
        >
          Previous
        </button>
        <button
          onClick={handleNext}
          disabled={currentPage === totalPages}
          className="relative inline-flex items-center px-4 py-2 ml-3 text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50"
        >
          Next
        </button>
      </div>
      <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-slate-700 dark:text-slate-300">
            Showing <span className="font-medium">{(currentPage - 1) * limit + 1}</span> to{' '}
            <span className="font-medium">{Math.min(currentPage * limit, totalCount)}</span> of{' '}
            <span className="font-medium">{totalCount}</span> results
          </p>
        </div>
        <div>
          <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
            <button
              onClick={handlePrev}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50"
            >
              <span className="sr-only">Previous</span>
              <ChevronLeft className="h-5 w-5" aria-hidden="true" />
            </button>
            <span className="relative inline-flex items-center px-4 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium text-slate-700 dark:text-slate-200">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={handleNext}
              disabled={currentPage === totalPages}
              className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50"
            >
              <span className="sr-only">Next</span>
              <ChevronRight className="h-5 w-5" aria-hidden="true" />
            </button>
          </nav>
        </div>
      </div>
    </div>
  );
}
