'use client';

// ── API Base URL ──────────────────────────────────────────────────────────────
// Priority: NEXT_PUBLIC_API_URL env var > runtime hostname heuristic > default
//
// IMPORTANT: If NEXT_PUBLIC_API_URL is set, it is used AS-IS (no /api appended).
// It should already include /api, e.g. https://example.com/api
// This prevents silent double-appending when the env var is already correct.
function buildApiBase(): string {
  // Always use the internal Next.js proxy — this is critical for cookie-based auth.
  // Cookies set by Django (SameSite=Lax) only get sent back by the browser on
  // same-origin requests. If we call 127.0.0.1:8000 directly from localhost:3000,
  // the browser treats it as cross-origin and drops the cookie on follow-up requests.
  // By always routing through /api-proxy (same origin as the frontend), cookies work
  // in both local dev and production.
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    // Only bypass proxy for non-local production where NEXT_PUBLIC_API_URL is set
    const envUrl = process.env.NEXT_PUBLIC_API_URL;
    if (envUrl && !envUrl.includes('hf.space')) {
      let url = envUrl.replace(/\/$/, '');
      if (!url.endsWith('/api')) url += '/api';
      return url;
    }
    return '/api-proxy';
  }

  // SSR fallback — used during server-side render/build only, not in browser.
  return 'http://127.0.0.1:8000/api';
}

export const API_BASE = buildApiBase();


// ── Core fetch wrapper ────────────────────────────────────────────────────────
/**
 * Drop-in replacement for fetch() that:
 *  1. Sends credentials (JWT httpOnly cookie) automatically via `credentials: 'include'`
 *  2. Redirects to /login on 401 (expired/invalid token)
 *
 * Note: No localStorage involved — tokens live only in httpOnly cookies.
 * CSRF is handled implicitly via strict CORS allowed origins (Option B architecture).
 */
export async function apiFetch(url: string, options: RequestInit = {}) {
  const method = (options.method || 'GET').toUpperCase();

  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include',  // sends the httpOnly access_token cookie
    });

    if (response.status === 401) {
      // Only redirect to login if we're not already there — prevents an infinite
      // reload loop when an unauthenticated user first opens the app.
      if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }

    return response;
  } catch (error: any) {
    // Catch network/connection offline exceptions to prevent UI crashes
    console.error('API fetch connection error:', error);

    // Construct a standard JSON Response mock so callers (e.g. safeJson or res.json()) don't crash
    const errorBody = {
      error: 'Network connection error.',
      detail: error?.message || 'Unable to connect to the server. Please check your network connection.',
      status_code: 503
    };

    return new Response(JSON.stringify(errorBody), {
      status: 503,
      statusText: 'Service Unavailable',
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// ── Safe JSON parser ──────────────────────────────────────────────────────────
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

/**
 * Format DRF validation errors or other error payloads into a clean, human-readable string.
 */
export function parseApiError(data: any): string {
  if (!data) return 'An unexpected error occurred.';
  if (typeof data === 'string') return data;
  
  if (data.detail && typeof data.detail === 'string') return data.detail;
  if (data.error && typeof data.error === 'string') return data.error;

  const errorObj = (data.error && typeof data.error === 'object') ? data.error : data;

  if (typeof errorObj === 'object') {
    const messages: string[] = [];
    for (const key in errorObj) {
      if (key === 'status_code') continue;
      const val = errorObj[key];
      const cleanKey = key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      
      if (Array.isArray(val)) {
        messages.push(`${cleanKey}: ${val.join(', ')}`);
      } else if (typeof val === 'object' && val !== null) {
        messages.push(`${cleanKey}: ${JSON.stringify(val)}`);
      } else {
        messages.push(`${cleanKey}: ${val}`);
      }
    }
    if (messages.length > 0) {
      return messages.join(' | ');
    }
  }
  return JSON.stringify(data);
}
