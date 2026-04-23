'use client';

import { API_BASE } from '@/lib/api';
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

type UserProfile = {
  id: number;
  username: string;
  role: string;
  permissions: any;
};

type AuthContextType = {
  user: UserProfile | null;
  token: string | null;
  login: (access: string, refresh: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const checkAuth = async () => {
      const storedToken = localStorage.getItem('access_token');

      // No token stored — nothing to check, just finish loading
      if (!storedToken) {
        setLoading(false);
        return;
      }

      try {
        const res = await fetch('${API_BASE}/users/me/', {
          headers: { 'Authorization': `Bearer ${storedToken}` }
        });
        if (res.ok) {
          const userData = await res.json();
          // Block client accounts from using the staff system
          if (userData.role === 'Client') {
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
          } else {
            setUser(userData);
            setToken(storedToken);
          }
        } else {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
        }
      } catch (err) {
        // Backend unreachable — silently clear token, don't crash
        console.warn('Auth check skipped: backend unreachable');
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  useEffect(() => {
    // Redirect logic — only apply to staff routes, not public or portal routes
    const isPublicPath = pathname === '/home' || pathname.startsWith('/portal');
    if (!loading && !isPublicPath) {
      if (!user && pathname !== '/login') {
        router.push('/login');
      } else if (user && pathname === '/login') {
        router.push('/dashboard');
      }
    }
  }, [user, loading, pathname, router]);

  const login = async (access: string, refresh: string) => {
    localStorage.setItem('access_token', access);
    localStorage.setItem('refresh_token', refresh);
    
    // Fetch user profile immediately
    const res = await fetch('${API_BASE}/users/me/', {
      headers: {
        'Authorization': `Bearer ${access}`
      }
    });
    
    if (res.ok) {
      const userData = await res.json();
      setUser(userData);
      setToken(access);
      router.push('/dashboard');
    }
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setUser(null);
    setToken(null);
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
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
