'use client';
// We connect directly to the API server to completely avoid Next.js proxy/rewrite trailing-slash normalizations.
export const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

// ── CSRF helper ───────────────────────────────────────────────────────────────
/**
 * Django sets a readable `csrftoken` cookie that the browser can access via
 * document.cookie.  We read it here and inject it as the `X-CSRFToken` header
 * on every mutating request so Django's CsrfViewMiddleware is satisfied.
 * (The httpOnly JWT cookies are NOT readable — that's the whole point.)
 */
function getCsrfToken(): string {
  if (typeof document === 'undefined') return '';
  const match = document.cookie.match(/(?:^|;\s*)csrftoken=([^;]+)/);
  return match ? match[1] : '';
}

// ── Core fetch wrapper ────────────────────────────────────────────────────────
/**
 * Drop-in replacement for fetch() that:
 *  1. Sends credentials (JWT httpOnly cookie) automatically via `credentials: 'include'`
 *  2. Injects X-CSRFToken on mutating requests so Django's CSRF middleware is happy
 *  3. Redirects to /login on 401 (expired/invalid token)
 *
 * Note: No localStorage involved — tokens live only in httpOnly cookies.
 */
export async function apiFetch(url: string, options: RequestInit = {}) {
  const method = (options.method || 'GET').toUpperCase();
  const isMutating = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);

  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
    ...(isMutating ? { 'X-CSRFToken': getCsrfToken() } : {}),
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
