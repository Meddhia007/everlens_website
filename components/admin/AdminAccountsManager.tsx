'use client';

import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  UserPlus,
  Trash2,
  AlertTriangle,
  X,
  Eye,
  EyeOff,
  CheckCircle2,
  Users,
  KeyRound,
  Calendar,
  Lock,
} from 'lucide-react';
import { clsx } from 'clsx';

export interface AdminAccount {
  _id: string;
  email: string;
  name: string;
  createdAt: string;
  isCurrentUser: boolean;
}

export const AdminAccountsManager: React.FC = () => {
  const [admins, setAdmins] = useState<AdminAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Create modal state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Delete modal state
  const [deletingAdmin, setDeletingAdmin] = useState<AdminAccount | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchAdmins = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/admins');
      const data = await res.json();
      if (res.ok && Array.isArray(data.admins)) {
        setAdmins(data.admins);
      } else {
        setError(data.error || 'Failed to load admin accounts.');
      }
    } catch {
      setError('Network error loading admin accounts.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);

    if (!newEmail.trim() || !newEmail.includes('@')) {
      setCreateError('Please enter a valid email address.');
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      setCreateError('Password must be at least 6 characters.');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch('/api/admin/admins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName.trim() || 'Studio Admin',
          email: newEmail.trim().toLowerCase(),
          password: newPassword,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setIsCreateOpen(false);
        setNewName('');
        setNewEmail('');
        setNewPassword('');
        setSuccessMessage(`Admin account "${data.admin.email}" created successfully.`);
        fetchAdmins();
        setTimeout(() => setSuccessMessage(null), 4000);
      } else {
        setCreateError(data.error || 'Failed to create admin account.');
      }
    } catch {
      setCreateError('Network error creating admin account.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAdmin = async () => {
    if (!deletingAdmin) return;
    setIsDeleting(true);

    try {
      const res = await fetch(`/api/admin/admins/${deletingAdmin._id}`, {
        method: 'DELETE',
      });

      const data = await res.json();

      if (res.ok) {
        setDeletingAdmin(null);
        setSuccessMessage(data.message || 'Admin account deleted successfully.');
        fetchAdmins();
        setTimeout(() => setSuccessMessage(null), 4000);
      } else {
        alert(data.error || 'Failed to delete admin account.');
      }
    } catch {
      alert('Network error deleting admin account.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2 h-2 rounded-full bg-teal animate-pulse" />
            <span className="text-[11px] font-mono uppercase tracking-widest text-teal">
              Access & Security
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif text-[#F4F3ED] font-normal tracking-tight">
            Studio Administrators
          </h1>
          <p className="text-xs text-[#9EABA2] font-sans mt-1">
            Manage who has studio access to galleries, media archives, inquiries, and print orders.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setCreateError(null);
            setIsCreateOpen(true);
          }}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-[8px] bg-gradient-to-b from-[#48C9B0] to-[#36998A] text-[#0B0F0E] font-sans font-semibold text-xs shadow-sm hover:brightness-105 active:scale-[0.98] transition-all cursor-pointer shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          <span>New Admin Account</span>
        </button>
      </div>

      {/* Success Notification */}
      {successMessage && (
        <div className="p-4 bg-teal/10 border border-teal/30 text-teal text-xs font-sans rounded-[8px] flex items-center gap-3 animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Error Notification */}
      {error && (
        <div className="p-4 bg-red-950/40 border border-red-500/30 text-red-300 text-xs font-sans rounded-[8px] flex items-center justify-between">
          <span>{error}</span>
          <button
            type="button"
            onClick={fetchAdmins}
            className="underline underline-offset-4 hover:text-white ml-3"
          >
            Retry
          </button>
        </div>
      )}

      {/* Admin Accounts Table / Card Grid */}
      <div className="bg-[#111716] border border-white/[0.08] rounded-[10px] overflow-hidden shadow-xl">
        <div className="px-5 py-4 border-b border-white/[0.08] flex items-center justify-between bg-[#131B19]">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-teal" />
            <span className="text-xs font-sans font-medium text-[#F4F3ED]">
              Active Studio Admins ({admins.length})
            </span>
          </div>
          <span className="text-[11px] font-mono text-[#9EABA2]">
            Total: {admins.length} account{admins.length === 1 ? '' : 's'}
          </span>
        </div>

        {isLoading ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-8 h-8 rounded-full border-2 border-teal/20 border-t-teal animate-spin mx-auto" />
            <p className="text-xs font-mono text-[#9EABA2] uppercase tracking-wider">
              Loading admin accounts...
            </p>
          </div>
        ) : admins.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <ShieldCheck className="w-8 h-8 text-[#9EABA2]/40 mx-auto" />
            <p className="text-xs text-[#9EABA2]">No admin accounts found.</p>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.06]">
            {admins.map((admin) => {
              const initials = (admin.name || admin.email)
                .split(' ')
                .map((n) => n[0])
                .join('')
                .slice(0, 2)
                .toUpperCase();

              const formattedDate = admin.createdAt
                ? new Date(admin.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })
                : 'Initial';

              const canDelete = !admin.isCurrentUser && admins.length > 1;

              return (
                <div
                  key={admin._id}
                  className="px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-white/[0.02] transition-colors"
                >
                  {/* Left: Avatar & Info */}
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-full bg-teal/15 text-teal border border-teal/30 flex items-center justify-center font-mono text-xs font-semibold shrink-0">
                      {initials}
                    </div>

                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-sans font-semibold text-[#F4F3ED]">
                          {admin.name}
                        </span>
                        {admin.isCurrentUser && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider bg-teal/15 text-teal border border-teal/30">
                            You (Current Session)
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[11px] font-mono text-[#9EABA2]">
                        <span>{admin.email}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Date & Actions */}
                  <div className="flex items-center gap-4 sm:gap-6 self-end sm:self-center">
                    <div className="flex items-center gap-1.5 text-[11px] font-mono text-[#9EABA2]">
                      <Calendar className="w-3.5 h-3.5 opacity-60" />
                      <span>{formattedDate}</span>
                    </div>

                    {canDelete ? (
                      <button
                        type="button"
                        onClick={() => setDeletingAdmin(admin)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] text-xs font-sans text-red-400 hover:text-white bg-red-950/30 hover:bg-red-900/60 border border-red-800/40 transition-all cursor-pointer"
                        title={`Delete ${admin.email}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete</span>
                      </button>
                    ) : (
                      <span
                        className="text-[11px] font-mono text-[#9EABA2]/40 italic cursor-not-allowed"
                        title={
                          admin.isCurrentUser
                            ? 'Cannot delete your active account'
                            : 'Cannot delete the only remaining admin'
                        }
                      >
                        {admin.isCurrentUser ? 'Active Account' : 'Required'}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Safety Notice Card */}
      <div className="p-4 bg-[#111716] border border-white/[0.06] rounded-[8px] flex items-start gap-3 text-xs text-[#9EABA2]">
        <Lock className="w-4 h-4 text-teal shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="text-[#F4F3ED] font-medium">Security Guardrails</p>
          <p>
            At least one admin account must always remain active to prevent locking yourself out of
            the studio dashboard. You cannot delete the account you are currently logged in with.
          </p>
        </div>
      </div>

      {/* CREATE ADMIN MODAL */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-[#131B19] border border-white/10 rounded-[12px] max-w-md w-full p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-teal/15 text-teal border border-teal/30 flex items-center justify-center">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-sans font-semibold text-[#F4F3ED]">
                    Create Studio Admin
                  </h3>
                  <p className="text-[11px] text-[#9EABA2]">
                    Add a new administrator to manage the studio.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="p-1.5 text-[#9EABA2] hover:text-white rounded-xs hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Error in Modal */}
            {createError && (
              <div className="p-3 bg-red-950/40 border border-red-500/30 text-red-300 text-xs font-sans rounded-[6px]">
                {createError}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleCreateAdmin} autoComplete="off" className="space-y-4">
              {/* Autocomplete suppression hidden inputs */}
              <input type="text" className="hidden" tabIndex={-1} autoComplete="off" />
              <input type="password" className="hidden" tabIndex={-1} autoComplete="off" />

              <div className="space-y-1.5 text-left">
                <label className="block text-xs font-sans font-medium text-[#9EABA2]">
                  Administrator Name
                </label>
                <input
                  type="text"
                  required
                  autoComplete="off"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Meddhia Ben Abdelmalek"
                  className="w-full bg-[#182220] text-white placeholder:text-white/30 border border-white/10 focus:border-teal focus:ring-1 focus:ring-teal focus:outline-none py-2.5 px-3 text-xs rounded-[6px] transition-all"
                />
              </div>

              <div className="space-y-1.5 text-left">
                <label className="block text-xs font-sans font-medium text-[#9EABA2]">
                  Email Address
                </label>
                <input
                  type="email"
                  name="admin_creation_email"
                  required
                  autoComplete="off"
                  autoCapitalize="none"
                  spellCheck={false}
                  data-lpignore="true"
                  data-1p-ignore="true"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="admin@yourdomain.com"
                  className="w-full bg-[#182220] text-white placeholder:text-white/30 border border-white/10 focus:border-teal focus:ring-1 focus:ring-teal focus:outline-none py-2.5 px-3 text-xs rounded-[6px] transition-all"
                />
              </div>

              <div className="space-y-1.5 text-left">
                <label className="block text-xs font-sans font-medium text-[#9EABA2]">
                  Password (min. 6 characters)
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="admin_creation_password"
                    required
                    autoComplete="new-password"
                    data-lpignore="true"
                    data-1p-ignore="true"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter secure password"
                    className="w-full bg-[#182220] text-white placeholder:text-white/30 border border-white/10 focus:border-teal focus:ring-1 focus:ring-teal focus:outline-none py-2.5 pl-3 pr-10 text-xs rounded-[6px] transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#9EABA2] hover:text-white p-1"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 text-xs font-sans text-[#9EABA2] hover:text-white rounded-[6px] hover:bg-white/10 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-[6px] bg-teal hover:bg-[#389a8a] text-[#0B0F0E] font-sans font-semibold text-xs transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? 'Creating...' : 'Create Admin'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deletingAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-[#131B19] border border-red-500/30 rounded-[12px] max-w-sm w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="w-10 h-10 rounded-full bg-red-950/50 border border-red-500/40 text-red-400 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-5 h-5" />
            </div>

            <div className="text-center space-y-1.5">
              <h3 className="text-sm font-sans font-semibold text-[#F4F3ED]">
                Delete Admin Account?
              </h3>
              <p className="text-xs text-[#9EABA2]">
                Are you sure you want to permanently remove access for{' '}
                <strong className="text-white">{deletingAdmin.email}</strong>? This cannot be undone.
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingAdmin(null)}
                disabled={isDeleting}
                className="px-4 py-2 text-xs font-sans text-[#9EABA2] hover:text-white rounded-[6px] hover:bg-white/10 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteAdmin}
                disabled={isDeleting}
                className="px-4 py-2 rounded-[6px] bg-red-600 hover:bg-red-700 text-white font-sans font-semibold text-xs transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
              >
                {isDeleting ? 'Deleting...' : 'Delete Admin'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAccountsManager;
