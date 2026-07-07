'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, FolderOpen, Calendar, Gavel, Coins, Settings, X, MessageSquare, Activity, CalendarDays } from 'lucide-react';
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

  const navItems = [
    { name: 'Dashboard',     href: '/dashboard',    icon: LayoutDashboard, always: true },
    { name: 'Clients',       href: '/clients',       icon: Users,           module: 'clients' },
    { name: 'Cases',         href: '/cases',         icon: FolderOpen,      module: 'cases' },
    { name: 'Hearings',      href: '/hearings',      icon: Gavel,           module: 'hearings' },
    { name: 'Daily Diary',   href: '/diary',         icon: Calendar,        module: 'diary' },
    { name: 'Cause List',    href: '/cause-list',    icon: CalendarDays,    module: 'cause_list' },
    { name: 'Accounts',      href: '/accounts',      icon: Coins,module: 'accounts' },
    { name: 'Consultations', href: '/consultations', icon: MessageSquare,   module: 'consultations' },
    // Audit Log: strictly Admin only, never shown by permissions matrix
    { name: 'Audit Log',     href: '/audit-log',     icon: Activity,        adminOnly: true },
  ];

  const filteredNavItems = navItems.filter(item => {
    if (item.always) return true;
    if (item.adminOnly) return user?.role === 'Admin';
    if (item.module) return canView(user, item.module);
    return true;
  });

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex-col hidden md:flex z-10 shadow-sm shrink-0">
        <SidebarContent filteredNavItems={filteredNavItems} pathname={pathname} user={user} />
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
        <SidebarContent onLinkClick={onCloseMobile} filteredNavItems={filteredNavItems} pathname={pathname} user={user} />
      </aside>
    </>
  );
}

interface SidebarContentProps {
  onLinkClick?: () => void;
  filteredNavItems: any[];
  pathname: string;
  user: any;
}

function SidebarContent({ onLinkClick, filteredNavItems, pathname, user }: SidebarContentProps) {
  return (
    <>
      <div className="h-16 flex items-center px-6 border-b border-slate-100 shrink-0 gap-2.5">
        <div className="relative w-8 h-8 rounded-lg overflow-hidden flex-shrink-0 border border-slate-200 shadow-sm">
          <Image src="/logo.png" alt="Rahimullah Advocate Logo" fill className="object-cover scale-[1.15]" sizes="32px" />
        </div>
        <h1 className="text-blue-600 font-bold text-base tracking-wider leading-none">
          Rahimullah Advocate
        </h1>
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

      {user?.role === 'Admin' && (
        <div className="px-4 pb-4 shrink-0">
          <Link
            href="/settings/users"
            onClick={onLinkClick}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-all duration-200 ${
              pathname === '/settings/users'
                ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/20'
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <Settings size={20} /> Admin Settings
          </Link>
        </div>
      )}
    </>
  );
}
