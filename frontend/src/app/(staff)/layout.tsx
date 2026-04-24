'use client';

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import { Menu } from 'lucide-react';
import Navigation from '@/components/Navigation';
import { useAuth } from '@/context/AuthContext';

export default function StaffLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { loading, user } = useAuth();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-50">
        <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  // If on login page or root (which redirects), just render children
  if (pathname === '/login' || pathname === '/') {
    return <>{children}</>;
  }

  // Block clients from StaffLayout
  if (!user || user.role === 'Client') {
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
    return null;
  }

  return (
    <div className="flex h-screen overflow-hidden w-full">
      <Navigation
        mobileOpen={mobileNavOpen}
        onCloseMobile={() => setMobileNavOpen(false)}
      />
      <main className="flex-1 flex flex-col overflow-y-auto relative bg-slate-50 min-w-0">
        {/* Top Bar */}
        <div className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center px-4 md:px-8 sticky top-0 z-10 gap-3">
          {/* Hamburger - mobile only */}
          <button
            className="md:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors shrink-0"
            onClick={() => setMobileNavOpen(true)}
            aria-label="Open navigation menu"
          >
            <Menu size={22} />
          </button>
          {/* Brand - mobile only */}
          <span className="md:hidden text-blue-600 font-bold text-base tracking-wider flex-1">LAW SUIT</span>
          {/* Role info - desktop */}
          <h2 className="hidden md:block text-slate-800 font-semibold">
            Legal Operations | <span className="text-blue-600 font-bold">{user.role}</span>
          </h2>
        </div>
        {/* Page Content */}
        <div className="p-4 sm:p-6 lg:p-8 w-full max-w-[1600px] mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}

