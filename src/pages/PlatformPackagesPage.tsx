import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
import {
  Share2,
  Youtube,
  Instagram,
  Facebook,
  Copy,
  Check,
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Layers,
  Search,
  RefreshCw,
  Sliders,
  FileText,
  Hash,
  MessageSquare,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { PageHeader } from '../components/layout/PageHeader';
import { Button } from '../components/common/Button';
import { PublishingWorkflowHeader } from '../components/publishing/PublishingWorkflowHeader';
import { apiClient } from '../lib/api-client';
import {
  Video,
  PlatformPackageProjection,
  PlatformType,
  Publishing,
  SocialReviewPackageBundle,
} from '../types';

export const PlatformPackagesPage: React.FC = () => {
  const { videoId: routeVideoId } = useParams<{ videoId?: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const queryVideoId = searchParams.get('videoId') || '';
  const currentVideoId = routeVideoId || queryVideoId;

  const [activePlatform, setActivePlatform] = useState<PlatformType>('youtube');
  const [activeTab, setActiveTab] = useState<'adaptation' | 'diff' | 'all'>('adaptation');

  // Video list state
  const [videos, setVideos] = useState<Video[]>([]);
  const [publishingRecords, setPublishingRecords] = useState<Publishing[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [searchFilter, setSearchFilter] = useState<string>('');

  // Projections state for all 3 platforms
  const [youtubePkg, setYoutubePkg] = useState<PlatformPackageProjection | null>(null);
  const [instagramPkg, setInstagramPkg] = useState<PlatformPackageProjection | null>(null);
  const [facebookPkg, setFacebookPkg] = useState<PlatformPackageProjection | null>(null);
  const [reviewBundle, setReviewBundle] = useState<SocialReviewPackageBundle | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isLoadingPackages, setIsLoadingPackages] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Load initial video list and publishing records
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setIsLoading(true);
        const [vList, pList] = await Promise.all([
          apiClient.getVideos().catch(() => []),
          apiClient.getPublishing().catch(() => []),
        ]);
        setVideos(vList);
        setPublishingRecords(pList);
      } catch (err: any) {
        setError(err?.message || 'Failed to load video list');
      } finally {
        setIsLoading(false);
      }
    };
    loadInitialData();
  }, []);

  // When currentVideoId changes or videos load, load video details & platform packages
  useEffect(() => {
    if (!currentVideoId) {
      setSelectedVideo(null);
      setYoutubePkg(null);
      setInstagramPkg(null);
      setFacebookPkg(null);
      setReviewBundle(null);
      return;
    }

    const loadVideoPackages = async () => {
      try {
        setIsLoadingPackages(true);
        setError(null);

        // Find video from list or load
        let targetVid = videos.find((v) => v.id === currentVideoId);
        if (!targetVid) {
          const freshVideos = await apiClient.getVideos().catch(() => []);
          setVideos(freshVideos);
          targetVid = freshVideos.find((v) => v.id === currentVideoId);
        }
        setSelectedVideo(targetVid || null);

        // Fetch platform projections
        const [yt, ig, fb] = await Promise.all([
          apiClient.getPlatformPackage(currentVideoId, 'youtube').catch(() => null),
          apiClient.getPlatformPackage(currentVideoId, 'instagram').catch(() => null),
          apiClient.getPlatformPackage(currentVideoId, 'facebook').catch(() => null),
        ]);

        setYoutubePkg(yt);
        setInstagramPkg(ig);
        setFacebookPkg(fb);

        // Also fetch review package bundle if questionId is available
        const qId = targetVid?.questionId || yt?.questionId || ig?.questionId || fb?.questionId;
        if (qId) {
          const rRes = await apiClient.getSocialReviewPackage(qId).catch(() => null);
          if (rRes && rRes.success && rRes.data) {
            setReviewBundle(rRes.data);
          }
        }
      } catch (err: any) {
        setError(err?.message || 'Failed to load platform packages');
      } finally {
        setIsLoadingPackages(false);
      }
    };

    loadVideoPackages();
  }, [currentVideoId, videos]);

  const handleSelectVideo = (vidId: string) => {
    if (routeVideoId) {
      navigate(`/videos/${encodeURIComponent(vidId)}/platform-packages`);
    } else {
      setSearchParams({ videoId: vidId });
    }
  };

  const copyToClipboard = async (key: string, text: string) => {
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
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2500);
    } catch {
      setCopiedKey(`${key}-fallback`);
      setTimeout(() => setCopiedKey(null), 2500);
    }
  };

  const getActivePackage = (): PlatformPackageProjection | null => {
    switch (activePlatform.toLowerCase()) {
      case 'youtube':
        return youtubePkg;
      case 'instagram':
        return instagramPkg;
      case 'facebook':
        return facebookPkg;
      default:
        return youtubePkg;
    }
  };

  const formatFullPackage = (pkg: PlatformPackageProjection): string => {
    const lines: string[] = [];
    lines.push(`====================================================`);
    lines.push(`BURRA PARIKSHA — ${pkg.platform.toUpperCase()} DISTRIBUTION PACKAGE`);
    lines.push(`Approved Version Hash: ${pkg.versionHash}`);
    lines.push(`Video ID: ${pkg.videoId} | ${pkg.videoTitle}`);
    lines.push(`====================================================\n`);

    if (pkg.title) {
      lines.push(`[TITLE / HEADLINE]`);
      lines.push(`${pkg.title}\n`);
    }

    if (pkg.caption) {
      lines.push(`[CAPTION / DESCRIPTION]`);
      lines.push(`${pkg.caption}\n`);
    }

    if (pkg.hashtags && pkg.hashtags.length > 0) {
      lines.push(`[HASHTAGS]`);
      lines.push(`${pkg.hashtags.join(' ')}\n`);
    }

    if (pkg.tags && pkg.tags.length > 0) {
      lines.push(`[TAGS / SEARCH KEYWORDS]`);
      lines.push(`${pkg.tags.join(', ')}\n`);
    }

    if (pkg.cta) {
      lines.push(`[CALL TO ACTION]`);
      lines.push(`${pkg.cta}\n`);
    }

    if (pkg.pinnedComment) {
      lines.push(`[PINNED COMMENT]`);
      lines.push(`${pkg.pinnedComment}\n`);
    }

    if (pkg.finalRenderAssetPath) {
      lines.push(`[FINAL RENDER ASSET]`);
      lines.push(`${pkg.finalRenderAssetPath}\n`);
    }

    return lines.join('\n');
  };

  const filteredVideos = videos.filter((v) => {
    if (!searchFilter.trim()) return true;
    const q = searchFilter.toLowerCase();
    return (
      v.id.toLowerCase().includes(q) ||
      (v.title || '').toLowerCase().includes(q) ||
      (v.questionId || '').toLowerCase().includes(q)
    );
  });

  const activePkg = getActivePackage();

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Page Header */}
      <PageHeader
        title="13 Platform Packages"
        description="Multi-platform adaptations, channel formatting, invariance validation & copy actions for YouTube Shorts, Instagram Reels, and Facebook Video."
        badge={
          <span className="text-xs font-mono font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            Step 13 • Platform Packages
          </span>
        }
      />

      {/* Publishing Workflow Header Steps Bar */}
      <PublishingWorkflowHeader
        currentStep={13}
        videoId={currentVideoId || undefined}
        videoTitle={selectedVideo?.title || activePkg?.videoTitle}
        videoStatus={selectedVideo?.status}
        questionId={selectedVideo?.questionId || activePkg?.questionId}
      />

      {/* Video Selection Hub & Switcher */}
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
            <option value="">-- Choose a video to view platform packages --</option>
            {videos.map((v) => (
              <option key={v.id} value={v.id}>
                {v.id} • {v.title ? v.title.slice(0, 45) : 'Untitled'} ({v.status})
              </option>
            ))}
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
        /* Empty State: Prompt User to Select a Video */
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center space-y-4 shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-100 shadow-2xs">
            <Share2 className="w-7 h-7" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="text-base font-bold text-slate-900">Select a Production Video</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Choose an approved video from your production pipeline to inspect channel-specific projections for YouTube Shorts, Instagram Reels, and Facebook Video.
            </p>
          </div>

          <div className="max-w-2xl mx-auto pt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
            {filteredVideos.slice(0, 6).map((vid) => (
              <button
                key={vid.id}
                onClick={() => handleSelectVideo(vid.id)}
                className="p-3 rounded-lg border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/40 text-left transition-all group"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-mono font-bold text-slate-800 group-hover:text-emerald-700">
                    {vid.id}
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                    {vid.status}
                  </span>
                </div>
                <p className="text-xs text-slate-600 font-medium truncate">{vid.title || 'Untitled Video'}</p>
              </button>
            ))}
          </div>
        </div>
      ) : isLoadingPackages ? (
        /* Loading State */
        <div className="bg-white rounded-xl border border-slate-200 p-16 text-center space-y-3">
          <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin mx-auto" />
          <p className="text-xs font-medium text-slate-600">
            Generating platform adaptation packages for {currentVideoId}...
          </p>
        </div>
      ) : (
        /* Workspace when Video is Loaded */
        <div className="space-y-6">
          {/* Top Bar: Invariance Fingerprint & Action Buttons */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-200">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-900 uppercase">
                    Invariance Locked
                  </span>
                  {activePkg?.versionHash && (
                    <span className="text-[10px] font-mono bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200 font-semibold">
                      SHA: {activePkg.versionHash.slice(0, 16)}...
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500">
                  Platform adaptations are derived deterministically from the approved Step 12 Social Review signoff.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  copyToClipboard(
                    'all-platforms',
                    `--- YOUTUBE ---\n${youtubePkg ? formatFullPackage(youtubePkg) : ''}\n\n--- INSTAGRAM ---\n${instagramPkg ? formatFullPackage(instagramPkg) : ''}\n\n--- FACEBOOK ---\n${facebookPkg ? formatFullPackage(facebookPkg) : ''}`
                  )
                }
                icon={copiedKey === 'all-platforms' ? Check : Copy}
                className="text-xs"
              >
                {copiedKey === 'all-platforms' ? 'Copied All Channels!' : 'Copy All 3 Channels'}
              </Button>

              <Link to={`/publishing-package?videoId=${encodeURIComponent(currentVideoId)}`}>
                <Button
                  variant="primary"
                  size="sm"
                  className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  <span>Proceed to Step 14 Package</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                </Button>
              </Link>
            </div>
          </div>

          {/* Platform Switcher & Workspace Tabs */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-2">
            {/* 3 Platform Channel Pills */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActivePlatform('youtube')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all border ${
                  activePlatform.toLowerCase() === 'youtube'
                    ? 'bg-red-600 text-white border-red-700 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <Youtube className="w-4 h-4 text-white" />
                <span>YouTube Shorts</span>
                {youtubePkg && <span className="text-[10px] opacity-80 font-mono">9:16</span>}
              </button>

              <button
                type="button"
                onClick={() => setActivePlatform('instagram')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all border ${
                  activePlatform.toLowerCase() === 'instagram'
                    ? 'bg-pink-600 text-white border-pink-700 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <Instagram className="w-4 h-4 text-white" />
                <span>Instagram Reels</span>
                {instagramPkg && <span className="text-[10px] opacity-80 font-mono">9:16</span>}
              </button>

              <button
                type="button"
                onClick={() => setActivePlatform('facebook')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all border ${
                  activePlatform.toLowerCase() === 'facebook'
                    ? 'bg-blue-600 text-white border-blue-700 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <Facebook className="w-4 h-4 text-white" />
                <span>Facebook Video</span>
                {facebookPkg && <span className="text-[10px] opacity-80 font-mono">Reels/Feed</span>}
              </button>
            </div>

            {/* View Mode: Single Platform vs Diff Comparison Matrix */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setActiveTab('adaptation')}
                className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                  activeTab === 'adaptation'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Adaptation Editor
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('diff')}
                className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                  activeTab === 'diff'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Multi-Platform Diff Matrix
              </button>
            </div>
          </div>

          {/* TAB 1: Single Platform Adaptation View */}
          {activeTab === 'adaptation' && activePkg && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column: Platform Content Cards */}
              <div className="lg:col-span-2 space-y-4">
                {/* 1. Title / Headline Card */}
                <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-indigo-600" />
                      Platform Title / Headline
                    </label>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-mono text-slate-500">
                        {activePkg.title?.length || 0} characters
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard('title', activePkg.title || '')}
                        icon={copiedKey === 'title' ? Check : Copy}
                        className="text-xs text-indigo-600 hover:text-indigo-800 py-0.5 h-7"
                      >
                        {copiedKey === 'title' ? 'Copied' : 'Copy'}
                      </Button>
                    </div>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-sm font-semibold text-slate-900 font-sans">
                    {activePkg.title || '(No specific title required for this platform)'}
                  </div>
                </div>

                {/* 2. Caption / Description Card */}
                <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                      Optimized Caption & Spoken Problem Summary
                    </label>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-mono text-slate-500">
                        {activePkg.caption?.length || 0} chars
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard('caption', activePkg.caption || '')}
                        icon={copiedKey === 'caption' ? Check : Copy}
                        className="text-xs text-indigo-600 hover:text-indigo-800 py-0.5 h-7"
                      >
                        {copiedKey === 'caption' ? 'Copied' : 'Copy'}
                      </Button>
                    </div>
                  </div>
                  <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-800 font-sans leading-relaxed whitespace-pre-line">
                    {activePkg.caption}
                  </div>
                </div>

                {/* 3. Hashtags & Tags */}
                <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <Hash className="w-3.5 h-3.5 text-indigo-600" />
                      Distribution Hashtags ({activePkg.hashtags?.length || 0})
                    </label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard('hashtags', (activePkg.hashtags || []).join(' '))}
                      icon={copiedKey === 'hashtags' ? Check : Copy}
                      className="text-xs text-indigo-600 hover:text-indigo-800 py-0.5 h-7"
                    >
                      {copiedKey === 'hashtags' ? 'Copied' : 'Copy All'}
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {activePkg.hashtags?.map((h, i) => (
                      <span
                        key={i}
                        className="text-xs font-mono font-medium px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200"
                      >
                        {h.startsWith('#') ? h : `#${h}`}
                      </span>
                    ))}
                  </div>

                  {activePkg.tags && activePkg.tags.length > 0 && (
                    <div className="pt-2 border-t border-slate-100 space-y-1.5">
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span>Search Tags (Keywords):</span>
                        <button
                          type="button"
                          onClick={() => copyToClipboard('tags', activePkg.tags?.join(', ') || '')}
                          className="text-indigo-600 hover:underline text-[11px] font-medium"
                        >
                          {copiedKey === 'tags' ? 'Copied' : 'Copy Tags'}
                        </button>
                      </div>
                      <div className="text-xs font-mono text-slate-600 bg-slate-50 p-2 rounded border border-slate-200">
                        {activePkg.tags.join(', ')}
                      </div>
                    </div>
                  )}
                </div>

                {/* 4. Pinned Comment Card */}
                <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                      Pinned Engagement & Solution Comment
                    </label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard('pinned', activePkg.pinnedComment || '')}
                      icon={copiedKey === 'pinned' ? Check : Copy}
                      className="text-xs text-emerald-600 hover:text-emerald-800 py-0.5 h-7"
                    >
                      {copiedKey === 'pinned' ? 'Copied' : 'Copy'}
                    </Button>
                  </div>
                  <div className="p-3.5 bg-emerald-50/50 rounded-lg border border-emerald-200 text-xs text-slate-800 font-sans leading-relaxed whitespace-pre-line">
                    {activePkg.pinnedComment}
                  </div>
                </div>
              </div>

              {/* Right Column: Platform Specifications & Copy Bundle */}
              <div className="space-y-4">
                {/* Channel Spec Card */}
                <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2">
                    <Layers className="w-3.5 h-3.5 text-slate-600" />
                    Channel Rules & Specifications
                  </h4>

                  <div className="space-y-2.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Aspect Ratio:</span>
                      <span className="font-mono font-bold text-slate-800">9:16 Vertical</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Duration Target:</span>
                      <span className="font-mono font-bold text-slate-800">&lt; 60 seconds</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Resolution:</span>
                      <span className="font-mono font-bold text-slate-800">1080 x 1920 px</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Pinned Comment:</span>
                      <span className="font-semibold text-emerald-700">Supported</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Audio Sync:</span>
                      <span className="font-semibold text-indigo-700">Native Telugu</span>
                    </div>
                  </div>

                  {activePkg.cta && (
                    <div className="pt-2 border-t border-slate-100 space-y-1">
                      <span className="text-[11px] font-bold text-slate-500 uppercase">
                        Audience Call To Action:
                      </span>
                      <p className="text-xs font-semibold text-indigo-900 bg-indigo-50 p-2 rounded border border-indigo-100">
                        {activePkg.cta}
                      </p>
                    </div>
                  )}
                </div>

                {/* One-Click Full Package Copier */}
                <div className="bg-slate-900 text-white rounded-xl p-4 border border-slate-800 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Copy className="w-4 h-4 text-emerald-400" />
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-100">
                        {activePlatform.toUpperCase()} Bundle
                      </h4>
                    </div>
                    <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                      READY TO UPLOAD
                    </span>
                  </div>

                  <p className="text-xs text-slate-400 leading-relaxed">
                    Copy the complete formatted distribution text bundle ready to paste directly into your channel creator dashboard.
                  </p>

                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => copyToClipboard('full-pkg', formatFullPackage(activePkg))}
                    icon={copiedKey === 'full-pkg' ? Check : Copy}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold py-2"
                  >
                    {copiedKey === 'full-pkg'
                      ? `Copied ${activePlatform.toUpperCase()} Package!`
                      : `Copy ${activePlatform.toUpperCase()} Package Bundle`}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Multi-Platform Diff Matrix */}
          {activeTab === 'diff' && (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
              <div className="p-4 bg-slate-50 border-b border-slate-200">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Cross-Platform Adaptation Diff Matrix
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Comparison of channel tailoring, title styling, hashtag density, and tone adaptation.
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="bg-slate-100/80 text-slate-700 font-bold border-b border-slate-200">
                      <th className="py-3 px-4 w-44">Platform Dimension</th>
                      <th className="py-3 px-4 w-1/3">
                        <div className="flex items-center gap-1.5 text-red-600">
                          <Youtube className="w-4 h-4" />
                          <span>YouTube Shorts</span>
                        </div>
                      </th>
                      <th className="py-3 px-4 w-1/3">
                        <div className="flex items-center gap-1.5 text-pink-600">
                          <Instagram className="w-4 h-4" />
                          <span>Instagram Reels</span>
                        </div>
                      </th>
                      <th className="py-3 px-4 w-1/3">
                        <div className="flex items-center gap-1.5 text-blue-600">
                          <Facebook className="w-4 h-4" />
                          <span>Facebook Video</span>
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {/* Row 1: Title / Headline */}
                    <tr>
                      <td className="py-3 px-4 font-bold text-slate-700 bg-slate-50/50 align-top">
                        Title / Headline
                      </td>
                      <td className="py-3 px-4 text-slate-900 font-semibold align-top">
                        {youtubePkg?.title || '—'}
                      </td>
                      <td className="py-3 px-4 text-slate-900 font-semibold align-top">
                        {instagramPkg?.title || '(Uses caption hook)'}
                      </td>
                      <td className="py-3 px-4 text-slate-900 font-semibold align-top">
                        {facebookPkg?.title || '—'}
                      </td>
                    </tr>

                    {/* Row 2: Caption & Description */}
                    <tr>
                      <td className="py-3 px-4 font-bold text-slate-700 bg-slate-50/50 align-top">
                        Caption & Summary
                      </td>
                      <td className="py-3 px-4 text-slate-700 align-top leading-relaxed whitespace-pre-line">
                        {youtubePkg?.caption || '—'}
                      </td>
                      <td className="py-3 px-4 text-slate-700 align-top leading-relaxed whitespace-pre-line">
                        {instagramPkg?.caption || '—'}
                      </td>
                      <td className="py-3 px-4 text-slate-700 align-top leading-relaxed whitespace-pre-line">
                        {facebookPkg?.caption || '—'}
                      </td>
                    </tr>

                    {/* Row 3: Hashtags */}
                    <tr>
                      <td className="py-3 px-4 font-bold text-slate-700 bg-slate-50/50 align-top">
                        Hashtags
                      </td>
                      <td className="py-3 px-4 align-top">
                        <div className="flex flex-wrap gap-1">
                          {youtubePkg?.hashtags?.map((h, i) => (
                            <span key={i} className="px-1.5 py-0.5 rounded bg-red-50 text-red-700 font-mono text-[11px]">
                              {h}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-4 align-top">
                        <div className="flex flex-wrap gap-1">
                          {instagramPkg?.hashtags?.map((h, i) => (
                            <span key={i} className="px-1.5 py-0.5 rounded bg-pink-50 text-pink-700 font-mono text-[11px]">
                              {h}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-4 align-top">
                        <div className="flex flex-wrap gap-1">
                          {facebookPkg?.hashtags?.map((h, i) => (
                            <span key={i} className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 font-mono text-[11px]">
                              {h}
                            </span>
                          ))}
                        </div>
                      </td>
                    </tr>

                    {/* Row 4: Call To Action */}
                    <tr>
                      <td className="py-3 px-4 font-bold text-slate-700 bg-slate-50/50 align-top">
                        Call to Action
                      </td>
                      <td className="py-3 px-4 text-slate-800 font-medium align-top">
                        {youtubePkg?.cta || '—'}
                      </td>
                      <td className="py-3 px-4 text-slate-800 font-medium align-top">
                        {instagramPkg?.cta || '—'}
                      </td>
                      <td className="py-3 px-4 text-slate-800 font-medium align-top">
                        {facebookPkg?.cta || '—'}
                      </td>
                    </tr>

                    {/* Row 5: Pinned Comment */}
                    <tr>
                      <td className="py-3 px-4 font-bold text-slate-700 bg-slate-50/50 align-top">
                        Pinned Comment
                      </td>
                      <td className="py-3 px-4 text-slate-700 align-top leading-relaxed whitespace-pre-line">
                        {youtubePkg?.pinnedComment || '—'}
                      </td>
                      <td className="py-3 px-4 text-slate-700 align-top leading-relaxed whitespace-pre-line">
                        {instagramPkg?.pinnedComment || '—'}
                      </td>
                      <td className="py-3 px-4 text-slate-700 align-top leading-relaxed whitespace-pre-line">
                        {facebookPkg?.pinnedComment || '—'}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Workflow Footer Navigation Bar */}
          <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
            <Link
              to={selectedVideo?.id ? `/videos/${encodeURIComponent(selectedVideo.id)}/social-review` : '/social-review'}
              className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Step 12 Social Review</span>
            </Link>

            <div className="flex items-center gap-3">
              <Link to={`/publishing-package?videoId=${encodeURIComponent(currentVideoId)}`}>
                <Button
                  variant="primary"
                  size="sm"
                  className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                >
                  <span>Proceed to Step 14 • Publishing Package</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlatformPackagesPage;
