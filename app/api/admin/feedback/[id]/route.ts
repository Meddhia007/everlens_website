import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { PhotoComment } from '@/models/PhotoComment';
import { verifyAdminToken, ADMIN_COOKIE_NAME } from '@/lib/auth';
import { sanitizeObjectId } from '@/lib/security-sanitize';

export const dynamic = 'force-dynamic';

async function authenticateAdmin(request: NextRequest) {
  const token = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyAdminToken(token);
}

// PATCH: Update status (e.g. mark as resolved / open)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const admin = await authenticateAdmin(request);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized studio access' }, { status: 401 });
    }

    const cleanId = sanitizeObjectId(id);
    if (!cleanId) {
      return NextResponse.json({ error: 'Invalid comment ID' }, { status: 400 });
    }

    const body = await request.json().catch(() => ({}));
    const { status } = body;

    if (!['open', 'resolved'].includes(status)) {
      return NextResponse.json({ error: 'Status must be open or resolved' }, { status: 400 });
    }

    await connectToDatabase();

    const comment = await PhotoComment.findByIdAndUpdate(
      cleanId,
      { status },
      { new: true }
    );

    if (!comment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      comment: {
        _id: comment._id.toString(),
        status: comment.status,
      },
    });
  } catch (error: any) {
    console.error('Failed to update comment status:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to update feedback status' },
      { status: 500 }
    );
  }
}

// DELETE: Delete a photo comment
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const admin = await authenticateAdmin(request);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized studio access' }, { status: 401 });
    }

    const cleanId = sanitizeObjectId(id);
    if (!cleanId) {
      return NextResponse.json({ error: 'Invalid comment ID' }, { status: 400 });
    }

    await connectToDatabase();

    const deleted = await PhotoComment.findByIdAndDelete(cleanId);
    if (!deleted) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Feedback comment deleted successfully.',
    });
  } catch (error: any) {
    console.error('Failed to delete comment:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to delete feedback comment' },
      { status: 500 }
    );
  }
}
