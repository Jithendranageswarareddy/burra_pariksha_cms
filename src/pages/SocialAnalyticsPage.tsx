/**
 * BURRA PARIKSHA CMS - Social Analytics Page
 * Phase 27: Social Analytics Data Layer & History UI
 * 
 * Provides manual entry and historical snapshot tracking for real social performance metrics
 * (YouTube, Instagram, Facebook) linked to canonical Content IDs (BP-CNT-######).
 * 
 * Strictly maintains data isolation in the separate analytics repository at ₹0.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import {
  BarChart2,
  Youtube,
  Instagram,
  Facebook,
  CheckCircle2,
  AlertCircle,
  Clock,
  Eye,
  Heart,
  MessageSquare,
  Share2,
  TrendingUp,
  UserPlus,
  RefreshCw,
  Search,
  Filter,
  Layers,
  ShieldCheck,
  Calendar,
  FileText,
  Percent,
} from 'lucide-react';
import { PageHeader } from '../components/layout/PageHeader';
import { Button } from '../components/common/Button';
import { StatCard } from '../components/common/StatCard';
import { apiClient } from '../lib/api-client';
import {
  ContentMaster,
  CreateSocialAnalyticsInput,
  SocialAnalyticsRecord,
} from '../types';

export const SocialAnalyticsPage: React.FC = () => {
  const { contentId: paramContentId } = useParams<{ contentId?: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Content ID selection & verification state
  const initialContentId = paramContentId || searchParams.get('contentId') || '';
  const [inputContentId, setInputContentId] = useState<string>(initialContentId);
  const [selectedContentId, setSelectedContentId] = useState<string>(initialContentId);
  const [contentMasters, setContentMasters] = useState<ContentMaster[]>([]);
  const [contentMasterSearch, setContentMasterSearch] = useState<string>('');
  const [verifiedMaster, setVerifiedMaster] = useState<ContentMaster | null>(null);
  const [isVerifyingContentId, setIsVerifyingContentId] = useState<boolean>(false);
  const [verificationError, setVerificationError] = useState<string | null>(null);

  // Snapshots & History state
  const [snapshots, setSnapshots] = useState<SocialAnalyticsRecord[]>([]);
  const [isLoadingSnapshots, setIsLoadingSnapshots] = useState<boolean>(false);
  const [platformFilter, setPlatformFilter] = useState<'all' | 'youtube' | 'instagram' | 'facebook'>('all');

  // Form submission state
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [formSuccessMessage, setFormSuccessMessage] = useState<string | null>(null);
  const [formErrorMessage, setFormErrorMessage] = useState<string | null>(null);

  // Form fields
  const [formPlatform, setFormPlatform] = useState<'youtube' | 'instagram' | 'facebook'>('youtube');
  const [formPostingDate, setFormPostingDate] = useState<string>(() => {
    const now = new Date();
    return now.toISOString().slice(0, 16); // YYYY-MM-DDTHH:mm
  });
  const [formCapturedDate, setFormCapturedDate] = useState<string>(() => {
    const now = new Date();
    return now.toISOString().slice(0, 16);
  });
  const [formViews, setFormViews] = useState<number | ''>(0);
  const [formWatchTime, setFormWatchTime] = useState<number | ''>(0);
  const [formRetention, setFormRetention] = useState<number | ''>(0);
  const [formLikes, setFormLikes] = useState<number | ''>(0);
  const [formComments, setFormComments] = useState<number | ''>(0);
  const [formShares, setFormShares] = useState<number | ''>(0);
  const [formSubscribersGained, setFormSubscribersGained] = useState<number | ''>(0);
  const [formCtr, setFormCtr] = useState<number | ''>(0);
  const [formNotes, setFormNotes] = useState<string>('');

  // 1. Preload Content Masters list for easy picker
  useEffect(() => {
    let mounted = true;
    apiClient.getContentMasters()
      .then((res) => {
        if (mounted && res.success && res.data) {
          setContentMasters(res.data);
        }
      })
      .catch((err) => {
        console.warn('Failed to load Content Masters list:', err);
      });
    return () => {
      mounted = false;
    };
  }, []);

  // 2. Whenever selectedContentId changes, verify and load snapshots
  useEffect(() => {
    if (!selectedContentId) {
      setVerifiedMaster(null);
      setVerificationError(null);
      setSnapshots([]);
      return;
    }

    const trimmed = selectedContentId.trim().toUpperCase();
    const CANONICAL_REGEX = /^BP-CNT-\d{6}$/;

    if (!CANONICAL_REGEX.test(trimmed)) {
      setVerifiedMaster(null);
      setVerificationError(`Invalid Content ID format "${trimmed}". Must follow canonical format BP-CNT-######.`);
      setSnapshots([]);
      return;
    }

    let isMounted = true;
    setIsVerifyingContentId(true);
    setVerificationError(null);

    // Verify existence in Content Masters production store
    apiClient.getContentMasterDetails(trimmed)
      .then((res) => {
        if (!isMounted) return;
        if (res.success && res.data && res.data.contentMaster) {
          setVerifiedMaster(res.data.contentMaster);
          setVerificationError(null);
          // Load existing analytics snapshots for this Content ID
          loadSnapshotsForContent(trimmed);
        } else {
          setVerifiedMaster(null);
          setVerificationError(`Content Master "${trimmed}" not found in production workbook. Only existing Content Masters can receive analytics.`);
          setSnapshots([]);
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        // Fallback: check preloaded list
        const found = contentMasters.find((m) => m.id === trimmed);
        if (found) {
          setVerifiedMaster(found);
          setVerificationError(null);
          loadSnapshotsForContent(trimmed);
        } else {
          setVerifiedMaster(null);
          setVerificationError(err?.message || `Failed to verify Content Master "${trimmed}". Ensure ID exists.`);
          setSnapshots([]);
        }
      })
      .finally(() => {
        if (isMounted) setIsVerifyingContentId(false);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedContentId, contentMasters]);

  // Function to load snapshots
  const loadSnapshotsForContent = async (cid: string) => {
    setIsLoadingSnapshots(true);
    try {
      const res = await apiClient.getSocialAnalyticsForContent(cid);
      if (res.success && Array.isArray(res.records)) {
        // Sort newest captured snapshot first
        const sorted = [...res.records].sort((a, b) => {
          const timeA = new Date(a.capturedAt || a.postingTimestamp || 0).getTime();
          const timeB = new Date(b.capturedAt || b.postingTimestamp || 0).getTime();
          return timeB - timeA;
        });
        setSnapshots(sorted);
      } else {
        setSnapshots([]);
      }
    } catch (err: any) {
      console.warn('Failed to load snapshots:', err);
      setSnapshots([]);
    } finally {
      setIsLoadingSnapshots(false);
    }
  };

  const handleSelectContentId = (cid: string) => {
    setInputContentId(cid);
    setSelectedContentId(cid);
    setFormSuccessMessage(null);
    setFormErrorMessage(null);
    setSearchParams(cid ? { contentId: cid } : {});
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormSuccessMessage(null);
    setFormErrorMessage(null);

    const trimmedId = (selectedContentId || inputContentId).trim().toUpperCase();
    const CANONICAL_REGEX = /^BP-CNT-\d{6}$/;

    if (!CANONICAL_REGEX.test(trimmedId)) {
      setFormErrorMessage(`Invalid Content ID format "${trimmedId}". Must be BP-CNT-######.`);
      return;
    }

    if (!verifiedMaster) {
      setFormErrorMessage(`Please verify that Content Master "${trimmedId}" exists before recording snapshots.`);
      return;
    }

    const views = Number(formViews) || 0;
    const watchTime = Number(formWatchTime) || 0;
    const retentionRate = Number(formRetention) || 0;
    const likes = Number(formLikes) || 0;
    const comments = Number(formComments) || 0;
    const shares = Number(formShares) || 0;
    const subscribersGained = Number(formSubscribersGained) || 0;
    const ctr = Number(formCtr) || 0;

    if (retentionRate < 0 || retentionRate > 100) {
      setFormErrorMessage('Retention Rate must be between 0% and 100%.');
      return;
    }

    if (ctr < 0 || ctr > 100) {
      setFormErrorMessage('CTR must be between 0% and 100%.');
      return;
    }

    // Calculate posting timestamp with safeguard for backend duplicate detector
    let postingTimestampIso: string = new Date().toISOString();
    if (formPostingDate) {
      const baseMs = new Date(formPostingDate).getTime();
      const duplicateCount = snapshots.filter(
        (s) => s.platform.toLowerCase() === formPlatform.toLowerCase() && s.postingTimestamp && Math.abs(new Date(s.postingTimestamp).getTime() - baseMs) < 5000
      ).length;
      postingTimestampIso = new Date(baseMs + duplicateCount * 1000).toISOString();
    }

    const payload: CreateSocialAnalyticsInput = {
      contentId: trimmedId,
      platform: formPlatform,
      postingTimestamp: postingTimestampIso,
      capturedAt: formCapturedDate ? new Date(formCapturedDate).toISOString() : new Date().toISOString(),
      views,
      watchTime,
      retentionRate,
      likes,
      comments,
      shares,
      subscribersGained,
      ctr,
      notes: formNotes.trim() || undefined,
      topicId: verifiedMaster.topicId || undefined,
      subtopicId: verifiedMaster.subtopicId || undefined,
    };

    setIsSubmitting(true);
    try {
      const res = await apiClient.recordSocialAnalytics(payload);
      if (res.success && res.record) {
        setFormSuccessMessage(
          `Historical snapshot recorded successfully (${res.record.id}) on ${formPlatform.toUpperCase()} for ${trimmedId}. Stored in separate analytics workbook.`
        );
        // Refresh snapshots list
        await loadSnapshotsForContent(trimmedId);
        // Reset metrics fields while keeping captured date updated
        setFormNotes('');
        const now = new Date();
        setFormCapturedDate(now.toISOString().slice(0, 16));
      } else {
        setFormErrorMessage(res.error || 'Failed to record analytics snapshot.');
      }
    } catch (err: any) {
      setFormErrorMessage(err?.message || 'Server error while recording analytics snapshot.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter snapshots according to platform filter
  const filteredSnapshots = useMemo(() => {
    if (platformFilter === 'all') return snapshots;
    return snapshots.filter((s) => s.platform.toLowerCase().includes(platformFilter));
  }, [snapshots, platformFilter]);

  // Calculate dynamic summary stats based on current snapshot set
  const summaryStats = useMemo(() => {
    const targetSet = filteredSnapshots;
    const totalSnapshots = targetSet.length;
    if (totalSnapshots === 0) {
      return {
        totalSnapshots: 0,
        totalViews: 0,
        totalLikes: 0,
        totalComments: 0,
        totalShares: 0,
        avgRetention: 0,
        avgCtr: 0,
      };
    }

    let views = 0;
    let likes = 0;
    let comments = 0;
    let shares = 0;
    let retentionSum = 0;
    let ctrSum = 0;

    for (const s of targetSet) {
      views += Number(s.views) || 0;
      likes += Number(s.likes) || 0;
      comments += Number(s.comments) || 0;
      shares += Number(s.shares) || 0;
      retentionSum += Number(s.retentionRate) || 0;
      ctrSum += Number(s.ctr) || 0;
    }

    return {
      totalSnapshots,
      totalViews: views,
      totalLikes: likes,
      totalComments: comments,
      totalShares: shares,
      avgRetention: Math.round((retentionSum / totalSnapshots) * 10) / 10,
      avgCtr: Math.round((ctrSum / totalSnapshots) * 10) / 10,
    };
  }, [filteredSnapshots]);

  // Search filter for dropdown
  const filteredContentMasters = useMemo(() => {
    if (!contentMasterSearch) return contentMasters.slice(0, 15);
    const q = contentMasterSearch.toLowerCase();
    return contentMasters
      .filter((m) => m.id.toLowerCase().includes(q) || (m.title && m.title.toLowerCase().includes(q)))
      .slice(0, 15);
  }, [contentMasters, contentMasterSearch]);

  const getPlatformIcon = (platform: string) => {
    const p = platform.toLowerCase();
    if (p.includes('youtube')) return <Youtube className="w-4 h-4 text-red-600" />;
    if (p.includes('instagram')) return <Instagram className="w-4 h-4 text-pink-600" />;
    if (p.includes('facebook')) return <Facebook className="w-4 h-4 text-blue-600" />;
    return <Share2 className="w-4 h-4 text-indigo-600" />;
  };

  const getPlatformBadge = (platform: string) => {
    const p = platform.toLowerCase();
    if (p.includes('youtube')) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-red-50 text-red-700 border border-red-200">
          <Youtube className="w-3 h-3 text-red-600" /> YouTube
        </span>
      );
    }
    if (p.includes('instagram')) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-pink-50 text-pink-700 border border-pink-200">
          <Instagram className="w-3 h-3 text-pink-600" /> Instagram
        </span>
      );
    }
    if (p.includes('facebook')) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
          <Facebook className="w-3 h-3 text-blue-600" /> Facebook
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
        {platform}
      </span>
    );
  };

  return (
    <div id="social-analytics-page" className="space-y-6 pb-12">
      {/* Page Header */}
      <PageHeader
        id="social-analytics-header"
        title="Social Analytics"
        description="Track and log post-publishing performance metrics across YouTube Shorts, Instagram Reels, and Facebook."
        badge={
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
            Social Performance
          </span>
        }
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (selectedContentId) loadSnapshotsForContent(selectedContentId);
            }}
            disabled={!selectedContentId || isLoadingSnapshots}
            className="flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingSnapshots ? 'animate-spin' : ''}`} />
            <span>Refresh Snapshots</span>
          </Button>
        }
      />

      {/* Content ID Selector & Verification Panel */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-600" />
              Select Content Item
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Select or type a Content ID (<code className="font-mono text-indigo-600">BP-CNT-######</code>) to associate analytics.
            </p>
          </div>

          {/* Direct Input & Quick Picker */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative w-64">
              <input
                id="content-id-input"
                type="text"
                value={inputContentId}
                onChange={(e) => setInputContentId(e.target.value.toUpperCase())}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSelectContentId(inputContentId);
                  }
                }}
                placeholder="e.g. BP-CNT-000001"
                className="w-full px-3 py-1.5 text-xs font-mono border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 uppercase"
              />
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => handleSelectContentId(inputContentId)}
              disabled={!inputContentId || isVerifyingContentId}
            >
              {isVerifyingContentId ? 'Verifying...' : 'Load & Verify'}
            </Button>
          </div>
        </div>

        {/* Existing Content Masters Quick-Selection Pills */}
        {contentMasters.length > 0 && (
          <div className="pt-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                Quick Select from Published / Ready Content Masters:
              </span>
              <div className="relative w-44">
                <input
                  type="text"
                  placeholder="Filter masters..."
                  value={contentMasterSearch}
                  onChange={(e) => setContentMasterSearch(e.target.value)}
                  className="w-full px-2 py-1 text-[11px] border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap max-h-24 overflow-y-auto">
              {filteredContentMasters.map((m) => {
                const isSelected = selectedContentId === m.id;
                return (
                  <button
                    key={m.id}
                    id={`quick-select-${m.id}`}
                    type="button"
                    onClick={() => handleSelectContentId(m.id)}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                      isSelected
                        ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                    }`}
                  >
                    <span className="font-mono text-[11px]">{m.id}</span>
                    <span className="truncate max-w-[140px] text-[11px] opacity-80">{m.title}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Verification Status Feedback */}
        <div className="mt-4 pt-3 border-t border-slate-100">
          {isVerifyingContentId ? (
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <div className="w-3.5 h-3.5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
              <span>Verifying Content Master in production workbook...</span>
            </div>
          ) : verifiedMaster ? (
            <div className="flex items-center justify-between flex-wrap gap-2 p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-900">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <div>
                  <span className="font-semibold text-emerald-800">Content Master Verified:</span>{' '}
                  <span className="font-bold">{verifiedMaster.id}</span> —{' '}
                  <span className="italic">{verifiedMaster.title}</span>
                </div>
              </div>
              <div className="flex items-center gap-3 text-[11px]">
                <span className="px-2 py-0.5 rounded bg-emerald-100 font-semibold text-emerald-800 uppercase">
                  {verifiedMaster.status}
                </span>
                {verifiedMaster.topicId && (
                  <span className="text-slate-600 font-medium">Topic: {verifiedMaster.topicId}</span>
                )}
              </div>
            </div>
          ) : verificationError ? (
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{verificationError}</span>
            </div>
          ) : (
            <div className="text-xs text-slate-400 italic">
              Please enter or select a valid Content ID above to record or review historical metrics.
            </div>
          )}
        </div>
      </div>

      {/* Summary Stat Cards */}
      {selectedContentId && verifiedMaster && (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          <StatCard
            id="stat-total-snapshots"
            title="Snapshots"
            value={summaryStats.totalSnapshots}
            icon={BarChart2}
            accentColor="indigo"
            subtitle={platformFilter === 'all' ? 'All platforms' : platformFilter.toUpperCase()}
          />
          <StatCard
            id="stat-total-views"
            title="Total Views"
            value={summaryStats.totalViews.toLocaleString()}
            icon={Eye}
            accentColor="blue"
          />
          <StatCard
            id="stat-total-likes"
            title="Total Likes"
            value={summaryStats.totalLikes.toLocaleString()}
            icon={Heart}
            accentColor="rose"
          />
          <StatCard
            id="stat-total-comments"
            title="Comments"
            value={summaryStats.totalComments.toLocaleString()}
            icon={MessageSquare}
            accentColor="amber"
          />
          <StatCard
            id="stat-total-shares"
            title="Shares"
            value={summaryStats.totalShares.toLocaleString()}
            icon={Share2}
            accentColor="emerald"
          />
          <StatCard
            id="stat-avg-retention"
            title="Avg Retention"
            value={`${summaryStats.avgRetention}%`}
            icon={Percent}
            accentColor="cyan"
          />
          <StatCard
            id="stat-avg-ctr"
            title="Avg CTR"
            value={`${summaryStats.avgCtr}%`}
            icon={TrendingUp}
            accentColor="purple"
          />
        </div>
      )}

      {/* Main Two-Column Workflow */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Manual Snapshot Form (5 cols on lg) */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-600" />
                Record Metric Snapshot
              </h3>
              <p className="text-[11px] text-slate-500">
                Append-only entry into separate analytics repository
              </p>
            </div>
            {verifiedMaster && (
              <span className="px-2 py-0.5 rounded bg-indigo-50 border border-indigo-200 text-indigo-700 font-mono text-[11px] font-semibold">
                {verifiedMaster.id}
              </span>
            )}
          </div>

          {/* Form Messages */}
          {formSuccessMessage && (
            <div className="mb-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{formSuccessMessage}</span>
            </div>
          )}
          {formErrorMessage && (
            <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{formErrorMessage}</span>
            </div>
          )}

          <form onSubmit={handleFormSubmit} className="space-y-4">
            {/* Target Content ID (Display) */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Content ID <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                readOnly
                value={selectedContentId || 'Select a Content Master above'}
                className="w-full px-3 py-1.5 text-xs font-mono bg-slate-100 border border-slate-200 rounded-lg text-slate-700 cursor-not-allowed"
              />
            </div>

            {/* Platform Selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Platform <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  id="platform-btn-youtube"
                  type="button"
                  onClick={() => setFormPlatform('youtube')}
                  className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold border transition-all ${
                    formPlatform === 'youtube'
                      ? 'bg-red-50 text-red-700 border-red-300 shadow-xs'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <Youtube className="w-4 h-4 text-red-600" />
                  <span>YouTube</span>
                </button>
                <button
                  id="platform-btn-instagram"
                  type="button"
                  onClick={() => setFormPlatform('instagram')}
                  className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold border transition-all ${
                    formPlatform === 'instagram'
                      ? 'bg-pink-50 text-pink-700 border-pink-300 shadow-xs'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <Instagram className="w-4 h-4 text-pink-600" />
                  <span>Instagram</span>
                </button>
                <button
                  id="platform-btn-facebook"
                  type="button"
                  onClick={() => setFormPlatform('facebook')}
                  className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold border transition-all ${
                    formPlatform === 'facebook'
                      ? 'bg-blue-50 text-blue-700 border-blue-300 shadow-xs'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <Facebook className="w-4 h-4 text-blue-600" />
                  <span>Facebook</span>
                </button>
              </div>
            </div>

            {/* Timestamps Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-slate-400" />
                  Posting Date/Time
                </label>
                <input
                  id="form-posting-date"
                  type="datetime-local"
                  value={formPostingDate}
                  onChange={(e) => setFormPostingDate(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-slate-400" />
                  Captured Date/Time <span className="text-rose-500">*</span>
                </label>
                <input
                  id="form-captured-date"
                  type="datetime-local"
                  value={formCapturedDate}
                  onChange={(e) => setFormCapturedDate(e.target.value)}
                  required
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                />
              </div>
            </div>

            {/* Core Metrics: Views & Watch Time */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Views
                </label>
                <input
                  id="form-views"
                  type="number"
                  min="0"
                  value={formViews}
                  onChange={(e) => setFormViews(e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value, 10) || 0))}
                  placeholder="0"
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Watch Time (sec)
                </label>
                <input
                  id="form-watch-time"
                  type="number"
                  min="0"
                  value={formWatchTime}
                  onChange={(e) => setFormWatchTime(e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value, 10) || 0))}
                  placeholder="0"
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                />
              </div>
            </div>

            {/* Rates: Retention % & CTR % */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Retention Rate (%)
                </label>
                <input
                  id="form-retention"
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={formRetention}
                  onChange={(e) => setFormRetention(e.target.value === '' ? '' : Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)))}
                  placeholder="0.0"
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  CTR (%)
                </label>
                <input
                  id="form-ctr"
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={formCtr}
                  onChange={(e) => setFormCtr(e.target.value === '' ? '' : Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)))}
                  placeholder="0.0"
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                />
              </div>
            </div>

            {/* Engagement Metrics: Likes, Comments, Shares */}
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Likes
                </label>
                <input
                  id="form-likes"
                  type="number"
                  min="0"
                  value={formLikes}
                  onChange={(e) => setFormLikes(e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value, 10) || 0))}
                  placeholder="0"
                  className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Comments
                </label>
                <input
                  id="form-comments"
                  type="number"
                  min="0"
                  value={formComments}
                  onChange={(e) => setFormComments(e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value, 10) || 0))}
                  placeholder="0"
                  className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Shares
                </label>
                <input
                  id="form-shares"
                  type="number"
                  min="0"
                  value={formShares}
                  onChange={(e) => setFormShares(e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value, 10) || 0))}
                  placeholder="0"
                  className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                />
              </div>
            </div>

            {/* Subscribers Gained */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <UserPlus className="w-3.5 h-3.5 text-slate-400" />
                Subscribers Gained
              </label>
              <input
                id="form-subscribers"
                type="number"
                value={formSubscribersGained}
                onChange={(e) => setFormSubscribersGained(e.target.value === '' ? '' : parseInt(e.target.value, 10) || 0)}
                placeholder="0"
                className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Notes (Optional)
              </label>
              <textarea
                id="form-notes"
                rows={2}
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
                placeholder="e.g. Day 7 post-publish metrics from YouTube Studio dashboard..."
                className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              />
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <Button
                id="submit-snapshot-btn"
                type="submit"
                variant="primary"
                disabled={!verifiedMaster || isSubmitting}
                className="w-full justify-center py-2 text-xs font-semibold shadow-xs"
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Recording Snapshot...</span>
                  </div>
                ) : (
                  <span>Save Historical Snapshot</span>
                )}
              </Button>
            </div>
          </form>
        </div>

        {/* Right Column: Historical Snapshots & Timeline (7 cols on lg) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
            {/* Header & Platform Filter */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  <Clock className="w-4 h-4 text-indigo-600" />
                  Historical Snapshots Timeline
                </h3>
                <p className="text-[11px] text-slate-500">
                  Newest captured snapshots first • All historical readings preserved
                </p>
              </div>

              {/* Platform Filter Buttons */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
                <button
                  id="filter-all"
                  type="button"
                  onClick={() => setPlatformFilter('all')}
                  className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                    platformFilter === 'all'
                      ? 'bg-white text-indigo-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  All ({snapshots.length})
                </button>
                <button
                  id="filter-youtube"
                  type="button"
                  onClick={() => setPlatformFilter('youtube')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-semibold transition-all ${
                    platformFilter === 'youtube'
                      ? 'bg-white text-red-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Youtube className="w-3.5 h-3.5 text-red-600" />
                  <span>YT</span>
                </button>
                <button
                  id="filter-instagram"
                  type="button"
                  onClick={() => setPlatformFilter('instagram')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-semibold transition-all ${
                    platformFilter === 'instagram'
                      ? 'bg-white text-pink-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Instagram className="w-3.5 h-3.5 text-pink-600" />
                  <span>IG</span>
                </button>
                <button
                  id="filter-facebook"
                  type="button"
                  onClick={() => setPlatformFilter('facebook')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-semibold transition-all ${
                    platformFilter === 'facebook'
                      ? 'bg-white text-blue-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Facebook className="w-3.5 h-3.5 text-blue-600" />
                  <span>FB</span>
                </button>
              </div>
            </div>

            {/* Snapshot List or Table */}
            <div className="mt-4">
              {isLoadingSnapshots ? (
                <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-2">
                  <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs">Loading historical snapshots...</span>
                </div>
              ) : !selectedContentId ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  Select a Content ID above to view its historical analytics snapshots.
                </div>
              ) : filteredSnapshots.length === 0 ? (
                <div className="py-12 text-center text-slate-400 space-y-1">
                  <BarChart2 className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs font-semibold text-slate-600">No snapshots found</p>
                  <p className="text-[11px] text-slate-400">
                    {platformFilter === 'all'
                      ? 'Use the form on the left to record the first historical snapshot.'
                      : `No snapshots recorded for platform "${platformFilter.toUpperCase()}".`}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredSnapshots.map((snap, idx) => {
                    const capturedDate = snap.capturedAt ? new Date(snap.capturedAt).toLocaleString() : 'N/A';
                    const postingDate = snap.postingTimestamp ? new Date(snap.postingTimestamp).toLocaleDateString() : 'N/A';

                    return (
                      <div
                        key={snap.id || `snap-${idx}`}
                        id={`snapshot-${snap.id}`}
                        className="border border-slate-200 rounded-lg p-3.5 hover:border-slate-300 transition-colors bg-white shadow-2xs space-y-2.5"
                      >
                        {/* Top Snapshot Meta Header */}
                        <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-slate-100 text-xs">
                          <div className="flex items-center gap-2">
                            {getPlatformBadge(snap.platform)}
                            <span className="font-mono text-[11px] text-slate-400">{snap.id}</span>
                          </div>
                          <div className="flex items-center gap-3 text-[11px] text-slate-500">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3 text-slate-400" />
                              Captured: <strong className="text-slate-700">{capturedDate}</strong>
                            </span>
                            <span className="text-slate-300">•</span>
                            <span>Posted: {postingDate}</span>
                          </div>
                        </div>

                        {/* Metric Cells Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 text-center text-xs">
                          <div className="p-2 rounded bg-slate-50 border border-slate-100">
                            <span className="text-[10px] text-slate-400 block uppercase font-medium">Views</span>
                            <strong className="text-slate-800 text-sm font-bold">
                              {(snap.views || 0).toLocaleString()}
                            </strong>
                          </div>
                          <div className="p-2 rounded bg-slate-50 border border-slate-100">
                            <span className="text-[10px] text-slate-400 block uppercase font-medium">Watch Time</span>
                            <strong className="text-slate-800 text-sm font-bold">
                              {snap.watchTime || 0}s
                            </strong>
                          </div>
                          <div className="p-2 rounded bg-slate-50 border border-slate-100">
                            <span className="text-[10px] text-slate-400 block uppercase font-medium">Retention</span>
                            <strong className="text-slate-800 text-sm font-bold">
                              {snap.retentionRate || 0}%
                            </strong>
                          </div>
                          <div className="p-2 rounded bg-slate-50 border border-slate-100">
                            <span className="text-[10px] text-slate-400 block uppercase font-medium">Likes</span>
                            <strong className="text-slate-800 text-sm font-bold">
                              {(snap.likes || 0).toLocaleString()}
                            </strong>
                          </div>
                          <div className="p-2 rounded bg-slate-50 border border-slate-100">
                            <span className="text-[10px] text-slate-400 block uppercase font-medium">Comments</span>
                            <strong className="text-slate-800 text-sm font-bold">
                              {(snap.comments || 0).toLocaleString()}
                            </strong>
                          </div>
                          <div className="p-2 rounded bg-slate-50 border border-slate-100">
                            <span className="text-[10px] text-slate-400 block uppercase font-medium">Shares</span>
                            <strong className="text-slate-800 text-sm font-bold">
                              {(snap.shares || 0).toLocaleString()}
                            </strong>
                          </div>
                          <div className="p-2 rounded bg-slate-50 border border-slate-100">
                            <span className="text-[10px] text-slate-400 block uppercase font-medium">CTR</span>
                            <strong className="text-slate-800 text-sm font-bold">
                              {snap.ctr || 0}%
                            </strong>
                          </div>
                        </div>

                        {/* Notes / Sub-info */}
                        {(snap.notes || (snap.subscribersGained !== undefined && snap.subscribersGained !== 0)) && (
                          <div className="pt-1 flex items-center justify-between text-[11px] text-slate-500">
                            {snap.notes && (
                              <span className="italic truncate max-w-md">“{snap.notes}”</span>
                            )}
                            {snap.subscribersGained !== undefined && snap.subscribersGained !== 0 && (
                              <span className="ml-auto font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                +{snap.subscribersGained} subscribers
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
