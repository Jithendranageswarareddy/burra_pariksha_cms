import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  FileText,
  Image as ImageIcon,
  MessageSquare,
  FolderKanban,
  User,
  Calendar,
  Clock,
  ArrowRight,
  RotateCcw,
  ExternalLink,
} from 'lucide-react';
import { Video, Script, Thumbnail, PinnedComment, VideoProductionStatus, AssignmentTaskType } from '../../types';
import { apiClient } from '../../lib/api-client';
import { Button } from '../common/Button';
import { VideoStatusBadge } from '../common/StatusBadge';
import { PRIORITY_CONFIG } from '../../config/constants';

interface FinalReviewWorkspaceProps {
  videoId: string;
  video: Video;
  onStatusChange?: () => void;
  onNavigateTab?: (tab: 'script' | 'thumbnail' | 'pinned-comment' | 'editing' | 'publishing' | 'recording' | 'overview') => void;
}

export const FinalReviewWorkspace: React.FC<FinalReviewWorkspaceProps> = ({
  videoId,
  video,
  onStatusChange,
  onNavigateTab,
}) => {
  const [script, setScript] = useState<Script | null>(null);
  const [thumbnail, setThumbnail] = useState<Thumbnail | null>(null);
  const [pinnedComment, setPinnedComment] = useState<PinnedComment | null>(null);
  const [readiness, setReadiness] = useState<any | null>(null);
  const [isLoadingData, setIsLoadingData] = useState<boolean>(true);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Return remarks state for sending back to editing
  const [returnRemarks, setReturnRemarks] = useState<string>('');
  const [showReturnModal, setShowReturnModal] = useState<boolean>(false);

  const fetchSupportingData = async () => {
    try {
      setIsLoadingData(true);
      setError(null);
      const [scriptRes, thumbRes, commentRes, readinessRes] = await Promise.all([
        apiClient.getScript(videoId).catch(() => ({ script: null })),
        apiClient.getThumbnail(videoId).catch(() => ({ thumbnail: null })),
        apiClient.getPinnedComment(videoId).catch(() => ({ pinnedComment: null })),
        apiClient.getVideoPublishReadiness(videoId).catch(() => null),
      ]);

      if (scriptRes?.script) setScript(scriptRes.script);
      if (thumbRes?.thumbnail) setThumbnail(thumbRes.thumbnail);
      if (commentRes?.pinnedComment) setPinnedComment(commentRes.pinnedComment);
      if (readinessRes) setReadiness(readinessRes);
    } catch (err: any) {
      console.warn('Failed to load full review supporting assets:', err);
    } finally {
      setIsLoadingData(false);
    }
  };

  useEffect(() => {
    fetchSupportingData();
  }, [videoId]);

  const handleStatusTransition = async (nextStatus: VideoProductionStatus, remarks?: string) => {
    setIsUpdating(true);
    setError(null);
    setSuccessMessage(null);
    try {
      await apiClient.updateVideoStatus(
        videoId,
        nextStatus,
        remarks || `Transitioned to ${nextStatus} via Final Review Workspace`
      );
      setSuccessMessage(`Successfully transitioned video status to ${nextStatus}.`);
      setShowReturnModal(false);
      setReturnRemarks('');
      if (onStatusChange) {
        onStatusChange();
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to update video status.');
    } finally {
      setIsUpdating(false);
    }
  };

  const reviewAssignments = (video.assignments || []).filter(
    (a) => a.taskType === AssignmentTaskType.REVIEW || a.assignmentRole === 'REVIEWER' || a.assignmentRole === 'CONTENT_MANAGER'
  );

  const priorityCfg = PRIORITY_CONFIG[video.priority] || PRIORITY_CONFIG['NORMAL'];

  // Checklist evaluation
  const isQuestionAvailable = Boolean(video.questionId);
  const isScriptApproved = Boolean(script && script.currentVersion > 0);
  const isThumbnailApproved = thumbnail?.status === 'APPROVED';
  const isPinnedCommentApproved = pinnedComment?.isApproved === true;
  const isMetadataValid = Boolean(video.title && video.targetDurationSeconds);
  const isReadyForUploadState = readiness?.isReady === true;

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
            {video.status === VideoProductionStatus.EDITING && (
              <Button
                variant="primary"
                size="sm"
                disabled={isUpdating}
                onClick={() => handleStatusTransition(VideoProductionStatus.FINAL_REVIEW)}
                className="text-xs"
                icon={ShieldCheck}
              >
                Pull to Final Review
              </Button>
            )}

            {video.status === VideoProductionStatus.FINAL_REVIEW && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isUpdating}
                  onClick={() => setShowReturnModal(true)}
                  className="text-xs text-rose-600 border-rose-200 hover:bg-rose-50"
                  icon={RotateCcw}
                >
                  Send Back for Editing
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  disabled={isUpdating || !isReadyForUploadState}
                  onClick={() => handleStatusTransition(VideoProductionStatus.READY_TO_UPLOAD)}
                  className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                  icon={ArrowRight}
                >
                  Approve for Upload (READY_TO_UPLOAD)
                </Button>
              </>
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
              <FileText className="w-3.5 h-3.5 text-indigo-500" /> Linked Question ID
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
              <User className="w-3.5 h-3.5 text-indigo-500" /> Assigned Reviewer
            </span>
            <span className="font-medium text-slate-800">
              {reviewAssignments[0]?.assigneeName || 'Content Manager / Reviewer'}
            </span>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/60 space-y-1">
            <span className="text-slate-400 font-medium flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-indigo-500" /> Target Duration
            </span>
            <span className="font-mono font-medium text-slate-800">{video.targetDurationSeconds || 45} seconds</span>
          </div>
        </div>
      </div>

      {/* Return to Editing Modal / Prompt */}
      {showReturnModal && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl space-y-3">
          <h3 className="text-xs font-bold text-rose-900 flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-rose-600" /> Send Video Back for Editing
          </h3>
          <p className="text-xs text-rose-700">
            Provide review feedback / remarks explaining why this edit requires rework before it can return to the EDITING stage:
          </p>
          <textarea
            rows={3}
            value={returnRemarks}
            onChange={(e) => setReturnRemarks(e.target.value)}
            placeholder="Describe required edits, audio fixes, or pacing adjustments..."
            className="w-full text-xs p-3 bg-white border border-rose-300 rounded-lg text-slate-800 focus:ring-1 focus:ring-rose-500"
          />
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowReturnModal(false)}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              disabled={isUpdating || !returnRemarks.trim()}
              onClick={() => handleStatusTransition(VideoProductionStatus.EDITING, returnRemarks)}
              className="text-xs bg-rose-600 hover:bg-rose-700 text-white"
            >
              Confirm Return to Editing
            </Button>
          </div>
        </div>
      )}

      {/* Main Content Grid: Review Checklist & Asset Status Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Review Checklist & Publishing Readiness Summary */}
        <div className="lg:col-span-2 space-y-6">
          {/* Review Checklist Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900">Production Review Checklist</h3>
              </div>
              <span className="text-[11px] text-slate-500">Authoritative Gateway</span>
            </div>

            {isLoadingData ? (
              <div className="py-8 text-center text-xs text-slate-400 font-mono">Evaluating verification checklist...</div>
            ) : (
              <div className="space-y-3 text-xs">
                {/* 1. Question Available */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    {isQuestionAvailable ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    )}
                    <div>
                      <p className="font-bold text-slate-800">Linked Question Record</p>
                      <p className="text-slate-500 text-[11px]">ID: {video.questionId || 'None'}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${isQuestionAvailable ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                    {isQuestionAvailable ? 'PASS' : 'BLOCKED'}
                  </span>
                </div>

                {/* 2. Script Available / Approved */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    {isScriptApproved ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                    )}
                    <div>
                      <p className="font-bold text-slate-800">Approved Script Context</p>
                      <p className="text-slate-500 text-[11px]">Version: {script ? `v${script.currentVersion}` : 'Missing'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {onNavigateTab && (
                      <button
                        type="button"
                        onClick={() => onNavigateTab('script')}
                        className="text-indigo-600 hover:underline text-[11px] font-medium"
                      >
                        Inspect
                      </button>
                    )}
                    <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${isScriptApproved ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                      {isScriptApproved ? 'PASS' : 'WARNING'}
                    </span>
                  </div>
                </div>

                {/* 3. Thumbnail Approved */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    {isThumbnailApproved ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                    )}
                    <div>
                      <p className="font-bold text-slate-800">Thumbnail Approval Status</p>
                      <p className="text-slate-500 text-[11px]">Status: {thumbnail?.status || 'NOT_SUBMITTED'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {onNavigateTab && (
                      <button
                        type="button"
                        onClick={() => onNavigateTab('thumbnail')}
                        className="text-indigo-600 hover:underline text-[11px] font-medium"
                      >
                        Inspect
                      </button>
                    )}
                    <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${isThumbnailApproved ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                      {isThumbnailApproved ? 'PASS' : 'WARNING'}
                    </span>
                  </div>
                </div>

                {/* 4. Pinned Comment Approved */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    {isPinnedCommentApproved ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                    )}
                    <div>
                      <p className="font-bold text-slate-800">Pinned Comment Approval</p>
                      <p className="text-slate-500 text-[11px]">Approved: {pinnedComment?.isApproved ? 'Yes' : 'No'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {onNavigateTab && (
                      <button
                        type="button"
                        onClick={() => onNavigateTab('pinned-comment')}
                        className="text-indigo-600 hover:underline text-[11px] font-medium"
                      >
                        Inspect
                      </button>
                    )}
                    <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${isPinnedCommentApproved ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                      {isPinnedCommentApproved ? 'PASS' : 'WARNING'}
                    </span>
                  </div>
                </div>

                {/* 5. Video Metadata Valid */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    {isMetadataValid ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    )}
                    <div>
                      <p className="font-bold text-slate-800">Video Metadata & Drive Asset</p>
                      <p className="text-slate-500 text-[11px]">Title & Duration Configured</p>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${isMetadataValid ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                    {isMetadataValid ? 'PASS' : 'BLOCKED'}
                  </span>
                </div>

                {/* 6. Publishing Readiness Summary */}
                <div className="p-3.5 bg-indigo-50/50 border border-indigo-200 rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-indigo-900">Publishing Readiness (Backend Gateway)</span>
                    <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${readiness?.isReady ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                      {readiness?.isReady ? 'READY (PASS)' : 'BLOCKED / WARNINGS'}
                    </span>
                  </div>
                  {readiness?.blockers && readiness.blockers.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-[11px] font-semibold text-rose-700">Blockers:</p>
                      <ul className="list-disc list-inside text-[11px] text-rose-600">
                        {readiness.blockers.map((b: string, i: number) => (
                          <li key={i}>{b}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {readiness?.warnings && readiness.warnings.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-[11px] font-semibold text-amber-700">Warnings:</p>
                      <ul className="list-disc list-inside text-[11px] text-amber-600">
                        {readiness.warnings.map((w: string, i: number) => (
                          <li key={i}>{w}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Col: Navigation & Quick Workspace Links */}
        <div className="space-y-6">
          {/* Quick Workspace Navigation Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FolderKanban className="w-4 h-4 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900">Workflow Workspaces</h3>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <button
                type="button"
                onClick={() => onNavigateTab && onNavigateTab('script')}
                className="w-full p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg flex items-center justify-between text-slate-700 font-medium transition-colors"
              >
                <span className="flex items-center gap-2"><FileText className="w-3.5 h-3.5 text-indigo-600" /> Script Workspace</span>
                <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
              </button>

              <button
                type="button"
                onClick={() => onNavigateTab && onNavigateTab('thumbnail')}
                className="w-full p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg flex items-center justify-between text-slate-700 font-medium transition-colors"
              >
                <span className="flex items-center gap-2"><ImageIcon className="w-3.5 h-3.5 text-indigo-600" /> Thumbnail Workspace</span>
                <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
              </button>

              <button
                type="button"
                onClick={() => onNavigateTab && onNavigateTab('pinned-comment')}
                className="w-full p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg flex items-center justify-between text-slate-700 font-medium transition-colors"
              >
                <span className="flex items-center gap-2"><MessageSquare className="w-3.5 h-3.5 text-indigo-600" /> Pinned Comment</span>
                <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
              </button>

              <button
                type="button"
                onClick={() => onNavigateTab && onNavigateTab('editing')}
                className="w-full p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg flex items-center justify-between text-slate-700 font-medium transition-colors"
              >
                <span className="flex items-center gap-2"><FolderKanban className="w-3.5 h-3.5 text-indigo-600" /> Editing Workspace</span>
                <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
              </button>

              <button
                type="button"
                onClick={() => onNavigateTab && onNavigateTab('publishing')}
                className="w-full p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg flex items-center justify-between text-slate-700 font-medium transition-colors"
              >
                <span className="flex items-center gap-2"><ExternalLink className="w-3.5 h-3.5 text-indigo-600" /> Publishing Gateway</span>
                <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
              </button>
            </div>
          </div>

          {/* Production Notes Reference */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900">Production Notes</h3>
              </div>
            </div>
            <p className="text-xs text-slate-600 italic bg-slate-50 p-3 rounded-lg border border-slate-200">
              {video.notes || 'No operational notes recorded for this video.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
