import { NextRequest } from 'next/server';

// Replace with your actual Hugging Face Space direct URL
const HF_BASE_URL = 'https://tahirshahcoding-law-firm.hf.space/api';

async function handleProxy(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
    // 1. Reconstruct the target path and query parameters
    const resolvedParams = await params;
    const path = resolvedParams.path?.join('/') || '';
    const url = new URL(request.url);
    const targetUrl = `${HF_BASE_URL}/${path}${url.search}`;

    // 2. Clone headers and sanitize them for the external proxy
    const headers = new Headers(request.headers);
    
    // CRITICAL: Delete origin, host, and referer. 
    // This forces the fetch API to generate new ones matching the HF domain,
    // preventing Hugging Face's Traefik proxy from dropping the request (which causes the 404s).
    headers.delete('host');
    headers.delete('origin');
    headers.delete('referer');

    try {
        // 3. Forward the request to Django
        const response = await fetch(targetUrl, {
            method: request.method,
            headers,
            // Only attach body for methods that support it
            body: ['GET', 'HEAD'].includes(request.method) ? undefined : await request.text(),
            // Ensure we don't automatically follow redirects if Django sends them
            redirect: 'manual', 
        });

        // 4. Return the exact response from Django to the browser
        // This automatically includes the Set-Cookie header containing your HttpOnly JWT
        return new Response(response.body, {
            status: response.status,
            statusText: response.statusText,
            headers: response.headers,
        });
        
    } catch (error) {
        console.error('Proxy Error:', error);
        return new Response(JSON.stringify({ error: 'Proxy failed' }), {
            status: 502,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}

// Export the handler for all necessary HTTP methods
export const GET = handleProxy;
export const POST = handleProxy;
export const PUT = handleProxy;
export const PATCH = handleProxy;
export const DELETE = handleProxy;
export const OPTIONS = handleProxy;
