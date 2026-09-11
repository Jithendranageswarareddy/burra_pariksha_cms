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
  Copy,
} from 'lucide-react';
import { Video, Script, VideoProductionStatus, AssignmentTaskType, RenderValidationStatus } from '../../types';
import { ProductionAssetValidationService } from '../../lib/services/production-asset-validation.service';
import { apiClient } from '../../lib/api-client';
import { Button } from '../common/Button';
import { VideoStatusBadge } from '../common/StatusBadge';
import { PRIORITY_CONFIG } from '../../config/constants';

interface EditingWorkspaceProps {
  videoId: string;
  video: Video;
  onStatusChange?: () => void;
  onNavigateTab?: (tab: 'script' | 'thumbnail' | 'pinned-comment' | 'publishing' | 'recording' | 'overview') => void;
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
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Notes & Asset URLs state
  const [editingNotes, setEditingNotes] = useState<string>(video.notes || '');
  const [driveUrl, setDriveUrl] = useState<string>(video.driveFolderUrl || '');
  const [rawFootageUrl, setRawFootageUrl] = useState<string>(video.rawFootagePath || '');
  const [finalRenderUrl, setFinalRenderUrl] = useState<string>(video.finalRenderPath || '');
  const [width, setWidth] = useState<string>(video.finalRenderWidth ? String(video.finalRenderWidth) : '');
  const [height, setHeight] = useState<string>(video.finalRenderHeight ? String(video.finalRenderHeight) : '');
  const [format, setFormat] = useState<string>(video.finalRenderFormat || '');
  const [aspectRatio, setAspectRatio] = useState<string>(video.finalRenderAspectRatio || '');
  const [actualDuration, setActualDuration] = useState<string>(video.actualDurationSeconds ? String(video.actualDurationSeconds) : '');
  const [isSavingDetails, setIsSavingDetails] = useState<boolean>(false);

  const copyToClipboard = async (fieldName: string, text: string) => {
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
      setCopiedField(fieldName);
      setTimeout(() => setCopiedField(null), 2500);
    } catch {
      setCopiedField(null);
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
      console.warn('Failed to load script for editing workspace:', err);
    } finally {
      setIsLoadingScript(false);
    }
  };

  useEffect(() => {
    fetchScript();
    setEditingNotes(video.notes || '');
    setDriveUrl(video.driveFolderUrl || '');
    setRawFootageUrl(video.rawFootagePath || '');
    setFinalRenderUrl(video.finalRenderPath || '');
    setWidth(video.finalRenderWidth ? String(video.finalRenderWidth) : '');
    setHeight(video.finalRenderHeight ? String(video.finalRenderHeight) : '');
    setFormat(video.finalRenderFormat || '');
    setAspectRatio(video.finalRenderAspectRatio || '');
    setActualDuration(video.actualDurationSeconds ? String(video.actualDurationSeconds) : '');
  }, [videoId, video]);

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
        rawFootagePath: rawFootageUrl,
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
                  disabled={isUpdating || liveValidation.status !== RenderValidationStatus.VALID}
                  onClick={handleCompleteEditing}
                  className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white"
                  icon={CheckCircle2}
                >
                  Complete Editing (EDITED)
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  disabled={isUpdating}
                  onClick={() => handleStatusTransition(VideoProductionStatus.FINAL_REVIEW)}
                  className="text-xs"
                  icon={ArrowRight}
                >
                  Send to Final Review (FINAL_REVIEW)
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  disabled={isUpdating}
                  onClick={() => handleStatusTransition(VideoProductionStatus.READY_TO_UPLOAD)}
                  className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                  icon={CheckCircle2}
                >
                  Ready to Upload (READY_TO_UPLOAD)
                </Button>
              </>
            )}

            {video.status === VideoProductionStatus.FINAL_REVIEW && (
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

      {/* Main Content Grid: Asset Links, Script Context & Assignments */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Drive & Render Asset References + Editing Notes */}
        <div className="lg:col-span-2 space-y-6">
          {/* Asset Links Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FolderKanban className="w-4 h-4 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900">Editing Asset & Drive References</h3>
              </div>
            </div>

            <div className="space-y-4 text-xs">
              {/* Quick Access Source Assets Overview */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <span className="font-bold text-slate-800 text-[11px] flex items-center gap-1.5">
                  <FolderKanban className="w-3.5 h-3.5 text-indigo-600" />
                  Editor Source Assets & Quick Links
                </span>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {/* Drive Folder */}
                  <div className="p-2.5 bg-white rounded-lg border border-slate-200 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase text-slate-500">Google Drive Folder</span>
                      <div className="flex items-center gap-1">
                        {video.driveFolderUrl && (
                          <>
                            <button
                              type="button"
                              onClick={() => copyToClipboard('driveUrl', video.driveFolderUrl || '')}
                              className="text-[10px] font-medium text-indigo-600 hover:text-indigo-800 flex items-center gap-0.5 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200"
                            >
                              {copiedField === 'driveUrl' ? <CheckCircle2 className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                              <span>{copiedField === 'driveUrl' ? 'Copied' : 'Copy'}</span>
                            </button>
                            <a
                              href={video.driveFolderUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[10px] font-medium text-slate-600 hover:text-indigo-600 flex items-center gap-0.5 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200"
                            >
                              <ExternalLink className="w-3 h-3" />
                              <span>Open Folder</span>
                            </a>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="font-mono text-[11px] text-slate-700 truncate">
                      {video.driveFolderUrl || <span className="text-slate-400 font-sans italic">No Google Drive folder linked</span>}
                    </div>
                  </div>

                  {/* Raw Footage Path */}
                  <div className="p-2.5 bg-white rounded-lg border border-slate-200 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase text-slate-500">Raw Footage Asset</span>
                      <div className="flex items-center gap-1">
                        {video.rawFootagePath && (
                          <>
                            <button
                              type="button"
                              onClick={() => copyToClipboard('rawPath', video.rawFootagePath || '')}
                              className="text-[10px] font-medium text-indigo-600 hover:text-indigo-800 flex items-center gap-0.5 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200"
                            >
                              {copiedField === 'rawPath' ? <CheckCircle2 className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                              <span>{copiedField === 'rawPath' ? 'Copied' : 'Copy'}</span>
                            </button>
                            {(video.rawFootagePath.startsWith('http://') || video.rawFootagePath.startsWith('https://')) && (
                              <a
                                href={video.rawFootagePath}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[10px] font-medium text-slate-600 hover:text-indigo-600 flex items-center gap-0.5 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200"
                              >
                                <ExternalLink className="w-3 h-3" />
                                <span>Open Asset</span>
                              </a>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                    <div className="font-mono text-[11px] text-slate-700 truncate">
                      {video.rawFootagePath || <span className="text-slate-400 font-sans italic">No raw footage asset recorded</span>}
                    </div>
                  </div>
                </div>
              </div>

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
                <label className="font-medium text-slate-700">Raw Footage Path / Drive File URL</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={rawFootageUrl}
                    onChange={(e) => setRawFootageUrl(e.target.value)}
                    placeholder="drive://... or https://drive.google.com/file/d/..."
                    className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono text-slate-800 focus:ring-1 focus:ring-indigo-500"
                  />
                  {rawFootageUrl && (rawFootageUrl.startsWith('http://') || rawFootageUrl.startsWith('https://')) && (
                    <a
                      href={rawFootageUrl}
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

        {/* Right Col: Script Preview Summary & Editing Assignments */}
        <div className="space-y-6">
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
