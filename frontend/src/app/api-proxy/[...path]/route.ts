import { NextRequest, NextResponse } from 'next/server';

// CRITICAL: Prevent Next.js from caching these proxy requests
export const dynamic = 'force-dynamic';

// In production, forward to HF Space. In local dev, forward to local Django.
// This is critical: the browser must always talk to localhost:3000 (same-origin via this proxy)
// so that SameSite=Lax cookies set by Django are correctly sent on follow-up requests.
// Direct cross-origin calls (localhost:3000 → 127.0.0.1:8000) break cookie auth.
const IS_LOCAL_DEV = process.env.NODE_ENV === 'development';
const LOCAL_BASE_URL = process.env.LOCAL_API_URL || 'http://127.0.0.1:8000/api';
const HF_BASE_URL = 'https://tahirshahcoding-law-firm.hf.space/api';
const UPSTREAM_BASE = IS_LOCAL_DEV ? LOCAL_BASE_URL : HF_BASE_URL;

async function handleProxy(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
    const resolvedParams = await params;
    const path = resolvedParams.path ? resolvedParams.path.join('/') : '';
    const url = new URL(request.url);

    const formattedPath = path.endsWith('/') ? path : (path ? `${path}/` : '');
    const targetUrl = `${UPSTREAM_BASE}/${formattedPath}${url.search}`;

    const headers = new Headers(request.headers);

    // Note: X-CSRFToken injection is no longer needed here since we dropped cookie-based
    // CSRF for the API in favor of strict CORS allowed origins (Option B architecture).

    if (IS_LOCAL_DEV) {
        // Inject trusted Origin + Referer so Django's CSRF middleware accepts the request.
        // Server-to-server fetch() has no Referer by default → "no Referer" CSRF failure.
        // http://localhost:3000 is in CSRF_TRUSTED_ORIGINS so Django will accept it.
        headers.set('origin', 'http://localhost:3000');
        headers.set('referer', 'http://localhost:3000/');
        headers.set('host', '127.0.0.1:8000');
    } else {
        // Production (HF Space): strip headers that trigger HF ingress rejection
        headers.delete('host');
        headers.delete('origin');
        headers.delete('referer');
    }

    try {
        const response = await fetch(targetUrl, {
            method: request.method,
            headers,
            body: ['GET', 'HEAD'].includes(request.method) ? undefined : await request.arrayBuffer(),
            redirect: 'manual',
        });

        // ── Fix 2: Forward ALL Set-Cookie headers, not just the first ────────
        // Django sends SEPARATE Set-Cookie headers for: access_token, refresh_token, csrftoken.
        // response.headers.get('set-cookie') merges them into ONE comma-joined string,
        // then responseHeaders.set('set-cookie', ...) drops all but the first.
        // Result: browser never receives csrftoken cookie → every POST gets 403.
        // Fix: use getSetCookie() which returns a proper array of all Set-Cookie values.
        const nextResponse = new NextResponse(response.body, {
            status: response.status,
            statusText: response.statusText,
        });

        // Copy all response headers except set-cookie (handled separately below)
        response.headers.forEach((value, key) => {
            if (key.toLowerCase() !== 'set-cookie') {
                nextResponse.headers.set(key, value);
            }
        });

        // Re-attach each cookie individually, stripping Domain so browser stores
        // them under the frontend's domain (localhost:3000 in dev, vercel.app in prod)
        const allSetCookies = response.headers.getSetCookie?.() ?? [];
        for (const cookie of allSetCookies) {
            const cleaned = cookie.replace(/Domain=[^;]+;?\s*/gi, '');
            nextResponse.headers.append('set-cookie', cleaned);
        }

        return nextResponse;

    } catch (error) {
        console.error('Proxy Error:', error);
        return new NextResponse(JSON.stringify({ error: 'Upstream connection failed' }), {
            status: 502,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}

export const GET = handleProxy;
export const POST = handleProxy;
export const PUT = handleProxy;
export const PATCH = handleProxy;
export const DELETE = handleProxy;
export const OPTIONS = handleProxy;
