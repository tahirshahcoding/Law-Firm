'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, FolderOpen, Calendar, Gavel, CircleDollarSign, Settings, X } from 'lucide-react';

import { useAuth } from '@/context/AuthContext';

interface NavigationProps {
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export default function Navigation({ mobileOpen = false, onCloseMobile }: NavigationProps) {
  const pathname = usePathname();
  const { user } = useAuth();

  const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, requiredPermission: null },
    { name: 'Clients', href: '/clients', icon: Users, requiredPermission: 'manage_clients' },
    { name: 'Cases', href: '/cases', icon: FolderOpen, requiredPermission: 'manage_cases' },
    { name: 'Hearings', href: '/hearings', icon: Gavel, requiredPermission: 'manage_cases' },
    { name: 'Daily Diary', href: '/diary', icon: Calendar, requiredPermission: null },
    { name: 'Accounts', href: '/accounts', icon: CircleDollarSign, requiredPermission: 'manage_accounts' },
  ];

  const filteredNavItems = navItems.filter(item => {
    if (!item.requiredPermission) return true;
    if (user?.role === 'Admin') return true;
    return user?.permissions?.[item.requiredPermission] === true;
  });

  const SidebarContent = ({ onLinkClick }: { onLinkClick?: () => void }) => (
    <>
      <div className="h-16 flex items-center px-6 border-b border-slate-100 shrink-0">
        <h1 className="text-blue-600 font-bold text-lg tracking-wider">LAW SUIT</h1>
      </div>
      <nav className="flex-1 py-6 flex flex-col gap-1 px-4 overflow-y-auto">
        {filteredNavItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onLinkClick}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/20'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Icon size={20} /> {item.name}
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-slate-100 shrink-0">
        {user?.role === 'Admin' && (
          <Link
            href="/settings/users"
            onClick={onLinkClick}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg font-medium transition-all duration-200 mb-1 ${
              pathname === '/settings/users'
                ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/20'
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <Settings size={20} /> Admin Settings
          </Link>
        )}
        <Link
          href="/settings/profile"
          onClick={onLinkClick}
          className={`flex items-center gap-3 px-3 py-2 rounded-lg font-medium transition-all duration-200 mb-2 ${
            pathname === '/settings/profile'
              ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/20'
              : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
          }`}
        >
          <div className="w-5 h-5 flex items-center justify-center bg-slate-200 rounded-full text-[10px] font-bold text-slate-700">
            {user?.username?.[0]?.toUpperCase() || 'U'}
          </div>
          My Profile
        </Link>
        <button
          onClick={() => {
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            window.location.href = '/login';
          }}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg font-medium text-slate-500 hover:bg-slate-50 hover:text-rose-600 transition-all duration-200"
        >
          Logout
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex-col hidden md:flex z-10 shadow-sm shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm md:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Mobile Sidebar Drawer */}
      <aside
        className={`fixed top-0 left-0 h-full w-72 bg-white z-50 flex flex-col shadow-2xl transition-transform duration-300 ease-in-out md:hidden ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <button
          onClick={onCloseMobile}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          aria-label="Close menu"
        >
          <X size={20} />
        </button>
        <SidebarContent onLinkClick={onCloseMobile} />
      </aside>
    </>
  );
}

