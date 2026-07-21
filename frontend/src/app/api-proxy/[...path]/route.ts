import { NextRequest } from 'next/server';

// 1. CRITICAL: Prevent Next.js from caching these proxy requests
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
    // Reconstruct path, ensuring we handle root proxy calls safely
    const resolvedParams = await params;
    const path = resolvedParams.path ? resolvedParams.path.join('/') : '';
    const url = new URL(request.url);
    
    // Ensure Django's strict trailing slash requirement is met if targeting an API endpoint
    const formattedPath = path.endsWith('/') ? path : (path ? `${path}/` : '');
    const targetUrl = `${UPSTREAM_BASE}/${formattedPath}${url.search}`;

    const headers = new Headers(request.headers);
    
    // Strip original routing headers to bypass HF ingress rejection
    headers.delete('host');
    headers.delete('origin');
    headers.delete('referer');

    try {
        const response = await fetch(targetUrl, {
            method: request.method,
            headers,
            body: ['GET', 'HEAD'].includes(request.method) ? undefined : await request.arrayBuffer(),
            redirect: 'manual', 
        });

        // Create a new headers object to modify the response
        const responseHeaders = new Headers(response.headers);
        
        // 2. CRITICAL: Intercept and rewrite the Set-Cookie header
        const setCookieHeader = responseHeaders.get('set-cookie');
        if (setCookieHeader) {
            // Strip any explicit Domain attribute so the browser accepts it for the Vercel domain
            // Example transformation: "jwt=123; Domain=.hf.space; HttpOnly" -> "jwt=123; HttpOnly"
            const rewrittenCookie = setCookieHeader.replace(/Domain=[^;]+;?\s*/gi, '');
            responseHeaders.set('set-cookie', rewrittenCookie);
        }

        return new Response(response.body, {
            status: response.status,
            statusText: response.statusText,
            headers: responseHeaders,
        });
        
    } catch (error) {
        console.error('Advanced Proxy Error:', error);
        return new Response(JSON.stringify({ error: 'Upstream connection failed' }), {
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
