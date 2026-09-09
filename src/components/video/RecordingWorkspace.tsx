import React, { useState, useEffect } from 'react';
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
  Save,
  FileQuestion,
} from 'lucide-react';
import { Video, Script, VideoProductionStatus, AssignmentTaskType } from '../../types';
import { apiClient } from '../../lib/api-client';
import { Button } from '../common/Button';
import { VideoStatusBadge } from '../common/StatusBadge';
import { PRIORITY_CONFIG } from '../../config/constants';

interface RecordingWorkspaceProps {
  videoId: string;
  video: Video;
  onStatusChange?: () => void;
}

export const RecordingWorkspace: React.FC<RecordingWorkspaceProps> = ({
  videoId,
  video,
  onStatusChange,
}) => {
  const [script, setScript] = useState<Script | null>(null);
  const [isLoadingScript, setIsLoadingScript] = useState<boolean>(true);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Notes state
  const [recordingNotes, setRecordingNotes] = useState<string>(video.notes || '');
  const [isSavingNotes, setIsSavingNotes] = useState<boolean>(false);

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
    setRecordingNotes(video.notes || '');
  }, [videoId, video]);

  const handleStatusTransition = async (nextStatus: VideoProductionStatus) => {
    setIsUpdating(true);
    setError(null);
    setSuccessMessage(null);
    try {
      await apiClient.updateVideoStatus(
        videoId,
        nextStatus,
        `Transitioned to ${nextStatus} via Recording Workspace`
      );
      setSuccessMessage(`Successfully transitioned recording status to ${nextStatus}.`);
      if (onStatusChange) {
        onStatusChange();
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to update video status.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSaveNotes = async () => {
    setIsSavingNotes(true);
    setError(null);
    try {
      await apiClient.updateVideoMetadata(videoId, {
        notes: recordingNotes,
      });
      setSuccessMessage('Recording notes saved successfully.');
      setTimeout(() => setSuccessMessage(null), 3000);
      if (onStatusChange) onStatusChange();
    } catch (err: any) {
      setError(err?.message || 'Failed to save recording notes.');
    } finally {
      setIsSavingNotes(false);
    }
  };

  const recordingAssignments = (video.assignments || []).filter(
    (a) => a.taskType === AssignmentTaskType.RECORDING || a.assignmentRole === 'SPEAKER' || a.assignmentRole === 'EDITOR'
  );

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

          <div className="flex items-center gap-2">
            {video.status === VideoProductionStatus.SCRIPT_READY && (
              <Button
                variant="primary"
                size="sm"
                disabled={isUpdating}
                onClick={() => handleStatusTransition(VideoProductionStatus.RECORDING)}
                className="text-xs"
                icon={Play}
              >
                Start Recording (RECORDING)
              </Button>
            )}

            {video.status === VideoProductionStatus.RECORDING && (
              <Button
                variant="primary"
                size="sm"
                disabled={isUpdating}
                onClick={() => handleStatusTransition(VideoProductionStatus.RECORDED)}
                className="text-xs"
                icon={CheckCircle2}
              >
                Mark Recorded (RECORDED)
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
              <FileQuestion className="w-3.5 h-3.5 text-indigo-500" /> Linked Question ID
            </span>
            <span className="font-mono font-bold text-slate-800">{video.questionId}</span>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/60 space-y-1">
            <span className="text-slate-400 font-medium flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-indigo-500" /> Scheduled Recording
            </span>
            <span className="font-medium text-slate-800">
              {video.scheduledRecordingDate ? new Date(video.scheduledRecordingDate).toLocaleDateString() : 'Not scheduled'}
            </span>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/60 space-y-1">
            <span className="text-slate-400 font-medium flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-indigo-500" /> Assigned Host / Speaker
            </span>
            <span className="font-medium text-slate-800">{video.assignedHost || 'Unassigned Host'}</span>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/60 space-y-1">
            <span className="text-slate-400 font-medium flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-indigo-500" /> Target Duration
            </span>
            <span className="font-mono font-medium text-slate-800">{video.targetDurationSeconds || 45} seconds</span>
          </div>
        </div>
      </div>

      {/* Main Content Grid: Approved Script & Recording Assignments */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Approved Script Teleprompter View */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-600" />
              <h3 className="text-sm font-bold text-slate-900">Approved Script (Teleprompter View)</h3>
            </div>
            {script && (
              <span className="font-mono text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded font-semibold border border-indigo-200">
                Version v{script.currentVersion}
              </span>
            )}
          </div>

          {isLoadingScript ? (
            <div className="py-12 text-center text-xs text-slate-400 font-mono">Loading approved script...</div>
          ) : script ? (
            <div className="space-y-4 text-xs">
              <div className="p-3.5 bg-indigo-50/40 border border-indigo-100 rounded-lg space-y-1">
                <span className="font-bold text-indigo-900 uppercase tracking-wider text-[10px]">Hook (0 - 5s)</span>
                <p className="text-slate-800 leading-relaxed font-medium">{script.hookText}</p>
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
                <span className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">Problem Statement (5 - 15s)</span>
                <p className="text-slate-800 leading-relaxed">{script.problemStatement}</p>
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
                <span className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">Step-by-Step Solution (15 - 35s)</span>
                <p className="text-slate-800 leading-relaxed whitespace-pre-wrap">{script.stepByStepSolution}</p>
              </div>

              <div className="p-3.5 bg-emerald-50/60 border border-emerald-200 rounded-lg space-y-1">
                <span className="font-bold text-emerald-900 uppercase tracking-wider text-[10px]">Speed Trick & Takeaway</span>
                <p className="text-emerald-950 leading-relaxed">{script.speedTrickOrTakeaway}</p>
              </div>

              <div className="p-3.5 bg-amber-50/60 border border-amber-200 rounded-lg space-y-1">
                <span className="font-bold text-amber-900 uppercase tracking-wider text-[10px]">Call to Action</span>
                <p className="text-amber-950 leading-relaxed">{script.callToAction}</p>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center bg-slate-50 rounded-lg border border-slate-200 text-slate-500 text-xs">
              No approved script found for this video yet. Please check the Script Workspace.
            </div>
          )}
        </div>

        {/* Right Col: Recording Assignments & Operational Notes */}
        <div className="space-y-6">
          {/* Recording Assignment Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900">Recording Assignment</h3>
              </div>
            </div>

            {recordingAssignments.length > 0 ? (
              <div className="space-y-2.5">
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
              <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 text-center text-xs text-slate-500">
                No recording task assigned yet. Use the assignments panel to assign recording staff.
              </div>
            )}
          </div>

          {/* Recording Operational Notes */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Mic className="w-4 h-4 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900">Recording Session Notes</h3>
              </div>
            </div>

            <div className="space-y-2.5 text-xs">
              <textarea
                rows={4}
                value={recordingNotes}
                onChange={(e) => setRecordingNotes(e.target.value)}
                placeholder="Log microphone settings, studio take notes, retake timestamps, or sound quality remarks..."
                className="w-full text-xs p-3 border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 text-slate-800"
              />
              <div className="flex justify-end">
                <Button
                  variant="primary"
                  size="sm"
                  disabled={isSavingNotes}
                  onClick={handleSaveNotes}
                  className="text-xs"
                  icon={Save}
                >
                  {isSavingNotes ? 'Saving...' : 'Save Notes'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
