'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { API_BASE } from '@/lib/api';

export default function Sidebar() {
  const pathname = usePathname();
  const [unreadMessages, setUnreadMessages] = useState(0);

  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const res = await fetch(`${API_BASE}/dashboard/stats/`, {
          credentials: 'include'
        });
        const data = await res.json();
        if (data && data.unread_messages !== undefined) {
          setUnreadMessages(data.unread_messages);
        }
      } catch (err) {
        // silently fail
      }
    };
    fetchUnread();
    
    // Check every 30 seconds
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, []);

  const navItems = [
    { name: 'Dashboard', href: '/' },
    { name: 'Clients', href: '/clients' },
    { name: 'Cases', href: '/cases' },
    { name: 'Hearings', href: '/hearings' },
    { name: 'Deadlines', href: '/deadlines' },
    { name: 'Daily Diary', href: '/diary' },
    { name: 'Accounts', href: '/accounts' },
    { name: 'Messages', href: '/messages' },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200 dark:border-slate-700 min-h-screen flex flex-col transition-all duration-300">
      <div className="p-6">
        <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
          Legal Office
        </h2>
      </div>
      <nav className="flex-1 mt-6">
        <ul className="space-y-2 px-4">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={`flex items-center justify-between px-4 py-3 rounded-lg transition-all duration-200 ${
                    isActive
                      ? 'bg-blue-50 text-blue-600 font-medium'
                      : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:text-white'
                  }`}
                >
                  <span>{item.name}</span>
                  {item.name === 'Messages' && unreadMessages > 0 && (
                    <span className="bg-rose-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                      {unreadMessages > 99 ? '99+' : unreadMessages}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="p-4 border-t border-slate-200 dark:border-slate-700 text-sm text-slate-500 dark:text-slate-400 text-center">
        &copy; {new Date().getFullYear()} AOS
      </div>
    </aside>
  );
}
