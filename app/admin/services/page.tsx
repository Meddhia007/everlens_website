import React from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifyAdminToken, ADMIN_COOKIE_NAME } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import { Service } from '@/models/Service';
import { initialServices } from '@/lib/initialData';
import { memoryStore } from '@/lib/memoryStore';
import { AdminNavbar } from '@/components/admin/AdminNavbar';
import { ServicesManager, ServiceItem } from '@/components/admin/ServicesManager';

export const dynamic = 'force-dynamic';

export default async function AdminServicesPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
  const session = token ? await verifyAdminToken(token) : null;

  if (!session) {
    redirect('/admin/login');
  }

  // Pre-fill with memoryStore so services ALWAYS show up instantly
  let services: ServiceItem[] = [...memoryStore.services];
  let isAtlasConnected = false;

  try {
    await connectToDatabase();
    isAtlasConnected = true;

    let rawItems = await Service.find().sort({ order: 1, createdAt: 1 }).lean();

    if (
      rawItems.length === 0 ||
      rawItems.some((it: any) => String(it.title).toLowerCase().includes('wedding photography')) ||
      (rawItems[0]?.options?.length || 0) < 5
    ) {
      await Service.deleteMany({});
      await Service.insertMany(initialServices);
      rawItems = await Service.find().sort({ order: 1, createdAt: 1 }).lean();
    }

    if (rawItems.length > 0) {
      services = rawItems.map((item: any) => ({
        _id: item._id.toString(),
        title: item.title,
        subtitle: item.subtitle || '',
        badge: item.badge || '',
        price: item.price || 'Tarifs sur demande',
        description: item.description || '',
        features: Array.isArray(item.features) ? item.features : [],
        options: Array.isArray(item.options) ? item.options : [],
        icon: item.icon || 'Camera',
        order: item.order || 0,
        active: item.active !== false,
      }));
      memoryStore.services = [...services];
    }
  } catch (error) {
    console.warn('MongoDB connection unavailable for services, using memoryStore presets.');
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
              <span className="text-[11px] font-mono uppercase tracking-widest text-teal">Studio Offerings</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif text-white font-normal tracking-tight">
              Wedding Packs &amp; Pricing
            </h1>
            <p className="text-xs text-[#9EABA2] font-sans mt-1">
              Manage your 2026 wedding packages, included features, options, badges, and pricing displayed on the website.
            </p>
          </div>
          <span className="text-xs font-mono text-[#9EABA2] bg-[#141A19] px-3 py-1.5 rounded-xs border border-white/[0.08] self-start sm:self-auto">
            Total Packs: {services.length}
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

        {/* Services Manager Interactive Component */}
        <ServicesManager initialServices={services} />
      </main>
    </div>
  );
}
