import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { connectToDatabase } from '@/lib/mongodb';
import { Inquiry } from '@/models/Inquiry';
import { verifyAdminToken, ADMIN_COOKIE_NAME } from '@/lib/auth';
import { sanitizeObjectId } from '@/lib/security-sanitize';
import mongoose from 'mongoose';

export const dynamic = 'force-dynamic';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
    const session = token ? await verifyAdminToken(token) : null;

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const inquiryId = sanitizeObjectId(id);
    if (!inquiryId) {
      return NextResponse.json({ error: 'Invalid inquiry ID' }, { status: 400 });
    }

    const body = await request.json();
    const { isRead } = body;

    await connectToDatabase();

    const inquiry = await Inquiry.findByIdAndUpdate(
      inquiryId,
      { isRead: Boolean(isRead) },
      { new: true }
    );

    if (!inquiry) {
      return NextResponse.json({ error: 'Inquiry not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, inquiry });
  } catch (error: any) {
    console.error('Failed to update inquiry:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to update inquiry' },
      { status: 500 }
    );
  }
}
