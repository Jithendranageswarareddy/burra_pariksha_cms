import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  Video as VideoIcon,
  Upload,
  User,
  ArrowRight,
  ArrowLeft,
  Film,
  ExternalLink,
  RotateCcw,
  Play,
  Pause,
  Maximize2,
  Minimize2,
  FlipHorizontal,
  Sliders,
  CheckCircle2,
  Sparkles,
  HelpCircle,
  Clock,
  Layers,
  FileText,
  Radio,
  Check,
  Copy,
} from 'lucide-react';
import { Video, Script, Question, VideoProductionStatus, MediaAsset } from '../types';
import { apiClient } from '../lib/api-client';
import { VideoWorkflowHeader } from '../components/video/VideoWorkflowHeader';
import { ProductionJourneyBar } from '../components/production/ProductionJourneyBar';
import { useProductionJourney } from '../contexts/ProductionJourneyContext';
import { PageHeader } from '../design-system/components/PageHeader';
import { Card } from '../design-system/components/Card';
import { Button } from '../design-system/components/Button';
import { Badge } from '../design-system/components/Badge';
import { Alert } from '../design-system/components/Alert';
import { PageLoading } from '../design-system/components/Loading';
import { EmptyState } from '../design-system/components/EmptyState';

export const VideoRecordPage: React.FC = () => {
  const { videoId: routeVideoId } = useParams<{ videoId?: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { loadJourneyForVideo } = useProductionJourney();

  const videoId = routeVideoId || searchParams.get('videoId') || searchParams.get('id') || '';

  // State
  const [videoList, setVideoList] = useState<Video[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [question, setQuestion] = useState<Question | null>(null);
  const [script, setScript] = useState<Script | null>(null);
  const [copiedProof, setCopiedProof] = useState<boolean>(false);
  const [showMathProof, setShowMathProof] = useState<boolean>(true);

  // Recording & Presenter State
  const [assignedHost, setAssignedHost] = useState<string>('');
  const [recordingTake, setRecordingTake] = useState<number>(1);
  const [hostNotes, setHostNotes] = useState<string>('');
  
  // Teleprompter Engine State
  const [teleprompterMode, setTeleprompterMode] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [scrollSpeed, setScrollSpeed] = useState<number>(3); // 1 to 10
  const [fontSizePx, setFontSizePx] = useState<number>(36); // 28, 36, 48, 64
  const [isMirrored, setIsMirrored] = useState<boolean>(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const scrollAnimationRef = useRef<number | null>(null);

  // Upload / Raw Footage State
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [driveUrlInput, setDriveUrlInput] = useState<string>('');
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<boolean>(false);
  const [rawAssets, setRawAssets] = useState<MediaAsset[]>([]);

  // UI state
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const handleCopyProof = (text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedProof(true);
    setTimeout(() => setCopiedProof(false), 2000);
  };

  const loadVideoList = async () => {
    try {
      setIsLoading(true);
      const videos = await apiClient.getVideos();
      setVideoList(videos);
    } catch (err: any) {
      setError(err?.message || 'Failed to load video list');
    } finally {
      setIsLoading(false);
    }
  };

  const loadVideoAndDetails = async (targetId: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const vid = await apiClient.getVideoById(targetId);
      setSelectedVideo(vid);
      setAssignedHost(vid.assignedHost || '');
      loadJourneyForVideo(targetId, vid);

      if (vid.questionId) {
        try {
          const q = await apiClient.getQuestionById(vid.questionId);
          setQuestion(q);
        } catch (qErr) {
          console.warn('Could not fetch question record:', qErr);
        }
      }

      try {
        const sRes = await apiClient.getScript(targetId);
        if (sRes.script) {
          setScript(sRes.script);
        }
      } catch (sErr) {
        console.warn('Could not fetch script record:', sErr);
      }

      try {
        const hist = await apiClient.getVideoProductionHistory(targetId);
        if (hist.rawAssets) {
          setRawAssets(hist.rawAssets);
        }
      } catch (hErr) {
        console.warn('Could not fetch video production history:', hErr);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load video recording workspace');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (videoId) {
      loadVideoAndDetails(videoId);
    } else {
      loadVideoList();
    }
  }, [videoId]);

  // Spacebar toggle & Escape key listener for teleprompter
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!teleprompterMode) return;
      if (e.code === 'Space') {
        e.preventDefault();
        setIsPlaying((prev) => !prev);
      } else if (e.code === 'Escape') {
        e.preventDefault();
        setTeleprompterMode(false);
        setIsPlaying(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [teleprompterMode]);

  // Teleprompter Auto-Scroll Engine Loop
  useEffect(() => {
    if (teleprompterMode && isPlaying) {
      const scroll = () => {
        if (scrollContainerRef.current) {
          // Scroll speed multiplier
          const step = scrollSpeed * 0.45;
          scrollContainerRef.current.scrollTop += step;
          scrollAnimationRef.current = requestAnimationFrame(scroll);
        }
      };
      scrollAnimationRef.current = requestAnimationFrame(scroll);
    } else {
      if (scrollAnimationRef.current) {
        cancelAnimationFrame(scrollAnimationRef.current);
      }
    }
    return () => {
      if (scrollAnimationRef.current) {
        cancelAnimationFrame(scrollAnimationRef.current);
      }
    };
  }, [teleprompterMode, isPlaying, scrollSpeed]);

  const handleRestartScroll = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  };

  // Update Host Assignment & Video Metadata
  const handleSaveHostAssignment = async () => {
    const targetId = videoId || selectedVideo?.id;
    if (!targetId) return;

    try {
      setIsUpdatingStatus(true);
      setError(null);

      const updated = await apiClient.updateVideoMetadata(targetId, {
        assignedHost,
      });
      setSelectedVideo(updated);
      setSuccessMessage('Host assignment updated successfully in Firestore.');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setError(err?.message || 'Failed to update host assignment.');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Upload Raw Recording to Google Drive
  const handleUploadRawFootage = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetId = videoId || selectedVideo?.id;
    if (!targetId) return;

    if (!uploadFile && !driveUrlInput.trim()) {
      setError('Please select a video file to upload or provide a Google Drive raw footage URL.');
      return;
    }

    try {
      setIsUploading(true);
      setError(null);
      setSuccessMessage(null);
      setUploadProgress(15);

      if (uploadFile) {
        const interval = setInterval(() => {
          setUploadProgress((p) => (p < 85 ? p + 15 : p));
        }, 300);

        const updatedVideo = await apiClient.uploadVideoFile(targetId, uploadFile);
        clearInterval(interval);
        setUploadProgress(100);
        setSelectedVideo(updatedVideo);
        if (updatedVideo.rawAssets && updatedVideo.rawAssets.length > 0) {
          setRawAssets(updatedVideo.rawAssets);
        } else {
          try {
            const hist = await apiClient.getVideoProductionHistory(targetId);
            if (hist.rawAssets) setRawAssets(hist.rawAssets);
          } catch {}
        }
        setUploadFile(null);
      } else if (driveUrlInput.trim()) {
        const updated = await apiClient.updateVideoMetadata(targetId, {
          notes: `${selectedVideo?.notes || ''}\nRaw Footage Drive URL: ${driveUrlInput.trim()}`.trim(),
        });
        const statusUpdated = await apiClient.updateVideoStatus(
          targetId,
          VideoProductionStatus.RECORDED,
          `Raw footage linked via Drive: ${driveUrlInput.trim()}`
        );
        setSelectedVideo(statusUpdated);
        setDriveUrlInput('');
      }

      setSuccessMessage('Raw footage registered successfully! Video status advanced to RECORDED.');
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      setError(err?.message || 'Failed to upload raw video file.');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  // Manual Status Transition
  const handleUpdateStatus = async (newStatus: VideoProductionStatus) => {
    const targetId = videoId || selectedVideo?.id;
    if (!targetId) return;

    try {
      setIsUpdatingStatus(true);
      setError(null);

      const updated = await apiClient.updateVideoStatus(
        targetId,
        newStatus,
        `Step advanced from Step 04 Recording Studio: ${hostNotes || 'Recording completed'}`
      );
      setSelectedVideo(updated);
      setSuccessMessage(`Production status transitioned to ${newStatus}.`);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setError(err?.message || 'Failed to transition video status.');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // High-Performance Full-Screen Teleprompter Modal
  if (teleprompterMode && script) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-950 text-white flex flex-col justify-between overflow-hidden select-none font-sans">
        {/* Teleprompter Top Header Bar */}
        <div className="flex items-center justify-between px-6 py-3.5 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-red-600 animate-pulse" />
            <div>
              <span className="font-mono text-xs font-bold tracking-widest text-red-500 uppercase">
                STUDIO TELEPROMPTER • {selectedVideo?.id || 'PROD'}
              </span>
              <span className="text-[11px] text-slate-400 block font-mono">
                Host: {selectedVideo?.assignedHost || 'Presenter'}
              </span>
            </div>
          </div>

          {/* Teleprompter Controls Deck */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* Play / Pause Toggle */}
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
                isPlaying
                  ? 'bg-amber-600 hover:bg-amber-700 text-white'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
              }`}
              title="Spacebar to toggle"
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span>{isPlaying ? 'PAUSE (Space)' : 'AUTO-SCROLL (Space)'}</span>
            </button>

            {/* Restart Scroll */}
            <button
              onClick={handleRestartScroll}
              className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 text-xs flex items-center gap-1"
              title="Restart from top"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {/* Speed Slider */}
            <div className="flex items-center gap-2 bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700 text-xs">
              <span className="text-slate-400 font-mono text-[10px]">SPEED: {scrollSpeed}x</span>
              <input
                type="range"
                min="1"
                max="10"
                value={scrollSpeed}
                onChange={(e) => setScrollSpeed(Number(e.target.value))}
                className="w-20 accent-red-500 cursor-pointer"
              />
            </div>

            {/* Font Scaler Controls */}
            <div className="flex items-center gap-1 bg-slate-800/80 px-1.5 py-1 rounded-lg border border-slate-700 text-xs">
              <span className="text-slate-400 font-mono text-[10px] px-1">SIZE:</span>
              {[
                { label: 'S (28px)', px: 28 },
                { label: 'M (36px)', px: 36 },
                { label: 'L (48px)', px: 48 },
                { label: 'XL (64px)', px: 64 },
              ].map((item) => (
                <button
                  key={item.px}
                  onClick={() => setFontSizePx(item.px)}
                  className={`px-2 py-0.5 rounded text-[11px] font-mono transition ${
                    fontSizePx === item.px
                      ? 'bg-red-600 text-white font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {/* Mirror Flip Toggle */}
            <button
              onClick={() => setIsMirrored(!isMirrored)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-mono flex items-center gap-1.5 border transition ${
                isMirrored
                  ? 'bg-indigo-600 border-indigo-400 text-white'
                  : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
              }`}
              title="Mirror horizontal flip for glass teleprompters"
            >
              <FlipHorizontal className="w-3.5 h-3.5" />
              <span>{isMirrored ? 'MIRRORED' : 'MIRROR'}</span>
            </button>

            {/* Exit Fullscreen */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setTeleprompterMode(false);
                setIsPlaying(false);
              }}
              className="text-xs bg-slate-800 text-white border-slate-700 hover:bg-slate-700"
            >
              <Minimize2 className="w-3.5 h-3.5 mr-1" /> Exit (ESC)
            </Button>
          </div>
        </div>

        {/* Teleprompter Scrolling Content View */}
        <div
          ref={scrollContainerRef}
          className={`flex-1 overflow-y-auto px-8 md:px-20 py-16 max-w-5xl mx-auto w-full space-y-16 transition-transform ${
            isMirrored ? 'scale-x-[-1]' : ''
          }`}
          style={{
            scrollBehavior: isPlaying ? 'auto' : 'smooth',
          }}
        >
          {/* Section 1: Hook */}
          <div className="space-y-3 border-l-4 border-red-500 pl-6 bg-red-950/20 p-6 rounded-r-2xl">
            <div className="flex items-center gap-2 font-mono text-xs text-red-400 font-bold uppercase tracking-widest">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
              01 • HOOK (00:00 – 00:05) • MAX ENERGY
            </div>
            <p
              className="font-telugu leading-loose font-medium text-amber-300"
              style={{ fontSize: `${fontSizePx}px` }}
            >
              {script.hookText}
            </p>
          </div>

          {/* Section 2: Problem Statement */}
          <div className="space-y-3 border-l-4 border-indigo-500 pl-6 bg-indigo-950/20 p-6 rounded-r-2xl">
            <div className="font-mono text-xs text-indigo-400 font-bold uppercase tracking-widest">
              02 • PROBLEM STATEMENT & OPTIONS (00:05 – 00:15) • CLEAR ENUNCIATION
            </div>
            <p
              className="font-telugu leading-loose font-medium text-slate-100"
              style={{ fontSize: `${fontSizePx}px` }}
            >
              {script.problemStatement}
            </p>
          </div>

          {/* Section 3: Step-by-Step Solution */}
          <div className="space-y-3 border-l-4 border-emerald-500 pl-6 bg-emerald-950/20 p-6 rounded-r-2xl">
            <div className="font-mono text-xs text-emerald-400 font-bold uppercase tracking-widest">
              03 • STEP-BY-STEP SOLUTION (00:15 – 00:35) • EXPLANATORY PACE
            </div>
            <p
              className="font-telugu leading-loose font-medium text-slate-100"
              style={{ fontSize: `${fontSizePx}px` }}
            >
              {script.stepByStepSolution}
            </p>
          </div>

          {/* Section 4: Burra Speed Shortcut */}
          <div className="space-y-3 border-l-4 border-amber-500 pl-6 bg-amber-950/25 p-6 rounded-r-2xl">
            <div className="flex items-center gap-2 font-mono text-xs text-amber-400 font-bold uppercase tracking-widest">
              <Sparkles className="w-4 h-4 text-amber-400" />
              04 • BURRA SPEED TRICK (00:35 – 00:45) • EXAM SHORTCUT
            </div>
            <p
              className="font-telugu leading-loose font-bold text-yellow-300"
              style={{ fontSize: `${fontSizePx}px` }}
            >
              {script.speedTrickOrTakeaway}
            </p>
          </div>

          {/* Section 5: Call to Action */}
          <div className="space-y-3 border-l-4 border-purple-500 pl-6 bg-purple-950/20 p-6 rounded-r-2xl">
            <div className="font-mono text-xs text-purple-400 font-bold uppercase tracking-widest">
              05 • OUTRO & SUBSCRIBE CTA (00:45 – 00:50) • FOLLOW PROMPT
            </div>
            <p
              className="font-telugu leading-loose font-medium text-purple-200"
              style={{ fontSize: `${fontSizePx}px` }}
            >
              {script.callToAction}
            </p>
          </div>

          {/* End of Script Padding */}
          <div className="py-20 text-center text-slate-600 font-mono text-sm border-t border-slate-800">
            --- END OF SCRIPT • BURRA PARIKSHA SHORTS ---
          </div>
        </div>

        {/* Teleprompter Footer Status Bar */}
        <div className="px-6 py-2.5 bg-slate-900 border-t border-slate-800 text-center text-xs text-slate-400 font-mono shrink-0 flex items-center justify-between">
          <span>Status: {isPlaying ? '🟢 Auto-scrolling' : '⏸ Paused'}</span>
          <span>Press <strong>Spacebar</strong> to Play/Pause • <strong>ESC</strong> to Exit Studio View</span>
          <span>Mirror: {isMirrored ? 'Active (Glass Mode)' : 'Normal'}</span>
        </div>
      </div>
    );
  }

  // If no video is specified, show candidate list
  if (!videoId && !selectedVideo) {
    const filteredVideos = videoList.filter(
      (v) =>
        v.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.questionId?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
      <div className="space-y-6 max-w-6xl mx-auto pb-16">
        <PageHeader
          title="Teleprompter & Recording Studio"
          description="Step 04: Teleprompter studio view, host assignment, raw footage capture, and Drive intake"
        />

        {error && (
          <Alert variant="error" title="Error Loading Videos" onDismiss={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Card padding="md">
          <div className="p-4 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900">Select Video for Studio Recording</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Choose an approved script (SCRIPT_READY or IN_PROGRESS) to film in studio
            </p>
          </div>
          <div className="p-4 space-y-4">
            <input
              type="text"
              placeholder="Search by Video ID, Question ID, or Title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs px-3.5 py-2.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500"
            />

            {isLoading ? (
              <PageLoading message="Loading production records..." />
            ) : filteredVideos.length === 0 ? (
              <EmptyState
                title="No Videos Found"
                description="No video production items matched your search query."
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredVideos.map((vid) => (
                  <div
                    key={vid.id}
                    onClick={() => navigate(`/videos/${encodeURIComponent(vid.id)}/record`)}
                    className="p-4 rounded-xl border border-slate-200 hover:border-indigo-400 bg-white hover:bg-indigo-50/30 transition-all cursor-pointer space-y-2.5 shadow-2xs group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                        {vid.id}
                      </span>
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                        {vid.status}
                      </span>
                    </div>
                    <h4 className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 line-clamp-2">
                      {vid.title}
                    </h4>
                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100">
                      <span>Host: {vid.assignedHost || 'Unassigned'}</span>
                      <span className="text-indigo-600 font-semibold flex items-center gap-1">
                        Open Studio <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      <ProductionJourneyBar
        onNavigateTab={(tab) => {
          const targetId = videoId || selectedVideo?.id;
          if (targetId) {
            navigate(`/videos/${encodeURIComponent(targetId)}?tab=${tab}`);
          }
        }}
      />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs text-indigo-600 font-mono font-semibold bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
              {selectedVideo?.id || videoId}
            </span>
            <span className="text-xs font-semibold px-2 py-0.5 bg-red-100 text-red-800 rounded">
              Step 04 • Teleprompter &amp; Filming
            </span>
          </div>
          <h1 className="text-xl font-bold text-slate-900">Teleprompter &amp; Recording Studio</h1>
          <p className="text-xs text-slate-500">
            Film on-camera presenter delivery with high-readability Telugu teleprompter, manage takes, and upload raw footage.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/videos/${encodeURIComponent(videoId || selectedVideo?.id || '')}?tab=script`)}
            icon={ArrowLeft}
            className="text-xs"
          >
            Back to Scripting
          </Button>
          <Link to="/production">
            <Button variant="outline" size="sm" icon={Film} className="text-xs">
              Production Tracker
            </Button>
          </Link>
        </div>
      </div>

      {error && (
        <Alert variant="error" title="Recording Workspace Notice" onDismiss={() => setError(null)}>
          {error}
        </Alert>
      )}

      {successMessage && (
        <Alert variant="success" title="Success" onDismiss={() => setSuccessMessage(null)}>
          {successMessage}
        </Alert>
      )}

      {isLoading ? (
        <PageLoading message="Loading studio recording workspace..." />
      ) : (
        <div className="space-y-6">
          {/* Top Host & Teleprompter Quick Launch Banner */}
          <div className="bg-slate-900 text-white rounded-xl p-6 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-6 border border-slate-800">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                <span className="text-xs font-mono text-red-400 font-bold tracking-widest uppercase">
                  RECORDING STUDIO DECK
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  • STATUS: {selectedVideo?.status}
                </span>
              </div>
              <h2 className="text-lg font-bold text-white">
                {selectedVideo?.title || 'Telugu Educational Short'}
              </h2>
              <p className="text-xs text-slate-400">
                Presenter: <strong>{selectedVideo?.assignedHost || assignedHost || 'Unassigned'}</strong> • Take: <strong>#{recordingTake}</strong>
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="primary"
                size="lg"
                onClick={() => setTeleprompterMode(true)}
                icon={Maximize2}
                className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-lg"
              >
                Launch Studio Teleprompter
              </Button>
            </div>
          </div>

          {/* Main Studio Deck Dual-Column Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column: Question Reference & Speed Trick Proof */}
            <div className="space-y-6">
              {/* Question Reference & Math Proof Reference Card */}
              <Card padding="md">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <HelpCircle className="w-4 h-4 text-indigo-600" />
                    <h3 className="text-sm font-bold text-slate-900">Question Reference &amp; Math Proof</h3>
                  </div>
                  {question && (
                    <Badge variant="active" size="sm" className="font-mono">
                      {question.id}
                    </Badge>
                  )}
                </div>

                <div className="p-4 space-y-4">
                  {question ? (
                    <div className="space-y-4">
                      <div>
                        <span className="text-[10px] font-mono font-bold text-slate-500 uppercase block mb-1">
                          Problem Statement (Spoken Telugu Cue)
                        </span>
                        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-telugu text-sm leading-relaxed font-medium">
                          {(question as any).statementTe || (question as any).statement || question.questionText}
                        </div>
                      </div>

                      {/* ABCD Options Grid */}
                      <div>
                        <span className="text-[10px] font-mono font-bold text-slate-500 uppercase block mb-2">
                          Options &amp; Correct Answer
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {(['A', 'B', 'C', 'D'] as const).map((opt) => {
                            const optText =
                              (question.options as any)?.[opt.toLowerCase()] ||
                              (question as any)[`option${opt}Te`] ||
                              (question as any)[`option${opt}`] ||
                              '';
                            const correctAns = String((question as any).correctOption || question.correctAnswer || '').toUpperCase();
                            const isCorrect = correctAns === opt;
                            return (
                              <div
                                key={opt}
                                className={`p-3 rounded-lg border text-xs font-telugu transition ${
                                  isCorrect
                                    ? 'bg-emerald-50 border-emerald-400 text-emerald-950 font-semibold ring-1 ring-emerald-200 shadow-2xs'
                                    : 'bg-white border-slate-200 text-slate-800'
                                }`}
                              >
                                <div className="flex items-center justify-between mb-1">
                                  <span className="font-mono font-bold text-[11px] uppercase">
                                    Option {opt}
                                  </span>
                                  {isCorrect && (
                                    <span className="text-[10px] font-sans font-bold bg-emerald-600 text-white px-1.5 py-0.2 rounded">
                                      ✓ CORRECT
                                    </span>
                                  )}
                                </div>
                                <div className="leading-relaxed">{optText || 'N/A'}</div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Authoritative Math Proof Drawer */}
                      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden text-white shadow-xs">
                        <div className="p-3 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
                          <div className="flex items-center gap-2 text-xs font-bold text-indigo-300">
                            <Layers className="w-3.5 h-3.5 text-indigo-400" />
                            <span>Reviewer Math Proof &amp; Steps</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleCopyProof((question as any).explanationTe || question.explanation || '')}
                              className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 font-mono transition px-2 py-0.5 rounded hover:bg-slate-800"
                              title="Copy Math Proof to Clipboard"
                            >
                              {copiedProof ? (
                                <>
                                  <Check className="w-3 h-3 text-emerald-400" />
                                  <span className="text-emerald-400 font-semibold">Copied</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3" />
                                  <span>Copy</span>
                                </>
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => setShowMathProof(!showMathProof)}
                              className="text-[11px] text-slate-400 hover:text-white font-mono px-2 py-0.5 rounded bg-slate-800"
                            >
                              {showMathProof ? 'Hide' : 'Show'}
                            </button>
                          </div>
                        </div>
                        {showMathProof && (
                          <div className="p-3.5 text-xs font-telugu text-slate-200 whitespace-pre-wrap leading-relaxed">
                            {(question as any).explanationTe || question.explanation || 'Step-by-step mathematical proof.'}
                          </div>
                        )}
                      </div>

                      {/* Burra Speed Trick & Math Proof */}
                      <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-xl space-y-1.5">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
                          <Sparkles className="w-4 h-4 text-amber-600" />
                          <span>Burra Speed Shortcut &amp; Exam Takeaway</span>
                        </div>
                        <p className="text-xs text-amber-950 font-telugu leading-relaxed font-semibold">
                          {script?.speedTrickOrTakeaway || (question as any).explanationTe || question.explanation || 'Exam shortcut trick verification.'}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="p-8 text-center text-slate-400 text-xs bg-slate-50 rounded-lg border border-slate-100">
                      No question metadata linked to this video record.
                    </div>
                  )}
                </div>
              </Card>

              {/* Script Delivery Cue Sheet Preview */}
              <Card padding="md">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-slate-600" />
                    <h3 className="text-sm font-bold text-slate-900">5-Part Telugu Narration Cues</h3>
                  </div>
                  {script && (
                    <Badge variant="active" size="sm">
                      v{script.currentVersion} APPROVED
                    </Badge>
                  )}
                </div>

                <div className="p-4 space-y-2.5 text-xs">
                  {script ? (
                    <>
                      <div className="p-2.5 bg-red-50/50 rounded-lg border border-red-100">
                        <span className="text-[10px] font-mono font-bold text-red-700 uppercase block">01 Hook (0–5s)</span>
                        <p className="font-telugu text-slate-900 mt-1 leading-relaxed">{script.hookText}</p>
                      </div>
                      <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                        <span className="text-[10px] font-mono font-bold text-slate-600 uppercase block">02 Problem (5–15s)</span>
                        <p className="font-telugu text-slate-800 mt-1 leading-relaxed">{script.problemStatement}</p>
                      </div>
                      <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                        <span className="text-[10px] font-mono font-bold text-slate-600 uppercase block">03 Solution (15–35s)</span>
                        <p className="font-telugu text-slate-800 mt-1 leading-relaxed">{script.stepByStepSolution}</p>
                      </div>
                      <div className="p-2.5 bg-amber-50/50 rounded-lg border border-amber-200">
                        <span className="text-[10px] font-mono font-bold text-amber-800 uppercase block">04 Shortcut (35–45s)</span>
                        <p className="font-telugu font-bold text-amber-900 mt-1 leading-relaxed">{script.speedTrickOrTakeaway}</p>
                      </div>
                      <div className="p-2.5 bg-purple-50/50 rounded-lg border border-purple-100">
                        <span className="text-[10px] font-mono font-bold text-purple-800 uppercase block">05 Outro & CTA (45–50s)</span>
                        <p className="font-telugu text-purple-900 mt-1 leading-relaxed">{script.callToAction}</p>
                      </div>
                    </>
                  ) : (
                    <div className="p-6 text-center text-slate-400 text-xs">
                      No script approved yet. Please review and approve the script first.
                    </div>
                  )}
                </div>
              </Card>
            </div>

            {/* Right Column: Recording Details & Raw Footage Intake */}
            <div className="space-y-6">
              {/* Recording Details Card */}
              <Card padding="md">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Radio className="w-4 h-4 text-red-600 animate-pulse" />
                    <h3 className="text-sm font-bold text-slate-900">Recording Details</h3>
                  </div>
                  <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded">
                    Raw Video Files: {rawAssets.length}
                  </span>
                </div>

                <div className="p-4 space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Host Name (optional)
                    </label>
                    <input
                      type="text"
                      value={assignedHost}
                      onChange={(e) => setAssignedHost(e.target.value)}
                      placeholder="e.g. Ramesh Kumar"
                      className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Director Remarks & Host Notes
                    </label>
                    <textarea
                      value={hostNotes}
                      onChange={(e) => setHostNotes(e.target.value)}
                      placeholder="e.g. Clean Telugu pronunciation, strong hook"
                      rows={3}
                      className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isUpdatingStatus}
                    onClick={handleSaveHostAssignment}
                    className="w-full text-xs"
                  >
                    {isUpdatingStatus ? 'Saving...' : 'Save Presenter & Remarks'}
                  </Button>
                </div>
              </Card>

              {/* Raw Footage Upload / Google Drive Link */}
              <Card padding="md">
                <div className="p-4 border-b border-slate-100">
                  <h3 className="text-sm font-bold text-slate-900">Raw Footage Intake (Google Drive)</h3>
                  <p className="text-xs text-slate-500">
                    Upload raw camera recording or paste direct Google Drive footage URL
                  </p>
                </div>

                <div className="p-4 space-y-4">
                  <form onSubmit={handleUploadRawFootage} className="space-y-4">
                    {/* Ingested Raw Takes List */}
                    {rawAssets.length > 0 && (
                      <div className="space-y-1.5 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-slate-700">Uploaded Video Files ({rawAssets.length})</span>
                          <span className="font-mono text-[11px] text-slate-500 font-semibold">
                            {rawAssets.length} {rawAssets.length === 1 ? 'file' : 'files'}
                          </span>
                        </div>
                        <div className="space-y-1 max-h-36 overflow-y-auto">
                          {rawAssets.map((asset, idx) => (
                            <div
                              key={asset.id || idx}
                              className="p-2 rounded-lg bg-white border border-slate-200 text-xs font-mono flex items-center justify-between gap-2"
                            >
                              <div className="truncate flex items-center gap-1.5 min-w-0">
                                <Film className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                                <span className="text-slate-800 truncate">{asset.fileName || `raw_video_${idx + 1}.mp4`}</span>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                {asset.fileSize ? (
                                  <span className="text-[10px] text-slate-400">
                                    {(asset.fileSize / (1024 * 1024)).toFixed(1)} MB
                                  </span>
                                ) : null}
                                {asset.driveFileId && (
                                  <a
                                    href={`https://drive.google.com/file/d/${asset.driveFileId}/view`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-indigo-600 hover:text-indigo-800 flex items-center gap-1 text-[11px]"
                                  >
                                    <span>Open Drive</span>
                                    <ExternalLink className="w-3.5 h-3.5" />
                                  </a>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Drag & Drop File Upload */}
                    <div className="border-2 border-dashed border-slate-200 hover:border-indigo-400 rounded-xl p-6 text-center bg-slate-50/50 transition">
                      <Upload className="w-8 h-8 text-indigo-600 mx-auto mb-2" />
                      <label className="cursor-pointer block">
                        <span className="text-xs font-bold text-indigo-600 hover:text-indigo-700">
                          Click to browse raw camera file (.mp4, .mov)
                        </span>
                        <span className="text-[11px] text-slate-500 block mt-0.5">
                          Supports high-bitrate ProRes / MP4
                        </span>
                        <input
                          type="file"
                          accept="video/*"
                          onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                          className="hidden"
                        />
                      </label>

                      {uploadFile && (
                        <div className="mt-3 inline-flex items-center gap-2 bg-indigo-50 border border-indigo-200 px-3 py-1.5 rounded-lg text-xs font-mono text-indigo-800">
                          <span>{uploadFile.name}</span>
                          <span className="text-slate-400">({(uploadFile.size / (1024 * 1024)).toFixed(1)} MB)</span>
                        </div>
                      )}
                    </div>

                    {/* Or Google Drive URL Input */}
                    <div className="relative">
                      <div className="text-[10px] font-mono text-slate-400 uppercase text-center mb-2">
                        — OR LINK DRIVE FILE —
                      </div>
                      <input
                        type="url"
                        value={driveUrlInput}
                        onChange={(e) => setDriveUrlInput(e.target.value)}
                        placeholder="https://drive.google.com/file/d/.../view"
                        className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>

                    {isUploading && (
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-[11px] font-mono text-indigo-700">
                          <span>Uploading to Google Drive...</span>
                          <span>{uploadProgress}%</span>
                        </div>
                        <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-indigo-600 h-full transition-all duration-300"
                            style={{ width: `${uploadProgress}%` }}
                          />
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[11px] text-slate-400">
                        Advances video to <strong>RECORDED</strong>
                      </span>
                      <Button
                        type="submit"
                        variant="primary"
                        size="md"
                        disabled={(!uploadFile && !driveUrlInput.trim()) || isUploading}
                        icon={Upload}
                        className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
                      >
                        {isUploading ? 'Uploading...' : 'Submit Raw Footage'}
                      </Button>
                    </div>
                  </form>
                </div>
              </Card>

              {/* Status Advance & Editor Handoff */}
              <Card padding="md">
                <div className="p-4 border-b border-slate-100">
                  <h3 className="text-sm font-bold text-slate-900">Recording Stage Transition</h3>
                  <p className="text-xs text-slate-500">Advance status or handoff directly to editor</p>
                </div>
                <div className="p-4 space-y-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isUpdatingStatus}
                    onClick={() => handleUpdateStatus(VideoProductionStatus.RECORDED)}
                    className="w-full text-xs justify-between"
                  >
                    <span>Mark as RECORDED</span>
                    <span className="font-mono text-[10px] bg-slate-100 px-1.5 py-0.5 rounded">RECORDED</span>
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isUpdatingStatus}
                    onClick={() => handleUpdateStatus(VideoProductionStatus.EDITING)}
                    className="w-full text-xs justify-between"
                  >
                    <span>Handoff to Video Editor</span>
                    <span className="font-mono text-[10px] bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded">EDITING</span>
                  </Button>
                </div>
              </Card>

              {/* Next Stage Action Box */}
              <div className="bg-white rounded-xl border border-indigo-200 p-5 shadow-xs space-y-3">
                <div className="flex items-center gap-2 text-indigo-700 font-bold text-xs">
                  <Film className="w-4 h-4 text-indigo-600" />
                  <span>Step 06: Video Editing</span>
                </div>
                <p className="text-xs text-slate-600">
                  Raw recording captured? Proceed to Video Editing to sync Telugu motion graphics, countdown timers, and check 50–59s pacing.
                </p>

                {(() => {
                  const hasRawFootage = Boolean(
                    selectedVideo?.driveFileId ||
                    (rawAssets && rawAssets.length > 0) ||
                    selectedVideo?.rawFootagePath ||
                    selectedVideo?.status === VideoProductionStatus.RECORDED ||
                    selectedVideo?.status === VideoProductionStatus.EDITING ||
                    selectedVideo?.status === VideoProductionStatus.FINAL_REVIEW ||
                    selectedVideo?.status === VideoProductionStatus.READY_TO_UPLOAD ||
                    selectedVideo?.status === VideoProductionStatus.UPLOADED
                  );

                  return (
                    <Button
                      variant="primary"
                      size="md"
                      onClick={() => {
                        const targetId = videoId || selectedVideo?.id;
                        navigate(`/videos/${encodeURIComponent(targetId)}?tab=editing`);
                      }}
                      disabled={!hasRawFootage || isUploading}
                      icon={ArrowRight}
                      className={`w-full text-xs justify-center font-bold ${
                        hasRawFootage && !isUploading
                          ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                          : 'bg-slate-200 text-slate-400 border border-slate-300 cursor-not-allowed shadow-none'
                      }`}
                      title={
                        !hasRawFootage
                          ? 'Raw camera footage or Google Drive reference must be attached before proceeding'
                          : 'Proceed to Step 06: Editing Bay'
                      }
                    >
                      {hasRawFootage
                        ? 'Proceed to Step 06: Editing Bay →'
                        : 'Save Footage & Proceed to Step 06: Video Editing'}
                    </Button>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default VideoRecordPage;

