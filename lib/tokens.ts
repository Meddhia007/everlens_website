import { SignJWT, jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.AUTH_SECRET || 'everlens-weddings-secure-jwt-secret-key-2025-token'
);

export const ADMIN_COOKIE_NAME = 'everlens_admin_token';
export const CLIENT_COOKIE_NAME = 'everlens_client_token';
export const GUEST_COOKIE_NAME = 'everlens_guest_token';

export interface AdminTokenPayload {
  sub: string;
  email: string;
  role: 'admin';
}

export interface ClientTokenPayload {
  sub: string;
  galleryId: string;
  clientEmail: string;
  coupleNames: string;
  role: 'client';
}

export interface GuestTokenPayload {
  sub: string;
  galleryId: string;
  guestLinkToken: string;
  role: 'guest';
}

export const ADMIN_COOKIE_MAX_AGE = 2 * 60 * 60; // 2 hours
export const CLIENT_COOKIE_MAX_AGE = 30 * 24 * 60 * 60; // 30 days
export const GUEST_COOKIE_MAX_AGE = 24 * 60 * 60; // 24 hours

// Admin Token Signing & Verification (Edge & Node compatible)
// Admin session hardened to 2 hours maximum lifetime
export async function signAdminToken(payload: AdminTokenPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('2h')
    .sign(JWT_SECRET);
}

export async function verifyAdminToken(token: string): Promise<AdminTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    if (payload.role !== 'admin') return null;
    return payload as unknown as AdminTokenPayload;
  } catch {
    return null;
  }
}

// Client Token Signing & Verification (Scoped to galleryId, Edge & Node compatible)
export async function signClientToken(payload: ClientTokenPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(JWT_SECRET);
}

export async function verifyClientToken(token: string): Promise<ClientTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    if (payload.role !== 'client' || !payload.galleryId) return null;
    return payload as unknown as ClientTokenPayload;
  } catch {
    return null;
  }
}

// Guest Token Signing & Verification (Scoped to galleryId and guestLinkToken)
export async function signGuestToken(payload: GuestTokenPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(JWT_SECRET);
}

export async function verifyGuestToken(token: string): Promise<GuestTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    if (payload.role !== 'guest' || !payload.galleryId) return null;
    return payload as unknown as GuestTokenPayload;
  } catch {
    return null;
  }
}
