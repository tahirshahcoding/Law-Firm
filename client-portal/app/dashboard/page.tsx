'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Briefcase,
  Calendar,
  FileText,
  LogOut,
  Bell,
  Search,
  MessageSquare,
  User,
  Settings,
  PhoneCall,
  CheckCircle2,
  AlertCircle,
  Building2,
  ChevronDown,
  ChevronUp,
  Wallet,
  Globe
} from 'lucide-react';
import Image from 'next/image';

import { API_BASE } from '@/lib/api';
import { useLanguage } from '@/lib/LanguageContext';

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

export default function DashboardPage() {
  const router = useRouter();
  const { t, language, setLanguage, isRtl } = useLanguage();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'cases' | 'hearings' | 'financials'>('overview');

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

  if (loading) return <div className="min-h-screen bg-slate-50 flex items-center justify-center"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div></div>;

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
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      
      {/* ── Sidebar ── */}
      <aside className="w-64 bg-white border-e border-slate-200/60 hidden md:flex flex-col flex-shrink-0 relative z-20">
        <div className="p-6 flex items-center gap-3">
          <div className="relative w-10 h-10 rounded-xl overflow-hidden flex-shrink-0">
            <Image src="/logo.png" alt="Logo" fill className="object-cover scale-[1.15]" sizes="40px" />
          </div>
          <div>
            <p className="text-slate-900 font-bold text-sm leading-none">Rahimullah Advocate</p>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-1 font-semibold">{t.topbar.clientPortal}</p>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-1 mt-4 overflow-y-auto">
          {[
            { id: 'overview', label: t.sidebar.overview, icon: <LayoutDashboard size={18} /> },
            { id: 'cases', label: t.sidebar.myCases, icon: <Briefcase size={18} /> },
            { id: 'hearings', label: t.sidebar.hearings, icon: <Calendar size={18} /> },
            { id: 'financials', label: t.sidebar.financials, icon: <Wallet size={18} /> },
            { id: 'documents', label: t.sidebar.documents, icon: <FileText size={18} /> },
            { id: 'messages', label: t.sidebar.messages, icon: <MessageSquare size={18} /> },
            { id: 'profile', label: t.sidebar.profile, icon: <User size={18} /> },
            { id: 'settings', label: t.sidebar.settings, icon: <Settings size={18} /> },
          ].map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                activeTab === item.id 
                  ? 'bg-blue-50 text-blue-700' 
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <span className={activeTab === item.id ? 'text-blue-600' : 'text-slate-400'}>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-4 mt-auto">
          <div className="bg-slate-50 rounded-2xl p-4 text-center border border-slate-100 relative overflow-hidden">
            <div className="absolute opacity-5 -right-4 -bottom-4">
               <Image src="/images/courthouse-header.png" alt="watermark" width={100} height={100} />
            </div>
            <h4 className="font-bold text-slate-800 text-sm mb-1">{t.sidebar.needHelp}</h4>
            <p className="text-xs text-slate-500 mb-3 leading-relaxed">{t.sidebar.helpText}</p>
            <button className="w-full flex items-center justify-center gap-2 bg-white border border-blue-200 text-blue-700 px-3 py-2 rounded-xl text-xs font-bold hover:bg-blue-50 transition-colors shadow-sm">
              <PhoneCall size={14} /> {t.sidebar.contactOffice}
            </button>
          </div>
          <p className="text-center text-[10px] text-slate-400 mt-4 font-medium">© 2026 Rahimullah Advocate<br/>{t.sidebar.allRightsReserved}</p>
        </div>
      </aside>

      {/* ── Main Content Area ── */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        
        {/* Topbar */}
        <header className="bg-white px-6 py-4 flex items-center justify-between border-b border-slate-200/60 sticky top-0 z-30">
          <div className="flex-1 max-w-xl">
            <div className="relative">
              <Search className="absolute start-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder={t.topbar.searchPlaceholder}
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-full ps-11 pe-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400 font-medium"
              />
              <div className="absolute end-4 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <span className="text-[10px] font-bold text-slate-400 border border-slate-200 px-1.5 py-0.5 rounded bg-white">Ctrl</span>
                <span className="text-[10px] font-bold text-slate-400 border border-slate-200 px-1.5 py-0.5 rounded bg-white">/</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-5 ms-4">
            <button 
              onClick={() => setLanguage(language === 'en' ? 'ur' : 'en')}
              className="flex items-center gap-1.5 text-sm font-bold text-slate-600 hover:text-blue-600 transition-colors bg-slate-50 px-3 py-1.5 rounded-full border border-slate-200"
            >
              <Globe size={14} /> {language === 'en' ? 'اردو' : 'EN'}
            </button>
            <button className="relative text-slate-400 hover:text-slate-700 transition-colors">
              <Bell size={20} />
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center border-2 border-white">3</span>
            </button>
            <div className="flex items-center gap-3 border-s border-slate-200 ps-5 cursor-pointer hover:bg-slate-50 p-1.5 rounded-xl transition-colors" onClick={handleLogout}>
              <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                {data?.client?.name?.[0]?.toUpperCase() ?? 'U'}
              </div>
              <div className="hidden sm:block text-start">
                <p className="text-sm font-bold text-slate-800 leading-none">{data?.client?.name}</p>
              </div>
              <ChevronDown size={14} className="text-slate-400" />
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-8 custom-scrollbar relative">
          {activeTab === 'overview' && (
            <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              
              {/* Welcome Section */}
              <div className="bg-white rounded-3xl p-8 relative overflow-hidden border border-slate-200/60 shadow-sm flex items-center justify-between">
                <div className="relative z-10 max-w-lg">
                  <p className="text-slate-500 font-medium mb-1">{t.dashboard.welcomeBack}</p>
                  <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">{data?.client?.name}</h1>
                  <p className="text-slate-500 text-sm">{t.dashboard.latestUpdate}</p>
                </div>
                <div className="hidden md:block absolute end-0 bottom-0 w-80 h-40 opacity-80 mix-blend-multiply origin-bottom-right scale-110">
                  <Image src="/images/courthouse-header.png" alt="Courthouse" fill className="object-contain object-right-bottom" />
                </div>
              </div>

              {/* KPI Row */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-2xl p-5 border border-slate-200/60 shadow-sm flex flex-col justify-between">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                      <Briefcase size={20} />
                    </div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">{t.dashboard.activeCases}</p>
                  </div>
                  <div>
                    <h3 className="text-3xl font-black text-slate-900">{activeCases}</h3>
                    <button className="text-[11px] font-bold text-blue-600 hover:text-blue-800 mt-2 flex items-center gap-1 transition-colors">
                      {t.dashboard.viewAllCases} &rarr;
                    </button>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-5 border border-slate-200/60 shadow-sm flex flex-col justify-between">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                      <Calendar size={20} />
                    </div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">{t.dashboard.upcomingHearings}</p>
                  </div>
                  <div>
                    <h3 className="text-3xl font-black text-slate-900">{upcoming.length}</h3>
                    <button className="text-[11px] font-bold text-blue-600 hover:text-blue-800 mt-2 flex items-center gap-1 transition-colors">
                      {t.dashboard.viewAllHearings} &rarr;
                    </button>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-5 border border-slate-200/60 shadow-sm flex flex-col justify-between">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                      <FileText size={20} />
                    </div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">{t.dashboard.outstandingDue}</p>
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-amber-600 whitespace-nowrap">Rs. {outstanding.toLocaleString()}</h3>
                    <button className="text-[11px] font-bold text-blue-600 hover:text-blue-800 mt-2 flex items-center gap-1 transition-colors">
                      {t.dashboard.viewInvoice} &rarr;
                    </button>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-5 border border-slate-200/60 shadow-sm flex flex-col justify-between">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                      <Wallet size={20} />
                    </div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">{t.dashboard.paymentsMade}</p>
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-emerald-600 whitespace-nowrap">Rs. {totalPaid.toLocaleString()}</h3>
                    <button className="text-[11px] font-bold text-blue-600 hover:text-blue-800 mt-2 flex items-center gap-1 transition-colors">
                      {t.dashboard.viewHistory} &rarr;
                    </button>
                  </div>
                </div>
              </div>

              {/* Main Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Large lists */}
                <div className="lg:col-span-2 space-y-6">
                  
                  {/* Upcoming Hearings */}
                  <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-sm font-bold text-slate-900">{t.dashboard.upcomingHearings}</h3>
                      <button className="text-xs font-bold text-blue-600 hover:text-blue-800">{t.dashboard.viewAll}</button>
                    </div>
                    
                    <div className="space-y-4">
                      {upcoming.slice(0, 3).map((h: any) => {
                        const date = new Date(h.hearing_date);
                        return (
                          <div key={h.id} className="flex items-start gap-4 p-4 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors">
                            <div className="flex flex-col items-center justify-center bg-slate-50 border border-slate-100 rounded-lg w-14 h-14 shrink-0">
                              <span className="text-lg font-black text-slate-800 leading-none">{date.getDate()}</span>
                              <span className="text-[10px] font-bold text-slate-500 uppercase mt-0.5">{date.toLocaleString('default', { month: 'short' })}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-bold text-slate-900 truncate">{h.case_number}</h4>
                                <span className="text-[10px] font-bold text-blue-600 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full">{relativeDays(h.hearing_date)}</span>
                              </div>
                              <div className="flex items-center gap-4 text-xs text-slate-500 font-medium">
                                <span className="flex items-center gap-1.5"><Building2 size={12} className="text-slate-400" /> {h.court || 'Court'}</span>
                                <span className="flex items-center gap-1.5"><Clock size={12} className="text-slate-400" /> 09:30 AM</span>
                              </div>
                            </div>
                            <button className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-100 transition-colors shrink-0">
                              <Building2 size={16} />
                            </button>
                          </div>
                        );
                      })}
                      {upcoming.length === 0 && <p className="text-sm text-slate-500 text-center py-4">No upcoming hearings.</p>}
                    </div>
                  </div>

                  {/* Case Progress */}
                  <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-sm font-bold text-slate-900">{t.dashboard.caseProgressOverview}</h3>
                      <button className="text-xs font-bold text-blue-600 hover:text-blue-800">{t.dashboard.viewAll}</button>
                    </div>
                    
                    <div className="space-y-6">
                      {cases.slice(0, 3).map((c: any, index: number) => {
                        const progress = index === 0 ? 80 : index === 1 ? 45 : 30; // Mocked progress
                        return (
                          <div key={c.id}>
                            <div className="flex items-center justify-between mb-2">
                              <p className="font-bold text-slate-800 text-sm">{c.case_number}</p>
                              <span className="text-xs font-bold text-slate-500">{progress}%</span>
                            </div>
                            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                              <div className="h-full bg-blue-600 rounded-full" style={{ width: `${progress}%` }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <button className="text-xs font-bold text-blue-600 hover:text-blue-800 mt-6 flex items-center gap-1 transition-colors">
                      {t.dashboard.seeAllCasesDetails} &rarr;
                    </button>
                  </div>

                </div>

                {/* Right Column - Widgets */}
                <div className="space-y-6">
                  
                  {/* Next Hearing Widget */}
                  {upcoming.length > 0 && (
                    <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-5">
                      <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">{t.dashboard.nextHearing}</h3>
                      <div className="flex items-center gap-4">
                        <div className="flex flex-col items-center justify-center bg-blue-50 border border-blue-100 rounded-xl w-14 h-14 shrink-0 text-blue-700">
                          <span className="text-lg font-black leading-none">{new Date(upcoming[0].hearing_date).getDate()}</span>
                          <span className="text-[10px] font-bold uppercase mt-0.5">{new Date(upcoming[0].hearing_date).toLocaleString('default', { month: 'short' })}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-slate-900 truncate text-sm mb-1">{upcoming[0].case_number}</h4>
                          <p className="text-[11px] text-slate-500 flex items-center gap-1.5 font-medium mb-0.5"><Building2 size={10} /> {upcoming[0].court}</p>
                          <p className="text-[11px] text-slate-500 flex items-center gap-1.5 font-medium"><Clock size={10} /> 09:30 AM</p>
                        </div>
                        <div className="bg-orange-50 border border-orange-100 rounded-lg px-2 py-1.5 text-center shrink-0">
                          <p className="text-lg font-black text-orange-600 leading-none">1</p>
                          <p className="text-[9px] font-bold text-orange-600 uppercase tracking-wider">{t.dashboard.dayRemaining}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Latest Invoice Widget */}
                  {invoices.length > 0 && (
                    <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-5">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">{t.dashboard.latestInvoice}</h3>
                        <button className="text-[10px] font-bold text-blue-600 hover:text-blue-800">{t.dashboard.viewAll}</button>
                      </div>
                      <div className="mb-4">
                        <h4 className="font-bold text-slate-900 mb-1">{invoices[0].invoice_number}</h4>
                        <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium mb-1">
                          <span>{t.dashboard.issuedOn}</span>
                          <span>{fmt(invoices[0].created_at)}</span>
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
                          <span>{t.dashboard.dueDate}</span>
                          <span>{fmt(invoices[0].due_date)}</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between border-t border-slate-100 pt-4 mb-4">
                        <span className="text-[11px] font-bold text-rose-500 uppercase tracking-widest">{t.dashboard.outstanding}</span>
                        <span className="text-lg font-black text-rose-600">PKR {Number(invoices[0].amount).toLocaleString()}</span>
                      </div>
                      <button className="w-full flex items-center justify-center gap-1.5 bg-white border border-blue-200 text-blue-700 px-3 py-2.5 rounded-xl text-xs font-bold hover:bg-blue-50 transition-colors shadow-sm">
                        <Eye size={14} /> {t.dashboard.viewInvoice}
                      </button>
                    </div>
                  )}

                  {/* Your Advocate */}
                  <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-5">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">{t.dashboard.yourAdvocate}</h3>
                    <div className="flex items-center gap-3 mb-5">
                      <div className="w-12 h-12 rounded-full bg-slate-200 overflow-hidden relative">
                         {/* Placeholder for advocate photo */}
                         <div className="absolute inset-0 bg-gradient-to-tr from-slate-300 to-slate-200 flex items-center justify-center">
                           <User size={24} className="text-white" />
                         </div>
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm">Muhammad Rahimullah</h4>
                        <p className="text-[11px] font-medium text-slate-500 mt-0.5">Senior Advocate</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <button className="flex items-center justify-center gap-1.5 bg-white border border-slate-200 text-slate-700 px-2 py-2.5 rounded-xl text-xs font-bold hover:bg-slate-50 transition-colors shadow-sm">
                        <MessageSquare size={14} /> {t.dashboard.message}
                      </button>
                      <button className="flex items-center justify-center gap-1.5 bg-blue-600 text-white px-2 py-2.5 rounded-xl text-xs font-bold hover:bg-blue-700 transition-colors shadow-sm shadow-blue-600/20">
                        <PhoneCall size={14} /> {t.dashboard.callOffice}
                      </button>
                    </div>
                  </div>

                </div>
              </div>

            </div>
          )}
          
          {/* Fallbacks for other tabs */}
          {activeTab !== 'overview' && (
            <div className="max-w-6xl mx-auto flex items-center justify-center h-[50vh] text-slate-500 animate-in fade-in">
              <div className="text-center">
                <Briefcase size={48} className="mx-auto mb-4 text-slate-300" />
                <h2 className="text-xl font-bold text-slate-700 mb-2">{t.sidebar[activeTab as keyof typeof t.sidebar]}</h2>
                <p>This module is currently being re-designed.</p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}