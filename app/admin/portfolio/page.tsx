import React from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifyAdminToken, ADMIN_COOKIE_NAME } from '@/lib/auth';
import { AdminNavbar } from '@/components/admin/AdminNavbar';
import { PortfolioPostsManager } from '@/components/admin/PortfolioPostsManager';

export const dynamic = 'force-dynamic';

export default async function AdminPortfolioPage() {
  const cookieStore = cookies();
  const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
  const session = token ? await verifyAdminToken(token) : null;

  if (!session) {
    redirect('/admin/login');
  }

  return (
    <div className="min-h-screen bg-[#0A0E0D] text-[#EAE8DA] flex flex-col font-sans">
      <AdminNavbar adminEmail={session.email} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <PortfolioPostsManager />
      </main>
    </div>
  );
}
