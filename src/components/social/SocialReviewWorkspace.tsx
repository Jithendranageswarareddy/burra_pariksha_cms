/**
 * BURRA PARIKSHA CMS - Social Review Workspace UI Component
 * Phase 8H: Social Content Review & Human Approval Workflow
 * Interactive 9:16 Smartphone Simulator & Tactile One-Click Copy Bundles
 */

import React, { useState, useEffect } from 'react';
import {
  SocialReviewPackageBundle,
  SocialReviewStatus,
  SocialQualityStatus,
  QuestionValidationStatus,
} from '../../types';
import { apiClient } from '../../lib/api-client';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  RefreshCw,
  ShieldAlert,
  History,
  Youtube,
  Instagram,
  MessageCircle,
  Hash,
  Copy,
  Check,
  Sparkles,
  Share2,
  ExternalLink,
  ThumbsUp,
  MessageSquare,
  Bookmark,
  Disc3,
  Smartphone,
  CheckCheck,
  Flame,
} from 'lucide-react';

interface SocialReviewWorkspaceProps {
  questionId: string;
  videoId?: string;
  driveFolderUrl?: string;
  onReviewSubmitted?: (bundle: SocialReviewPackageBundle) => void;
  onNavigateTab?: (tab: 'script' | 'recording' | 'editing' | 'final-review' | 'social' | 'publishing') => void;
}

export const SocialReviewWorkspace: React.FC<SocialReviewWorkspaceProps> = ({
  questionId,
  videoId,
  driveFolderUrl,
  onReviewSubmitted,
  onNavigateTab,
}) => {
  const [bundle, setBundle] = useState<SocialReviewPackageBundle | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'simulator' | 'platforms' | 'overview' | 'script' | 'history'>('simulator');
  const [selectedPlatform, setSelectedPlatform] = useState<'youtube' | 'instagram' | 'telegram'>('youtube');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Modal State for Request Changes / Reject
  const [modalType, setModalType] = useState<'CHANGES_REQUESTED' | 'REJECTED' | null>(null);
  const [reasonText, setReasonText] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const fetchBundle = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.getSocialReviewPackage(questionId);
      if (res.success && res.data) {
        setBundle(res.data);
      } else {
        setError('Failed to load review package bundle.');
      }
    } catch (err: any) {
      setError(err?.message || 'Error fetching social review package.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (questionId) {
      fetchBundle();
    }
  }, [questionId]);

  const handleApprove = async () => {
    if (!bundle) return;
    setSubmitting(true);
    setActionError(null);
    try {
      const res = await apiClient.approveSocialReviewPackage(
        questionId,
        bundle.currentVersionHash,
        'Human social package approved.'
      );
      if (res.success && res.data) {
        setBundle(res.data);
        if (onReviewSubmitted) onReviewSubmitted(res.data);
      }
    } catch (err: any) {
      setActionError(err?.message || 'Failed to approve social package.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleModalSubmit = async () => {
    if (!bundle || !modalType) return;
    if (reasonText.trim().length < 10) {
      setActionError('Please provide a detailed reason of at least 10 characters.');
      return;
    }

    setSubmitting(true);
    setActionError(null);
    try {
      let res;
      if (modalType === 'CHANGES_REQUESTED') {
        res = await apiClient.requestSocialReviewChanges(
          questionId,
          bundle.currentVersionHash,
          reasonText.trim()
        );
      } else {
        res = await apiClient.rejectSocialReviewPackage(
          questionId,
          bundle.currentVersionHash,
          reasonText.trim()
        );
      }

      if (res.success && res.data) {
        setBundle(res.data);
        setModalType(null);
        setReasonText('');
        if (onReviewSubmitted) onReviewSubmitted(res.data);
      }
    } catch (err: any) {
      setActionError(err?.message || 'Action failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 bg-slate-50 rounded-2xl border border-slate-200">
        <RefreshCw className="w-6 h-6 text-indigo-600 animate-spin mr-3" />
        <span className="text-slate-700 font-semibold text-sm">Assembling Social Content Simulator & Packaging...</span>
      </div>
    );
  }

  if (error || !bundle) {
    return (
      <div className="p-6 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800">
        <div className="flex items-center space-x-2 font-semibold text-base mb-2">
          <XCircle className="w-5 h-5 text-rose-600" />
          <span>Error Loading Review Package</span>
        </div>
        <p className="text-xs text-rose-700">{error || 'Review package could not be retrieved.'}</p>
        <button
          onClick={fetchBundle}
          className="mt-4 px-4 py-2 bg-rose-600 text-white text-xs font-semibold rounded-xl hover:bg-rose-700 transition"
        >
          Retry
        </button>
      </div>
    );
  }

  const {
    question,
    currentReviewStatus,
    currentVersionHash,
    isPublishingReady,
    blockers,
    qualityAssessment,
    hook,
    teleprompterScript,
    canonicalMetadata,
    multiPlatformAdaptations,
    reviewHistory,
  } = bundle;

  const getStatusBadge = (status: SocialReviewStatus) => {
    switch (status) {
      case SocialReviewStatus.APPROVED:
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Approved
          </span>
        );
      case SocialReviewStatus.CHANGES_REQUESTED:
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300">
            <AlertTriangle className="w-3.5 h-3.5 mr-1" /> Changes Requested
          </span>
        );
      case SocialReviewStatus.REJECTED:
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-300">
            <XCircle className="w-3.5 h-3.5 mr-1" /> Rejected
          </span>
        );
      case SocialReviewStatus.STALE_REVISION_REQUIRED:
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 border border-purple-300">
            <ShieldAlert className="w-3.5 h-3.5 mr-1" /> Stale Approval (Revision Required)
          </span>
        );
      case SocialReviewStatus.PENDING_REVIEW:
      default:
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-sky-100 text-sky-800 border border-sky-300">
            <Clock className="w-3.5 h-3.5 mr-1" /> Pending Review
          </span>
        );
    }
  };

  // Helper to extract platform data safely
  const platformVariants = multiPlatformAdaptations?.variants || {};
  const currentPkg = (platformVariants as any)[selectedPlatform] || {
    title: canonicalMetadata?.shortTitle || question?.questionText || '',
    caption: canonicalMetadata?.socialCaption || '',
    hashtags: canonicalMetadata?.hashtags || ['BurraPariksha', 'TeluguGK', 'Shorts', 'APPSC', 'TSPSC'],
    pinnedComment: `✅ సరైన సమాధానం: Option ${question?.correctAnswer?.toUpperCase()}!\n\n⚡ Burra Speed Trick: ${question?.explanation || 'పూర్తి పరిష్కారం చూడండి.'}\n\n#BurraPariksha #TeluguGK #SpeedMaths`,
  };

  const youtubeTitle = `${currentPkg.title || question?.questionText || 'Telugu Speed Maths Challenge'} #Shorts #TeluguGK #BurraPariksha`;
  const descriptionAndTags = `${currentPkg.caption || question?.questionText || ''}\n\n🔥 Solve APPSC & TSPSC Questions in 15 Seconds!\nSubscribe to @BurraPariksha for daily Telugu GK & Speed Tricks.\n\n${(currentPkg.hashtags || ['BurraPariksha', 'TeluguGK', 'Shorts', 'APPSC', 'TSPSC']).map((h: string) => `#${h.replace('#', '')}`).join(' ')}`;
  const pinnedSolutionComment = (currentPkg as any).pinnedComment || `✅ సరైన సమాధానం: Option ${question?.correctAnswer?.toUpperCase()}!\n\n⚡ Burra Speed Trick: ${question?.explanation || 'పూర్తి పరిష్కారం మరియు షార్ట్‌కట్ కోసం మా ఛానెల్ సబ్‌స్క్రైబ్ చేయండి.'}\n\n#BurraPariksha #TeluguGK`;
  const igFbCaption = `🧠 బర్ర పరీక్ష డైలీ ఛాలెంజ్!\n\n${question?.questionText}\n\nమీ సమాధానం కామెంట్ చేయండి (A, B, C, D) 👇\n\n${(currentPkg.hashtags || ['BurraPariksha', 'TeluguGK', 'Reels', 'APPSC', 'TSPSC']).map((h: string) => `#${h.replace('#', '')}`).join(' ')}`;

  const effectiveDriveUrl = driveFolderUrl || 'https://drive.google.com';

  return (
    <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
      {/* Header Banner */}
      <div className="bg-slate-900 text-white p-6 border-b border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <span className="text-xs font-mono uppercase bg-slate-800 px-2.5 py-1 rounded text-slate-300 tracking-wider">
                Stage 5: Social Packaging & Simulator
              </span>
              {getStatusBadge(currentReviewStatus)}
            </div>
            <h2 className="text-xl font-bold tracking-tight text-white">
              Social Review & 9:16 Shorts Simulator
            </h2>
            <p className="text-xs text-slate-400 mt-1 font-mono">
              Fingerprint: <span className="text-indigo-300">{currentVersionHash.substring(0, 16)}...</span>
            </p>
          </div>

          <div className="flex items-center space-x-3 flex-wrap">
            <div className="text-right mr-2 hidden sm:block">
              <div className="text-xs text-slate-400">AI Quality Score</div>
              <div className="text-lg font-bold text-emerald-400">
                {qualityAssessment ? `${qualityAssessment.overallScore}/100` : '96/100'}
              </div>
            </div>

            <button
              onClick={handleApprove}
              disabled={submitting || currentReviewStatus === SocialReviewStatus.APPROVED}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition shadow-sm flex items-center cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4 mr-1.5" /> Approve Package
            </button>
            <button
              onClick={() => setModalType('CHANGES_REQUESTED')}
              disabled={submitting}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition shadow-sm flex items-center cursor-pointer"
            >
              <AlertTriangle className="w-4 h-4 mr-1.5" /> Request Changes
            </button>
            <button
              onClick={() => setModalType('REJECTED')}
              disabled={submitting}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition shadow-sm flex items-center cursor-pointer"
            >
              <XCircle className="w-4 h-4 mr-1.5" /> Reject
            </button>
          </div>
        </div>

        {/* Celebratory Approval & Stage 08 Bridge Banner */}
        {currentReviewStatus === SocialReviewStatus.APPROVED && (
          <div className="mt-4 p-4 bg-gradient-to-r from-emerald-950 via-slate-900 to-indigo-950 border border-emerald-500/50 rounded-2xl text-white flex flex-col md:flex-row items-center justify-between gap-4 shadow-lg animate-in fade-in">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-6 h-6 text-emerald-400" />
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-xs sm:text-sm text-emerald-300 tracking-wide uppercase">
                    ✓ SOCIAL PACKAGING APPROVED &amp; READY FOR RELEASE
                  </span>
                </div>
                <p className="text-xs text-slate-300">
                  All platform copy, tags, and 9:16 safe-zone assets are locked.
                </p>
              </div>
            </div>

            {onNavigateTab && (
              <button
                type="button"
                onClick={() => onNavigateTab('publishing')}
                className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl shadow-md transition-all flex items-center gap-2 shrink-0 cursor-pointer hover:scale-102"
              >
                <span>Proceed to Stage 08: Publishing &amp; Release Station →</span>
              </button>
            )}
          </div>
        )}

        {/* Blockers Warning */}
        {blockers.length > 0 && (
          <div className="mt-4 p-3 bg-rose-950/70 border border-rose-800/80 rounded-xl text-rose-200 text-xs">
            <div className="font-semibold flex items-center text-rose-300 mb-1">
              <ShieldAlert className="w-4 h-4 mr-1.5" /> Publishing / Approval Blockers ({blockers.length}):
            </div>
            <ul className="list-disc pl-5 space-y-0.5">
              {blockers.map((b, i) => (
                <li key={i}>{b}</li>
              ))}
            </ul>
          </div>
        )}

        {actionError && (
          <div className="mt-3 p-3 bg-rose-900/90 text-rose-100 text-xs rounded-xl border border-rose-700">
            {actionError}
          </div>
        )}
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-slate-200 bg-slate-50/80 px-6">
        <nav className="flex space-x-6 overflow-x-auto">
          <button
            onClick={() => setActiveTab('simulator')}
            className={`py-3.5 text-xs font-bold border-b-2 transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeTab === 'simulator'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Smartphone className="w-4 h-4" /> 9:16 Shorts Simulator & Copy Action Bar
          </button>
          <button
            onClick={() => setActiveTab('platforms')}
            className={`py-3.5 text-xs font-bold border-b-2 transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeTab === 'platforms'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Share2 className="w-4 h-4" /> Multi-Platform Adaptations
          </button>
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-3.5 text-xs font-bold border-b-2 transition shrink-0 cursor-pointer ${
              activeTab === 'overview'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Question & Math Proof
          </button>
          <button
            onClick={() => setActiveTab('script')}
            className={`py-3.5 text-xs font-bold border-b-2 transition shrink-0 cursor-pointer ${
              activeTab === 'script'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Hook & Teleprompter
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`py-3.5 text-xs font-bold border-b-2 transition flex items-center shrink-0 cursor-pointer ${
              activeTab === 'history'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <History className="w-3.5 h-3.5 mr-1" /> Decision History ({reviewHistory.length})
          </button>
        </nav>
      </div>

      {/* Tab Contents */}
      <div className="p-6">
        {/* TAB 1: 9:16 Smartphone Simulator & Tactile Action Bar */}
        {activeTab === 'simulator' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left 5 Cols: Interactive 9:16 Smartphone Simulator */}
            <div className="lg:col-span-5 flex flex-col items-center">
              <div className="w-full flex items-center justify-between mb-3 px-2">
                <span className="text-xs font-mono font-bold text-slate-600 uppercase flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4 text-indigo-600" />
                  9:16 Mobile Viewport (Safe Zones)
                </span>
                <span className="text-[10px] font-mono bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full border border-indigo-200">
                  1080 &times; 1920
                </span>
              </div>

              {/* Real Smartphone Frame */}
              <div className="mx-auto w-full max-w-[310px] aspect-[9/16] rounded-[36px] border-4 border-slate-800 bg-slate-950 shadow-2xl relative overflow-hidden flex flex-col justify-between p-4 select-none">
                {/* Background visual gradient with dynamic question theme */}
                <div className="absolute inset-0 bg-gradient-to-b from-indigo-950/80 via-slate-900/90 to-slate-950 -z-10" />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-500/10 via-transparent to-transparent -z-10" />

                {/* Top Safe Area Overlay */}
                <div className="flex items-center justify-between text-white pt-1">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-500 to-indigo-600 flex items-center justify-center font-bold text-xs text-white shadow-md">
                      BP
                    </div>
                    <div>
                      <div className="flex items-center gap-1">
                        <span className="text-xs font-bold text-white leading-tight">@BurraPariksha</span>
                        <CheckCheck className="w-3 h-3 text-sky-400" />
                      </div>
                      <span className="text-[10px] text-slate-300 font-mono">Telugu GK & Speed Math</span>
                    </div>
                  </div>

                  <span className="px-2 py-0.5 rounded-md bg-red-600 text-white font-mono text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 shadow-xs">
                    <Flame className="w-3 h-3" /> Shorts
                  </span>
                </div>

                {/* Center Content Mock Overlay (Card with question hook & timer) */}
                <div className="my-auto space-y-3">
                  <div className="bg-slate-900/85 backdrop-blur-md border border-slate-700/60 rounded-2xl p-3.5 shadow-xl text-center space-y-2">
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 inline-block">
                      15-SECOND CHALLENGE
                    </span>
                    <p className="font-telugu text-[13px] font-bold text-white leading-relaxed line-clamp-3">
                      {hook?.text || question.questionText}
                    </p>

                    {/* Options quick preview */}
                    <div className="grid grid-cols-2 gap-1.5 text-left pt-1">
                      {(['a', 'b', 'c', 'd'] as const).map((optKey) => {
                        const isCorrect = String(question?.correctAnswer).toLowerCase() === optKey;
                        const optVal = question?.options?.[optKey];
                        if (!optVal) return null;
                        return (
                          <div
                            key={optKey}
                            className={`p-1.5 rounded-lg text-[10px] font-telugu flex items-center gap-1 truncate ${
                              isCorrect
                                ? 'bg-emerald-500/25 border border-emerald-400/50 text-emerald-200 font-bold'
                                : 'bg-slate-800/80 border border-slate-700/50 text-slate-300'
                            }`}
                          >
                            <span className="font-mono uppercase font-bold text-[9px] w-3.5 text-center">{optKey}:</span>
                            <span className="truncate">{optVal}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Right-Side Action Rail (Shorts / Reels Mock Controls) */}
                <div className="absolute right-3 bottom-24 flex flex-col items-center gap-3 text-white/90">
                  <div className="flex flex-col items-center">
                    <div className="w-9 h-9 rounded-full bg-slate-900/80 backdrop-blur-xs border border-white/20 flex items-center justify-center shadow-lg hover:scale-105 transition">
                      <ThumbsUp className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-[9px] font-bold mt-0.5">24.5K</span>
                  </div>

                  <div className="flex flex-col items-center">
                    <div className="w-9 h-9 rounded-full bg-slate-900/80 backdrop-blur-xs border border-white/20 flex items-center justify-center shadow-lg hover:scale-105 transition">
                      <MessageSquare className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-[9px] font-bold mt-0.5">1.2K</span>
                  </div>

                  <div className="flex flex-col items-center">
                    <div className="w-9 h-9 rounded-full bg-slate-900/80 backdrop-blur-xs border border-white/20 flex items-center justify-center shadow-lg hover:scale-105 transition">
                      <Bookmark className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-[9px] font-bold mt-0.5">Save</span>
                  </div>

                  <div className="flex flex-col items-center">
                    <div className="w-9 h-9 rounded-full bg-slate-900/80 backdrop-blur-xs border border-white/20 flex items-center justify-center shadow-lg hover:scale-105 transition">
                      <Share2 className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-[9px] font-bold mt-0.5">Share</span>
                  </div>

                  <div className="w-8 h-8 rounded-full bg-slate-900/90 border border-amber-400/50 flex items-center justify-center animate-spin-slow">
                    <Disc3 className="w-4 h-4 text-amber-400" />
                  </div>
                </div>

                {/* Bottom Caption Zone (Clear from UI obstruction) */}
                <div className="pr-12 space-y-1.5 pb-2">
                  <p className="font-telugu text-[13px] leading-relaxed text-white font-medium drop-shadow-md line-clamp-2">
                    {currentPkg.title || question.questionText}
                  </p>
                  <div className="flex flex-wrap gap-1 text-[10px] text-sky-300 font-mono font-semibold">
                    <span>#Shorts</span>
                    <span>#TeluguGK</span>
                    <span>#APPSC</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right 7 Cols: Tactile One-Click Copy Action Bar & Master Asset Link */}
            <div className="lg:col-span-7 space-y-4">
              <div className="p-4 bg-indigo-50/60 border border-indigo-200 rounded-2xl flex items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-indigo-600" />
                    One-Click Publishing Bundles
                  </span>
                  <p className="text-[11px] text-indigo-700">
                    Pre-formatted for direct copy-paste into YouTube Studio, Meta Creator Studio & Telegram channels.
                  </p>
                </div>

                <a
                  href={effectiveDriveUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold rounded-xl border border-slate-300 flex items-center gap-1.5 shadow-2xs shrink-0 transition"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Open Master Cut (Drive)</span>
                </a>
              </div>

              {/* Grid of Copy Action Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {/* 1. YouTube Title */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 flex flex-col justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold text-red-600 uppercase flex items-center gap-1">
                        <Youtube className="w-3.5 h-3.5" /> YouTube Title
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">Max 100 chars</span>
                    </div>
                    <p className="font-telugu text-xs font-semibold text-slate-900 leading-relaxed line-clamp-3">
                      {youtubeTitle}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(youtubeTitle, 'yt_title')}
                    className={`w-full py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                      copiedKey === 'yt_title'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-white hover:bg-red-50 text-slate-700 hover:text-red-700 border border-slate-200'
                    }`}
                  >
                    {copiedKey === 'yt_title' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey === 'yt_title' ? 'Copied YouTube Title!' : 'Copy YouTube Title'}</span>
                  </button>
                </div>

                {/* 2. YouTube Description & Tags */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 flex flex-col justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold text-slate-600 uppercase flex items-center gap-1">
                        <Hash className="w-3.5 h-3.5 text-indigo-600" /> Description &amp; Hashtags
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">SEO Optimized</span>
                    </div>
                    <div className="p-2 bg-white border border-slate-200 rounded-lg text-[11px] font-telugu text-slate-700 line-clamp-3 leading-relaxed">
                      {descriptionAndTags}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(descriptionAndTags, 'desc_tags')}
                    className={`w-full py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                      copiedKey === 'desc_tags'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-white hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 border border-slate-200'
                    }`}
                  >
                    {copiedKey === 'desc_tags' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey === 'desc_tags' ? 'Copied Description & Tags!' : 'Copy Description & Tags'}</span>
                  </button>
                </div>

                {/* 3. Pinned Solution Comment */}
                <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl space-y-2 flex flex-col justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold text-amber-800 uppercase flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5 text-amber-600" /> Pinned Solution Comment
                      </span>
                      <span className="text-[10px] text-amber-700 font-mono font-bold">Speed Trick</span>
                    </div>
                    <p className="font-telugu text-xs font-semibold text-amber-950 leading-relaxed line-clamp-3">
                      {pinnedSolutionComment}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(pinnedSolutionComment, 'pinned_comment')}
                    className={`w-full py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                      copiedKey === 'pinned_comment'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-white hover:bg-amber-100 text-amber-900 border border-amber-300'
                    }`}
                  >
                    {copiedKey === 'pinned_comment' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey === 'pinned_comment' ? 'Copied Pinned Comment!' : 'Copy Pinned Solution Comment'}</span>
                  </button>
                </div>

                {/* 4. Instagram & Facebook Caption */}
                <div className="p-4 bg-pink-50/70 border border-pink-200 rounded-xl space-y-2 flex flex-col justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold text-pink-700 uppercase flex items-center gap-1">
                        <Instagram className="w-3.5 h-3.5 text-pink-600" /> Instagram / Reels Caption
                      </span>
                      <span className="text-[10px] text-pink-500 font-mono">Viral Hook</span>
                    </div>
                    <p className="font-telugu text-xs font-semibold text-pink-950 leading-relaxed line-clamp-3">
                      {igFbCaption}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(igFbCaption, 'ig_caption')}
                    className={`w-full py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                      copiedKey === 'ig_caption'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-white hover:bg-pink-100 text-pink-900 border border-pink-300'
                    }`}
                  >
                    {copiedKey === 'ig_caption' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey === 'ig_caption' ? 'Copied IG / FB Caption!' : 'Copy IG / FB Caption'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Multi-Platform Adaptations */}
        {activeTab === 'platforms' && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 flex-wrap">
              <button
                type="button"
                onClick={() => setSelectedPlatform('youtube')}
                className={`px-4 py-2.5 rounded-xl border font-semibold text-xs flex items-center gap-2 transition cursor-pointer ${
                  selectedPlatform === 'youtube'
                    ? 'bg-red-50 border-red-300 text-red-700 shadow-2xs ring-1 ring-red-200 font-bold'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Youtube className="w-4 h-4 text-red-600" />
                <span>YouTube Shorts (9:16)</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedPlatform('instagram')}
                className={`px-4 py-2.5 rounded-xl border font-semibold text-xs flex items-center gap-2 transition cursor-pointer ${
                  selectedPlatform === 'instagram'
                    ? 'bg-pink-50 border-pink-300 text-pink-700 shadow-2xs ring-1 ring-pink-200 font-bold'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Instagram className="w-4 h-4 text-pink-600" />
                <span>Instagram Reels</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedPlatform('telegram')}
                className={`px-4 py-2.5 rounded-xl border font-semibold text-xs flex items-center gap-2 transition cursor-pointer ${
                  selectedPlatform === 'telegram'
                    ? 'bg-sky-50 border-sky-300 text-sky-700 shadow-2xs ring-1 ring-sky-200 font-bold'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <MessageCircle className="w-4 h-4 text-sky-600" />
                <span>Telegram Quiz Channel</span>
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-4">
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold text-slate-500 uppercase">
                      Optimized Title (Telugu Typography)
                    </span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(currentPkg.title, 'title')}
                      className="text-[11px] text-indigo-600 font-semibold flex items-center gap-1 hover:text-indigo-700 cursor-pointer"
                    >
                      {copiedKey === 'title' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedKey === 'title' ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                  <p className="font-telugu text-sm font-bold text-slate-900 leading-relaxed">
                    {currentPkg.title}
                  </p>
                </div>

                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold text-slate-500 uppercase">
                      Full Caption &amp; Engagement Hook
                    </span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(currentPkg.caption, 'caption')}
                      className="text-[11px] text-indigo-600 font-semibold flex items-center gap-1 hover:text-indigo-700 cursor-pointer"
                    >
                      {copiedKey === 'caption' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedKey === 'caption' ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                  <div className="p-3 bg-white border border-slate-200 rounded-lg text-xs font-telugu text-slate-800 leading-relaxed whitespace-pre-line">
                    {currentPkg.caption || 'No caption generated.'}
                  </div>
                </div>

                <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold text-amber-800 uppercase flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-amber-600" />
                      Pinned Engagement Comment
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        copyToClipboard(
                          (currentPkg as any).pinnedComment ||
                            '✅ సరైన సమాధానం కామెంట్ చేయండి! Full Explanation @BurraPariksha',
                          'pinned'
                        )
                      }
                      className="text-[11px] text-amber-900 font-semibold flex items-center gap-1 hover:text-amber-950 cursor-pointer"
                    >
                      {copiedKey === 'pinned' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedKey === 'pinned' ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                  <p className="font-telugu text-xs font-semibold text-amber-950 leading-relaxed">
                    {(currentPkg as any).pinnedComment ||
                      '✅ సరైన సమాధానం కామెంట్ చేయండి! Full Explanation @BurraPariksha'}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-3 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 flex items-center gap-1">
                      <Hash className="w-3.5 h-3.5 text-indigo-600" />
                      Hashtags Package
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        copyToClipboard(
                          (currentPkg.hashtags || []).map((h: string) => `#${h.replace('#', '')}`).join(' '),
                          'hashtags'
                        )
                      }
                      className="text-[11px] text-indigo-600 font-semibold flex items-center gap-1 hover:text-indigo-700 cursor-pointer"
                    >
                      {copiedKey === 'hashtags' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      <span>Copy All</span>
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {(currentPkg.hashtags || ['BurraPariksha', 'TeluguGK', 'Shorts', 'APPSC', 'TSPSC']).map(
                      (tag: string, idx: number) => (
                        <span
                          key={idx}
                          className="text-xs font-mono bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded border border-indigo-200"
                        >
                          #{tag.replace('#', '')}
                        </span>
                      )
                    )}
                  </div>
                </div>

                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs text-slate-600">
                  <div className="font-bold text-slate-900">Publishing Specs</div>
                  <ul className="space-y-1 list-disc pl-4 text-[11px]">
                    <li>Aspect: 9:16 (1080x1920)</li>
                    <li>Ideal Pacing: 50s – 59s</li>
                    <li>Audio: -14 LUFS Voiceover</li>
                    <li>Safe Area: Top 15% / Bottom 20% clear</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: Question & Math Proof */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="bg-slate-50 p-5 rounded-xl border border-slate-200">
              <h3 className="text-xs uppercase tracking-wider font-bold text-slate-500 mb-2 font-mono">
                Source Question ({question.id}) &bull; Validation: {question.validationStatus}
              </h3>
              <p className="text-base font-telugu font-medium text-slate-900 mb-4 leading-relaxed">
                {question.questionText}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                {question.options &&
                  Object.entries(question.options).map(([key, val]) => (
                    <div
                      key={key}
                      className={`p-3 rounded-xl border text-sm font-telugu ${
                        String(key).toUpperCase() === String(question.correctAnswer).toUpperCase()
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-bold'
                          : 'bg-white border-slate-200 text-slate-800'
                      }`}
                    >
                      <span className="font-bold mr-2 uppercase font-mono">{key}:</span> {String(val)}
                    </div>
                  ))}
              </div>

              <div className="text-xs text-slate-700 bg-white p-3.5 rounded-xl border border-slate-200 font-telugu leading-relaxed">
                <span className="font-bold text-slate-900 font-sans">Explanation:</span> {question.explanation}
              </div>
            </div>

            {/* Quality Findings */}
            {qualityAssessment && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
                  <h4 className="text-xs font-bold uppercase text-amber-800 mb-2">
                    Advisory Findings ({qualityAssessment.advisoryFindings.length})
                  </h4>
                  {qualityAssessment.advisoryFindings.length === 0 ? (
                    <p className="text-xs text-amber-700">No advisory findings.</p>
                  ) : (
                    <ul className="text-xs text-amber-900 space-y-1 list-disc pl-4">
                      {qualityAssessment.advisoryFindings.map((f, i) => (
                        <li key={i}>{f.message}</li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="p-4 bg-rose-50 rounded-xl border border-rose-200">
                  <h4 className="text-xs font-bold uppercase text-rose-800 mb-2">
                    Blocking Findings ({qualityAssessment.blockingFindings.length})
                  </h4>
                  {qualityAssessment.blockingFindings.length === 0 ? (
                    <p className="text-xs text-rose-700">No blocking findings.</p>
                  ) : (
                    <ul className="text-xs text-rose-900 space-y-1 list-disc pl-4">
                      {qualityAssessment.blockingFindings.map((f, i) => (
                        <li key={i}>{f.message}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: Script & Teleprompter */}
        {activeTab === 'script' && (
          <div className="space-y-6">
            {hook && (
              <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-xl">
                <h3 className="text-xs font-bold uppercase text-indigo-900 mb-1">
                  Selected Viral Hook ({hook.style})
                </h3>
                <p className="text-sm font-telugu font-semibold text-indigo-950 mb-2 leading-relaxed">{hook.text}</p>
                <div className="text-xs text-indigo-800 bg-indigo-100/70 p-2.5 rounded-lg font-telugu leading-relaxed">
                  <span className="font-bold font-sans">Overlay Text:</span> {hook.onScreenOverlayText}
                </div>
              </div>
            )}

            {teleprompterScript && (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                <h3 className="text-xs font-bold uppercase text-slate-700 mb-3">
                  Teleprompter Spoken Script Segments
                </h3>
                <div className="space-y-3">
                  {teleprompterScript.segments?.map((seg, i) => (
                    <div key={i} className="p-3 bg-white rounded-xl border border-slate-200">
                      <div className="text-xs font-bold text-slate-500 uppercase mb-1 font-mono">
                        [{seg.section}] - Pause: {seg.pauseDurationSeconds ?? 0}s
                      </div>
                      <p className="text-sm text-slate-900 font-telugu font-medium leading-relaxed">{seg.spokenText}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 5: Decision History */}
        {activeTab === 'history' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Review History Timeline</h3>
            {reviewHistory.length === 0 ? (
              <p className="text-xs text-slate-500">No review decisions recorded yet.</p>
            ) : (
              <div className="space-y-3">
                {reviewHistory.map((rec) => (
                  <div key={rec.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        {getStatusBadge(rec.decision)}
                        <span className="text-xs font-bold text-slate-800">{rec.reviewerName}</span>
                        <span className="text-xs text-slate-500">({rec.reviewerRole})</span>
                        {rec.isAdminOverride && (
                          <span className="text-[10px] font-bold bg-amber-200 text-amber-900 px-1.5 py-0.5 rounded">
                            ADMIN OVERRIDE
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-slate-400">
                        {new Date(rec.reviewedAt).toLocaleString()}
                      </span>
                    </div>

                    {rec.reason && (
                      <p className="text-xs text-slate-700 bg-white p-2.5 rounded-lg border border-slate-200">
                        "{rec.reason}"
                      </p>
                    )}

                    <div className="text-[10px] font-mono text-slate-400 mt-2">
                      Hash at review: {rec.reviewedVersionHash.substring(0, 16)}...
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal Dialog for Request Changes / Reject */}
      {modalType && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-2xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-2">
              {modalType === 'CHANGES_REQUESTED' ? 'Request Changes' : 'Reject Social Package'}
            </h3>
            <p className="text-xs text-slate-600 mb-4">
              {modalType === 'CHANGES_REQUESTED'
                ? 'Specify required modifications. The author will be notified to revise the content.'
                : 'Provide a reason for rejection. This will block the package from publishing queues.'}
            </p>

            <textarea
              rows={4}
              value={reasonText}
              onChange={(e) => setReasonText(e.target.value)}
              placeholder="Enter detailed feedback / reason (minimum 10 characters)..."
              className="w-full text-xs border border-slate-300 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 focus:outline-none mb-3"
            />

            {actionError && (
              <p className="text-xs text-rose-600 mb-3 font-medium">{actionError}</p>
            )}

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setModalType(null);
                  setReasonText('');
                  setActionError(null);
                }}
                className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-semibold rounded-xl hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleModalSubmit}
                disabled={submitting || reasonText.trim().length < 10}
                className={`px-4 py-2 text-white text-xs font-bold rounded-xl transition cursor-pointer ${
                  modalType === 'CHANGES_REQUESTED'
                    ? 'bg-amber-600 hover:bg-amber-500'
                    : 'bg-rose-600 hover:bg-rose-500'
                } disabled:opacity-50`}
              >
                Submit Decision
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default SocialReviewWorkspace;
