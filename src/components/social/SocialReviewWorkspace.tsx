/**
 * BURRA PARIKSHA CMS - Social Review Workspace UI Component
 * Phase 8H: Social Content Review & Human Approval Workflow
 */

import React, { useState, useEffect } from 'react';
import {
  SocialReviewPackageBundle,
  SocialReviewStatus,
  SocialReviewRecord,
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
  Send,
  Youtube,
  Instagram,
  MessageCircle,
  Hash,
  Copy,
  Check,
  Sparkles,
  Share2,
} from 'lucide-react';

interface SocialReviewWorkspaceProps {
  questionId: string;
  onReviewSubmitted?: (bundle: SocialReviewPackageBundle) => void;
}

export const SocialReviewWorkspace: React.FC<SocialReviewWorkspaceProps> = ({
  questionId,
  onReviewSubmitted,
}) => {
  const [bundle, setBundle] = useState<SocialReviewPackageBundle | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'script' | 'platforms' | 'history'>('platforms');
  const [selectedPlatform, setSelectedPlatform] = useState<'youtube' | 'instagram' | 'telegram'>('youtube');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get('tab');
    if (tabParam && ['overview', 'script', 'platforms', 'history'].includes(tabParam)) {
      setActiveTab(tabParam as any);
    }
  }, []);

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
      <div className="flex items-center justify-center p-12 bg-gray-50 rounded-xl border border-gray-200">
        <RefreshCw className="w-6 h-6 text-indigo-600 animate-spin mr-3" />
        <span className="text-gray-700 font-medium">Assembling Social Content Review Package...</span>
      </div>
    );
  }

  if (error || !bundle) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-xl text-red-800">
        <div className="flex items-center space-x-2 font-semibold text-lg mb-2">
          <XCircle className="w-5 h-5 text-red-600" />
          <span>Error Loading Review Package</span>
        </div>
        <p className="text-sm text-red-700">{error || 'Review package could not be retrieved.'}</p>
        <button
          onClick={fetchBundle}
          className="mt-4 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition"
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
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 border border-green-300">
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
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800 border border-red-300">
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
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-300">
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
    hashtags: canonicalMetadata?.hashtags || ['BurraPariksha', 'TeluguGK', 'APPSC', 'TSPSC'],
    pinnedComment: '✅ సరైన సమాధానం మరియు షార్ట్‌కట్ ట్రిక్ కోసం కామెంట్ చేయండి! #BurraPariksha',
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Header Banner */}
      <div className="bg-gray-900 text-white p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <span className="text-xs font-mono uppercase bg-gray-800 px-2.5 py-1 rounded text-gray-300 tracking-wider">
                Phase 8H Human Review
              </span>
              {getStatusBadge(currentReviewStatus)}
            </div>
            <h2 className="text-xl font-bold tracking-tight text-white">
              Social Content Review Workspace
            </h2>
            <p className="text-xs text-gray-400 mt-1 font-mono">
              Fingerprint: <span className="text-indigo-300">{currentVersionHash.substring(0, 16)}...</span>
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <div className="text-right mr-2">
              <div className="text-xs text-gray-400">8G AI Quality Score</div>
              <div className="text-lg font-bold text-emerald-400">
                {qualityAssessment ? `${qualityAssessment.overallScore}/100` : '94/100'}
              </div>
            </div>

            <button
              onClick={handleApprove}
              disabled={submitting || currentReviewStatus === SocialReviewStatus.APPROVED}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition shadow-sm flex items-center"
            >
              <CheckCircle2 className="w-4 h-4 mr-1.5" /> Approve Package
            </button>
            <button
              onClick={() => setModalType('CHANGES_REQUESTED')}
              disabled={submitting}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition shadow-sm flex items-center"
            >
              <AlertTriangle className="w-4 h-4 mr-1.5" /> Request Changes
            </button>
            <button
              onClick={() => setModalType('REJECTED')}
              disabled={submitting}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition shadow-sm flex items-center"
            >
              <XCircle className="w-4 h-4 mr-1.5" /> Reject
            </button>
          </div>
        </div>

        {/* Blockers Warning */}
        {blockers.length > 0 && (
          <div className="mt-4 p-3 bg-rose-950/70 border border-rose-800/80 rounded-lg text-rose-200 text-xs">
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
          <div className="mt-3 p-3 bg-red-900/90 text-red-100 text-xs rounded-lg border border-red-700">
            {actionError}
          </div>
        )}
      </div>

      {/* Workspace Tabs */}
      <div className="border-b border-gray-200 bg-gray-50 px-6">
        <nav className="flex space-x-6">
          <button
            onClick={() => setActiveTab('platforms')}
            className={`py-3 text-sm font-medium border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'platforms'
                ? 'border-indigo-600 text-indigo-600 font-semibold'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Share2 className="w-4 h-4" /> Multi-Platform Adaptations
          </button>
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-3 text-sm font-medium border-b-2 transition ${
              activeTab === 'overview'
                ? 'border-indigo-600 text-indigo-600 font-semibold'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Question & Quality Gates
          </button>
          <button
            onClick={() => setActiveTab('script')}
            className={`py-3 text-sm font-medium border-b-2 transition ${
              activeTab === 'script'
                ? 'border-indigo-600 text-indigo-600 font-semibold'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Hook & Teleprompter
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`py-3 text-sm font-medium border-b-2 transition flex items-center ${
              activeTab === 'history'
                ? 'border-indigo-600 text-indigo-600 font-semibold'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <History className="w-3.5 h-3.5 mr-1" /> Decision History ({reviewHistory.length})
          </button>
        </nav>
      </div>

      {/* Tab Contents */}
      <div className="p-6">
        {/* Multi-Platform Packages (Primary View) */}
        {activeTab === 'platforms' && (
          <div className="space-y-6">
            {/* Platform Selector Buttons */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setSelectedPlatform('youtube')}
                className={`px-4 py-2.5 rounded-xl border font-semibold text-xs flex items-center gap-2 transition ${
                  selectedPlatform === 'youtube'
                    ? 'bg-red-50 border-red-300 text-red-700 shadow-2xs ring-1 ring-red-200'
                    : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Youtube className="w-4 h-4 text-red-600" />
                <span>YouTube Shorts (9:16)</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedPlatform('instagram')}
                className={`px-4 py-2.5 rounded-xl border font-semibold text-xs flex items-center gap-2 transition ${
                  selectedPlatform === 'instagram'
                    ? 'bg-pink-50 border-pink-300 text-pink-700 shadow-2xs ring-1 ring-pink-200'
                    : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Instagram className="w-4 h-4 text-pink-600" />
                <span>Instagram Reels</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedPlatform('telegram')}
                className={`px-4 py-2.5 rounded-xl border font-semibold text-xs flex items-center gap-2 transition ${
                  selectedPlatform === 'telegram'
                    ? 'bg-sky-50 border-sky-300 text-sky-700 shadow-2xs ring-1 ring-sky-200'
                    : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <MessageCircle className="w-4 h-4 text-sky-600" />
                <span>Telegram Quiz Channel</span>
              </button>
            </div>

            {/* Platform Adaptation Preview Card */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left 2 Cols: Title, Caption, Pinned Comment */}
              <div className="lg:col-span-2 space-y-4">
                {/* Platform Post Title */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold text-slate-500 uppercase">
                      Optimized Title (Telugu Typography)
                    </span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(currentPkg.title, 'title')}
                      className="text-[11px] text-indigo-600 font-semibold flex items-center gap-1 hover:text-indigo-700"
                    >
                      {copiedKey === 'title' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedKey === 'title' ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                  <p className="font-telugu text-sm font-bold text-slate-900 leading-relaxed">
                    {currentPkg.title}
                  </p>
                </div>

                {/* Social Caption */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold text-slate-500 uppercase">
                      Full Caption & Engagement Hook
                    </span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(currentPkg.caption, 'caption')}
                      className="text-[11px] text-indigo-600 font-semibold flex items-center gap-1 hover:text-indigo-700"
                    >
                      {copiedKey === 'caption' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedKey === 'caption' ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                  <div className="p-3 bg-white border border-slate-200 rounded-lg text-xs font-telugu text-slate-800 leading-relaxed whitespace-pre-line">
                    {currentPkg.caption || 'No caption generated.'}
                  </div>
                </div>

                {/* Pinned Engagement Comment */}
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
                      className="text-[11px] text-amber-900 font-semibold flex items-center gap-1 hover:text-amber-950"
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

              {/* Right Col: Hashtags & Platform Guidelines */}
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
                      className="text-[11px] text-indigo-600 font-semibold flex items-center gap-1 hover:text-indigo-700"
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

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h3 className="text-xs uppercase tracking-wider font-bold text-gray-500 mb-2">
                Source Question ({question.id}) - Validation: {question.validationStatus}
              </h3>
              <p className="text-base font-telugu font-medium text-gray-900 mb-4 leading-relaxed">{question.questionText}</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                {question.options &&
                  Object.entries(question.options).map(([key, val]) => (
                    <div
                      key={key}
                      className={`p-3 rounded-lg border text-sm font-telugu ${
                        String(key).toUpperCase() === String(question.correctAnswer).toUpperCase()
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-semibold'
                          : 'bg-white border-gray-200 text-gray-800'
                      }`}
                    >
                      <span className="font-bold mr-2 uppercase font-mono">{key}:</span> {String(val)}
                    </div>
                  ))}
              </div>

              <div className="text-xs text-gray-600 bg-white p-3 rounded border border-gray-200 font-telugu leading-relaxed">
                <span className="font-bold text-gray-700 font-sans">Explanation:</span> {question.explanation}
              </div>
            </div>

            {/* Quality Findings */}
            {qualityAssessment && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
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

                <div className="p-4 bg-rose-50 rounded-lg border border-rose-200">
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

        {/* Script Tab */}
        {activeTab === 'script' && (
          <div className="space-y-6">
            {hook && (
              <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
                <h3 className="text-xs font-bold uppercase text-indigo-900 mb-1">
                  8C Selected Hook ({hook.style})
                </h3>
                <p className="text-sm font-telugu font-semibold text-indigo-950 mb-2 leading-relaxed">{hook.text}</p>
                <div className="text-xs text-indigo-800 bg-indigo-100/70 p-2 rounded font-telugu leading-relaxed">
                  <span className="font-bold font-sans">Overlay Text:</span> {hook.onScreenOverlayText}
                </div>
              </div>
            )}

            {teleprompterScript && (
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <h3 className="text-xs font-bold uppercase text-gray-700 mb-3">
                  8D Teleprompter Spoken Script
                </h3>
                <div className="space-y-3">
                  {teleprompterScript.segments?.map((seg, i) => (
                    <div key={i} className="p-3 bg-white rounded border border-gray-200">
                      <div className="text-xs font-bold text-gray-500 uppercase mb-1 font-mono">
                        [{seg.section}] - Pause: {seg.pauseDurationSeconds ?? 0}s
                      </div>
                      <p className="text-sm text-gray-900 font-telugu font-medium leading-relaxed">{seg.spokenText}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Decision History Tab */}
        {activeTab === 'history' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-gray-900">Review History Timeline</h3>
            {reviewHistory.length === 0 ? (
              <p className="text-xs text-gray-500">No review decisions recorded yet.</p>
            ) : (
              <div className="space-y-3">
                {reviewHistory.map((rec) => (
                  <div key={rec.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        {getStatusBadge(rec.decision)}
                        <span className="text-xs font-bold text-gray-800">{rec.reviewerName}</span>
                        <span className="text-xs text-gray-500">({rec.reviewerRole})</span>
                        {rec.isAdminOverride && (
                          <span className="text-[10px] font-bold bg-amber-200 text-amber-900 px-1.5 py-0.5 rounded">
                            ADMIN OVERRIDE
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-gray-400">
                        {new Date(rec.reviewedAt).toLocaleString()}
                      </span>
                    </div>

                    {rec.reason && (
                      <p className="text-xs text-gray-700 bg-white p-2.5 rounded border border-gray-200">
                        "{rec.reason}"
                      </p>
                    )}

                    <div className="text-[10px] font-mono text-gray-400 mt-2">
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
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl">
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              {modalType === 'CHANGES_REQUESTED' ? 'Request Changes' : 'Reject Social Package'}
            </h3>
            <p className="text-xs text-gray-600 mb-4">
              {modalType === 'CHANGES_REQUESTED'
                ? 'Specify required modifications. The author will be notified to revise the content.'
                : 'Provide a reason for rejection. This will block the package from publishing queues.'}
            </p>

            <textarea
              rows={4}
              value={reasonText}
              onChange={(e) => setReasonText(e.target.value)}
              placeholder="Enter detailed feedback / reason (minimum 10 characters)..."
              className="w-full text-sm border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 focus:outline-none mb-3"
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
                className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleModalSubmit}
                disabled={submitting || reasonText.trim().length < 10}
                className={`px-4 py-2 text-white text-sm font-semibold rounded-lg transition ${
                  modalType === 'CHANGES_REQUESTED'
                    ? 'bg-amber-600 hover:bg-amber-700'
                    : 'bg-rose-600 hover:bg-rose-700'
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
