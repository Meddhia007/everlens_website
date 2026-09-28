'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { AdminSidebar } from './AdminSidebar';
import { AdminModalProvider } from './AdminModalContext';

interface AdminLayoutClientProps {
  children: React.ReactNode;
  adminEmail?: string;
}

export const AdminLayoutClient: React.FC<AdminLayoutClientProps> = ({
  children,
  adminEmail,
}) => {
  const pathname = usePathname();
  const isLoginPage = pathname === '/admin/login';

  React.useEffect(() => {
    if (isLoginPage) return;
    // Check if the current browser tab has an active login session
    const active = typeof window !== 'undefined' ? sessionStorage.getItem('everlens_admin_active') : '1';
    if (!active) {
      // Tab was closed and reopened: expire cookie and redirect to login
      fetch('/api/auth/admin/logout', { method: 'POST' }).finally(() => {
        window.location.href = '/admin/login';
      });
    }
  }, [isLoginPage]);

  if (isLoginPage) {
    return <>{children}</>;
  }

  return (
    <AdminModalProvider>
      <div className="min-h-screen bg-[#0B0F0E] text-[#F4F3ED] font-sans">
        <AdminSidebar adminEmail={adminEmail} />
        <div className="md:pl-64 min-h-screen flex flex-col">
          {children}
        </div>
      </div>
    </AdminModalProvider>
  );
};

export default AdminLayoutClient;
