import React, { useState, useEffect, useRef } from 'react';
import {
  Video as VideoIcon,
  Mic,
  Calendar,
  Clock,
  User,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Play,
  Pause,
  RotateCcw,
  Save,
  FileQuestion,
  UploadCloud,
  Maximize2,
  Minimize2,
  X,
  FlipHorizontal,
  Sliders,
  Sparkles,
  ArrowRight,
  Radio,
  ExternalLink,
  Link as LinkIcon,
  Copy,
  Check,
  Film,
  Brain,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Video, Script, VideoProductionStatus, AssignmentTaskType } from '../../types';
import { apiClient } from '../../lib/api-client';
import { Button } from '../common/Button';
import { VideoStatusBadge } from '../common/StatusBadge';
import { PRIORITY_CONFIG } from '../../config/constants';

export interface RecordingWorkspaceProps {
  videoId: string;
  video: Video;
  onStatusChange?: () => void;
  onNavigateTab?: (tab: 'script' | 'recording' | 'editing' | 'final-review' | 'social') => void;
}

export const RecordingWorkspace: React.FC<RecordingWorkspaceProps> = ({
  videoId,
  video,
  onStatusChange,
  onNavigateTab,
}) => {
  const [script, setScript] = useState<Script | null>(null);
  const [isLoadingScript, setIsLoadingScript] = useState<boolean>(true);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Fullscreen Teleprompter Engine State
  const [isFullscreenTeleprompter, setIsFullscreenTeleprompter] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [scrollSpeed, setScrollSpeed] = useState<number>(3); // 1 to 10
  const [fontSizePx, setFontSizePx] = useState<number>(36); // 28, 36, 48, 64
  const [isMirrored, setIsMirrored] = useState<boolean>(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const scrollAnimationRef = useRef<number | null>(null);

  // Multi-Take Manager State
  const [recordingTake, setRecordingTake] = useState<number>(1);
  const [presenterName, setPresenterName] = useState<string>(video.assignedHost || '');
  const [takeNotes, setTakeNotes] = useState<string>(video.notes || '');
  const [isSavingTakeMeta, setIsSavingTakeMeta] = useState<boolean>(false);

  // Raw Footage Ingestion State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [driveUrlInput, setDriveUrlInput] = useState<string>('');
  const [isUploadingFile, setIsUploadingFile] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);

  // Reviewer Math Proof Reference State
  const [questionData, setQuestionData] = useState<any | null>(null);
  const [isMathProofOpen, setIsMathProofOpen] = useState<boolean>(false);

  // Spacebar toggle & Escape key listener for fullscreen teleprompter
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isFullscreenTeleprompter) return;
      if (e.code === 'Space') {
        e.preventDefault();
        setIsPlaying((prev) => !prev);
      } else if (e.code === 'Escape') {
        e.preventDefault();
        setIsFullscreenTeleprompter(false);
        setIsPlaying(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreenTeleprompter]);

  // Teleprompter Auto-Scroll Engine Loop
  useEffect(() => {
    if (isFullscreenTeleprompter && isPlaying) {
      const scroll = () => {
        if (scrollContainerRef.current) {
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
  }, [isFullscreenTeleprompter, isPlaying, scrollSpeed]);

  const handleRestartScroll = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  };

  const fetchScript = async () => {
    try {
      setIsLoadingScript(true);
      const res = await apiClient.getScript(videoId);
      if (res.script) {
        setScript(res.script);
      }
    } catch (err: any) {
      console.warn('Failed to load script for recording workspace:', err);
    } finally {
      setIsLoadingScript(false);
    }
  };

  useEffect(() => {
    fetchScript();
    setPresenterName(video.assignedHost || '');
    setTakeNotes(video.notes || '');

    if (video.questionId) {
      apiClient.getQuestionById(video.questionId).then((q) => setQuestionData(q)).catch(() => {});
    }
  }, [videoId, video]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    } else {
      setSelectedFile(null);
    }
  };

  const handleUploadFile = async () => {
    if (!selectedFile) return;
    setIsUploadingFile(true);
    setError(null);
    setSuccessMessage(null);
    setUploadProgress(15);

    const progressInterval = setInterval(() => {
      setUploadProgress((p) => (p < 85 ? p + 15 : p));
    }, 300);

    try {
      const updatedVideo = await apiClient.uploadVideoFile(videoId, selectedFile, video.contentId);
      clearInterval(progressInterval);
      setUploadProgress(100);

      // Advance status to RECORDED if currently SCRIPT_READY or RECORDING
      if (
        video.status === VideoProductionStatus.SCRIPT_READY ||
        video.status === VideoProductionStatus.RECORDING
      ) {
        await apiClient.updateVideoStatus(
          videoId,
          VideoProductionStatus.RECORDED,
          `Raw video file "${selectedFile.name}" uploaded to Google Drive (Take #${recordingTake})`
        );
      }

      setSuccessMessage(
        `Successfully uploaded "${selectedFile.name}" to Google Drive! File ID: ${updatedVideo.driveFileId}. Status updated to RECORDED.`
      );
      setSelectedFile(null);
      const fileInput = document.getElementById('raw-video-file-input') as HTMLInputElement | null;
      if (fileInput) {
        fileInput.value = '';
      }
      if (onStatusChange) {
        onStatusChange();
      }
    } catch (err: any) {
      clearInterval(progressInterval);
      const rawMsg = err?.message || '';
      if (rawMsg.includes('invalid_grant')) {
        setError(
          'Google Drive connection error. Please ensure your Google Drive refresh token is configured in Secrets or set SKIP_DRIVE_SYNC=true in your environment for local testing.'
        );
      } else {
        setError(rawMsg || 'Failed to upload video asset.');
      }
    } finally {
      setIsUploadingFile(false);
      setUploadProgress(0);
    }
  };

  const handleLinkDriveUrl = async () => {
    if (!driveUrlInput.trim()) return;
    setIsUploadingFile(true);
    setError(null);
    setSuccessMessage(null);
    try {
      await apiClient.updateVideoMetadata(videoId, {
        notes: `${video.notes || ''}\nRaw Footage Drive URL: ${driveUrlInput.trim()}`.trim(),
        driveFolderUrl: driveUrlInput.trim(),
      });
      await apiClient.updateVideoStatus(
        videoId,
        VideoProductionStatus.RECORDED,
        `Raw footage linked via Google Drive: ${driveUrlInput.trim()} (Take #${recordingTake})`
      );
      setSuccessMessage('Raw footage Drive URL linked! Video status updated to RECORDED.');
      setDriveUrlInput('');
      if (onStatusChange) onStatusChange();
    } catch (err: any) {
      setError(err?.message || 'Failed to link Google Drive URL.');
    } finally {
      setIsUploadingFile(false);
    }
  };

  const handleProceedToEditing = async () => {
    setIsUpdating(true);
    setError(null);
    try {
      if (
        video.status === VideoProductionStatus.RECORDED ||
        video.status === VideoProductionStatus.QUEUED ||
        video.status === VideoProductionStatus.SCRIPT_READY ||
        video.status === VideoProductionStatus.RECORDING
      ) {
        await apiClient.updateVideoStatus(
          videoId,
          VideoProductionStatus.EDITING,
          'Raw footage secured, advancing to Editing stage'
        );
        if (onStatusChange) onStatusChange();
      }
      if (onNavigateTab) {
        onNavigateTab('editing');
      } else {
        window.location.href = `/videos/${encodeURIComponent(videoId)}?tab=editing`;
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to advance to Editing stage.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleStatusTransition = async (nextStatus: VideoProductionStatus) => {
    setIsUpdating(true);
    setError(null);
    setSuccessMessage(null);
    try {
      await apiClient.updateVideoStatus(
        videoId,
        nextStatus,
        `Transitioned to ${nextStatus} via Recording Workspace (Take #${recordingTake})`
      );
      setSuccessMessage(`Successfully transitioned recording status to ${nextStatus}.`);
      if (onStatusChange) {
        onStatusChange();
      }
    } catch (err: any) {
      const rawMsg = err?.message || '';
      if (rawMsg.includes('invalid_grant')) {
        setError(
          'Google Drive connection error. Please ensure your Google Drive refresh token is configured in Secrets or set SKIP_DRIVE_SYNC=true in your environment for local testing.'
        );
      } else {
        setError(rawMsg || 'Failed to update video status.');
      }
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSaveTakeMeta = async () => {
    setIsSavingTakeMeta(true);
    setError(null);
    try {
      await apiClient.updateVideoMetadata(videoId, {
        assignedHost: presenterName,
        notes: `[Take #${recordingTake}] ${takeNotes}`.trim(),
      });
      setSuccessMessage(`Saved Take #${recordingTake} director remarks & presenter metadata.`);
      setTimeout(() => setSuccessMessage(null), 3500);
      if (onStatusChange) onStatusChange();
    } catch (err: any) {
      setError(err?.message || 'Failed to save take metadata.');
    } finally {
      setIsSavingTakeMeta(false);
    }
  };

  const recordingAssignments = (video.assignments || []).filter(
    (a) => a.taskType === AssignmentTaskType.RECORDING || a.assignmentRole === 'SPEAKER' || a.assignmentRole === 'EDITOR'
  );

  const isRawFootageRecorded =
    video.status === VideoProductionStatus.RECORDED ||
    video.status === VideoProductionStatus.EDITING ||
    video.status === VideoProductionStatus.EDITED ||
    video.status === VideoProductionStatus.FINAL_REVIEW ||
    video.status === VideoProductionStatus.READY_TO_UPLOAD ||
    video.status === VideoProductionStatus.UPLOADED ||
    Boolean(video.driveFileId);

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* Celebratory Zero-Friction Bridge to Stage 05 (if recorded) */}
      {isRawFootageRecorded && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-xl flex items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
              <Check className="w-3.5 h-3.5" />
            </div>
            <div className="text-xs">
              <span className="font-bold text-emerald-950 uppercase tracking-wider">
                ✓ Raw Footage Ingested &amp; Secured in Drive
              </span>
              {video.driveFileId && (
                <span className="font-mono text-[10px] text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded ml-2 border border-emerald-200">
                  ID: {video.driveFileId}
                </span>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              if (onNavigateTab) {
                onNavigateTab('editing');
              } else {
                window.location.href = `/videos/${encodeURIComponent(videoId)}?tab=editing`;
              }
            }}
            className="text-xs bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-1.5 px-3 rounded-lg shadow-2xs transition-all flex items-center gap-1 cursor-pointer whitespace-nowrap"
          >
            <span>Proceed to Editing Bay →</span>
          </button>
        </div>
      )}

      {successMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            {error.includes('invalid_grant') ? (
              <span>
                Google Drive connection error. Please ensure your Google Drive refresh token is configured in Secrets or set SKIP_DRIVE_SYNC=true in environment.
              </span>
            ) : (
              <span>{error}</span>
            )}
          </div>
        </div>
      )}

      {/* Main Dual-Pane Studio Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT PANE (lg:col-span-7 / Prompter Stage) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          {/* Card Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-600" />
              <h3 className="text-sm font-bold text-slate-900">Approved Teleprompter Narration</h3>
              {script && (
                <span className="font-mono text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-lg font-bold border border-indigo-200">
                  v{script.currentVersion}
                </span>
              )}
            </div>

            {script && (
              <button
                type="button"
                onClick={() => setIsFullscreenTeleprompter(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2 px-3.5 rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Maximize2 className="w-3.5 h-3.5" />
                <span>↗ Launch Fullscreen Prompter (Spacebar to Scroll)</span>
              </button>
            )}
          </div>

          {/* Teleprompter Script Blocks */}
          {isLoadingScript ? (
            <div className="py-12 text-center text-xs text-slate-400 font-mono">Loading approved script...</div>
          ) : script ? (
            <div className="space-y-3">
              {/* Part 1: Hook */}
              <div className="p-3.5 bg-amber-50/60 border border-amber-200/80 rounded-xl space-y-1.5 mb-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-900 uppercase tracking-wider text-[10px] bg-amber-200/70 text-amber-950 px-2 py-0.5 rounded-md flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-600 animate-pulse" />
                    Hook • Max Energy (00:00 – 00:05)
                  </span>
                  <span className="font-mono text-[10px] text-amber-800 font-semibold">~15 words</span>
                </div>
                <p className="font-telugu text-base sm:text-lg font-bold text-slate-900 leading-relaxed p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/80">
                  {script.hookText}
                </p>
              </div>

              {/* Part 2: Question Narration */}
              <div className="p-3.5 bg-indigo-50/50 border border-indigo-200/80 rounded-xl space-y-1.5 mb-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-indigo-900 uppercase tracking-wider text-[10px] bg-indigo-200/70 text-indigo-950 px-2 py-0.5 rounded-md">
                    Question Narration • Clear Enunciation (00:05 – 00:15)
                  </span>
                  <span className="font-mono text-[10px] text-indigo-800 font-semibold">~25 words</span>
                </div>
                <p className="font-telugu text-base sm:text-lg font-bold text-slate-900 leading-relaxed p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/80">
                  {script.problemStatement}
                </p>
              </div>

              {/* Part 3: Spoken Solution / Options Delivery */}
              <div className="p-3.5 bg-slate-100/70 border border-slate-200 rounded-xl space-y-1.5 mb-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 uppercase tracking-wider text-[10px] bg-slate-200 text-slate-900 px-2 py-0.5 rounded-md">
                    Spoken Explanation / Options (00:15 – 00:35)
                  </span>
                  <span className="font-mono text-[10px] text-slate-600 font-semibold">~45–60 words</span>
                </div>
                <p className="font-telugu text-base sm:text-lg font-bold text-slate-900 leading-relaxed p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/80 whitespace-pre-wrap">
                  {script.stepByStepSolution}
                </p>
              </div>

              {/* Part 4: Speed Trick or Comment Challenge */}
              {script.speedTrickOrTakeaway && (
                <div className="p-3.5 bg-amber-50/60 border border-amber-200/80 rounded-xl space-y-1.5 mb-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-900 uppercase tracking-wider text-[10px] bg-amber-200/70 text-amber-950 px-2 py-0.5 rounded-md flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-amber-700" />
                      Burra Speed Trick / Challenge (00:35 – 00:45)
                    </span>
                    <span className="font-mono text-[10px] text-amber-800 font-bold">Exam Secret</span>
                  </div>
                  <p className="font-telugu text-base sm:text-lg font-bold text-slate-900 leading-relaxed p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/80">
                    {script.speedTrickOrTakeaway}
                  </p>
                </div>
              )}

              {/* Part 5: CTA */}
              {script.callToAction && (
                <div className="p-3.5 bg-emerald-50/60 border border-emerald-200/80 rounded-xl space-y-1.5 mb-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-emerald-900 uppercase tracking-wider text-[10px] bg-emerald-200/70 text-emerald-950 px-2 py-0.5 rounded-md">
                      Outro &amp; Follow CTA (00:45 – 00:50)
                    </span>
                    <span className="font-mono text-[10px] text-emerald-800 font-semibold">~15 words</span>
                  </div>
                  <p className="font-telugu text-base sm:text-lg font-bold text-slate-900 leading-relaxed p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/80">
                    {script.callToAction}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200 text-slate-500 text-xs">
              No approved script found for this video yet. Please navigate to the Script Workspace first to generate or approve the Telugu script.
            </div>
          )}
        </div>

        {/* RIGHT PANE (lg:col-span-5 / Sticky Recording Station) */}
        <div className="lg:col-span-5 lg:sticky lg:top-4 space-y-4">
          {/* CARD 1 (PRIMARY ACTION STATION - TOP) */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600">
                  <Radio className="w-4 h-4 animate-pulse text-indigo-600" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900">Stage 04: Filming Station</h3>
                  <p className="text-[10px] text-slate-500">Filming &amp; Raw Ingestion</p>
                </div>
              </div>
              <span className="font-mono text-[10px] font-bold text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded-md">
                TAKE: #{recordingTake}
              </span>
            </div>

            <button
              type="button"
              disabled={isUpdating}
              onClick={handleProceedToEditing}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 w-full text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <span>Save Footage &amp; Proceed to Step 05: Editing Bay →</span>
            </button>

            {/* Quick Status Transition Actions */}
            <div className="flex items-center gap-1.5 pt-1 border-t border-slate-100">
              {video.status === VideoProductionStatus.SCRIPT_READY && (
                <button
                  type="button"
                  disabled={isUpdating}
                  onClick={() => handleStatusTransition(VideoProductionStatus.RECORDING)}
                  className="flex-1 py-1.5 px-2 bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 font-bold text-[11px] rounded-lg transition-colors flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Play className="w-3 h-3 text-red-600" />
                  <span>Start Recording</span>
                </button>
              )}

              {video.status === VideoProductionStatus.RECORDING && (
                <button
                  type="button"
                  disabled={isUpdating || !video.driveFileId}
                  onClick={() => handleStatusTransition(VideoProductionStatus.RECORDED)}
                  className="flex-1 py-1.5 px-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 font-bold text-[11px] rounded-lg transition-colors flex items-center justify-center gap-1 cursor-pointer"
                  title={!video.driveFileId ? 'Upload raw footage first' : ''}
                >
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  <span>Mark as Recorded</span>
                </button>
              )}
            </div>
          </div>

          {/* CARD 2: MULTI-TAKE & RAW FOOTAGE INGESTION */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-1.5">
                <UploadCloud className="w-4 h-4 text-indigo-600" />
                <h3 className="text-xs font-bold text-slate-900">Multi-Take Manager &amp; Raw Footage</h3>
              </div>
              {video.driveFileId && (
                <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-md">
                  Secured
                </span>
              )}
            </div>

            {/* Take Selector */}
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Take Selector
              </label>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((takeNum) => (
                  <button
                    key={takeNum}
                    type="button"
                    onClick={() => setRecordingTake(takeNum)}
                    className={`flex-1 py-1 rounded-lg text-xs font-mono font-bold border transition-colors cursor-pointer ${
                      recordingTake === takeNum
                        ? 'bg-red-600 border-red-700 text-white shadow-xs'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    #{takeNum}
                  </button>
                ))}
              </div>
            </div>

            {/* Presenter & Take Notes Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">
                  Presenter Name
                </label>
                <input
                  type="text"
                  value={presenterName}
                  onChange={(e) => setPresenterName(e.target.value)}
                  placeholder="e.g. Ramesh Kumar"
                  className="w-full text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg focus:outline-hidden focus:border-indigo-500 text-slate-800 bg-slate-50/50"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">
                  Take Notes
                </label>
                <input
                  type="text"
                  value={takeNotes}
                  onChange={(e) => setTakeNotes(e.target.value)}
                  placeholder="e.g. Take 2 best hook energy"
                  className="w-full text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg focus:outline-hidden focus:border-indigo-500 text-slate-800 bg-slate-50/50"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                disabled={isSavingTakeMeta}
                onClick={handleSaveTakeMeta}
                className="text-[11px] font-semibold text-slate-700 hover:text-slate-900 border border-slate-200 hover:bg-slate-50 px-2.5 py-1 rounded-lg transition-colors w-full flex items-center justify-center gap-1 cursor-pointer"
              >
                <Save className="w-3 h-3 text-slate-500" />
                <span>{isSavingTakeMeta ? 'Saving...' : 'Save Presenter & Take Notes'}</span>
              </button>
            </div>

            {/* Raw Footage Ingestion Section */}
            <div className="pt-2 border-t border-slate-100 space-y-2 text-xs">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Raw Footage Ingestion
              </label>

              {video.driveFileId ? (
                <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl space-y-1 text-[11px]">
                  <div className="flex items-center gap-1.5 font-semibold text-emerald-900">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Raw Video Secured in Google Drive</span>
                  </div>
                  <p className="font-mono text-[10px] text-emerald-700 truncate">
                    ID: {video.driveFileId}
                  </p>
                </div>
              ) : null}

              {/* File Upload Button */}
              <div className="space-y-1">
                <input
                  id="raw-video-file-input"
                  type="file"
                  accept="video/*"
                  onChange={handleFileChange}
                  disabled={isUploadingFile}
                  className="w-full text-[11px] text-slate-500 file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-[11px] file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 border border-slate-200 rounded-lg p-1 focus:outline-hidden"
                />
              </div>

              {selectedFile && (
                <Button
                  variant="primary"
                  size="sm"
                  className="w-full text-xs justify-center py-1.5"
                  disabled={isUploadingFile}
                  onClick={handleUploadFile}
                  icon={UploadCloud}
                >
                  {isUploadingFile ? `Uploading (${uploadProgress}%)...` : 'Upload Video File to Drive'}
                </Button>
              )}

              {/* Link Drive URL Input */}
              <div className="flex items-center gap-1.5 pt-1">
                <input
                  type="url"
                  value={driveUrlInput}
                  onChange={(e) => setDriveUrlInput(e.target.value)}
                  placeholder="Paste Drive Share URL..."
                  disabled={isUploadingFile}
                  className="flex-1 text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg focus:outline-hidden focus:border-indigo-500 bg-slate-50/50"
                />
                <button
                  type="button"
                  disabled={!driveUrlInput.trim() || isUploadingFile}
                  onClick={handleLinkDriveUrl}
                  className="px-2.5 py-1.5 text-xs bg-slate-800 hover:bg-slate-900 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 cursor-pointer whitespace-nowrap"
                >
                  Link Drive URL
                </button>
              </div>
            </div>
          </div>

          {/* CARD 3: MATH PROOF REFERENCE */}
          <div className="bg-slate-900 text-slate-100 rounded-2xl p-4 border border-slate-800 shadow-md space-y-2">
            <button
              type="button"
              onClick={() => setIsMathProofOpen(!isMathProofOpen)}
              className="w-full flex items-center justify-between text-xs font-bold text-slate-200 hover:text-white transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Brain className="w-4 h-4 text-purple-400" />
                <span>Reviewer Math Proof &amp; Reference</span>
              </div>
              {isMathProofOpen ? (
                <ChevronUp className="w-4 h-4 text-slate-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              )}
            </button>

            {isMathProofOpen && (
              <div className="pt-2 border-t border-slate-800 text-xs space-y-2.5 animate-in fade-in">
                {questionData ? (
                  <>
                    <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 space-y-1">
                      <span className="text-[10px] font-mono uppercase text-purple-400 font-semibold block">
                        Question Text:
                      </span>
                      <p className="text-slate-200 font-telugu text-xs leading-relaxed">
                        {questionData.questionTelugu || questionData.textEnglish || 'Question record linked.'}
                      </p>
                    </div>

                    {questionData.options && (
                      <div className="grid grid-cols-2 gap-1.5">
                        {questionData.options.map((opt: any, idx: number) => {
                          const isCorrect = idx === questionData.correctOptionIndex || opt.isCorrect;
                          return (
                            <div
                              key={idx}
                              className={`p-2 rounded-lg text-[11px] font-telugu border ${
                                isCorrect
                                  ? 'bg-emerald-950/80 border-emerald-600 text-emerald-200 font-bold'
                                  : 'bg-slate-950 border-slate-800 text-slate-400'
                              }`}
                            >
                              <span className="font-mono text-[10px] mr-1">[{String.fromCharCode(65 + idx)}]</span>
                              {opt.textTelugu || opt.textEnglish || opt}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {(questionData.solutionTelugu || questionData.solutionEnglish) && (
                      <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 space-y-1">
                        <span className="text-[10px] font-mono uppercase text-amber-400 font-semibold block">
                          Mathematical Proof &amp; Solution:
                        </span>
                        <p className="text-slate-300 font-telugu text-xs leading-relaxed whitespace-pre-wrap">
                          {questionData.solutionTelugu || questionData.solutionEnglish}
                        </p>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-[11px] text-slate-400 italic">
                    Loading linked question reference and solution proof for {video.questionId || 'this video'}...
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Upgraded Studio Teleprompter Fullscreen Modal */}
      {isFullscreenTeleprompter && script && (
        <div className="fixed inset-0 z-50 bg-slate-950 text-white flex flex-col justify-between overflow-hidden select-none font-sans">
          {/* Teleprompter Top Header Bar */}
          <div className="flex items-center justify-between px-6 py-3.5 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 shrink-0">
            <div className="flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-red-600 animate-pulse" />
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold tracking-widest text-red-500 uppercase">
                    STUDIO TELEPROMPTER • {video.id}
                  </span>
                  <span className="font-mono text-[10px] px-2 py-0.2 rounded bg-red-950 text-red-300 border border-red-800 font-bold">
                    TAKE #{recordingTake}
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 block font-mono">
                  Presenter: {video.assignedHost || presenterName || 'Host'} • Version v{script.currentVersion}
                </span>
              </div>
            </div>

            {/* Teleprompter Controls Deck */}
            <div className="flex items-center gap-3 flex-wrap">
              {/* Play / Pause Toggle */}
              <button
                type="button"
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
                type="button"
                onClick={handleRestartScroll}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 text-xs flex items-center gap-1"
                title="Restart scroll from top"
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
                    type="button"
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
                type="button"
                onClick={() => setIsMirrored(!isMirrored)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-mono flex items-center gap-1.5 border transition ${
                  isMirrored
                    ? 'bg-indigo-600 border-indigo-400 text-white'
                    : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
                }`}
                title="Horizontal mirror flip for teleprompter glass reflection"
              >
                <FlipHorizontal className="w-3.5 h-3.5" />
                <span>{isMirrored ? 'MIRRORED' : 'MIRROR'}</span>
              </button>

              {/* Exit Fullscreen */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsFullscreenTeleprompter(false);
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
            {/* Part 1: Hook */}
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

            {/* Part 2: Problem Statement */}
            <div className="space-y-3 border-l-4 border-indigo-500 pl-6 bg-indigo-950/20 p-6 rounded-r-2xl">
              <div className="font-mono text-xs text-indigo-400 font-bold uppercase tracking-widest">
                02 • PROBLEM STATEMENT &amp; OPTIONS (00:05 – 00:15) • CLEAR ENUNCIATION
              </div>
              <p
                className="font-telugu leading-loose font-medium text-slate-100"
                style={{ fontSize: `${fontSizePx}px` }}
              >
                {script.problemStatement}
              </p>
            </div>

            {/* Part 3: Spoken Solution & Intuition */}
            <div className="space-y-3 border-l-4 border-emerald-500 pl-6 bg-emerald-950/20 p-6 rounded-r-2xl">
              <div className="font-mono text-xs text-emerald-400 font-bold uppercase tracking-widest">
                03 • SPOKEN SOLUTION &amp; INTUITION (00:15 – 00:35) • EXPLANATORY PACE
              </div>
              <p
                className="font-telugu leading-loose font-medium text-slate-100 whitespace-pre-wrap"
                style={{ fontSize: `${fontSizePx}px` }}
              >
                {script.stepByStepSolution}
              </p>
            </div>

            {/* Part 4: Burra Speed Shortcut */}
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

            {/* Part 5: Call to Action */}
            <div className="space-y-3 border-l-4 border-purple-500 pl-6 bg-purple-950/20 p-6 rounded-r-2xl">
              <div className="font-mono text-xs text-purple-400 font-bold uppercase tracking-widest">
                05 • OUTRO &amp; SUBSCRIBE CTA (00:45 – 00:50) • FOLLOW PROMPT
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
      )}
    </div>
  );
};
