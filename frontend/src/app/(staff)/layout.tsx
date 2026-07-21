'use client';

import React, { useState, useRef, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Menu, LogOut, UserCircle, ChevronDown, Search, Plus, Bell, CalendarDays, CheckCircle2, Clock, FileText, Sun, Moon } from 'lucide-react';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import CommandPalette from '@/components/CommandPalette';
import QuickAddModal from '@/components/QuickAddModal';
import { useAuth } from '@/context/AuthContext';
import { AppShellSkeleton } from '@/components/SkeletonLoaders';
import { UIProvider } from '@/context/UIContext';
import Image from 'next/image';
import { API_BASE, apiFetch } from '@/lib/api';
import NetworkStatus from '@/components/NetworkStatus';

export default function StaffLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { loading, user, logout } = useAuth();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    if (document.documentElement.classList.contains('dark')) {
      setIsDark(true);
    }
  }, []);

  const toggleTheme = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    if (nextDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  const fetchNotifications = async () => {
    try {
      const res = await apiFetch(`${API_BASE}/notifications/`);
      if (res.ok) {
        const data = await res.json();
        const results = Array.isArray(data) ? data : (data.results || []);
        setNotifications(results);
        setUnreadCount(results.filter((n: any) => !n.is_read).length);
      }
    } catch (error) {
      console.error("Failed to fetch notifications", error);
    }
  };

  useEffect(() => {
    if (user && user.role !== 'Client') {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 60000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const markAllAsRead = async () => {
    try {
      await apiFetch(`${API_BASE}/notifications/mark_all_read/`, { method: 'POST' });
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error("Failed to mark all as read", error);
    }
  };

  const markAsRead = async (id: string, is_read: boolean) => {
    if (is_read) return;
    try {
      await apiFetch(`${API_BASE}/notifications/${id}/mark_read/`, { method: 'POST' });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Failed to mark as read", error);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(e.target as Node)) {
        setNotificationsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Redirect unauthenticated or client users safely after render to avoid bad setState during render warning
  useEffect(() => {
    if (!loading && pathname !== '/login' && (!user || user.role === 'Client')) {
      router.push('/login');
    }
  }, [user, loading, pathname, router]);

  if (pathname === '/login' || pathname === '/') {
    return <>{children}</>;
  }

  if (loading) {
    return <AppShellSkeleton />;
  }

  if (!user || user.role === 'Client') {
    return null;
  }

  return (
    <div className="flex h-screen overflow-hidden w-full print:h-auto print:overflow-visible">
      <UIProvider>
      <NetworkStatus />
      <CommandPalette />
      <QuickAddModal />
      <Navigation
        mobileOpen={mobileNavOpen}
        onCloseMobile={() => setMobileNavOpen(false)}
      />
      <main className="flex-1 flex flex-col overflow-y-auto relative bg-[#F8FAFC] dark:bg-slate-950 min-w-0 transition-colors duration-300 print:overflow-visible print:h-auto print:block">
        {/* ── Top Bar ──────────────────────────────────────────── */}
        <div className="min-h-[88px] bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-blue-100/50 dark:border-slate-800/80 flex items-center px-4 md:px-8 pt-4 pb-2 sticky top-0 z-20 gap-3 shadow-[0_4px_24px_-12px_rgba(37,99,235,0.08)] dark:shadow-none transition-colors duration-300">
          {/* Hamburger - mobile only */}
          <button
            className="md:hidden p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-200 transition-colors shrink-0"
            onClick={() => setMobileNavOpen(true)}
            aria-label="Open navigation menu"
          >
            <Menu size={22} />
          </button>

          {/* Brand - mobile only */}
          <div className="md:hidden flex items-center gap-2 flex-1">
            <div className="relative w-7 h-7 rounded-lg overflow-hidden flex-shrink-0 border border-slate-200 dark:border-slate-700 shadow-sm bg-white">
              <Image src="/logo.png" alt="Rahimullah Advocate Logo" fill className="object-contain p-0.5" sizes="28px" />
            </div>
            <span className="text-blue-600 font-bold text-sm tracking-wider leading-none">
              Rahimullah Advocate
            </span>
          </div>

          {/* Page context - desktop */}
          <div className="hidden md:flex flex-col flex-1 ml-4">
            <h2 className="text-[1.1rem] font-bold text-slate-900 dark:text-white flex items-center gap-2 transition-colors">
              Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 18 ? 'Afternoon' : 'Evening'}, {user.username ? user.username.charAt(0).toUpperCase() + user.username.slice(1) : 'Admin'} <span className="text-xl">👋</span>
            </h2>
            <p className="text-[13px] text-slate-500 dark:text-slate-400 font-medium mt-0.5 transition-colors">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>

          {/* Search & Actions */}
          <div className="flex items-center gap-3">
            <div className="relative hidden lg:block mr-2">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={16} />
              <input type="text" placeholder="Search anything..." className="pl-10 pr-4 py-2.5 w-[280px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:focus:border-blue-400 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500 shadow-sm" />
            </div>
            


            <button 
              onClick={() => router.push('/calendar')}
              className="p-2.5 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl transition-colors relative border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm mr-2"
              title="Calendar"
            >
              <CalendarDays size={20} />
            </button>

            <button 
              onClick={toggleTheme}
              className="p-2.5 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl transition-colors relative border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm mr-2"
              title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {isDark ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            {/* Notifications Dropdown */}
            <div className="relative shrink-0" ref={notificationsRef}>
              <button 
                onClick={() => setNotificationsOpen(prev => !prev)}
                className={`p-2.5 text-slate-600 dark:text-slate-300 rounded-xl transition-colors relative border shadow-sm ${notificationsOpen ? 'bg-slate-50 dark:bg-slate-700 border-blue-200 dark:border-slate-600 shadow-blue-100 dark:shadow-none' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'} mr-2`}
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[11px] font-bold text-white shadow-sm border-[2px] border-white">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
              
              {notificationsOpen && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="flex justify-between items-center px-4 py-2 border-b border-slate-50 dark:border-slate-700/50 mb-2">
                    <h3 className="font-bold text-slate-900 dark:text-white">Notifications</h3>
                    {unreadCount > 0 && (
                      <button onClick={markAllAsRead} className="text-xs font-semibold text-blue-600 hover:text-blue-700">Mark all as read</button>
                    )}
                  </div>
                  <div className="flex flex-col max-h-[350px] overflow-y-auto px-2 custom-scrollbar">
                    {notifications.length === 0 ? (
                      <div className="p-4 text-center text-sm text-slate-500 font-medium">No notifications</div>
                    ) : (
                      notifications.map((n) => (
                        <div key={n.id} onClick={() => markAsRead(n.id, n.is_read)} className={`flex gap-3 p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer ${!n.is_read ? 'bg-blue-50/50 dark:bg-blue-900/20' : ''}`}>
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                            n.type === 'warning' ? 'bg-amber-50 dark:bg-amber-900/30 text-amber-500' :
                            n.type === 'error' ? 'bg-rose-50 dark:bg-rose-900/30 text-rose-500' :
                            n.type === 'success' ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-500' :
                            'bg-blue-50 dark:bg-blue-900/30 text-blue-500'
                          }`}>
                            <Bell size={16} />
                          </div>
                          <div className="flex-1">
                            <p className={`text-sm leading-tight mb-0.5 ${!n.is_read ? 'font-bold text-slate-900 dark:text-white' : 'font-semibold text-slate-700 dark:text-slate-300'}`}>{n.title}</p>
                            <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">{n.message}</p>
                          </div>
                          <span className="text-[10px] font-semibold text-slate-400 mt-0.5 shrink-0">
                            {new Date(n.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── Profile Dropdown ─────────────────────────────── */}
          <div className="relative shrink-0" ref={profileRef}>
            <button
              onClick={() => setProfileOpen(prev => !prev)}
              className="flex items-center gap-2.5 pl-3 pr-2.5 py-1.5 rounded-xl border border-blue-100 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-blue-50/50 dark:hover:bg-slate-700 transition-all duration-200 shadow-[0_2px_8px_rgba(0,0,0,0.02)] dark:shadow-none"
              id="profile-menu-button"
            >
              {/* Avatar */}
              <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-blue-200/60 shrink-0 shadow-inner relative bg-blue-600 flex items-center justify-center text-white font-bold text-sm">
                {user.username?.[0]?.toUpperCase() || 'U'}
                {user.avatar && (
                  <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover absolute inset-0 bg-white" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                )}
              </div>
              {/* Name + Role */}
              <div className="hidden sm:block text-left mr-2">
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight font-medium uppercase tracking-wider mb-0.5">{user.role}</p>
                <p className="text-sm font-bold text-slate-900 dark:text-white leading-tight max-w-[120px] truncate">
                  {user.username ? user.username.charAt(0).toUpperCase() + user.username.slice(1) : ''}
                </p>
              </div>
              <ChevronDown
                size={16}
                className={`text-slate-400 transition-transform duration-200 ${profileOpen ? 'rotate-180' : ''}`}
              />
            </button>

            {/* Dropdown */}
            {profileOpen && (
              <div className="absolute right-0 top-full mt-2 w-52 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-100 dark:border-slate-700 py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                {/* User info header */}
                <div className="px-4 py-2.5 border-b border-slate-100 dark:border-slate-700/50 mb-1">
                  <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                    {user.username ? user.username.charAt(0).toUpperCase() + user.username.slice(1) : ''}
                  </p>
                  {user.email && (
                    <p className="text-xs text-slate-400 dark:text-slate-500 truncate mt-0.5">{user.email}</p>
                  )}
                </div>
                <Link
                  href="/settings/profile"
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-3 px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-700 dark:hover:text-blue-400 transition-colors"
                >
                  <UserCircle size={16} />
                  My Profile
                </Link>
                <div className="border-t border-slate-100 dark:border-slate-700/50 mt-1 pt-1">
                  <button
                    onClick={() => { setProfileOpen(false); logout(); }}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-rose-50 dark:hover:bg-rose-900/20 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                    id="logout-button"
                  >
                    <LogOut size={16} />
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Page Content */}
        <div className="p-4 sm:p-6 lg:p-8 w-full max-w-[1600px] mx-auto">
          {children}
        </div>
      </main>
      </UIProvider>
    </div>
  );
}
