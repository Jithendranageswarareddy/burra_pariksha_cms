/**
 * BURRA PARIKSHA CMS - Social Review Workspace UI Component
 * Stage 09: 9:16 Social Simulator & Multi-Platform Adaptation
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
  ChevronDown,
  ChevronUp,
  ArrowRight,
  ShieldCheck,
  FileText,
  Send,
} from 'lucide-react';
import { Card } from '../../design-system/components/Card';
import { Badge } from '../../design-system/components/Badge';
import { Button } from '../../design-system/components/Button';
import { Alert } from '../../design-system/components/Alert';
import { Modal } from '../../design-system/components/Modal';

interface SocialReviewWorkspaceProps {
  questionId: string;
  videoId?: string;
  driveFolderUrl?: string;
  onReviewSubmitted?: (bundle: SocialReviewPackageBundle) => void;
  onNavigateTab?: (tab: 'script' | 'recording' | 'editing' | 'final-review' | 'social' | 'overview' | 'thumbnail' | 'pinned-comment' | 'publishing') => void;
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
  const [selectedPlatform, setSelectedPlatform] = useState<'youtube' | 'instagram' | 'telegram'>('youtube');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Safe zone guideline toggle
  const [showSafeZones, setShowSafeZones] = useState<boolean>(true);

  // Collapsible drawers
  const [isSourceDrawerOpen, setIsSourceDrawerOpen] = useState<boolean>(false);
  const [isHistoryDrawerOpen, setIsHistoryDrawerOpen] = useState<boolean>(false);

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
        if (onNavigateTab) {
          onNavigateTab('publishing');
        }
      }
    } catch (err: any) {
      setActionError(err?.message || 'Failed to approve social package.');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePrimaryCta = async () => {
    if (bundle?.currentReviewStatus === SocialReviewStatus.APPROVED) {
      if (onNavigateTab) {
        onNavigateTab('publishing');
      }
      return;
    }
    await handleApprove();
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
        <span className="text-slate-700 font-semibold text-sm">
          Assembling Stage 09 9:16 Social Simulator &amp; Multi-Platform Adaptation...
        </span>
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
          className="mt-4 px-4 py-2 bg-rose-600 text-white text-xs font-semibold rounded-xl hover:bg-rose-700 transition cursor-pointer"
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
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Approved
          </span>
        );
      case SocialReviewStatus.CHANGES_REQUESTED:
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300">
            <AlertTriangle className="w-3.5 h-3.5 mr-1" /> Changes Requested
          </span>
        );
      case SocialReviewStatus.REJECTED:
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-300">
            <XCircle className="w-3.5 h-3.5 mr-1" /> Rejected
          </span>
        );
      case SocialReviewStatus.STALE_REVISION_REQUIRED:
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 border border-purple-300">
            <ShieldAlert className="w-3.5 h-3.5 mr-1" /> Stale Revision Required
          </span>
        );
      case SocialReviewStatus.PENDING_REVIEW:
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-sky-100 text-sky-800 border border-sky-300">
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
    <div className="space-y-6">
      {/* Executive Header Strip */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="active" size="sm">
              Stage 09: 9:16 Social Simulator &amp; Multi-Platform Adaptation
            </Badge>
            {getStatusBadge(currentReviewStatus)}
            {qualityAssessment && (
              <Badge variant="success" size="sm">
                AI Quality: {qualityAssessment.overallScore}/100
              </Badge>
            )}
          </div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
            Social Review &amp; 9:16 Smartphone Simulator
          </h2>
          <p className="text-xs text-slate-500 font-mono">
            Version Hash: <span className="text-indigo-600 font-semibold">{currentVersionHash.substring(0, 16)}...</span>
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {driveFolderUrl && (
            <a
              href={effectiveDriveUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold shadow-2xs transition"
            >
              <ExternalLink className="w-3.5 h-3.5 text-indigo-600" />
              <span>Drive Master</span>
            </a>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={fetchBundle}
            icon={RefreshCw}
            className="text-xs"
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Celebratory Approval & Stage 10 Bridge Banner */}
      {currentReviewStatus === SocialReviewStatus.APPROVED && (
        <div className="p-4 bg-gradient-to-r from-emerald-950 via-slate-900 to-indigo-950 border border-emerald-500/50 rounded-2xl text-white flex flex-col md:flex-row items-center justify-between gap-4 shadow-lg animate-in fade-in">
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
              <span>Proceed to Step 10: Release &amp; Publishing Setup →</span>
            </button>
          )}
        </div>
      )}

      {/* Action Error Alert */}
      {actionError && (
        <Alert variant="error" title="Action Failed">
          <div className="flex items-center justify-between">
            <span>{actionError}</span>
            <button
              onClick={() => setActionError(null)}
              className="text-xs font-bold text-rose-700 hover:text-rose-900 ml-3 cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        </Alert>
      )}

      {/* Blockers Alert */}
      {blockers && blockers.length > 0 && (
        <Alert variant="warning" title={`Publishing / Approval Blockers (${blockers.length})`}>
          <ul className="list-disc pl-5 mt-1 space-y-0.5 text-xs text-amber-900">
            {blockers.map((b, i) => (
              <li key={i}>{b}</li>
            ))}
          </ul>
        </Alert>
      )}

      {/* Standardized Dual-Pane 7/5 Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Pane (lg:col-span-7) — 9:16 Simulator & Reference */}
        <div className="lg:col-span-7 space-y-6">
          {/* Card 1: 9:16 Interactive Smartphone Simulator */}
          <Card className="p-5 border-slate-200/80 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900">9:16 Interactive Smartphone Simulator</h3>
              </div>

              {/* Platform Switcher Chips */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => setSelectedPlatform('youtube')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition cursor-pointer border ${
                    selectedPlatform === 'youtube'
                      ? 'bg-red-50 text-red-700 border-red-300 ring-1 ring-red-200 font-bold'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <Youtube className="w-3.5 h-3.5 text-red-600" />
                  <span>YouTube Shorts</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedPlatform('instagram')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition cursor-pointer border ${
                    selectedPlatform === 'instagram'
                      ? 'bg-pink-50 text-pink-700 border-pink-300 ring-1 ring-pink-200 font-bold'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <Instagram className="w-3.5 h-3.5 text-pink-600" />
                  <span>Instagram Reels</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedPlatform('telegram')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition cursor-pointer border ${
                    selectedPlatform === 'telegram'
                      ? 'bg-sky-50 text-sky-700 border-sky-300 ring-1 ring-sky-200 font-bold'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <MessageCircle className="w-3.5 h-3.5 text-sky-600" />
                  <span>Telegram Quiz</span>
                </button>
              </div>
            </div>

            {/* Viewport bar with Safe Zone Toggle */}
            <div className="flex items-center justify-between text-xs px-1">
              <span className="text-[11px] font-mono text-slate-400">
                Resolution: <strong className="text-slate-700">1080 &times; 1920 (9:16)</strong>
              </span>

              <button
                type="button"
                onClick={() => setShowSafeZones(!showSafeZones)}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition flex items-center gap-1 cursor-pointer"
              >
                {showSafeZones ? 'Hide Safe Zones' : 'Show Safe Zones'}
              </button>
            </div>

            {/* Interactive 9:16 Smartphone Mockup Container */}
            <div className="bg-slate-950 rounded-2xl p-4 sm:p-6 flex flex-col items-center justify-center border border-slate-800">
              <div className="mx-auto w-full max-w-[310px] aspect-[9/16] rounded-[36px] border-4 border-slate-800 bg-slate-950 shadow-2xl relative overflow-hidden flex flex-col justify-between p-4 select-none">
                {/* Dynamic gradient background */}
                <div className="absolute inset-0 bg-gradient-to-b from-indigo-950/80 via-slate-900/90 to-slate-950 -z-10" />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-500/10 via-transparent to-transparent -z-10" />

                {/* Top Channel Header Bar */}
                <div className="flex items-center justify-between text-white pt-1 z-10">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-500 to-indigo-600 flex items-center justify-center font-bold text-xs text-white shadow-md shrink-0">
                      BP
                    </div>
                    <div>
                      <div className="flex items-center gap-1">
                        <span className="text-xs font-bold text-white leading-tight">@BurraPariksha</span>
                        <CheckCheck className="w-3 h-3 text-sky-400" />
                      </div>
                      <span className="text-[9px] text-slate-300 font-mono">Telugu GK &amp; Speed Math</span>
                    </div>
                  </div>

                  {/* Platform pill badge */}
                  {selectedPlatform === 'youtube' && (
                    <span className="px-2 py-0.5 rounded-md bg-red-600 text-white font-mono text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 shadow-xs">
                      <Flame className="w-3 h-3" /> Shorts
                    </span>
                  )}
                  {selectedPlatform === 'instagram' && (
                    <span className="px-2 py-0.5 rounded-md bg-gradient-to-r from-pink-500 via-rose-500 to-amber-500 text-white font-mono text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 shadow-xs">
                      <Instagram className="w-3 h-3" /> Reels
                    </span>
                  )}
                  {selectedPlatform === 'telegram' && (
                    <span className="px-2 py-0.5 rounded-md bg-sky-600 text-white font-mono text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 shadow-xs">
                      <MessageCircle className="w-3 h-3" /> Quiz
                    </span>
                  )}
                </div>

                {/* Safe Zone Overlay Guidelines */}
                {showSafeZones && (
                  <div className="absolute inset-x-3.5 top-12 bottom-20 border border-dashed border-amber-400/60 rounded-xl pointer-events-none z-20 flex flex-col justify-between p-2">
                    <div className="flex items-center justify-between text-[8px] font-mono text-amber-300/90 uppercase tracking-wider">
                      <span>Top 15% Safe Margin</span>
                      <span>Safe Zone (80%)</span>
                    </div>
                    <div className="flex items-center justify-between text-[8px] font-mono text-amber-300/90 uppercase tracking-wider">
                      <span>Bottom 20% Clear</span>
                      <span>Right 15% Rail</span>
                    </div>
                  </div>
                )}

                {/* Center Content: Question Hook & Options */}
                <div className="my-auto space-y-2.5 z-10">
                  <div className="bg-slate-900/85 backdrop-blur-md border border-slate-700/60 rounded-2xl p-3 shadow-xl text-center space-y-2">
                    <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 inline-block">
                      15-SECOND CHALLENGE
                    </span>
                    <p className="font-telugu text-[12px] font-bold text-white leading-relaxed line-clamp-3">
                      {hook?.text || question.questionText}
                    </p>

                    {/* Options Grid */}
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
                            <span className="font-mono uppercase font-bold text-[9px] w-3.5 text-center shrink-0">
                              {optKey}:
                            </span>
                            <span className="truncate">{optVal}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Right-Side Action Rail */}
                {selectedPlatform !== 'telegram' ? (
                  <div className="absolute right-3 bottom-24 flex flex-col items-center gap-2.5 text-white/90 z-10">
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 rounded-full bg-slate-900/80 backdrop-blur-xs border border-white/20 flex items-center justify-center shadow-lg">
                        <ThumbsUp className="w-3.5 h-3.5 text-white" />
                      </div>
                      <span className="text-[9px] font-bold mt-0.5">24.5K</span>
                    </div>

                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 rounded-full bg-slate-900/80 backdrop-blur-xs border border-white/20 flex items-center justify-center shadow-lg">
                        <MessageSquare className="w-3.5 h-3.5 text-white" />
                      </div>
                      <span className="text-[9px] font-bold mt-0.5">1.2K</span>
                    </div>

                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 rounded-full bg-slate-900/80 backdrop-blur-xs border border-white/20 flex items-center justify-center shadow-lg">
                        <Bookmark className="w-3.5 h-3.5 text-white" />
                      </div>
                      <span className="text-[9px] font-bold mt-0.5">Save</span>
                    </div>

                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 rounded-full bg-slate-900/80 backdrop-blur-xs border border-white/20 flex items-center justify-center shadow-lg">
                        <Share2 className="w-3.5 h-3.5 text-white" />
                      </div>
                      <span className="text-[9px] font-bold mt-0.5">Share</span>
                    </div>

                    <div className="w-7 h-7 rounded-full bg-slate-900/90 border border-amber-400/50 flex items-center justify-center animate-spin">
                      <Disc3 className="w-3.5 h-3.5 text-amber-400" />
                    </div>
                  </div>
                ) : (
                  <div className="absolute right-3 bottom-24 flex flex-col items-center gap-2 text-white/90 z-10">
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 rounded-full bg-sky-900/80 backdrop-blur-xs border border-sky-400/30 flex items-center justify-center shadow-lg text-[10px]">
                        👍
                      </div>
                      <span className="text-[9px] font-bold mt-0.5">1.8K</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 rounded-full bg-amber-900/80 backdrop-blur-xs border border-amber-400/30 flex items-center justify-center shadow-lg text-[10px]">
                        🔥
                      </div>
                      <span className="text-[9px] font-bold mt-0.5">940</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 rounded-full bg-purple-900/80 backdrop-blur-xs border border-purple-400/30 flex items-center justify-center shadow-lg text-[10px]">
                        🧠
                      </div>
                      <span className="text-[9px] font-bold mt-0.5">620</span>
                    </div>
                  </div>
                )}

                {/* Bottom Caption Zone */}
                <div className="pr-12 space-y-1 pb-1 z-10">
                  <p className="font-telugu text-[11px] leading-snug text-white font-medium drop-shadow-md line-clamp-2">
                    {currentPkg.title || question.questionText}
                  </p>
                  <div className="flex flex-wrap gap-1 text-[9px] text-sky-300 font-mono font-semibold">
                    {(currentPkg.hashtags || ['BurraPariksha', 'TeluguGK', 'Shorts'])
                      .slice(0, 3)
                      .map((tag: string, idx: number) => (
                        <span key={idx}>#{tag.replace('#', '')}</span>
                      ))}
                  </div>
                </div>
              </div>

              {/* Safe Zone Standards Checklist */}
              <div className="mt-4 p-3 bg-slate-900/90 rounded-xl border border-slate-800 text-xs text-slate-300 w-full max-w-[310px] space-y-1">
                <div className="text-[11px] font-bold text-white flex items-center gap-1.5 mb-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>9:16 Shorts Safe Zone Standards</span>
                </div>
                <div className="text-[10px] text-slate-400 space-y-0.5">
                  <p>✓ Top 15% clear of YouTube/Reels search headers</p>
                  <p>✓ Bottom 20% clear of description &amp; sound badge</p>
                  <p>✓ Right 15% clear of interactive like/share action rail</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Card 2: Collapsible Source Reference Drawer */}
          <Card className="p-4 border-slate-200/80 shadow-xs space-y-3">
            <button
              type="button"
              onClick={() => setIsSourceDrawerOpen(!isSourceDrawerOpen)}
              className="w-full flex items-center justify-between text-left cursor-pointer focus:outline-hidden"
            >
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-600" />
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Question, Script &amp; Math Proof Reference
                </h3>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                <span>{isSourceDrawerOpen ? 'Collapse' : 'Expand'}</span>
                {isSourceDrawerOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </div>
            </button>

            {isSourceDrawerOpen && (
              <div className="pt-3 border-t border-slate-100 space-y-4 animate-in fade-in duration-150">
                {/* Source Question & Options */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-500">
                    <span>Question ID: {question.id}</span>
                    <Badge variant="neutral" size="sm">
                      {question.validationStatus}
                    </Badge>
                  </div>

                  <p className="text-xs font-telugu font-semibold text-slate-900 leading-relaxed">
                    {question.questionText}
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-telugu">
                    {question.options &&
                      Object.entries(question.options).map(([key, val]) => {
                        const isCorrect = String(key).toUpperCase() === String(question.correctAnswer).toUpperCase();
                        return (
                          <div
                            key={key}
                            className={`p-2 rounded-lg border ${
                              isCorrect
                                ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-bold'
                                : 'bg-white border-slate-200 text-slate-700'
                            }`}
                          >
                            <span className="font-mono uppercase font-bold mr-1">{key}:</span> {String(val)}
                          </div>
                        );
                      })}
                  </div>

                  <div className="p-2.5 bg-white rounded-lg border border-slate-200 text-xs font-telugu text-slate-800 leading-relaxed">
                    <strong className="font-sans text-slate-900">Explanation: </strong>
                    {question.explanation}
                  </div>
                </div>

                {/* Viral Hook */}
                {hook && (
                  <div className="p-3 bg-indigo-50/70 border border-indigo-200 rounded-xl space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-indigo-900">Selected Viral Hook</span>
                      <span className="font-mono text-[10px] text-indigo-600 uppercase font-semibold">
                        Style: {hook.style}
                      </span>
                    </div>
                    <p className="font-telugu text-xs font-semibold text-indigo-950">{hook.text}</p>
                    {hook.onScreenOverlayText && (
                      <p className="text-[11px] text-indigo-800 bg-indigo-100/60 p-2 rounded-lg font-telugu">
                        <strong className="font-sans">Overlay Text:</strong> {hook.onScreenOverlayText}
                      </p>
                    )}
                  </div>
                )}

                {/* Teleprompter Spoken Script Segments */}
                {teleprompterScript?.segments && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Teleprompter Spoken Script Segments
                    </h4>
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                      {teleprompterScript.segments.map((seg, i) => (
                        <div key={i} className="p-2.5 bg-white rounded-lg border border-slate-200 text-xs">
                          <div className="text-[10px] font-mono font-bold text-slate-500 uppercase mb-1">
                            [{seg.section}] {seg.pauseDurationSeconds ? `• Pause: ${seg.pauseDurationSeconds}s` : ''}
                          </div>
                          <p className="font-telugu text-slate-900 leading-relaxed">{seg.spokenText}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Quality Findings */}
                {qualityAssessment && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-3 bg-amber-50 rounded-xl border border-amber-200">
                      <h5 className="font-bold text-amber-900 mb-1">
                        Advisory Findings ({qualityAssessment.advisoryFindings.length})
                      </h5>
                      {qualityAssessment.advisoryFindings.length === 0 ? (
                        <p className="text-amber-700 text-[11px]">No advisory findings.</p>
                      ) : (
                        <ul className="text-[11px] text-amber-900 list-disc pl-4 space-y-0.5">
                          {qualityAssessment.advisoryFindings.map((f, i) => (
                            <li key={i}>{f.message}</li>
                          ))}
                        </ul>
                      )}
                    </div>

                    <div className="p-3 bg-rose-50 rounded-xl border border-rose-200">
                      <h5 className="font-bold text-rose-900 mb-1">
                        Blocking Findings ({qualityAssessment.blockingFindings.length})
                      </h5>
                      {qualityAssessment.blockingFindings.length === 0 ? (
                        <p className="text-rose-700 text-[11px]">No blocking findings.</p>
                      ) : (
                        <ul className="text-[11px] text-rose-900 list-disc pl-4 space-y-0.5">
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
          </Card>
        </div>

        {/* Right Pane (lg:col-span-5) — Sticky Command Station & Copy Bundles */}
        <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-4">
          {/* Card 1: Social Decision Station (Gate 09) */}
          <Card className="p-5 border-slate-200/80 shadow-xs space-y-4 bg-gradient-to-br from-white to-slate-50/50">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-900">Social Decision Station</h3>
              </div>
              <div className="flex items-center gap-1.5">
                <Badge variant="neutral" size="sm">
                  Gate 09
                </Badge>
                {qualityAssessment && (
                  <Badge variant="success" size="sm">
                    {qualityAssessment.overallScore}/100
                  </Badge>
                )}
              </div>
            </div>

            {/* Current Review Status & Fingerprint */}
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">Review Status:</span>
              <div>{getStatusBadge(currentReviewStatus)}</div>
            </div>

            {/* Primary Action Button */}
            <div className="space-y-2">
              <Button
                variant="primary"
                size="md"
                disabled={submitting}
                onClick={handlePrimaryCta}
                className="w-full justify-center text-xs py-2.5 font-bold shadow-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                icon={ArrowRight}
              >
                {currentReviewStatus === SocialReviewStatus.APPROVED
                  ? '✓ Approved — Proceed to Step 10: Publishing Setup →'
                  : '✓ Approve Social Package & Proceed to Step 10: Publishing Setup →'}
              </Button>
            </div>

            {/* Secondary Actions: Request Changes & Reject */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
              <Button
                variant="outline"
                size="sm"
                disabled={submitting}
                onClick={() => setModalType('CHANGES_REQUESTED')}
                className="justify-center text-xs hover:bg-amber-50 hover:text-amber-700 hover:border-amber-300"
                icon={AlertTriangle}
              >
                Request Changes
              </Button>

              <Button
                variant="outline"
                size="sm"
                disabled={submitting}
                onClick={() => setModalType('REJECTED')}
                className="justify-center text-xs hover:bg-rose-50 hover:text-rose-700 hover:border-rose-300"
                icon={XCircle}
              >
                Reject Package
              </Button>
            </div>
          </Card>

          {/* Card 2: Tactile 1-Click Publishing Copy Bundles */}
          <Card className="p-5 border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900">1-Click Publishing Copy Bundles</h3>
              </div>
              <span className="text-[10px] font-mono text-slate-400">Tactile Clipboards</span>
            </div>

            <div className="space-y-3.5">
              {/* 1. YouTube Shorts Title */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono font-bold text-red-600 uppercase flex items-center gap-1">
                    <Youtube className="w-3.5 h-3.5" /> YouTube Shorts Title
                  </span>
                  <span
                    className={`text-[10px] font-mono ${
                      youtubeTitle.length > 100 ? 'text-rose-600 font-bold' : 'text-slate-400'
                    }`}
                  >
                    {youtubeTitle.length}/100 chars
                  </span>
                </div>
                <p className="font-telugu text-xs font-semibold text-slate-900 leading-relaxed line-clamp-2">
                  {youtubeTitle}
                </p>
                <button
                  type="button"
                  onClick={() => copyToClipboard(youtubeTitle, 'yt_title')}
                  className={`w-full py-1.5 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                    copiedKey === 'yt_title'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-white hover:bg-red-50 text-slate-700 hover:text-red-700 border border-slate-200 shadow-2xs'
                  }`}
                >
                  {copiedKey === 'yt_title' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === 'yt_title' ? 'Copied YouTube Title!' : 'Copy YouTube Title'}</span>
                </button>
              </div>

              {/* 2. Description & Hashtag Bundle */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono font-bold text-indigo-700 uppercase flex items-center gap-1">
                    <Hash className="w-3.5 h-3.5" /> Description &amp; Hashtag Bundle
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">SEO Optimized</span>
                </div>
                <div className="p-2 bg-white border border-slate-200 rounded-lg text-[11px] font-telugu text-slate-700 line-clamp-3 leading-relaxed">
                  {descriptionAndTags}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => copyToClipboard(descriptionAndTags, 'desc_bundle')}
                    className={`py-1.5 px-2 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 transition cursor-pointer ${
                      copiedKey === 'desc_bundle'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-white hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 border border-slate-200 shadow-2xs'
                    }`}
                  >
                    {copiedKey === 'desc_bundle' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedKey === 'desc_bundle' ? 'Copied Description!' : 'Copy Description'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      copyToClipboard(
                        (currentPkg.hashtags || []).map((h: string) => `#${h.replace('#', '')}`).join(' '),
                        'all_tags'
                      )
                    }
                    className={`py-1.5 px-2 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 transition cursor-pointer ${
                      copiedKey === 'all_tags'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-white hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 border border-slate-200 shadow-2xs'
                    }`}
                  >
                    {copiedKey === 'all_tags' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedKey === 'all_tags' ? 'Copied All Tags!' : 'Copy All Tags'}</span>
                  </button>
                </div>
              </div>

              {/* 3. Official Pinned Solution Comment */}
              <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono font-bold text-amber-800 uppercase flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" /> Official Pinned Comment
                  </span>
                  <span className="text-[10px] text-amber-700 font-mono font-semibold">Speed Trick</span>
                </div>
                <p className="font-telugu text-xs font-semibold text-amber-950 leading-relaxed line-clamp-3">
                  {pinnedSolutionComment}
                </p>
                <button
                  type="button"
                  onClick={() => copyToClipboard(pinnedSolutionComment, 'pinned_comment')}
                  className={`w-full py-1.5 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                    copiedKey === 'pinned_comment'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 shadow-2xs'
                  }`}
                >
                  {copiedKey === 'pinned_comment' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === 'pinned_comment' ? 'Copied Pinned Comment!' : 'Copy Pinned Comment'}</span>
                </button>
              </div>

              {/* 4. Instagram / Facebook Reels Caption */}
              <div className="p-3.5 bg-pink-50/70 border border-pink-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono font-bold text-pink-700 uppercase flex items-center gap-1">
                    <Instagram className="w-3.5 h-3.5 text-pink-600" /> Instagram / Reels Caption
                  </span>
                  <span className="text-[10px] text-pink-500 font-mono font-semibold">Viral Hook</span>
                </div>
                <p className="font-telugu text-xs font-semibold text-pink-950 leading-relaxed line-clamp-3">
                  {igFbCaption}
                </p>
                <button
                  type="button"
                  onClick={() => copyToClipboard(igFbCaption, 'ig_caption')}
                  className={`w-full py-1.5 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                    copiedKey === 'ig_caption'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-white hover:bg-pink-100 text-pink-900 border border-pink-300 shadow-2xs'
                  }`}
                >
                  {copiedKey === 'ig_caption' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === 'ig_caption' ? 'Copied IG / FB Caption!' : 'Copy IG / FB Caption'}</span>
                </button>
              </div>
            </div>
          </Card>

          {/* Card 3: Review Decision History (Collapsible) */}
          <Card className="p-4 border-slate-200/80 shadow-xs space-y-3">
            <button
              type="button"
              onClick={() => setIsHistoryDrawerOpen(!isHistoryDrawerOpen)}
              className="w-full flex items-center justify-between text-left cursor-pointer focus:outline-hidden"
            >
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-slate-600" />
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Review Decision History ({reviewHistory.length})
                </h3>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                <span>{isHistoryDrawerOpen ? 'Collapse' : 'Expand'}</span>
                {isHistoryDrawerOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </div>
            </button>

            {isHistoryDrawerOpen && (
              <div className="pt-3 border-t border-slate-100 space-y-2.5 animate-in fade-in duration-150">
                {reviewHistory.length === 0 ? (
                  <p className="text-xs text-slate-400 py-2 text-center bg-slate-50 rounded-xl">
                    No review decisions recorded yet.
                  </p>
                ) : (
                  <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                    {reviewHistory.map((rec) => (
                      <div key={rec.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                        <div className="flex items-center justify-between flex-wrap gap-1">
                          <div className="flex items-center gap-1.5">
                            {getStatusBadge(rec.decision)}
                            <span className="font-bold text-slate-800">{rec.reviewerName}</span>
                            <span className="text-[11px] text-slate-500">({rec.reviewerRole})</span>
                            {rec.isAdminOverride && (
                              <span className="text-[9px] font-bold bg-amber-200 text-amber-900 px-1 py-0.2 rounded">
                                ADMIN OVERRIDE
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-400">
                            {new Date(rec.reviewedAt).toLocaleDateString()}
                          </span>
                        </div>

                        {rec.reason && (
                          <p className="text-slate-700 bg-white p-2 rounded-lg border border-slate-200 text-[11px]">
                            "{rec.reason}"
                          </p>
                        )}

                        <div className="text-[10px] font-mono text-slate-400 pt-0.5">
                          Hash: {rec.reviewedVersionHash.substring(0, 16)}...
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Modal Dialog for Request Changes / Reject */}
      <Modal
        isOpen={Boolean(modalType)}
        onClose={() => {
          setModalType(null);
          setReasonText('');
          setActionError(null);
        }}
        title={
          <div className="flex items-center gap-2">
            {modalType === 'CHANGES_REQUESTED' ? (
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            ) : (
              <XCircle className="w-5 h-5 text-rose-600" />
            )}
            <span>{modalType === 'CHANGES_REQUESTED' ? 'Request Social Changes' : 'Reject Social Package'}</span>
          </div>
        }
        subtitle={
          modalType === 'CHANGES_REQUESTED'
            ? 'Specify required modifications. The content creator will be notified to revise social copy.'
            : 'Provide a reason for rejection. This will prevent the package from proceeding to publishing.'
        }
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setModalType(null);
                setReasonText('');
                setActionError(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              disabled={submitting || reasonText.trim().length < 10}
              onClick={handleModalSubmit}
              className={
                modalType === 'CHANGES_REQUESTED'
                  ? 'bg-amber-600 hover:bg-amber-700 text-white'
                  : 'bg-rose-600 hover:bg-rose-700 text-white'
              }
            >
              {submitting ? 'Submitting...' : 'Submit Decision'}
            </Button>
          </div>
        }
      >
        <div className="space-y-3 text-xs">
          <label className="block font-semibold text-slate-700">
            Reviewer Feedback / Reason <span className="text-slate-400 font-normal">(minimum 10 characters)</span>
          </label>
          <textarea
            rows={4}
            value={reasonText}
            onChange={(e) => setReasonText(e.target.value)}
            placeholder="Enter detailed feedback / reason..."
            className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
          <div className="flex justify-between items-center text-[11px] text-slate-400 font-mono">
            <span>Minimum 10 chars</span>
            <span className={reasonText.trim().length < 10 ? 'text-amber-600 font-bold' : 'text-emerald-600'}>
              {reasonText.trim().length} chars
            </span>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default SocialReviewWorkspace;
