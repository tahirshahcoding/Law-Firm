'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Navigation from '@/components/Navigation';
import { AuthProvider, useAuth } from '@/context/AuthContext';

export default function StaffLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { loading, user } = useAuth();

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

  // If not logged in or is a Client, redirect (Wait, handled by route protection in components, but let's just block clients from StaffLayout)
  if (!user || user.role === 'Client') {
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
    return null;
  }

  return (
    <div className="flex h-screen overflow-hidden w-full">
      <Navigation />
      <main className="flex-1 flex flex-col overflow-y-auto relative bg-slate-50">
        <div className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center px-8 sticky top-0 z-10">
          <h2 className="text-slate-800 font-semibold">Legal Operations | <span className="text-blue-600 font-bold">{user.role}</span></h2>
        </div>
        <div className="p-8 w-full max-w-[1600px] mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
