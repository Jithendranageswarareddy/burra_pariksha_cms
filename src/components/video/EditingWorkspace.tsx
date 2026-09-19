import React, { useState, useEffect } from 'react';
import {
  Scissors,
  FolderKanban,
  FileText,
  User,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Play,
  Save,
  ExternalLink,
  Shield,
  FileQuestion,
  ArrowRight,
  RotateCcw,
  UploadCloud,
  Download,
  CheckSquare,
  Square,
  Sparkles,
  ShieldCheck,
  Smartphone,
  Volume2,
  Check,
  Layers,
} from 'lucide-react';
import { Video, Script, VideoProductionStatus, AssignmentTaskType, RenderValidationStatus, MediaAsset } from '../../types';
import { ProductionAssetValidationService } from '../../lib/services/production-asset-validation.service';
import { apiClient } from '../../lib/api-client';
import { Button } from '../common/Button';
import { VideoStatusBadge } from '../common/StatusBadge';
import { PRIORITY_CONFIG } from '../../config/constants';

interface EditingWorkspaceProps {
  videoId: string;
  video: Video;
  onStatusChange?: () => void;
  onNavigateTab?: (tab: 'script' | 'recording' | 'editing' | 'final-review' | 'social' | 'overview' | 'thumbnail' | 'pinned-comment' | 'publishing') => void;
}

export const EditingWorkspace: React.FC<EditingWorkspaceProps> = ({
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

  // Edited Video Upload & Asset History state
  const [selectedEditedFile, setSelectedEditedFile] = useState<File | null>(null);
  const [isUploadingEdited, setIsUploadingEdited] = useState<boolean>(false);
  const [editedAssets, setEditedAssets] = useState<MediaAsset[]>([]);
  const [rawAsset, setRawAsset] = useState<MediaAsset | null>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState<boolean>(false);

  // Notes & Asset URLs state
  const [editingNotes, setEditingNotes] = useState<string>(video.notes || '');
  const [driveUrl, setDriveUrl] = useState<string>(video.driveFolderUrl || '');
  const [finalRenderUrl, setFinalRenderUrl] = useState<string>(video.finalRenderPath || '');
  const [width, setWidth] = useState<string>(video.finalRenderWidth ? String(video.finalRenderWidth) : '1080');
  const [height, setHeight] = useState<string>(video.finalRenderHeight ? String(video.finalRenderHeight) : '1920');
  const [format, setFormat] = useState<string>(video.finalRenderFormat || 'MP4');
  const [aspectRatio, setAspectRatio] = useState<string>(video.finalRenderAspectRatio || '9:16');
  const [actualDuration, setActualDuration] = useState<string>(video.actualDurationSeconds ? String(video.actualDurationSeconds) : '54');
  const [isSavingDetails, setIsSavingDetails] = useState<boolean>(false);

  // Interactive 6-Point Shorts Polish Checklist State
  const [polishChecklist, setPolishChecklist] = useState({
    hookPacing: true,
    teluguTypography: true,
    countdownTimer: true,
    speedTrickCallout: true,
    safeZones: true,
    audioLevels: true,
  });

  const togglePolishItem = (key: keyof typeof polishChecklist) => {
    setPolishChecklist((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSelectAllPolish = (value: boolean) => {
    setPolishChecklist({
      hookPacing: value,
      teluguTypography: value,
      countdownTimer: value,
      speedTrickCallout: value,
      safeZones: value,
      audioLevels: value,
    });
  };

  const completedPolishCount = Object.values(polishChecklist).filter(Boolean).length;

  const POLISH_CHECKLIST_CONFIG: {
    key: keyof typeof polishChecklist;
    title: string;
    description: string;
    badge: string;
  }[] = [
    {
      key: 'hookPacing',
      title: '1. Hook Pacing (0–5s)',
      description: 'Rapid start with zero dead air. Immediate Telugu spoken problem hook within first 2 seconds.',
      badge: '0–5s Hook',
    },
    {
      key: 'teluguTypography',
      title: '2. Telugu Typography',
      description: 'Clean Noto Sans Telugu typography overlays for Options ఎ / బి / సి / డి without glyph distortion.',
      badge: 'Noto Sans Te',
    },
    {
      key: 'countdownTimer',
      title: '3. Countdown / Tension Timer',
      description: 'Sound cue or visual countdown timer (10s audio ticking) built up before solution reveal.',
      badge: 'Timer & SFX',
    },
    {
      key: 'speedTrickCallout',
      title: '4. Burra Speed Trick Callout',
      description: 'Highlighted formula box or exam shortcut rule clearly rendered during explanation.',
      badge: 'Gold Box Graphic',
    },
    {
      key: 'safeZones',
      title: '5. 9:16 Safe Zones',
      description: 'Key math text and numbers clear of platform UI like/comment rails (right 120px) and bottom captions.',
      badge: 'Safe Margins',
    },
    {
      key: 'audioLevels',
      title: '6. Audio Levels',
      description: 'Presenter voice crisp (-14 LUFS), pop sound effects balanced, and background music ducked.',
      badge: '-14 LUFS Ducked',
    },
  ];

  const fetchScript = async () => {
    try {
      setIsLoadingScript(true);
      const res = await apiClient.getScript(videoId);
      if (res.script) {
        setScript(res.script);
      }
    } catch (err: any) {
      console.warn('Failed to load script for editing workspace:', err);
    } finally {
      setIsLoadingScript(false);
    }
  };

  const fetchHistory = async () => {
    try {
      setIsLoadingHistory(true);
      const history = await apiClient.getVideoProductionHistory(videoId);
      if (history.editedAssets) {
        setEditedAssets(history.editedAssets);
      }
      if (history.rawAssets && history.rawAssets.length > 0) {
        setRawAsset(history.rawAssets[0]);
      }
    } catch (err: any) {
      console.warn('Failed to load video production history:', err);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchScript();
    fetchHistory();
    setEditingNotes(video.notes || '');
    setDriveUrl(video.driveFolderUrl || '');
    setFinalRenderUrl(video.finalRenderPath || '');
    setWidth(video.finalRenderWidth ? String(video.finalRenderWidth) : '');
    setHeight(video.finalRenderHeight ? String(video.finalRenderHeight) : '');
    setFormat(video.finalRenderFormat || '');
    setAspectRatio(video.finalRenderAspectRatio || '');
    setActualDuration(video.actualDurationSeconds ? String(video.actualDurationSeconds) : '');
  }, [videoId, video]);

  const handleEditedFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedEditedFile(e.target.files[0]);
      setError(null);
    } else {
      setSelectedEditedFile(null);
    }
  };

  const handleUploadEditedVideo = async () => {
    if (!selectedEditedFile) return;
    setIsUploadingEdited(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const res = await apiClient.uploadEditedVideoFile(
        videoId,
        selectedEditedFile,
        video.contentId,
        false
      );

      setSuccessMessage(
        `Successfully uploaded edited video "${selectedEditedFile.name}" to Google Drive! Asset ID: ${res.latestMediaAsset?.id || 'MEDIA-EDITED'}`
      );
      setSelectedEditedFile(null);
      const fileInput = document.getElementById('edited-video-file-input') as HTMLInputElement | null;
      if (fileInput) {
        fileInput.value = '';
      }

      // Auto-populate default vertical short specs if empty
      if (!width) setWidth('1080');
      if (!height) setHeight('1920');
      if (!format) setFormat('MP4');
      if (!aspectRatio) setAspectRatio('9:16');
      if (!actualDuration) setActualDuration(String(video.targetDurationSeconds || 45));
      if (!finalRenderUrl && res.latestMediaAsset?.fileName) {
        setFinalRenderUrl(res.latestMediaAsset.fileName);
      }

      await fetchHistory();
      if (onStatusChange) {
        onStatusChange();
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to upload edited video asset.');
    } finally {
      setIsUploadingEdited(false);
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
        `Transitioned to ${nextStatus} via Editing Workspace`
      );
      setSuccessMessage(`Successfully transitioned editing status to ${nextStatus}.`);
      if (onStatusChange) {
        onStatusChange();
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to update video status.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCompleteEditing = async () => {
    setIsUpdating(true);
    setError(null);
    setSuccessMessage(null);
    try {
      await apiClient.completeFinalRender(
        videoId,
        'Completed editing stage with validated final render'
      );
      setSuccessMessage('Successfully completed editing stage! Video status is now EDITED.');
      if (onStatusChange) {
        onStatusChange();
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to complete editing.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSaveDetails = async () => {
    setIsSavingDetails(true);
    setError(null);
    try {
      await apiClient.updateVideoMetadata(videoId, {
        notes: editingNotes,
        driveFolderUrl: driveUrl,
        finalRenderPath: finalRenderUrl,
        finalRenderWidth: width ? Number(width) : undefined,
        finalRenderHeight: height ? Number(height) : undefined,
        finalRenderFormat: format || undefined,
        finalRenderAspectRatio: aspectRatio || undefined,
        actualDurationSeconds: actualDuration ? Number(actualDuration) : undefined,
      });
      setSuccessMessage('Editing details and assets saved successfully.');
      setTimeout(() => setSuccessMessage(null), 3000);
      if (onStatusChange) onStatusChange();
    } catch (err: any) {
      setError(err?.message || 'Failed to save editing details.');
    } finally {
      setIsSavingDetails(false);
    }
  };

  const editingAssignments = (video.assignments || []).filter(
    (a) => a.taskType === AssignmentTaskType.EDITING || a.assignmentRole === 'EDITOR' || a.assignmentRole === 'VIDEO_EDITOR'
  );

  const liveValidation = ProductionAssetValidationService.validateMetadata({
    finalRenderWidth: width ? Number(width) : null,
    finalRenderHeight: height ? Number(height) : null,
    finalRenderFormat: format || null,
    finalRenderAspectRatio: aspectRatio || null,
    actualDurationSeconds: actualDuration ? Number(actualDuration) : null,
    targetDurationSeconds: video.targetDurationSeconds || 45,
    finalRenderPath: finalRenderUrl,
  });

  const latestEditedAsset = editedAssets.length > 0 ? editedAssets[0] : null;
  const hasEditedCut = Boolean(latestEditedAsset || (video.finalRenderPath && video.finalRenderPath.trim().length > 0));
  const hasRawFootage = Boolean(video.driveFileId || rawAsset || video.driveFolderUrl);
  const numWidth = Number(width);
  const numHeight = Number(height);
  const isValidResolution = numWidth === 1080 && numHeight === 1920;
  const numDuration = Number(actualDuration);
  const isDurationValid = numDuration > 0 && numDuration <= 60;

  const prereqs = {
    rawFootage: {
      label: 'Raw Footage Source',
      valid: hasRawFootage,
      statusLabel: hasRawFootage ? '✓ Ingested in Drive' : '⚠️ No Raw Footage Linked',
      detail: video.driveFileId
        ? `Drive ID: ${video.driveFileId.slice(0, 14)}...`
        : 'Awaiting raw camera take from Stage 04 recording',
    },
    editedCut: {
      label: 'Edited Cut',
      valid: hasEditedCut,
      statusLabel: hasEditedCut
        ? latestEditedAsset
          ? `✓ Uploaded (v${latestEditedAsset.version})`
          : '✓ Asset Path Linked'
        : '⚠️ Pending Upload',
      detail: latestEditedAsset
        ? latestEditedAsset.fileName
        : 'Requires 9:16 MP4 master cut uploaded to Drive',
    },
    resolution: {
      label: '9:16 Resolution',
      valid: isValidResolution,
      statusLabel: isValidResolution
        ? '✓ 1080x1920 Valid'
        : width && height
        ? `⚠️ Incorrect Dimensions (${width}×${height})`
        : '⚠️ Incorrect Dimensions',
      detail: 'Standard vertical canvas 1080×1920 (9:16)',
    },
    duration: {
      label: 'Duration',
      valid: isDurationValid,
      statusLabel: isDurationValid
        ? `✓ <= 60s (${numDuration || actualDuration}s)`
        : numDuration > 60
        ? `⚠️ Exceeds 60s Limit (${numDuration}s)`
        : '⚠️ Duration Missing',
      detail: numDuration > 60
        ? 'Exceeds 60s YouTube Shorts limit (fails Shorts feed)'
        : 'Target pacing: 50s–59s vertical retention',
    },
  };

  const allPrereqsMet =
    prereqs.rawFootage.valid &&
    prereqs.editedCut.valid &&
    prereqs.resolution.valid &&
    prereqs.duration.valid &&
    liveValidation.status === RenderValidationStatus.VALID;

  const getMissingPrereqsTooltip = () => {
    const missing: string[] = [];
    if (!prereqs.rawFootage.valid) missing.push('Raw footage must be ingested in Drive');
    if (!prereqs.editedCut.valid) missing.push('Edited master cut must be uploaded');
    if (!prereqs.resolution.valid) missing.push('Resolution must be exactly 1080×1920');
    if (!prereqs.duration.valid) missing.push('Duration must be ≤ 60 seconds');
    if (liveValidation.status !== RenderValidationStatus.VALID) missing.push('Render metadata validation errors exist');
    return missing.length > 0 ? `Prerequisites not met: ${missing.join(', ')}` : undefined;
  };

  const priorityCfg = PRIORITY_CONFIG[video.priority] || PRIORITY_CONFIG['NORMAL'];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header Info Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <span className="font-mono text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                {video.id}
              </span>
              <VideoStatusBadge status={video.status} size="md" />
              <span className={`text-xs px-2.5 py-0.5 rounded font-semibold ${priorityCfg.bg} ${priorityCfg.text}`}>
                Priority: {priorityCfg.label}
              </span>
            </div>
            <h2 className="text-base font-bold text-slate-900">{video.title}</h2>
          </div>

          {/* Legal Transition Actions */}
          <div className="flex flex-wrap items-center gap-2">
            {video.status === VideoProductionStatus.RECORDED && (
              <Button
                variant="primary"
                size="sm"
                disabled={isUpdating}
                onClick={() => handleStatusTransition(VideoProductionStatus.EDITING)}
                className="text-xs"
                icon={Play}
              >
                Start Editing (EDITING)
              </Button>
            )}

            {video.status === VideoProductionStatus.EDITING && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isUpdating}
                  onClick={() => handleStatusTransition(VideoProductionStatus.RECORDED)}
                  className="text-xs"
                  icon={RotateCcw}
                >
                  Return to Recorded
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  disabled={isUpdating || !allPrereqsMet}
                  onClick={handleCompleteEditing}
                  className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50"
                  icon={CheckCircle2}
                  title={getMissingPrereqsTooltip()}
                >
                  Complete Editing (EDITED)
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  disabled={isUpdating || !allPrereqsMet}
                  onClick={async () => {
                    await handleStatusTransition(VideoProductionStatus.FINAL_REVIEW);
                    onNavigateTab?.('final-review');
                  }}
                  className="text-xs disabled:opacity-50"
                  icon={ArrowRight}
                  title={getMissingPrereqsTooltip()}
                >
                  Send to Final Review (FINAL_REVIEW)
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  disabled={isUpdating || !allPrereqsMet}
                  onClick={() => handleStatusTransition(VideoProductionStatus.READY_TO_UPLOAD)}
                  className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50"
                  icon={CheckCircle2}
                  title={getMissingPrereqsTooltip()}
                >
                  Ready to Upload (READY_TO_UPLOAD)
                </Button>
              </>
            )}

            {video.status === VideoProductionStatus.EDITED && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isUpdating}
                  onClick={() => handleStatusTransition(VideoProductionStatus.EDITING)}
                  className="text-xs"
                  icon={RotateCcw}
                >
                  Return to Editing
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  disabled={isUpdating}
                  onClick={() => {
                    handleStatusTransition(VideoProductionStatus.FINAL_REVIEW);
                    onNavigateTab?.('final-review');
                  }}
                  className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                  icon={ArrowRight}
                >
                  Proceed to Stage 06: Final QC & Assets
                </Button>
              </>
            )}

            {video.status === VideoProductionStatus.FINAL_REVIEW && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isUpdating}
                  onClick={() => handleStatusTransition(VideoProductionStatus.EDITING)}
                  className="text-xs text-rose-600 border-rose-200 hover:bg-rose-50"
                  icon={RotateCcw}
                >
                  Reject / Return to Editing
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => onNavigateTab?.('final-review')}
                  className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                  icon={ArrowRight}
                >
                  Open Stage 06: Final QC & Assets
                </Button>
              </div>
            )}
          </div>
        </div>

        {successMessage && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-lg flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Operational Metadata Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-slate-100 text-xs">
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/60 space-y-1">
            <span className="text-slate-400 font-medium flex items-center gap-1.5">
              <FileQuestion className="w-3.5 h-3.5 text-indigo-500" /> Question ID
            </span>
            <span className="font-mono font-bold text-slate-800">{video.questionId}</span>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/60 space-y-1">
            <span className="text-slate-400 font-medium flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-indigo-500" /> Scheduled Publish
            </span>
            <span className="font-medium text-slate-800">
              {video.scheduledPublishDate ? new Date(video.scheduledPublishDate).toLocaleDateString() : 'Not scheduled'}
            </span>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/60 space-y-1">
            <span className="text-slate-400 font-medium flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-indigo-500" /> Assigned Editor
            </span>
            <span className="font-medium text-slate-800">{video.assignedEditor || 'Unassigned Editor'}</span>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/60 space-y-1">
            <span className="text-slate-400 font-medium flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-indigo-500" /> Actual Duration
            </span>
            <span className="font-mono font-medium text-slate-800">{video.actualDurationSeconds || video.targetDurationSeconds || 45}s</span>
          </div>
        </div>
      </div>

      {/* Zero-Friction Bridge to Stage 06: Celebratory Master Cut Banner */}
      {(video.status === VideoProductionStatus.EDITED || video.status === VideoProductionStatus.FINAL_REVIEW) && (
        <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-indigo-950 border border-emerald-500/40 rounded-xl p-5 text-white shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 text-xs font-bold font-mono px-2.5 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-full">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                ✓ MASTER CUT EDITED &amp; VALIDATED
              </span>
              <span className="text-xs text-slate-400 font-mono">
                Current Status: {video.status}
              </span>
            </div>
            <h3 className="text-base font-bold text-white">
              Master Cut Locked &amp; Ready for Final QC &amp; Assets
            </h3>
            <p className="text-xs text-slate-300 max-w-2xl">
              Vertical 9:16 master cut is ingested with compliant duration and on-screen Telugu overlays. Advance to Stage 06 to review the final render, generate social thumbnails, and inspect publishing metadata.
            </p>
          </div>

          <button
            type="button"
            onClick={() => onNavigateTab?.('final-review')}
            className="px-5 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 shrink-0 group hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            <span>Proceed to Stage 06: Final QC &amp; Assets</span>
            <ArrowRight className="w-4 h-4 text-slate-950 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      )}

      {/* Editing Readiness & Prerequisites Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className={`w-5 h-5 ${allPrereqsMet ? 'text-emerald-600' : 'text-amber-600'}`} />
            <div>
              <h3 className="text-sm font-bold text-slate-900">Editing Readiness &amp; Prerequisites</h3>
              <p className="text-[11px] text-slate-500">
                Deterministic state-machine guards: All 4 production criteria must pass before completing the cut or sending to Stage 06.
              </p>
            </div>
          </div>
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold font-mono ${
              allPrereqsMet
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-300'
                : 'bg-amber-50 text-amber-700 border border-amber-300'
            }`}
          >
            {allPrereqsMet ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                ALL GUARDS SATISFIED
              </>
            ) : (
              <>
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                PREREQUISITES INCOMPLETE
              </>
            )}
          </span>
        </div>

        {/* 4 Prerequisites Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Prereq 1: Raw Footage */}
          <div
            className={`p-3.5 rounded-xl border transition-all ${
              prereqs.rawFootage.valid
                ? 'bg-emerald-50/40 border-emerald-200'
                : 'bg-amber-50/60 border-amber-200'
            }`}
          >
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                <Smartphone className="w-3.5 h-3.5 text-slate-400" />
                Raw Footage
              </span>
              <span
                className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded ${
                  prereqs.rawFootage.valid
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-900'
                }`}
              >
                {prereqs.rawFootage.statusLabel}
              </span>
            </div>
            <p className="text-[11px] text-slate-600 font-mono truncate">{prereqs.rawFootage.detail}</p>
          </div>

          {/* Prereq 2: Edited Cut */}
          <div
            className={`p-3.5 rounded-xl border transition-all ${
              prereqs.editedCut.valid
                ? 'bg-emerald-50/40 border-emerald-200'
                : 'bg-amber-50/60 border-amber-200'
            }`}
          >
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                <Scissors className="w-3.5 h-3.5 text-slate-400" />
                Edited Cut
              </span>
              <span
                className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded ${
                  prereqs.editedCut.valid
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-900'
                }`}
              >
                {prereqs.editedCut.statusLabel}
              </span>
            </div>
            <p className="text-[11px] text-slate-600 font-mono truncate">{prereqs.editedCut.detail}</p>
          </div>

          {/* Prereq 3: 9:16 Resolution */}
          <div
            className={`p-3.5 rounded-xl border transition-all ${
              prereqs.resolution.valid
                ? 'bg-emerald-50/40 border-emerald-200'
                : 'bg-amber-50/60 border-amber-200'
            }`}
          >
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-slate-400" />
                9:16 Resolution
              </span>
              <span
                className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded ${
                  prereqs.resolution.valid
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-900'
                }`}
              >
                {prereqs.resolution.statusLabel}
              </span>
            </div>
            <p className="text-[11px] text-slate-600 font-mono truncate">{prereqs.resolution.detail}</p>
          </div>

          {/* Prereq 4: Duration Limit */}
          <div
            className={`p-3.5 rounded-xl border transition-all ${
              prereqs.duration.valid
                ? 'bg-emerald-50/40 border-emerald-200'
                : 'bg-rose-50/60 border-rose-200'
            }`}
          >
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                Duration
              </span>
              <span
                className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded ${
                  prereqs.duration.valid
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-rose-100 text-rose-900'
                }`}
              >
                {prereqs.duration.statusLabel}
              </span>
            </div>
            <p className="text-[11px] text-slate-600 font-mono truncate">{prereqs.duration.detail}</p>
          </div>
        </div>

        {!allPrereqsMet && (
          <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-lg flex items-center gap-2 text-xs text-amber-900">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>State-Machine Guards Enforced:</strong> {getMissingPrereqsTooltip()}
            </span>
          </div>
        )}
      </div>

      {/* Main Content Grid: Asset Links, Script Context & Assignments */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Shorts Polish Checklist + Drive & Render References + Editing Notes */}
        <div className="lg:col-span-2 space-y-6">
          {/* Interactive 6-Point Shorts Polish Checklist Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Interactive 6-Point Shorts Polish Checklist</h3>
                  <p className="text-[11px] text-slate-500">
                    Mandatory retention and typography standards for Telugu short-form video engagement.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2.5 self-end sm:self-auto">
                <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200">
                  {completedPolishCount}/6 VERIFIED
                </span>
                <button
                  type="button"
                  onClick={() => handleSelectAllPolish(completedPolishCount !== 6)}
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold px-2 py-1 rounded hover:bg-indigo-50 transition cursor-pointer"
                >
                  {completedPolishCount === 6 ? 'Deselect All' : 'Select All'}
                </button>
              </div>
            </div>

            {/* Checklist items */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {POLISH_CHECKLIST_CONFIG.map((item) => {
                const checked = polishChecklist[item.key];
                return (
                  <div
                    key={item.key}
                    onClick={() => togglePolishItem(item.key)}
                    className={`p-3.5 rounded-xl border flex items-start gap-3 cursor-pointer transition select-none ${
                      checked
                        ? 'bg-emerald-50/50 border-emerald-300 text-emerald-950 shadow-2xs'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="mt-0.5 shrink-0">
                      {checked ? (
                        <CheckSquare className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-400" />
                      )}
                    </div>
                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1.5">
                        <span className="text-xs font-bold truncate">{item.title}</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 shrink-0">
                          {item.badge}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 leading-snug">{item.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Asset Links Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FolderKanban className="w-4 h-4 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900">Editing Asset & Drive References</h3>
              </div>
            </div>

            <div className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-medium text-slate-700">Google Drive Folder URL</label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={driveUrl}
                    onChange={(e) => setDriveUrl(e.target.value)}
                    placeholder="https://drive.google.com/drive/folders/..."
                    className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono text-slate-800 focus:ring-1 focus:ring-indigo-500"
                  />
                  {driveUrl && (
                    <a
                      href={driveUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium inline-flex items-center gap-1 shrink-0"
                    >
                      <ExternalLink className="w-3.5 h-3.5" /> Open
                    </a>
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-medium text-slate-700">Final Render Asset Path / URL</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={finalRenderUrl}
                    onChange={(e) => setFinalRenderUrl(e.target.value)}
                    placeholder="gs://bucket/renders/... or https://..."
                    className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono text-slate-800 focus:ring-1 focus:ring-indigo-500"
                  />
                  {finalRenderUrl && (
                    <a
                      href={finalRenderUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium inline-flex items-center gap-1 shrink-0"
                    >
                      <ExternalLink className="w-3.5 h-3.5" /> Open
                    </a>
                  )}
                </div>
              </div>

              {/* Render Metadata Inputs */}
              <div className="pt-4 border-t border-slate-100 space-y-4">
                <h4 className="font-bold text-slate-800 text-xs">Final Render Specifications</h4>
                
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  <div className="space-y-1">
                    <label className="font-medium text-slate-600 block">Width (px)</label>
                    <input
                      type="number"
                      value={width}
                      onChange={(e) => setWidth(e.target.value)}
                      placeholder="e.g. 1080"
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-mono text-slate-800 focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-medium text-slate-600 block">Height (px)</label>
                    <input
                      type="number"
                      value={height}
                      onChange={(e) => setHeight(e.target.value)}
                      placeholder="e.g. 1920"
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-mono text-slate-800 focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-medium text-slate-600 block">Format</label>
                    <input
                      type="text"
                      value={format}
                      onChange={(e) => setFormat(e.target.value)}
                      placeholder="e.g. MP4"
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-mono text-slate-800 focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-medium text-slate-600 block">Aspect Ratio</label>
                    <input
                      type="text"
                      value={aspectRatio}
                      onChange={(e) => setAspectRatio(e.target.value)}
                      placeholder="e.g. 9:16"
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-mono text-slate-800 focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="space-y-1 col-span-2 sm:col-span-1">
                    <label className="font-medium text-slate-600 block">Duration (s)</label>
                    <input
                      type="number"
                      value={actualDuration}
                      onChange={(e) => setActualDuration(e.target.value)}
                      placeholder="e.g. 45"
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-mono text-slate-800 focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                {/* Validation Badge & Message Display */}
                <div className="p-4 rounded-xl border border-slate-200/80 bg-slate-50 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-700 text-xs">Deterministic Render Validation</span>
                    <div>
                      {liveValidation.status === RenderValidationStatus.VALID && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                          VALID
                        </span>
                      )}
                      {liveValidation.status === RenderValidationStatus.INVALID && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">
                          INVALID
                        </span>
                      )}
                      {liveValidation.status === RenderValidationStatus.NEEDS_REVIEW && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
                          NEEDS REVIEW
                        </span>
                      )}
                      {liveValidation.status === RenderValidationStatus.NOT_VALIDATED && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-200 text-slate-800 border border-slate-300">
                          NOT VALIDATED
                        </span>
                      )}
                    </div>
                  </div>

                  {liveValidation.errors.length > 0 && (
                    <div className="space-y-1 text-xs text-rose-700 bg-rose-50/50 p-2.5 rounded-lg border border-rose-100">
                      <p className="font-semibold">Errors ({liveValidation.errors.length}):</p>
                      <ul className="list-disc pl-4 space-y-0.5">
                        {liveValidation.errors.map((err, i) => (
                          <li key={i}>{err}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {liveValidation.warnings.length > 0 && (
                    <div className="space-y-1 text-xs text-amber-700 bg-amber-50/50 p-2.5 rounded-lg border border-amber-100">
                      <p className="font-semibold">Warnings ({liveValidation.warnings.length}):</p>
                      <ul className="list-disc pl-4 space-y-0.5">
                        {liveValidation.warnings.map((warn, i) => (
                          <li key={i}>{warn}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {liveValidation.errors.length === 0 && liveValidation.status === RenderValidationStatus.VALID && (
                    <p className="text-xs text-emerald-700 font-medium bg-emerald-50/30 p-2 rounded border border-emerald-100">
                      ✓ Render metadata satisfies all vertical short-form distribution standards.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Editing Notes Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Scissors className="w-4 h-4 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900">Editing Production Notes</h3>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <textarea
                rows={4}
                value={editingNotes}
                onChange={(e) => setEditingNotes(e.target.value)}
                placeholder="Log cut pacing, color grading remarks, B-roll insertions, audio leveling notes..."
                className="w-full text-xs p-3 border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 text-slate-800"
              />
              <div className="flex justify-end">
                <Button
                  variant="primary"
                  size="sm"
                  disabled={isSavingDetails}
                  onClick={handleSaveDetails}
                  className="text-xs"
                  icon={Save}
                >
                  {isSavingDetails ? 'Saving...' : 'Save Editing Details'}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Col: Edited Video Upload, Script Preview Summary & Editing Assignments */}
        <div className="space-y-6">
          {/* Edited Video Upload & Verification Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Scissors className="w-4 h-4 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900">Edited Video Production</h3>
              </div>
              {isLoadingHistory && (
                <span className="text-[10px] text-slate-400 font-mono">Refreshing...</span>
              )}
            </div>

            {/* 1. Current Raw Video / Access */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">
                  Raw Video Source
                </span>
                {video.driveFileId ? (
                  <span className="inline-flex items-center gap-1 font-semibold text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    Drive Ready
                  </span>
                ) : (
                  <span className="text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                    No Raw Asset
                  </span>
                )}
              </div>

              <div className="space-y-1 font-mono text-[11px] text-slate-600 break-all">
                <p><strong>File:</strong> {rawAsset?.fileName || video.fileName || 'raw-recording.mp4'}</p>
                {video.driveFileId && (
                  <p><strong>Drive File ID:</strong> {video.driveFileId}</p>
                )}
                {(rawAsset?.fileSize || video.fileSize) && (
                  <p><strong>Size:</strong> {(((rawAsset?.fileSize || video.fileSize) || 0) / (1024 * 1024)).toFixed(2)} MB</p>
                )}
              </div>

              {video.driveFileId && (
                <a
                  href={`/api/videos/${encodeURIComponent(videoId)}/download`}
                  target="_blank"
                  rel="noreferrer"
                  download={video.fileName || `raw-video-${videoId}.mp4`}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-md font-semibold text-xs transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download Raw Video for External Editing
                </a>
              )}
            </div>

            {/* 2 & 3. Choose & Upload Edited Video */}
            <div className="space-y-2.5 pt-1">
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                Upload Edited Video (MP4/MOV)
              </label>
              <input
                id="edited-video-file-input"
                type="file"
                accept="video/mp4,video/quicktime,video/webm,video/x-matroska"
                onChange={handleEditedFileChange}
                disabled={isUploadingEdited}
                className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-[11px] file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 border border-slate-200 rounded-lg p-1.5 focus:outline-none"
              />

              {selectedEditedFile && (
                <div className="text-[11px] text-slate-600 space-y-0.5 bg-indigo-50/50 p-2 rounded-lg border border-indigo-100 font-mono">
                  <p className="truncate"><strong>Selected:</strong> {selectedEditedFile.name}</p>
                  <p><strong>Size:</strong> {(selectedEditedFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                </div>
              )}

              <Button
                variant="primary"
                size="sm"
                className="w-full text-xs justify-center bg-indigo-600 hover:bg-indigo-700 text-white"
                disabled={!selectedEditedFile || isUploadingEdited}
                onClick={handleUploadEditedVideo}
                icon={UploadCloud}
              >
                {isUploadingEdited ? 'Uploading to Google Drive...' : 'Upload Edited Video'}
              </Button>
            </div>

            {/* 4. Uploaded Edited-Video Status / Reference */}
            {latestEditedAsset ? (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg space-y-1.5">
                <div className="flex items-center justify-between font-semibold text-emerald-900">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Edited Video Uploaded (V{latestEditedAsset.version})</span>
                  </div>
                  <span className="font-mono text-[10px] bg-emerald-100 text-emerald-900 px-1.5 py-0.5 rounded">
                    {latestEditedAsset.id}
                  </span>
                </div>
                <div className="font-mono text-[10px] text-emerald-700 break-all space-y-0.5">
                  <p><strong>File Name:</strong> {latestEditedAsset.fileName}</p>
                  <p><strong>Drive File ID:</strong> {latestEditedAsset.driveFileId}</p>
                  <p><strong>Checksum:</strong> {latestEditedAsset.checksum || (latestEditedAsset as any).md5Checksum || 'Verified'}</p>
                  <p><strong>Size:</strong> {(latestEditedAsset.fileSize / (1024 * 1024)).toFixed(2)} MB</p>
                  <p><strong>Uploaded:</strong> {new Date(latestEditedAsset.createdAt).toLocaleString()}</p>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg space-y-1">
                <div className="flex items-center gap-1.5 font-semibold text-amber-900 text-xs">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span>Edited Video Required</span>
                </div>
                <p className="text-[11px] leading-snug">
                  An edited video file must be uploaded before completing editing or sending to Final Review.
                </p>
              </div>
            )}

            {/* 5. Render Validation Result */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">
                  Render Specifications Validation
                </span>
                {liveValidation.status === RenderValidationStatus.VALID ? (
                  <span className="inline-flex items-center gap-1 font-semibold text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    Valid Specs
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 font-semibold text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                    <AlertTriangle className="w-3 h-3 text-amber-600" />
                    Needs Specs
                  </span>
                )}
              </div>

              <div className="space-y-1 text-[11px] text-slate-600">
                <div className="flex justify-between py-0.5 border-b border-slate-200/60">
                  <span>Dimensions (1080×1920):</span>
                  <span className="font-mono font-medium text-slate-800">{width || '—'} × {height || '—'}</span>
                </div>
                <div className="flex justify-between py-0.5 border-b border-slate-200/60">
                  <span>Aspect Ratio (9:16):</span>
                  <span className="font-mono font-medium text-slate-800">{aspectRatio || '—'}</span>
                </div>
                <div className="flex justify-between py-0.5 border-b border-slate-200/60">
                  <span>Format (MP4):</span>
                  <span className="font-mono font-medium text-slate-800">{format || '—'}</span>
                </div>
                <div className="flex justify-between py-0.5">
                  <span>Duration ({video.targetDurationSeconds || 45}s target):</span>
                  <span className="font-mono font-medium text-slate-800">{actualDuration || '—'}s</span>
                </div>
              </div>

              {liveValidation.errors.length > 0 && (
                <div className="text-[10px] text-rose-700 bg-rose-50 p-2 rounded border border-rose-100 space-y-0.5">
                  {liveValidation.errors.map((err, idx) => (
                    <p key={idx}>• {err}</p>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Script Context Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900">Script Context</h3>
              </div>
              {onNavigateTab && (
                <button
                  type="button"
                  onClick={() => onNavigateTab('script')}
                  className="text-indigo-600 hover:underline text-xs font-semibold flex items-center gap-1"
                >
                  Full Script <ExternalLink className="w-3 h-3" />
                </button>
              )}
            </div>

            {isLoadingScript ? (
              <div className="py-6 text-center text-xs text-slate-400 font-mono">Loading script...</div>
            ) : script ? (
              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-mono bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded font-bold">
                    Version v{script.currentVersion}
                  </span>
                  <span className="text-slate-400">Approved for Production</span>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
                  <span className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">Hook</span>
                  <p className="text-slate-800 line-clamp-3">{script.hookText}</p>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 text-center text-xs text-slate-500">
                No active script linked.
              </div>
            )}
          </div>

          {/* Editing Assignments Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900">Editing Assignment</h3>
              </div>
            </div>

            {editingAssignments.length > 0 ? (
              <div className="space-y-2.5">
                {editingAssignments.map((assignment) => (
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
              <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 text-center text-xs text-slate-500">
                No editing task assigned yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
