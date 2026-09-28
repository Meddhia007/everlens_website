import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Gallery } from '@/models/Gallery';
import { comparePassword, signClientToken, CLIENT_COOKIE_NAME } from '@/lib/auth';
import { checkRateLimit, recordFailedAttempt, clearRateLimit } from '@/lib/rate-limiter';
import { logAuditEvent } from '@/lib/audit';
import { sanitizeEmail } from '@/lib/security-sanitize';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const rawEmail = typeof body.email === 'string' ? body.email : '';
    const rawPassword = typeof body.password === 'string' ? body.password : '';

    const normalizedEmail = sanitizeEmail(rawEmail);
    if (!normalizedEmail || !rawPassword) {
      return NextResponse.json(
        { error: 'Email and password are required.' },
        { status: 400 }
      );
    }

    const rateLimitKey = `auth:client:${normalizedEmail}`;

    // 1. Rate Limiting Check: 5 attempts per 15 minutes per account
    const rateStatus = await checkRateLimit(rateLimitKey, 5);
    if (!rateStatus.allowed) {
      await logAuditEvent({
        who: normalizedEmail,
        role: 'client',
        action: 'client_login_rate_limited',
        status: 'failure',
        request,
      });

      return NextResponse.json(
        {
          error: `Too many login attempts. Please try again in ${rateStatus.remainingMinutes} minute(s).`,
        },
        { status: 429 }
      );
    }

    await connectToDatabase();
    const gallery = await Gallery.findOne({ clientEmail: normalizedEmail });

    // Consistent non-revealing check (prevents account enumeration)
    let isMatch = false;
    if (gallery) {
      isMatch = await comparePassword(rawPassword, gallery.passwordHash);
    }

    if (!gallery || !isMatch) {
      const failStatus = await recordFailedAttempt(rateLimitKey, 5, 15);

      await logAuditEvent({
        who: normalizedEmail,
        role: 'client',
        action: 'client_login',
        status: 'failure',
        request,
      });

      if (failStatus.lockedOut) {
        return NextResponse.json(
          {
            error: 'Too many failed login attempts. Access is locked for 15 minutes.',
          },
          { status: 429 }
        );
      }

      // Non-revealing error message: never confirm if account exists
      return NextResponse.json(
        { error: 'Invalid email or password.' },
        { status: 401 }
      );
    }

    // Check status & expiration after password verification
    if (gallery.status !== 'active') {
      return NextResponse.json(
        { error: `This gallery is currently ${gallery.status}. Please contact the studio.` },
        { status: 403 }
      );
    }

    if (gallery.expirationDate && new Date(gallery.expirationDate) < new Date()) {
      return NextResponse.json(
        { error: 'Gallery access has expired. Please contact the studio for renewal.' },
        { status: 403 }
      );
    }

    // 2. Successful Login: Clear failed attempts
    await clearRateLimit(rateLimitKey);

    await logAuditEvent({
      who: gallery.clientEmail,
      role: 'client',
      action: 'client_login',
      status: 'success',
      galleryId: gallery._id,
      request,
    });

    const token = await signClientToken({
      sub: gallery._id.toString(),
      galleryId: gallery._id.toString(),
      clientEmail: gallery.clientEmail,
      coupleNames: gallery.coupleNames,
      role: 'client',
    });

    const response = NextResponse.json({
      success: true,
      gallery: {
        id: gallery._id.toString(),
        coupleNames: gallery.coupleNames,
        clientEmail: gallery.clientEmail,
        weddingDate: gallery.weddingDate,
      },
    });

    response.cookies.set({
      name: CLIENT_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
    });

    return response;
  } catch (error: any) {
    console.error('Client login error:', error);
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
