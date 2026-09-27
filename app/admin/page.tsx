import React from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifyAdminToken, ADMIN_COOKIE_NAME } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import { Gallery } from '@/models/Gallery';
import { MediaItem } from '@/models/MediaItem';
import { PrintSelection } from '@/models/PrintSelection';
import { Equipment } from '@/models/Equipment';
import { Service } from '@/models/Service';
import { WorkCategory } from '@/models/WorkCategory';
import { Inquiry } from '@/models/Inquiry';
import { PortfolioPost } from '@/models/PortfolioPost';
import { memoryStore } from '@/lib/memoryStore';
import { GalleriesTable, GalleryListItem } from '@/components/admin/GalleriesTable';
import { StatusDot } from '@/components/admin/StatusDot';
import { formatEditorialDate } from '@/lib/date';
import Link from 'next/link';
import { DashboardHeaderActions } from '@/components/admin/DashboardHeaderActions';
import { DashboardQuickActions } from '@/components/admin/DashboardQuickActions';
import {
  Layers,
  Inbox,
  Printer,
  Package,
  Copy,
  Plus,
  ExternalLink,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  const cookieStore = cookies();
  const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
  const session = token ? await verifyAdminToken(token) : null;

  if (!session) {
    redirect('/admin/login');
  }

  let galleries: GalleryListItem[] = [];
  let isAtlasConnected = false;
  let counts = {
    totalGalleries: 0,
    activeGalleries: 0,
    inquiries: 0,
    unreadInquiries: 0,
    printOrders: 0,
    portfolioPosts: 0,
    weddingPacks: memoryStore.services.length,
    equipment: memoryStore.equipment.length,
  };

    interface RecentInquiry {
    _id: string;
    coupleNames: string;
    email: string;
    eventDate?: string;
    packageInterest?: string;
    isRead: boolean;
    submittedAt: string;
  }

  let recentInquiries: RecentInquiry[] = [];
  let initialServices: any[] = [];
  let initialEquipment: any[] = [];

  try {
    await connectToDatabase();
    isAtlasConnected = true;

    const [
      rawGalleries,
      inquiriesTotal,
      inquiriesUnread,
      printOrdersTotal,
      portfolioPostsTotal,
      weddingPacksTotal,
      equipmentTotal,
      rawRecentInquiries,
      rawServices,
      rawEquipment,
    ] = await Promise.all([
      Gallery.find().select('-passwordHash').sort({ weddingDate: -1, createdAt: -1 }).lean(),
      Inquiry.countDocuments(),
      Inquiry.countDocuments({ isRead: false }),
      PrintSelection.countDocuments({ locked: true }),
      PortfolioPost.countDocuments(),
      Service.countDocuments(),
      Equipment.countDocuments(),
      Inquiry.find().sort({ submittedAt: -1, createdAt: -1 }).limit(4).lean(),
      Service.find().sort({ order: 1 }).lean(),
      Equipment.find().sort({ order: 1 }).lean(),
    ]);

    initialServices = (rawServices && rawServices.length > 0 ? rawServices : memoryStore.services).map((s: any) => ({
      _id: s._id ? s._id.toString() : s.id,
      title: s.title,
      subtitle: s.subtitle,
      badge: s.badge || '',
      price: s.price,
      description: s.description,
      features: s.features || [],
      options: s.options || [],
      icon: s.icon || 'Camera',
      order: s.order || 0,
      active: s.active !== false,
    }));

    initialEquipment = (rawEquipment && rawEquipment.length > 0 ? rawEquipment : memoryStore.equipment).map((e: any) => ({
      _id: e._id ? e._id.toString() : e.id,
      name: e.name,
      category: e.category,
      role: e.role,
      badge: e.badge || '',
      icon: e.icon || 'Camera',
      keyFeatures: e.keyFeatures || [],
      specs: e.specs || [],
      featuredIn: e.featuredIn || [],
      order: e.order || 0,
      active: e.active !== false,
    }));

    const galleryIds = rawGalleries.map((g) => g._id);

    const [mediaCounts, printSelections] = await Promise.all([
      MediaItem.aggregate([
        { $match: { galleryId: { $in: galleryIds } } },
        { $group: { _id: '$galleryId', count: { $sum: 1 } } },
      ]),
      PrintSelection.find({ galleryId: { $in: galleryIds } })
        .select('galleryId mediaItemIds locked')
        .lean(),
    ]);

    const mediaCountMap = new Map(mediaCounts.map((m) => [m._id.toString(), m.count]));
    const printMap = new Map(
      printSelections.map((p) => [
        p.galleryId.toString(),
        { count: p.mediaItemIds?.length || 0, locked: p.locked },
      ])
    );

    galleries = rawGalleries.map((g) => ({
      _id: g._id.toString(),
      coupleNames: g.coupleNames,
      weddingDate: g.weddingDate ? new Date(g.weddingDate).toISOString() : '',
      clientEmail: g.clientEmail,
      status: g.status,
      expirationDate: g.expirationDate ? new Date(g.expirationDate).toISOString() : undefined,
      guestPin: g.guestPin,
      guestLinkToken: g.guestLinkToken,
      mediaCount: mediaCountMap.get(g._id.toString()) || 0,
      printCount: printMap.get(g._id.toString())?.count || 0,
      createdAt: g.createdAt ? new Date(g.createdAt).toISOString() : '',
    }));

    counts = {
      totalGalleries: galleries.length,
      activeGalleries: galleries.filter((g) => g.status === 'active').length,
      inquiries: inquiriesTotal,
      unreadInquiries: inquiriesUnread,
      printOrders: printOrdersTotal,
      portfolioPosts: portfolioPostsTotal,
      weddingPacks: weddingPacksTotal || memoryStore.services.length,
      equipment: equipmentTotal || memoryStore.equipment.length,
    };

    recentInquiries = rawRecentInquiries.map((inq: any) => ({
      _id: inq._id.toString(),
      coupleNames: inq.coupleNames,
      email: inq.email,
      eventDate: inq.eventDate,
      packageInterest: inq.packageInterest,
      isRead: !!inq.isRead,
      submittedAt: inq.submittedAt ? new Date(inq.submittedAt).toISOString() : '',
    }));
  } catch (error) {
    console.warn('MongoDB connection error on dashboard:', error);
  }

  return (
    <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
      {/* Header & Session Title */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-3 border-b border-white/[0.08] pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-teal animate-pulse" />
            <span className="text-[11px] font-mono uppercase tracking-widest text-teal">EverLens Backstage</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif text-white font-normal tracking-tight">
            Studio Dashboard
          </h1>
          <p className="text-xs text-[#9EABA2] font-sans mt-1">
            Executive management for private wedding galleries, client inquiries, print curation, and public offerings.
          </p>
        </div>

        <DashboardHeaderActions />
      </div>

      {!isAtlasConnected && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-[14px] flex items-center justify-between text-xs text-amber-200 font-sans shadow-sm">
          <div className="flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0 animate-ping" />
            <span>
              <strong className="text-amber-400 font-medium">Local Memory Mode Active:</strong> Cloud database connection is restricted. Offerings and gear are running smoothly from local memory.
            </span>
          </div>
        </div>
      )}

      {/* 5 High-Level Business KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5 sm:gap-4">
        {/* KPI 1: Active Galleries */}
        <Link
          href="/admin/galleries"
          className="p-5 rounded-[14px] border border-white/[0.08] bg-[#131918] hover:bg-[#18201E] hover:border-teal/30 transition-all group shadow-[0_4px_20px_rgba(0,0,0,0.25)] card-lift"
        >
          <div className="flex items-center justify-between text-[#9EABA2] mb-2">
            <span className="text-[11px] font-mono uppercase tracking-wider">Galleries</span>
            <Layers className="w-4 h-4 text-teal group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-serif text-white font-normal">
            {counts.activeGalleries}
            <span className="text-xs font-sans text-[#9EABA2] font-normal ml-1.5">
              / {counts.totalGalleries} total
            </span>
          </div>
          <div className="text-[11px] text-[#9EABA2] mt-1 font-sans">
            Client archives live
          </div>
        </Link>

        {/* KPI 2: Inquiries */}
        <Link
          href="/admin/inquiries"
          className="p-5 rounded-[14px] border border-white/[0.08] bg-[#131918] hover:bg-[#18201E] hover:border-teal/30 transition-all group shadow-[0_4px_20px_rgba(0,0,0,0.25)] card-lift relative"
        >
          <div className="flex items-center justify-between text-[#9EABA2] mb-2">
            <span className="text-[11px] font-mono uppercase tracking-wider">Inquiries</span>
            <Inbox className="w-4 h-4 text-teal group-hover:scale-110 transition-transform" />
          </div>
          <div className="flex items-baseline gap-2">
            <div className="text-2xl font-serif text-white font-normal">
              {counts.inquiries}
            </div>
            {counts.unreadInquiries > 0 && (
              <span className="px-2 py-0.5 rounded-[8px] text-[10px] font-mono bg-teal/20 text-teal border border-teal/40 font-semibold animate-pulse">
                {counts.unreadInquiries} new
              </span>
            )}
          </div>
          <div className="text-[11px] text-[#9EABA2] mt-1 font-sans">
            Couple consultation leads
          </div>
        </Link>

        {/* KPI 3: Print Orders */}
        <Link
          href="/admin/prints"
          className="p-5 rounded-[14px] border border-white/[0.08] bg-[#131918] hover:bg-[#18201E] hover:border-teal/30 transition-all group shadow-[0_4px_20px_rgba(0,0,0,0.25)] card-lift"
        >
          <div className="flex items-center justify-between text-[#9EABA2] mb-2">
            <span className="text-[11px] font-mono uppercase tracking-wider">Print Orders</span>
            <Printer className="w-4 h-4 text-teal group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-serif text-white font-normal">
            {counts.printOrders}
          </div>
          <div className="text-[11px] text-[#9EABA2] mt-1 font-sans">
            Submitted album curations
          </div>
        </Link>

        {/* KPI 4: Portfolio Posts */}
        <Link
          href="/admin/portfolio"
          className="p-5 rounded-[14px] border border-white/[0.08] bg-[#131918] hover:bg-[#18201E] hover:border-teal/30 transition-all group shadow-[0_4px_20px_rgba(0,0,0,0.25)] card-lift"
        >
          <div className="flex items-center justify-between text-[#9EABA2] mb-2">
            <span className="text-[11px] font-mono uppercase tracking-wider">Portfolio</span>
            <Copy className="w-4 h-4 text-teal group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-serif text-white font-normal">
            {counts.portfolioPosts}
          </div>
          <div className="text-[11px] text-[#9EABA2] mt-1 font-sans">
            Published carousels
          </div>
        </Link>

        {/* KPI 5: Wedding Packs */}
        <Link
          href="/admin/services"
          className="col-span-2 lg:col-span-1 p-5 rounded-[14px] border border-white/[0.08] bg-[#131918] hover:bg-[#18201E] hover:border-teal/30 transition-all group shadow-[0_4px_20px_rgba(0,0,0,0.25)] card-lift"
        >
          <div className="flex items-center justify-between text-[#9EABA2] mb-2">
            <span className="text-[11px] font-mono uppercase tracking-wider">Packs</span>
            <Package className="w-4 h-4 text-teal group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-serif text-white font-normal">
            {counts.weddingPacks}
          </div>
          <div className="text-[11px] text-[#9EABA2] mt-1 font-sans">
            Active wedding offerings
          </div>
        </Link>
      </div>

      {/* Quick Actions & Recent Inquiries Snapshot */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions Toolbar with Popups */}
        <div className="lg:col-span-1 p-5 rounded-[14px] border border-white/[0.08] bg-[#131918] space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-teal" />
              <h2 className="text-xs font-mono uppercase tracking-wider text-white font-semibold">
                Quick Actions
              </h2>
            </div>
          </div>

          <DashboardQuickActions
            initialServices={initialServices}
            initialEquipment={initialEquipment}
          />
        </div>

        {/* Recent Inquiries Snapshot Widget */}
        <div className="lg:col-span-2 p-5 rounded-[14px] border border-white/[0.08] bg-[#131918] space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
            <div className="flex items-center gap-2">
              <Inbox className="w-4 h-4 text-teal" />
              <h2 className="text-xs font-mono uppercase tracking-wider text-white font-semibold">
                Recent Inquiries
              </h2>
            </div>
            <Link
              href="/admin/inquiries"
              className="text-xs text-teal hover:underline flex items-center gap-1 font-mono"
            >
              <span>View All</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {recentInquiries.length === 0 ? (
            <div className="py-8 text-center text-[#9EABA2] space-y-2">
              <Inbox className="w-8 h-8 text-[#9EABA2]/30 mx-auto" />
              <p className="text-xs">No pending client inquiries.</p>
              <p className="text-[11px] text-[#9EABA2]/60">
                New inquiries submitted through the contact page will appear here immediately.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-white/[0.06]">
              {recentInquiries.map((inq) => (
                <div
                  key={inq._id}
                  className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-4"
                >
                  <div className="space-y-0.5 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-white truncate">
                        {inq.coupleNames}
                      </span>
                      {!inq.isRead && (
                        <span className="w-1.5 h-1.5 rounded-full bg-teal shrink-0" title="Unread" />
                      )}
                    </div>
                    <div className="text-[11px] text-[#9EABA2] truncate">
                      {inq.email} {inq.packageInterest && `• ${inq.packageInterest}`}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-[11px] font-mono text-[#9EABA2]">
                      {inq.eventDate ? formatEditorialDate(inq.eventDate) : 'Date TBD'}
                    </div>
                    <Link
                      href="/admin/inquiries"
                      className="text-[10px] text-teal hover:underline font-mono"
                    >
                      Review &rarr;
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Client Galleries Overview */}
      <div className="pt-2 space-y-4">
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
          <div>
            <h2 className="font-serif text-xl sm:text-2xl text-white font-normal">
              Recent Client Galleries
            </h2>
            <p className="text-xs text-[#9EABA2] mt-0.5">
              Quick access to your active and newly created wedding sanctuaries.
            </p>
          </div>
          <Link
            href="/admin/galleries"
            className="text-xs text-teal hover:underline flex items-center gap-1 font-mono font-medium"
          >
            <span>View All Galleries ({galleries.length})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {galleries.length === 0 ? (
          <div className="py-16 px-6 text-center border border-white/[0.08] bg-[#131918] rounded-[14px] shadow-xl">
            <div className="w-12 h-12 rounded-full bg-teal/10 border border-teal/20 text-teal flex items-center justify-center mx-auto mb-3">
              <Layers className="w-6 h-6" />
            </div>
            <h3 className="font-serif text-lg text-[#F4F3ED] font-normal mb-1">
              No client galleries created yet
            </h3>
            <p className="text-xs text-[#9EABA2] max-w-sm mx-auto mb-4 font-sans">
              Create your first private wedding sanctuary to begin uploading client media and managing print orders.
            </p>
            <Link
              href="/admin/galleries/new"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[8px] bg-gradient-to-b from-[#48C9B0] to-[#36998A] text-[#0B0F0E] font-sans text-xs font-semibold hover:brightness-105 active:scale-[0.97] transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Create First Gallery</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {galleries.slice(0, 6).map((g) => (
              <div
                key={g._id}
                className="p-5 rounded-[14px] border border-white/[0.08] bg-[#131918] hover:border-teal/30 hover:bg-[#161F1D] transition-all flex flex-col justify-between space-y-4 shadow-lg group card-lift"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <StatusDot status={g.status} />
                    <span className="text-[11px] font-mono text-[#9EABA2]">
                      {g.weddingDate ? formatEditorialDate(g.weddingDate) : 'Date TBD'}
                    </span>
                  </div>
                  <h3 className="font-serif text-lg text-white font-medium group-hover:text-teal transition-colors">
                    <Link href={`/admin/galleries/${g._id}`}>
                      {g.coupleNames}
                    </Link>
                  </h3>
                  <div className="text-xs text-[#9EABA2] font-mono truncate mt-0.5">
                    {g.clientEmail}
                  </div>
                </div>

                <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[11px] font-mono text-[#9EABA2]">
                    <span>{g.mediaCount || 0} media</span>
                    <span className="text-white/20">•</span>
                    <span>{g.printCount || 0}/50 prints</span>
                  </div>
                  <Link
                    href={`/admin/galleries/${g._id}`}
                    className="inline-flex items-center gap-1 text-xs text-teal hover:underline font-mono"
                  >
                    <span>Manage</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        {galleries.length > 0 && (
          <div className="pt-2 text-center">
            <Link
              href="/admin/galleries"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-[8px] bg-[#182220] hover:bg-[#1E2B28] border border-white/10 hover:border-teal/40 text-xs text-[#F4F3ED] transition-all active:scale-[0.97] group font-sans"
            >
              <span>Manage All {galleries.length} Client Galleries in Table</span>
              <ArrowRight className="w-3.5 h-3.5 text-teal group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
