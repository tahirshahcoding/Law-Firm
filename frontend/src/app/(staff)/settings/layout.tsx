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
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-sm text-slate-500 mt-1">Manage your account preferences, firm settings, and system configurations.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-8 items-start">
        {/* Navigation Sidebar */}
        <nav className="w-full md:w-64 shrink-0 bg-white border border-slate-200 rounded-2xl p-3 shadow-sm sticky top-24">
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
                        ? 'bg-blue-50 text-blue-700 shadow-sm shadow-blue-100' 
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <Icon size={18} className={isActive ? 'text-blue-600' : 'text-slate-400'} />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Content Area */}
        <div className="flex-1 w-full min-w-0">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
