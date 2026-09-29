import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectToDatabase } from '@/lib/mongodb';
import { AdminUser } from '@/models/AdminUser';
import { verifyAdminToken, ADMIN_COOKIE_NAME } from '@/lib/auth';

export const dynamic = 'force-dynamic';

async function authenticateAdmin(request: NextRequest) {
  const token = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyAdminToken(token);
}

// DELETE /api/admin/admins/[id] - Delete an admin account
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await authenticateAdmin(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized studio access' }, { status: 401 });
    }

    const { id } = await params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid admin account ID.' }, { status: 400 });
    }

    await connectToDatabase();

    // Safety Check 1: Ensure there is more than 1 admin remaining
    const totalAdmins = await AdminUser.countDocuments();
    if (totalAdmins <= 1) {
      return NextResponse.json(
        { error: 'Cannot delete the only remaining admin account. The studio requires at least one active admin.' },
        { status: 400 }
      );
    }

    // Safety Check 2: Find target admin
    const targetAdmin = await AdminUser.findById(id);
    if (!targetAdmin) {
      return NextResponse.json({ error: 'Admin account not found.' }, { status: 404 });
    }

    // Safety Check 3: Cannot delete yourself while logged in
    if (targetAdmin.email.toLowerCase() === session.email.toLowerCase()) {
      return NextResponse.json(
        { error: 'You cannot delete your own active admin account while logged in.' },
        { status: 400 }
      );
    }

    await AdminUser.findByIdAndDelete(id);

    return NextResponse.json({
      success: true,
      message: `Admin account "${targetAdmin.email}" deleted successfully.`,
    });
  } catch (error: any) {
    console.error('Failed to delete admin account:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to delete admin account' },
      { status: 500 }
    );
  }
}
