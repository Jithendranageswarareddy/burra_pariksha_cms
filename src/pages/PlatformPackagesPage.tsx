import React, { useState, useEffect, useMemo } from 'react';
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
  AlertTriangle,
  FolderGit2,
  Smartphone,
} from 'lucide-react';
import { PageHeader } from '../components/layout/PageHeader';
import { Button } from '../components/common/Button';
import { ProductionJourneyBar } from '../components/production/ProductionJourneyBar';
import { useProductionJourney } from '../contexts/ProductionJourneyContext';
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
  const { loadJourneyForVideo } = useProductionJourney();

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
        if (targetVid) {
          loadJourneyForVideo(targetVid.id, targetVid);
        }

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

  const filteredVideos = videos.filter((v) => {
    if (!searchFilter.trim()) return true;
    const q = searchFilter.toLowerCase();
    return (
      v.id.toLowerCase().includes(q) ||
      (v.title || '').toLowerCase().includes(q) ||
      (v.questionId || '').toLowerCase().includes(q)
    );
  });

  // Effective Google Drive folder link
  const effectiveDriveUrl = selectedVideo?.driveFolderUrl || 'https://drive.google.com';
  const effectiveQuestionId = selectedVideo?.questionId || youtubePkg?.questionId || instagramPkg?.questionId || '';
  const effectiveContentMasterId =
    selectedVideo?.contentMasterId ||
    selectedVideo?.contentId ||
    '';

  // Find matching publishing record for the current video
  const matchingPublishing = publishingRecords.find(
    (p) => (currentVideoId && p.videoId === currentVideoId) || (selectedVideo?.id && p.videoId === selectedVideo.id)
  );
  const effectivePublishingId = matchingPublishing?.id || '';

  const analyticsUrl = useMemo(() => {
    const targetCid = effectiveContentMasterId || selectedVideo?.contentMasterId || selectedVideo?.contentId || '';
    const params = new URLSearchParams();
    if (currentVideoId) params.set('videoId', currentVideoId);
    if (effectivePublishingId) params.set('publishingId', effectivePublishingId);
    const queryString = params.toString() ? `?${params.toString()}` : '';

    return targetCid
      ? `/social-analytics/${encodeURIComponent(targetCid)}${queryString}`
      : `/social-analytics${queryString}`;
  }, [effectiveContentMasterId, selectedVideo, currentVideoId, effectivePublishingId]);

  // YouTube calculations
  const ytTitleText = youtubePkg?.title || selectedVideo?.title || 'Telugu Speed Maths Challenge #Shorts #TeluguGK #BurraPariksha';
  const isYtTitleLong = ytTitleText.length > 100;
  const ytDescText = youtubePkg?.caption || `${selectedVideo?.title || ''}\n\n🔥 Solve APPSC & TSPSC Questions in 15 Seconds!\nSubscribe to @BurraPariksha for daily Telugu GK & Speed Tricks.\n\n#BurraPariksha #TeluguGK #Shorts #APPSC #TSPSC`;
  const ytPinnedCommentText = youtubePkg?.pinnedComment || `✅ సరైన సమాధానం: Option ${reviewBundle?.question?.correctAnswer?.toUpperCase() || 'A'}!\n\n⚡ Burra Speed Trick: ${reviewBundle?.question?.explanation || 'పూర్తి వివరణ కోసం మా ఛానెల్ సబ్‌స్క్రైబ్ చేయండి.'}\n\n#BurraPariksha #TeluguGK #SpeedMaths`;

  // Instagram calculations
  const igHookText = reviewBundle?.hook?.text || reviewBundle?.question?.questionText || selectedVideo?.title || '🧠 15 సెకన్లలో సమాధానం చెప్పగలరా?';
  const igCaptionText = instagramPkg?.caption || `🧠 బర్ర పరీక్ష డైలీ ఛాలెంజ్!\n\n${reviewBundle?.question?.questionText || selectedVideo?.title || ''}\n\nమీ సమాధానం కామెంట్ చేయండి (A, B, C, D) 👇\n\n#BurraPariksha #TeluguGK #Reels #APPSC #TSPSC #TeluguQuiz #Education`;
  const igHashtags = instagramPkg?.hashtags && instagramPkg.hashtags.length > 0
    ? instagramPkg.hashtags
    : ['BurraPariksha', 'TeluguGK', 'Reels', 'APPSC', 'TSPSC', 'TeluguEducation', 'DailyQuiz', 'Shorts', 'SpeedMaths', 'TeluguCurrentAffairs', 'Group2', 'Group1', 'SIConstable', 'BrainChallenge', 'TeluguTrending'];

  // Facebook calculations
  const fbCaptionText = facebookPkg?.caption || `🔥 బర్ర పరీక్ష డైలీ ఛాలెంజ్! APPSC / TSPSC పరీక్షలకు ప్రిపేర్ అయ్యే విద్యార్థుల కోసం స్పీడ్ మ్యాథ్స్ షార్ట్‌కట్.\n\n${reviewBundle?.question?.questionText || selectedVideo?.title || ''}\n\nసరైన సమాధానం కామెంట్ చేయండి 👇`;

  return (
    <div className="space-y-6 animate-in fade-in duration-200 max-w-7xl mx-auto pb-16">
      {/* Page Header */}
      <PageHeader
        title="Platform Packages"
        description="Side-by-side multi-platform adaptation studio: Tailored distribution packages for YouTube Shorts, Instagram Reels, and Facebook Video with character limits and one-click copy."
        badge={
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            Social Media Formats
          </span>
        }
      />

      {/* 15-Stage Continuous Production Journey Orchestration Bar */}
      <ProductionJourneyBar activeStage="PLATFORM_SYNC" showDetails />

      {/* Video Selection Hub & Switcher */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider shrink-0 flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-indigo-600" />
            Select Video:
          </label>
          <select
            value={currentVideoId}
            onChange={(e) => handleSelectVideo(e.target.value)}
            className="text-xs font-medium border border-slate-300 rounded-xl px-3 py-2 bg-white text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-hidden w-full md:w-96 cursor-pointer"
          >
            <option value="">-- Choose a video to inspect platform adaptations --</option>
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
            className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-hidden"
          />
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {!currentVideoId ? (
        /* Empty State: Prompt User to Select a Video */
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-4 shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto border border-indigo-100 shadow-2xs">
            <Share2 className="w-7 h-7" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="text-base font-bold text-slate-900">Select a Production Video</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Choose an approved video from your production pipeline to inspect side-by-side platform packages tailored for YouTube Shorts, Instagram Reels, and Facebook Video.
            </p>
          </div>

          <div className="max-w-2xl mx-auto pt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
            {filteredVideos.slice(0, 6).map((vid) => (
              <button
                key={vid.id}
                onClick={() => handleSelectVideo(vid.id)}
                className="p-3.5 rounded-xl border border-slate-200 hover:border-indigo-500 hover:bg-indigo-50/40 text-left transition-all group cursor-pointer"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-mono font-bold text-slate-800 group-hover:text-indigo-700">
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
        <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center space-y-3">
          <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin mx-auto" />
          <p className="text-xs font-medium text-slate-600">
            Generating side-by-side platform adaptation packages for {currentVideoId}...
          </p>
        </div>
      ) : (
        /* Workspace: Side-by-Side Platform Deck */
        <div className="space-y-6">
          {/* Master Asset & Simulator Navigation Bar */}
          <div className="bg-slate-900 text-white rounded-2xl p-4 sm:p-5 border border-slate-800 shadow-md flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-600/30 text-indigo-400 rounded-xl border border-indigo-500/30">
                <ShieldCheck className="w-5 h-5 text-indigo-300" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold text-slate-100 uppercase tracking-wider">
                    Master Assets &amp; Simulator
                  </span>
                  <span className="text-[10px] font-mono bg-slate-800 text-indigo-300 px-2 py-0.5 rounded border border-slate-700 font-semibold">
                    {currentVideoId}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Direct master cut access and interactive safe-zone preview for publishing operators.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              <a
                href={effectiveDriveUrl}
                target="_blank"
                rel="noreferrer"
                className="px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-900 text-xs font-bold rounded-xl flex items-center gap-1.5 transition shadow-sm cursor-pointer"
              >
                <FolderGit2 className="w-3.5 h-3.5 text-indigo-600" />
                <span>Open Final Cut in Google Drive</span>
                <ExternalLink className="w-3 h-3 text-slate-400" />
              </a>

              <Link
                to={`/videos/${encodeURIComponent(currentVideoId)}?tab=social`}
                className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition shadow-sm cursor-pointer"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Open 9:16 Simulator</span>
              </Link>
            </div>
          </div>

          {/* 3-Column Side-by-Side Platform Deck */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
            {/* COLUMN 1: YouTube Shorts Card (Red Accent) */}
            <div className="bg-white rounded-2xl border-2 border-red-200/90 shadow-xs flex flex-col justify-between overflow-hidden">
              <div className="p-5 space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between pb-3 border-b border-red-100">
                  <div className="flex items-center gap-2 text-red-600 font-bold text-sm">
                    <div className="w-7 h-7 rounded-lg bg-red-50 flex items-center justify-center border border-red-200">
                      <Youtube className="w-4 h-4 text-red-600" />
                    </div>
                    <span>YouTube Shorts</span>
                  </div>
                  <span className="text-[10px] font-mono bg-red-50 text-red-700 px-2 py-0.5 rounded-full font-bold border border-red-200">
                    9:16 Vertical
                  </span>
                </div>

                {/* 1. Title with Character Counter */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                      <span>Title</span>
                      {isYtTitleLong && (
                        <span className="text-[10px] text-amber-600 font-semibold flex items-center gap-0.5">
                          <AlertTriangle className="w-3 h-3" /> Exceeds 100
                        </span>
                      )}
                    </label>
                    <span
                      className={`text-[10px] font-mono font-bold ${
                        isYtTitleLong ? 'text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded' : 'text-slate-400'
                      }`}
                    >
                      {ytTitleText.length} / 100 chars
                    </span>
                  </div>

                  <div className="p-3 bg-red-50/40 rounded-xl border border-red-100 font-telugu text-xs font-bold text-slate-900 leading-relaxed">
                    {ytTitleText}
                  </div>

                  <button
                    type="button"
                    onClick={() => copyToClipboard('yt_title', ytTitleText)}
                    className={`w-full py-1.5 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                      copiedKey === 'yt_title'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-white hover:bg-red-50 text-slate-700 hover:text-red-700 border border-slate-200'
                    }`}
                  >
                    {copiedKey === 'yt_title' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey === 'yt_title' ? 'Copied Title!' : 'Copy Title'}</span>
                  </button>
                </div>

                {/* 2. SEO Description & Keywords */}
                <div className="space-y-1.5 pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                      SEO Description (APPSC/TSPSC)
                    </label>
                    <span className="text-[10px] font-mono text-slate-400 font-medium">Keywords Included</span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 font-telugu text-xs text-slate-800 leading-relaxed whitespace-pre-line max-h-36 overflow-y-auto">
                    {ytDescText}
                  </div>

                  <button
                    type="button"
                    onClick={() => copyToClipboard('yt_desc', ytDescText)}
                    className={`w-full py-1.5 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                      copiedKey === 'yt_desc'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-white hover:bg-red-50 text-slate-700 hover:text-red-700 border border-slate-200'
                    }`}
                  >
                    {copiedKey === 'yt_desc' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey === 'yt_desc' ? 'Copied Description!' : 'Copy Description'}</span>
                  </button>
                </div>

                {/* 3. Pinned Solution Comment with Telugu Speed Trick */}
                <div className="space-y-1.5 pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-amber-800 uppercase tracking-wider flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                      Pinned Solution Comment
                    </label>
                    <span className="text-[10px] font-mono text-amber-700 font-bold bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                      Speed Trick
                    </span>
                  </div>

                  <div className="p-3 bg-amber-50/70 rounded-xl border border-amber-200 font-telugu text-xs text-amber-950 leading-relaxed max-h-28 overflow-y-auto">
                    {ytPinnedCommentText}
                  </div>

                  <button
                    type="button"
                    onClick={() => copyToClipboard('yt_pinned', ytPinnedCommentText)}
                    className={`w-full py-1.5 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                      copiedKey === 'yt_pinned'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-white hover:bg-amber-100 text-amber-900 border border-amber-300'
                    }`}
                  >
                    {copiedKey === 'yt_pinned' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey === 'yt_pinned' ? 'Copied Pinned Comment!' : 'Copy Pinned Comment'}</span>
                  </button>
                </div>
              </div>

              <div className="p-3.5 bg-red-50/60 border-t border-red-100 text-[11px] text-red-900 flex items-center justify-between font-mono">
                <span>Upload Target: YouTube Studio</span>
                <span className="font-bold">Max 59s</span>
              </div>
            </div>

            {/* COLUMN 2: Instagram Reels Card (Pink/Purple Gradient Accent) */}
            <div className="bg-white rounded-2xl border-2 border-pink-200/90 shadow-xs flex flex-col justify-between overflow-hidden">
              <div className="p-5 space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between pb-3 border-b border-pink-100">
                  <div className="flex items-center gap-2 text-pink-600 font-bold text-sm">
                    <div className="w-7 h-7 rounded-lg bg-pink-50 flex items-center justify-center border border-pink-200">
                      <Instagram className="w-4 h-4 text-pink-600" />
                    </div>
                    <span>Instagram Reels</span>
                  </div>
                  <span className="text-[10px] font-mono bg-pink-50 text-pink-700 px-2 py-0.5 rounded-full font-bold border border-pink-200">
                    Viral Audio Sync
                  </span>
                </div>

                {/* 1. Visual Hook Statement */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                    Visual Hook Statement
                  </label>
                  <div className="p-3 bg-gradient-to-r from-pink-50/70 to-purple-50/70 rounded-xl border border-pink-200 font-telugu text-xs font-bold text-pink-950 leading-relaxed">
                    {igHookText}
                  </div>
                </div>

                {/* 2. Instagram Caption with CTA */}
                <div className="space-y-1.5 pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                      Reels Caption &amp; Call-to-Action
                    </label>
                    <span className="text-[10px] font-mono text-pink-600 font-bold">Comment A, B, C, D</span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 font-telugu text-xs text-slate-800 leading-relaxed whitespace-pre-line max-h-36 overflow-y-auto">
                    {igCaptionText}
                  </div>
                </div>

                {/* 3. Curated 15-Hashtag Block */}
                <div className="space-y-1.5 pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                      <Hash className="w-3.5 h-3.5 text-pink-600" />
                      Curated 15-Hashtag Block
                    </label>
                    <span className="text-[10px] font-mono text-slate-400 font-bold">
                      {igHashtags.length} Tags
                    </span>
                  </div>

                  <div className="p-2.5 bg-pink-50/30 rounded-xl border border-pink-100 flex flex-wrap gap-1 max-h-24 overflow-y-auto">
                    {igHashtags.map((h, i) => (
                      <span
                        key={i}
                        className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-md bg-white text-pink-700 border border-pink-200"
                      >
                        #{h.replace('#', '')}
                      </span>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => copyToClipboard('ig_caption_full', `${igCaptionText}\n\n${igHashtags.map((h) => `#${h.replace('#', '')}`).join(' ')}`)}
                    className={`w-full py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                      copiedKey === 'ig_caption_full'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white shadow-2xs'
                    }`}
                  >
                    {copiedKey === 'ig_caption_full' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey === 'ig_caption_full' ? 'Copied Full Reels Caption!' : 'Copy Reels Caption & Tags'}</span>
                  </button>
                </div>
              </div>

              <div className="p-3.5 bg-pink-50/60 border-t border-pink-100 text-[11px] text-pink-900 flex items-center justify-between font-mono">
                <span>Upload Target: Meta Creator Studio</span>
                <span className="font-bold">Cover Frame Clean</span>
              </div>
            </div>

            {/* COLUMN 3: Facebook Reels Card (Blue Accent) */}
            <div className="bg-white rounded-2xl border-2 border-blue-200/90 shadow-xs flex flex-col justify-between overflow-hidden">
              <div className="p-5 space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between pb-3 border-b border-blue-100">
                  <div className="flex items-center gap-2 text-blue-600 font-bold text-sm">
                    <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center border border-blue-200">
                      <Facebook className="w-4 h-4 text-blue-600" />
                    </div>
                    <span>Facebook Reels / Video</span>
                  </div>
                  <span className="text-[10px] font-mono bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-bold border border-blue-200">
                    Watch Feed
                  </span>
                </div>

                {/* 1. Punchy Context Caption */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                    Punchy Context Caption
                  </label>
                  <div className="p-3.5 bg-blue-50/40 rounded-xl border border-blue-100 font-telugu text-xs text-slate-900 leading-relaxed whitespace-pre-line min-h-[140px]">
                    {fbCaptionText}
                  </div>
                </div>

                {/* 2. Facebook Page CTA */}
                <div className="space-y-1.5 pt-2 border-t border-slate-100">
                  <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                    Audience Engagement CTA
                  </label>
                  <p className="text-xs font-telugu font-semibold text-blue-950 bg-blue-50 p-2.5 rounded-xl border border-blue-200">
                    {facebookPkg?.cta || 'ఈ వీడియోను మీ స్నేహితులతో షేర్ చేయండి & పేజీని లైక్ చేయండి! 👍'}
                  </p>
                </div>

                {/* 3. One-Click Copy Facebook Post */}
                <div className="pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => copyToClipboard('fb_post', `${fbCaptionText}\n\n#BurraPariksha #TeluguGK #Shorts #APPSC #TSPSC`)}
                    className={`w-full py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                      copiedKey === 'fb_post'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-blue-600 hover:bg-blue-700 text-white shadow-2xs'
                    }`}
                  >
                    {copiedKey === 'fb_post' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey === 'fb_post' ? 'Copied Facebook Post!' : 'Copy Facebook Post'}</span>
                  </button>
                </div>
              </div>

              <div className="p-3.5 bg-blue-50/60 border-t border-blue-100 text-[11px] text-blue-900 flex items-center justify-between font-mono">
                <span>Upload Target: Facebook Page Video</span>
                <span className="font-bold">Public Post</span>
              </div>
            </div>
          </div>

          {/* Workflow Footer Navigation Bar */}
          <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between flex-wrap gap-3">
            <Link
              to={currentVideoId ? `/videos/${encodeURIComponent(currentVideoId)}?tab=publishing` : '/publishing'}
              className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Step 10: Publishing Station</span>
            </Link>

            <div className="flex items-center gap-3">
              <Link to={analyticsUrl}>
                <Button
                  variant="primary"
                  size="sm"
                  className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold cursor-pointer"
                >
                  <span>Proceed to Step 13: Social Analytics →</span>
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
