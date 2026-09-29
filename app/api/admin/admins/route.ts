import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { AdminUser } from '@/models/AdminUser';
import { verifyAdminToken, ADMIN_COOKIE_NAME, hashPassword } from '@/lib/auth';

export const dynamic = 'force-dynamic';

async function authenticateAdmin(request: NextRequest) {
  const token = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyAdminToken(token);
}

// GET /api/admin/admins - List all admin accounts
export async function GET(request: NextRequest) {
  try {
    const session = await authenticateAdmin(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized studio access' }, { status: 401 });
    }

    await connectToDatabase();

    const admins = await AdminUser.find({}, '-passwordHash')
      .sort({ createdAt: 1 })
      .lean();

    const formatted = admins.map((a: any) => ({
      _id: a._id.toString(),
      email: a.email,
      name: a.name || 'Studio Admin',
      createdAt: a.createdAt ? new Date(a.createdAt).toISOString() : '',
      isCurrentUser: a.email.toLowerCase() === session.email.toLowerCase(),
    }));

    return NextResponse.json({ admins: formatted });
  } catch (error: any) {
    console.error('Failed to list admin accounts:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to list admin accounts' },
      { status: 500 }
    );
  }
}

// POST /api/admin/admins - Create a new admin account
export async function POST(request: NextRequest) {
  try {
    const session = await authenticateAdmin(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized studio access' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { email, password, name } = body;

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json({ error: 'A valid email address is required.' }, { status: 400 });
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long.' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const normalizedEmail = email.trim().toLowerCase();
    const existing = await AdminUser.findOne({ email: normalizedEmail });

    if (existing) {
      return NextResponse.json(
        { error: `An admin account with email "${normalizedEmail}" already exists.` },
        { status: 409 }
      );
    }

    const hashedPassword = await hashPassword(password);

    const newAdmin = await AdminUser.create({
      email: normalizedEmail,
      name: (name && typeof name === 'string' && name.trim()) || 'Studio Admin',
      passwordHash: hashedPassword,
    });

    return NextResponse.json(
      {
        success: true,
        admin: {
          _id: newAdmin._id.toString(),
          email: newAdmin.email,
          name: newAdmin.name,
          createdAt: newAdmin.createdAt ? new Date(newAdmin.createdAt).toISOString() : '',
          isCurrentUser: false,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Failed to create admin account:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to create admin account' },
      { status: 500 }
    );
  }
}
