import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Inquiry } from '@/models/Inquiry';
import { sendStudioInquiryNotificationEmail } from '@/lib/email';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      coupleNames,
      email,
      phone,
      eventDate,
      venue,
      packageInterest,
      mediaType,
      guestCount,
      notes,
    } = body;

    if (!coupleNames || typeof coupleNames !== 'string' || !coupleNames.trim()) {
      return NextResponse.json(
        { error: 'Couple names are required.' },
        { status: 400 }
      );
    }

    if (!email || typeof email !== 'string' || !email.trim()) {
      return NextResponse.json(
        { error: 'A valid email address is required.' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // 1. Persist lead in MongoDB
    const inquiry = await Inquiry.create({
      coupleNames: coupleNames.trim(),
      email: email.trim().toLowerCase(),
      phone: phone?.trim() || undefined,
      eventDate: eventDate?.trim() || undefined,
      venue: venue?.trim() || undefined,
      packageInterest: packageInterest?.trim() || undefined,
      mediaType: mediaType?.trim() || undefined,
      guestCount: guestCount?.trim() || undefined,
      notes: notes?.trim() || undefined,
      submittedAt: new Date(),
      isRead: false,
    });

    // 2. Dispatch notification email to studio (Resend)
    // Non-blocking: If email fails, the inquiry remains securely saved in the database
    try {
      await sendStudioInquiryNotificationEmail({
        coupleNames: inquiry.coupleNames,
        email: inquiry.email,
        phone: inquiry.phone,
        eventDate: inquiry.eventDate,
        venue: inquiry.venue,
        packageInterest: inquiry.packageInterest,
        mediaType: inquiry.mediaType,
        guestCount: inquiry.guestCount,
        notes: inquiry.notes,
        submittedAt: inquiry.submittedAt,
      });
    } catch (emailError) {
      console.error(
        `[LEAD DISPATCH] Failed to send email for inquiry ${inquiry._id}:`,
        emailError
      );
      // Do not rethrow: Lead is already safe in MongoDB
    }

    return NextResponse.json({
      success: true,
      inquiryId: inquiry._id.toString(),
    });
  } catch (error: any) {
    console.error('Contact submission error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to submit inquiry. Please try again.' },
      { status: 500 }
    );
  }
}
