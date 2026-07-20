'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { User, Shield, Users, Palette, Database } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const NAV_ITEMS = [
  { href: '/settings/profile', label: 'Profile', icon: User, showToAll: true },
  { href: '/settings/security', label: 'Security', icon: Shield, showToAll: true },
  { href: '/settings/appearance', label: 'Appearance', icon: Palette, showToAll: true },
  { href: '/settings/permissions', label: 'Permissions', icon: Users, adminOnly: true },
  { href: '/settings/backups', label: 'Backups', icon: Database, adminOnly: true },
];

export default function SettingsLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { user } = useAuth();
  
  const isAdmin = user?.role === 'Admin';

  const visibleItems = NAV_ITEMS.filter(item => item.showToAll || (item.adminOnly && isAdmin));

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-300">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Settings</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Manage your account preferences, firm settings, and system configurations.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-8 items-start">
        {/* Navigation Sidebar */}
        <nav className="w-full md:w-64 shrink-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 shadow-sm dark:shadow-none sticky top-24 transition-colors">
          <ul className="space-y-1">
            {visibleItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname.startsWith(item.href);
              
              return (
                <li key={item.href}>
                  <Link 
                    href={item.href}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                      isActive 
                        ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 shadow-sm shadow-blue-100 dark:shadow-none' 
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    <Icon size={18} className={isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'} />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Content Area */}
        <div className="flex-1 w-full min-w-0">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm dark:shadow-none transition-colors">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
