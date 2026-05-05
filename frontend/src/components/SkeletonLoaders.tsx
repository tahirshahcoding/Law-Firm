import React from 'react';

export function TableSkeleton() {
  return (
    <div className="w-full animate-pulse bg-white rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] border border-slate-100 overflow-hidden">
      {/* Toolbar Skeleton */}
      <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <div className="h-10 bg-slate-200 rounded-lg w-full max-w-md"></div>
        <div className="h-5 bg-slate-200 rounded w-20 hidden sm:block"></div>
      </div>
      
      {/* Desktop Table View Skeleton */}
      <div className="hidden md:block">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-100 bg-white">
              <th className="px-6 py-4"><div className="h-4 bg-slate-100 rounded w-24"></div></th>
              <th className="px-6 py-4"><div className="h-4 bg-slate-100 rounded w-32"></div></th>
              <th className="px-6 py-4"><div className="h-4 bg-slate-100 rounded w-20"></div></th>
              <th className="px-6 py-4 text-right"><div className="h-4 bg-slate-100 rounded w-16 ml-auto"></div></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {[1, 2, 3, 4, 5].map((i) => (
              <tr key={i}>
                <td className="px-6 py-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 shrink-0 rounded-xl bg-slate-200"></div>
                    <div className="flex flex-col gap-2 flex-1">
                      <div className="h-5 bg-slate-200 rounded w-32"></div>
                      <div className="h-3 bg-slate-100 rounded w-24"></div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col gap-2">
                    <div className="h-4 bg-slate-200 rounded w-40"></div>
                    <div className="h-3 bg-slate-100 rounded w-28"></div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="h-6 bg-slate-200 rounded-full w-20"></div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex justify-end gap-2">
                    <div className="w-8 h-8 rounded-lg bg-slate-100"></div>
                    <div className="w-8 h-8 rounded-lg bg-slate-100"></div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View Skeleton */}
      <div className="md:hidden divide-y divide-slate-100">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 shrink-0 rounded-xl bg-slate-200"></div>
              <div className="flex-1 space-y-2">
                <div className="h-5 bg-slate-200 rounded w-3/4"></div>
                <div className="h-3 bg-slate-100 rounded w-1/2"></div>
                <div className="h-3 bg-slate-100 rounded w-2/3"></div>
                <div className="h-5 bg-slate-200 rounded-full w-20 mt-2"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function StatsCardSkeleton() {
  return (
    <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] border border-slate-100 animate-pulse">
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <div className="h-4 bg-slate-200 rounded w-24"></div>
        <div className="w-8 h-8 sm:w-9 sm:h-9 bg-slate-100 rounded-lg"></div>
      </div>
      <div className="h-8 sm:h-10 bg-slate-200 rounded w-16 mt-2 mb-3 sm:mb-4"></div>
      <div className="h-4 bg-slate-100 rounded w-20"></div>
    </div>
  );
}

export function WidgetSkeleton() {
  return (
    <div className="bg-white rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] border border-slate-100 p-5 sm:p-6 animate-pulse">
      <div className="flex justify-between items-center mb-6">
        <div className="h-6 bg-slate-200 rounded w-40"></div>
        <div className="h-8 bg-slate-100 rounded-xl w-24"></div>
      </div>
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="p-4 rounded-xl border border-slate-100 bg-slate-50 flex items-start gap-4">
            <div className="w-5 h-5 rounded border-2 border-slate-200 shrink-0 mt-0.5"></div>
            <div className="flex-1 space-y-2">
              <div className="h-5 bg-slate-200 rounded w-3/4"></div>
              <div className="h-4 bg-slate-100 rounded w-1/4"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function AppShellSkeleton() {
  return (
    <div className="flex h-screen overflow-hidden w-full bg-slate-50">
      {/* Sidebar Skeleton (Desktop only) */}
      <div className="hidden md:flex w-64 bg-slate-900 flex-col animate-pulse">
        <div className="h-16 border-b border-slate-800 flex items-center px-6">
          <div className="w-8 h-8 bg-slate-700 rounded-lg"></div>
          <div className="ml-3 h-5 bg-slate-700 rounded w-32"></div>
        </div>
        <div className="p-4 space-y-2 mt-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-11 bg-slate-800 rounded-lg w-full"></div>
          ))}
        </div>
      </div>
      
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header Skeleton */}
        <div className="h-16 bg-white border-b border-slate-200 flex items-center px-4 md:px-8 z-10 animate-pulse">
          <div className="md:hidden w-8 h-8 bg-slate-200 rounded shrink-0"></div>
          <div className="hidden md:block h-5 bg-slate-200 rounded w-48"></div>
          <div className="ml-auto w-8 h-8 bg-slate-200 rounded-full shrink-0"></div>
        </div>
        
        {/* Main Content Skeleton Area */}
        <div className="p-4 sm:p-6 lg:p-8 w-full max-w-[1600px] mx-auto animate-pulse flex-1">
          <div className="h-8 bg-slate-200 rounded w-48 mb-6"></div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
            <StatsCardSkeleton />
            <StatsCardSkeleton />
            <StatsCardSkeleton />
            <StatsCardSkeleton />
          </div>
          <div className="h-64 bg-slate-100 rounded-2xl w-full"></div>
        </div>
      </div>
    </div>
  );
}

export function ListSkeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-5 flex items-center gap-4">
            <div className="w-11 h-11 shrink-0 rounded-full bg-slate-200"></div>
            <div className="min-w-0 flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <div className="h-5 bg-slate-200 rounded w-32"></div>
                <div className="h-4 bg-slate-100 rounded-full w-20"></div>
              </div>
              <div className="flex items-center gap-4 mt-1">
                <div className="h-3 bg-slate-100 rounded w-24"></div>
                <div className="h-3 bg-slate-100 rounded w-32 hidden sm:block"></div>
              </div>
            </div>
            <div className="w-5 h-5 bg-slate-200 rounded shrink-0"></div>
          </div>
        </div>
      ))}
    </div>
  );
}
