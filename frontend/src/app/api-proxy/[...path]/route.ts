import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = 'https://tahirshahcoding-law-firm.hf.space/api';

export async function GET(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxyRequest(req, await params);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxyRequest(req, await params);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxyRequest(req, await params);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxyRequest(req, await params);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxyRequest(req, await params);
}

export async function OPTIONS(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxyRequest(req, await params);
}

async function proxyRequest(req: NextRequest, params: { path: string[] }) {
  const path = params.path?.join('/') ?? '';
  const search = req.nextUrl.search ?? '';
  const targetUrl = `${BACKEND_URL}/${path}/${search}`;

  // Forward relevant headers but drop host/origin to avoid conflicts
  const forwardHeaders: Record<string, string> = {
    'Content-Type': req.headers.get('content-type') || 'application/json',
  };

  // Forward cookies so JWT auth works
  const cookie = req.headers.get('cookie');
  if (cookie) forwardHeaders['Cookie'] = cookie;

  // Forward CSRF token if present
  const csrf = req.headers.get('x-csrftoken');
  if (csrf) forwardHeaders['X-CSRFToken'] = csrf;

  let body: BodyInit | null = null;
  const method = req.method.toUpperCase();
  if (!['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    body = await req.text();
  }

  try {
    const backendRes = await fetch(targetUrl, {
      method,
      headers: forwardHeaders,
      body: body || undefined,
    });

    // Forward Set-Cookie headers from backend to client
    const responseHeaders = new Headers();
    const contentType = backendRes.headers.get('content-type');
    if (contentType) responseHeaders.set('Content-Type', contentType);

    // Forward ALL Set-Cookie headers (JWT tokens)
    backendRes.headers.forEach((value, key) => {
      if (key.toLowerCase() === 'set-cookie') {
        responseHeaders.append('Set-Cookie', value);
      }
    });

    const responseBody = await backendRes.text();

    return new NextResponse(responseBody, {
      status: backendRes.status,
      headers: responseHeaders,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: 'Proxy error', detail: err.message },
      { status: 502 }
    );
  }
}
