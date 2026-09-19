import React, { useState, useEffect } from 'react';
import {
  Share2,
  Youtube,
  Instagram,
  Facebook,
  CheckCircle2,
  ExternalLink,
  Link as LinkIcon,
  AlertCircle,
  Info,
  RefreshCw,
  Search,
  Filter,
  Clock,
  UserCheck,
  RotateCcw,
  UploadCloud,
  Layers,
  FolderGit2,
  Sparkles,
  Calendar,
  Check,
  Smartphone,
  Play,
} from 'lucide-react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { PageHeader } from '../components/layout/PageHeader';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { PackageCopierModal } from '../components/publishing/PackageCopierModal';
import { PublishScheduleModal } from '../components/publishing/PublishScheduleModal';
import { RecordPublicationModal } from '../components/publishing/RecordPublicationModal';
import { PublishingAssignmentModal } from '../components/publishing/PublishingAssignmentModal';
import { RetryPlatformModal } from '../components/publishing/RetryPlatformModal';
import { FinalizePublishingModal } from '../components/publishing/FinalizePublishingModal';
import { PublishingWorkflowHeader } from '../components/publishing/PublishingWorkflowHeader';
import {
  Publishing,
  SocialPublishStatus,
  PlatformType,
  Video,
  Assignment,
  PublishingReadinessItem,
  User,
  VideoProductionStatus,
} from '../types';
import { apiClient } from '../lib/api-client';

export const PublishingPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const urlVideoId = searchParams.get('videoId') || '';
  const urlSearchQuery = searchParams.get('searchQuery') || searchParams.get('search') || searchParams.get('q') || urlVideoId;
  const filterPlatform = searchParams.get('platform') || searchParams.get('filterPlatform') || 'ALL';
  const isPackageStage = searchParams.get('stage') === 'package';

  // If stage=package was passed, redirect smoothly to the dedicated Step 14 PublishingPackagePage
  useEffect(() => {
    if (isPackageStage) {
      navigate(urlVideoId ? `/publishing-package?videoId=${encodeURIComponent(urlVideoId)}` : '/publishing-package', { replace: true });
    }
  }, [isPackageStage, urlVideoId, navigate]);

  // Primary Data State
  const [records, setRecords] = useState<Publishing[]>([]);
  const [videoMap, setVideoMap] = useState<Record<string, Video>>({});
  const [readinessMap, setReadinessMap] = useState<Record<string, PublishingReadinessItem>>({});
  const [assignmentsMap, setAssignmentsMap] = useState<Record<string, Assignment[]>>({});
  const [users, setUsers] = useState<User[]>([]);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [notification, setNotification] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Rapid URL recorder local state for cards
  const [rapidYtUrls, setRapidYtUrls] = useState<Record<string, string>>({});
  const [rapidIgUrls, setRapidIgUrls] = useState<Record<string, string>>({});
  const [publishingInProgress, setPublishingInProgress] = useState<Record<string, boolean>>({});

  // Search input state with debounced URL synchronization
  const [searchInput, setSearchInput] = useState<string>(urlSearchQuery);

  useEffect(() => {
    setSearchInput(urlSearchQuery);
  }, [urlSearchQuery]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        const current = next.get('searchQuery') || next.get('search') || next.get('q') || next.get('videoId') || '';
        if (searchInput.trim() !== current) {
          if (searchInput.trim()) {
            if (urlVideoId && searchInput.trim() === urlVideoId) {
              next.set('videoId', searchInput.trim());
            } else {
              next.set('searchQuery', searchInput.trim());
              next.delete('videoId');
            }
            next.delete('search');
            next.delete('q');
          } else {
            next.delete('searchQuery');
            next.delete('search');
            next.delete('q');
            next.delete('videoId');
          }
          return next;
        }
        return prev;
      }, { replace: true });
    }, 250);
    return () => clearTimeout(timer);
  }, [searchInput, urlVideoId, setSearchParams]);

  const updatePlatformFilter = (platformValue: string) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (platformValue && platformValue !== 'ALL') {
        next.set('platform', platformValue);
      } else {
        next.delete('platform');
        next.delete('filterPlatform');
      }
      return next;
    });
  };

  const resetFilters = () => {
    setSearchInput('');
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete('searchQuery');
      next.delete('search');
      next.delete('q');
      next.delete('videoId');
      next.delete('platform');
      next.delete('filterPlatform');
      return next;
    });
  };

  // Modals state
  const [copierModalRecord, setCopierModalRecord] = useState<{
    videoId: string;
    videoTitle: string;
    platform: PlatformType;
  } | null>(null);

  const [scheduleModalState, setScheduleModalState] = useState<{
    record: Publishing;
    platform: PlatformType;
    isReschedule?: boolean;
  } | null>(null);

  const [assignModalState, setAssignModalState] = useState<{
    record: Publishing;
    platform?: PlatformType;
    currentAssignment?: Assignment;
  } | null>(null);

  const [retryModalState, setRetryModalState] = useState<{
    record: Publishing;
    platform: PlatformType;
  } | null>(null);

  const [finalizeModalRecord, setFinalizeModalRecord] = useState<Publishing | null>(null);

  // Data Fetching
  const fetchAllData = async () => {
    try {
      setIsLoading(true);
      setErrorMessage(null);

      const [pubList, vidList, readList, assignList, userList] = await Promise.all([
        apiClient.getPublishing(),
        apiClient.getVideos().catch(() => []),
        apiClient.getPublishingReadiness().catch(() => []),
        apiClient.getAssignments({ entityType: 'PUBLISHING' }).catch(() => []),
        apiClient.getUsers().catch(() => []),
      ]);

      setRecords(pubList);

      const vMap: Record<string, Video> = {};
      vidList.forEach((v) => {
        vMap[v.id] = v;
      });
      setVideoMap(vMap);

      const rMap: Record<string, PublishingReadinessItem> = {};
      readList.forEach((r) => {
        rMap[r.videoId] = r;
      });
      setReadinessMap(rMap);

      const aMap: Record<string, Assignment[]> = {};
      assignList.forEach((a) => {
        const vId = a.entityId || a.videoId;
        if (vId) {
          if (!aMap[vId]) aMap[vId] = [];
          aMap[vId].push(a);
        }
      });
      setAssignmentsMap(aMap);

      setUsers(userList);

      // Initialize rapid url states from records
      const initialYt: Record<string, string> = {};
      const initialIg: Record<string, string> = {};
      pubList.forEach((r) => {
        if (r.youtube?.videoUrl) initialYt[r.videoId] = r.youtube.videoUrl;
        if (r.instagram?.postUrl) initialIg[r.videoId] = r.instagram.postUrl;
      });
      setRapidYtUrls(initialYt);
      setRapidIgUrls(initialIg);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to load publishing records');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // Update a single publishing record locally across states
  const updateLocalRecord = (updated: Publishing) => {
    setRecords((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
  };

  // Rapid Confirm Publication Handler
  const handleConfirmPublication = async (record: Publishing) => {
    const ytUrl = rapidYtUrls[record.videoId] || record.youtube?.videoUrl || '';
    const igUrl = rapidIgUrls[record.videoId] || record.instagram?.postUrl || '';

    if (!ytUrl && !igUrl) {
      setErrorMessage(`Please enter at least a YouTube Shorts URL or Instagram URL for ${record.videoId}.`);
      return;
    }

    setPublishingInProgress((prev) => ({ ...prev, [record.videoId]: true }));
    setErrorMessage(null);

    try {
      const updates: Partial<Publishing> = {
        youtube: {
          status: ytUrl ? SocialPublishStatus.PUBLISHED : (record.youtube?.status || SocialPublishStatus.NOT_STARTED),
          videoUrl: ytUrl || undefined,
          publishedAt: ytUrl ? new Date().toISOString() : record.youtube?.publishedAt,
        },
        instagram: {
          status: igUrl ? SocialPublishStatus.PUBLISHED : (record.instagram?.status || SocialPublishStatus.NOT_STARTED),
          postUrl: igUrl || undefined,
          publishedAt: igUrl ? new Date().toISOString() : record.instagram?.publishedAt,
        },
      };

      const updated = await apiClient.updatePublishing(record.id, updates);

      // Transition video status to PUBLISHED / UPLOADED
      if (record.videoId) {
        await apiClient.updateVideoStatus(
          record.videoId,
          VideoProductionStatus.UPLOADED,
          'Rapid publication confirmed: YouTube and Instagram live URLs recorded.'
        ).catch(() => null);
      }

      updateLocalRecord(updated);
      setNotification(`Video ${record.videoId} successfully published and live URLs saved!`);
      setTimeout(() => setNotification(null), 4000);
      fetchAllData();
    } catch (err: any) {
      setErrorMessage(err?.message || `Failed to confirm publication for ${record.videoId}`);
    } finally {
      setPublishingInProgress((prev) => ({ ...prev, [record.videoId]: false }));
    }
  };

  // Metrics summary
  const readyToPublishCount = records.filter(
    (r) => (r.completedPlatformsCount || 0) < 2 && r.youtube?.status !== SocialPublishStatus.PUBLISHED
  ).length;

  const scheduledCount = records.filter(
    (r) =>
      r.youtube?.status === SocialPublishStatus.SCHEDULED ||
      r.instagram?.status === SocialPublishStatus.SCHEDULED ||
      r.facebook?.status === SocialPublishStatus.SCHEDULED
  ).length;

  const publishedCount = records.filter(
    (r) =>
      r.youtube?.status === SocialPublishStatus.PUBLISHED ||
      (r.completedPlatformsCount || 0) >= 2 ||
      videoMap[r.videoId]?.status === VideoProductionStatus.UPLOADED
  ).length;

  // Filter records
  const filteredRecords = records.filter((rec) => {
    const activeSearch = (searchInput || urlSearchQuery).trim();
    if (activeSearch) {
      const q = activeSearch.toLowerCase();
      const matchesSearch =
        (rec.videoId || '').toLowerCase().includes(q) ||
        (rec.videoTitle || '').toLowerCase().includes(q) ||
        (rec.questionId || '').toLowerCase().includes(q);
      if (!matchesSearch) return false;
    }

    const video = videoMap[rec.videoId];
    const isPublished = rec.youtube?.status === SocialPublishStatus.PUBLISHED || video?.status === VideoProductionStatus.UPLOADED;

    if (filterPlatform === 'READY_TO_PUBLISH') return !isPublished;
    if (filterPlatform === 'SCHEDULED') {
      return (
        rec.youtube?.status === SocialPublishStatus.SCHEDULED ||
        rec.instagram?.status === SocialPublishStatus.SCHEDULED
      );
    }
    if (filterPlatform === 'ALL_PUBLISHED') return isPublished;

    return true;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200 max-w-7xl mx-auto pb-16">
      {/* Page Header */}
      <PageHeader
        title="Publish & Release"
        description="Rapid multi-platform distribution: YouTube Shorts & Instagram live URL verification, Google Drive master asset trigger, and one-click publication confirmation."
        badge={
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            Release Station
          </span>
        }
      />

      {/* Step 15 Publishing Workflow Steps Bar */}
      <PublishingWorkflowHeader
        currentStep={15}
        videoId={urlVideoId || undefined}
        videoTitle={urlVideoId && videoMap[urlVideoId] ? videoMap[urlVideoId].title : undefined}
        videoStatus={urlVideoId && videoMap[urlVideoId] ? videoMap[urlVideoId].status : undefined}
        questionId={urlVideoId && videoMap[urlVideoId] ? videoMap[urlVideoId].questionId : undefined}
      />

      {/* 3 Metric Cards Distribution Summary Header */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Metric 1: Ready to Publish (Emerald) */}
        <div className="bg-emerald-50/80 border-2 border-emerald-300 rounded-2xl p-4 sm:p-5 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-800">
              Ready to Publish
            </span>
            <div className="text-3xl font-bold font-mono text-emerald-950">
              {readyToPublishCount}
            </div>
            <p className="text-[11px] text-emerald-700">QC Passed &bull; Awaiting Live Links</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-sm">
            <UploadCloud className="w-6 h-6" />
          </div>
        </div>

        {/* Metric 2: Scheduled (Indigo) */}
        <div className="bg-indigo-50/80 border-2 border-indigo-300 rounded-2xl p-4 sm:p-5 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-indigo-800">
              Scheduled
            </span>
            <div className="text-3xl font-bold font-mono text-indigo-950">
              {scheduledCount}
            </div>
            <p className="text-[11px] text-indigo-700">Queued for Channel Release</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-sm">
            <Calendar className="w-6 h-6" />
          </div>
        </div>

        {/* Metric 3: Published (Blue) */}
        <div className="bg-blue-50/80 border-2 border-blue-300 rounded-2xl p-4 sm:p-5 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-blue-800">
              Published &amp; Live
            </span>
            <div className="text-3xl font-bold font-mono text-blue-950">
              {publishedCount}
            </div>
            <p className="text-[11px] text-blue-700">Verified on Shorts / Reels</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-sm">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>
      </div>

      {notification && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-xl text-xs font-medium animate-in fade-in flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{notification}</span>
          </div>
          <button
            type="button"
            onClick={() => setNotification(null)}
            className="text-emerald-700 font-bold px-1.5 cursor-pointer"
          >
            ×
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="p-3.5 bg-rose-50 border border-rose-300 text-rose-900 rounded-xl text-xs font-medium animate-in fade-in flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-rose-700 font-bold px-1.5 cursor-pointer"
          >
            ×
          </button>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by Video ID, title, or Question ID..."
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-hidden"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto flex-wrap">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={filterPlatform}
            onChange={(e) => updatePlatformFilter(e.target.value)}
            className="text-xs border border-slate-300 rounded-xl px-3 py-1.5 bg-white text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-hidden w-full md:w-auto cursor-pointer"
          >
            <option value="ALL">All Release Records</option>
            <option value="READY_TO_PUBLISH">Ready to Publish (Unreleased)</option>
            <option value="SCHEDULED">Scheduled Releases</option>
            <option value="ALL_PUBLISHED">Live &amp; Published</option>
          </select>

          <Button
            variant="outline"
            size="sm"
            onClick={fetchAllData}
            disabled={isLoading}
            className="text-xs shrink-0 rounded-xl"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          {Boolean((searchInput || urlSearchQuery) || filterPlatform !== 'ALL') && (
            <Button
              variant="ghost"
              size="sm"
              icon={RotateCcw}
              onClick={resetFilters}
              className="text-xs text-slate-500 hover:text-slate-900"
            >
              Reset
            </Button>
          )}
        </div>
      </div>

      {/* Interactive Release Queue Cards */}
      {isLoading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center text-slate-500 space-y-3 shadow-xs">
          <div className="animate-spin rounded-full h-8 w-8 border-3 border-indigo-600 border-t-transparent mx-auto" />
          <p className="text-xs font-medium">Loading release station data from Google Sheets...</p>
        </div>
      ) : filteredRecords.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center text-slate-500 space-y-2 shadow-xs">
          <UploadCloud className="w-8 h-8 text-slate-400 mx-auto" />
          <h3 className="text-sm font-bold text-slate-800">No Release Records Found</h3>
          <p className="text-xs text-slate-500">No publishing records match your search or filter criteria.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRecords.map((rec) => {
            const vid = videoMap[rec.videoId];
            const isLive = rec.youtube?.status === SocialPublishStatus.PUBLISHED || vid?.status === VideoProductionStatus.UPLOADED;
            const effectiveDrive = vid?.driveFolderUrl || 'https://drive.google.com';
            const duration = vid?.actualDurationSeconds || vid?.targetDurationSeconds || 54;
            const isSubmitting = publishingInProgress[rec.videoId];

            return (
              <div
                key={rec.id || rec.videoId}
                className={`bg-white rounded-2xl border-2 transition-all p-5 shadow-xs ${
                  isLive ? 'border-emerald-200 bg-emerald-50/20' : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
                  {/* Left (3 cols): Thumbnail Poster Preview & Duration Badge */}
                  <div className="lg:col-span-3">
                    <div className="relative aspect-[9/16] max-h-48 sm:max-h-52 w-full rounded-xl overflow-hidden bg-slate-900 border border-slate-800 flex flex-col justify-between p-3 mx-auto shadow-sm">
                      {/* Gradient Mock Poster */}
                      <div className="absolute inset-0 bg-gradient-to-b from-indigo-950 via-slate-900 to-slate-950 -z-10" />

                      {/* Top tags */}
                      <div className="flex items-center justify-between text-white">
                        <span className="text-[9px] font-mono font-bold bg-amber-500/30 text-amber-300 px-1.5 py-0.5 rounded border border-amber-500/40">
                          BP SHORTS
                        </span>
                        <span className="text-[9px] font-mono font-bold bg-red-600 text-white px-1.5 py-0.5 rounded">
                          9:16
                        </span>
                      </div>

                      {/* Center Hook Preview */}
                      <div className="text-center p-2 bg-slate-900/80 backdrop-blur-2xs rounded-lg border border-slate-700/50">
                        <p className="font-telugu text-[11px] font-bold text-white line-clamp-2 leading-relaxed">
                          {rec.videoTitle || 'Telugu GK Speed Challenge'}
                        </p>
                      </div>

                      {/* Bottom Duration Badge */}
                      <div className="flex items-center justify-between text-white">
                        <span className="text-[10px] font-mono font-bold bg-black/60 px-2 py-0.5 rounded backdrop-blur-2xs">
                          {duration}s &bull; Shorts
                        </span>
                        {isLive && (
                          <span className="text-[10px] font-bold bg-emerald-600 text-white px-2 py-0.5 rounded flex items-center gap-0.5">
                            <Check className="w-3 h-3" /> Live
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Center (4 cols): Video Title, Question ID, Master Cut */}
                  <div className="lg:col-span-4 space-y-2.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200">
                        {rec.videoId}
                      </span>
                      {rec.questionId && (
                        <Link
                          to={`/questions/${encodeURIComponent(rec.questionId)}`}
                          className="font-mono text-xs text-slate-600 hover:text-indigo-600 hover:underline bg-slate-100 px-2 py-0.5 rounded-md"
                        >
                          Ref: {rec.questionId}
                        </Link>
                      )}
                    </div>

                    <h3 className="font-telugu text-sm font-bold text-slate-900 leading-relaxed line-clamp-2">
                      {rec.videoTitle}
                    </h3>

                    <div className="flex items-center gap-2 flex-wrap pt-1">
                      <a
                        href={effectiveDrive}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition cursor-pointer"
                      >
                        <FolderGit2 className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Open Drive File</span>
                        <ExternalLink className="w-3 h-3 text-slate-400" />
                      </a>

                      <Link
                        to={`/videos/${encodeURIComponent(rec.videoId)}?tab=social`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold transition cursor-pointer"
                      >
                        <Smartphone className="w-3.5 h-3.5" />
                        <span>9:16 Simulator</span>
                      </Link>

                      <Link
                        to={`/videos/${encodeURIComponent(rec.videoId)}/platform-packages`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-semibold transition cursor-pointer"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                        <span>Copy Packages</span>
                      </Link>
                    </div>
                  </div>

                  {/* Right (5 cols): Rapid URL Recorder & Confirm Publication Action */}
                  <div className="lg:col-span-5 bg-slate-50/80 p-4 rounded-2xl border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1">
                        <LinkIcon className="w-3.5 h-3.5 text-indigo-600" /> Rapid URL Recorder
                      </span>
                      {isLive && (
                        <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md border border-emerald-300">
                          RECORDED &bull; LIVE
                        </span>
                      )}
                    </div>

                    {/* YouTube Shorts URL Input */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[11px] font-semibold text-slate-700">
                        <span className="flex items-center gap-1 text-red-600">
                          <Youtube className="w-3.5 h-3.5" /> YouTube Shorts URL
                        </span>
                        {rec.youtube?.videoUrl && (
                          <a
                            href={rec.youtube.videoUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-indigo-600 hover:underline flex items-center gap-0.5"
                          >
                            <span>Open</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        )}
                      </div>
                      <input
                        type="url"
                        placeholder="https://youtube.com/shorts/..."
                        value={rapidYtUrls[rec.videoId] || ''}
                        onChange={(e) =>
                          setRapidYtUrls((prev) => ({ ...prev, [rec.videoId]: e.target.value }))
                        }
                        className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-red-500 font-mono"
                      />
                    </div>

                    {/* Instagram URL Input */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[11px] font-semibold text-slate-700">
                        <span className="flex items-center gap-1 text-pink-600">
                          <Instagram className="w-3.5 h-3.5" /> Instagram Reel URL
                        </span>
                        {rec.instagram?.postUrl && (
                          <a
                            href={rec.instagram.postUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-indigo-600 hover:underline flex items-center gap-0.5"
                          >
                            <span>Open</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        )}
                      </div>
                      <input
                        type="url"
                        placeholder="https://instagram.com/reel/..."
                        value={rapidIgUrls[rec.videoId] || ''}
                        onChange={(e) =>
                          setRapidIgUrls((prev) => ({ ...prev, [rec.videoId]: e.target.value }))
                        }
                        className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-pink-500 font-mono"
                      />
                    </div>

                    {/* Confirm Publication Button */}
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => handleConfirmPublication(rec)}
                      className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer ${
                        isLive
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      } disabled:opacity-50`}
                    >
                      {isSubmitting ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4" />
                      )}
                      <span>
                        {isSubmitting
                          ? 'Recording Live URLs...'
                          : isLive
                          ? 'Update & Re-Confirm Publication'
                          : 'Confirm Publication'}
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Package Copier Modal */}
      {copierModalRecord && (
        <PackageCopierModal
          isOpen={Boolean(copierModalRecord)}
          onClose={() => setCopierModalRecord(null)}
          videoId={copierModalRecord.videoId}
          videoTitle={copierModalRecord.videoTitle}
          initialPlatform={copierModalRecord.platform}
        />
      )}

      {/* Schedule / Reschedule Modal */}
      {scheduleModalState && (
        <PublishScheduleModal
          isOpen={Boolean(scheduleModalState)}
          onClose={() => setScheduleModalState(null)}
          record={scheduleModalState.record}
          initialPlatform={scheduleModalState.platform}
          isReschedule={scheduleModalState.isReschedule}
          onSuccess={(updated, msg) => {
            updateLocalRecord(updated);
            setNotification(msg);
            setTimeout(() => setNotification(null), 3500);
          }}
        />
      )}

      {/* Publishing Assignment Modal */}
      {assignModalState && (
        <PublishingAssignmentModal
          isOpen={Boolean(assignModalState)}
          onClose={() => setAssignModalState(null)}
          record={assignModalState.record}
          users={users}
          currentAssignment={assignModalState.currentAssignment}
          initialPlatform={assignModalState.platform}
          onSuccess={(msg) => {
            setNotification(msg);
            setTimeout(() => setNotification(null), 3500);
            fetchAllData();
          }}
        />
      )}

      {/* Retry Platform Modal */}
      {retryModalState && (
        <RetryPlatformModal
          isOpen={Boolean(retryModalState)}
          onClose={() => setRetryModalState(null)}
          record={retryModalState.record}
          platform={retryModalState.platform}
          onSuccess={(updated, msg) => {
            updateLocalRecord(updated);
            setNotification(msg);
            setTimeout(() => setNotification(null), 3500);
          }}
        />
      )}

      {/* Finalize Publishing Modal */}
      {finalizeModalRecord && (
        <FinalizePublishingModal
          isOpen={Boolean(finalizeModalRecord)}
          onClose={() => setFinalizeModalRecord(null)}
          record={finalizeModalRecord}
          onSuccess={(updated, msg) => {
            updateLocalRecord(updated);
            setNotification(msg);
            setTimeout(() => setNotification(null), 3500);
            fetchAllData();
          }}
        />
      )}
    </div>
  );
};

export default PublishingPage;
