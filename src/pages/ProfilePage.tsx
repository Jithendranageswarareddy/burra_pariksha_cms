import React, { useState } from 'react';
import {
  User as UserIcon,
  ShieldCheck,
  KeyRound,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Lock,
  Mail,
  Calendar,
  Clock,
  Check,
  X,
} from 'lucide-react';
import { PageHeader } from '../components/layout/PageHeader';
import { useAuth } from '../contexts/AuthContext';
import { getRoleDisplayName, resolveCanonicalRole, CANONICAL_ROLE_DESCRIPTORS } from '../config/roles';

export const ProfilePage: React.FC = () => {
  const { user, changePassword } = useAuth();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const userName = user?.name || 'System Admin';
  const userEmail = user?.email || 'jithendrareddy629@gmail.com';
  const canonicalRole = resolveCanonicalRole(user?.role);
  const roleDescriptor = CANONICAL_ROLE_DESCRIPTORS[canonicalRole];
  const roleDisplayName = getRoleDisplayName(user?.role);

  const getInitials = (name: string) => {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const isMinLength = newPassword.length >= 8;
  const isMatching = Boolean(newPassword && confirmPassword && newPassword === confirmPassword);
  const isDifferentFromCurrent = Boolean(newPassword && currentPassword && newPassword !== currentPassword);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage(null);
    setErrorMessage(null);

    if (!currentPassword) {
      setErrorMessage('Please enter your current password.');
      return;
    }

    if (!newPassword) {
      setErrorMessage('Please enter a new password.');
      return;
    }

    if (newPassword.length < 8) {
      setErrorMessage('New password must be at least 8 characters long.');
      return;
    }

    if (!confirmPassword) {
      setErrorMessage('Please confirm your new password.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('New password and confirmation do not match.');
      return;
    }

    if (newPassword === currentPassword) {
      setErrorMessage('New password cannot be the same as your current password.');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await changePassword(currentPassword, newPassword, confirmPassword);
      if (result.success) {
        setSuccessMessage(result.message || 'Password changed successfully. Your credentials have been updated.');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setErrorMessage(result.error || 'Failed to change password. Please verify your current password.');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'An unexpected error occurred while changing password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      <PageHeader
        title="User Profile & Security"
        description="Manage your team identity, role authorization, and administrator access credentials."
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Profile & Security' },
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Account Identity Card (4 columns) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs p-6">
            <div className="flex items-center gap-4 pb-6 border-b border-slate-100">
              <div className="w-16 h-16 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold text-xl shadow-md shadow-indigo-100 shrink-0">
                {getInitials(userName)}
              </div>
              <div className="min-w-0">
                <h2 className="text-lg font-bold text-slate-900 truncate">{userName}</h2>
                <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5 truncate">
                  <Mail className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{userEmail}</span>
                </div>
                <div className="mt-2.5">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold border ${roleDescriptor.badgeColor}`}
                  >
                    {roleDisplayName}
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-5 space-y-3.5 text-xs">
              <div className="flex items-center justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500 font-medium">User Identifier</span>
                <span className="font-mono font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                  {user?.id || 'USR-001'}
                </span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500 font-medium">Account Status</span>
                <span className="inline-flex items-center gap-1.5 text-emerald-700 font-semibold bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Active
                </span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500 font-medium">Data Scope</span>
                <span className="font-medium text-slate-800">
                  {user?.dataScope || 'Global (ALL)'}
                </span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500 font-medium">Role Level</span>
                <span className="font-medium text-slate-800">{canonicalRole}</span>
              </div>

              {user?.last_login_at && (
                <div className="flex items-center justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500 font-medium">Last Login</span>
                  <span className="font-mono text-slate-600 text-[11px]">
                    {new Date(user.last_login_at).toLocaleString()}
                  </span>
                </div>
              )}
            </div>

            <div className="mt-6 p-3.5 rounded-lg bg-indigo-50/60 border border-indigo-100/80 text-xs text-indigo-900 flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                As a canonical <strong>{roleDisplayName}</strong>, your account has authoritative operational privileges, including content approval, taxonomy governance, and system recovery.
              </p>
            </div>
          </div>
        </div>

        {/* Password Management Card (7 columns) */}
        <div className="lg:col-span-7">
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs p-6 md:p-8">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
              <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                <KeyRound className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Change Password</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Update your account access password. New passwords are cryptographic scrypt hashes.
                </p>
              </div>
            </div>

            {/* Notification Banners */}
            {successMessage && (
              <div
                role="status"
                className="mt-5 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-start gap-3 animate-in fade-in-50"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold text-emerald-950">Success</p>
                  <p className="mt-0.5">{successMessage}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSuccessMessage(null)}
                  className="text-emerald-700 hover:text-emerald-900"
                  aria-label="Dismiss success message"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {errorMessage && (
              <div
                role="alert"
                className="mt-5 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-start gap-3 animate-in fade-in-50"
              >
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold text-rose-950">Error</p>
                  <p className="mt-0.5">{errorMessage}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setErrorMessage(null)}
                  className="text-rose-700 hover:text-rose-900"
                  aria-label="Dismiss error message"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Password Form */}
            <form onSubmit={handleSubmit} className="mt-6 space-y-5">
              {/* Current Password */}
              <div>
                <label
                  htmlFor="current-password-input"
                  className="block text-xs font-semibold text-slate-700 mb-1.5"
                >
                  Current Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    id="current-password-input"
                    type={showCurrent ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter your current password"
                    autoComplete="current-password"
                    disabled={isSubmitting}
                    className="w-full pl-9 pr-10 py-2.5 bg-slate-50/50 border border-slate-300 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrent(!showCurrent)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                    aria-label={showCurrent ? 'Hide password' : 'Show password'}
                  >
                    {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div>
                <label
                  htmlFor="new-password-input"
                  className="block text-xs font-semibold text-slate-700 mb-1.5"
                >
                  New Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <input
                    id="new-password-input"
                    type={showNew ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter at least 8 characters"
                    autoComplete="new-password"
                    disabled={isSubmitting}
                    className="w-full pl-9 pr-10 py-2.5 bg-slate-50/50 border border-slate-300 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew(!showNew)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                    aria-label={showNew ? 'Hide password' : 'Show password'}
                  >
                    {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm New Password */}
              <div>
                <label
                  htmlFor="confirm-password-input"
                  className="block text-xs font-semibold text-slate-700 mb-1.5"
                >
                  Confirm New Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <input
                    id="confirm-password-input"
                    type={showConfirm ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter your new password"
                    autoComplete="new-password"
                    disabled={isSubmitting}
                    className="w-full pl-9 pr-10 py-2.5 bg-slate-50/50 border border-slate-300 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                    aria-label={showConfirm ? 'Hide password' : 'Show password'}
                  >
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Realtime Password Policy Indicators */}
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/60 space-y-1.5 text-[11px]">
                <span className="font-semibold text-slate-700 block">Password Requirements:</span>
                <div className="flex items-center gap-2">
                  {isMinLength ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <span className="w-3.5 h-3.5 rounded-full border border-slate-300 inline-block" />
                  )}
                  <span className={isMinLength ? 'text-emerald-700 font-medium' : 'text-slate-500'}>
                    Minimum 8 characters length
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {isMatching ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <span className="w-3.5 h-3.5 rounded-full border border-slate-300 inline-block" />
                  )}
                  <span className={isMatching ? 'text-emerald-700 font-medium' : 'text-slate-500'}>
                    New password and confirmation match
                  </span>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  id="submit-password-change-btn"
                  disabled={isSubmitting || !currentPassword || !newPassword || !confirmPassword || !isMinLength || !isMatching}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white text-xs font-semibold rounded-lg shadow-xs hover:shadow-sm transition-all focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Updating Password...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>Update Password</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
