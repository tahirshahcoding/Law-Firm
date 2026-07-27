import { cookies } from 'next/headers';

function getUpstreamBase(): string {
  const isLocalDev = process.env.NODE_ENV === 'development';
  if (isLocalDev) {
    return process.env.LOCAL_API_URL || 'http://127.0.0.1:8000/api';
  }
  const envUrl = process.env.NEXT_PUBLIC_API_URL || 'https://tahirshahcoding-law-firm.hf.space/api';
  let url = envUrl.replace(/\/$/, '');
  if (!url.endsWith('/api')) {
    url += '/api';
  }
  return url;
}

/**
 * Fetch dashboard stats server-side inside Next.js Server Components.
 * Passes the httpOnly JWT cookies from the incoming request directly to the backend.
 */
export async function getServerDashboardStats() {
  try {
    const cookieStore = await cookies();
    const cookieString = cookieStore.toString();

    if (!cookieString) {
      return null;
    }

    const res = await fetch(`${getUpstreamBase()}/dashboard/stats/`, {
      method: 'GET',
      headers: {
        'Cookie': cookieString,
        'Content-Type': 'application/json',
      },
      cache: 'no-store', // Always fetch fresh data on server render
    });

    if (!res.ok) {
      return null;
    }

    return await res.json();
  } catch (error) {
    console.error('Server-side dashboard stats fetch error:', error);
    return null;
  }
}
