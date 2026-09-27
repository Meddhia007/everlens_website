import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { AdminUser } from '@/models/AdminUser';
import { comparePassword, signAdminToken, ADMIN_COOKIE_NAME } from '@/lib/auth';

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
    const admin = await AdminUser.findOne({ email: normalizedEmail });

    if (!admin) {
      return NextResponse.json(
        { error: 'Invalid email or password.' },
        { status: 401 }
      );
    }

    const isMatch = await comparePassword(password, admin.passwordHash);
    if (!isMatch) {
      return NextResponse.json(
        { error: 'Invalid email or password.' },
        { status: 401 }
      );
    }

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
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60, // 7 days
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
