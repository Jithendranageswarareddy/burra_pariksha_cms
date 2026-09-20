import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import {
  ArrowLeft,
  Video,
  FileQuestion,
  Clock,
  Film,
  Calendar,
  Save,
  CheckCircle2,
  AlertTriangle,
  Play,
  RotateCcw,
  UploadCloud,
  XCircle,
  PauseCircle,
  History,
  Activity,
  UserCheck,
  Edit3,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Mic,
  Scissors,
  ShieldCheck,
  CheckCheck,
  Share2,
  FolderGit2,
} from 'lucide-react';
import { PageHeader } from '../components/layout/PageHeader';
import { Button } from '../components/common/Button';
import { VideoStatusBadge, QuestionStatusBadge } from '../components/common/StatusBadge';
import { DifficultyBadge } from '../components/common/DifficultyBadge';
import { EntityAssignmentsSection } from '../components/assignments/EntityAssignmentsSection';
import { apiClient } from '../lib/api-client';
import {
  DifficultyLevel,
  PriorityLevel,
  Video as VideoType,
  VideoProductionStatus,
  Workflow,
  AuditLog,
  Assignment,
} from '../types';
import { PRIORITY_CONFIG, VIDEO_STATUS_CONFIG, VALID_VIDEO_TRANSITIONS } from '../config/constants';
import { ScriptWorkspace } from '../components/video/ScriptWorkspace';
import { ThumbnailWorkspace } from '../components/video/ThumbnailWorkspace';
import { PinnedCommentWorkspace } from '../components/video/PinnedCommentWorkspace';
import { PublishingWorkspace } from '../components/video/PublishingWorkspace';
import { RecordingWorkspace } from '../components/video/RecordingWorkspace';
import { EditingWorkspace } from '../components/video/EditingWorkspace';
import { FinalReviewWorkspace } from '../components/video/FinalReviewWorkspace';
import { SocialReviewWorkspace } from '../components/social/SocialReviewWorkspace';
import { ProductionJourneyBar } from '../components/production/ProductionJourneyBar';
import { useProductionJourney } from '../contexts/ProductionJourneyContext';

export const VideoDetailPage: React.FC = () => {
  const { videoId } = useParams<{ videoId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { loadJourneyForVideo } = useProductionJourney();

  const [video, setVideo] = useState<VideoType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'script' | 'recording' | 'editing' | 'final-review' | 'social' | 'overview' | 'thumbnail' | 'pinned-comment' | 'publishing'>('script');

  const handleTabChange = (tab: 'script' | 'recording' | 'editing' | 'final-review' | 'social' | 'overview' | 'thumbnail' | 'pinned-comment' | 'publishing') => {
    setActiveTab(tab);
    navigate(`?tab=${tab}`, { replace: true });
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tabParam = params.get('tab');
    if (tabParam && ['script', 'recording', 'editing', 'final-review', 'social', 'overview', 'thumbnail', 'pinned-comment', 'publishing'].includes(tabParam)) {
      setActiveTab(tabParam as any);
    }
  }, [location.search]);

  // Status transition form state
  const [statusRemark, setStatusRemark] = useState('');
  const [actualDuration, setActualDuration] = useState<number | undefined>(undefined);

  // Edit metadata state
  const [isEditingMeta, setIsEditingMeta] = useState(false);
  const [editNotes, setEditNotes] = useState('');
  const [editHost, setEditHost] = useState('');
  const [editEditor, setEditEditor] = useState('');
  const [editDriveUrl, setEditDriveUrl] = useState('');
  const [editYoutubeId, setEditYoutubeId] = useState('');

  // Quick assignment modal state
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assigneeName, setAssigneeName] = useState('');
  const [assigneeRole, setAssigneeRole] = useState<'SCRIPTING' | 'RECORDING' | 'EDITING' | 'THUMBNAIL' | 'REVIEW'>('RECORDING');
  const [assignNotes, setAssignNotes] = useState('');

  const fetchVideoDetails = async () => {
    if (!videoId) return;
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const data = await apiClient.getVideoById(videoId);
      setVideo(data);
      setEditNotes(data.notes || '');
      setEditHost(data.assignedHost || '');
      setEditEditor(data.assignedEditor || '');
      setEditDriveUrl(data.driveFolderUrl || '');
      setEditYoutubeId(data.youtubeId || '');
      setActualDuration(data.actualDurationSeconds);
      loadJourneyForVideo(videoId, data);
    } catch (err: any) {
      setErrorMessage(err?.message || `Video "${videoId}" was not found in the authoritative database.`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVideoDetails();
  }, [videoId]);

  const handleStatusTransition = async (nextStatus: VideoProductionStatus) => {
    if (!videoId) return;
    setIsUpdating(true);
    setErrorMessage(null);
    try {
      const updated = await apiClient.updateVideoStatus(
        videoId,
        nextStatus,
        statusRemark.trim() || undefined,
        nextStatus === VideoProductionStatus.UPLOADED ? (actualDuration || 45) : undefined
      );
      setVideo((prev) => (prev ? { ...prev, ...updated, status: nextStatus } : updated));
      setStatusRemark('');
      setNotification(`Video status successfully transitioned to ${VIDEO_STATUS_CONFIG[nextStatus]?.label || nextStatus}.`);
      setTimeout(() => setNotification(null), 4000);
      // Refresh to pull new workflow & audit logs
      fetchVideoDetails();
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to update video status.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePriorityChange = async (newPriority: PriorityLevel) => {
    if (!videoId) return;
    setIsUpdating(true);
    try {
      const updated = await apiClient.updateVideoPriority(videoId, newPriority);
      setVideo((prev) => (prev ? { ...prev, priority: newPriority } : updated));
      setNotification(`Priority updated to ${PRIORITY_CONFIG[newPriority]?.label || newPriority}.`);
      setTimeout(() => setNotification(null), 3000);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to update priority.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSaveMetadata = async () => {
    if (!videoId) return;
    setIsUpdating(true);
    try {
      const updated = await apiClient.updateVideoMetadata(videoId, {
        notes: editNotes,
        assignedHost: editHost || undefined,
        assignedEditor: editEditor || undefined,
        driveFolderUrl: editDriveUrl || undefined,
        youtubeId: editYoutubeId || undefined,
      });
      setVideo((prev) => (prev ? { ...prev, ...updated } : updated));
      setIsEditingMeta(false);
      setNotification('Production metadata saved successfully.');
      setTimeout(() => setNotification(null), 3000);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to save metadata.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoId || !assigneeName.trim()) return;
    setIsUpdating(true);
    try {
      await apiClient.assignVideo(videoId, {
        assigneeId: `USR-${Date.now().toString().slice(-4)}`,
        assigneeName: assigneeName.trim(),
        taskType: assigneeRole,
        notes: assignNotes.trim() || undefined,
      });
      setShowAssignModal(false);
      setAssigneeName('');
      setAssignNotes('');
      setNotification(`Assigned ${assigneeRole} to ${assigneeName}.`);
      setTimeout(() => setNotification(null), 3000);
      fetchVideoDetails();
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to create assignment.');
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-20 space-y-4">
        <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-slate-500 font-mono">Loading video studio workspace...</p>
      </div>
    );
  }

  if (!video) {
    return (
      <div className="text-center py-16 space-y-4 bg-white rounded-2xl border border-slate-200 p-8 max-w-xl mx-auto">
        <AlertTriangle className="w-8 h-8 text-rose-500 mx-auto" />
        <h3 className="text-base font-bold text-slate-800">Video Record Not Found</h3>
        <p className="text-xs text-slate-500">
          The requested video ID "{videoId}" was not found in the VIDEOS worksheet.
        </p>
        <Link to="/production">
          <Button variant="outline" size="sm">
            Return to Production Tracker
          </Button>
        </Link>
      </div>
    );
  }

  const allowedNextTransitions = VALID_VIDEO_TRANSITIONS[video.status] || [];
  const priorityConfig = PRIORITY_CONFIG[video.priority] || PRIORITY_CONFIG[PriorityLevel.NORMAL];

  const activeStageCode =
    activeTab === 'script' ? 'AUDIENCE_SCRIPT' :
    activeTab === 'recording' ? 'TELEPROMPTER' :
    activeTab === 'editing' ? 'EDITING' :
    activeTab === 'final-review' ? 'FINAL_QC' :
    activeTab === 'social' ? 'SOCIAL_REVIEW' :
    activeTab === 'thumbnail' ? 'THUMBNAIL' :
    activeTab === 'publishing' ? 'PUBLISHING_SETUP' :
    'EDITING';

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-200 pb-16">
      {/* 15-Stage Continuous Production Journey Orchestration Bar */}
      <ProductionJourneyBar
        showDetails
        activeStage={activeStageCode}
        onNavigateTab={(tab) => handleTabChange(tab as any)}
      />

      {/* Notifications / Alerts */}
      {notification && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-start gap-2 animate-in fade-in">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Operation Error</p>
            <p className="mt-0.5">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* Condensed 40px Executive Strip */}
      <div className="bg-white rounded-xl border border-slate-200 px-3.5 py-2 shadow-2xs flex items-center justify-between flex-wrap gap-2.5">
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <Link
            to="/production"
            className="p-1 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-800 transition-colors"
            title="Back to Production Tracker"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>

          <span className="font-mono text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200">
            {video.id}
          </span>

          {video.contentMasterId ? (
            <Link
              to={`/content-masters/${encodeURIComponent(video.contentMasterId)}`}
              className="font-mono text-[11px] font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200 hover:bg-purple-100 transition-colors"
              title="View Content Master Explorer"
            >
              Master: {video.contentMasterId}
            </Link>
          ) : (
            <span className="text-[11px] font-mono bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md">
              Master: Not linked
            </span>
          )}

          <VideoStatusBadge status={video.status} size="sm" />

          <div className="flex items-center gap-1">
            <span className="text-[11px] text-slate-400 font-medium">Priority:</span>
            <select
              value={video.priority}
              onChange={(e) => handlePriorityChange(e.target.value as PriorityLevel)}
              disabled={isUpdating || video.status === VideoProductionStatus.CANCELLED || video.status === VideoProductionStatus.UPLOADED}
              className="text-[11px] border border-slate-200 rounded-md px-1.5 py-0.5 bg-slate-50 font-semibold text-slate-800 focus:outline-hidden cursor-pointer"
            >
              <option value={PriorityLevel.LOW}>Low</option>
              <option value={PriorityLevel.NORMAL}>Normal</option>
              <option value={PriorityLevel.HIGH}>High</option>
              <option value={PriorityLevel.URGENT}>Urgent</option>
            </select>
          </div>

          <span className="text-slate-300">|</span>

          <span className="text-slate-800 font-semibold truncate max-w-[260px]" title={video.title}>
            {video.title}
          </span>

          <Link
            to={`/questions/${video.questionId}`}
            className="font-mono text-[11px] text-indigo-600 hover:underline flex items-center gap-1 font-semibold ml-1"
          >
            <FileQuestion className="w-3.5 h-3.5" />
            <span>Ref: {video.questionId}</span>
          </Link>
        </div>

        <div className="flex items-center gap-1.5">
          <Link to={`/questions/${video.questionId}`}>
            <button
              type="button"
              className="px-2.5 py-1 text-xs border border-slate-200 rounded-lg bg-white text-slate-700 hover:bg-slate-50 font-semibold transition-all cursor-pointer flex items-center gap-1 shadow-2xs"
            >
              <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
              <span>View Question Record</span>
            </button>
          </Link>
        </div>
      </div>

      {/* Full-Width Workspace Canvas */}
      <div className="w-full space-y-6">
        {/* Stage 1: Script Workspace */}
        {activeTab === 'script' && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
            <ScriptWorkspace
              videoId={video.id}
              videoStatus={video.status}
              onStatusChange={fetchVideoDetails}
              onNavigateTab={handleTabChange}
            />
          </div>
        )}

        {/* Stage 2: Recording Workspace */}
        {activeTab === 'recording' && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
            <RecordingWorkspace
              videoId={video.id}
              video={video}
              onStatusChange={fetchVideoDetails}
              onNavigateTab={(tab) => handleTabChange(tab as any)}
            />
          </div>
        )}

        {/* Stage 3: Editing Workspace */}
        {activeTab === 'editing' && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
            <EditingWorkspace
              videoId={video.id}
              video={video}
              onStatusChange={fetchVideoDetails}
              onNavigateTab={(tab) => handleTabChange(tab as any)}
            />
          </div>
        )}

        {/* Stage 4: Final Review Workspace */}
        {activeTab === 'final-review' && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
            <FinalReviewWorkspace
              videoId={video.id}
              video={video}
              onStatusChange={fetchVideoDetails}
              onNavigateTab={(tab) => handleTabChange(tab as any)}
            />
          </div>
        )}

        {/* Stage 5: Social Review & Simulator */}
        {activeTab === 'social' && (
          <div className="bg-white border border-slate-200 rounded-2xl p-2 sm:p-4 shadow-xs">
            <SocialReviewWorkspace
              questionId={video.questionId}
              videoId={video.id}
              driveFolderUrl={video.driveFolderUrl}
              onReviewSubmitted={fetchVideoDetails}
              onNavigateTab={(tab) => handleTabChange(tab as any)}
            />
          </div>
        )}

        {/* Step 08: Thumbnail Studio */}
        {activeTab === 'thumbnail' && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
            <ThumbnailWorkspace
              videoId={video.id}
              videoTitle={video.title}
              video={video}
              onStatusChange={fetchVideoDetails}
              onNavigateTab={(tab) => handleTabChange(tab as any)}
            />
          </div>
        )}

        {/* Extra Tab: Pinned Comment */}
        {activeTab === 'pinned-comment' && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
            <PinnedCommentWorkspace
              videoId={video.id}
              onStatusChange={fetchVideoDetails}
            />
          </div>
        )}

        {/* Extra Tab: Manual Publishing */}
        {activeTab === 'publishing' && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
            <PublishingWorkspace
              video={video}
              onStatusChange={fetchVideoDetails}
              onNavigateTab={(tab) => handleTabChange(tab as any)}
            />
          </div>
        )}

        {/* Extra Tab: Overview & Stage Actions */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Status Transition Control Panel */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Film className="w-4 h-4 text-indigo-600" />
                  <h3 className="text-sm font-bold text-slate-900">Production Stage Actions</h3>
                </div>
                <span className="text-xs text-slate-400 font-mono">State Machine Guard Active</span>
              </div>

              {video.status === VideoProductionStatus.UPLOADED && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-xs flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div>
                    <p className="font-bold">Video Production Complete &amp; Published</p>
                    <p className="text-emerald-700 mt-0.5">
                      This video has reached the terminal UPLOADED state. It is ready for distribution across Burra Pariksha channels.
                    </p>
                  </div>
                </div>
              )}

              {video.status === VideoProductionStatus.CANCELLED && (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-900 text-xs flex items-center gap-3">
                  <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
                  <div>
                    <p className="font-bold">Video Production Cancelled</p>
                    <p className="text-rose-700 mt-0.5">
                      This production item has been marked CANCELLED (terminal state). To restart, re-queue the question from the Question Library.
                    </p>
                  </div>
                </div>
              )}

              {video.status !== VideoProductionStatus.UPLOADED && video.status !== VideoProductionStatus.CANCELLED && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Transition Remarks / Stage Notes (Logged in WORKFLOW sheet)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., Script approved by host, raw footage recorded at studio 2..."
                      value={statusRemark}
                      onChange={(e) => setStatusRemark(e.target.value)}
                      className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  {video.status === VideoProductionStatus.READY_TO_UPLOAD && (
                    <div className="p-3 bg-teal-50 border border-teal-200 rounded-lg space-y-2">
                      <label className="block text-xs font-semibold text-teal-900">
                        Actual Rendered Duration (Seconds)
                      </label>
                      <input
                        type="number"
                        value={actualDuration || 45}
                        onChange={(e) => setActualDuration(Number(e.target.value))}
                        className="w-32 text-xs px-3 py-1.5 border border-teal-300 rounded-md font-mono"
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                      Permitted Next Transitions:
                    </span>
                    <div className="flex flex-wrap gap-2.5">
                      {allowedNextTransitions.map((next) => {
                        const nextCfg = VIDEO_STATUS_CONFIG[next];
                        const isUpload = next === VideoProductionStatus.UPLOADED;
                        const isHold = next === VideoProductionStatus.ON_HOLD;
                        const isCancel = next === VideoProductionStatus.CANCELLED;

                        return (
                          <Button
                            key={next}
                            variant={isUpload ? 'primary' : isCancel ? 'danger' : 'outline'}
                            size="sm"
                            disabled={isUpdating}
                            onClick={() => handleStatusTransition(next)}
                            className={`text-xs flex items-center gap-1.5 ${
                              isHold ? 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100' : ''
                            }`}
                          >
                            {isUpload && <UploadCloud className="w-3.5 h-3.5" />}
                            {isHold && <PauseCircle className="w-3.5 h-3.5 text-amber-600" />}
                            {isCancel && <XCircle className="w-3.5 h-3.5 text-rose-600" />}
                            {!isUpload && !isHold && !isCancel && <Play className="w-3 h-3 text-indigo-600" />}
                            <span>Move to {nextCfg?.label || next}</span>
                          </Button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Workflow Status Transition History */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <History className="w-4 h-4 text-indigo-600" />
                  <h3 className="text-sm font-bold text-slate-900">Workflow State Transitions</h3>
                </div>
                <span className="text-[11px] text-slate-400 font-mono">WORKFLOW Worksheet</span>
              </div>

              {video.workflowHistory && video.workflowHistory.length > 0 ? (
                <div className="divide-y divide-slate-100">
                  {video.workflowHistory.map((wf) => (
                    <div key={wf.id} className="py-2.5 text-xs flex items-start justify-between gap-3">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">
                            {wf.fromStatus}
                          </span>
                          <span className="text-slate-400">&rarr;</span>
                          <span className="font-mono text-[10px] bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded font-semibold">
                            {wf.toStatus}
                          </span>
                        </div>
                        {wf.remarks && <p className="text-slate-600 text-[11px] pt-0.5">{wf.remarks}</p>}
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-slate-500 font-medium">{wf.triggeredBy || wf.actorName || 'System'}</p>
                        <p className="text-[10px] text-slate-400 font-mono">
                          {new Date(wf.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 py-3 text-center">No workflow transition logs recorded yet.</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Task Assignment Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Assign Production Task</h3>
            <form onSubmit={handleCreateAssignment} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Assignee Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sravani (Host), Ramesh (Editor)"
                  value={assigneeName}
                  onChange={(e) => setAssigneeName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Task Type</label>
                <select
                  value={assigneeRole}
                  onChange={(e) => setAssigneeRole(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                >
                  <option value="SCRIPTING">Scripting / Review</option>
                  <option value="RECORDING">Host Recording</option>
                  <option value="EDITING">Video Editing &amp; Motion Graphics</option>
                  <option value="THUMBNAIL">Thumbnail Creation</option>
                  <option value="REVIEW">Final Review / QC</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Assignment Notes (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="Specific guidelines for this stage..."
                  value={assignNotes}
                  onChange={(e) => setAssignNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button variant="outline" size="sm" type="button" onClick={() => setShowAssignModal(false)}>
                  Cancel
                </Button>
                <Button variant="primary" size="sm" type="submit" disabled={isUpdating}>
                  Confirm Assignment
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default VideoDetailPage;
