/**
 * BURRA PARIKSHA CMS - Phase 14.5 Social Review Navigation & Workspace Routing
 * Authenticated, role-aware application workspace for Social Content Review (Phase 8H).
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCheck,
  AlertTriangle,
  Clock,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Search,
  Filter,
  Layers,
  BookOpen,
  Video,
  RefreshCw,
  AlertCircle,
  ShieldCheck,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Smartphone,
  Share2,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { apiClient } from '../lib/api-client';
import { SocialReviewWorkspace } from '../components/social/SocialReviewWorkspace';
import { AssetWorkflowHeader } from '../components/social/AssetWorkflowHeader';
import { SocialReviewRecord, SocialReviewStatus, UserRole } from '../types';
import { Button } from '../components/common/Button';

export const SocialReviewPage: React.FC = () => {
  const { reviewId: routeParamId, videoId: routeVideoId } = useParams<{ reviewId?: string; videoId?: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Effective identifier from either route param or query string
  const activeId = routeParamId || routeVideoId || searchParams.get('reviewId') || searchParams.get('videoId') || searchParams.get('questionId') || '';
  const isPlatformsMode = searchParams.get('tab') === 'platforms';

  // Workspace single-item state
  const [resolvedQuestionId, setResolvedQuestionId] = useState<string | null>(null);
  const [resolvedVideoId, setResolvedVideoId] = useState<string | null>(null);
  const [activeReviewRecord, setActiveReviewRecord] = useState<SocialReviewRecord | null>(null);
  const [isLoadingItem, setIsLoadingItem] = useState(false);
  const [itemError, setItemError] = useState<{ status: number; message: string } | null>(null);

  // Queue state (when on /social-review without specific review selected)
  const [reviewsList, setReviewsList] = useState<SocialReviewRecord[]>([]);
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [listError, setListError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Load specific review or question package
  const loadReviewItem = useCallback(async (id: string) => {
    setIsLoadingItem(true);
    setItemError(null);
    try {
      let targetLookupId = id;
      // If it looks like a video ID or might be a video
      if (id.startsWith('BP-V-') || routeVideoId) {
        setResolvedVideoId(id);
        try {
          const v = await apiClient.getVideoById(id);
          if (v && v.questionId) {
            targetLookupId = v.questionId;
          }
        } catch {
          // fallback to standard lookup
        }
      }

      const res = await apiClient.getSocialReviewItem(targetLookupId);
      if (res.success && res.data) {
        setResolvedQuestionId(res.questionId || res.data.question.id);
        setActiveReviewRecord(res.review || null);
      } else {
        setItemError({ status: 404, message: `Review package for '${id}' not found.` });
      }
    } catch (err: any) {
      const status = err?.statusCode || (err?.message?.includes('403') || err?.message?.includes('Forbidden') ? 403 : 404);
      setItemError({
        status,
        message: err?.message || `Failed to load review package for '${id}'.`,
      });
    } finally {
      setIsLoadingItem(false);
    }
  }, [routeVideoId]);

  // Load reviews list/queue
  const loadReviewsQueue = useCallback(async () => {
    setIsLoadingList(true);
    setListError(null);
    try {
      const res = await apiClient.getSocialReviewsList();
      if (res.success && Array.isArray(res.data)) {
        setReviewsList(res.data);
      } else {
        setReviewsList([]);
      }
    } catch (err: any) {
      setListError(err?.message || 'Failed to load social reviews queue.');
    } finally {
      setIsLoadingList(false);
    }
  }, []);

  // React to active identifier changes
  useEffect(() => {
    if (activeId) {
      loadReviewItem(activeId);
    } else {
      setResolvedQuestionId(null);
      setActiveReviewRecord(null);
      setItemError(null);
      loadReviewsQueue();
    }
  }, [activeId, loadReviewItem, loadReviewsQueue]);

  // Filtered queue items
  const filteredReviews = useMemo(() => {
    return reviewsList.filter((item) => {
      if (statusFilter !== 'ALL') {
        const itemStatus = item.decision || 'PENDING';
        if (statusFilter === 'PENDING' && itemStatus !== 'PENDING' && itemStatus !== SocialReviewStatus.PENDING_REVIEW) {
          return false;
        }
        if (statusFilter !== 'PENDING' && itemStatus !== statusFilter) {
          return false;
        }
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const idMatch = (item.id || '').toLowerCase().includes(q);
        const qIdMatch = (item.questionId || '').toLowerCase().includes(q);
        const reviewerMatch = (item.reviewerName || '').toLowerCase().includes(q);
        return idMatch || qIdMatch || reviewerMatch;
      }
      return true;
    });
  }, [reviewsList, statusFilter, searchQuery]);

  // Helper badge for status chips
  const getStatusBadge = (decision?: string | null) => {
    switch (decision) {
      case SocialReviewStatus.APPROVED:
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" /> Approved
          </span>
        );
      case SocialReviewStatus.CHANGES_REQUESTED:
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-300">
            <AlertTriangle className="w-3.5 h-3.5 mr-1 text-amber-600" /> Changes Requested
          </span>
        );
      case SocialReviewStatus.REJECTED:
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-300">
            <XCircle className="w-3.5 h-3.5 mr-1 text-rose-600" /> Rejected
          </span>
        );
      case SocialReviewStatus.STALE_REVISION_REQUIRED:
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-300">
            <ShieldAlert className="w-3.5 h-3.5 mr-1 text-purple-600" /> Stale (Revision Req)
          </span>
        );
      case SocialReviewStatus.PENDING_REVIEW:
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-300">
            <Clock className="w-3.5 h-3.5 mr-1 text-blue-600" /> Pending Review
          </span>
        );
    }
  };

  // -------------------------------------------------------------
  // VIEW: Specific Review Requested (Workspace)
  // -------------------------------------------------------------
  if (activeId) {
    if (isLoadingItem) {
      return (
        <div className="min-h-[450px] flex items-center justify-center p-8">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-3 border-violet-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm font-medium text-slate-600">
              Loading social content review workspace...
            </span>
          </div>
        </div>
      );
    }

    // Error: 403 Forbidden
    if (itemError && itemError.status === 403) {
      return (
        <div className="max-w-4xl mx-auto py-12 px-4 space-y-6">
          <div className="bg-rose-50 border border-rose-200 rounded-xl p-8 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-rose-900">Access Restricted (403 Forbidden)</h2>
            <p className="text-sm text-rose-700 max-w-lg mx-auto">
              {itemError.message ||
                'You do not have an active reviewer assignment or authorization to access this social review package.'}
            </p>
            <div className="pt-4 flex items-center justify-center gap-3">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => navigate('/social-review')}
                icon={ArrowLeft}
              >
                Back to Review Queue
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => navigate('/my-work')}
                icon={BookOpen}
              >
                Go to My Work
              </Button>
            </div>
          </div>
        </div>
      );
    }

    // Error: 404 Not Found
    if (itemError || !resolvedQuestionId) {
      return (
        <div className="max-w-4xl mx-auto py-12 px-4 space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-8 text-center space-y-4 shadow-xs">
            <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Social Review Record Not Found</h2>
            <p className="text-sm text-slate-600 max-w-lg mx-auto">
              {itemError?.message || `No social review record or question found for identifier '${activeId}'.`}
            </p>
            <div className="pt-4 flex items-center justify-center gap-3">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => navigate('/social-review')}
                icon={ArrowLeft}
              >
                Back to Review Queue
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => navigate('/questions')}
                icon={BookOpen}
              >
                Question Library
              </Button>
            </div>
          </div>
        </div>
      );
    }

    // Authorized Workspace Render
    return (
      <div className="space-y-6 max-w-7xl mx-auto pb-16 animate-in fade-in duration-200">
        <AssetWorkflowHeader
          currentStep={9}
          videoId={resolvedVideoId || undefined}
          questionId={resolvedQuestionId || undefined}
        />

        {/* Navigation & Context Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/social-review')}
              icon={ArrowLeft}
              className="text-slate-600 hover:text-slate-900"
            >
              Review Queue
            </Button>
            <span className="text-slate-300">/</span>
            <Link
              to="/social-review"
              className="text-xs font-semibold text-slate-500 hover:text-violet-700 transition-colors"
            >
              Social Review
            </Link>
            <span className="text-slate-300">/</span>
            <span className="text-xs font-mono font-bold text-violet-700 bg-violet-50 px-2 py-0.5 rounded border border-violet-200">
              {activeReviewRecord?.id || activeId}
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {activeReviewRecord && (
              <div className="flex items-center gap-2 mr-2">
                {getStatusBadge(activeReviewRecord.decision)}
              </div>
            )}
            <Link to={`/questions/${encodeURIComponent(resolvedQuestionId)}`}>
              <Button variant="secondary" size="sm" icon={BookOpen}>
                Question {resolvedQuestionId}
              </Button>
            </Link>
            <Link to="/content-masters">
              <Button variant="secondary" size="sm" icon={Layers}>
                Content Masters
              </Button>
            </Link>
          </div>
        </div>

        {/* Phase 8H SocialReviewWorkspace Component with 9:16 Simulator & One-Click Copy Bar */}
        <SocialReviewWorkspace
          questionId={resolvedQuestionId}
          onReviewSubmitted={() => {
            if (activeId) {
              loadReviewItem(activeId);
            }
          }}
        />
      </div>
    );
  }

  // -------------------------------------------------------------
  // VIEW: Global / Assigned Social Review Queue (/social-review)
  // -------------------------------------------------------------
  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-1.5 bg-violet-100 text-violet-700 rounded-lg">
              <CheckCheck className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              {isPlatformsMode ? 'Platform Packages' : 'Social Content Review Workspace'}
            </h1>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-violet-50 text-violet-700 border border-violet-200">
              {isPlatformsMode ? 'Platform Packages' : 'Social Review'}
            </span>
          </div>
          <p className="text-xs text-slate-500">
            {isPlatformsMode
              ? 'Multi-platform social distribution packages: YouTube Shorts, Instagram Reels, and Facebook Video adaptations.'
              : 'Human review queue, AI quality assurance scores, safe-zone simulator, and one-click copy bundles.'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => loadReviewsQueue()}
            icon={RefreshCw}
            disabled={isLoadingList}
          >
            Refresh Queue
          </Button>
          <Link to="/content-masters">
            <Button variant="secondary" size="sm" icon={Layers}>
              Content Masters
            </Button>
          </Link>
        </div>
      </div>

      {/* Queue Filters & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search review ID, question ID, or reviewer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:bg-white text-slate-800"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-medium text-slate-500 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Status:
          </span>
          {['ALL', 'PENDING', SocialReviewStatus.APPROVED, SocialReviewStatus.CHANGES_REQUESTED, SocialReviewStatus.REJECTED].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                statusFilter === st
                  ? 'bg-violet-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st === 'ALL' ? 'All Reviews' : st === 'PENDING' ? 'Pending' : st.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Reviews Queue List */}
      {isLoadingList ? (
        <div className="p-16 bg-white rounded-2xl border border-slate-200 text-center text-slate-500 text-xs flex flex-col items-center gap-2 shadow-xs">
          <div className="w-8 h-8 border-3 border-violet-600 border-t-transparent rounded-full animate-spin" />
          <span className="font-medium">Loading authorized social review records...</span>
        </div>
      ) : listError ? (
        <div className="p-6 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{listError}</span>
        </div>
      ) : filteredReviews.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-16 text-center space-y-3 shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <CheckCheck className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">No Social Review Records Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {reviewsList.length === 0
              ? 'There are currently no assigned or open social reviews available for your account.'
              : 'No reviews match your search or filter criteria.'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50/80 text-[11px] font-bold text-slate-700 uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3.5">Review / Question ID</th>
                  <th className="px-5 py-3.5">Status Chip</th>
                  <th className="px-5 py-3.5">AI Quality Score</th>
                  <th className="px-5 py-3.5">Assigned Reviewer</th>
                  <th className="px-5 py-3.5">Updated</th>
                  <th className="px-5 py-3.5 text-right">Simulator &amp; Review Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredReviews.map((rev) => {
                  const targetReviewUrl = isPlatformsMode
                    ? `/social-review/${encodeURIComponent(rev.id)}?tab=platforms`
                    : `/social-review/${encodeURIComponent(rev.id)}`;

                  const qualityScore = rev.overallQualityScoreAtReview;
                  const isHighQuality = qualityScore !== undefined && qualityScore !== null && qualityScore >= 85;
                  const isMediumQuality = qualityScore !== undefined && qualityScore !== null && qualityScore >= 70 && qualityScore < 85;

                  return (
                    <tr
                      key={rev.id}
                      onClick={() => navigate(targetReviewUrl)}
                      className="hover:bg-violet-50/40 cursor-pointer transition-colors group"
                    >
                      <td className="px-5 py-4">
                        <div className="space-y-0.5">
                          <span className="font-mono font-bold text-slate-900 group-hover:text-violet-700 block">
                            {rev.id}
                          </span>
                          <span className="font-mono text-[11px] text-slate-500">
                            Question: {rev.questionId}
                          </span>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        {getStatusBadge(rev.decision)}
                      </td>

                      <td className="px-5 py-4">
                        {qualityScore !== undefined && qualityScore !== null ? (
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`font-bold font-mono text-xs px-2 py-0.5 rounded-md border ${
                                isHighQuality
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                                  : isMediumQuality
                                  ? 'bg-amber-50 text-amber-700 border-amber-300'
                                  : 'bg-rose-50 text-rose-700 border-rose-300'
                              }`}
                            >
                              {qualityScore}/100
                            </span>
                            {isHighQuality && (
                              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 font-mono text-xs">Pending Score</span>
                        )}
                      </td>

                      <td className="px-5 py-4 font-medium text-slate-700">
                        {rev.reviewerName || rev.reviewerId || (
                          <span className="text-slate-400 italic">Unassigned</span>
                        )}
                      </td>

                      <td className="px-5 py-4 text-slate-500 font-mono text-[11px]">
                        {rev.reviewedAt ? new Date(rev.reviewedAt).toLocaleDateString() : '—'}
                      </td>

                      <td className="px-5 py-4 text-right">
                        <div className="inline-flex items-center gap-2">
                          <Link
                            to={`/videos/${encodeURIComponent(rev.questionId)}?tab=social`}
                            onClick={(e) => e.stopPropagation()}
                            className="p-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 transition"
                            title="Open 9:16 Simulator"
                          >
                            <Smartphone className="w-3.5 h-3.5" />
                          </Link>

                          <Link
                            to={targetReviewUrl}
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-semibold text-xs transition shadow-2xs"
                          >
                            <span>{isPlatformsMode ? 'Platform Packages' : 'Review Workspace'}</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default SocialReviewPage;
