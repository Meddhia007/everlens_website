import React from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifyAdminToken, ADMIN_COOKIE_NAME } from '@/lib/auth';
import { AdminNavbar } from '@/components/admin/AdminNavbar';
import { PortfolioPostsManager } from '@/components/admin/PortfolioPostsManager';
import { connectToDatabase } from '@/lib/mongodb';
import { WorkCategory } from '@/models/WorkCategory';
import { memoryStore } from '@/lib/memoryStore';

export const dynamic = 'force-dynamic';

export default async function AdminPortfolioPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
  const session = token ? await verifyAdminToken(token) : null;

  if (!session) {
    redirect('/admin/login');
  }

  let categories: { id: string; name: string; slug: string }[] = [];
  try {
    await connectToDatabase();
    const rawCategories = await WorkCategory.find({ active: true })
      .sort({ order: 1, createdAt: 1 })
      .lean();
    if (rawCategories.length > 0) {
      categories = rawCategories.map((c: any) => ({
        id: c._id.toString(),
        name: c.name,
        slug: c.slug,
      }));
    }
  } catch {
    categories = memoryStore.categories
      .filter((c) => c.active !== false)
      .map((c) => ({
        id: c._id,
        name: c.name,
        slug: c.slug,
      }));
  }

  return (
    <div className="min-h-screen bg-[#0A0E0D] text-[#EAE8DA] flex flex-col font-sans">
      <AdminNavbar adminEmail={session.email} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <PortfolioPostsManager initialCategories={categories} />
      </main>
    </div>
  );
}
