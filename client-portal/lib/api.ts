'use client';

let apiBase = 'http://localhost:8000/api';

if (typeof window !== 'undefined') {
  const hostname = window.location.hostname;
  const isLocal = hostname === 'localhost' || hostname === '127.0.0.1' || hostname.startsWith('192.168.');
  
  if (!isLocal) {
    // Production API server
    apiBase = process.env.NEXT_PUBLIC_API_URL || 'https://tahirshahcoding-law-firm.hf.space/api';
  } else {
    // Local dev API server
    apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
  }
} else {
  // Server-side rendering (SSR) fallback
  apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
}

// Clean trailing slashes and ensure /api
if (apiBase.endsWith('/')) apiBase = apiBase.slice(0, -1);
if (!apiBase.endsWith('/api')) apiBase += '/api';

export const API_BASE = apiBase;
