import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Inquiry } from '@/models/Inquiry';
import { sendStudioInquiryNotificationEmail } from '@/lib/email';
import { sanitizeString, sanitizeEmail } from '@/lib/security-sanitize';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
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

    const cleanCoupleNames = sanitizeString(coupleNames, 150);
    const cleanEmail = sanitizeEmail(email);

    if (!cleanCoupleNames) {
      return NextResponse.json(
        { error: 'Couple names are required.' },
        { status: 400 }
      );
    }

    if (!cleanEmail) {
      return NextResponse.json(
        { error: 'A valid email address is required.' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // 1. Persist lead in MongoDB
    const inquiry = await Inquiry.create({
      coupleNames: cleanCoupleNames,
      email: cleanEmail,
      phone: sanitizeString(phone, 50) || undefined,
      eventDate: sanitizeString(eventDate, 50) || undefined,
      venue: sanitizeString(venue, 100) || undefined,
      packageInterest: sanitizeString(packageInterest, 100) || undefined,
      mediaType: sanitizeString(mediaType, 50) || undefined,
      guestCount: sanitizeString(guestCount, 50) || undefined,
      notes: sanitizeString(notes, 2000) || undefined,
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
