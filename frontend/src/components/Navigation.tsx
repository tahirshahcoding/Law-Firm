'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, FolderOpen, Calendar, Gavel, Coins, Settings, X, MessageSquare, Activity, CalendarDays, Scale, BookOpen, Receipt, CreditCard, CircleDollarSign, Clock } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import Image from 'next/image';

interface NavigationProps {
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

// Helper: check if user can view a module based on granular permissions
function canView(user: any, module: string): boolean {
  if (!user) return false;
  if (user.role === 'Admin') return true;
  // Granular permission check (new system)
  if (user.permissions?.[module]?.view === true) return true;
  // Legacy flat permission fallback
  if (module === 'clients' && user.permissions?.manage_clients) return true;
  if (module === 'cases' && user.permissions?.manage_cases) return true;
  if (module === 'accounts' && user.permissions?.manage_accounts) return true;
  return false;
}

export default function Navigation({ mobileOpen = false, onCloseMobile }: NavigationProps) {
  const pathname = usePathname();
  const { user } = useAuth();

  const navGroups = [
    {
      title: 'OPERATIONS',
      items: [
        { name: 'Clients', href: '/clients', icon: Users, module: 'clients' },
        { name: 'Cases', href: '/cases', icon: FolderOpen, module: 'cases' },
        { name: 'Hearings', href: '/hearings', icon: Gavel, module: 'hearings' },
        { name: 'Courts', href: '/courts', icon: Scale, adminOnly: true },
        { name: 'Judges', href: '/judges', icon: BookOpen, adminOnly: true },
        { name: 'Cause List', href: '/cause-list', icon: CalendarDays, module: 'cause_list' },
        { name: 'Daily Diary', href: '/diary', icon: Calendar, module: 'diary' },
      ]
    },
    {
      title: 'FINANCE & BILLING',
      items: [
        { name: 'Accounts', href: '/accounts', icon: Coins, module: 'accounts' },
        { name: 'Invoices', href: '/invoices', icon: Receipt, always: true },
        { name: 'Expenses', href: '/expenses', icon: CreditCard, always: true },
        { name: 'Revenue', href: '/revenue', icon: CircleDollarSign, always: true },
      ]
    },
    {
      title: 'SCHEDULING',
      items: [
        { name: 'Calendar', href: '/calendar', icon: CalendarDays, always: true },
        { name: 'Consultations', href: '/consultations', icon: MessageSquare, module: 'consultations' },
        { name: 'Deadlines', href: '/deadlines', icon: Clock, always: true },
      ]
    },
    {
      title: 'ADMINISTRATION',
      items: [
        { name: 'Permissions', href: '/settings/permissions', icon: Users, adminOnly: true },
        { name: 'Audit Logs', href: '/audit-log', icon: Activity, adminOnly: true },
        { name: 'Settings', href: '/settings', icon: Settings, adminOnly: true },
      ]
    }
  ];

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="w-[280px] bg-white border-r border-slate-200 flex-col hidden md:flex z-10 shadow-sm shrink-0">
        <SidebarContent navGroups={navGroups} pathname={pathname} user={user} />
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
        className={`fixed top-0 left-0 h-full w-[280px] bg-white z-50 flex flex-col shadow-2xl transition-transform duration-300 ease-in-out md:hidden ${mobileOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
      >
        <button
          onClick={onCloseMobile}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          aria-label="Close menu"
        >
          <X size={20} />
        </button>
        <SidebarContent onLinkClick={onCloseMobile} navGroups={navGroups} pathname={pathname} user={user} />
      </aside>
    </>
  );
}

interface SidebarContentProps {
  onLinkClick?: () => void;
  navGroups: any[];
  pathname: string;
  user: any;
}

function SidebarContent({ onLinkClick, navGroups, pathname, user }: SidebarContentProps) {
  const filterItems = (items: any[]) => items.filter(item => {
    if (item.always) return true;
    if (item.adminOnly) return user?.role === 'Admin';
    if (item.module) return canView(user, item.module);
    return true;
  });

  return (
    <div className="flex flex-col h-full bg-white border-r border-slate-200">
      {/* Brand / Logo Area */}
      <div className="h-[76px] flex items-center px-6 border-b border-slate-200 shrink-0 gap-3">
        <div className="relative w-8 h-8 flex-shrink-0">
          <Image src="/logo.png" alt="Rahimullah Advocate Logo" fill className="object-contain" sizes="32px" />
        </div>
        <div className="flex flex-col">
          <h1 className="text-slate-900 font-extrabold text-[15px] tracking-wide leading-tight uppercase">
            RAHIMULLAH
          </h1>
          <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500 mt-0.5">Advocate</span>
        </div>
      </div>

      {/* Main Navigation Items */}
      <nav className="flex-1 py-6 flex flex-col px-4 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
        <Link
          href="/dashboard"
          onClick={onLinkClick}
          className={`flex items-center gap-3.5 px-3.5 py-2.5 mb-6 rounded-lg font-medium transition-colors ${pathname === '/dashboard'
            ? 'bg-blue-600 text-white shadow-sm'
            : 'text-slate-600 hover:bg-slate-50 hover:text-blue-600'
            }`}
        >
          <LayoutDashboard size={20} />
          <span className="text-sm font-semibold">Dashboard</span>
        </Link>

        {navGroups.map((group, idx) => {
          const items = filterItems(group.items);
          if (items.length === 0) return null;
          return (
            <div key={group.title} className="mb-6 last:mb-0">
              <h3 className="px-3.5 mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                {group.title}
              </h3>
              <div className="flex flex-col gap-1">
                {items.map((item) => {
                  const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onLinkClick}
                      className={`flex items-center gap-3.5 px-3.5 py-2 rounded-lg font-medium transition-colors ${isActive
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                        }`}
                    >
                      <Icon size={18} className={isActive ? 'text-blue-600' : 'text-slate-400'} strokeWidth={2} />
                      <span className="text-sm">{item.name}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      {/* Bottom User Area */}
      {user && (
        <div className="p-4 shrink-0 border-t border-slate-200 bg-slate-50/50">
          <div className="flex items-center gap-3 px-2 py-1">
            <div className="w-10 h-10 rounded-full bg-blue-700 flex items-center justify-center text-white font-bold text-lg shrink-0">
              {user.username?.[0]?.toUpperCase() || 'A'}
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="text-sm font-bold text-slate-900 truncate">
                {user.username ? user.username.charAt(0).toUpperCase() + user.username.slice(1) : 'Admin'} {user.last_name || 'Admin'}
              </span>
              <span className="text-xs text-slate-500 truncate">
                {user.role === 'Admin' ? 'Super Administrator' : user.role}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
