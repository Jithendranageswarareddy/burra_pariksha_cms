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
import { CheckCircle2, AlertTriangle, XCircle, Clock, RefreshCw, ShieldAlert, History, Send } from 'lucide-react';

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
  const [activeTab, setActiveTab] = useState<'overview' | 'script' | 'platforms' | 'history'>('overview');

  // Modal State for Request Changes / Reject
  const [modalType, setModalType] = useState<'CHANGES_REQUESTED' | 'REJECTED' | null>(null);
  const [reasonText, setReasonText] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [actionError, setActionError] = useState<string | null>(null);

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
                {qualityAssessment ? `${qualityAssessment.overallScore}/100` : 'N/A'}
              </div>
            </div>

            <button
              onClick={handleApprove}
              disabled={submitting || currentReviewStatus === SocialReviewStatus.APPROVED}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition shadow-sm flex items-center"
            >
              <CheckCircle2 className="w-4 h-4 mr-1.5" /> Approve
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
            onClick={() => setActiveTab('overview')}
            className={`py-3 text-sm font-medium border-b-2 transition ${
              activeTab === 'overview'
                ? 'border-indigo-600 text-indigo-600 font-semibold'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Overview & Question
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
            onClick={() => setActiveTab('platforms')}
            className={`py-3 text-sm font-medium border-b-2 transition ${
              activeTab === 'platforms'
                ? 'border-indigo-600 text-indigo-600 font-semibold'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Multi-Platform Packages
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`py-3 text-sm font-medium border-b-2 transition flex items-center ${
              activeTab === 'history'
                ? 'border-indigo-600 text-indigo-600 font-semibold'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <History className="w-3.5 h-3.5 mr-1" /> History ({reviewHistory.length})
          </button>
        </nav>
      </div>

      {/* Tab Contents */}
      <div className="p-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h3 className="text-xs uppercase tracking-wider font-bold text-gray-500 mb-2">
                Source Question ({question.id}) - Validation: {question.validationStatus}
              </h3>
              <p className="text-base font-medium text-gray-900 mb-4">{question.questionText}</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                {question.options &&
                  Object.entries(question.options).map(([key, val]) => (
                    <div
                      key={key}
                      className={`p-3 rounded-lg border text-sm ${
                        String(key).toUpperCase() === String(question.correctAnswer).toUpperCase()
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-semibold'
                          : 'bg-white border-gray-200 text-gray-800'
                      }`}
                    >
                      <span className="font-bold mr-2 uppercase">{key}:</span> {String(val)}
                    </div>
                  ))}
              </div>

              <div className="text-xs text-gray-600 bg-white p-3 rounded border border-gray-200">
                <span className="font-bold text-gray-700">Explanation:</span> {question.explanation}
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

        {activeTab === 'script' && (
          <div className="space-y-6">
            {hook && (
              <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
                <h3 className="text-xs font-bold uppercase text-indigo-900 mb-1">
                  8C Selected Hook ({hook.style})
                </h3>
                <p className="text-sm font-semibold text-indigo-950 mb-2">{hook.text}</p>
                <div className="text-xs text-indigo-800 bg-indigo-100/70 p-2 rounded">
                  <span className="font-bold">Overlay Text:</span> {hook.onScreenOverlayText}
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
                      <div className="text-xs font-bold text-gray-500 uppercase mb-1">
                        [{seg.section}] - Pause: {seg.pauseDurationSeconds ?? 0}s
                      </div>
                      <p className="text-sm text-gray-900 font-medium">{seg.spokenText}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'platforms' && (
          <div className="space-y-6">
            {canonicalMetadata && (
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <h3 className="text-xs font-bold uppercase text-gray-700 mb-2">
                  8E Canonical Social Metadata
                </h3>
                <div className="text-sm font-bold text-gray-900 mb-1">{canonicalMetadata.shortTitle}</div>
                <p className="text-xs text-gray-700 mb-2">{canonicalMetadata.socialCaption}</p>
                <div className="flex flex-wrap gap-1">
                  {canonicalMetadata.hashtags?.map((h, i) => (
                    <span key={i} className="text-xs bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded">
                      #{h}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {multiPlatformAdaptations?.variants && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Object.entries(multiPlatformAdaptations.variants).map(([platform, pkg]) => (
                  <div key={platform} className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
                    <span className="text-xs font-bold uppercase bg-gray-100 px-2 py-1 rounded text-gray-700">
                      {platform}
                    </span>
                    <h4 className="text-sm font-semibold text-gray-900 mt-2 mb-1">{pkg.title}</h4>
                    <p className="text-xs text-gray-600 mb-2 line-clamp-3">{pkg.caption}</p>
                    <div className="text-[10px] text-gray-500">
                      Hashtags: {pkg.hashtags?.length || 0}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

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
