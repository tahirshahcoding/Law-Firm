'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { Search, Gavel, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function DailyCauseListPage() {
  const [search, setSearch] = useState('');
  
  // Nginx routes /api/public/hearings directly to the Django backend
  const { data, error, isLoading } = useSWR(`/api/public/hearings/?search=${encodeURIComponent(search)}`, fetcher);
  
  const hearings = Array.isArray(data) ? data : (data?.results || []);

  const todayStr = new Date().toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* ─── Header ─────────────────────────────── */}
      <header className="bg-white border-b border-slate-200 shadow-sm py-4">
        <div className="max-w-5xl mx-auto px-4 flex items-center justify-between">
          <Link href="/home" className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors">
            <ArrowLeft size={18} />
            <span className="font-semibold text-sm">Back to Home</span>
          </Link>
          <div className="flex items-center gap-2">
            <div className="relative w-8 h-8 rounded-lg overflow-hidden flex-shrink-0 border border-slate-200">
              <Image src="/logo.png" alt="Logo" fill className="object-cover scale-[1.15]" sizes="32px" />
            </div>
            <span className="font-bold text-lg tracking-tight text-slate-900 hidden sm:block">Rahimullah <span className="text-blue-700">Advocate</span></span>
          </div>
        </div>
      </header>

      {/* ─── Content ────────────────────────────── */}
      <main className="max-w-5xl mx-auto px-4 py-8 md:py-12">
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2 flex items-center justify-center gap-3">
            <Gavel className="text-blue-600" size={32} /> Daily Cause List
          </h1>
          <p className="text-slate-500 font-medium text-lg">{todayStr}</p>
        </div>

        {/* Search */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 mb-8">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-slate-400" />
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by Client, Opponent, Case Number, or Court..."
              className="block w-full pl-12 pr-4 py-3 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-slate-50"
            />
          </div>
        </div>

        {/* List */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          {isLoading ? (
            <div className="p-12 text-center text-slate-500">
              <div className="w-8 h-8 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
              Loading today's hearings...
            </div>
          ) : error ? (
            <div className="p-12 text-center text-red-500">
              Failed to load cause list. Please try again later.
            </div>
          ) : hearings.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              <Gavel className="w-12 h-12 mx-auto text-slate-300 mb-4" />
              <p className="text-lg font-medium text-slate-900">No Hearings Found</p>
              <p className="text-sm">There are no hearings scheduled for today matching your search.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 font-bold">
                    <th className="px-6 py-4">S.No</th>
                    <th className="px-6 py-4">Case Title</th>
                    <th className="px-6 py-4">Court / Judge</th>
                    <th className="px-6 py-4">Proceedings</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {hearings.map((h: any, i: number) => (
                    <tr key={h.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium text-slate-500">{i + 1}</td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-900">{h.case_title}</div>
                        <div className="text-xs text-slate-500 mt-1">Time: {h.time ? h.time.substring(0, 5) : 'TBD'}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-semibold text-slate-800">{h.court_name}</div>
                        <div className="text-xs text-slate-500">{h.judge}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100">
                          {h.status || 'Hearing'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
