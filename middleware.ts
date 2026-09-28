import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import {
  verifyAdminToken,
  verifyClientToken,
  ADMIN_COOKIE_NAME,
  CLIENT_COOKIE_NAME,
} from './lib/tokens';
import { handleCorsPreflight, isOriginAllowed } from './lib/cors';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Force HTTPS in production environments (e.g. Vercel / Cloudflare)
  if (process.env.NODE_ENV === 'production') {
    const proto = request.headers.get('x-forwarded-proto');
    const host = request.headers.get('host');
    if (proto === 'http' && host) {
      return NextResponse.redirect(
        `https://${host}${request.nextUrl.pathname}${request.nextUrl.search}`,
        301
      );
    }
  }

  // 1b. Strict CORS Lockdown for API routes
  if (pathname.startsWith('/api')) {
    if (request.method === 'OPTIONS') {
      return handleCorsPreflight(request);
    }

    const origin = request.headers.get('origin');
    if (origin && !isOriginAllowed(origin, request)) {
      return NextResponse.json(
        { error: 'CORS policy: Request origin is not allowed.' },
        { status: 403 }
      );
    }
  }

  // 2. Admin Route Protection
  if (pathname.startsWith('/admin')) {
    const isLoginPage = pathname === '/admin/login';
    const adminToken = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
    const verifiedAdmin = adminToken ? await verifyAdminToken(adminToken) : null;

    if (!verifiedAdmin) {
      if (!isLoginPage) {
        const loginUrl = new URL('/admin/login', request.url);
        loginUrl.searchParams.set('callbackUrl', pathname);
        return NextResponse.redirect(loginUrl);
      }
      return NextResponse.next();
    }

    // Already logged in as admin trying to access /admin/login
    if (isLoginPage) {
      return NextResponse.redirect(new URL('/admin', request.url));
    }

    return NextResponse.next();
  }

  // 3. Client Portal Route Protection (Scoped to Gallery session)
  if (pathname.startsWith('/portal')) {
    const isLoginPage = pathname === '/portal/login';
    const clientToken = request.cookies.get(CLIENT_COOKIE_NAME)?.value;
    const verifiedClient = clientToken ? await verifyClientToken(clientToken) : null;

    if (!verifiedClient) {
      if (!isLoginPage) {
        const loginUrl = new URL('/portal/login', request.url);
        loginUrl.searchParams.set('callbackUrl', pathname);
        return NextResponse.redirect(loginUrl);
      }
      return NextResponse.next();
    }

    // Already logged in as client trying to access /portal/login
    if (isLoginPage) {
      return NextResponse.redirect(new URL('/portal', request.url));
    }

    // Forward galleryId in request headers so Server Components / API handlers can read it
    const response = NextResponse.next();
    response.headers.set('x-gallery-id', verifiedClient.galleryId);
    response.headers.set('x-client-email', verifiedClient.clientEmail);
    return response;
  }

  const response = NextResponse.next();
  const origin = request.headers.get('origin');
  if (origin && isOriginAllowed(origin, request)) {
    response.headers.set('Access-Control-Allow-Origin', origin);
    response.headers.set('Access-Control-Allow-Credentials', 'true');
    response.headers.set('Vary', 'Origin');
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.svg, favicon.ico (favicon files)
     * - public assets
     */
    '/((?!_next/static|_next/image|favicon.svg|favicon.ico|portfolio|images|uploads).*)',
  ],
};
