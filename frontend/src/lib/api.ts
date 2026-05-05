'use client';
// Central API config — reads from env var, falls back to localhost for dev
// Set NEXT_PUBLIC_API_URL in .env.local (dev) or Vercel dashboard (prod)
export const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

export async function apiFetch(url: string, options: RequestInit = {}) {
  const token = localStorage.getItem('access_token');

  const headers = {
    ...options.headers,
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };

  const response = await fetch(url, { ...options, headers });

  if (response.status === 401) {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    window.location.href = '/login';
  }

  return response;
}

/**
 * Safely parse a response as JSON.
 * If the server returns an HTML error page (e.g. 502/404 from a proxy),
 * this prevents the cryptic "Unexpected token '<'" crash.
 */
export async function safeJson(res: Response): Promise<any> {
  const contentType = res.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    const text = await res.text();
    throw new Error(`Server returned non-JSON response (${res.status}): ${text.slice(0, 120)}`);
  }
  return res.json();
}

