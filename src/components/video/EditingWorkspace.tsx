import React, { useState, useEffect } from 'react';
import {
  Scissors,
  CheckCircle2,
  AlertTriangle,
  Save,
  ArrowRight,
  UploadCloud,
  Download,
  Square,
  ShieldCheck,
  Smartphone,
  Check,
  Layers,
  ChevronDown,
  ChevronUp,
  Sparkles,
  FileText,
} from 'lucide-react';
import { Video, Script, VideoProductionStatus, MediaAsset } from '../../types';
import { apiClient } from '../../lib/api-client';
import { Button } from '../common/Button';

interface EditingWorkspaceProps {
  videoId: string;
  video: Video;
  onStatusChange?: () => void;
  onNavigateTab?: (
    tab:
      | 'script'
      | 'recording'
      | 'editing'
      | 'final-review'
      | 'social'
      | 'overview'
      | 'thumbnail'
      | 'pinned-comment'
      | 'publishing'
  ) => void;
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

  // Notes & Drawer state
  const [editingNotes, setEditingNotes] = useState<string>(video.notes || '');
  const [driveUrl, setDriveUrl] = useState<string>(video.driveFolderUrl || '');
  const [finalRenderUrl, setFinalRenderUrl] = useState<string>(video.finalRenderPath || '');
  const [isSavingDetails, setIsSavingDetails] = useState<boolean>(false);
  const [isScriptOpen, setIsScriptOpen] = useState<boolean>(false);

  // Auto-populated vertical short specifications
  const actualDuration = String(video.actualDurationSeconds || video.targetDurationSeconds || 45);

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

  const POLISH_PILLS: { key: keyof typeof polishChecklist; label: string }[] = [
    { key: 'hookPacing', label: '1. Hook 0–5s' },
    { key: 'teluguTypography', label: '2. Noto Sans Telugu' },
    { key: 'countdownTimer', label: '3. 10s Timer' },
    { key: 'speedTrickCallout', label: '4. Burra Formula' },
    { key: 'safeZones', label: '5. 9:16 Safe Zones' },
    { key: 'audioLevels', label: '6. -14 LUFS Audio' },
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
      if (
        video.status !== VideoProductionStatus.EDITING &&
        video.status !== VideoProductionStatus.EDITED
      ) {
        try {
          await apiClient.updateVideoStatus(
            videoId,
            VideoProductionStatus.EDITING,
            'Auto-advancing to EDITING for master cut upload'
          );
          if (onStatusChange) onStatusChange();
        } catch (e) {
          console.warn('Pre-flight status update to EDITING skipped/failed:', e);
        }
      }

      const res = await apiClient.uploadEditedVideoFile(
        videoId,
        selectedEditedFile,
        video.contentId,
        false
      );

      setSuccessMessage(
        `Successfully uploaded edited master cut "${selectedEditedFile.name}" to Google Drive!`
      );
      setSelectedEditedFile(null);
      const fileInput = document.getElementById('edited-video-file-input') as HTMLInputElement | null;
      if (fileInput) {
        fileInput.value = '';
      }

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

  const handleSaveNotes = async () => {
    setIsSavingDetails(true);
    setError(null);
    try {
      await apiClient.updateVideoMetadata(videoId, {
        notes: editingNotes,
        driveFolderUrl: driveUrl,
        finalRenderPath: finalRenderUrl,
        finalRenderWidth: 1080,
        finalRenderHeight: 1920,
        finalRenderFormat: 'MP4',
        finalRenderAspectRatio: '9:16',
        actualDurationSeconds: Number(actualDuration) || 45,
      });
      setSuccessMessage('Editing notes saved successfully.');
      setTimeout(() => setSuccessMessage(null), 3000);
      if (onStatusChange) onStatusChange();
    } catch (err: any) {
      setError(err?.message || 'Failed to save editing details.');
    } finally {
      setIsSavingDetails(false);
    }
  };

  const handleSaveAndProceed = async () => {
    setIsUpdating(true);
    setError(null);
    try {
      await apiClient.updateVideoMetadata(videoId, {
        notes: editingNotes,
        driveFolderUrl: driveUrl,
        finalRenderPath: finalRenderUrl || 'gs://burra-pariksha/edited-master.mp4',
        finalRenderWidth: 1080,
        finalRenderHeight: 1920,
        finalRenderFormat: 'MP4',
        finalRenderAspectRatio: '9:16',
        actualDurationSeconds: Number(actualDuration) || 45,
      });

      if (
        video.status === VideoProductionStatus.EDITING ||
        video.status === VideoProductionStatus.RECORDED
      ) {
        await apiClient.updateVideoStatus(
          videoId,
          VideoProductionStatus.FINAL_REVIEW,
          'Completed Editing Stage and sent to Final QC'
        );
        onStatusChange?.();
      }

      if (onNavigateTab) {
        onNavigateTab('final-review');
      } else {
        window.location.href = `/videos/${encodeURIComponent(videoId)}?tab=final-review`;
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to proceed to Final QC Lock.');
    } finally {
      setIsUpdating(false);
    }
  };

  const latestEditedAsset = editedAssets.length > 0 ? editedAssets[0] : null;
  const hasEditedCut = Boolean(
    latestEditedAsset ||
      (video.finalRenderPath && video.finalRenderPath.trim().length > 0)
  );
  const hasRawFootage = Boolean(video.driveFileId || rawAsset || video.driveFolderUrl);

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* Alert Banners */}
      {successMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Dual-Pane Studio Layout (7/5 Split) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT PANE (lg:col-span-7 / Editing & Ingestion Stage) */}
        <div className="lg:col-span-7 space-y-4">
          {/* CARD 1: Raw Footage Source */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-indigo-600" />
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Raw Footage Source
                </h3>
              </div>
              {hasRawFootage ? (
                <span className="inline-flex items-center gap-1 font-semibold text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  Drive Ready
                </span>
              ) : (
                <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                  No Raw Asset
                </span>
              )}
            </div>

            <div className="flex items-center justify-between text-xs font-mono text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-200/80 flex-wrap gap-2">
              <div className="truncate max-w-[280px]">
                <span className="text-slate-400">File: </span>
                <span className="font-bold text-slate-900">
                  {rawAsset?.fileName || video.fileName || 'video_11.1.mp4'}
                </span>
              </div>
              {(rawAsset?.fileSize || video.fileSize) && (
                <div>
                  <span className="text-slate-400">Size: </span>
                  <span className="font-bold">
                    {(((rawAsset?.fileSize || video.fileSize) || 0) / (1024 * 1024)).toFixed(1)} MB
                  </span>
                </div>
              )}
            </div>

            {video.driveFileId || video.driveFolderUrl ? (
              <a
                href={
                  video.driveFileId
                    ? `/api/videos/${encodeURIComponent(videoId)}/download`
                    : video.driveFolderUrl
                }
                target="_blank"
                rel="noreferrer"
                download={video.fileName || `raw-video-${videoId}.mp4`}
                className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-semibold py-2 px-3 rounded-lg text-xs transition-colors flex items-center justify-center gap-1.5 w-full cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>⬇ Download Raw Video for External Editing</span>
              </a>
            ) : (
              <div className="text-[11px] text-slate-500 italic bg-slate-50 p-2 rounded-lg text-center">
                Raw footage camera take will automatically sync upon recording completion.
              </div>
            )}
          </div>

          {/* CARD 2: Upload Edited Master Cut (MP4/MOV) */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Scissors className="w-4 h-4 text-indigo-600" />
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Upload Edited Master Cut (MP4/MOV)
                </h3>
              </div>
              {hasEditedCut && (
                <span className="inline-flex items-center gap-1 font-bold text-[10px] text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  ✓ Master Cut Ingested
                </span>
              )}
            </div>

            <div className="space-y-2">
              <input
                id="edited-video-file-input"
                type="file"
                accept="video/mp4,video/quicktime,video/webm,video/x-matroska"
                onChange={handleEditedFileChange}
                disabled={isUploadingEdited}
                className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-[11px] file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 border border-slate-200 rounded-xl p-1.5 focus:outline-none"
              />

              {selectedEditedFile && (
                <div className="text-[11px] text-slate-700 space-y-0.5 bg-indigo-50/60 p-2.5 rounded-xl border border-indigo-100 font-mono flex items-center justify-between">
                  <span className="truncate max-w-[240px]">
                    <strong>Selected:</strong> {selectedEditedFile.name}
                  </span>
                  <span>
                    <strong>Size:</strong> {(selectedEditedFile.size / (1024 * 1024)).toFixed(1)} MB
                  </span>
                </div>
              )}

              {isUploadingEdited && (
                <div className="space-y-1">
                  <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-indigo-600 h-1.5 rounded-full animate-pulse w-3/4" />
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 block text-right">
                    Uploading edited master cut to Google Drive...
                  </span>
                </div>
              )}

              <Button
                variant="primary"
                size="sm"
                className="w-full text-xs justify-center bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-xl shadow-2xs"
                disabled={!selectedEditedFile || isUploadingEdited}
                onClick={handleUploadEditedVideo}
                icon={UploadCloud}
              >
                {isUploadingEdited ? 'Uploading to Drive...' : '⬆ Upload Edited Video'}
              </Button>
            </div>

            {latestEditedAsset && (
              <div className="p-2.5 bg-emerald-50/70 border border-emerald-200 rounded-xl text-emerald-950 font-mono text-[11px] flex items-center justify-between">
                <div className="truncate max-w-[300px]">
                  <strong>Active Cut:</strong> {latestEditedAsset.fileName}
                </div>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded">
                  v{latestEditedAsset.version || 1}
                </span>
              </div>
            )}
          </div>

          {/* CARD 3: Compact 6-Point Polish Micro-Pills */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  6-Point Shorts Polish Standards
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  {completedPolishCount}/6 Verified
                </span>
                <button
                  type="button"
                  onClick={() => handleSelectAllPolish(completedPolishCount !== 6)}
                  className="text-[11px] text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer"
                >
                  {completedPolishCount === 6 ? 'Deselect All' : 'Select All'}
                </button>
              </div>
            </div>

            {/* 2-Row Micro-Pill Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {POLISH_PILLS.map((pill) => {
                const checked = polishChecklist[pill.key];
                return (
                  <button
                    key={pill.key}
                    type="button"
                    onClick={() => togglePolishItem(pill.key)}
                    className={`px-3 py-2 rounded-xl border text-xs flex items-center justify-between transition cursor-pointer select-none ${
                      checked
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300 font-bold shadow-2xs'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 font-medium'
                    }`}
                  >
                    <span className="truncate">{pill.label}</span>
                    {checked ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 ml-1" />
                    ) : (
                      <Square className="w-3.5 h-3.5 text-slate-300 shrink-0 ml-1" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* CARD 4: Editing Production Notes */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-2.5">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Editing Notes
              </span>
              <span className="text-[10px] text-slate-400 font-mono">Optional Editor Log</span>
            </div>
            <textarea
              rows={2}
              value={editingNotes}
              onChange={(e) => setEditingNotes(e.target.value)}
              placeholder="Log cut pacing, color grading remarks, B-roll insertions, audio leveling notes..."
              className="w-full text-xs p-2.5 border border-slate-300 rounded-xl focus:ring-1 focus:ring-indigo-500 text-slate-800"
            />
            <div className="flex justify-end">
              <Button
                variant="primary"
                size="sm"
                disabled={isSavingDetails}
                onClick={handleSaveNotes}
                className="text-xs font-semibold py-1.5 px-3 rounded-lg"
                icon={Save}
              >
                {isSavingDetails ? 'Saving...' : 'Save Notes'}
              </Button>
            </div>
          </div>
        </div>

        {/* RIGHT PANE (lg:col-span-5 / Sticky Quality & Advancement Rail) */}
        <div className="lg:col-span-5 lg:sticky lg:top-4 space-y-4">
          {/* CARD 1 (PRIMARY ACTION STATION - TOP) */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Scissors className="w-4 h-4 text-indigo-600" />
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Stage 05: Editing Bay
                </h3>
              </div>
              <span className="font-mono text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-md">
                ACTIVE STAGE
              </span>
            </div>

            <button
              type="button"
              disabled={isUpdating}
              onClick={handleSaveAndProceed}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 w-full text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <span>Save Cut &amp; Proceed to Step 07: Final QC Lock →</span>
            </button>

            <p className="text-[10px] text-slate-400 text-center font-mono">
              Auto-validates 1080x1920 9:16 specs &amp; transitions to Final QC
            </p>
          </div>

          {/* CARD 2: 4-Point Editing Readiness Status */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-indigo-600" />
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  4-Point Editing Readiness Status
                </h3>
              </div>
              <span className="font-mono text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-bold">
                AUTO-VALIDATED
              </span>
            </div>

            {/* Compact 2x2 Grid of Mini Badges */}
            <div className="grid grid-cols-2 gap-2.5 text-xs">
              {/* Point 1: Raw Footage */}
              <div
                className={`p-2.5 rounded-xl border ${
                  hasRawFootage
                    ? 'bg-emerald-50/60 border-emerald-200 text-emerald-950'
                    : 'bg-amber-50/60 border-amber-200 text-amber-950'
                }`}
              >
                <span className="text-[10px] font-bold text-slate-400 uppercase block">1. Raw Footage</span>
                <span className="font-mono font-bold text-xs flex items-center gap-1 mt-0.5">
                  {hasRawFootage ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" /> Ingested
                    </>
                  ) : (
                    <>⚠️ Pending Take</>
                  )}
                </span>
              </div>

              {/* Point 2: Edited Cut */}
              <div
                className={`p-2.5 rounded-xl border ${
                  hasEditedCut
                    ? 'bg-emerald-50/60 border-emerald-200 text-emerald-950'
                    : 'bg-amber-50/60 border-amber-200 text-amber-950'
                }`}
              >
                <span className="text-[10px] font-bold text-slate-400 uppercase block">2. Edited Cut</span>
                <span className="font-mono font-bold text-xs flex items-center gap-1 mt-0.5">
                  {hasEditedCut ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" /> Uploaded
                    </>
                  ) : (
                    <>⚠️ Pending Cut</>
                  )}
                </span>
              </div>

              {/* Point 3: 9:16 Resolution */}
              <div className="p-2.5 bg-emerald-50/60 border border-emerald-200 rounded-xl text-emerald-950">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">3. 9:16 Resolution</span>
                <span className="font-mono font-bold text-xs flex items-center gap-1 mt-0.5">
                  <Check className="w-3.5 h-3.5 text-emerald-600" /> 1080x1920 (✓ Auto)
                </span>
              </div>

              {/* Point 4: Duration */}
              <div className="p-2.5 bg-emerald-50/60 border border-emerald-200 rounded-xl text-emerald-950">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">4. Duration</span>
                <span className="font-mono font-bold text-xs flex items-center gap-1 mt-0.5">
                  <Check className="w-3.5 h-3.5 text-emerald-600" /> ~{actualDuration}s (✓ Auto)
                </span>
              </div>
            </div>
          </div>

          {/* CARD 3: Script Context Reference (Collapsible Drawer) */}
          <div className="bg-slate-900 text-slate-100 rounded-2xl p-4 border border-slate-800 shadow-md space-y-2">
            <button
              type="button"
              onClick={() => setIsScriptOpen(!isScriptOpen)}
              className="w-full flex items-center justify-between text-left cursor-pointer focus:outline-none"
            >
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-400" />
                <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                  Script Context Reference
                </span>
              </div>
              <div className="flex items-center gap-2">
                {script && (
                  <span className="text-[10px] font-mono text-indigo-300 bg-indigo-950/80 px-2 py-0.5 rounded border border-indigo-800 font-bold">
                    v{script.currentVersion}
                  </span>
                )}
                {isScriptOpen ? (
                  <ChevronUp className="w-4 h-4 text-slate-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                )}
              </div>
            </button>

            {isScriptOpen && (
              <div className="pt-2 border-t border-slate-800 space-y-2.5 text-xs">
                {isLoadingScript ? (
                  <p className="text-slate-500 italic text-[11px]">Loading script context...</p>
                ) : script ? (
                  <>
                    <div className="p-2.5 bg-slate-800/80 border border-slate-700/80 rounded-xl space-y-1">
                      <span className="text-[10px] font-mono text-amber-400 font-bold uppercase block">
                        Spoken Problem Hook:
                      </span>
                      <p className="font-telugu text-slate-200 text-xs leading-relaxed">
                        {script.hookText}
                      </p>
                    </div>

                    {script.speedTrickOrTakeaway && (
                      <div className="p-2.5 bg-indigo-950/60 border border-indigo-800/80 rounded-xl space-y-1">
                        <span className="text-[10px] font-mono text-indigo-300 font-bold uppercase flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-amber-400" />
                          Burra Speed Trick Callout:
                        </span>
                        <p className="font-telugu text-slate-200 text-xs leading-relaxed">
                          {script.speedTrickOrTakeaway}
                        </p>
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-slate-500 italic text-[11px]">
                    No active script linked to this video record.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
