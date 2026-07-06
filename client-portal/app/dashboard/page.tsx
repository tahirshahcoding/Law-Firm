'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Scale, 
  Briefcase, 
  Calendar, 
  LogOut, 
  Clock, 
  AlertCircle, 
  Building2, 
  User2, 
  CheckCircle2 
} from 'lucide-react';
import Image from 'next/image';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

export default function DashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // Normalizing API base URL in local code to prevent trailing slash issues
    let rawApi = API;
    if (rawApi.endsWith('/')) rawApi = rawApi.slice(0, -1);
    if (!rawApi.endsWith('/api')) rawApi += '/api';

    fetch(`${rawApi}/portal/data/`, {
      credentials: 'include',
    })
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then(d => { setData(d); setLoading(false); })
      .catch(() => { router.replace('/'); });
  }, [router]);

  const handleLogout = async () => {
    try {
      let rawApi = API;
      if (rawApi.endsWith('/')) rawApi = rawApi.slice(0, -1);
      if (!rawApi.endsWith('/api')) rawApi += '/api';
      await fetch(`${rawApi}/auth/logout/`, { method: 'POST', credentials: 'include' });
    } catch { /* ignore network errors — redirect anyway */ }
    router.push('/');
  };

  const fmt = (d: string) => {
    if (!d) return '';
    try {
      const date = new Date(d);
      if (isNaN(date.getTime())) {
        const [y, m, day] = d.split('-');
        return `${day}/${m}/${y}`;
      }
      return date.toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      const [y, m, day] = d.split('-');
      return `${day}/${m}/${y}`;
    }
  };

  const getRelativeDays = (dateStr: string) => {
    const todayStr = new Date().toISOString().split('T')[0];
    if (dateStr === todayStr) return 'Today';
    
    try {
      const diffTime = new Date(dateStr).getTime() - new Date(todayStr).getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) return 'Tomorrow';
      if (diffDays > 1) return `In ${diffDays} days`;
      if (diffDays === -1) return 'Yesterday';
      if (diffDays < -1) return `${Math.abs(diffDays)} days ago`;
      return '';
    } catch {
      return '';
    }
  };

  const statusStyle = (s: string) => {
    if (s === 'Active') return 'bg-emerald-50 text-emerald-700 border-emerald-200/60 ring-2 ring-emerald-500/5';
    if (s === 'Closed') return 'bg-slate-100 text-slate-500 border-slate-200/60';
    return 'bg-amber-50 text-amber-700 border-amber-200/60 ring-2 ring-amber-500/5';
  };

  if (loading) {
    return <PortalSkeleton />;
  }

  const today = new Date().toISOString().split('T')[0];
  const upcoming = (data?.hearings ?? [])
    .filter((h: any) => h.hearing_date >= today)
    .sort((a: any, b: any) => a.hearing_date.localeCompare(b.hearing_date));
  const past = (data?.hearings ?? [])
    .filter((h: any) => h.hearing_date < today)
    .sort((a: any, b: any) => b.hearing_date.localeCompare(a.hearing_date));

  return (
    <div className="min-h-screen bg-slate-50/50 relative overflow-hidden flex flex-col font-sans">
      {/* Background Mesh Gradients */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute -top-[10%] -right-[10%] w-[50%] h-[50%] rounded-full bg-gradient-to-br from-blue-100/30 to-indigo-100/20 blur-3xl opacity-70"></div>
        <div className="absolute top-[40%] -left-[10%] w-[45%] h-[45%] rounded-full bg-gradient-to-tr from-sky-100/30 to-blue-50/20 blur-3xl opacity-50"></div>
      </div>

      {/* Sticky Frosted Header */}
      <header className="bg-white/80 backdrop-blur-md px-6 py-4 flex items-center justify-between sticky top-0 z-50 border-b border-slate-100 shadow-[0_2px_8px_-3px_rgba(0,0,0,0.02)]">
        <div className="flex items-center gap-3">
          <div className="relative w-9 h-9 rounded-xl overflow-hidden flex-shrink-0 border border-slate-200 shadow-sm">
            <Image src="/logo.png" alt="EagleNest Logo" fill className="object-cover scale-[1.15]" sizes="36px" />
          </div>
          <div>
            <p className="text-slate-800 font-bold text-sm leading-none">EagleNest Legal Solutions</p>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-0.5 font-semibold">Client Portal</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-slate-800 text-sm font-semibold">{data?.client?.name}</p>
            <p className="text-slate-400 text-xs font-mono">{data?.client?.client_number}</p>
          </div>
          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-md shadow-blue-500/10">
            {data?.client?.name?.[0]?.toUpperCase() ?? 'C'}
          </div>
          <button
            onClick={handleLogout}
            className="group flex items-center gap-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100/80 px-3 py-2 rounded-xl transition-all duration-200 text-xs font-medium"
          >
            <LogOut size={15} className="group-hover:translate-x-0.5 transition-transform" /> <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </header>

      {/* Content Main */}
      <main className="max-w-2xl mx-auto px-4 py-8 space-y-8 relative z-10 w-full flex-1">
        {/* Welcome Banner Card (Dark contrast visual anchor) */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-950 to-blue-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-slate-800">
          <div className="absolute -right-10 -bottom-10 w-44 h-44 bg-white/[0.02] rounded-full blur-xl pointer-events-none"></div>
          <div className="absolute right-12 top-4 w-28 h-28 bg-blue-500/[0.04] rounded-full blur-lg pointer-events-none"></div>
          
          <div className="relative z-10">
             <p className="text-blue-400 text-xs font-extrabold uppercase tracking-widest mb-1.5">Welcome back</p>
             <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">{data?.client?.name}</h2>
             <p className="text-slate-400 text-xs sm:text-sm mt-1">Below is the current status of your active cases and scheduled hearings.</p>
             
             <div className="grid grid-cols-2 gap-4 mt-6 max-w-sm">
               <div className="bg-white/[0.04] backdrop-blur-sm border border-white/[0.06] rounded-2xl px-5 py-4 transition-all hover:bg-white/[0.08] hover:border-white/[0.1]">
                 <p className="text-3xl font-extrabold text-white tracking-tight">{data?.cases?.length ?? 0}</p>
                 <p className="text-xs text-slate-400 mt-1 font-medium">Active Matters</p>
               </div>
               <div className="bg-white/[0.04] backdrop-blur-sm border border-white/[0.06] rounded-2xl px-5 py-4 transition-all hover:bg-white/[0.08] hover:border-white/[0.1]">
                 <p className="text-3xl font-extrabold text-white tracking-tight">{upcoming.length}</p>
                 <p className="text-xs text-slate-400 mt-1 font-medium">Upcoming Hearings</p>
               </div>
             </div>
          </div>
        </div>

        {/* Cases Section */}
        <section className="space-y-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <Briefcase size={14} className="text-blue-600" /> My Cases
          </h3>
          {data?.cases?.length === 0 ? (
            <EmptyState message="No cases on file." />
          ) : (
            <div className="grid gap-4">
              {data.cases.map((c: any) => (
                <div key={c.id} className="bg-white rounded-2xl border border-slate-100 p-5 sm:p-6 shadow-sm hover:shadow-md hover:border-blue-200/50 transition-all duration-300 group relative overflow-hidden">
                  <div className="absolute top-0 bottom-0 left-0 w-[3px] bg-blue-600 scale-y-0 group-hover:scale-y-100 transition-transform origin-top duration-300"></div>
                  
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="space-y-2.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-slate-800 font-mono text-sm tracking-tight bg-slate-50 border border-slate-200/60 px-2.5 py-0.5 rounded-lg">{c.case_number}</span>
                        <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${statusStyle(c.status)}`}>
                          {c.status === 'Active' && (
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                          )}
                          {c.status}
                        </span>
                      </div>
                      
                      <div className="space-y-2">
                        <p className="text-sm text-slate-500 flex items-center gap-2">
                          <User2 size={14} className="text-slate-400" />
                          Opponent: <span className="font-semibold text-slate-700">{c.opponent_name}</span>
                        </p>
                        <p className="text-xs text-slate-400 flex items-center gap-2 pl-0.5">
                          <Building2 size={14} className="text-slate-400" />
                          {c.court}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Upcoming Hearings Section */}
        <section className="space-y-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <Calendar size={14} className="text-rose-500" /> Upcoming Hearings
          </h3>
          {upcoming.length === 0 ? (
            <EmptyState message="No upcoming hearings scheduled." />
          ) : (
            <div className="relative border-l border-slate-200/80 pl-6 ml-3 py-1 space-y-6">
              {upcoming.map((h: any) => {
                const isToday = h.hearing_date === today;
                const relativeTime = getRelativeDays(h.hearing_date);
                return (
                  <div key={h.id} className="relative group">
                    <div className={`absolute -left-[32px] top-2.5 w-4 h-4 rounded-full border-4 border-slate-50 shadow transition-transform duration-300 group-hover:scale-110 ${isToday ? 'bg-rose-500 animate-pulse border-rose-100' : 'bg-blue-600 border-white'}`}></div>
                    
                    <div className={`bg-white rounded-2xl border p-5 transition-all duration-300 shadow-sm hover:shadow-md ${isToday ? 'border-rose-200 ring-4 ring-rose-500/5 shadow-rose-100/20' : 'border-slate-100 hover:border-blue-200/50'}`}>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <div className="flex items-center gap-2">
                            <p className={`text-base sm:text-lg font-extrabold ${isToday ? 'text-rose-600' : 'text-slate-800'}`}>
                              {fmt(h.hearing_date)}
                            </p>
                            {relativeTime && (
                              <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${isToday ? 'bg-rose-50 border-rose-100 text-rose-600' : 'bg-blue-50 border-blue-100 text-blue-600'}`}>
                                {relativeTime}
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-slate-400 font-mono font-medium">Case: {h.case_number}</span>
                        </div>
                        
                        {h.notes && (
                          <div className="bg-slate-50 border-l-2 border-slate-300 p-3 rounded-r-xl text-slate-600 text-xs leading-relaxed">
                            <p className="font-semibold text-slate-700 mb-0.5">Court Notes:</p>
                            {h.notes}
                          </div>
                        )}

                        {h.next_date && (
                          <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50/50 border border-emerald-100/60 px-3 py-1.5 rounded-xl w-fit">
                            <Clock size={12} />
                            Next Scheduled Date: {fmt(h.next_date)}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Past Hearings Section */}
        {past.length > 0 && (
          <section className="space-y-3">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <CheckCircle2 size={13} className="text-slate-400" /> Past Hearings
            </h3>
            <div className="divide-y divide-slate-100 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              {past.slice(0, 5).map((h: any) => (
                <div key={h.id} className="px-5 py-4 flex items-center justify-between hover:bg-slate-50/40 transition-colors group">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-slate-300 group-hover:bg-slate-400 transition-colors"></div>
                    <p className="text-sm text-slate-600 font-semibold">{fmt(h.hearing_date)}</p>
                  </div>
                  <span className="text-xs font-mono text-slate-400 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">{h.case_number}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        <p className="text-center text-[11px] text-slate-400 pt-4 pb-4">
          This is a secure read-only portal provided by EagleNest Legal Solutions. For details or edits, contact the office directly.
        </p>
      </main>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-12 text-center shadow-sm">
      <AlertCircle size={32} className="mx-auto text-slate-300 mb-3" />
      <p className="text-slate-400 text-sm font-medium">{message}</p>
    </div>
  );
}

function PortalSkeleton() {
  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col font-sans animate-pulse">
      <header className="bg-white px-6 py-4 flex items-center justify-between border-b border-slate-100 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-slate-200 rounded-xl"></div>
          <div>
            <div className="h-4 w-32 bg-slate-200 rounded mb-1.5"></div>
            <div className="h-2 w-16 bg-slate-200 rounded"></div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="w-24 h-4 bg-slate-200 rounded hidden sm:block"></div>
          <div className="w-9 h-9 rounded-full bg-slate-200"></div>
          <div className="w-16 h-8 rounded-xl bg-slate-200"></div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8 space-y-8 w-full flex-1">
        {/* Banner Skeleton */}
        <div className="bg-slate-900 rounded-3xl p-8 h-48 border border-slate-800">
          <div className="h-3.5 w-24 bg-slate-800 rounded mb-3"></div>
          <div className="h-8 w-48 bg-slate-800 rounded mb-2"></div>
          <div className="h-4 w-64 bg-slate-800 rounded"></div>
          <div className="grid grid-cols-2 gap-4 mt-6 max-w-sm">
            <div className="bg-white/[0.04] rounded-2xl h-16"></div>
            <div className="bg-white/[0.04] rounded-2xl h-16"></div>
          </div>
        </div>

        {/* Cases Skeleton */}
        <section className="space-y-4">
          <div className="h-4 w-28 bg-slate-200 rounded"></div>
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="bg-white rounded-2xl border border-slate-100 p-6 h-32">
                <div className="h-5 w-40 bg-slate-200 rounded mb-3"></div>
                <div className="h-4 w-60 bg-slate-100 rounded mb-2"></div>
                <div className="h-3.5 w-32 bg-slate-100 rounded"></div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
