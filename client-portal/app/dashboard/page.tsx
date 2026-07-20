'use client';

import { useState, useEffect, useRef } from 'react';
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
  Globe,
  BadgeCheck,
  Hourglass,
  Ban,
  TrendingUp,
  CreditCard,
  Clock,
  Scale,
  Eye,
  Send,
  Check,
  CheckCheck
} from 'lucide-react';
import Image from 'next/image';

import { API_BASE, getCsrfToken } from '@/lib/api';
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

function getCaseProgress(status: string) {
  switch (status) {
    case 'Consultation': return 5;
    case 'Case Accepted': return 10;
    case 'Documentation Pending': return 15;
    case 'Filing in Progress': return 25;
    case 'Filed': return 30;
    case 'Under Trial': return 40;
    case 'Evidence Stage': return 60;
    case 'Arguments Stage': return 75;
    case 'Judgment Reserved': return 90;
    case 'Appeal': return 95;
    case 'Decided':
    case 'Closed - Won':
    case 'Closed - Lost':
    case 'Closed - Settled':
    case 'Closed - Withdrawn':
    case 'Closed - Dismissed':
    case 'Archived':
    case 'Closed':
      return 100;
    case 'Active':
      return 50; // Generic active state
    default:
      return 0;
  }
}

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
    <div className="flex flex-col items-center justify-center py-12 text-center bg-white rounded-2xl border border-slate-200/60 shadow-sm">
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

export default function DashboardPage() {
  const router = useRouter();
  const { t, language, setLanguage, isRtl } = useLanguage();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [expandedCase, setExpandedCase] = useState<string | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);

  // Messages State
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(`${API_BASE}/portal/data/`, { credentials: 'include' })
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then(d  => { setData(d); setLoading(false); })
      .catch(() => router.replace('/'));
  }, [router]);

  const fetchMessages = async () => {
    try {
      const res = await fetch(`${API_BASE}/portal/messages/`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
      }
    } catch (error) {
      console.error('Failed to fetch messages', error);
    }
  };

  useEffect(() => {
    if (activeTab === 'messages') {
      fetchMessages();
      const interval = setInterval(fetchMessages, 5000);
      return () => clearInterval(interval);
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'messages' && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, activeTab]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    
    setSendingMessage(true);
    try {
      const res = await fetch(`${API_BASE}/portal/messages/`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-CSRFToken': getCsrfToken()
        },
        credentials: 'include',
        body: JSON.stringify({ content: newMessage })
      });
      if (res.ok) {
        setNewMessage('');
        fetchMessages();
      } else {
        const errorData = await res.json().catch(() => ({}));
        console.error('Server returned error:', errorData);
        alert('Server Error: ' + (errorData.error || errorData.detail || res.statusText));
      }
    } catch (error: any) {
      console.error('Failed to send message', error);
      alert('Failed to send message: ' + error.message);
    } finally {
      setSendingMessage(false);
    }
  };

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
        <header className="bg-white border-b border-slate-200/60 sticky top-0 z-30">
          <div className="w-full px-4 sm:px-8 py-4 flex items-center justify-between">
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
            <div className="relative">
              <div className="flex items-center gap-3 border-s border-slate-200 ps-5 cursor-pointer hover:bg-slate-50 p-1.5 rounded-xl transition-colors" onClick={() => setProfileOpen(!profileOpen)}>
                <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                  {data?.client?.name?.[0]?.toUpperCase() ?? 'U'}
                </div>
                <div className="hidden sm:block text-start">
                  <p className="text-sm font-bold text-slate-800 leading-none">{data?.client?.name}</p>
                </div>
                <ChevronDown size={14} className="text-slate-400" />
              </div>

              {/* Profile Dropdown */}
              {profileOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setProfileOpen(false)}></div>
                  <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-lg z-50 py-1 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="px-4 py-2 border-b border-slate-100 mb-1">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Account</p>
                    </div>
                    <button 
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50 flex items-center gap-2 transition-colors"
                    >
                      <LogOut size={16} /> Logout
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-8 custom-scrollbar relative">
          {activeTab === 'overview' && (
            <div className="w-full space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              
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
                    <button 
                      onClick={() => setActiveTab('cases')}
                      className="text-[11px] font-bold text-blue-600 hover:text-blue-800 mt-2 flex items-center gap-1 transition-colors"
                    >
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
                    <button 
                      onClick={() => setActiveTab('hearings')}
                      className="text-[11px] font-bold text-blue-600 hover:text-blue-800 mt-2 flex items-center gap-1 transition-colors"
                    >
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
                    <button 
                      onClick={() => setActiveTab('financials')}
                      className="text-[11px] font-bold text-blue-600 hover:text-blue-800 mt-2 flex items-center gap-1 transition-colors"
                    >
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
                    <button 
                      onClick={() => setActiveTab('financials')}
                      className="text-[11px] font-bold text-blue-600 hover:text-blue-800 mt-2 flex items-center gap-1 transition-colors"
                    >
                      {t.dashboard.viewHistory} &rarr;
                    </button>
                  </div>
                </div>
              </div>

              {/* Main Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Left Column - Large lists */}
                <div className="lg:col-span-3 space-y-6">
                  
                  {/* Upcoming Hearings */}
                  <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-sm font-bold text-slate-900">{t.dashboard.upcomingHearings}</h3>
                      <button onClick={() => setActiveTab('hearings')} className="text-xs font-bold text-blue-600 hover:text-blue-800">{t.dashboard.viewAll}</button>
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
                      <button onClick={() => setActiveTab('cases')} className="text-xs font-bold text-blue-600 hover:text-blue-800">{t.dashboard.viewAll}</button>
                    </div>
                    
                    <div className="space-y-6">
                      {cases.slice(0, 3).map((c: any) => {
                        const progress = getCaseProgress(c.status);
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
                    <button 
                      onClick={() => setActiveTab('cases')}
                      className="text-xs font-bold text-blue-600 hover:text-blue-800 mt-6 flex items-center gap-1 transition-colors"
                    >
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
                      <button 
                        onClick={() => setActiveTab('messages')}
                        className="flex items-center justify-center gap-1.5 bg-white border border-slate-200 text-slate-700 px-2 py-2.5 rounded-xl text-xs font-bold hover:bg-slate-50 transition-colors shadow-sm"
                      >
                        <MessageSquare size={14} /> {t.dashboard.message}
                      </button>
                      <button 
                        onClick={() => window.location.href = 'tel:+923331234567'}
                        className="flex items-center justify-center gap-1.5 bg-blue-600 text-white px-2 py-2.5 rounded-xl text-xs font-bold hover:bg-blue-700 transition-colors shadow-sm shadow-blue-600/20"
                      >
                        <PhoneCall size={14} /> {t.dashboard.callOffice}
                      </button>
                    </div>
                  </div>

                </div>
              </div>

            </div>
          )}
          
          {activeTab === 'cases' && (
            <div className="w-full space-y-6 animate-in fade-in duration-500">
              {/* My Cases (accordion) */}
              <section>
                <SectionHeader icon={<Briefcase size={14} />} title={t.sidebar.myCases} count={cases.length} />
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
                        <div key={c.id} className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
                          {/* Case header row */}
                          <button
                            className="w-full text-start p-5 flex items-start sm:items-center justify-between gap-4 hover:bg-slate-50 transition-colors"
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
                                  <User size={13} className="text-slate-400 shrink-0" />
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
                                  <Calendar size={12} /> {t.sidebar.hearings}
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
            <div className="w-full space-y-6 animate-in fade-in duration-500">
              <section>
                <SectionHeader icon={<Calendar size={14} />} title={t.dashboard.upcomingHearings} count={upcoming.length} />
                {upcoming.length === 0 ? (
                  <EmptyState message="No upcoming hearings scheduled." />
                ) : (
                  <div className="relative border-s-2 border-slate-200 ps-6 ms-3 py-1 space-y-5">
                    {upcoming.map((h: any) => {
                      const isToday     = h.hearing_date === today;
                      const relTime     = relativeDays(h.hearing_date);
                      return (
                        <div key={h.id} className="relative group">
                          <div className={`absolute -start-[33px] top-3 w-4 h-4 rounded-full border-4 border-slate-50 shadow transition-transform group-hover:scale-110 ${isToday ? 'bg-rose-500 animate-pulse border-rose-100' : 'bg-blue-600 border-white'}`} />
                          <div className={`bg-white rounded-2xl border border-slate-200/60 p-5 shadow-sm hover:shadow-md transition-all duration-300 ${isToday ? 'border-rose-200 ring-4 ring-rose-500/5' : 'hover:border-blue-200/60'}`}>
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
                              {h.hearing_stage && <span className="flex items-center gap-1"><Briefcase size={11} /> {h.hearing_stage}</span>}
                              {h.advocate_name && <span className="flex items-center gap-1"><User size={11} /> {h.advocate_name}</span>}
                            </div>
                            {h.notes && (
                              <div className="mt-3 bg-slate-50 border-s-2 border-slate-300 px-3 py-2 rounded-e-xl text-xs text-slate-600 leading-relaxed">
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

              {past.length > 0 && (
                <section>
                  <SectionHeader icon={<CheckCircle2 size={14} />} title="Past Hearings" count={past.length} />
                  <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
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
            <div className="w-full space-y-6 animate-in fade-in duration-500">
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
                  label={t.dashboard.outstanding}
                  value={`Rs. ${outstanding.toLocaleString()}`}
                  sub={outstanding === 0 ? 'Fully settled ✓' : 'Balance remaining'}
                  color={outstanding === 0
                    ? "bg-white border border-slate-100 text-slate-800"
                    : "bg-gradient-to-br from-rose-500 to-rose-600 text-white shadow-rose-500/20"}
                />
              </div>

              <section>
                <SectionHeader icon={<FileText size={14} />} title="All Challans & Invoices" count={invoices.length} />
                {invoices.length === 0 ? (
                  <EmptyState message="No challans issued yet." />
                ) : (
                  <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-start text-sm min-w-[500px]">
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

              <section>
                <SectionHeader icon={<CreditCard size={14} />} title="Payment History" count={payments.length} />
                {payments.length === 0 ? (
                  <EmptyState message="No payments recorded yet." />
                ) : (
                  <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-start text-sm min-w-[400px]">
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

          {activeTab === 'messages' && (
            <div className="w-full h-full max-w-4xl mx-auto flex flex-col bg-white rounded-3xl border border-slate-200/60 shadow-sm overflow-hidden animate-in fade-in duration-500" style={{ height: 'calc(100vh - 180px)' }}>
              {/* Chat Header */}
              <div className="bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between z-10 shrink-0">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-slate-200 overflow-hidden relative border-2 border-white shadow-sm">
                    <div className="absolute inset-0 bg-gradient-to-tr from-slate-300 to-slate-200 flex items-center justify-center">
                      <User size={24} className="text-white" />
                    </div>
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-slate-900 leading-tight">Your Advocate</h2>
                    <p className="text-xs font-bold text-emerald-500 flex items-center gap-1.5 mt-0.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Online
                    </p>
                  </div>
                </div>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50 space-y-6 custom-scrollbar">
                {messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-3">
                    <MessageSquare size={48} className="opacity-20" />
                    <p className="font-medium text-sm">Send a message to start the conversation.</p>
                  </div>
                ) : (
                  messages.map((msg, i) => {
                    const isClient = msg.sender_type === 'Client';
                    return (
                      <div key={msg.id || i} className={`flex ${isClient ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[75%] rounded-2xl px-5 py-3 shadow-sm ${
                          isClient 
                            ? 'bg-blue-600 text-white rounded-tr-sm' 
                            : 'bg-white border border-slate-200/60 text-slate-700 rounded-tl-sm'
                        }`}>
                          <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                          <div className={`text-[10px] font-bold mt-2 ${isClient ? 'text-blue-200' : 'text-slate-400'} flex items-center gap-1 justify-end`}>
                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            {isClient && (msg.is_read ? <CheckCheck size={14} className="text-cyan-300" /> : <Check size={14} className="text-blue-300/80" />)}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input */}
              <div className="p-4 bg-white border-t border-slate-100 shrink-0">
                <form onSubmit={sendMessage} className="flex items-center gap-3 relative">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your message..."
                    className="flex-1 bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-full focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 block w-full ps-6 pe-16 py-3.5 transition-all outline-none"
                    disabled={sendingMessage}
                  />
                  <button 
                    type="submit" 
                    disabled={!newMessage.trim() || sendingMessage}
                    className="absolute end-2 w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600 transition-colors shadow-sm shadow-blue-600/20"
                  >
                    {sendingMessage ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <Send size={16} className="-ms-0.5" />
                    )}
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* Unimplemented Fallbacks */}
          {activeTab !== 'overview' && activeTab !== 'cases' && activeTab !== 'hearings' && activeTab !== 'financials' && activeTab !== 'messages' && (
            <div className="max-w-7xl mx-auto flex items-center justify-center h-[50vh] text-slate-500 animate-in fade-in">
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