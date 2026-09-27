import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { connectToDatabase } from '@/lib/mongodb';
import { Gallery } from '@/models/Gallery';
import { GuestRateLimit } from '@/models/GuestRateLimit';
import { signGuestToken, GUEST_COOKIE_NAME } from '@/lib/tokens';
import { logAuditEvent } from '@/lib/audit';

export const dynamic = 'force-dynamic';

const ATTEMPT_COOKIE_NAME = 'everlens_guest_attempt_id';

function getDeviceAttemptKey(request: NextRequest, token: string): { key: string; deviceId: string; isNewDevice: boolean } {
  let deviceId = request.cookies.get(ATTEMPT_COOKIE_NAME)?.value;
  let isNewDevice = false;

  if (!deviceId || deviceId.length < 16) {
    deviceId = crypto.randomUUID();
    isNewDevice = true;
  }

  // Keyed per guest-link-token and unique device identifier.
  // This guarantees that a shared Wi-Fi network (e.g. at the wedding venue)
  // never locks out other innocent guests on the same IP.
  return {
    key: `${token}:dev_${deviceId}`,
    deviceId,
    isNewDevice,
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const { key, deviceId, isNewDevice } = getDeviceAttemptKey(request, token);

    await connectToDatabase();

    const gallery = await Gallery.findOne({ guestLinkToken: token })
      .select('status guestPin coupleNames expirationDate')
      .lean();

    if (!gallery || gallery.status === 'archived') {
      return NextResponse.json({ error: 'Gallery not found or inactive' }, { status: 404 });
    }

    if (gallery.expirationDate && new Date(gallery.expirationDate) < new Date()) {
      return NextResponse.json({ error: 'Gallery access has expired' }, { status: 403 });
    }

    const rateLimit = await GuestRateLimit.findOne({ key }).lean();
    const isLockedOut = Boolean(rateLimit?.lockedUntil && new Date(rateLimit.lockedUntil) > new Date());

    let remainingMinutes = 0;
    if (isLockedOut && rateLimit?.lockedUntil) {
      const remainingMs = new Date(rateLimit.lockedUntil).getTime() - Date.now();
      remainingMinutes = Math.max(1, Math.ceil(remainingMs / 60000));
    }

    const response = NextResponse.json({
      lockedOut: isLockedOut,
      remainingMinutes,
      attempts: rateLimit?.attempts || 0,
      attemptsRemaining: Math.max(0, 5 - (rateLimit?.attempts || 0)),
      hasPin: Boolean(gallery.guestPin),
    });

    if (isNewDevice) {
      response.cookies.set(ATTEMPT_COOKIE_NAME, deviceId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 30 * 24 * 60 * 60,
        path: '/',
      });
    }

    return response;
  } catch (error: any) {
    console.error('Failed to check guest rate limit status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const { key, deviceId, isNewDevice } = getDeviceAttemptKey(request, token);

    await connectToDatabase();

    // 1. Check existing lockout
    let rateLimit = await GuestRateLimit.findOne({ key });
    if (rateLimit?.lockedUntil && new Date(rateLimit.lockedUntil) > new Date()) {
      const remainingMs = new Date(rateLimit.lockedUntil).getTime() - Date.now();
      const remainingMinutes = Math.max(1, Math.ceil(remainingMs / 60000));
      return NextResponse.json(
        {
          error: `Too many incorrect attempts. Access is locked for ${remainingMinutes} more minute(s).`,
          lockedOut: true,
          remainingMinutes,
        },
        { status: 429 }
      );
    }

    const gallery = await Gallery.findOne({ guestLinkToken: token });
    if (!gallery || gallery.status === 'archived') {
      return NextResponse.json(
        { error: 'This gallery link is not found or has expired.' },
        { status: 404 }
      );
    }

    if (gallery.expirationDate && new Date(gallery.expirationDate) < new Date()) {
      return NextResponse.json(
        { error: 'This gallery has concluded and is no longer accessible.' },
        { status: 403 }
      );
    }

    // 2. If gallery does not have a guestPin, grant access directly
    if (!gallery.guestPin) {
      await logAuditEvent({
        who: `guest:${deviceId}`,
        role: 'guest',
        action: 'login',
        galleryId: gallery._id.toString(),
        status: 'success',
        metadata: { directAccess: true },
        request,
      });

      const guestToken = await signGuestToken({
        sub: gallery._id.toString(),
        galleryId: gallery._id.toString(),
        guestLinkToken: token,
        role: 'guest',
      });

      const response = NextResponse.json({ success: true, directAccess: true });
      response.cookies.set(GUEST_COOKIE_NAME, guestToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 24 * 60 * 60, // 24 hours
        path: '/',
      });
      return response;
    }

    // 3. Verify submitted PIN
    const body = await request.json().catch(() => ({}));
    const submittedPin = String(body.pin || '').trim();

    if (!submittedPin) {
      return NextResponse.json(
        { error: 'Please enter the 4-digit guest PIN.' },
        { status: 400 }
      );
    }

    // 4. Incorrect PIN handling with strict 5-attempt threshold & 15-minute cooldown
    if (submittedPin !== String(gallery.guestPin).trim()) {
      const now = new Date();
      const currentAttempts = (rateLimit?.attempts || 0) + 1;

      if (!rateLimit) {
        rateLimit = new GuestRateLimit({
          key,
          attempts: currentAttempts,
          lockedUntil: null,
          expireAt: new Date(now.getTime() + 15 * 60 * 1000),
        });
      } else {
        rateLimit.attempts = currentAttempts;
        rateLimit.expireAt = new Date(now.getTime() + 15 * 60 * 1000);
      }

      if (currentAttempts >= 5) {
        // Enforce 15-minute lockout cooldown
        const lockedUntil = new Date(now.getTime() + 15 * 60 * 1000);
        rateLimit.lockedUntil = lockedUntil;
        rateLimit.expireAt = new Date(now.getTime() + 16 * 60 * 1000);
        await rateLimit.save();

        await logAuditEvent({
          who: `guest:${deviceId}`,
          role: 'guest',
          action: 'login',
          galleryId: gallery._id.toString(),
          status: 'failure',
          metadata: { reason: 'Incorrect PIN - locked out for 15 minutes', attempts: currentAttempts },
          request,
        });

        const response = NextResponse.json(
          {
            error: 'Too many incorrect attempts. Gallery access is locked for 15 minutes.',
            lockedOut: true,
            remainingMinutes: 15,
            attemptsRemaining: 0,
          },
          { status: 429 }
        );

        if (isNewDevice) {
          response.cookies.set(ATTEMPT_COOKIE_NAME, deviceId, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 30 * 24 * 60 * 60,
            path: '/',
          });
        }

        return response;
      }

      await rateLimit.save();
      const attemptsRemaining = 5 - currentAttempts;

      await logAuditEvent({
        who: `guest:${deviceId}`,
        role: 'guest',
        action: 'login',
        galleryId: gallery._id.toString(),
        status: 'failure',
        metadata: { reason: 'Incorrect PIN', attemptsRemaining },
        request,
      });

      const response = NextResponse.json(
        {
          error: `Incorrect PIN. ${attemptsRemaining} ${attemptsRemaining === 1 ? 'attempt' : 'attempts'} remaining before lockout.`,
          attemptsRemaining,
          lockedOut: false,
        },
        { status: 401 }
      );

      if (isNewDevice) {
        response.cookies.set(ATTEMPT_COOKIE_NAME, deviceId, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 30 * 24 * 60 * 60,
          path: '/',
        });
      }

      return response;
    }

    // 5. Successful PIN entry: Clear failed rate limit attempts
    if (rateLimit) {
      await GuestRateLimit.deleteOne({ key });
    }

    await logAuditEvent({
      who: `guest:${deviceId}`,
      role: 'guest',
      action: 'login',
      galleryId: gallery._id.toString(),
      status: 'success',
      metadata: { method: 'pin' },
      request,
    });

    // 6. Issue signed guest JWT cookie
    const guestToken = await signGuestToken({
      sub: gallery._id.toString(),
      galleryId: gallery._id.toString(),
      guestLinkToken: token,
      role: 'guest',
    });

    const response = NextResponse.json({ success: true });
    response.cookies.set(GUEST_COOKIE_NAME, guestToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60, // 24 hours
      path: '/',
    });

    return response;
  } catch (error: any) {
    console.error('Guest PIN verification error:', error);
    return NextResponse.json(
      { error: error?.message || 'Verification failed. Please try again.' },
      { status: 500 }
    );
  }
}
