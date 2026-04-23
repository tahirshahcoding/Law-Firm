'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, FolderOpen, Calendar, Gavel, CircleDollarSign, Settings } from 'lucide-react';

import { useAuth } from '@/context/AuthContext';

export default function Navigation() {
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

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex-col hidden md:flex z-10 shadow-sm">
      <div className="h-16 flex items-center px-6 border-b border-slate-100">
        <h1 className="text-blue-600 font-bold text-lg tracking-wider">LAW SUIT</h1>
      </div>
      <nav className="flex-1 py-6 flex flex-col gap-2 px-4">
        {filteredNavItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          
          return (
            <Link 
              key={item.href} 
              href={item.href} 
              className={`flex items-center gap-3 px-3 py-2 rounded-lg font-medium transition-all duration-200 ${
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
      <div className="p-4 border-t border-slate-100">
        {user?.role === 'Admin' && (
          <Link 
            href="/settings/users" 
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
            window.location.href = '/login'; // Redirect to staff login
          }}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg font-medium text-slate-500 hover:bg-slate-50 hover:text-rose-600 transition-all duration-200 mt-2"
        >
          Logout
        </button>
      </div>
    </aside>
  );
}
