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
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Action Bar & Notification Banners */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-red-50 border border-red-200 flex items-center justify-center text-red-600">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900">Stage 04: Teleprompter &amp; Raw Video Intake</h3>
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                TAKE #{recordingTake}
              </span>
            </div>
            <p className="text-xs text-slate-500">Film on-camera presenter delivery, track takes, and upload raw footage to Drive</p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {script && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsFullscreenTeleprompter(true)}
              icon={Maximize2}
              className="text-xs bg-slate-900 text-white hover:bg-slate-800 border-slate-700 font-semibold"
            >
              Launch Teleprompter
            </Button>
          )}

          {video.status === VideoProductionStatus.SCRIPT_READY && (
            <Button
              variant="primary"
              size="sm"
              disabled={isUpdating}
              onClick={() => handleStatusTransition(VideoProductionStatus.RECORDING)}
              className="text-xs bg-red-600 hover:bg-red-700 text-white font-bold"
              icon={Play}
            >
              Start Recording
            </Button>
          )}

          {video.status === VideoProductionStatus.RECORDING && (
            <Button
              variant="primary"
              size="sm"
              disabled={isUpdating || !video.driveFileId}
              onClick={() => handleStatusTransition(VideoProductionStatus.RECORDED)}
              className="text-xs"
              icon={CheckCircle2}
              title={!video.driveFileId ? 'A raw video file must be uploaded before marking as Recorded' : ''}
            >
              Mark as Recorded
            </Button>
          )}

          {isRawFootageRecorded && onNavigateTab && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => onNavigateTab('editing')}
              icon={ArrowRight}
              className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
            >
              Go to Editing Bay →
            </Button>
          )}
        </div>
      </div>

      {/* Celebratory Zero-Friction Bridge to Stage 05 */}
      {isRawFootageRecorded && (
        <div className="p-4 bg-emerald-50 border-2 border-emerald-300 text-emerald-900 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
              <Check className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 font-bold text-xs text-emerald-950 uppercase tracking-wide">
                <span>✓ Raw Footage Recorded &amp; Secured in Drive</span>
                {video.driveFileId && (
                  <span className="font-mono text-[10px] text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-200">
                    File ID: {video.driveFileId}
                  </span>
                )}
              </div>
              <p className="text-xs text-emerald-800 mt-0.5">
                On-camera capture complete. Ready for Telugu motion graphics, countdown timers, and pacing verification in Stage 05.
              </p>
            </div>
          </div>

          {onNavigateTab && (
            <Button
              variant="primary"
              size="md"
              onClick={() => onNavigateTab('editing')}
              icon={ArrowRight}
              className="text-xs bg-emerald-700 hover:bg-emerald-800 text-white font-bold whitespace-nowrap py-2.5 px-4 shadow-xs"
            >
              Proceed to Stage 05: Video Editing Bay →
            </Button>
          )}
        </div>
      )}

      {successMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {error && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-lg flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            {error.includes('invalid_grant') ? (
              <span>
                Google Drive connection error. Please ensure your Google Drive refresh token is configured in Secrets or set SKIP_DRIVE_SYNC=true in your environment for local testing.
              </span>
            ) : (
              <span>{error}</span>
            )}
          </div>
        </div>
      )}

      {/* Main Content Grid: Approved Script Teleprompter & Multi-Take Intake */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Approved Script Teleprompter View */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-600" />
              <h3 className="text-sm font-bold text-slate-900">Approved Teleprompter Narration</h3>
              {script && (
                <span className="font-mono text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded font-semibold border border-indigo-200">
                  v{script.currentVersion}
                </span>
              )}
            </div>
            {script && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsFullscreenTeleprompter(true)}
                  icon={Maximize2}
                  className="text-xs text-red-700 border-red-200 hover:bg-red-50 font-bold"
                >
                  Launch Fullscreen Studio Prompter
                </Button>
              </div>
            )}
          </div>

          {isLoadingScript ? (
            <div className="py-12 text-center text-xs text-slate-400 font-mono">Loading approved script...</div>
          ) : script ? (
            <div className="space-y-3.5 text-xs">
              {/* Part 1: Hook */}
              <div className="p-3.5 bg-red-50/50 border border-red-200 rounded-lg space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-red-900 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
                    01 • Hook (00:00 – 00:05) • Max Energy
                  </span>
                  <span className="font-mono text-[10px] text-red-700">~15 words</span>
                </div>
                <p className="text-slate-900 font-telugu leading-relaxed font-semibold text-sm">
                  {script.hookText}
                </p>
              </div>

              {/* Part 2: Problem Statement */}
              <div className="p-3.5 bg-indigo-50/40 border border-indigo-100 rounded-lg space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-indigo-900 uppercase tracking-wider text-[10px]">
                    02 • Problem Statement &amp; Options (00:05 – 00:15) • Clear Enunciation
                  </span>
                  <span className="font-mono text-[10px] text-indigo-700">~25 words</span>
                </div>
                <p className="text-slate-800 font-telugu leading-relaxed text-xs">
                  {script.problemStatement}
                </p>
              </div>

              {/* Part 3: Spoken Solution & Intuition */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">
                    03 • Spoken Solution &amp; Intuition (00:15 – 00:35) • Explanatory Pace
                  </span>
                  <span className="font-mono text-[10px] text-slate-500">~45–60 words</span>
                </div>
                <p className="text-slate-800 font-telugu leading-relaxed whitespace-pre-wrap text-xs">
                  {script.stepByStepSolution}
                </p>
              </div>

              {/* Part 4: Speed Trick */}
              <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-lg space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-900 uppercase tracking-wider text-[10px] flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    04 • Burra Speed Shortcut (00:35 – 00:45) • High-Retention Exam Trick
                  </span>
                  <span className="font-mono text-[10px] text-amber-800 font-bold">Exam Secret</span>
                </div>
                <p className="text-amber-950 font-telugu leading-relaxed font-bold text-xs">
                  {script.speedTrickOrTakeaway}
                </p>
              </div>

              {/* Part 5: Call to Action */}
              <div className="p-3.5 bg-purple-50/60 border border-purple-200 rounded-lg space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-purple-900 uppercase tracking-wider text-[10px]">
                    05 • Call to Action &amp; Outro (00:45 – 00:50) • Follow Prompt
                  </span>
                  <span className="font-mono text-[10px] text-purple-700">~15 words</span>
                </div>
                <p className="text-purple-950 font-telugu leading-relaxed text-xs">
                  {script.callToAction}
                </p>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center bg-slate-50 rounded-lg border border-slate-200 text-slate-500 text-xs">
              No approved script found for this video yet. Please navigate to the Script Workspace first to generate or approve the Telugu script.
            </div>
          )}
        </div>

        {/* Right Col: Multi-Take Manager & Raw Footage Intake */}
        <div className="space-y-6">
          {/* Multi-Take Manager Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-red-600 animate-pulse" />
                <h3 className="text-sm font-bold text-slate-900">Multi-Take Manager</h3>
              </div>
              <span className="font-mono text-xs font-bold text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded">
                TAKE #{recordingTake}
              </span>
            </div>

            <div className="space-y-3 text-xs">
              {/* Take Selector Buttons */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Take Selector
                </label>
                <div className="flex items-center gap-1.5">
                  {[1, 2, 3, 4, 5].map((takeNum) => (
                    <button
                      key={takeNum}
                      type="button"
                      onClick={() => setRecordingTake(takeNum)}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-mono font-bold border transition ${
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

              {/* On-Camera Presenter Input */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  On-Camera Presenter
                </label>
                <input
                  type="text"
                  value={presenterName}
                  onChange={(e) => setPresenterName(e.target.value)}
                  placeholder="e.g. Ramesh Kumar / Presenter 1"
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 text-slate-800"
                />
              </div>

              {/* Director & Presenter Take Remarks */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Director Remarks &amp; Take Notes
                </label>
                <textarea
                  rows={3}
                  value={takeNotes}
                  onChange={(e) => setTakeNotes(e.target.value)}
                  placeholder="e.g. Take 2 has best energy on the hook; clear Telugu pronunciation on Option B"
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 text-slate-800"
                />
              </div>

              <div className="flex justify-end pt-1">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isSavingTakeMeta}
                  onClick={handleSaveTakeMeta}
                  className="text-xs w-full justify-center"
                  icon={Save}
                >
                  {isSavingTakeMeta ? 'Saving in Sheets...' : 'Save Presenter & Take Remarks'}
                </Button>
              </div>
            </div>
          </div>

          {/* Raw Footage Intake Card (Google Drive Direct Upload & URL Link) */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <UploadCloud className="w-4 h-4 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900">Raw Footage Intake</h3>
              </div>
              {video.driveFileId && (
                <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
                  Drive Ingested
                </span>
              )}
            </div>

            <div className="space-y-3 text-xs">
              {video.driveFileId ? (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg space-y-1">
                  <div className="flex items-center gap-1.5 font-semibold text-emerald-900">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Raw Video Secured in Google Drive</span>
                  </div>
                  <div className="font-mono text-[10px] text-emerald-700 break-all space-y-0.5">
                    <p><strong>File ID:</strong> {video.driveFileId}</p>
                    {video.driveFolderUrl && <p><strong>Drive URL:</strong> {video.driveFolderUrl}</p>}
                  </div>
                </div>
              ) : (
                <div className="p-2.5 bg-amber-50 border border-amber-200 text-amber-900 rounded-lg text-[11px] leading-snug">
                  Upload raw camera file (.mp4, .mov) directly or paste an existing Google Drive share link.
                </div>
              )}

              {/* Direct File Upload */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                  1. Direct Video File Upload
                </label>
                <input
                  id="raw-video-file-input"
                  type="file"
                  accept="video/*"
                  onChange={handleFileChange}
                  disabled={isUploadingFile}
                  className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-[11px] file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 border border-slate-200 rounded-lg p-1.5 focus:outline-none"
                />
              </div>

              {selectedFile && (
                <div className="text-[11px] text-slate-600 space-y-1 bg-slate-50 p-2 rounded-lg border border-slate-100">
                  <p className="truncate font-medium"><strong>File:</strong> {selectedFile.name}</p>
                  <p><strong>Size:</strong> {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                </div>
              )}

              {isUploadingFile && (
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] font-mono text-indigo-700">
                    <span>Uploading raw video to Drive...</span>
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

              <Button
                variant="primary"
                size="sm"
                className="w-full text-xs justify-center"
                disabled={!selectedFile || isUploadingFile}
                onClick={handleUploadFile}
                icon={UploadCloud}
              >
                {isUploadingFile ? 'Uploading to Drive...' : 'Upload Video File to Drive'}
              </Button>

              {/* Or Direct Google Drive URL */}
              <div className="pt-2 border-t border-slate-100 space-y-2">
                <div className="text-[10px] font-mono text-slate-400 uppercase text-center">
                  — OR LINK GOOGLE DRIVE URL —
                </div>
                <input
                  type="url"
                  value={driveUrlInput}
                  onChange={(e) => setDriveUrlInput(e.target.value)}
                  placeholder="https://drive.google.com/file/d/.../view"
                  disabled={isUploadingFile}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500"
                />
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!driveUrlInput.trim() || isUploadingFile}
                  onClick={handleLinkDriveUrl}
                  className="w-full text-xs justify-center text-slate-700"
                  icon={LinkIcon}
                >
                  Link Drive URL &amp; Advance
                </Button>
              </div>
            </div>
          </div>

          {/* Recording Assignment Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900">Studio Staff Assignment</h3>
              </div>
            </div>

            {recordingAssignments.length > 0 ? (
              <div className="space-y-2">
                {recordingAssignments.map((assignment) => (
                  <div key={assignment.id} className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800">{assignment.assigneeName}</span>
                      <span className="font-mono text-[10px] bg-indigo-100 text-indigo-800 px-1.5 py-0.5 rounded">
                        {assignment.taskType}
                      </span>
                    </div>
                    <p className="text-slate-500">Status: <span className="font-medium text-slate-700">{assignment.status}</span></p>
                    {assignment.notes && <p className="text-slate-600 italic">"{assignment.notes}"</p>}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 text-center text-xs text-slate-500">
                Presenter: <strong>{video.assignedHost || presenterName || 'Unassigned'}</strong>
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
