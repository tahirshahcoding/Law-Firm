'use client';

import React, { useState, useRef, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Menu, LogOut, UserCircle, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import CommandPalette from '@/components/CommandPalette';
import QuickAddModal from '@/components/QuickAddModal';
import { useAuth } from '@/context/AuthContext';
import { AppShellSkeleton } from '@/components/SkeletonLoaders';
import { Toaster } from 'sonner';
import Image from 'next/image';

export default function StaffLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { loading, user, logout } = useAuth();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
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
    <div className="flex h-screen overflow-hidden w-full">
      <Toaster theme="dark" position="bottom-right" />
      <CommandPalette />
      <QuickAddModal />
      <Navigation
        mobileOpen={mobileNavOpen}
        onCloseMobile={() => setMobileNavOpen(false)}
      />
      <main className="flex-1 flex flex-col overflow-y-auto relative bg-slate-50 min-w-0">
        {/* ── Top Bar ──────────────────────────────────────────── */}
        <div className="h-16 bg-white/90 backdrop-blur-md border-b border-slate-200 flex items-center px-4 md:px-8 sticky top-0 z-20 gap-3">
          {/* Hamburger - mobile only */}
          <button
            className="md:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors shrink-0"
            onClick={() => setMobileNavOpen(true)}
            aria-label="Open navigation menu"
          >
            <Menu size={22} />
          </button>

          {/* Brand - mobile only */}
          <div className="md:hidden flex items-center gap-2 flex-1">
            <div className="relative w-7 h-7 rounded-lg overflow-hidden flex-shrink-0 border border-slate-200 shadow-sm">
              <Image src="/logo.png" alt="Rahimullah Advocate Logo" fill className="object-cover scale-[1.15]" sizes="28px" />
            </div>
            <span className="text-blue-600 font-bold text-sm tracking-wider leading-none">
              Rahimullah Advocate
            </span>
          </div>

          {/* Page context - desktop */}
          <h2 className="hidden md:block text-slate-800 font-semibold flex-1">
            Legal Operations | <span className="text-blue-600 font-bold">{user.role}</span>
          </h2>

          {/* ── Profile Dropdown ─────────────────────────────── */}
          <div className="relative shrink-0" ref={profileRef}>
            <button
              onClick={() => setProfileOpen(prev => !prev)}
              className="flex items-center gap-2.5 pl-3 pr-2.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 transition-all duration-200 shadow-sm"
              id="profile-menu-button"
            >
              {/* Avatar */}
              <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-blue-100 shrink-0">
                {user.avatar ? (
                  <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm">
                    {user.username?.[0]?.toUpperCase() || 'U'}
                  </div>
                )}
              </div>
              {/* Name + Role */}
              <div className="hidden sm:block text-left">
                <p className="text-sm font-semibold text-slate-800 leading-tight max-w-[120px] truncate">
                  {user.username}
                </p>
                <p className="text-xs text-slate-400 leading-tight">{user.role}</p>
              </div>
              <ChevronDown
                size={16}
                className={`text-slate-400 transition-transform duration-200 ${profileOpen ? 'rotate-180' : ''}`}
              />
            </button>

            {/* Dropdown */}
            {profileOpen && (
              <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-xl shadow-lg border border-slate-100 py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                {/* User info header */}
                <div className="px-4 py-2.5 border-b border-slate-100 mb-1">
                  <p className="text-sm font-bold text-slate-900 truncate">{user.username}</p>
                  {user.email && (
                    <p className="text-xs text-slate-400 truncate mt-0.5">{user.email}</p>
                  )}
                </div>
                <Link
                  href="/settings/profile"
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-3 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                >
                  <UserCircle size={16} />
                  My Profile
                </Link>
                <div className="border-t border-slate-100 mt-1 pt-1">
                  <button
                    onClick={() => { setProfileOpen(false); logout(); }}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-rose-50 hover:text-rose-600 transition-colors"
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
    </div>
  );
}
