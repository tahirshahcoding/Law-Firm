'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Scale,
  Briefcase,
  Calendar,
  LogOut,
  Clock,
  AlertCircle,
  Building2,
  User2,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Wallet,
  TrendingUp,
  FileText,
  BadgeCheck,
  Hourglass,
  Ban,
  CreditCard,
} from 'lucide-react';
import Image from 'next/image';

import { API_BASE } from '@/lib/api';

/* ─── helpers ─────────────────────────────────────────────────────────────── */

function fmt(d: string) {
  if (!d) return '—';
  try {
    const date = new Date(d);
    if (isNaN(date.getTime())) {
      const [y, m, day] = d.split('-');
      return `${day}/${m}/${y}`;
    }
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    const [y, m, day] = d.split('-');
    return `${day}/${m}/${y}`;
  }
}

function relativeDays(dateStr: string) {
  const today = new Date().toISOString().split('T')[0];
  if (dateStr === today) return 'Today';
  try {
    const diff = Math.ceil((new Date(dateStr).getTime() - new Date(today).getTime()) / 86400000);
    if (diff === 1) return 'Tomorrow';
    if (diff > 1)  return `In ${diff} days`;
    if (diff === -1) return 'Yesterday';
    return `${Math.abs(diff)} days ago`;
  } catch { return ''; }
}

function statusColor(s: string) {
  if (s === 'Active')   return { dot: 'bg-emerald-500', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
  if (s === 'Closed')   return { dot: 'bg-slate-400',   badge: 'bg-slate-100  text-slate-500   border-slate-200' };
  return                       { dot: 'bg-amber-500',   badge: 'bg-amber-50   text-amber-700   border-amber-200' };
}

function invoiceStatusColor(s: string) {
  if (s === 'Paid')     return 'bg-emerald-100 text-emerald-700 border-emerald-200';
  if (s === 'Partial')  return 'bg-amber-100   text-amber-700   border-amber-200';
  return                       'bg-rose-100    text-rose-700    border-rose-200';
}

function invoiceStatusIcon(s: string) {
  if (s === 'Paid')    return <BadgeCheck size={12} />;
  if (s === 'Partial') return <Hourglass  size={12} />;
  return                      <Ban        size={12} />;
}

/* ─── tiny components ─────────────────────────────────────────────────────── */

function StatCard({ icon, label, value, sub, color }: { icon: React.ReactNode; label: string; value: string | number; sub?: string; color: string }) {
  return (
    <div className={`relative rounded-2xl p-5 overflow-hidden ${color} shadow-sm`}>
      <div className="absolute right-3 top-3 opacity-10 scale-[2.5] origin-top-right">{icon}</div>
      <div className="relative z-10">
        <p className="text-xs font-bold uppercase tracking-widest opacity-80 mb-1">{label}</p>
        <p className="text-3xl font-black tracking-tight">{value}</p>
        {sub && <p className="text-xs mt-1 opacity-70 font-medium">{sub}</p>}
      </div>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <AlertCircle size={36} className="text-slate-200 mb-3" />
      <p className="text-slate-400 text-sm font-medium">{message}</p>
    </div>
  );
}

function SectionHeader({ icon, title, count }: { icon: React.ReactNode; title: string; count?: number }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <span className="text-slate-400">{icon}</span>
      <h3 className="text-xs font-extrabold text-slate-500 uppercase tracking-widest">{title}</h3>
      {count !== undefined && (
        <span className="ml-auto text-xs font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
          {count}
        </span>
      )}
    </div>
  );
}

/* ─── skeleton ────────────────────────────────────────────────────────────── */
function PortalSkeleton() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col animate-pulse">
      <header className="bg-white px-6 py-4 flex items-center justify-between border-b border-slate-100 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-slate-200 rounded-xl" />
          <div>
            <div className="h-4 w-32 bg-slate-200 rounded mb-1.5" />
            <div className="h-2 w-16 bg-slate-200 rounded" />
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="w-24 h-4 bg-slate-200 rounded hidden sm:block" />
          <div className="w-9 h-9 rounded-full bg-slate-200" />
          <div className="w-16 h-8 rounded-xl bg-slate-200" />
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-4 py-8 space-y-8 w-full">
        <div className="bg-slate-900 rounded-3xl h-48" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="h-28 bg-slate-200 rounded-2xl" />)}
        </div>
        <div className="h-64 bg-slate-200 rounded-2xl" />
        <div className="h-64 bg-slate-200 rounded-2xl" />
      </main>
    </div>
  );
}

/* ─── main page ───────────────────────────────────────────────────────────── */

export default function DashboardPage() {
  const router = useRouter();
  const [data, setData]       = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'cases' | 'hearings' | 'financials'>('overview');

  // accordion state
  const [expandedCase, setExpandedCase] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API_BASE}/portal/data/`, { credentials: 'include' })
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then(d  => { setData(d); setLoading(false); })
      .catch(() => router.replace('/'));
  }, [router]);

  const handleLogout = async () => {
    try { await fetch(`${API_BASE}/auth/logout/`, { method: 'POST', credentials: 'include' }); }
    catch { /* ignore */ }
    router.push('/');
  };

  if (loading) return <PortalSkeleton />;

  /* derived data */
  const today     = new Date().toISOString().split('T')[0];
  const cases     = data?.cases     ?? [];
  const hearings  = data?.hearings  ?? [];
  const invoices  = data?.invoices  ?? [];
  const payments  = data?.payments  ?? [];

  const upcoming  = hearings.filter((h: any) => h.hearing_date >= today).sort((a: any, b: any) => a.hearing_date.localeCompare(b.hearing_date));
  const past      = hearings.filter((h: any) => h.hearing_date <  today).sort((a: any, b: any) => b.hearing_date.localeCompare(a.hearing_date));

  const totalBilled   = invoices.reduce((s: number, i: any) => s + Number(i.amount), 0);
  const totalPaid     = payments.reduce((s: number, p: any) => s + Number(p.amount_received), 0);
  const outstanding   = Math.max(totalBilled - totalPaid, 0);
  const activeCases   = cases.filter((c: any) => c.status === 'Active').length;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">

      {/* ── Header ── */}
      <header className="bg-white/90 backdrop-blur-md px-5 py-3.5 flex items-center justify-between sticky top-0 z-50 border-b border-slate-100 shadow-[0_2px_8px_-3px_rgba(0,0,0,0.04)]">
        <div className="flex items-center gap-3">
          <div className="relative w-9 h-9 rounded-xl overflow-hidden flex-shrink-0 border border-slate-100 shadow-sm">
            <Image src="/logo.png" alt="Logo" fill className="object-cover scale-[1.15]" sizes="36px" />
          </div>
          <div>
            <p className="text-slate-800 font-bold text-sm leading-none">Rahimullah Advocate</p>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-0.5 font-semibold">Client Portal</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-slate-800 text-sm font-semibold">{data?.client?.name}</p>
            <p className="text-slate-400 text-xs font-mono">{data?.client?.client_number}</p>
          </div>
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-md shadow-blue-500/20">
            {data?.client?.name?.[0]?.toUpperCase() ?? 'C'}
          </div>
          <button onClick={handleLogout} className="group flex items-center gap-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 px-3 py-1.5 rounded-xl transition-all text-xs font-medium">
            <LogOut size={14} className="group-hover:translate-x-0.5 transition-transform" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6 w-full flex-1">

        {/* ── Tabs Navigation ── */}
        <div className="flex overflow-x-auto hide-scrollbar gap-2 pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
          {[
            { id: 'overview', label: 'Overview', icon: <LayoutDashboard size={14} /> },
            { id: 'cases', label: 'My Cases', icon: <Briefcase size={14} /> },
            { id: 'hearings', label: 'Hearings', icon: <Calendar size={14} /> },
            { id: 'financials', label: 'Financials', icon: <FileText size={14} /> },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${activeTab === t.id ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' : 'bg-white text-slate-500 hover:text-slate-800 hover:bg-slate-50 border border-slate-200'}`}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>


        {activeTab === 'overview' && (
          <div className="space-y-6 animate-in fade-in duration-500">
            {/* ── Hero welcome banner ── */}
            <div className="bg-blue-900 rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden border border-slate-800 shadow-xl">
          <div className="absolute -right-12 -top-12 w-48 h-48 bg-blue-500/5 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -left-8 bottom-0 w-36 h-36 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />
          <div className="relative z-10">
            <p className="text-blue-400 text-xs font-extrabold uppercase tracking-widest mb-1">Welcome back</p>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">{data?.client?.name}</h1>
            <p className="text-slate-400 text-xs sm:text-sm mt-1 mb-6">Here is a full summary of your legal matters with Rahimullah Advocate.</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Active Cases',      value: activeCases },
                { label: 'Upcoming Hearings', value: upcoming.length },
                { label: 'Total Challans',    value: invoices.length },
                { label: 'Payments Made',     value: payments.length },
              ].map(s => (
                <div key={s.label} className="bg-white/[0.04] border border-white/[0.06] rounded-2xl px-4 py-3 hover:bg-white/[0.08] transition-colors">
                  <p className="text-2xl font-extrabold text-white tracking-tight">{s.value}</p>
                  <p className="text-[11px] text-slate-400 font-medium mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
          </div>
        )}

        {activeTab === 'cases' && (
          <div className="space-y-6 animate-in fade-in duration-500">
            {/* ── My Cases (accordion) ── */}
            <section>
          <SectionHeader icon={<Briefcase size={14} />} title="My Cases" count={cases.length} />
          {cases.length === 0 ? (
            <EmptyState message="No cases on file." />
          ) : (
            <div className="space-y-3">
              {cases.map((c: any) => {
                const sc       = statusColor(c.status);
                const isOpen   = expandedCase === c.id;
                const cHearings = hearings.filter((h: any) => h.case === c.id || h.case_number === c.case_number);
                const cInvoices = invoices.filter((i: any) => i.case === c.id);
                const cPaid     = payments.filter((p: any) => {
                  const ci = cInvoices.find((inv: any) => inv.case === p.case);
                  return !!ci;
                });
                const cBilled   = cInvoices.reduce((s: number, i: any) => s + Number(i.amount), 0);
                const cPaidAmt  = payments.filter((p: any) => cInvoices.some((i: any) => i.case === p.case)).reduce((s: number, p: any) => s + Number(p.amount_received), 0);

                return (
                  <div key={c.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                    {/* Case header row */}
                    <button
                      className="w-full text-left p-5 flex items-start sm:items-center justify-between gap-4 hover:bg-slate-50/60 transition-colors"
                      onClick={() => setExpandedCase(isOpen ? null : c.id)}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <span className="font-bold text-slate-800 font-mono text-sm bg-slate-50 border border-slate-200 px-2.5 py-0.5 rounded-lg">{c.case_number}</span>
                          <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${sc.badge}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${sc.dot} ${c.status === 'Active' ? 'animate-pulse' : ''}`} />
                            {c.status}
                          </span>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4">
                          <p className="text-sm text-slate-600 flex items-center gap-1.5">
                            <User2 size={13} className="text-slate-400 shrink-0" />
                            vs <span className="font-semibold text-slate-800">{c.opponent_name}</span>
                          </p>
                          <p className="text-xs text-slate-400 flex items-center gap-1.5">
                            <Building2 size={13} className="shrink-0" /> {c.court}
                          </p>
                        </div>
                        {/* quick financials */}
                        {cBilled > 0 && (
                          <div className="flex items-center gap-3 mt-2">
                            <span className="text-[11px] font-semibold text-slate-500">Billed: <span className="text-slate-800">Rs. {cBilled.toLocaleString()}</span></span>
                            <span className="text-[11px] font-semibold text-slate-500">Paid: <span className="text-emerald-600">Rs. {cPaidAmt.toLocaleString()}</span></span>
                          </div>
                        )}
                      </div>
                      <div className="text-slate-400 shrink-0 mt-1 sm:mt-0">
                        {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                      </div>
                    </button>

                    {/* Expanded accordion content */}
                    {isOpen && (
                      <div className="border-t border-slate-100 divide-y divide-slate-50">

                        {/* Hearings for this case */}
                        <div className="p-5">
                          <p className="text-xs font-extrabold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                            <Calendar size={12} /> Hearings
                          </p>
                          {cHearings.length === 0 ? (
                            <p className="text-xs text-slate-400 italic">No hearings recorded for this case.</p>
                          ) : (
                            <div className="space-y-2">
                              {cHearings.sort((a: any, b: any) => b.hearing_date.localeCompare(a.hearing_date)).map((h: any) => {
                                const isPast = h.hearing_date < today;
                                const isToday = h.hearing_date === today;
                                return (
                                  <div key={h.id} className={`flex items-center justify-between rounded-xl px-4 py-2.5 ${isToday ? 'bg-rose-50 border border-rose-100' : isPast ? 'bg-slate-50 border border-slate-100' : 'bg-blue-50 border border-blue-100'}`}>
                                    <div className="flex items-center gap-2">
                                      <span className={`w-2 h-2 rounded-full shrink-0 ${isToday ? 'bg-rose-500 animate-pulse' : isPast ? 'bg-slate-300' : 'bg-blue-500'}`} />
                                      <p className={`text-sm font-semibold ${isToday ? 'text-rose-700' : isPast ? 'text-slate-500' : 'text-slate-800'}`}>{fmt(h.hearing_date)}</p>
                                      {h.hearing_stage && <span className="text-[10px] font-bold text-slate-400 bg-white border border-slate-100 px-1.5 py-0.5 rounded">{h.hearing_stage}</span>}
                                    </div>
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isToday ? 'bg-rose-100 text-rose-600' : isPast ? 'bg-slate-100 text-slate-400' : 'bg-blue-100 text-blue-600'}`}>
                                      {relativeDays(h.hearing_date) || fmt(h.hearing_date)}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>

                        {/* Invoices for this case */}
                        <div className="p-5">
                          <p className="text-xs font-extrabold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                            <FileText size={12} /> Challans / Invoices
                          </p>
                          {cInvoices.length === 0 ? (
                            <p className="text-xs text-slate-400 italic">No challans issued for this case.</p>
                          ) : (
                            <div className="space-y-2">
                              {cInvoices.map((inv: any) => (
                                <div key={inv.id} className="flex items-center justify-between rounded-xl border border-slate-100 px-4 py-2.5 bg-slate-50">
                                  <div>
                                    <p className="text-xs font-bold text-slate-500 font-mono">{inv.invoice_number}</p>
                                    <p className="text-sm font-bold text-slate-800 mt-0.5">Rs. {Number(inv.amount).toLocaleString()}</p>
                                    <p className="text-[11px] text-slate-400 mt-0.5">Due: {fmt(inv.due_date)}</p>
                                  </div>
                                  <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full border ${invoiceStatusColor(inv.status)}`}>
                                    {invoiceStatusIcon(inv.status)} {inv.status}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
          </div>
        )}

        {activeTab === 'hearings' && (
          <div className="space-y-6 animate-in fade-in duration-500">
            {/* ── Upcoming Hearings ── */}
            <section>
          <SectionHeader icon={<Calendar size={14} />} title="Upcoming Hearings" count={upcoming.length} />
          {upcoming.length === 0 ? (
            <EmptyState message="No upcoming hearings scheduled." />
          ) : (
            <div className="relative border-l-2 border-slate-200 pl-6 ml-3 py-1 space-y-5">
              {upcoming.map((h: any) => {
                const isToday     = h.hearing_date === today;
                const relTime     = relativeDays(h.hearing_date);
                return (
                  <div key={h.id} className="relative group">
                    <div className={`absolute -left-[33px] top-3 w-4 h-4 rounded-full border-4 border-slate-50 shadow transition-transform group-hover:scale-110 ${isToday ? 'bg-rose-500 animate-pulse border-rose-100' : 'bg-blue-600 border-white'}`} />
                    <div className={`bg-white rounded-2xl border p-5 shadow-sm hover:shadow-md transition-all duration-300 ${isToday ? 'border-rose-200 ring-4 ring-rose-500/5' : 'border-slate-100 hover:border-blue-200/60'}`}>
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <p className={`text-lg font-extrabold ${isToday ? 'text-rose-600' : 'text-slate-800'}`}>{fmt(h.hearing_date)}</p>
                          {relTime && (
                            <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${isToday ? 'bg-rose-50 border-rose-100 text-rose-600' : 'bg-blue-50 border-blue-100 text-blue-600'}`}>
                              {relTime}
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-slate-400 font-mono">Case: {h.case_number}</span>
                      </div>
                      <div className="flex flex-wrap gap-3 text-xs text-slate-500">
                        {h.court && <span className="flex items-center gap-1"><Building2 size={11} /> {h.court}</span>}
                        {h.hearing_stage && <span className="flex items-center gap-1"><Scale size={11} /> {h.hearing_stage}</span>}
                        {h.advocate_name && <span className="flex items-center gap-1"><User2 size={11} /> {h.advocate_name}</span>}
                      </div>
                      {h.notes && (
                        <div className="mt-3 bg-slate-50 border-l-2 border-slate-300 px-3 py-2 rounded-r-xl text-xs text-slate-600 leading-relaxed">
                          <p className="font-semibold text-slate-700 mb-0.5">Court Notes:</p>
                          {h.notes}
                        </div>
                      )}
                      {h.next_date && (
                        <div className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-xl w-fit">
                          <Clock size={11} /> Next date: {fmt(h.next_date)}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
            
            {/* ── Past Hearings ── */}
            {past.length > 0 && (
          <section>
            <SectionHeader icon={<CheckCircle2 size={14} />} title="Past Hearings" count={past.length} />
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="divide-y divide-slate-50">
                {past.slice(0, 8).map((h: any) => (
                  <div key={h.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-slate-50/60 transition-colors">
                    <div className="flex items-center gap-3">
                      <span className="w-2 h-2 rounded-full bg-slate-300 shrink-0" />
                      <p className="text-sm font-semibold text-slate-600">{fmt(h.hearing_date)}</p>
                      {h.hearing_stage && <span className="text-[10px] text-slate-400 font-semibold hidden sm:inline">{h.hearing_stage}</span>}
                    </div>
                    <span className="text-xs font-mono text-slate-400 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded">{h.case_number}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}
          </div>
        )}

        {activeTab === 'financials' && (
          <div className="space-y-6 animate-in fade-in duration-500">
            {/* ── Financial summary cards ── */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            icon={<FileText />}
            label="Total Billed"
            value={`Rs. ${totalBilled.toLocaleString()}`}
            sub={`${invoices.length} challans issued`}
            color="bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-blue-500/20"
          />
          <StatCard
            icon={<Wallet />}
            label="Total Paid"
            value={`Rs. ${totalPaid.toLocaleString()}`}
            sub={`${payments.length} payments recorded`}
            color="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-emerald-500/20"
          />
          <StatCard
            icon={<TrendingUp />}
            label="Outstanding"
            value={`Rs. ${outstanding.toLocaleString()}`}
            sub={outstanding === 0 ? 'Fully settled ✓' : 'Balance remaining'}
            color={outstanding === 0
              ? "bg-white border border-slate-100 text-slate-800"
              : "bg-gradient-to-br from-rose-500 to-rose-600 text-white shadow-rose-500/20"}
          />
        </div>
            
            {/* ── Invoices / Challans ── */}
            <section>
          <SectionHeader icon={<FileText size={14} />} title="All Challans & Invoices" count={invoices.length} />
          {invoices.length === 0 ? (
            <EmptyState message="No challans issued yet." />
          ) : (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm min-w-[500px]">
                  <thead className="bg-slate-50 border-b border-slate-100 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    <tr>
                      <th className="px-5 py-3">Challan #</th>
                      <th className="px-5 py-3">Case</th>
                      <th className="px-5 py-3">Amount</th>
                      <th className="px-5 py-3">Due Date</th>
                      <th className="px-5 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {invoices.map((inv: any) => (
                      <tr key={inv.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-5 py-3.5 font-mono text-xs font-bold text-slate-500">{inv.invoice_number}</td>
                        <td className="px-5 py-3.5 font-mono text-xs text-slate-600">{inv.case_number}</td>
                        <td className="px-5 py-3.5 font-bold text-slate-800">Rs. {Number(inv.amount).toLocaleString()}</td>
                        <td className="px-5 py-3.5 text-slate-500 text-xs">{fmt(inv.due_date)}</td>
                        <td className="px-5 py-3.5">
                          <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full border ${invoiceStatusColor(inv.status)}`}>
                            {invoiceStatusIcon(inv.status)} {inv.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
            
            {/* ── Payment History ── */}
            <section>
          <SectionHeader icon={<CreditCard size={14} />} title="Payment History" count={payments.length} />
          {payments.length === 0 ? (
            <EmptyState message="No payments recorded yet." />
          ) : (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm min-w-[400px]">
                  <thead className="bg-slate-50 border-b border-slate-100 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    <tr>
                      <th className="px-5 py-3">Case</th>
                      <th className="px-5 py-3">Amount Paid</th>
                      <th className="px-5 py-3">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {payments.map((p: any) => (
                      <tr key={p.id} className="hover:bg-emerald-50/30 transition-colors">
                        <td className="px-5 py-3.5 font-mono text-xs text-slate-600">{p.case_number}</td>
                        <td className="px-5 py-3.5 font-bold text-emerald-700">Rs. {Number(p.amount_received).toLocaleString()}</td>
                        <td className="px-5 py-3.5 text-slate-500 text-xs">{fmt(p.payment_date)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-emerald-50 border-t border-emerald-100">
                    <tr>
                      <td className="px-5 py-3 text-xs font-bold text-emerald-700">Total Paid</td>
                      <td className="px-5 py-3 font-extrabold text-emerald-700">Rs. {totalPaid.toLocaleString()}</td>
                      <td />
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}
        </section>
          </div>
        )}

        <p className="text-center text-[11px] text-slate-400 pb-6">

          This is a secure, read-only portal provided by Rahimullah Advocate.
          For details or edits, please contact the office directly.
        </p>
      </main>
    </div>
  );
}