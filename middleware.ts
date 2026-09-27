import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import {
  verifyAdminToken,
  verifyClientToken,
  ADMIN_COOKIE_NAME,
  CLIENT_COOKIE_NAME,
} from './lib/tokens';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Admin Route Protection
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

  // 2. Client Portal Route Protection (Scoped to Gallery session)
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

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin', '/admin/:path*', '/portal', '/portal/:path*'],
};
