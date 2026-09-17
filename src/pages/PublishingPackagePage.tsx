import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
import {
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Copy,
  Check,
  Share2,
  UploadCloud,
  ArrowRight,
  ArrowLeft,
  Youtube,
  Instagram,
  Facebook,
  FileVideo,
  Image as ImageIcon,
  MessageSquare,
  ShieldCheck,
  RefreshCw,
  Search,
  ExternalLink,
  Sliders,
  Layers,
  FileCheck,
} from 'lucide-react';
import { PageHeader } from '../components/layout/PageHeader';
import { Button } from '../components/common/Button';
import { PublishingWorkflowHeader } from '../components/publishing/PublishingWorkflowHeader';
import { apiClient } from '../lib/api-client';
import {
  Video,
  Publishing,
  PublishingReadinessItem,
  PlatformPackageProjection,
  PlatformType,
  SocialReviewPackageBundle,
  Thumbnail,
  PinnedComment,
} from '../types';

export const PublishingPackagePage: React.FC = () => {
  const { videoId: routeVideoId } = useParams<{ videoId?: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const queryVideoId = searchParams.get('videoId') || '';
  const currentVideoId = routeVideoId || queryVideoId;

  // Data State
  const [videos, setVideos] = useState<Video[]>([]);
  const [readinessMap, setReadinessMap] = useState<Record<string, PublishingReadinessItem>>({});
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [publishingRecord, setPublishingRecord] = useState<Publishing | null>(null);

  // Asset states for active video
  const [thumbnailRecord, setThumbnailRecord] = useState<Thumbnail | null>(null);
  const [pinnedRecord, setPinnedRecord] = useState<PinnedComment | null>(null);
  const [youtubePkg, setYoutubePkg] = useState<PlatformPackageProjection | null>(null);
  const [instagramPkg, setInstagramPkg] = useState<PlatformPackageProjection | null>(null);
  const [facebookPkg, setFacebookPkg] = useState<PlatformPackageProjection | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isLoadingDetails, setIsLoadingDetails] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedPlatform, setCopiedPlatform] = useState<string | null>(null);
  const [searchFilter, setSearchFilter] = useState<string>('');

  // Initial data loading
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setIsLoading(true);
        const [vList, rList] = await Promise.all([
          apiClient.getVideos().catch(() => []),
          apiClient.getPublishingReadiness().catch(() => []),
        ]);
        setVideos(vList);

        const rMap: Record<string, PublishingReadinessItem> = {};
        rList.forEach((r) => {
          rMap[r.videoId] = r;
        });
        setReadinessMap(rMap);
      } catch (err: any) {
        setError(err?.message || 'Failed to load publishing readiness data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitialData();
  }, []);

  // Fetch active video assets & platform projections
  useEffect(() => {
    if (!currentVideoId) {
      setSelectedVideo(null);
      setPublishingRecord(null);
      setThumbnailRecord(null);
      setPinnedRecord(null);
      setYoutubePkg(null);
      setInstagramPkg(null);
      setFacebookPkg(null);
      return;
    }

    const loadVideoDetails = async () => {
      try {
        setIsLoadingDetails(true);
        setError(null);

        // Find video
        let vid = videos.find((v) => v.id === currentVideoId);
        if (!vid) {
          const freshVideos = await apiClient.getVideos().catch(() => []);
          setVideos(freshVideos);
          vid = freshVideos.find((v) => v.id === currentVideoId);
        }
        setSelectedVideo(vid || null);

        // Load publishing record, thumbnail, pinned comment, and platform projections
        const [pub, thmRes, yt, ig, fb] = await Promise.all([
          apiClient.getVideoPublishing(currentVideoId).catch(() => null),
          apiClient.getThumbnail(currentVideoId).catch(() => null),
          apiClient.getPlatformPackage(currentVideoId, 'youtube').catch(() => null),
          apiClient.getPlatformPackage(currentVideoId, 'instagram').catch(() => null),
          apiClient.getPlatformPackage(currentVideoId, 'facebook').catch(() => null),
        ]);

        setPublishingRecord(pub);
        setThumbnailRecord(thmRes?.thumbnail || null);
        setYoutubePkg(yt);
        setInstagramPkg(ig);
        setFacebookPkg(fb);
      } catch (err: any) {
        setError(err?.message || 'Failed to load video package details');
      } finally {
        setIsLoadingDetails(false);
      }
    };

    loadVideoDetails();
  }, [currentVideoId, videos]);

  const handleSelectVideo = (vidId: string) => {
    if (routeVideoId) {
      navigate(`/videos/${encodeURIComponent(vidId)}/publishing-package`);
    } else {
      setSearchParams({ videoId: vidId });
    }
  };

  const copyToClipboard = async (platformName: string, text: string) => {
    if (!text) return;
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopiedPlatform(platformName);
      setTimeout(() => setCopiedPlatform(null), 2500);
    } catch {
      setCopiedPlatform(`${platformName}-fallback`);
      setTimeout(() => setCopiedPlatform(null), 2500);
    }
  };

  const formatPlatformBundle = (pkg: PlatformPackageProjection): string => {
    const lines: string[] = [];
    lines.push(`=== ${pkg.platform.toUpperCase()} PUBLISHING PACKAGE ===`);
    lines.push(`Approved Fingerprint: ${pkg.versionHash}`);
    lines.push(`Video ID: ${pkg.videoId} | ${pkg.videoTitle}`);

    if (pkg.title) {
      lines.push(`\n--- TITLE / HEADLINE ---`);
      lines.push(pkg.title);
    }

    if (pkg.caption) {
      lines.push(`\n--- CAPTION / DESCRIPTION ---`);
      lines.push(pkg.caption);
    }

    if (pkg.hashtags && pkg.hashtags.length > 0) {
      lines.push(`\n--- HASHTAGS ---`);
      lines.push(pkg.hashtags.join(' '));
    }

    if (pkg.tags && pkg.tags.length > 0) {
      lines.push(`\n--- TAGS / KEYWORDS ---`);
      lines.push(pkg.tags.join(', '));
    }

    if (pkg.cta) {
      lines.push(`\n--- CALL TO ACTION ---`);
      lines.push(pkg.cta);
    }

    if (pkg.pinnedComment) {
      lines.push(`\n--- PINNED COMMENT ---`);
      lines.push(pkg.pinnedComment);
    }

    if (pkg.finalRenderAssetPath) {
      lines.push(`\n--- RENDER ASSET PATH ---`);
      lines.push(pkg.finalRenderAssetPath);
    }

    return lines.join('\n');
  };

  const readiness = currentVideoId ? readinessMap[currentVideoId] : null;
  const isGateDReady =
    readiness?.status === 'READY' || publishingRecord?.finalVideoStatus === 'VERIFIED';

  const hasVideoRender =
    Boolean(youtubePkg?.finalRenderAssetPath) ||
    Boolean(selectedVideo?.driveFileId) ||
    Boolean(selectedVideo?.driveFolderUrl) ||
    publishingRecord?.finalVideoStatus === 'VERIFIED' ||
    publishingRecord?.finalVideoStatus === 'RENDERED';

  const hasThumbnail =
    Boolean(thumbnailRecord?.driveAssetUrl) ||
    publishingRecord?.thumbnailReady === true ||
    Boolean(readiness?.thumbnailApproved);

  const hasPinnedComment =
    Boolean(publishingRecord?.pinnedCommentReady) ||
    Boolean(youtubePkg?.pinnedComment) ||
    Boolean(readiness?.pinnedCommentReady);

  const hasPlatforms = Boolean(youtubePkg && instagramPkg && facebookPkg);

  const filteredVideos = videos.filter((v) => {
    if (!searchFilter.trim()) return true;
    const q = searchFilter.toLowerCase();
    return (
      v.id.toLowerCase().includes(q) ||
      (v.title || '').toLowerCase().includes(q) ||
      (v.questionId || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Page Header */}
      <PageHeader
        title="14 Publishing Package"
        description="Pre-flight channel checklist, Gate D asset verification, and platform package bundles ready for manual publishing."
        badge={
          <span className="text-xs font-mono font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            Step 14 • Publishing Package
          </span>
        }
      />

      {/* Publishing Workflow Header Steps Bar */}
      <PublishingWorkflowHeader
        currentStep={14}
        videoId={currentVideoId || undefined}
        videoTitle={selectedVideo?.title || publishingRecord?.videoTitle}
        videoStatus={selectedVideo?.status}
        questionId={selectedVideo?.questionId || publishingRecord?.questionId}
      />

      {/* Video Selector & Switcher */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider shrink-0 flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-emerald-600" />
            Select Video:
          </label>
          <select
            value={currentVideoId}
            onChange={(e) => handleSelectVideo(e.target.value)}
            className="text-xs font-medium border border-slate-300 rounded-lg px-3 py-1.5 bg-white text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-hidden w-full md:w-96"
          >
            <option value="">-- Choose a video to assemble publishing package --</option>
            {videos.map((v) => {
              const r = readinessMap[v.id];
              const isReady = r?.status === 'READY';
              return (
                <option key={v.id} value={v.id}>
                  {v.id} • {v.title ? v.title.slice(0, 40) : 'Untitled'} [{isReady ? 'READY' : 'GATE D'}]
                </option>
              );
            })}
          </select>
        </div>

        <div className="relative w-full md:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            placeholder="Filter video selector..."
            className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-hidden"
          />
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {!currentVideoId ? (
        /* Empty State: Select a Video */
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center space-y-4 shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-100 shadow-2xs">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="text-base font-bold text-slate-900">Select a Production Package</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Verify Gate D pre-flight readiness (final video render, thumbnail asset, pinned comment, platform adaptations) before manual publication.
            </p>
          </div>

          <div className="max-w-2xl mx-auto pt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
            {filteredVideos.slice(0, 6).map((vid) => {
              const r = readinessMap[vid.id];
              const isReady = r?.status === 'READY';
              return (
                <button
                  key={vid.id}
                  onClick={() => handleSelectVideo(vid.id)}
                  className="p-3 rounded-lg border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/40 text-left transition-all group"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-mono font-bold text-slate-800 group-hover:text-emerald-700">
                      {vid.id}
                    </span>
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-semibold ${
                        isReady
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}
                    >
                      {isReady ? 'GATE D READY' : 'PRE-FLIGHT'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 font-medium truncate">{vid.title || 'Untitled Video'}</p>
                </button>
              );
            })}
          </div>
        </div>
      ) : isLoadingDetails ? (
        /* Loading State */
        <div className="bg-white rounded-xl border border-slate-200 p-16 text-center space-y-3">
          <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin mx-auto" />
          <p className="text-xs font-medium text-slate-600">
            Verifying Gate D pre-flight assets for {currentVideoId}...
          </p>
        </div>
      ) : (
        /* Video Package Assembled View */
        <div className="space-y-6">
          {/* Gate D Pre-Flight Readiness Status Card */}
          <div
            className={`rounded-xl border p-5 shadow-xs transition-all ${
              isGateDReady
                ? 'bg-emerald-50/60 border-emerald-300 text-emerald-950'
                : 'bg-amber-50/60 border-amber-300 text-amber-950'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start sm:items-center gap-3.5">
                <div
                  className={`p-2.5 rounded-xl shrink-0 ${
                    isGateDReady
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : 'bg-amber-600 text-white shadow-2xs'
                  }`}
                >
                  {isGateDReady ? <CheckCircle2 className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold uppercase tracking-wider">
                      {isGateDReady
                        ? 'Gate D Readiness: Verified & Ready for Publishing'
                        : 'Gate D Pre-Flight Check: Action Required'}
                    </h3>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                        isGateDReady
                          ? 'bg-emerald-200 text-emerald-900 border border-emerald-300'
                          : 'bg-amber-200 text-amber-900 border border-amber-300'
                      }`}
                    >
                      {isGateDReady ? 'READY' : 'BLOCKED'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5">
                    {isGateDReady
                      ? 'All assets (final render, thumbnail, pinned comment, platform adaptations) are complete and invariant.'
                      : 'One or more required assets are incomplete. Check the itemized verification matrix below.'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto">
                <Link to={`/platform-packages?videoId=${encodeURIComponent(currentVideoId)}`}>
                  <Button variant="outline" size="sm" icon={Share2} className="text-xs">
                    Platform Diffs
                  </Button>
                </Link>
                <Link to={`/publishing?videoId=${encodeURIComponent(currentVideoId)}`}>
                  <Button
                    variant="primary"
                    size="sm"
                    className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                  >
                    <span>Proceed to Step 15 • Publish</span>
                    <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                  </Button>
                </Link>
              </div>
            </div>

            {/* 4-Point Itemized Asset Verification Checklist */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-200/80">
              {/* Item 1: Final Video Render */}
              <div className="p-3 bg-white rounded-lg border border-slate-200 shadow-2xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                    <FileVideo className="w-4 h-4 text-indigo-600" />
                    <span>1. Final Video Render</span>
                  </div>
                  {hasVideoRender ? (
                    <Check className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-500" />
                  )}
                </div>
                <p className="text-[11px] text-slate-500 truncate">
                  {youtubePkg?.finalRenderAssetPath || selectedVideo?.driveFolderUrl || selectedVideo?.driveFileId || 'Render pending'}
                </p>
                {!hasVideoRender && (
                  <Link
                    to={`/videos/${encodeURIComponent(currentVideoId)}/final-video`}
                    className="text-[10px] text-indigo-600 hover:underline font-semibold block"
                  >
                    Open Step 09 Final Video →
                  </Link>
                )}
              </div>

              {/* Item 2: Thumbnail Asset */}
              <div className="p-3 bg-white rounded-lg border border-slate-200 shadow-2xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                    <ImageIcon className="w-4 h-4 text-emerald-600" />
                    <span>2. Thumbnail Asset</span>
                  </div>
                  {hasThumbnail ? (
                    <Check className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-500" />
                  )}
                </div>
                <p className="text-[11px] text-slate-500 truncate">
                  {thumbnailRecord?.hookHeadline || (hasThumbnail ? 'Thumbnail verified' : 'Upload pending')}
                </p>
                {!hasThumbnail && (
                  <Link
                    to={`/videos/${encodeURIComponent(currentVideoId)}/thumbnail`}
                    className="text-[10px] text-indigo-600 hover:underline font-semibold block"
                  >
                    Open Step 10 Thumbnail →
                  </Link>
                )}
              </div>

              {/* Item 3: Pinned Comment */}
              <div className="p-3 bg-white rounded-lg border border-slate-200 shadow-2xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                    <MessageSquare className="w-4 h-4 text-violet-600" />
                    <span>3. Pinned Comment</span>
                  </div>
                  {hasPinnedComment ? (
                    <Check className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-500" />
                  )}
                </div>
                <p className="text-[11px] text-slate-500 truncate">
                  {hasPinnedComment ? 'Solution & questions ready' : 'Drafting pending'}
                </p>
                {!hasPinnedComment && (
                  <Link
                    to={`/videos/${encodeURIComponent(currentVideoId)}/pinned-comment`}
                    className="text-[10px] text-indigo-600 hover:underline font-semibold block"
                  >
                    Open Step 11 Pinned Comment →
                  </Link>
                )}
              </div>

              {/* Item 4: Platform Adaptations */}
              <div className="p-3 bg-white rounded-lg border border-slate-200 shadow-2xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                    <Share2 className="w-4 h-4 text-pink-600" />
                    <span>4. Adaptations (3)</span>
                  </div>
                  {hasPlatforms ? (
                    <Check className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-500" />
                  )}
                </div>
                <p className="text-[11px] text-slate-500 truncate">
                  {hasPlatforms ? 'YT, IG & FB ready' : 'Generating packages...'}
                </p>
                <Link
                  to={`/platform-packages?videoId=${encodeURIComponent(currentVideoId)}`}
                  className="text-[10px] text-indigo-600 hover:underline font-semibold block"
                >
                  Inspect Platform Diffs →
                </Link>
              </div>
            </div>
          </div>

          {/* 3-Column Platform Bundle Distribution Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Column 1: YouTube Shorts Package */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs flex flex-col justify-between">
              <div>
                <div className="p-4 bg-red-50/80 border-b border-red-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Youtube className="w-5 h-5 text-red-600" />
                    <div>
                      <h4 className="text-xs font-bold text-red-950 uppercase">YouTube Shorts</h4>
                      <span className="text-[10px] font-mono text-red-700">9:16 Vertical • &lt; 60s</span>
                    </div>
                  </div>
                  {youtubePkg && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => copyToClipboard('youtube', formatPlatformBundle(youtubePkg))}
                      icon={copiedPlatform === 'youtube' ? Check : Copy}
                      className="text-xs bg-red-600 hover:bg-red-700 text-white py-1 h-7"
                    >
                      {copiedPlatform === 'youtube' ? 'Copied' : 'Copy Bundle'}
                    </Button>
                  )}
                </div>

                <div className="p-4 space-y-3 text-xs">
                  {youtubePkg?.title && (
                    <div className="space-y-1">
                      <span className="font-bold text-slate-700 uppercase text-[10px]">Shorts Title</span>
                      <p className="p-2 bg-slate-50 rounded border border-slate-200 font-semibold text-slate-900">
                        {youtubePkg.title}
                      </p>
                    </div>
                  )}

                  {youtubePkg?.caption && (
                    <div className="space-y-1">
                      <span className="font-bold text-slate-700 uppercase text-[10px]">Description</span>
                      <p className="p-2 bg-slate-50 rounded border border-slate-200 text-slate-700 line-clamp-4 leading-relaxed whitespace-pre-line">
                        {youtubePkg.caption}
                      </p>
                    </div>
                  )}

                  {youtubePkg?.hashtags && youtubePkg.hashtags.length > 0 && (
                    <div className="space-y-1">
                      <span className="font-bold text-slate-700 uppercase text-[10px]">Hashtags</span>
                      <div className="flex flex-wrap gap-1">
                        {youtubePkg.hashtags.slice(0, 4).map((h, i) => (
                          <span key={i} className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-red-50 text-red-700">
                            {h}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {youtubePkg?.pinnedComment && (
                    <div className="space-y-1 pt-2 border-t border-slate-100">
                      <span className="font-bold text-slate-700 uppercase text-[10px]">Pinned Comment</span>
                      <p className="p-2 bg-slate-50 rounded border border-slate-200 text-slate-600 line-clamp-3 text-[11px]">
                        {youtubePkg.pinnedComment}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px]">
                <span className="text-slate-500 font-mono">Format: 1080x1920</span>
                <Link
                  to={`/publishing?videoId=${encodeURIComponent(currentVideoId)}&platform=youtube`}
                  className="text-red-600 hover:text-red-800 font-semibold flex items-center gap-1"
                >
                  <span>Publish to YT</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
            </div>

            {/* Column 2: Instagram Reels Package */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs flex flex-col justify-between">
              <div>
                <div className="p-4 bg-pink-50/80 border-b border-pink-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Instagram className="w-5 h-5 text-pink-600" />
                    <div>
                      <h4 className="text-xs font-bold text-pink-950 uppercase">Instagram Reels</h4>
                      <span className="text-[10px] font-mono text-pink-700">9:16 Vertical • Audio Sync</span>
                    </div>
                  </div>
                  {instagramPkg && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => copyToClipboard('instagram', formatPlatformBundle(instagramPkg))}
                      icon={copiedPlatform === 'instagram' ? Check : Copy}
                      className="text-xs bg-pink-600 hover:bg-pink-700 text-white py-1 h-7"
                    >
                      {copiedPlatform === 'instagram' ? 'Copied' : 'Copy Bundle'}
                    </Button>
                  )}
                </div>

                <div className="p-4 space-y-3 text-xs">
                  {instagramPkg?.caption && (
                    <div className="space-y-1">
                      <span className="font-bold text-slate-700 uppercase text-[10px]">Reel Caption</span>
                      <p className="p-2 bg-slate-50 rounded border border-slate-200 text-slate-700 line-clamp-5 leading-relaxed whitespace-pre-line">
                        {instagramPkg.caption}
                      </p>
                    </div>
                  )}

                  {instagramPkg?.hashtags && instagramPkg.hashtags.length > 0 && (
                    <div className="space-y-1">
                      <span className="font-bold text-slate-700 uppercase text-[10px]">Hashtags (5-8)</span>
                      <div className="flex flex-wrap gap-1">
                        {instagramPkg.hashtags.slice(0, 5).map((h, i) => (
                          <span key={i} className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-pink-50 text-pink-700">
                            {h}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {instagramPkg?.pinnedComment && (
                    <div className="space-y-1 pt-2 border-t border-slate-100">
                      <span className="font-bold text-slate-700 uppercase text-[10px]">Pinned Comment</span>
                      <p className="p-2 bg-slate-50 rounded border border-slate-200 text-slate-600 line-clamp-3 text-[11px]">
                        {instagramPkg.pinnedComment}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px]">
                <span className="text-slate-500 font-mono">Format: 1080x1920</span>
                <Link
                  to={`/publishing?videoId=${encodeURIComponent(currentVideoId)}&platform=instagram`}
                  className="text-pink-600 hover:text-pink-800 font-semibold flex items-center gap-1"
                >
                  <span>Publish to IG</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
            </div>

            {/* Column 3: Facebook Video Package */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs flex flex-col justify-between">
              <div>
                <div className="p-4 bg-blue-50/80 border-b border-blue-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Facebook className="w-5 h-5 text-blue-600" />
                    <div>
                      <h4 className="text-xs font-bold text-blue-950 uppercase">Facebook Video</h4>
                      <span className="text-[10px] font-mono text-blue-700">Reels / Feed Post</span>
                    </div>
                  </div>
                  {facebookPkg && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => copyToClipboard('facebook', formatPlatformBundle(facebookPkg))}
                      icon={copiedPlatform === 'facebook' ? Check : Copy}
                      className="text-xs bg-blue-600 hover:bg-blue-700 text-white py-1 h-7"
                    >
                      {copiedPlatform === 'facebook' ? 'Copied' : 'Copy Bundle'}
                    </Button>
                  )}
                </div>

                <div className="p-4 space-y-3 text-xs">
                  {facebookPkg?.title && (
                    <div className="space-y-1">
                      <span className="font-bold text-slate-700 uppercase text-[10px]">Post Headline</span>
                      <p className="p-2 bg-slate-50 rounded border border-slate-200 font-semibold text-slate-900">
                        {facebookPkg.title}
                      </p>
                    </div>
                  )}

                  {facebookPkg?.caption && (
                    <div className="space-y-1">
                      <span className="font-bold text-slate-700 uppercase text-[10px]">Post Summary</span>
                      <p className="p-2 bg-slate-50 rounded border border-slate-200 text-slate-700 line-clamp-4 leading-relaxed whitespace-pre-line">
                        {facebookPkg.caption}
                      </p>
                    </div>
                  )}

                  {facebookPkg?.hashtags && facebookPkg.hashtags.length > 0 && (
                    <div className="space-y-1">
                      <span className="font-bold text-slate-700 uppercase text-[10px]">Telugu + English Hashtags</span>
                      <div className="flex flex-wrap gap-1">
                        {facebookPkg.hashtags.slice(0, 4).map((h, i) => (
                          <span key={i} className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-50 text-blue-700">
                            {h}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {facebookPkg?.pinnedComment && (
                    <div className="space-y-1 pt-2 border-t border-slate-100">
                      <span className="font-bold text-slate-700 uppercase text-[10px]">Pinned Comment</span>
                      <p className="p-2 bg-slate-50 rounded border border-slate-200 text-slate-600 line-clamp-3 text-[11px]">
                        {facebookPkg.pinnedComment}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px]">
                <span className="text-slate-500 font-mono">Format: 1080x1920 / 1:1</span>
                <Link
                  to={`/publishing?videoId=${encodeURIComponent(currentVideoId)}&platform=facebook`}
                  className="text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1"
                >
                  <span>Publish to FB</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
            </div>
          </div>

          {/* Workflow Footer Navigation Bar */}
          <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
            <Link
              to={`/platform-packages?videoId=${encodeURIComponent(currentVideoId)}`}
              className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Step 13 Platform Packages</span>
            </Link>

            <Link to={`/publishing?videoId=${encodeURIComponent(currentVideoId)}`}>
              <Button
                variant="primary"
                size="sm"
                className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
              >
                <span>Proceed to Step 15 • Publish</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
              </Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default PublishingPackagePage;
