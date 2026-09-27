import { NextRequest, NextResponse } from 'next/server';

/**
 * Retrieves the list of strictly allowed origins.
 * Wildcards (*) are completely forbidden for credentialed or studio resources.
 */
export function getAllowedOrigins(): string[] {
  const allowed = new Set<string>();

  // 1. Explicit ALLOWED_ORIGINS env variable (comma-separated)
  if (process.env.ALLOWED_ORIGINS) {
    process.env.ALLOWED_ORIGINS.split(',')
      .map((o) => o.trim())
      .filter(Boolean)
      .forEach((o) => allowed.add(o));
  }

  // 2. Production site URL
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    try {
      const url = new URL(process.env.NEXT_PUBLIC_SITE_URL);
      allowed.add(url.origin);
    } catch {
      allowed.add(process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, ''));
    }
  }

  // 3. Local development origins (only outside of production)
  if (process.env.NODE_ENV !== 'production') {
    allowed.add('http://localhost:3000');
    allowed.add('http://127.0.0.1:3000');
  }

  return Array.from(allowed);
}

/**
 * Checks whether an incoming request origin matches the whitelist.
 */
export function isOriginAllowed(origin: string | null | undefined): boolean {
  if (!origin) return false;
  const allowedOrigins = getAllowedOrigins();
  return allowedOrigins.includes(origin);
}

/**
 * Generates locked-down CORS response headers for an incoming request.
 * Returns empty headers or strict matched origin headers — NEVER '*'.
 */
export function getCorsHeaders(request: NextRequest): Record<string, string> {
  const origin = request.headers.get('origin');
  
  if (!origin || !isOriginAllowed(origin)) {
    return {};
  }

  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-r2-key',
    'Access-Control-Allow-Credentials': 'true',
    'Vary': 'Origin',
  };
}

/**
 * Handles CORS preflight OPTIONS requests securely.
 * Rejects disallowed origins with 403 Forbidden.
 */
export function handleCorsPreflight(request: NextRequest): NextResponse {
  const origin = request.headers.get('origin');

  if (!origin) {
    // Direct same-origin or non-browser request
    return new NextResponse(null, { status: 204 });
  }

  if (!isOriginAllowed(origin)) {
    return NextResponse.json(
      { error: 'CORS policy: Request origin is not allowed.' },
      { status: 403 }
    );
  }

  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-r2-key',
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Max-Age': '86400',
      'Vary': 'Origin',
    },
  });
}
