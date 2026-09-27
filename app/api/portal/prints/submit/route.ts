import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { PrintSelection } from '@/models/PrintSelection';
import { authorizeGalleryAccess } from '@/lib/gallery-auth';
import { logAuditEvent } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const auth = await authorizeGalleryAccess(request);
    if (!auth.success) {
      return auth.response;
    }

    const { session } = auth;
    if (session.role === 'guest') {
      return NextResponse.json(
        { error: 'Forbidden: Guest accounts cannot submit print album selections.' },
        { status: 403 }
      );
    }

    await connectToDatabase();

    let selection = await PrintSelection.findOne({ galleryId: session.galleryId });
    if (!selection) {
      return NextResponse.json(
        { error: 'No print selection found. Please select at least 1 photograph.' },
        { status: 400 }
      );
    }

    if (selection.locked) {
      return NextResponse.json(
        { error: 'Your print selection has already been submitted and locked.' },
        { status: 400 }
      );
    }

    if (!selection.mediaItemIds || selection.mediaItemIds.length === 0) {
      return NextResponse.json(
        { error: 'Please select at least 1 photograph before submitting.' },
        { status: 400 }
      );
    }

    if (selection.mediaItemIds.length > 50) {
      return NextResponse.json(
        { error: 'Server validation: Print selection exceeds the 50 item maximum.' },
        { status: 400 }
      );
    }

    selection.locked = true;
    selection.submittedAt = new Date();
    await selection.save();

    // Security audit log
    await logAuditEvent({
      who: session.clientEmail || session.sub,
      role: session.role,
      action: 'print_selection_submit',
      status: 'success',
      galleryId: session.galleryId,
      metadata: { count: selection.mediaItemIds.length },
      request,
    });

    return NextResponse.json({
      success: true,
      locked: true,
      submittedAt: selection.submittedAt.toISOString(),
      count: selection.mediaItemIds.length,
    });
  } catch (error: any) {
    console.error('Failed to submit print selection:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to submit print selection' },
      { status: 500 }
    );
  }
}
