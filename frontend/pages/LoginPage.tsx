import React, { useState } from 'react';
import { GraduationCap, Lock, Mail, AlertCircle, ArrowRight, ShieldCheck, Eye, EyeOff, Loader2, CheckCircle2, KeyRound } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { apiClient } from '../api/api-client';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Forgot password flow states
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [isSendingForgot, setIsSendingForgot] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState<string | null>(null);
  const [forgotError, setForgotError] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !password) {
      setError('Please provide your email address and password.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const result = await login(identifier.trim(), password);
    if (!result.success) {
      setError(result.error || 'Authentication failed. Please check your credentials.');
      setIsSubmitting(false);
    }
    // On success, AuthContext automatically transitions the view via user session state.
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim() || !forgotEmail.includes('@')) {
      setForgotError('Please enter a valid email address.');
      return;
    }

    setIsSendingForgot(true);
    setForgotError(null);

    try {
      const res = await apiClient.forgotPassword(forgotEmail.trim());
      setForgotSuccess(res.message || 'If an account exists for this email address, a password reset link will be sent.');
      startCooldown();
    } catch {
      // Show neutral confirmation to avoid account enumeration
      setForgotSuccess('If an account exists for this email address, a password reset link will be sent.');
      startCooldown();
    } finally {
      setIsSendingForgot(false);
    }
  };

  const startCooldown = () => {
    setResendCooldown(30);
    const interval = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 text-slate-100 selection:bg-indigo-600 selection:text-white">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center">
          <div className="flex items-center justify-center w-13 h-13 rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/25 mb-4">
            <GraduationCap className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl font-display">
            Burra Pariksha CMS
          </h1>
          <p className="mt-1.5 text-sm text-slate-400">
            Production Editorial & Content Operations Platform
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 sm:p-8 shadow-2xl">
          {/* Security Status Header */}
          <div className="mb-6 flex items-center gap-2 px-3.5 py-2 rounded-lg bg-slate-800/60 border border-slate-700/50 text-xs text-slate-300">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-medium">
              {isForgotPassword ? 'Password recovery service' : 'Secure sign-in'}
            </span>
          </div>

          {isForgotPassword ? (
            /* Forgot Password View */
            <div className="space-y-5">
              <div className="flex items-center gap-3 pb-2 border-b border-slate-800">
                <div className="p-2 rounded-lg bg-indigo-600/10 text-indigo-400">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-white">Reset your password</h2>
                  <p className="text-xs text-slate-400">Enter your email to receive a recovery link.</p>
                </div>
              </div>

              {forgotError && (
                <div className="p-3.5 rounded-lg bg-rose-950/50 border border-rose-800/60 text-rose-200 text-xs flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <div className="flex-1 leading-relaxed font-medium">{forgotError}</div>
                </div>
              )}

              {forgotSuccess ? (
                <div className="space-y-4">
                  <div className="p-3.5 rounded-lg bg-emerald-950/50 border border-emerald-800/60 text-emerald-200 text-xs flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div className="flex-1 leading-relaxed font-medium">{forgotSuccess}</div>
                  </div>

                  <div className="pt-2 flex flex-col gap-2">
                    <button
                      type="button"
                      disabled={resendCooldown > 0 || isSendingForgot}
                      onClick={handleForgotSubmit}
                      className="w-full py-2.5 px-4 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                      {resendCooldown > 0 ? `Resend email in ${resendCooldown}s` : 'Resend link'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsForgotPassword(false);
                        setForgotSuccess(null);
                        setForgotError(null);
                      }}
                      className="w-full py-2 px-4 rounded-lg text-slate-400 hover:text-white font-medium text-xs transition-colors cursor-pointer"
                    >
                      Back to Sign In
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleForgotSubmit} className="space-y-4" noValidate>
                  <div>
                    <label
                      htmlFor="forgot-email"
                      className="block text-xs font-semibold text-slate-200 mb-1.5"
                    >
                      Work Email Address
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                        <Mail className="w-4 h-4" />
                      </div>
                      <input
                        id="forgot-email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        required
                        disabled={isSendingForgot}
                        value={forgotEmail}
                        onChange={(e) => {
                          setForgotEmail(e.target.value);
                          if (forgotError) setForgotError(null);
                        }}
                        placeholder="your.email@burrapariksha.com"
                        className="w-full pl-10 pr-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all disabled:opacity-50"
                      />
                    </div>
                  </div>

                  <div className="pt-2 flex flex-col gap-2">
                    <button
                      id="send-reset-link-button"
                      type="submit"
                      disabled={isSendingForgot}
                      className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-medium text-sm transition-colors shadow-lg shadow-indigo-600/20 disabled:opacity-50 cursor-pointer"
                    >
                      {isSendingForgot ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-white" />
                          <span>Sending reset link...</span>
                        </>
                      ) : (
                        <>
                          <span>Send Password Reset Link</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsForgotPassword(false);
                        setForgotError(null);
                      }}
                      className="w-full py-2 px-4 rounded-lg text-slate-400 hover:text-white font-medium text-xs transition-colors cursor-pointer"
                    >
                      Cancel and Return to Sign In
                    </button>
                  </div>
                </form>
              )}
            </div>
          ) : (
            /* Normal Sign In View */
            <>
              {error && (
                <div
                  id="login-error-alert"
                  role="alert"
                  className="mb-6 p-3.5 rounded-lg bg-rose-950/50 border border-rose-800/60 text-rose-200 text-xs flex items-start gap-2.5"
                >
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <div className="flex-1 leading-relaxed font-medium">{error}</div>
                </div>
              )}

              <form id="login-form" className="space-y-4.5" onSubmit={handleSubmit} noValidate>
                <div>
                  <label
                    htmlFor="login-identifier"
                    className="block text-xs font-semibold text-slate-200 mb-1.5"
                  >
                    Email address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      id="login-identifier"
                      name="identifier"
                      type="email"
                      autoComplete="username email"
                      required
                      disabled={isSubmitting}
                      value={identifier}
                      onChange={(e) => {
                        setIdentifier(e.target.value);
                        if (error) setError(null);
                      }}
                      placeholder="Enter your email address"
                      className="w-full pl-10 pr-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label
                      htmlFor="login-password"
                      className="block text-xs font-semibold text-slate-200"
                    >
                      Password
                    </label>
                    <button
                      id="forgot-password-link"
                      type="button"
                      onClick={() => {
                        setIsForgotPassword(true);
                        setForgotEmail(identifier.trim());
                        setForgotSuccess(null);
                        setForgotError(null);
                      }}
                      className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors focus:outline-none cursor-pointer"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      id="login-password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      required
                      disabled={isSubmitting}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (error) setError(null);
                      }}
                      placeholder="••••••••••••"
                      className="w-full pl-10 pr-10 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    <button
                      id="toggle-password-visibility-button"
                      type="button"
                      tabIndex={0}
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200 transition-colors focus:outline-none cursor-pointer"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    id="sign-in-button"
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-medium text-sm transition-colors shadow-lg shadow-indigo-600/20 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-white" />
                        <span>Verifying credentials...</span>
                      </>
                    ) : (
                      <>
                        <span>Sign In</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>

        {/* Security & Audit Notice */}
        <p className="mt-6 text-center text-xs text-slate-500 leading-relaxed max-w-sm mx-auto">
          Authorized team access only. Authentication activity is logged for security.
        </p>
      </div>
    </div>
  );
};
