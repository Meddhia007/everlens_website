'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Logo } from '@/components/Logo';
import { SignOutButton } from '@/components/SignOutButton';
import {
  LayoutDashboard,
  Layers,
  Inbox,
  Printer,
  Copy,
  Package,
  Camera,
  Tag,
  Plus,
  ExternalLink,
  Menu,
  X,
  ShieldCheck,
  Flag,
} from 'lucide-react';
import { clsx } from 'clsx';
import { useAdminModal } from './AdminModalContext';

interface AdminSidebarProps {
  adminEmail?: string;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({ adminEmail }) => {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { openNewGallery } = useAdminModal();

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const navSections = [
    {
      title: 'MAIN',
      items: [
        {
          label: 'Dashboard',
          href: '/admin',
          icon: LayoutDashboard,
          isActive: pathname === '/admin',
        },
        {
          label: 'Galleries',
          href: '/admin/galleries',
          icon: Layers,
          isActive: pathname.startsWith('/admin/galleries'),
        },
        {
          label: 'Inquiries',
          href: '/admin/inquiries',
          icon: Inbox,
          isActive: pathname.startsWith('/admin/inquiries'),
        },
        {
          label: 'Print Orders',
          href: '/admin/prints',
          icon: Printer,
          isActive: pathname.startsWith('/admin/prints'),
        },
        {
          label: 'Client Feedback',
          href: '/admin/feedback',
          icon: Flag,
          isActive: pathname.startsWith('/admin/feedback'),
        },
      ],
    },
    {
      title: 'CONTENT',
      items: [
        {
          label: 'Portfolio Posts',
          href: '/admin/portfolio',
          icon: Copy,
          isActive: pathname.startsWith('/admin/portfolio'),
        },
        {
          label: 'Wedding Packs',
          href: '/admin/services',
          icon: Package,
          isActive: pathname.startsWith('/admin/services'),
        },
      ],
    },
    {
      title: 'RESOURCES',
      items: [
        {
          label: 'Equipment',
          href: '/admin/equipment',
          icon: Camera,
          isActive: pathname.startsWith('/admin/equipment'),
        },
        {
          label: 'Categories',
          href: '/admin/work-categories',
          icon: Tag,
          isActive: pathname.startsWith('/admin/work-categories'),
        },
      ],
    },
    {
      title: 'SETTINGS',
      items: [
        {
          label: 'Admin Accounts',
          href: '/admin/admins',
          icon: ShieldCheck,
          isActive: pathname.startsWith('/admin/admins'),
        },
      ],
    },
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#0E1413] text-[#F4F3ED] select-none">
      {/* Brand Header */}
      <div className="px-5 py-5 border-b border-white/[0.08] flex items-center justify-between">
        <div>
          <Logo size="sm" href="/admin" theme="on-dark" />
          <div className="mt-2 flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono tracking-wider uppercase bg-teal/10 text-teal border border-teal/25 w-fit">
            <span className="w-1.5 h-1.5 rounded-full bg-teal animate-pulse" />
            Studio Admin
          </div>
        </div>
        {mobileOpen && (
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="md:hidden p-1.5 text-[#9EABA2] hover:text-white rounded-xs hover:bg-white/10"
            aria-label="Close navigation"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 overflow-y-auto px-3 py-5 space-y-6">
        {navSections.map((section) => (
          <div key={section.title} className="space-y-1">
            <div className="text-[10px] font-mono uppercase tracking-widest text-[#9EABA2]/60 px-3 mb-2">
              {section.title}
            </div>
            <nav className="space-y-0.5">
              {section.items.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    className={clsx(
                      'flex items-center gap-3 px-3 py-2 rounded-[8px] text-xs transition-all duration-200 ease-out font-sans',
                      item.isActive
                        ? 'bg-teal/15 text-teal font-medium shadow-[0_0_15px_rgba(67,177,159,0.12)] border border-teal/20'
                        : 'text-[#9EABA2] hover:text-[#F4F3ED] hover:bg-white/[0.04]'
                    )}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        ))}
      </div>

      {/* Bottom Actions & Account */}
      <div className="p-4 border-t border-white/[0.08] space-y-3 bg-[#0A0E0D]">
        {/* Quick Action Button - Opens Centered Modal */}
        <button
          type="button"
          onClick={openNewGallery}
          className="flex items-center justify-center gap-2 w-full py-2.5 px-3 rounded-[8px] bg-gradient-to-b from-[#48C9B0] to-[#36998A] text-[#0B0F0E] font-medium text-xs shadow-sm hover:brightness-105 active:scale-[0.97] transition-all duration-150 ease-out cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>New Gallery</span>
        </button>

        {/* Return to Website & Exit */}
        <button
          type="button"
          onClick={async () => {
            if (typeof window !== 'undefined') {
              sessionStorage.removeItem('everlens_admin_active');
            }
            try {
              await fetch('/api/auth/admin/logout', { method: 'POST' });
            } catch (err) {
              console.error(err);
            }
            window.location.href = '/';
          }}
          className="flex items-center justify-between w-full px-3 py-2 text-xs text-[#9EABA2] hover:text-[#43B19F] hover:bg-white/[0.04] rounded-[8px] transition-colors cursor-pointer text-left"
        >
          <span>Return to Website</span>
          <ExternalLink className="w-3 h-3 text-[#9EABA2]" />
        </button>

        {/* Admin Account & Sign Out */}
        <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between">
          <Link
            href="/admin/admins"
            className="flex items-center gap-1.5 text-[11px] font-mono text-[#9EABA2] hover:text-teal transition-colors truncate max-w-[130px] group"
            title="Manage Admin Accounts"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-teal shrink-0 group-hover:scale-110 transition-transform" />
            <span className="truncate">{adminEmail || 'Admin'}</span>
          </Link>

          <SignOutButton
            type="admin"
            variant="ghost"
            className="text-[11px] text-[#9EABA2] hover:text-red-400 hover:bg-red-950/20 px-2 py-1 rounded-xs transition-colors"
          />
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Fixed Sidebar */}
      <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 z-40 border-r border-white/[0.08]">
        {sidebarContent}
      </aside>

      {/* Mobile Top Header */}
      <div className="md:hidden sticky top-0 z-40 bg-[#0E1413]/95 backdrop-blur-md border-b border-white/[0.08] px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Logo size="sm" href="/admin" theme="on-dark" />
          <span className="px-1.5 py-0.5 rounded-full text-[9px] font-mono uppercase bg-teal/10 text-teal border border-teal/25">
            Admin
          </span>
        </div>
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="p-2 text-[#9EABA2] hover:text-white rounded-xs hover:bg-white/10 transition-colors"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileOpen(false)}
          />
          {/* Drawer content */}
          <div className="fixed inset-y-0 left-0 w-72 max-w-[85vw] shadow-2xl z-50 animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};

export default AdminSidebar;
