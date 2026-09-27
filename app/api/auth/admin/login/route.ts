import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { AdminUser } from '@/models/AdminUser';
import { comparePassword, signAdminToken, ADMIN_COOKIE_NAME } from '@/lib/auth';
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

    const rateLimitKey = `auth:admin:${normalizedEmail}`;

    // 1. Rate Limiting Check: 5 attempts per 15 minutes per account
    const rateStatus = await checkRateLimit(rateLimitKey, 5);
    if (!rateStatus.allowed) {
      await logAuditEvent({
        who: normalizedEmail,
        role: 'admin',
        action: 'admin_login_rate_limited',
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
    const admin = await AdminUser.findOne({ email: normalizedEmail });

    // Consistent non-revealing check (prevents account enumeration)
    let isMatch = false;
    if (admin) {
      isMatch = await comparePassword(rawPassword, admin.passwordHash);
    }

    if (!admin || !isMatch) {
      // Record failed attempt and lock out if threshold reached
      const failStatus = await recordFailedAttempt(rateLimitKey, 5, 15);

      await logAuditEvent({
        who: normalizedEmail,
        role: 'admin',
        action: 'admin_login',
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

      return NextResponse.json(
        { error: 'Invalid email or password.' },
        { status: 401 }
      );
    }

    // 2. Successful Login: Clear failed attempts
    await clearRateLimit(rateLimitKey);

    await logAuditEvent({
      who: admin.email,
      role: 'admin',
      action: 'admin_login',
      status: 'success',
      request,
    });

    const token = await signAdminToken({
      sub: admin._id.toString(),
      email: admin.email,
      role: 'admin',
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: admin._id.toString(),
        email: admin.email,
        name: admin.name || 'Studio Admin',
      },
    });

    response.cookies.set({
      name: ADMIN_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 2 * 60 * 60, // 2 hours strictly
    });

    return response;
  } catch (error: any) {
    console.error('Admin login error:', error);
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
