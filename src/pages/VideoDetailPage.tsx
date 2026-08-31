import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Video,
  FileQuestion,
  Clock,
  User,
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
} from 'lucide-react';
import { PageHeader } from '../components/layout/PageHeader';
import { Button } from '../components/common/Button';
import { VideoStatusBadge, QuestionStatusBadge } from '../components/common/StatusBadge';
import { DifficultyBadge } from '../components/common/DifficultyBadge';
import { PipelineProgress } from '../components/production/PipelineProgress';
import { EntityAssignmentsSection } from '../components/assignments/EntityAssignmentsSection';
import { apiClient } from '../lib/api-client';
import {
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

export const VideoDetailPage: React.FC = () => {
  const { videoId } = useParams<{ videoId: string }>();
  const navigate = useNavigate();

  const [video, setVideo] = useState<VideoType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'script' | 'thumbnail' | 'pinned-comment' | 'publishing'>('overview');

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
        <p className="text-xs text-slate-500 font-mono">Loading video production record from Google Sheets...</p>
      </div>
    );
  }

  if (!video) {
    return (
      <div className="text-center py-16 space-y-4 bg-white rounded-xl border border-slate-200 p-8 max-w-xl mx-auto">
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

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-in fade-in duration-200 pb-16">
      {/* Top Breadcrumb & Quick Nav */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Link to="/production" className="hover:text-slate-900 font-medium flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Production Tracker</span>
          </Link>
          <ChevronRight className="w-3 h-3 text-slate-400" />
          <span className="font-mono text-indigo-600 font-semibold">{video.id}</span>
        </div>

        <div className="flex items-center gap-2">
          <Link to="/queue">
            <Button variant="outline" size="sm" className="text-xs">
              View Video Queue
            </Button>
          </Link>
          <Link to={`/questions/${video.questionId}`}>
            <Button variant="outline" size="sm" icon={FileQuestion} className="text-xs">
              View Question Record
            </Button>
          </Link>
        </div>
      </div>

      {/* Notifications / Alerts */}
      {notification && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg flex items-center gap-2.5 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-lg flex items-start gap-2.5 animate-in fade-in">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Operation Error</p>
            <p className="mt-0.5">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* Main Header Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="space-y-1.5 flex-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="font-mono text-sm font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded border border-indigo-200">
                {video.id}
              </span>
              <VideoStatusBadge status={video.status} size="md" />
              <span className={`text-xs px-2.5 py-1 rounded font-semibold ${priorityConfig.bg} ${priorityConfig.text}`}>
                Priority: {priorityConfig.label}
              </span>
              {video.actualDurationSeconds ? (
                <span className="text-xs font-mono bg-slate-100 text-slate-700 px-2 py-1 rounded font-medium">
                  {video.actualDurationSeconds}s (Actual Duration)
                </span>
              ) : (
                <span className="text-xs font-mono bg-slate-100 text-slate-500 px-2 py-1 rounded">
                  {video.targetDurationSeconds || 45}s Target
                </span>
              )}
            </div>
            <h1 className="text-lg font-bold text-slate-900 leading-tight pt-1">{video.title}</h1>
            <p className="text-xs text-slate-500 flex items-center gap-2">
              <span>Ref Question:</span>
              <Link
                to={`/questions/${video.questionId}`}
                className="font-mono text-indigo-600 hover:underline font-semibold"
              >
                {video.questionId}
              </Link>
              <span>• Created: {new Date(video.createdAt).toLocaleDateString()}</span>
              <span>• Updated: {new Date(video.updatedAt).toLocaleTimeString()}</span>
            </p>
          </div>

          {/* Quick Priority & Action Bar */}
          <div className="flex items-center gap-2 shrink-0">
            <label className="text-xs font-medium text-slate-500">Priority:</label>
            <select
              value={video.priority}
              onChange={(e) => handlePriorityChange(e.target.value as PriorityLevel)}
              disabled={isUpdating || video.status === VideoProductionStatus.CANCELLED || video.status === VideoProductionStatus.UPLOADED}
              className="text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white font-medium text-slate-800 focus:ring-indigo-500 cursor-pointer"
            >
              <option value={PriorityLevel.LOW}>Low</option>
              <option value={PriorityLevel.NORMAL}>Normal / Medium</option>
              <option value={PriorityLevel.HIGH}>High</option>
              <option value={PriorityLevel.URGENT}>Urgent</option>
            </select>
          </div>
        </div>

        {/* Visual Pipeline Progress */}
        <div className="pt-3 border-t border-slate-100">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Production Stage Flow
          </div>
          <PipelineProgress currentStatus={video.status} />
        </div>
      </div>

      {/* Production & Asset Workspace Tabs */}
      <div className="flex border-b border-slate-200 gap-1 text-xs font-semibold overflow-x-auto bg-white p-1 rounded-xl border shadow-2xs">
        <button
          type="button"
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2.5 rounded-lg flex items-center gap-2 transition-all shrink-0 ${
            activeTab === 'overview'
              ? 'bg-indigo-50 text-indigo-700 font-bold border border-indigo-200'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Film className="w-4 h-4" />
          <span>Stage Flow & Details</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('script')}
          className={`px-4 py-2.5 rounded-lg flex items-center gap-2 transition-all shrink-0 ${
            activeTab === 'script'
              ? 'bg-indigo-50 text-indigo-700 font-bold border border-indigo-200'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Edit3 className="w-4 h-4" />
          <span>Script Workspace</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('thumbnail')}
          className={`px-4 py-2.5 rounded-lg flex items-center gap-2 transition-all shrink-0 ${
            activeTab === 'thumbnail'
              ? 'bg-indigo-50 text-indigo-700 font-bold border border-indigo-200'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Thumbnail Asset</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('pinned-comment')}
          className={`px-4 py-2.5 rounded-lg flex items-center gap-2 transition-all shrink-0 ${
            activeTab === 'pinned-comment'
              ? 'bg-indigo-50 text-indigo-700 font-bold border border-indigo-200'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Pinned Comment</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('publishing')}
          className={`px-4 py-2.5 rounded-lg flex items-center gap-2 transition-all shrink-0 ${
            activeTab === 'publishing'
              ? 'bg-indigo-50 text-indigo-700 font-bold border border-indigo-200'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <UploadCloud className="w-4 h-4" />
          <span>Manual Publishing</span>
        </button>
      </div>

      {/* Tab 1: Overview & Stage Actions */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Production Controls & Question Preview */}
        <div className="lg:col-span-2 space-y-6">
          {/* Status Transition Control Panel */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Film className="w-4 h-4 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900">Production Stage Actions</h3>
              </div>
              <span className="text-xs text-slate-400 font-mono">State Machine Guard Active</span>
            </div>

            {video.status === VideoProductionStatus.UPLOADED && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-900 text-xs flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <p className="font-bold">Video Production Complete & Published</p>
                  <p className="text-emerald-700 mt-0.5">
                    This video has reached the terminal UPLOADED state. It is ready for distribution across Burra Pariksha channels.
                  </p>
                </div>
              </div>
            )}

            {video.status === VideoProductionStatus.CANCELLED && (
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg text-rose-900 text-xs flex items-center gap-3">
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
                {/* Optional Status Transition Remarks */}
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

                {/* Available Action Buttons */}
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

          {/* Question Preview Card */}
          {video.question && (
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <FileQuestion className="w-4 h-4 text-indigo-600" />
                  <h3 className="text-sm font-bold text-slate-900">Referenced Question Record</h3>
                </div>
                <div className="flex items-center gap-2">
                  <QuestionStatusBadge status={video.question.status} size="sm" />
                  <DifficultyBadge difficulty={video.question.difficulty} />
                </div>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                <p className="text-xs text-slate-500 font-mono mb-1">
                  Taxonomy: {video.question.categoryName} &gt; {video.question.topicName} &gt; {video.question.subtopicName}
                </p>
                <h4 className="text-sm font-semibold text-slate-900 leading-relaxed">
                  {video.question.questionText}
                </h4>
              </div>

              {/* Options Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {(['a', 'b', 'c', 'd'] as const).map((optKey) => {
                  const isCorrect = video.question?.correctAnswer?.toLowerCase() === optKey;
                  const text = video.question?.options?.[optKey];
                  if (!text) return null;

                  return (
                    <div
                      key={optKey}
                      className={`p-3 rounded-lg border text-xs flex items-start gap-2.5 ${
                        isCorrect
                          ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950 font-medium'
                          : 'bg-white border-slate-200 text-slate-700'
                      }`}
                    >
                      <span
                        className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 ${
                          isCorrect ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {optKey.toUpperCase()}
                      </span>
                      <div className="flex-1 leading-snug">{text}</div>
                    </div>
                  );
                })}
              </div>

              {/* Explanation & Context */}
              {video.question.explanation && (
                <div className="p-3.5 bg-indigo-50/50 border border-indigo-100 rounded-lg text-xs space-y-1">
                  <span className="font-bold text-indigo-900">Explanation & Trick:</span>
                  <p className="text-slate-700 leading-relaxed">{video.question.explanation}</p>
                </div>
              )}

              {video.question.realWorldContext && (
                <div className="p-3 bg-amber-50/60 border border-amber-200 rounded-lg text-xs space-y-0.5">
                  <span className="font-bold text-amber-900">Real-World Application Hook:</span>
                  <p className="text-amber-800">{video.question.realWorldContext}</p>
                </div>
              )}
            </div>
          )}

          {/* Workflow Status Transition History */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
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

        {/* Right 1 Col: Production Metadata, Assignments & Audit Feed */}
        <div className="space-y-6">
          {/* Metadata & Assignees Panel */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900">Production Staff & Assets</h3>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditingMeta(!isEditingMeta)}
                className="text-xs p-1 h-7"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </Button>
            </div>

            {!isEditingMeta ? (
              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Assigned Host</span>
                  <span className="font-medium text-slate-800">{video.assignedHost || '— Unassigned —'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Assigned Editor</span>
                  <span className="font-medium text-slate-800">{video.assignedEditor || '— Unassigned —'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Drive Folder URL</span>
                  {video.driveFolderUrl ? (
                    <a
                      href={video.driveFolderUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-indigo-600 hover:underline flex items-center gap-1 mt-0.5 truncate"
                    >
                      <span className="truncate">{video.driveFolderUrl}</span>
                      <ExternalLink className="w-3 h-3 shrink-0" />
                    </a>
                  ) : (
                    <span className="text-slate-400">Not configured</span>
                  )}
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">YouTube Shorts Ref</span>
                  <span className="font-mono text-slate-800">{video.youtubeId || 'Not uploaded'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Production Notes</span>
                  <p className="text-slate-700 bg-slate-50 p-2.5 rounded-lg mt-1 whitespace-pre-wrap leading-relaxed">
                    {video.notes || 'No specific production notes provided.'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Assigned Host</label>
                  <input
                    type="text"
                    value={editHost}
                    onChange={(e) => setEditHost(e.target.value)}
                    placeholder="e.g. Lead Host / Sravani"
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Assigned Editor</label>
                  <input
                    type="text"
                    value={editEditor}
                    onChange={(e) => setEditEditor(e.target.value)}
                    placeholder="e.g. Video Editor / Ramesh"
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Drive Folder URL</label>
                  <input
                    type="text"
                    value={editDriveUrl}
                    onChange={(e) => setEditDriveUrl(e.target.value)}
                    placeholder="https://drive.google.com/..."
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg font-mono text-[11px]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">YouTube Shorts ID</label>
                  <input
                    type="text"
                    value={editYoutubeId}
                    onChange={(e) => setEditYoutubeId(e.target.value)}
                    placeholder="e.g. dQw4w9WgXcQ"
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg font-mono text-[11px]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Production Notes</label>
                  <textarea
                    rows={3}
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
                <div className="flex items-center gap-2 pt-2">
                  <Button variant="primary" size="sm" onClick={handleSaveMetadata} disabled={isUpdating}>
                    <Save className="w-3.5 h-3.5 mr-1" />
                    Save Metadata
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setIsEditingMeta(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Phase 10: Rich Entity Assignments Section */}
          <EntityAssignmentsSection
            entityType="VIDEO"
            entityId={video.id}
            title="Video Task Assignments"
            defaultTaskType="RECORDING"
          />

          {/* Audit Trail Feed */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900">Audit Trail</h3>
              </div>
              <span className="text-[11px] text-slate-400 font-mono">AUDIT_LOG</span>
            </div>

            {video.auditLogs && video.auditLogs.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {video.auditLogs.map((log) => (
                  <div key={log.id} className="py-2 text-xs flex items-start gap-2.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                    <div className="space-y-0.5 flex-1">
                      <p className="text-slate-800 font-medium">
                        <span className="font-semibold">{log.actorName}</span>: {log.action}
                      </p>
                      <p className="text-[10px] text-slate-400 font-mono">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 py-2 text-center">No audit log entries found.</p>
            )}
          </div>
        </div>
      </div>
      )}

      {/* Tab 2: Script Management */}
      {activeTab === 'script' && (
        <ScriptWorkspace
          videoId={video.id}
          videoStatus={video.status}
          onStatusChange={fetchVideoDetails}
        />
      )}

      {/* Tab 3: Thumbnail Management */}
      {activeTab === 'thumbnail' && (
        <ThumbnailWorkspace
          videoId={video.id}
          videoTitle={video.title}
          onStatusChange={fetchVideoDetails}
        />
      )}

      {/* Tab 4: Pinned Comment Management */}
      {activeTab === 'pinned-comment' && (
        <PinnedCommentWorkspace
          videoId={video.id}
          onStatusChange={fetchVideoDetails}
        />
      )}

      {/* Tab 5: Publishing Distribution Workspace */}
      {activeTab === 'publishing' && (
        <PublishingWorkspace
          video={video}
          onStatusChange={fetchVideoDetails}
        />
      )}

      {/* Task Assignment Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-4">
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
                  <option value="EDITING">Video Editing & Motion Graphics</option>
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
