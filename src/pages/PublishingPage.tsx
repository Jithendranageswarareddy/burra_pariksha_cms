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
} from 'lucide-react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { PageHeader } from '../components/layout/PageHeader';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { PublishingTable } from '../components/publishing/PublishingTable';
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

  // Search input state with debounced URL synchronization (Phase 14.3)
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

  // Modal 1: Manage Links Modal
  const [activeModalRecord, setActiveModalRecord] = useState<Publishing | null>(null);
  const [ytUrl, setYtUrl] = useState('');
  const [ytStatus, setYtStatus] = useState<SocialPublishStatus>(SocialPublishStatus.NOT_STARTED);
  const [igUrl, setIgUrl] = useState('');
  const [igStatus, setIgStatus] = useState<SocialPublishStatus>(SocialPublishStatus.NOT_STARTED);
  const [fbUrl, setFbUrl] = useState('');
  const [fbStatus, setFbStatus] = useState<SocialPublishStatus>(SocialPublishStatus.NOT_STARTED);

  // Modal 2: Package Copier Modal
  const [copierModalRecord, setCopierModalRecord] = useState<{
    videoId: string;
    videoTitle: string;
    platform: PlatformType;
  } | null>(null);

  // Modal 3: Schedule Modal
  const [scheduleModalState, setScheduleModalState] = useState<{
    record: Publishing;
    platform: PlatformType;
    isReschedule?: boolean;
  } | null>(null);

  // Modal 4: Record Publication Modal (Manual Public URL)
  const [recordPubModalState, setRecordPubModalState] = useState<{
    record: Publishing;
    platform: PlatformType;
  } | null>(null);

  // Modal 5: Publishing Assignment Modal
  const [assignModalState, setAssignModalState] = useState<{
    record: Publishing;
    platform?: PlatformType;
    currentAssignment?: Assignment;
  } | null>(null);

  // Modal 6: Retry Platform Modal
  const [retryModalState, setRetryModalState] = useState<{
    record: Publishing;
    platform: PlatformType;
  } | null>(null);

  // Modal 7: Finalize Publishing Modal
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
    if (activeModalRecord && activeModalRecord.id === updated.id) {
      setActiveModalRecord(updated);
    }
  };

  // Handlers for child components
  const handleCopyPackage = (record: Publishing, platform?: PlatformType) => {
    setCopierModalRecord({
      videoId: record.videoId,
      videoTitle: record.videoTitle,
      platform: platform || 'youtube',
    });
  };

  const handleOpenSchedule = (record: Publishing, platform: PlatformType, isReschedule = false) => {
    setScheduleModalState({
      record,
      platform,
      isReschedule,
    });
  };

  const handleOpenRecordPublication = (record: Publishing, platform: PlatformType) => {
    setRecordPubModalState({
      record,
      platform,
    });
  };

  const handleOpenAssignment = (
    record: Publishing,
    platform?: PlatformType,
    currentAssignment?: Assignment
  ) => {
    setAssignModalState({
      record,
      platform,
      currentAssignment,
    });
  };

  const handleOpenRetry = (record: Publishing, platform: PlatformType) => {
    setRetryModalState({
      record,
      platform,
    });
  };

  const handleOpenFinalize = (record: Publishing) => {
    setFinalizeModalRecord(record);
  };

  const handleOpenManageLinksModal = (rec: Publishing) => {
    setActiveModalRecord(rec);
    setYtUrl(rec.youtube?.videoUrl || '');
    setYtStatus(rec.youtube?.status || SocialPublishStatus.NOT_STARTED);

    setIgUrl(rec.instagram?.postUrl || '');
    setIgStatus(rec.instagram?.status || SocialPublishStatus.NOT_STARTED);

    setFbUrl(rec.facebook?.postUrl || '');
    setFbStatus(rec.facebook?.status || SocialPublishStatus.NOT_STARTED);
  };

  const handleSaveUrls = async () => {
    if (!activeModalRecord) return;

    try {
      setIsSaving(true);
      setErrorMessage(null);

      const updates: Partial<Publishing> = {
        youtube: {
          status: ytUrl ? SocialPublishStatus.PUBLISHED : ytStatus,
          videoUrl: ytUrl || undefined,
          publishedAt:
            ytUrl || ytStatus === SocialPublishStatus.PUBLISHED
              ? activeModalRecord.youtube?.publishedAt || new Date().toISOString()
              : undefined,
        },
        instagram: {
          status: igUrl ? SocialPublishStatus.PUBLISHED : igStatus,
          postUrl: igUrl || undefined,
          publishedAt:
            igUrl || igStatus === SocialPublishStatus.PUBLISHED
              ? activeModalRecord.instagram?.publishedAt || new Date().toISOString()
              : undefined,
        },
        facebook: {
          status: fbUrl ? SocialPublishStatus.PUBLISHED : fbStatus,
          postUrl: fbUrl || undefined,
          publishedAt:
            fbUrl || fbStatus === SocialPublishStatus.PUBLISHED
              ? activeModalRecord.facebook?.publishedAt || new Date().toISOString()
              : undefined,
        },
      };

      const updated = await apiClient.updatePublishing(activeModalRecord.id, updates);
      updateLocalRecord(updated);
      setActiveModalRecord(null);
      setNotification(`Published social media URLs saved for video ${updated.videoId}.`);
      setTimeout(() => setNotification(null), 3500);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to save publishing URLs');
    } finally {
      setIsSaving(false);
    }
  };

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

    const readiness = readinessMap[rec.videoId];
    const isGateDReady = readiness?.status === 'READY' || rec.finalVideoStatus === 'VERIFIED';
    const video = videoMap[rec.videoId];

    if (filterPlatform === 'GATE_D_READY') return isGateDReady;
    if (filterPlatform === 'GATE_D_BLOCKED') return !isGateDReady;
    if (filterPlatform === 'PENDING_YOUTUBE') return rec.youtube?.status !== SocialPublishStatus.PUBLISHED;
    if (filterPlatform === 'PENDING_INSTAGRAM') return rec.instagram?.status !== SocialPublishStatus.PUBLISHED;
    if (filterPlatform === 'PENDING_FACEBOOK') return rec.facebook?.status !== SocialPublishStatus.PUBLISHED;
    if (filterPlatform === 'SCHEDULED') {
      return (
        rec.youtube?.status === SocialPublishStatus.SCHEDULED ||
        rec.instagram?.status === SocialPublishStatus.SCHEDULED ||
        rec.facebook?.status === SocialPublishStatus.SCHEDULED
      );
    }
    if (filterPlatform === 'FAILED') {
      return (
        rec.youtube?.status === SocialPublishStatus.FAILED ||
        rec.instagram?.status === SocialPublishStatus.FAILED ||
        rec.facebook?.status === SocialPublishStatus.FAILED
      );
    }
    if (filterPlatform === 'ALL_PUBLISHED') return (rec.completedPlatformsCount || 0) >= 3;
    if (filterPlatform === 'FINALIZED') return video?.status === VideoProductionStatus.UPLOADED;

    return true;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Page Header */}
      <PageHeader
        title="15 Publish"
        description="Manual multi-platform distribution: YouTube Shorts, Instagram Reels, and Facebook Video manual uploads, scheduling, retries, and live URL verification."
        badge={
          <span className="text-xs font-mono font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            Step 15 • Publish
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

      {/* Workflow Architecture Notice */}
      <div className="p-4 bg-slate-900 text-white rounded-xl border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3.5 text-xs shadow-xs">
        <div className="flex items-start gap-3.5">
          <Info className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold text-slate-100">
              Human-In-The-Loop Distribution Architecture
            </p>
            <p className="text-slate-400 leading-relaxed max-w-4xl">
              Burra Pariksha does not connect directly to social network upload APIs. Operators copy the approved package projections, manually upload to YouTube Shorts, Instagram Reels, and Facebook Video, and record the verified live URLs to finalize distribution.
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={fetchAllData}
          disabled={isLoading}
          className="text-xs shrink-0 text-slate-200 border-slate-700 hover:bg-slate-800"
        >
          <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh Hub
        </Button>
      </div>

      {notification && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-lg text-xs font-medium animate-in fade-in flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{notification}</span>
          </div>
          <button
            type="button"
            onClick={() => setNotification(null)}
            className="text-emerald-700 font-bold px-1"
          >
            ×
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="p-3 bg-rose-50 border border-rose-300 text-rose-900 rounded-lg text-xs font-medium animate-in fade-in flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-rose-700 font-bold px-1"
          >
            ×
          </button>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by Video ID, title, or Question ID..."
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-hidden"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={filterPlatform}
            onChange={(e) => updatePlatformFilter(e.target.value)}
            className="text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-hidden w-full md:w-auto"
          >
            <option value="ALL">All Publishing Records</option>
            <option value="GATE_D_READY">Gate D: Ready For Publishing</option>
            <option value="GATE_D_BLOCKED">Gate D: Blocked Records</option>
            <option value="PENDING_YOUTUBE">Pending YouTube Shorts</option>
            <option value="PENDING_INSTAGRAM">Pending Instagram Reels</option>
            <option value="PENDING_FACEBOOK">Pending Facebook Video</option>
            <option value="SCHEDULED">Has Scheduled Channels</option>
            <option value="FAILED">Has Failed Channels (Requires Retry)</option>
            <option value="ALL_PUBLISHED">All 3 Channels Live</option>
            <option value="FINALIZED">Video Finalized (UPLOADED)</option>
          </select>

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

      {/* Table */}
      {isLoading ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-500">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-3" />
          <p className="text-xs">Loading publishing workflow data from Google Sheets...</p>
        </div>
      ) : filteredRecords.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-500">
          <p className="text-xs">No publishing records found matching the active filter.</p>
        </div>
      ) : (
        <PublishingTable
          records={filteredRecords}
          videoMap={videoMap}
          readinessMap={readinessMap}
          assignmentsMap={assignmentsMap}
          onOpenRecord={handleOpenManageLinksModal}
          onCopyPackage={handleCopyPackage}
          onSchedulePlatform={handleOpenSchedule}
          onRetryPlatform={handleOpenRetry}
          onPublishPlatform={handleOpenRecordPublication}
          onAssignVideo={handleOpenAssignment}
          onFinalizePublishing={handleOpenFinalize}
        />
      )}

      {/* Manage Links Modal */}
      {activeModalRecord && (
        <Modal
          isOpen={Boolean(activeModalRecord)}
          onClose={() => setActiveModalRecord(null)}
          title={`Social Media Post URLs: ${activeModalRecord.videoId}`}
          subtitle={activeModalRecord.videoTitle}
          maxWidth="lg"
          footer={
            <div className="flex items-center justify-between w-full">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  navigate(`/production/${encodeURIComponent(activeModalRecord.videoId)}`);
                }}
                className="text-xs flex items-center gap-1"
              >
                <span>Open Video Production Workspace</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Button>

              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setActiveModalRecord(null)}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  disabled={isSaving}
                  onClick={handleSaveUrls}
                  className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  {isSaving ? 'Saving...' : 'Save All URLs'}
                </Button>
              </div>
            </div>
          }
        >
          <div className="space-y-4">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-600">
              Paste the public live URLs after manually publishing this video on your channel handles. Saving will update the <code>PUBLISHING</code> worksheet in Google Sheets.
            </div>

            {/* YouTube Input */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Youtube className="w-4 h-4 text-red-600" />
                  <span>YouTube Shorts URL</span>
                </div>
                <select
                  value={ytStatus}
                  onChange={(e) => setYtStatus(e.target.value as SocialPublishStatus)}
                  className="text-[11px] border border-slate-300 rounded px-1.5 py-0.5 bg-white"
                >
                  <option value={SocialPublishStatus.NOT_STARTED}>Not Started</option>
                  <option value={SocialPublishStatus.DRAFT}>Draft</option>
                  <option value={SocialPublishStatus.SCHEDULED}>Scheduled</option>
                  <option value={SocialPublishStatus.PUBLISHED}>Published</option>
                  <option value={SocialPublishStatus.FAILED}>Failed</option>
                </select>
              </label>
              <input
                type="url"
                value={ytUrl}
                onChange={(e) => setYtUrl(e.target.value)}
                placeholder="https://youtube.com/shorts/..."
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900 focus:ring-2 focus:ring-indigo-500 font-mono"
              />
            </div>

            {/* Instagram Input */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Instagram className="w-4 h-4 text-pink-600" />
                  <span>Instagram Reel URL</span>
                </div>
                <select
                  value={igStatus}
                  onChange={(e) => setIgStatus(e.target.value as SocialPublishStatus)}
                  className="text-[11px] border border-slate-300 rounded px-1.5 py-0.5 bg-white"
                >
                  <option value={SocialPublishStatus.NOT_STARTED}>Not Started</option>
                  <option value={SocialPublishStatus.DRAFT}>Draft</option>
                  <option value={SocialPublishStatus.SCHEDULED}>Scheduled</option>
                  <option value={SocialPublishStatus.PUBLISHED}>Published</option>
                  <option value={SocialPublishStatus.FAILED}>Failed</option>
                </select>
              </label>
              <input
                type="url"
                value={igUrl}
                onChange={(e) => setIgUrl(e.target.value)}
                placeholder="https://instagram.com/reel/..."
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900 focus:ring-2 focus:ring-indigo-500 font-mono"
              />
            </div>

            {/* Facebook Input */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Facebook className="w-4 h-4 text-blue-600" />
                  <span>Facebook Video URL</span>
                </div>
                <select
                  value={fbStatus}
                  onChange={(e) => setFbStatus(e.target.value as SocialPublishStatus)}
                  className="text-[11px] border border-slate-300 rounded px-1.5 py-0.5 bg-white"
                >
                  <option value={SocialPublishStatus.NOT_STARTED}>Not Started</option>
                  <option value={SocialPublishStatus.DRAFT}>Draft</option>
                  <option value={SocialPublishStatus.SCHEDULED}>Scheduled</option>
                  <option value={SocialPublishStatus.PUBLISHED}>Published</option>
                  <option value={SocialPublishStatus.FAILED}>Failed</option>
                </select>
              </label>
              <input
                type="url"
                value={fbUrl}
                onChange={(e) => setFbUrl(e.target.value)}
                placeholder="https://facebook.com/watch/..."
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900 focus:ring-2 focus:ring-indigo-500 font-mono"
              />
            </div>
          </div>
        </Modal>
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

      {/* Record Live Publication Modal */}
      {recordPubModalState && (
        <RecordPublicationModal
          isOpen={Boolean(recordPubModalState)}
          onClose={() => setRecordPubModalState(null)}
          record={recordPubModalState.record}
          initialPlatform={recordPubModalState.platform}
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
