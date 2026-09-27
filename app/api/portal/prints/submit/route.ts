import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { PrintSelection } from '@/models/PrintSelection';
import { verifyClientToken, CLIENT_COOKIE_NAME } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const clientToken = request.cookies.get(CLIENT_COOKIE_NAME)?.value;
    if (!clientToken) {
      return NextResponse.json({ error: 'Unauthorized client access' }, { status: 401 });
    }

    const session = await verifyClientToken(clientToken);
    if (!session || !session.galleryId) {
      return NextResponse.json({ error: 'Invalid or expired client session' }, { status: 401 });
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
