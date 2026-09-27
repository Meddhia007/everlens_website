import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Gallery } from '@/models/Gallery';
import { comparePassword, signClientToken, CLIENT_COOKIE_NAME } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required.' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const normalizedEmail = email.toLowerCase().trim();
    const gallery = await Gallery.findOne({ clientEmail: normalizedEmail });

    if (!gallery) {
      return NextResponse.json(
        { error: 'No gallery found for this email address.' },
        { status: 401 }
      );
    }

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

    const isMatch = await comparePassword(password, gallery.passwordHash);
    if (!isMatch) {
      return NextResponse.json(
        { error: 'Invalid email or password.' },
        { status: 401 }
      );
    }

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
      sameSite: 'lax',
      path: '/',
      maxAge: 30 * 24 * 60 * 60, // 30 days
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
