'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Scale, Briefcase, Calendar, LogOut, Clock, AlertCircle } from 'lucide-react';

const API = 'http://localhost:8000/api';

export default function DashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = sessionStorage.getItem('cp_access');
    if (!token) { router.replace('/'); return; }

    fetch(`${API}/portal/data/`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then(d => { setData(d); setLoading(false); })
      .catch(() => { router.replace('/'); });
  }, [router]);

  const handleLogout = () => {
    sessionStorage.removeItem('cp_access');
    sessionStorage.removeItem('cp_refresh');
    router.push('/');
  };

  const fmt = (d: string) => {
    if (!d) return '';
    const [y, m, day] = d.split('-');
    return `${day}/${m}/${y}`;
  };

  const statusStyle = (s: string) => {
    if (s === 'Active') return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    if (s === 'Closed') return 'bg-slate-100 text-slate-500 border-slate-200';
    return 'bg-amber-100 text-amber-700 border-amber-200';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-900 border-t-blue-500 rounded-full animate-spin" />
          <p className="text-slate-600 text-sm">Loading your portal…</p>
        </div>
      </div>
    );
  }

  const today = new Date().toISOString().split('T')[0];
  const upcoming = (data?.hearings ?? [])
    .filter((h: any) => h.hearing_date >= today)
    .sort((a: any, b: any) => a.hearing_date.localeCompare(b.hearing_date));
  const past = (data?.hearings ?? [])
    .filter((h: any) => h.hearing_date < today)
    .sort((a: any, b: any) => b.hearing_date.localeCompare(a.hearing_date));

  return (
    <div className="min-h-screen bg-slate-50">

      {/* ── Top bar ── */}
      <header className="bg-slate-900 px-6 py-4 flex items-center justify-between sticky top-0 z-10 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-700 rounded-xl flex items-center justify-center">
            <Scale size={18} className="text-white" />
          </div>
          <div>
            <p className="text-white font-bold text-sm leading-none">EagleNest Legal</p>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-0.5">Client Portal</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-white text-sm font-semibold">{data?.client?.name}</p>
            <p className="text-slate-500 text-xs font-mono">{data?.client?.client_number}</p>
          </div>
          <div className="w-9 h-9 rounded-full bg-blue-700 flex items-center justify-center text-white font-bold text-sm">
            {data?.client?.name?.[0]?.toUpperCase() ?? 'C'}
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-slate-500 hover:text-white text-xs transition-colors px-2 py-1.5 rounded-lg hover:bg-white/10"
          >
            <LogOut size={15} /> <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </header>

      {/* ── Main content ── */}
      <main className="max-w-2xl mx-auto px-4 py-10 space-y-8">

        {/* Welcome banner */}
        <div className="bg-gradient-to-br from-blue-900 to-slate-900 rounded-2xl p-7 text-white shadow-xl">
          <p className="text-blue-400 text-xs font-bold uppercase tracking-widest mb-1">Welcome back</p>
          <h2 className="text-2xl font-bold">{data?.client?.name}</h2>
          <p className="text-slate-400 text-sm mt-1">Read-only view of your legal matters.</p>
          <div className="grid grid-cols-2 gap-3 mt-5 max-w-xs">
            <div className="bg-white/10 rounded-xl px-4 py-3">
              <p className="text-2xl font-bold">{data?.cases?.length ?? 0}</p>
              <p className="text-xs text-slate-400 mt-0.5">Total Cases</p>
            </div>
            <div className="bg-white/10 rounded-xl px-4 py-3">
              <p className="text-2xl font-bold">{upcoming.length}</p>
              <p className="text-xs text-slate-400 mt-0.5">Upcoming Hearings</p>
            </div>
          </div>
        </div>

        {/* Cases */}
        <section>
          <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Briefcase size={16} className="text-blue-600" /> My Cases
          </h3>
          {data?.cases?.length === 0 ? (
            <EmptyState message="No cases on file." />
          ) : (
            <div className="space-y-3">
              {data.cases.map((c: any) => (
                <div key={c.id} className="bg-white rounded-2xl border border-slate-100 p-5 hover:shadow-md hover:border-blue-100 transition-all">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-slate-900 font-mono text-sm">{c.case_number}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusStyle(c.status)}`}>
                          {c.status}
                        </span>
                      </div>
                      <p className="text-sm text-slate-500">
                        vs. <span className="font-medium text-slate-700">{c.opponent_name}</span>
                      </p>
                      <p className="text-xs text-slate-400 mt-1">{c.court}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Upcoming Hearings */}
        <section>
          <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Calendar size={16} className="text-rose-500" /> Upcoming Hearings
          </h3>
          {upcoming.length === 0 ? (
            <EmptyState message="No upcoming hearings scheduled." />
          ) : (
            <div className="space-y-3">
              {upcoming.map((h: any) => {
                const isToday = h.hearing_date === today;
                return (
                  <div key={h.id} className={`bg-white rounded-2xl border p-5 transition-all ${isToday ? 'border-rose-200 ring-1 ring-rose-100' : 'border-slate-100 hover:shadow-md'}`}>
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <p className={`text-lg font-bold ${isToday ? 'text-rose-700' : 'text-slate-900'}`}>
                            {fmt(h.hearing_date)}
                          </p>
                          {isToday && (
                            <span className="text-[9px] font-extrabold tracking-widest uppercase text-rose-500 bg-rose-50 border border-rose-100 px-2 py-0.5 rounded-full">
                              Today
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-slate-500">
                          Case: <span className="font-mono font-semibold text-slate-700">{h.case_number}</span>
                        </p>
                        {h.notes && <p className="text-xs text-slate-400 mt-1">{h.notes}</p>}
                        {h.next_date && (
                          <p className="text-xs font-semibold text-emerald-600 mt-2 flex items-center gap-1">
                            <Clock size={11} /> Next: {fmt(h.next_date)}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Past Hearings */}
        {past.length > 0 && (
          <section>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
              <Calendar size={13} /> Past Hearings
            </h3>
            <div className="space-y-2">
              {past.slice(0, 5).map((h: any) => (
                <div key={h.id} className="bg-white border border-slate-100 rounded-xl px-4 py-3 flex items-center justify-between opacity-60 hover:opacity-100 transition-opacity">
                  <p className="text-sm text-slate-700 font-medium">{fmt(h.hearing_date)}</p>
                  <span className="text-xs text-slate-400 font-mono">{h.case_number}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        <p className="text-center text-[11px] text-slate-400 pb-8">
          This is a secure read-only portal provided by EagleNest Legal. For queries, contact your lawyer.
        </p>
      </main>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-10 text-center">
      <AlertCircle size={28} className="mx-auto text-slate-200 mb-3" />
      <p className="text-slate-400 text-sm">{message}</p>
    </div>
  );
}
