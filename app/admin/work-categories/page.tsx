import React from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifyAdminToken, ADMIN_COOKIE_NAME } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import { WorkCategory } from '@/models/WorkCategory';
import { initialWorkCategories } from '@/lib/initialData';
import { memoryStore } from '@/lib/memoryStore';
import { AdminNavbar } from '@/components/admin/AdminNavbar';
import {
  WorkCategoriesManager,
  WorkCategoryItem,
} from '@/components/admin/WorkCategoriesManager';

export const dynamic = 'force-dynamic';

export default async function AdminWorkCategoriesPage() {
  const cookieStore = cookies();
  const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
  const session = token ? await verifyAdminToken(token) : null;

  if (!session) {
    redirect('/admin/login');
  }

  // Pre-fill with memoryStore so categories ALWAYS show up instantly
  let categories: WorkCategoryItem[] = [...memoryStore.categories];
  let isAtlasConnected = false;

  try {
    await connectToDatabase();
    isAtlasConnected = true;

    let rawItems = await WorkCategory.find().sort({ order: 1, createdAt: 1 }).lean();

    if (rawItems.length === 0) {
      await WorkCategory.insertMany(initialWorkCategories);
      rawItems = await WorkCategory.find().sort({ order: 1, createdAt: 1 }).lean();
    }

    if (rawItems.length > 0) {
      categories = rawItems.map((item: any) => ({
        _id: item._id.toString(),
        name: item.name,
        slug: item.slug,
        description: item.description || '',
        order: item.order || 0,
        active: item.active !== false,
      }));
      memoryStore.categories = [...categories];
    }
  } catch (error) {
    console.warn('MongoDB connection unavailable for work categories, using memoryStore presets.');
  }

  return (
    <div className="min-h-screen bg-[#0B0F0E] text-[#F4F3ED] flex flex-col font-sans">
      <AdminNavbar adminEmail={session.email} />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Page Title & Context */}
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-3 border-b border-white/[0.08] pb-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-teal animate-pulse" />
              <span className="text-[11px] font-mono uppercase tracking-widest text-teal">Portfolio Taxonomy</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif text-white font-normal tracking-tight">
              Work &amp; Portfolio Categories
            </h1>
            <p className="text-xs text-[#9EABA2] font-sans mt-1">
              Curate portfolio filter tabs and taxonomy for wedding films, analog Super 8mm, and photography collections.
            </p>
          </div>
          <span className="text-xs font-mono text-[#9EABA2] bg-[#141A19] px-3 py-1.5 rounded-xs border border-white/[0.08] self-start sm:self-auto">
            Total Categories: {categories.length}
          </span>
        </div>

        {!isAtlasConnected && (
          <div className="p-3.5 bg-amber-500/10 border border-amber-500/25 rounded-xs flex items-center justify-between text-xs text-amber-200 font-sans shadow-sm">
            <div className="flex items-center gap-2.5">
              <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
              <span>
                <strong className="text-amber-300">Active Memory Store:</strong> Cloud database connection is restricted by Atlas IP whitelist. Content is active and instantly editable in memory. Whitelist your IP in MongoDB Atlas (Network Access &rarr; Allow <code>0.0.0.0/0</code>) for cloud sync across restarts.
              </span>
            </div>
          </div>
        )}

        {/* Categories Manager Interactive Component */}
        <WorkCategoriesManager initialCategories={categories} />
      </main>
    </div>
  );
}
