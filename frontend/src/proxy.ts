import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Paths that don't require authentication
  const publicPaths = ['/login', '/_next', '/favicon.ico', '/api/', '/home'];

  // Check if it's a public path
  if (publicPaths.some(p => pathname.startsWith(p)) || pathname === '/') {
    return NextResponse.next();
  }

  // Check for the access_token cookie
  const token = request.cookies.get('access_token')?.value;

  if (!token) {
    // Redirect to login if not authenticated
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
