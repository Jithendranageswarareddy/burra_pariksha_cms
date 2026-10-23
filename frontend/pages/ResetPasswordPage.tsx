import React, { useState, useEffect } from 'react';
import { Lock, AlertCircle, ArrowRight, ShieldCheck, Eye, EyeOff, Loader2, CheckCircle2, GraduationCap } from 'lucide-react';
import { apiClient } from '../api/api-client';

export const ResetPasswordPage: React.FC = () => {
  const [oobCode, setOobCode] = useState<string>('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isVerifyingCode, setIsVerifyingCode] = useState(true);
  const [codeValid, setCodeValid] = useState<boolean | null>(null);
  const [associatedEmail, setAssociatedEmail] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [manualCodeInput, setManualCodeInput] = useState('');

  const handleVerifyCode = (code: string) => {
    let cleanCode = code.trim();
    if (cleanCode.includes('oobCode=')) {
      try {
        const u = new URL(cleanCode);
        cleanCode = u.searchParams.get('oobCode') || cleanCode;
      } catch {
        const match = cleanCode.match(/oobCode=([^&]+)/);
        if (match) cleanCode = match[1];
      }
    }
    if (!cleanCode) {
      setError('Please provide a valid action code or reset link.');
      setCodeValid(false);
      return;
    }

    setOobCode(cleanCode);
    setIsVerifyingCode(true);
    setError(null);

    apiClient
      .verifyResetCode(cleanCode)
      .then((res) => {
        if (res.valid) {
          setCodeValid(true);
          if (res.email) setAssociatedEmail(res.email);
        } else {
          setCodeValid(false);
          setError(res.error || 'This password reset link is invalid, expired, or has already been used.');
        }
      })
      .catch((err) => {
        setCodeValid(false);
        setError(err?.message || 'Failed to verify password reset link.');
      })
      .finally(() => {
        setIsVerifyingCode(false);
      });
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('oobCode');
    if (!code) {
      setIsVerifyingCode(false);
      setCodeValid(null);
      return;
    }
    handleVerifyCode(code);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await apiClient.resetPassword(oobCode, newPassword, confirmPassword);
      if (res.success) {
        setSuccess(res.message || 'Password has been reset successfully. You may now sign in.');
      } else {
        setError(res.error || 'Failed to reset password. The link may have expired.');
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to reset password. Please request a new link.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 text-slate-100 selection:bg-indigo-600 selection:text-white">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex flex-col items-center text-center">
          <div className="flex items-center justify-center w-13 h-13 rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/25 mb-4">
            <GraduationCap className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl font-display">
            Burra Pariksha CMS
          </h1>
          <p className="mt-1.5 text-sm text-slate-400">
            Account Password Setup & Recovery
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 sm:p-8 shadow-2xl">
          <div className="mb-6 flex items-center gap-2 px-3.5 py-2 rounded-lg bg-slate-800/60 border border-slate-700/50 text-xs text-slate-300">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-medium">Secure Password Reset</span>
          </div>

          {isVerifyingCode ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
              <p className="text-xs text-slate-400">Verifying security token...</p>
            </div>
          ) : success ? (
            <div className="space-y-5">
              <div className="p-4 rounded-lg bg-emerald-950/50 border border-emerald-800/60 text-emerald-200 text-sm flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div className="leading-relaxed">{success}</div>
              </div>
              <a
                href="/"
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition-colors shadow-lg shadow-indigo-600/20"
              >
                <span>Proceed to Sign In</span>
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          ) : codeValid !== true ? (
            <div className="space-y-5">
              {error && (
                <div className="p-4 rounded-lg bg-rose-950/50 border border-rose-800/60 text-rose-200 text-xs flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                  <div className="leading-relaxed">
                    {error}
                  </div>
                </div>
              )}

              <div className="space-y-2.5">
                <label
                  htmlFor="manual-action-code"
                  className="block text-xs font-semibold text-slate-200"
                >
                  Enter Recovery Action Code or Link
                </label>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Paste the action code or the reset link received in your email:
                </p>
                <div className="flex gap-2">
                  <input
                    id="manual-action-code"
                    type="text"
                    value={manualCodeInput}
                    onChange={(e) => setManualCodeInput(e.target.value)}
                    placeholder="Paste code or link here..."
                    className="flex-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() => handleVerifyCode(manualCodeInput)}
                    disabled={!manualCodeInput.trim() || isVerifyingCode}
                    className="py-2 px-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    Verify
                  </button>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800">
                <a
                  href="/"
                  className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs transition-colors"
                >
                  <span>Return to Sign In</span>
                </a>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4.5" noValidate>
              {associatedEmail && (
                <div className="p-3 rounded-lg bg-slate-800/40 border border-slate-700/50 text-xs text-slate-300">
                  Setting new password for: <span className="font-semibold text-white">{associatedEmail}</span>
                </div>
              )}

              {error && (
                <div className="p-3.5 rounded-lg bg-rose-950/50 border border-rose-800/60 text-rose-200 text-xs flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <div className="flex-1 leading-relaxed font-medium">{error}</div>
                </div>
              )}

              <div>
                <label
                  htmlFor="reset-new-password"
                  className="block text-xs font-semibold text-slate-200 mb-1.5"
                >
                  New Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    id="reset-new-password"
                    name="newPassword"
                    type={showPassword ? 'text' : 'password'}
                    required
                    disabled={isSubmitting}
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      if (error) setError(null);
                    }}
                    placeholder="At least 8 characters"
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all disabled:opacity-50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200 transition-colors focus:outline-none cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label
                  htmlFor="reset-confirm-password"
                  className="block text-xs font-semibold text-slate-200 mb-1.5"
                >
                  Confirm New Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    id="reset-confirm-password"
                    name="confirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    required
                    disabled={isSubmitting}
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (error) setError(null);
                    }}
                    placeholder="Re-enter password"
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all disabled:opacity-50"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  id="reset-password-submit-btn"
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-medium text-sm transition-colors shadow-lg shadow-indigo-600/20 disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>Updating password...</span>
                    </>
                  ) : (
                    <>
                      <span>Set New Password</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>

              <div className="pt-1 text-center">
                <a
                  href="/"
                  className="text-xs text-slate-400 hover:text-slate-200 transition-colors"
                >
                  Cancel and return to sign in
                </a>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
