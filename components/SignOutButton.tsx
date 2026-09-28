'use client';

import React, { useState } from 'react';
import { Button } from '@/components/Button';
import { LogOut } from 'lucide-react';

interface SignOutButtonProps {
  type: 'admin' | 'client';
  redirectUrl?: string;
  variant?: 'primary' | 'secondary' | 'ghost';
  className?: string;
}

export const SignOutButton: React.FC<SignOutButtonProps> = ({
  type,
  redirectUrl,
  variant = 'secondary',
  className,
}) => {
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      if (typeof window !== 'undefined') {
        if (type === 'admin') {
          sessionStorage.removeItem('everlens_admin_active');
        } else {
          sessionStorage.removeItem('everlens_client_active');
        }
      }
      const endpoint = type === 'admin' ? '/api/auth/admin/logout' : '/api/auth/client/logout';
      await fetch(endpoint, { method: 'POST' });
      const target = redirectUrl || (type === 'admin' ? '/admin/login' : '/portal/login');
      window.location.href = target;
    } catch (err) {
      console.error('Logout error:', err);
      const target = redirectUrl || (type === 'admin' ? '/admin/login' : '/portal/login');
      window.location.href = target;
    }
  };

  return (
    <Button
      variant={variant}
      size="sm"
      onClick={handleLogout}
      disabled={isLoggingOut}
      className={className}
    >
      <LogOut className="w-3.5 h-3.5 mr-2" />
      {isLoggingOut ? 'Signing out...' : 'Sign Out'}
    </Button>
  );
};

export default SignOutButton;
