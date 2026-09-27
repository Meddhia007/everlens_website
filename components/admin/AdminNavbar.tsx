'use client';

import React from 'react';

interface AdminNavbarProps {
  adminEmail?: string;
}

/**
 * Admin navigation is now managed centrally by AdminSidebar in app/admin/layout.tsx.
 * AdminNavbar returns null to maintain backward compatibility without duplicate navbars.
 */
export const AdminNavbar: React.FC<AdminNavbarProps> = () => {
  return null;
};

export default AdminNavbar;
