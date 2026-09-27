import React from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifyAdminToken, ADMIN_COOKIE_NAME } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import { Inquiry } from '@/models/Inquiry';
import { AdminNavbar } from '@/components/admin/AdminNavbar';
import { InquiriesTable, InquiryItem } from '@/components/admin/InquiriesTable';

export const dynamic = 'force-dynamic';

export default async function AdminInquiriesPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
  const session = token ? await verifyAdminToken(token) : null;

  if (!session) {
    redirect('/admin/login');
  }

  let inquiries: InquiryItem[] = [];

  try {
    await connectToDatabase();

    const rawInquiries = await Inquiry.find()
      .sort({ submittedAt: -1 })
      .lean();

    inquiries = rawInquiries.map((inq) => ({
      _id: inq._id.toString(),
      coupleNames: inq.coupleNames,
      email: inq.email,
      phone: inq.phone,
      eventDate: inq.eventDate,
      venue: inq.venue,
      packageInterest: inq.packageInterest,
      mediaType: inq.mediaType,
      guestCount: inq.guestCount,
      notes: inq.notes,
      isRead: Boolean(inq.isRead),
      submittedAt: inq.submittedAt ? new Date(inq.submittedAt).toISOString() : new Date().toISOString(),
    }));
  } catch (error) {
    console.error('Failed to load inquiries for admin:', error);
  }

  return (
    <div className="min-h-screen bg-[#0B0F0E] text-[#F4F3ED] flex flex-col font-sans">
      <AdminNavbar adminEmail={session.email} />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Page Title & Context */}
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-3 border-b border-white/[0.08] pb-5">
          <div>
            <h1 className="text-2xl sm:text-3xl font-serif text-[#F4F3ED] font-normal tracking-tight">
              Client Inquiries
            </h1>
            <p className="text-xs text-[#9EABA2] font-sans mt-1">
              Review and manage incoming wedding booking inquiries and bespoke commissions.
            </p>
          </div>
          <span className="text-xs font-mono text-teal bg-teal/10 border border-teal/20 px-3 py-1 rounded-full self-start sm:self-auto">
            {inquiries.length} {inquiries.length === 1 ? 'Total Lead' : 'Total Leads'}
          </span>
        </div>

        {/* Inquiries Table */}
        <InquiriesTable initialInquiries={inquiries} />
      </main>
    </div>
  );
}
