'use client';

let apiBase = 'http://localhost:8000/api';

if (typeof window !== 'undefined') {
  const hostname = window.location.hostname;
  
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api';
  } else if (hostname.startsWith('192.168.') || hostname.startsWith('10.')) {
    apiBase = process.env.NEXT_PUBLIC_API_URL || `http://${hostname}:8000/api`;
  } else {
    // Production API server
    apiBase = process.env.NEXT_PUBLIC_API_URL || 'https://api.rahimlawchamber.com/api';
  }
} else {
  // Server-side rendering (SSR) fallback
  apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
}

// Clean trailing slashes and ensure /api
if (apiBase.endsWith('/')) apiBase = apiBase.slice(0, -1);
if (!apiBase.endsWith('/api')) apiBase += '/api';

export const API_BASE = apiBase;

export function getCsrfToken(): string {
  if (typeof document === 'undefined') return '';
  const match = document.cookie.match(/(?:^|;\s*)csrftoken=([^;]+)/);
  return match ? match[1] : '';
}
