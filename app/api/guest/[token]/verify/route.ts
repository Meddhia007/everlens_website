import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Gallery } from '@/models/Gallery';
import { GuestRateLimit } from '@/models/GuestRateLimit';
import { signGuestToken, GUEST_COOKIE_NAME } from '@/lib/tokens';

export const dynamic = 'force-dynamic';

function getClientIp(request: NextRequest): string {
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }
  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp.trim();
  }
  return '127.0.0.1';
}

export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const token = params.token;
    const ip = getClientIp(request);
    const key = `${token}:${ip}`;

    await connectToDatabase();

    const gallery = await Gallery.findOne({ guestLinkToken: token }).select('status guestPin coupleNames').lean();
    if (!gallery || gallery.status === 'archived') {
      return NextResponse.json({ error: 'Gallery not found or inactive' }, { status: 404 });
    }

    const rateLimit = await GuestRateLimit.findOne({ key }).lean();
    if (rateLimit?.lockedUntil && new Date(rateLimit.lockedUntil) > new Date()) {
      const remainingMs = new Date(rateLimit.lockedUntil).getTime() - Date.now();
      const remainingMinutes = Math.max(1, Math.ceil(remainingMs / 60000));
      return NextResponse.json({
        lockedOut: true,
        remainingMinutes,
        hasPin: !!gallery.guestPin,
      });
    }

    return NextResponse.json({
      lockedOut: false,
      attempts: rateLimit?.attempts || 0,
      attemptsRemaining: Math.max(0, 5 - (rateLimit?.attempts || 0)),
      hasPin: !!gallery.guestPin,
    });
  } catch (error: any) {
    console.error('Failed to check guest rate limit status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const token = params.token;
    const ip = getClientIp(request);
    const key = `${token}:${ip}`;

    await connectToDatabase();

    // Check rate limit
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

    // If gallery does not have a guestPin, grant access directly
    if (!gallery.guestPin) {
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
        sameSite: 'lax',
        maxAge: 86400, // 24 hours
        path: '/',
      });
      return response;
    }

    // Verify submitted PIN
    const body = await request.json().catch(() => ({}));
    const submittedPin = String(body.pin || '').trim();

    if (!submittedPin) {
      return NextResponse.json(
        { error: 'Please enter the 4-digit guest PIN.' },
        { status: 400 }
      );
    }

    if (submittedPin !== String(gallery.guestPin).trim()) {
      if (!rateLimit) {
        rateLimit = new GuestRateLimit({
          key,
          attempts: 1,
          lockedUntil: null,
        });
      } else {
        rateLimit.attempts += 1;
      }

      // Check for 5 failed attempts lockout threshold
      if (rateLimit.attempts >= 5) {
        rateLimit.lockedUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes lockout
        await rateLimit.save();

        return NextResponse.json(
          {
            error: 'Too many incorrect attempts. Gallery access is locked for 15 minutes.',
            lockedOut: true,
            remainingMinutes: 15,
            attemptsRemaining: 0,
          },
          { status: 429 }
        );
      }

      await rateLimit.save();
      const attemptsRemaining = 5 - rateLimit.attempts;

      return NextResponse.json(
        {
          error: `Incorrect PIN. ${attemptsRemaining} ${attemptsRemaining === 1 ? 'attempt' : 'attempts'} remaining before lockout.`,
          attemptsRemaining,
          lockedOut: false,
        },
        { status: 401 }
      );
    }

    // Successful PIN entry: Clear rate limit record
    if (rateLimit) {
      await GuestRateLimit.deleteOne({ key });
    }

    // Issue signed guest JWT cookie
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
      sameSite: 'lax',
      maxAge: 86400, // 24 hours
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
