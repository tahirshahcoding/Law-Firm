'use client';

import { API_BASE, apiFetch } from '@/lib/api';
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

type UserProfile = {
  id: number;
  username: string;
  email: string;
  role: string;
  permissions: any;
  avatar: string | null;
};

type AuthContextType = {
  user: UserProfile | null;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const router   = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Use plain fetch (not apiFetch) so the 401→/login redirect never fires
        // during the silent session-restore at startup. The route guard below
        // handles the redirect once loading is complete.
        const res = await fetch(`${API_BASE}/users/me/`, {
          credentials: 'include',
        });
        if (res.ok) {
          const userData = await res.json();
          // Block client accounts from accessing the staff system
          if (userData.role === 'Client') {
            // Clear the server-side cookie and let the route guard redirect
            await fetch(`${API_BASE}/auth/logout/`, {
              method: 'POST',
              credentials: 'include',
            });
          } else {
            setUser(userData);
          }
        }
        // Non-200 responses (401, 403, etc.) are handled silently here —
        // the route guard useEffect below redirects to /login once loading=false.
      } catch {
        // Backend unreachable — silently stay logged out, don't crash
        console.warn('Auth check skipped: backend unreachable');
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  // ── Route guard ───────────────────────────────────────────────────────────
  useEffect(() => {
    const isPublicPath = pathname === '/home' || pathname.startsWith('/portal');
    if (!loading && !isPublicPath) {
      if (!user && pathname !== '/login') {
        router.push('/login');
      } else if (user && pathname === '/login') {
        router.push('/dashboard');
      }
    }
  }, [user, loading, pathname, router]);

  // ── login — called after the POST to /api/token/ succeeds ────────────────
  // The Django login view has already set the httpOnly cookies at this point.
  // We just need to fetch the user profile to populate the context.
  const login = async () => {
    const res = await apiFetch(`${API_BASE}/users/me/`);
    if (res.ok) {
      const userData = await res.json();
      // Block client accounts from accessing the staff system — same guard as checkAuth.
      if (userData.role === 'Client') {
        await apiFetch(`${API_BASE}/auth/logout/`, { method: 'POST' });
        return;
      }
      setUser(userData);
      router.push('/dashboard');
    }
  };

  // ── logout — clears cookies server-side, then clears local state ──────────
  const logout = async () => {
    try {
      await apiFetch(`${API_BASE}/auth/logout/`, { method: 'POST' });
    } catch {
      // Even if the request fails, clear local state so the UI logs out
    }
    
    // Clear Service Worker caches (NetworkFirst cached responses like cases, tasks)
    if (typeof window !== 'undefined' && 'caches' in window) {
      try {
        const cacheKeys = await caches.keys();
        await Promise.all(cacheKeys.map(key => caches.delete(key)));
      } catch (e) {
        console.error('Failed to clear caches', e);
      }
    }
    
    setUser(null);
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
