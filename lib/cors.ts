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

  // 3. Vercel deployment variables (automatically provided by Vercel platform)
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    allowed.add(`https://${process.env.VERCEL_PROJECT_PRODUCTION_URL.replace(/\/$/, '')}`);
  }
  if (process.env.VERCEL_URL) {
    allowed.add(`https://${process.env.VERCEL_URL.replace(/\/$/, '')}`);
  }

  // 4. Local development origins (only outside of production)
  if (process.env.NODE_ENV !== 'production') {
    allowed.add('http://localhost:3000');
    allowed.add('http://127.0.0.1:3000');
  }

  return Array.from(allowed);
}

/**
 * Checks whether an incoming request origin matches the whitelist or same-host origin.
 */
export function isOriginAllowed(
  origin: string | null | undefined,
  requestOrHost?: NextRequest | string | null
): boolean {
  if (!origin) return false;

  try {
    const originUrl = new URL(origin);

    // 1. Same-Origin Check: If request is from the same host, always permit it
    if (requestOrHost) {
      let host: string | null = null;
      if (typeof requestOrHost === 'string') {
        host = requestOrHost;
      } else if ('headers' in requestOrHost) {
        host =
          requestOrHost.headers.get('x-forwarded-host') ||
          requestOrHost.headers.get('host');
      }

      if (host) {
        const hostWithoutPort = host.split(':')[0];
        if (originUrl.host === host || originUrl.hostname === hostWithoutPort) {
          return true;
        }
      }
    }

    // 2. Vercel deployment domains (e.g. everlens-website.vercel.app, *.vercel.app)
    if (originUrl.hostname.endsWith('.vercel.app')) {
      return true;
    }

    // 3. Explicit whitelist
    const allowedOrigins = getAllowedOrigins();
    if (allowedOrigins.includes(origin) || allowedOrigins.includes(originUrl.origin)) {
      return true;
    }
  } catch {
    return false;
  }

  return false;
}

/**
 * Generates locked-down CORS response headers for an incoming request.
 * Returns empty headers or strict matched origin headers — NEVER '*'.
 */
export function getCorsHeaders(request: NextRequest): Record<string, string> {
  const origin = request.headers.get('origin');
  
  if (!origin || !isOriginAllowed(origin, request)) {
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

  if (!isOriginAllowed(origin, request)) {
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
