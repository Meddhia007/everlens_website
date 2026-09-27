import React from 'react';
import { cookies } from 'next/headers';
import { verifyAdminToken, ADMIN_COOKIE_NAME } from '@/lib/auth';
import { AdminLayoutClient } from '@/components/admin/AdminLayoutClient';

export const dynamic = 'force-dynamic';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
  const session = token ? await verifyAdminToken(token) : null;

  return (
    <AdminLayoutClient adminEmail={session?.email}>
      {children}
    </AdminLayoutClient>
  );
}
